from pathlib import Path
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
import tempfile
import shutil
import uuid

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
async def separate_audio(file: UploadFile = File(...)):
    """Separate vocals and instrumentals from audio file."""
    print(f"Received separation request for file: {file.filename}")
    if not file.filename:
        raise HTTPException(status_code=400, detail="File required")

    suffix = Path(file.filename).suffix or ".tmp"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = Path(tmp.name)

    try:
        # Perform full separation
        result = separate_audio_full(tmp_path)
        
        if not result:
            raise HTTPException(status_code=500, detail="Separation failed - model error")
        
        session_id = str(uuid.uuid4())
        
        # Store paths temporarily
        separated_files[session_id] = {
            "vocals": result["vocals"],
            "instrumental": result["instrumental"],
        }
        
        return JSONResponse({
            "session_id": session_id,
            "vocalsUrl": f"/api/separate/download/{session_id}/vocals",
            "instrumentalUrl": f"/api/separate/download/{session_id}/instrumental",
        })
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
async def download_separated(session_id: str, track_type: str):
    """Download separated audio track."""
    if session_id not in separated_files:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if track_type not in ["vocals", "instrumental"]:
        raise HTTPException(status_code=400, detail="Invalid track type")
    
    file_path = separated_files[session_id][track_type]
    
    return FileResponse(
        file_path,
        media_type="audio/wav",
        filename=f"{track_type}.wav"
    )


@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
