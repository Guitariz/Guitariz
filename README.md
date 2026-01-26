<div align="center">
  <img src="public/logo.svg" alt="Guitariz Logo" width="120" height="120" />
  <h1>Guitariz Studio</h1>
  <p><strong>The ultimate interactive workbench for guitarists, songwriters, and music theory students.</strong></p>

  [![Version](https://img.shields.io/badge/version-1.6.1-blue.svg?style=for-the-badge)](https://github.com/abhi9vaidya/guitariz)
  [![License](https://img.shields.io/badge/license-MIT-green.svg?style=for-the-badge)](./LICENSE)
  [![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

  [**Live Demo**](https://guitariz.studio) • [**Report Bug**](https://github.com/abhi9vaidya/guitariz/issues) • [**Request Feature**](https://github.com/abhi9vaidya/guitariz/issues)
</div>

---

## 🎸 Overview

**Guitariz** is a high-performance, full-stack music platform designed to bridge the gap between theory and practice. Whether you're decoding a complex solo or exploring new harmonic landscapes, Guitariz provides the tools to visualize, analyze, and play with precision.

### Why Guitariz?
- **Low-Latency Audio**: Built on the Web Audio API for an immediate, tactile playing experience.
- **AI-Powered Insights**: Integrated source separation and chord detection.
- **Academic Rigor**: Comprehensive mapping of Western and Eastern musical systems.
- **Studio Aesthetics**: A premium, motion-heavy dark UI designed for focus.

---

## ✨ Key Features

### 🛠️ Interactive Instrument Engine
- **Virtual Fretboard & Piano**: High-fidelity sound engines with multi-octave support and real-time interval labeling.
- **Smart Chord Detection**: Instantly identifies any group of notes played across the instruments.
- **Modal Explorer**: Visualize every musical scale, from standard Major/Minor to complex Eastern Ragas.
- **Precision Metronome**: Sample-accurate timing (40–300 BPM) with visual pulse cues and tap-tempo.

### 🧠 AI-Powered Song Analysis
- **Vocal/Instrumental Splitter**: Leverages SOTA models (Demucs) to isolate stems for karaoke or transcription.
- **Chord AI Timeline**: Automatically detect chords, key, and tempo from any uploaded audio file.
- **High-Fidelity Waveform Preview**: Interactive seeking and synchronized playback for analysis.

---

## 🚀 Quick Start

### Frontend Development

Ensure you have [Node.js](https://nodejs.org/) installed.

```bash
# Clone the repository
git clone https://github.com/abhi9vaidya/guitariz.git
cd guitariz

# Install dependencies
npm install

# Start the development server
npm run dev
```

### AI Backend (Optional)

The backend enables Demucs stem separation and advanced ML chord analysis.

```bash
cd backend

# Setup virtual environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install requirements & start
pip install -r requirements.txt
python main.py
```

---

## 🛠️ Tech Stack

| Frontend | Backend | DevOps |
| :--- | :--- | :--- |
| **Framework**: React 18 (Vite) | **API**: FastAPI (Python) | **Deployment**: Vercel (FE) |
| **Logic**: TypeScript | **ML**: PyTorch + Demucs | **CI/CD**: GitHub Actions |
| **Styling**: Tailwind CSS | **Audio**: Librosa + Madmom | **Linting**: ESLint + Ruff |
| **Motion**: Framer Motion | **Server**: Uvicorn | **Standard**: shadcn/ui |

---

## 🗺️ Project Roadmap
- [x] Version 1.6.1: Full Linting Compliance & Performance Audit.
- [ ] Adaptive MIDI Input Support.
- [ ] User Cloud Profiles for Saved Chords/Scales.
- [ ] Mobile PWA Optimization.

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 👥 Author

**Abhinav Vaidya**  
- GitHub: [@abhi9vaidya](https://github.com/abhi9vaidya)  
- Project Link: [Guitariz Studio](https://guitariz.studio)

<div align="center">
  <p>Built for musicians everywhere :))</p>
</div>
