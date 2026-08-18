"""
backend/main.py

FastAPI server for the Guitariz Chord AI backend.

Endpoints:
  POST /api/analyze         — Full file upload → JSON response
  POST /api/analyze-stream  — Streaming NDJSON response (progressive chords)
  GET  /api/health          — Health check
  GET  /api/analyze/download/{id}/{filename} — Serve separated audio files
  WS   /ws/chords           — Real-time microphone chord detection

Deployed on HuggingFace Spaces (Docker, port 7860).
"""
import logging
import os
import shutil
import socket
import subprocess
import tempfile
import threading
import time
import uuid
from contextlib import asynccontextmanager
from pathlib import Path

import dns.resolver
import httpx
import uvicorn
from analysis import STEM_TYPES, analyze_file, separate_audio_full, separate_audio_stems
from fastapi import FastAPI, File, Form, HTTPException, UploadFile, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from websocket_chords import websocket_chord_endpoint
from youtube import (
    check_rate_limit,
    extract_audio,
    extract_video_id,
    get_remaining_requests,
    get_video_info,
)

# Try to import custom fast ONNX engine, but don't fail if it's not available
try:
    from chord_fast import FAST_ENGINE_AVAILABLE, FAST_ENGINE_ERROR, analyze_file_fast
    if FAST_ENGINE_AVAILABLE:
        print("[Startup] ✓ Custom ONNX fast engine available - fast analysis enabled (~5-10s)", flush=True)
    else:
        print(f"[Startup] ℹ Custom ONNX fast engine not installed - using legacy librosa engine (~1-3min) | Error: {FAST_ENGINE_ERROR}", flush=True)
except Exception as e:
    FAST_ENGINE_AVAILABLE = False
    FAST_ENGINE_ERROR = f"Failed to import chord_fast module: {e}"
    print(f"[Startup] ℹ Custom ONNX fast engine module not found - using legacy librosa engine only | Error: {e}", flush=True)

# Try to import precise analysis module
try:
    from chord_precise import analyze_file_precise
    print("[Startup] ✓ Precise chord analysis engine available", flush=True)
except Exception as e:
    try:
        from backend.chord_precise import analyze_file_precise
        print("[Startup] ✓ Precise chord analysis engine available (via package)", flush=True)
    except Exception as e2:
        analyze_file_precise = None
        print(f"[Startup] ℹ Precise chord analysis engine not available | Error: {e} | {e2}", flush=True)


class QuietScanFilter(logging.Filter):
    """Filters out noisy 404 access logs from scanner bots."""
    def filter(self, record: logging.LogRecord) -> bool:
        msg = record.getMessage()
        if " 404 " in msg or "404 Not Found" in msg:
            return False
        if record.args:
            for arg in record.args:
                if str(arg) == "404":
                    return False
        return True

logging.getLogger("uvicorn.access").addFilter(QuietScanFilter())

# --- NETWORK DIAGNOSTICS & PATCH ---
print("\n[DIAG] Starting Network Diagnostics (v1.9.4)...")

# 1. Test Upstream DNS (Google) directly
try:
    print("[DIAG] Testing direct query to 8.8.8.8...")
    res = dns.resolver.Resolver()
    res.nameservers = ['8.8.8.8', '8.8.4.4']
    ans = res.resolve('www.youtube.com', 'A')
    print(f"[DIAG] ✓ dnspython Success: {ans[0].to_text()}")
    DNS_BYPASS_POSSIBLE = True
except Exception as e:
    print(f"[DIAG] ❌ dnspython FAILED: {e}")
    DNS_BYPASS_POSSIBLE = False

# 2. Monkey-patch socket DNS for YouTube domains
_original_getaddrinfo = socket.getaddrinfo
_original_gethostbyname = socket.gethostbyname

try:
    if DNS_BYPASS_POSSIBLE:
        def patched_getaddrinfo(host, port, family=0, type=0, proto=0, flags=0):
            yt_domains = {"www.youtube.com", "youtube.com", "music.youtube.com",
                          "manifest.googlevideo.com", "rr1.googlevideo.com"}
            if host in yt_domains:
                try:
                    answers = res.resolve(host, 'A')
                    ip = answers[0].to_text()
                    return [(socket.AF_INET, socket.SOCK_STREAM, 6, '', (ip, port or 443))]
                except Exception:
                    pass
            return _original_getaddrinfo(host, port, family, type, proto, flags)

        def patched_gethostbyname(hostname):
            if hostname in {"www.youtube.com", "youtube.com", "music.youtube.com"}:
                try:
                    answers = res.resolve(hostname, 'A')
                    return answers[0].to_text()
                except Exception:
                    pass
            return _original_gethostbyname(hostname)

        socket.getaddrinfo = patched_getaddrinfo
        socket.gethostbyname = patched_gethostbyname
        print("[DNS] ✓ Patches applied to getaddrinfo and gethostbyname.")
except Exception as e:
    print(f"[DIAG] ❌ Patching Failed: {e}")

# 3. Verify Patches
try:
    target = "www.youtube.com"
    print(f"[DIAG] Testing socket.gethostbyname('{target}')...")
    ip = socket.gethostbyname(target)
    print(f"[DIAG] ✓ gethostbyname Result: {ip}")
except Exception as e:
    print(f"[DIAG] ❌ gethostbyname FAILED: {e}")

try:
    target = "www.youtube.com"
    print(f"[DIAG] Testing httpx.get('https://{target}')...")
    response = httpx.get(f"https://{target}", timeout=10.0, follow_redirects=True)
    print(f"[DIAG] ✓ HTTPS Result: {response.status_code}")
except Exception as e:
    print(f"[DIAG] ❌ HTTPS FAILED: {e}")

print("[DIAG] Diagnostics complete.\n")

# ── State management ────────────────────────────────────────────────────────

# Store separated audio files temporarily (in production, use S3/cloud storage)
separated_files: dict[str, dict] = {}

# Concurrency Control
MAX_CONCURRENT_SEPARATION = 1
separation_semaphore = threading.Semaphore(MAX_CONCURRENT_SEPARATION)
MAX_CONCURRENT_CHORDS = 3
chord_semaphore = threading.Semaphore(MAX_CONCURRENT_CHORDS)


def cleanup_loop():
    """Background thread to clean up old files after 1 hour."""
    while True:
        try:
            now = time.time()
            to_delete = [fid for fid, info in separated_files.items()
                         if now - info.get("timestamp", 0) > 3600]
            for fid in to_delete:
                info = separated_files.pop(fid, {})
                for p in info.get("paths", []):
                    try:
                        path = Path(p)
                        if path.exists():
                            path.unlink()
                            print(f"[Cleanup] Deleted expired file: {path}")
                    except Exception as e:
                        print(f"[Cleanup] Error deleting {p}: {e}")
        except Exception as e:
            print(f"[Cleanup] Error in loop: {e}")
        time.sleep(600)


# ── App lifecycle ───────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[Startup] Preloading models...")
    try:
        from analysis import _get_separator, _get_separator_6stem
        _get_separator()
        _get_separator_6stem()
        print("[Startup] ✓ Models preloaded and ready")
    except Exception as e:
        print(f"[Startup] ⚠️ Model preload failed: {e}")

    thread = threading.Thread(target=cleanup_loop, daemon=True)
    thread.start()
    print("[Startup] ✓ Cleanup thread started")
    yield


app = FastAPI(title="Chord AI Backend", version="1.3.4", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health check ────────────────────────────────────────────────────────────

@app.get("/api/health")
def health():
    """Health check endpoint for cold-start detection."""
    return {
        "status": "ok",
        "fast_engine": FAST_ENGINE_AVAILABLE,
        "precise_engine": analyze_file_precise is not None,
        "version": "1.3.4",
    }


# ── Chord analysis endpoints ───────────────────────────────────────────────

@app.post("/api/analyze")
def analyze(
    file: UploadFile = File(...),
    separate_vocals: bool = Form(False),
    use_madmom: bool = Form(True),
    mode: str = Form("fast"),
):
    """Analyze audio file for chords, key, tempo, and meter."""
    resolved_mode = mode
    if not use_madmom and mode == "fast" or mode == "accurate":
        resolved_mode = "balanced"

    print(f"Received analysis request for file: {file.filename} (separate_vocals={separate_vocals}, mode={resolved_mode})")

    is_heavy = separate_vocals or resolved_mode == "precise"
    active_semaphore = separation_semaphore if is_heavy else chord_semaphore

    with active_semaphore:
        try:
            if not file.filename:
                raise HTTPException(status_code=400, detail="File required")

            suffix = Path(file.filename).suffix or ".tmp"
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                shutil.copyfileobj(file.file, tmp)
                tmp_path = Path(tmp.name)

            try:
                if resolved_mode == "precise":
                    if analyze_file_precise is not None:
                        print("[API] Running PRECISE mode (Deep 5-stage pipeline)")
                        result = analyze_file_precise(tmp_path, separate_vocals=separate_vocals)
                    else:
                        print("[API] Precise engine not available, falling back to BALANCED mode")
                        result = analyze_file(tmp_path, separate_vocals=separate_vocals)
                elif resolved_mode == "balanced":
                    print(f"[API] Running BALANCED mode (Librosa DSP pipeline) | Vocal Filter: {separate_vocals}")
                    result = analyze_file(tmp_path, separate_vocals=separate_vocals)
                else:
                    # Fast mode (Custom ONNX)
                    if FAST_ENGINE_AVAILABLE:
                        if separate_vocals:
                            print("[API] Running FAST mode with vocal separation...")
                            separated = separate_audio_full(tmp_path)
                            if separated and separated.get("instrumental"):
                                instr_path = separated["instrumental"]
                                result = analyze_file_fast(instr_path, mode="fast")
                                result["instrumentalPath"] = instr_path
                            else:
                                print("[API] Vocal separation failed, using original audio")
                                result = analyze_file_fast(tmp_path, mode="fast")
                        else:
                            print("[API] Running FAST mode (Custom ONNX) | Vocal Filter: OFF")
                            result = analyze_file_fast(tmp_path, mode="fast")
                    else:
                        print("[API] Fast engine not available, falling back to BALANCED mode")
                        result = analyze_file(tmp_path, separate_vocals=separate_vocals)

                # Store instrumental file if vocal separation was used
                if "instrumentalPath" in result:
                    file_id = str(uuid.uuid4())
                    path = result["instrumentalPath"]
                    separated_files[file_id] = {
                        "paths": [path],
                        "timestamp": time.time(),
                        "type": "analysis",
                    }
                    result["instrumentalUrl"] = f"/api/analyze/download/{file_id}/instrumental.wav"
                    print(f"Stored instrumental file with ID: {file_id}")
                    del result["instrumentalPath"]

                print(f"Returning result with keys: {result.keys()}")
                return JSONResponse(result)
            except Exception as e:
                print(f"[API] Analysis failed: {e}")
                import traceback
                traceback.print_exc()
                raise HTTPException(status_code=500, detail=f"Analysis failed: {e}")
        finally:
            try:
                if 'tmp_path' in locals():
                    tmp_path.unlink(missing_ok=True)
            except Exception:
                pass


@app.post("/api/analyze-stream")
def analyze_stream(
    file: UploadFile = File(...),
    separate_vocals: bool = Form(False),
    use_madmom: bool = Form(True),
    mode: str = Form("fast"),
):
    """Analyze audio and stream chords back in NDJSON chunks."""
    import json
    import math

    resolved_mode = mode
    if not use_madmom and mode == "fast" or mode == "accurate":
        resolved_mode = "balanced"

    print(f"Received streaming request for file: {file.filename} (mode={resolved_mode})")

    is_heavy = separate_vocals or resolved_mode == "precise"
    active_semaphore = separation_semaphore if is_heavy else chord_semaphore

    try:
        if not file.filename:
            raise HTTPException(status_code=400, detail="File required")

        suffix = Path(file.filename).suffix or ".tmp"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = Path(tmp.name)

        def ndjson_generator():
            with active_semaphore:
                try:
                    if resolved_mode == "precise" and analyze_file_precise is not None:
                        import queue
                        q = queue.Queue()

                        def run_precise():
                            try:
                                res = analyze_file_precise(
                                    tmp_path,
                                    separate_vocals=separate_vocals,
                                    progress_cb=lambda stage, msg, pct: q.put({
                                        "type": "progress", "stage": stage,
                                        "message": msg, "percent": pct,
                                    }),
                                )
                                q.put({"type": "result", "result": res})
                            except Exception as inner_err:
                                q.put({"type": "error", "detail": str(inner_err)})

                        t_thread = threading.Thread(target=run_precise)
                        t_thread.start()

                        result = None
                        while True:
                            item = q.get()
                            if item["type"] == "progress":
                                yield json.dumps(item) + "\n"
                            elif item["type"] == "result":
                                result = item["result"]
                                break
                            elif item["type"] == "error":
                                raise Exception(item["detail"])
                    else:
                        # Fast or Balanced mode
                        if resolved_mode == "balanced":
                            result = analyze_file(tmp_path, separate_vocals=separate_vocals)
                        else:
                            if FAST_ENGINE_AVAILABLE:
                                if separate_vocals:
                                    separated = separate_audio_full(tmp_path)
                                    if separated and separated.get("instrumental"):
                                        result = analyze_file_fast(separated["instrumental"], mode="fast")
                                        result["instrumentalPath"] = separated["instrumental"]
                                    else:
                                        result = analyze_file_fast(tmp_path, mode="fast")
                                else:
                                    result = analyze_file_fast(tmp_path, mode="fast")
                            else:
                                result = analyze_file(tmp_path, separate_vocals=separate_vocals)

                    # Handle instrumental file
                    instrumental_url = None
                    if "instrumentalPath" in result:
                        file_id = str(uuid.uuid4())
                        path = result["instrumentalPath"]
                        separated_files[file_id] = {
                            "paths": [path], "timestamp": time.time(), "type": "analysis",
                        }
                        instrumental_url = f"/api/analyze/download/{file_id}/instrumental.wav"

                    # Yield metadata
                    metadata = {
                        "type": "metadata",
                        "tempo": result.get("tempo", 120),
                        "meter": result.get("meter", 4),
                        "key": result.get("key", "C"),
                        "scale": result.get("scale", "major"),
                    }
                    if instrumental_url:
                        metadata["instrumentalUrl"] = instrumental_url
                    yield json.dumps(metadata) + "\n"

                    # Yield chords in 30-second chunks
                    chords = result.get("chords", [])
                    simple_chords = result.get("simpleChords", chords)
                    duration = max((c["end"] for c in chords), default=0)

                    chunk_size_sec = 30.0
                    if duration <= 0:
                        yield json.dumps({
                            "type": "chords", "start": 0, "end": 0,
                            "chords": chords, "simpleChords": simple_chords,
                        }) + "\n"
                        return

                    num_chunks = int(math.ceil(duration / chunk_size_sec))
                    for i in range(num_chunks):
                        c_start = i * chunk_size_sec
                        c_end = (i + 1) * chunk_size_sec
                        chunk_chords = [c for c in chords if c["end"] > c_start and c["start"] < c_end]
                        chunk_simple = [c for c in simple_chords if c["end"] > c_start and c["start"] < c_end]
                        yield json.dumps({
                            "type": "chords", "start": c_start, "end": c_end,
                            "chords": chunk_chords, "simpleChords": chunk_simple,
                        }) + "\n"

                except Exception as e:
                    yield json.dumps({"type": "error", "detail": str(e)}) + "\n"
                finally:
                    try:
                        tmp_path.unlink(missing_ok=True)
                    except Exception:
                        pass

        return StreamingResponse(ndjson_generator(), media_type="application/x-ndjson")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── File download ───────────────────────────────────────────────────────────

@app.get("/api/analyze/download/{file_id}/{filename}")
def download_file(file_id: str, filename: str):
    """Serve separated audio files."""
    if file_id not in separated_files:
        raise HTTPException(status_code=404, detail="File not found or expired")

    info = separated_files[file_id]
    paths = info.get("paths", [])

    for p in paths:
        if Path(p).exists():
            return FileResponse(
                path=p,
                media_type="audio/wav",
                filename=filename,
            )

    raise HTTPException(status_code=404, detail="File no longer available")


# ── Stem separation endpoints ──────────────────────────────────────────────

@app.post("/api/separate")
def separate(
    file: UploadFile = File(...),
    stems: str = Form("4"),
):
    """Separate audio into stems (4-stem or 6-stem)."""
    with separation_semaphore:
        try:
            suffix = Path(file.filename).suffix or ".tmp"
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                shutil.copyfileobj(file.file, tmp)
                tmp_path = Path(tmp.name)

            if stems == "6":
                result = separate_audio_stems(tmp_path)
            else:
                result = separate_audio_full(tmp_path)

            if not result:
                raise HTTPException(status_code=500, detail="Separation failed")

            file_id = str(uuid.uuid4())
            all_paths = list(result.values())
            separated_files[file_id] = {
                "paths": all_paths,
                "timestamp": time.time(),
                "type": "separation",
            }

            urls = {}
            for stem_name, stem_path in result.items():
                urls[stem_name] = f"/api/analyze/download/{file_id}/{stem_name}.wav"

            return JSONResponse({"id": file_id, "stems": urls})
        finally:
            try:
                if 'tmp_path' in locals():
                    tmp_path.unlink(missing_ok=True)
            except Exception:
                pass


# ── YouTube endpoints ───────────────────────────────────────────────────────

@app.post("/api/youtube/analyze")
def youtube_analyze(
    url: str = Form(...),
    separate_vocals: bool = Form(False),
    mode: str = Form("fast"),
):
    """Analyze a YouTube video's audio."""
    video_id = extract_video_id(url)
    if not video_id:
        raise HTTPException(status_code=400, detail="Invalid YouTube URL")

    if not check_rate_limit(video_id):
        remaining = get_remaining_requests()
        raise HTTPException(status_code=429, detail=f"Rate limit exceeded. {remaining} requests remaining.")

    try:
        audio_path = extract_audio(url)
        if not audio_path:
            raise HTTPException(status_code=500, detail="Failed to extract audio from YouTube")

        tmp_path = Path(audio_path)

        if FAST_ENGINE_AVAILABLE and mode == "fast":
            result = analyze_file_fast(tmp_path, mode="fast")
        else:
            result = analyze_file(tmp_path, separate_vocals=separate_vocals)

        # Add video info
        info = get_video_info(url)
        if info:
            result["videoTitle"] = info.get("title", "")
            result["videoDuration"] = info.get("duration", 0)

        return JSONResponse(result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"YouTube analysis failed: {e}")
    finally:
        try:
            if 'tmp_path' in locals():
                tmp_path.unlink(missing_ok=True)
        except Exception:
            pass


@app.get("/api/youtube/info")
def youtube_info(url: str):
    """Get YouTube video info without downloading."""
    video_id = extract_video_id(url)
    if not video_id:
        raise HTTPException(status_code=400, detail="Invalid YouTube URL")

    info = get_video_info(url)
    if not info:
        raise HTTPException(status_code=404, detail="Video not found")

    return JSONResponse(info)


# ── WebSocket ───────────────────────────────────────────────────────────────

@app.websocket("/ws/chords")
async def ws_chords(websocket: WebSocket):
    """WebSocket endpoint for real-time microphone chord detection."""
    await websocket_chord_endpoint(websocket)


# ── Entry point ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 7860))
    print(f"\n[Main] Starting Chord AI Backend on port {port}...")
    uvicorn.run(app, host="0.0.0.0", port=port)
