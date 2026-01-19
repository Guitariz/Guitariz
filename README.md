# 🎸 Guitariz

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-61dafb?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5+-646cff?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?logo=vercel&logoColor=white)](https://guitariz.vercel.app)

An interactive web application for exploring guitar, piano, and music theory through hands-on learning. Play chords, detect what you're playing, explore scales, and understand music theory visually.

**[→ Try the Live Demo](https://guitariz.vercel.app)**

---

## 📋 Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Tech Stack](#tech-stack)
- [How to Use](#how-to-use)
- [Project Structure](#project-structure)
- [Development](#development)
- [Browser Support](#browser-support)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## ✨ Features

- **🎹 Interactive Fretboard** - Click to play notes or use keyboard. Real-time chord detection identifies what you're playing.
- **🎹 Piano Keyboard** - 88-key piano with keyboard controls. Navigate octaves and explore note positions.
- **🪄 Vocal Splitter** - AI-powered source separation to isolate vocals and instrumentals from any song.
- **🤖 Chord AI** - Upload any audio file to detect chords, key, and tempo. Supports **Vocal Filtering** to improve accuracy on busy tracks.
- **🎵 Chord Explorer** - Browse different chord voicings with interactive finger position diagrams.
- **🎼 Music Theory Tools** - Circle of Fifths, Scale Explorer, Key Signatures, and Chromatic Reference.
- **⏱️ Metronome** - Adjustable tempo (40-300 BPM), multiple time signatures, and visual beat indicators.
- **⌨️ Keyboard Support** - Play the fretboard and piano using your computer keyboard (QWERTY/AZERTY).
- **🎯 Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices.
- **💾 Persistent Settings** - Your preferences are saved locally for a consistent experience.

---

## 🚀 Quick Start

### 1. Frontend Setup (React)
```bash
# Clone the repository
git clone https://github.com/abhi9vaidya/guitariz.git
cd guitariz

# Install dependencies
npm install

# Start the development server
npm run dev
```

### 2. Backend Setup (Python)
The AI features (Vocal Separation and Chord Detection) require a Python backend.
```bash
cd backend
python -m venv .venv
# Activate environment (Windows)
.venv\Scripts\activate
# Activate environment (Mac/Linux)
source .venv/bin/activate

pip install -r requirements.txt
python main.py
```
*Note: Requires [FFmpeg](https://ffmpeg.org/download.html) installed on your system.*

---

## 🛠️ Tech Stack

| Category | Technology |
|-----------|---------|
| **Frontend** | React 18, TypeScript 5, Vite 5, Tailwind CSS, Framer Motion |
| **UI Components** | shadcn/ui, Radix UI, Lucide Icons |
| **Audio Processing** | Web Audio API, Librosa (Python) |
| **AI Models** | Meta Demucs (Source Separation), PyTorch |
| **Backend** | FastAPI, Uvicorn |

---

## 📖 How to Use

### Playing the Fretboard
1. Click frets to play individual notes
2. Use your keyboard for faster playing
3. Play 2+ notes together to trigger chord detection
4. Explore different voicings

### Learning Music Theory
1. Open Circle of Fifths to understand key relationships
2. Use Scale Explorer to visualize patterns on the fretboard
3. Reference Key Signatures and Chromatic notes anytime

### Practicing with Metronome
1. Set your desired BPM and time signature
2. Start the metronome
3. Practice scales, chord transitions, or finger exercises at different tempos

### Using Chord AI (in progress)
1. Open the Chord AI page and drop an `.mp3`, `.wav`, or `.m4a` file
2. Press play to see the waveform, live chord timeline, tempo, and key summary
3. The UI calls the endpoint set in `VITE_CHORD_AI_API` (falls back to `/api/analyze`); the backend service is not bundled yet

---

## 📁 Project Structure

```text
├── src/
│   ├── components/       # UI Components (Fretboard, Piano, AI panels)
│   ├── hooks/            # Custom React hooks (Audio, Keyboard, API)
│   ├── lib/              # Utility functions and API clients (chord detection)
│   ├── pages/            # Application routes (Splitter, ChordAI, etc.)
│   └── types/            # TypeScript definitions
├── backend/
│   ├── main.py           # FastAPI server & API endpoints
│   ├── analysis.py       # AI Processing logic (Demucs & Librosa)
│   └── requirements.txt  # Python dependencies
└── VOCAL_SEPARATION.md   # Detailed AI documentation
```

---

## 🤝 Contributing

Contributions are welcome! Whether it's fixing bugs, adding new theory tools, or improving the AI models.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 👨‍💻 Author

**Abhinav Vaidya** - [GitHub](https://github.com/abhi9vaidya)

Project Link: [https://github.com/abhi9vaidya/guitariz](https://github.com/abhi9vaidya/guitariz)

---

**Made with 🎵 by Abhinav Vaidya**
