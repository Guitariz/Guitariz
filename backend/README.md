# Chord AI Backend

FastAPI service providing `/api/analyze` for the Guitariz frontend.

## Requirements
- Python 3.12+
- ffmpeg available on PATH

## Setup
```bash
python -m pip install -r requirements.txt
```

## Run locally
```bash
python -m uvicorn main:app --port 8001
```
Endpoint: http://localhost:8001/api/analyze

## Frontend integration
Set an env for the frontend so it calls the backend:
```
VITE_CHORD_AI_API=http://localhost:8001/api/analyze
```
If unset, the frontend will fall back to local (less accurate) analysis.
