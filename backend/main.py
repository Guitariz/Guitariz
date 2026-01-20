from pathlib import Path
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
import tempfile
import shutil
import uuid
import subprocess

from analysis import analyze_file, separate_audio_full

app = FastAPI(title="Chord AI Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/analyze")
async def analyze(file: UploadFile = File(...), separate_vocals: bool = False):
    """Analyze audio file for chords.
    
    Args:
        file: Audio file to analyze
        separate_vocals: If True, separate vocals before analysis for better accuracy
    """
    print(f"Received analysis request for file: {file.filename} (separate_vocals={separate_vocals})")
    if not file.filename:
        raise HTTPException(status_code=400, detail="File required")

    suffix = Path(file.filename).suffix or ".tmp"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = Path(tmp.name)

    try:
        result = analyze_file(tmp_path, separate_vocals=separate_vocals)
        return JSONResponse(result)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Analysis failed: {exc}")
    finally:
        try:
            tmp_path.unlink(missing_ok=True)
        except Exception:
            pass


# Store separated audio files temporarily (in production, use S3/cloud storage)
separated_files = {}


@app.post("/api/separate")
async def separate_audio(
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
            "format": format,
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
