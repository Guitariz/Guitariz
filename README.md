# Guitariz

Full-stack music learning web app featuring interactive guitar/piano tools and optional AI-assisted audio analysis (chord detection + vocal/instrumental separation).

- Live demo: https://guitariz.studio
- License: MIT

## Features

### Interactive learning tools (frontend)
- **Guitar Fretboard**: play notes with mouse/keyboard and get real-time chord detection.
- **Piano Keyboard**: 88-key piano with keyboard controls.
- **Chord Explorer**: chord voicings + diagrams.
- **Scale Explorer**: visualize scale patterns.
- **Circle of Fifths**: explore key relationships.
- **Metronome**: 40–300 BPM with multiple time signatures.
- **Responsive UI** and **persisted settings**.

### AI features (optional backend)
- **Chord AI**: upload audio (`.mp3`, `.wav`, `.m4a`) and get chord timeline, key, and tempo.
- **Vocal / instrumental separation** (Demucs) to improve chord detection on dense mixes.

> Note: AI features require running the Python backend. The frontend can still run standalone.

## Tech Stack

**Frontend**
- React 18 + TypeScript
- Vite
- Tailwind CSS
- shadcn/ui + Radix UI

**Backend (optional)**
- FastAPI + Uvicorn
- Librosa (audio analysis)
- Demucs + PyTorch (vocal separation)

## Project Structure

```text
.
├── src/                  # React app
├── public/               # Static assets
├── backend/              # FastAPI service for AI features
└── VOCAL_SEPARATION.md   # Deep-dive on the separation pipeline
```

## Quick Start

### 1) Frontend

```bash
git clone https://github.com/abhi9vaidya/guitariz.git
cd guitariz
npm install
npm run dev
```

Then open the URL shown in the terminal (usually `http://localhost:5173`).

### 2) Backend (for AI features)

**Requirements**
- Python **3.12+**
- **FFmpeg** installed and available on your PATH

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS/Linux
# source .venv/bin/activate

pip install -r requirements.txt
python -m uvicorn main:app --port 8001
```

Backend endpoint:
- `http://localhost:8001/api/analyze`

## Configuration

### Frontend → Backend endpoint

Set this environment variable for the frontend:

```bash
# in a .env.local at repo root
VITE_CHORD_AI_API=http://localhost:8001/api/analyze
```

If not set, the app falls back to a local (less accurate) analysis path.

## Deployment

- The frontend is suitable for static hosting (Vercel, Netlify, etc.).
- The AI backend is **not** compatible with Vercel Serverless due to Demucs/PyTorch resource requirements.
  Host `backend/` on a VM/container platform (Render/Railway/Fly.io/VPS) and point `VITE_CHORD_AI_API` to it.

## Development

Common scripts:

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

## Open Source & Maintainer

Guitariz is **open source** (MIT licensed) and is **maintained by Abhinav Vaidya**.

- Contributions are welcome via issues and pull requests.
- Please keep changes focused and well-described so they can be reviewed/merged quickly.

## Contributing

1. Fork the repo
2. Create a branch: `git checkout -b feature/my-feature`
3. Commit: `git commit -m "Add my feature"`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

## License

MIT — see [`LICENSE`](./LICENSE).

## Trademark

“Guitariz” (name) and associated branding assets are maintained by the author.
Forks are welcome, but please avoid implying endorsement or official affiliation without permission.

## Author

Abhinav Vaidya
- GitHub: https://github.com/abhi9vaidya
- Repo: https://github.com/abhi9vaidya/guitariz
