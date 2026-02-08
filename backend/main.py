from pathlib import Path
from fastapi import FastAPI, File, UploadFile, HTTPException, Form, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
import tempfile
import shutil
import uuid
import subprocess
import time
import os
import threading

from analysis import analyze_file, separate_audio_full, separate_audio_stems, STEM_TYPES
from websocket_chords import websocket_chord_endpoint
from youtube import extract_audio, get_video_info, check_rate_limit, get_remaining_requests, extract_video_id

# Try to import madmom, but don't fail if it's not available
try:
    from chord_madmom import analyze_file_madmom, MADMOM_AVAILABLE
    if MADMOM_AVAILABLE:
        print("[Startup] ✓ madmom engine available - fast analysis enabled (~5-10s)")
    else:
        print("[Startup] ℹ madmom library not installed - using librosa engine (~1-3min)")
except ImportError:
    MADMOM_AVAILABLE = False
    print("[Startup] ℹ madmom module not found - using librosa engine only")

# --- NETWORK DIAGNOSTICS & PATCH ---
# --- NETWORK DIAGNOSTICS & PATCH ---
print("\n[DIAG] Starting Network Diagnostics (v1.9.4)...")
import socket
import httpx
import dns.resolver

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

# 2. Apply Monkey Patches
try:
    print("[DNS] 🛠️ Patching socket..." if DNS_BYPASS_POSSIBLE else "[DNS] ⚠️ Applying patch anyway...")
    
    _original_getaddrinfo = socket.getaddrinfo
    _original_gethostbyname = socket.gethostbyname

    def patched_getaddrinfo(host, port, family=0, type=0, proto=0, flags=0):
        try:
            try:
                socket.inet_aton(host)
                return _original_getaddrinfo(host, port, family, type, proto, flags)
            except:
                pass
            
            # Use dnspython
            answers = res.resolve(host, 'A')
            ip = answers[0].to_text()
            # print(f"[DNS Patch] Resolved {host} -> {ip}")
            return _original_getaddrinfo(ip, port, family, type, proto, flags)
        except Exception as e:
            return _original_getaddrinfo(host, port, family, type, proto, flags)

    def patched_gethostbyname(hostname):
        try:
            try:
                socket.inet_aton(hostname)
                return hostname
            except:
                pass
            answers = res.resolve(hostname, 'A')
            return answers[0].to_text()
        except:
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
# ---------------------------

from contextlib import asynccontextmanager

# Store separated audio files temporarily (in production, use S3/cloud storage)
# Format: { id: {"paths": [path1, path2], "timestamp": float} }
separated_files = {}

# Concurrency Control
# Limit max concurrent heavy analysis tasks to prevent OOM/CPU saturation
MAX_CONCURRENT_ANALYSIS = 2
analysis_semaphore = threading.Semaphore(MAX_CONCURRENT_ANALYSIS)

def cleanup_loop():
    """Background thread to clean up old files after 1 hour."""
    while True:
        try:
            now = time.time()
            to_delete = []
            for fid, info in separated_files.items():
                if now - info.get("timestamp", 0) > 3600: # 1 hour
                    to_delete.append(fid)
            
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
        time.sleep(600) # Run every 10 minutes

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Preload models on startup
    print("[Startup] Preloading models...")
    try:
        from analysis import _get_separator
        # This will load the model into memory
        _get_separator()
        print("[Startup] ✓ Models preloaded and ready")
    except Exception as e:
        print(f"[Startup] ⚠️ Model preload failed: {e}")
    
    # Start cleanup thread
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


@app.post("/api/analyze")
def analyze(file: UploadFile = File(...), separate_vocals: bool = Form(False), use_madmom: bool = Form(True)):
    """Analyze audio file for chords.
    
    Args:
        file: Audio file to analyze
        separate_vocals: If True, separate vocals before analysis for better accuracy (slower)
        use_madmom: If True, use fast madmom engine. If False, use librosa (detailed analysis)
    """
    print(f"Received analysis request for file: {file.filename} (separate_vocals={separate_vocals}, use_madmom={use_madmom})")
    
    # Acquire semaphore (queueing if busy)
    with analysis_semaphore:
        try:
            if not file.filename:
                raise HTTPException(status_code=400, detail="File required")

            suffix = Path(file.filename).suffix or ".tmp"

            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                shutil.copyfileobj(file.file, tmp)
                tmp_path = Path(tmp.name)
        
            try:
                # The 'use_madmom' flag is the primary engine selector (Fast vs Detailed)
                if not use_madmom:
                    # User wants MORE ACCURATE -> Force Librosa
                    print(f"[API] Engine: LIBROSA (More Accurate) | Vocal Filter: {separate_vocals}")
                    result = analyze_file(tmp_path, separate_vocals=separate_vocals)
                elif separate_vocals:
                    # Vocal Filter requested -> Currently handled by our high-precision Librosa pipeline
                    print("[API] Engine: LIBROSA (Vocal Filter enabled) | Choice: FAST (Requested)")
                    result = analyze_file(tmp_path, separate_vocals=True)
                elif MADMOM_AVAILABLE:
                    # FAST -> Madmom
                    print("[API] Engine: MADMOM (Fast) | Vocal Filter: OFF")
                    result = analyze_file_madmom(tmp_path)
                else:
                    # Fallback
                    print("[API] Engine: LIBROSA (Fallback) | Madmom not found")
                    result = analyze_file(tmp_path, separate_vocals=False)
                
                # If vocal separation was used, store the instrumental file and return its URL
                if "instrumentalPath" in result:
                    file_id = str(uuid.uuid4())
                    path = result["instrumentalPath"]
                    separated_files[file_id] = {
                        "paths": [path],
                        "timestamp": time.time(),
                        "type": "analysis"
                    }
                    result["instrumentalUrl"] = f"/api/analyze/download/{file_id}/instrumental.wav"
                    print(f"Stored instrumental file with ID: {file_id}, URL: {result['instrumentalUrl']}")
                    del result["instrumentalPath"]  # Remove the local path from response
                
                print(f"Returning result with keys: {result.keys()}")
                return JSONResponse(result)
            except Exception as exc: 
                print(f"[API] Analysis failed: {exc}")
                raise HTTPException(status_code=500, detail=f"Analysis failed: {exc}")
        finally:
            try:
                if 'tmp_path' in locals():
                    tmp_path.unlink(missing_ok=True)
            except Exception:
                pass


@app.post("/api/analyze-youtube")
def analyze_youtube(
    url: str = Form(...),
    separate_vocals: bool = Form(False),
    use_madmom: bool = Form(True),
    client_ip: str = Form("unknown"),
):
    """Analyze YouTube video for chords.
    
    Args:
        url: YouTube video URL
        separate_vocals: If True, separate vocals before analysis (slower, more accurate)
        use_madmom: If True, use fast madmom engine. If False, use librosa.
        client_ip: Client IP for rate limiting
    
    Returns:
        Video metadata + chord analysis result
    """
    print(f"[YouTube] Received request for URL: {url}")
    
    # Rate limiting check
    if not check_rate_limit(client_ip):
        remaining = get_remaining_requests(client_ip)
        raise HTTPException(
            status_code=429, 
            detail=f"Rate limit exceeded. Maximum 5 YouTube analyses per hour. Remaining: {remaining}"
        )
    
    # Validate URL
    video_id = extract_video_id(url)
    if not video_id:
        raise HTTPException(status_code=400, detail="Invalid YouTube URL")
    
    # Acquire semaphore (queueing if busy)
    with analysis_semaphore:
        try:
            # Extract audio from YouTube
            print(f"[YouTube] Extracting audio for video: {video_id}")
            audio_info = extract_audio(url)
            audio_path = Path(audio_info['audio_path'])
            
            if not audio_path.exists():
                raise HTTPException(status_code=500, detail="Failed to download audio")
            
            print(f"[YouTube] Audio extracted: {audio_path} (cached: {audio_info.get('cached', False)})")
            
            # Analyze the audio
            print(f"[YouTube] Starting analysis (madmom={use_madmom}, vocals={separate_vocals})")
            if not use_madmom:
                result = analyze_file(audio_path, separate_vocals=separate_vocals)
            elif separate_vocals:
                result = analyze_file(audio_path, separate_vocals=True)
            elif MADMOM_AVAILABLE:
                result = analyze_file_madmom(audio_path)
            else:
                result = analyze_file(audio_path, separate_vocals=False)
            
            # Handle instrumental file if vocal separation was used
            if "instrumentalPath" in result:
                file_id = str(uuid.uuid4())
                path = result["instrumentalPath"]
                separated_files[file_id] = {
                    "paths": [path],
                    "timestamp": time.time(),
                    "type": "youtube_analysis"
                }
                result["instrumentalUrl"] = f"/api/analyze/download/{file_id}/instrumental.wav"
                del result["instrumentalPath"]
                
            # Register the original audio file for download (for waveform visualization)
            audio_id = str(uuid.uuid4())
            separated_files[audio_id] = {
                "paths": [str(audio_path)],
                "timestamp": time.time(),
                "type": "youtube_audio"
            }
            result["audioUrl"] = f"/api/analyze/download/{audio_id}/original.mp3"
            
            # Add YouTube video metadata
            result["youtube"] = {
                "videoId": audio_info['video_id'],
                "title": audio_info['title'],
                "duration": audio_info['duration'],
                "thumbnail": audio_info['thumbnail'],
                "channel": audio_info.get('channel', 'Unknown'),
            }
            result["remainingRequests"] = get_remaining_requests(client_ip)
            
            print(f"[YouTube] Analysis complete for: {audio_info['title']}")
            return JSONResponse(result)
            
        except HTTPException:
            raise
        except Exception as exc:
            print(f"[YouTube] Analysis failed: {exc}")
            raise HTTPException(status_code=500, detail=f"YouTube analysis failed: {exc}")


@app.get("/api/youtube/info")
def youtube_info(url: str):
    """Get YouTube video info without downloading.
    
    Args:
        url: YouTube video URL
    
    Returns:
        Video metadata (title, duration, thumbnail, channel)
    """
    try:
        info = get_video_info(url)
        return JSONResponse(info)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get video info: {e}")


@app.post("/api/separate")
def separate_audio(
    file: UploadFile = File(...),
    format: str = Form("wav"),
):
    """Separate vocals and instrumentals from audio file.

    Args:
        file: Audio file upload
        format: Output container for stems. Supported: "wav" (default), "mp3".

    Notes:
        - MP3 is smaller and typically faster to transfer to the browser.
        - WAV is lossless but larger.
    """
    print(f"Received separation request for file: {file.filename} (format={format})")
    if not file.filename:
        raise HTTPException(status_code=400, detail="File required")

    format = (format or "wav").lower().strip()
    if format not in {"wav", "mp3"}:
        raise HTTPException(status_code=400, detail="Invalid format. Use 'wav' or 'mp3'.")

    suffix = Path(file.filename).suffix or ".tmp"
    
    # Acquire semaphore (queueing if busy)
    with analysis_semaphore:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = Path(tmp.name)

        try:
            # Perform full separation (writes WAV stems)
            # Note: Analysis.py now handles truncation internally using librosa
            print(f"Starting separation for {file.filename}...")
            result = separate_audio_full(tmp_path)

            if not result:
                raise HTTPException(status_code=500, detail="Separation failed - model error")

            print("Separation finished, starting transcoding...")
            session_id = str(uuid.uuid4())

            vocals_path = Path(result["vocals"])
            instrumental_path = Path(result["instrumental"])

            # Optionally transcode to MP3 for faster downloads
            if format == "mp3":
                def to_mp3(src: Path) -> Path:
                    dst = src.with_suffix(".mp3")
                    # 192k is a good quality/size tradeoff; adjust if needed
                    subprocess.run(
                        [
                            "ffmpeg",
                            "-y",
                            "-i",
                            str(src),
                            "-codec:a",
                            "libmp3lame",
                            "-b:a",
                            "192k",
                            str(dst),
                        ],
                        check=True,
                        stdout=subprocess.DEVNULL,
                        stderr=subprocess.DEVNULL,
                    )
                    return dst

                try:
                    vocals_path = to_mp3(vocals_path)
                    instrumental_path = to_mp3(instrumental_path)
                except subprocess.CalledProcessError as e:
                    # Fallback to WAV if MP3 conversion fails
                    print(f"MP3 conversion failed, falling back to WAV: {e}")
                    format = "wav"
                except FileNotFoundError:
                    # ffmpeg not installed
                    print("ffmpeg not found, falling back to WAV format")
                    format = "wav"

            # Store paths temporarily
            separated_files[session_id] = {
                "vocals": str(vocals_path),
                "instrumental": str(instrumental_path),
                "paths": [str(vocals_path), str(instrumental_path)],
                "format": format,
                "timestamp": time.time(),
                "type": "separation"
            }

            return JSONResponse(
                {
                    "session_id": session_id,
                    "format": format,
                    "vocalsUrl": f"/api/separate/download/{session_id}/vocals?format={format}",
                    "instrumentalUrl": f"/api/separate/download/{session_id}/instrumental?format={format}",
                }
            )
        except Exception as exc:
            print(f"Separation error: {exc}")
            import traceback
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"Separation failed: {str(exc)}")
        finally:
            # Clean up original upload
            try:
                tmp_path.unlink(missing_ok=True)
            except Exception:
                pass


@app.post("/api/separate-stems")
def separate_audio_6stems(
    file: UploadFile = File(...),
    format: str = Form("wav"),
):
    """Separate audio into 6 stems: vocals, drums, bass, guitar, piano, other.

    Uses the htdemucs_6s model for high-quality 6-stem separation.

    Args:
        file: Audio file upload
        format: Output container for stems. Supported: "wav" (default), "mp3".

    Returns:
        JSON with session_id and URLs for each stem download.
        
    Notes:
        - Processing takes 5-10 minutes for a 3-minute song on CPU.
        - MP3 is smaller and faster to transfer.
        - WAV is lossless but larger.
    """
    print(f"Received 6-stem separation request for file: {file.filename} (format={format})")
    if not file.filename:
        raise HTTPException(status_code=400, detail="File required")

    format = (format or "wav").lower().strip()
    if format not in {"wav", "mp3"}:
        raise HTTPException(status_code=400, detail="Invalid format. Use 'wav' or 'mp3'.")

    suffix = Path(file.filename).suffix or ".tmp"
    
    # Acquire semaphore (queueing if busy)
    with analysis_semaphore:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = Path(tmp.name)

        try:
            print(f"Starting 6-stem separation for {file.filename}...")
            result = separate_audio_stems(tmp_path)

            if not result:
                raise HTTPException(status_code=500, detail="6-stem separation failed - model error")

            print("6-stem separation finished, starting transcoding...")
            session_id = str(uuid.uuid4())

            stem_data = {}
            all_paths = []
            
            for stem_name, stem_path in result.items():
                stem_path = Path(stem_path)
                
                # Optionally transcode to MP3
                if format == "mp3":
                    try:
                        mp3_path = stem_path.with_suffix(".mp3")
                        subprocess.run(
                            [
                                "ffmpeg",
                                "-y",
                                "-i",
                                str(stem_path),
                                "-codec:a",
                                "libmp3lame",
                                "-b:a",
                                "192k",
                                "-loglevel", "quiet", # fix: suppress ffmpeg output which might clutter logs or cause issues
                                str(mp3_path),
                            ],
                            check=True,
                            stdout=subprocess.DEVNULL,
                            stderr=subprocess.DEVNULL,
                        )
                        stem_path = mp3_path
                    except (subprocess.CalledProcessError, FileNotFoundError) as e:
                        print(f"MP3 conversion failed for {stem_name}, keeping WAV: {e}")
                
                stem_data[stem_name] = str(stem_path)
                all_paths.append(str(stem_path))

            # Store paths temporarily
            separated_files[session_id] = {
                **stem_data,
                "paths": all_paths,
                "format": format,
                "timestamp": time.time(),
                "type": "6stem-separation"
            }

            # Build response with download URLs for each stem
            stem_urls = {}
            for stem_name in STEM_TYPES:
                if stem_name in stem_data:
                    stem_urls[f"{stem_name}Url"] = f"/api/separate-stems/download/{session_id}/{stem_name}?format={format}"

            return JSONResponse(
                {
                    "session_id": session_id,
                    "format": format,
                    "stems": list(stem_data.keys()),
                    **stem_urls,
                }
            )
        except Exception as exc:
            print(f"6-stem separation error: {exc}")
            import traceback
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"6-stem separation failed: {str(exc)}")
        finally:
            # Clean up original upload
            try:
                tmp_path.unlink(missing_ok=True)
            except Exception:
                pass


@app.get("/api/separate-stems/download/{session_id}/{stem_type}")
async def download_stem(session_id: str, stem_type: str, format: str = "wav"):
    """Download a specific stem from 6-stem separation.

    Args:
        session_id: Separation session
        stem_type: One of: vocals, drums, bass, guitar, piano, other
        format: "wav" or "mp3" (should match what was requested during /api/separate-stems)
    """
    if session_id not in separated_files:
        raise HTTPException(status_code=404, detail="Session not found")

    if stem_type not in STEM_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid stem type. Must be one of: {', '.join(STEM_TYPES)}")

    stored = separated_files[session_id]
    
    if stem_type not in stored:
        raise HTTPException(status_code=404, detail=f"Stem '{stem_type}' not found in this session")
    
    file_path = Path(stored[stem_type])

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File no longer available")

    ext = file_path.suffix.lower()
    if ext == ".mp3":
        media_type = "audio/mpeg"
        filename = f"{stem_type}.mp3"
    else:
        media_type = "audio/wav"
        filename = f"{stem_type}.wav"

    return FileResponse(file_path, media_type=media_type, filename=filename)


@app.get("/api/analyze/download/{file_id}/{filename}")
async def download_instrumental(file_id: str, filename: str):
    """Download instrumental track from chord analysis.
    
    Args:
        file_id: File ID from analysis response
        filename: Filename (for browser download naming)
    """
    if file_id not in separated_files:
        raise HTTPException(status_code=404, detail="File not found")
    
    info = separated_files[file_id]
    file_path = Path(info["paths"][0])
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File no longer available")
    
    return FileResponse(file_path, media_type="audio/wav", filename=filename)


@app.get("/api/separate/download/{session_id}/{track_type}")
async def download_separated(session_id: str, track_type: str, format: str = "wav"):
    """Download separated audio track.

    Args:
        session_id: Separation session
        track_type: "vocals" or "instrumental"
        format: "wav" or "mp3" (should match what was requested during /api/separate)
    """
    if session_id not in separated_files:
        raise HTTPException(status_code=404, detail="Session not found")

    if track_type not in ["vocals", "instrumental"]:
        raise HTTPException(status_code=400, detail="Invalid track type")

    stored = separated_files[session_id]
    file_path = Path(stored[track_type])

    # If client requests a format that doesn't match stored, just serve what we have.
    # (Prevents 404s if someone tweaks the query string.)
    ext = file_path.suffix.lower()
    if ext == ".mp3":
        media_type = "audio/mpeg"
        filename = f"{track_type}.mp3"
    else:
        media_type = "audio/wav"
        filename = f"{track_type}.wav"

    return FileResponse(file_path, media_type=media_type, filename=filename)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.websocket("/ws/chords/{client_id}")
async def websocket_chords(websocket: WebSocket, client_id: str):
    """WebSocket endpoint for real-time chord detection.
    
    Send audio chunks as base64 PCM and receive chord detections.
    """
    await websocket_chord_endpoint(websocket, client_id)

if __name__ == "__main__":
    import uvicorn
    import os
    # Hugging Face Spaces uses port 7860 by default
    port = int(os.environ.get("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)
