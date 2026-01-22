from pathlib import Path
from fastapi import FastAPI, File, UploadFile, HTTPException, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
import tempfile
import shutil
import uuid
import subprocess
import time
import os
import threading

from analysis import analyze_file, separate_audio_full

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

from contextlib import asynccontextmanager

# Store separated audio files temporarily (in production, use S3/cloud storage)
# Format: { id: {"paths": [path1, path2], "timestamp": float} }
separated_files = {}

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

app = FastAPI(title="Chord AI Backend", version="1.3.0", lifespan=lifespan)

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
        use_madmom: If True, use fast madmom engine (~5-10s). If False, use librosa (slower but works with vocal separation)
    """
    print(f"Received analysis request for file: {file.filename} (separate_vocals={separate_vocals}, use_madmom={use_madmom})")
    if not file.filename:
        raise HTTPException(status_code=400, detail="File required")

    suffix = Path(file.filename).suffix or ".tmp"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = Path(tmp.name)

    try:
        # Check audio duration and loading are now handled robustly within analysis.py 
        # using librosa.load(duration=300) to ensure CPU processing doesn't hang.
        # This also bypasses Windows-specific ffmpeg binary issues for basic loading.

        if separate_vocals:
            print("[API] Vocal separation requested - using librosa engine")
            result = analyze_file(tmp_path, separate_vocals=True)
        elif use_madmom and MADMOM_AVAILABLE:
            # Use madmom engine for fast analysis (no vocal separation)
            print("[API] Using madmom engine (fast analysis)")
            result = analyze_file_madmom(tmp_path)
        else:
            # Fall back to librosa engine
            if use_madmom and not MADMOM_AVAILABLE:
                print("[API] madmom requested but not available - using librosa engine")
            else:
                print("[API] Using librosa engine without vocal separation")
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
            tmp_path.unlink(missing_ok=True)
        except Exception:
            pass


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

if __name__ == "__main__":
    import uvicorn
    import os
    # Hugging Face Spaces uses port 7860 by default
    port = int(os.environ.get("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)
