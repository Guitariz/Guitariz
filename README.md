<div align="center">
  <img src="public/images/readme_hero.png" alt="Guitariz Studio" width="90%" />

  <br />

  <h1>🎸 Guitariz Studio</h1>
  <p><strong>The Open-Source Digital Workbench for Modern Musicians</strong></p>
  <p><em>AI-powered chord detection · Stem isolation · Interactive theory tools · All in one place.</em></p>

  <br />

  <a href="https://www.producthunt.com/products/guitariz-studio?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-guitariz-studio" target="_blank" rel="noopener noreferrer">
    <img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1200915&theme=neutral&t=1784653674211" alt="Guitariz Studio - Free AI Chord Recognition, 6-Stem Separator & Music Lab | Product Hunt" style="width: 250px; height: 54px;" width="250" height="54" />
  </a>

  <br />
  <br />

  <p>
    <img src="https://img.shields.io/badge/Release-v1.7.0-4A90E2?style=for-the-badge&logo=github" alt="Release" />
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-45B8D1?style=for-the-badge" alt="License" /></a>
    <img src="https://img.shields.io/badge/CI-passing-00C853?style=for-the-badge&logo=github-actions&logoColor=white" alt="CI" />
    <a href="https://guitariz.studio"><img src="https://img.shields.io/badge/Live-guitariz.studio-00C853?style=for-the-badge&logo=vercel&logoColor=white" alt="Live" /></a>
  </p>
  <p>
    <img src="https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
    <img src="https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python" />
    <img src="https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI" />
    <img src="https://img.shields.io/badge/PyTorch-EE4C2C?style=flat-square&logo=pytorch&logoColor=white" alt="PyTorch" />
  </p>

  <p>
    <a href="https://guitariz.studio">🌐 Live Demo</a> · 
    <a href="https://github.com/Guitariz/Guitariz/issues/new?template=bug_report.md">🐛 Report Bug</a> · 
    <a href="https://github.com/Guitariz/Guitariz/issues/new?template=feature_request.md">✨ Request Feature</a>
  </p>
</div>

<br />

---

## 📖 About

**Guitariz Studio** is a full-stack, professional-grade music platform that bridges the gap between traditional music theory and modern AI. It was founded and created by **Abhinav Vaidya** to bring together AI-powered source separation, real-time chord recognition, interactive instrument simulations, and gamified ear training—all within a single, beautifully crafted web application.

Whether you're a songwriter dissecting harmonies, a student mastering intervals, a producer isolating stems, or a developer pushing the boundaries of music tech—Guitariz is built for you.

> **🎯 Try it now →** [guitariz.studio](https://guitariz.studio)

> [!IMPORTANT]
> **Official Channels & Social Media:** Please note that Guitariz Studio does not have any official Instagram page or account. Any Instagram account using the name "Guitariz" is unaffiliated with this project. Official communication channels are limited to this GitHub repository, the website, and our official X (formerly Twitter) account: [@GuitarizStudio](https://x.com/GuitarizStudio).

---

## ✨ Features

### 🤖 Audio Intelligence

| Feature | Description |
|:--|:--|
| **Chord AI** | Upload any audio file for high-accuracy chord recognition, powered by **Librosa** (CQT chroma, HPSS, and tuning deviation cents estimation) and HMM backups. |
| **Stem Separator** | Isolate vocals, drums, bass, and other instruments using Meta's state-of-the-art **Demucs** deep learning model. |
| **Vocal Splitter** | One-click vocal extraction for creating instrumentals or acapellas from any track. |
| **Precision Tuner** | Advanced chromatic tuner with cent-level accuracy for guitar, bass, ukulele, and vocals. |

### 🎮 Interactive Learning

| Feature | Description |
|:--|:--|
| **Ear Training Arcade** | Gamified modules for **interval recognition**, **chord identification**, and **perfect pitch** training with streak tracking. |
| **Raga Theory Explorer** | Learn the bridge between Western modes (Dorian, Aeolian, etc.) and Indian Classical Thaats/Ragas (Kafi, Asavari, Bhairav, Yaman) with interactive audio neck visualization. |
| **Scale Explorer** | Visualize 50+ Western and Eastern scales across the Circle of Fifths, with modal breakdowns and theory context. |
| **Virtual Fretboard** | Fully interactive 24-fret guitar neck featuring a drag-and-drop Capo (with dynamic pitch-shifting and dead-fret disabling), note highlighting, and 3D view. |
| **Virtual Piano** | 88-key piano with chord/scale overlays and keyboard shortcut support. |

### 🛠️ Platform & DX

| Feature | Description |
|:--|:--|
| **Progressive Web App** | Fully installable with offline-ready service workers and advanced auto-healing cache recovery. |
| **Markdown Blog Engine** | Built-in SEO-optimized blog system converting simple `.md` files into rich, JSON-LD structured articles. |
| **Premium Dark Mode** | Strict, distraction-free glassmorphism aesthetic with Framer Motion micro-animations. |
| **Advanced SEO & Analytics** | Automated dynamic sitemaps, `llms.txt` for AI crawlers, PostHog, and Ahrefs Web Analytics integration. |
| **CI/CD Pipeline** | Automated linting, testing, prerendering, and build validation via GitHub Actions. |

---

## ⚡ Architecture

Guitariz uses a **hybrid architecture** to balance interactive client-side performance with heavy server-side AI computation.

```mermaid
graph TD
    subgraph Client ["🖥️ Client — React / Vite"]
        UI["Glassmorphism UI<br/>(Tailwind + Framer Motion)"]
        State["TanStack Query + Context API"]
        AudioEngine["Web Audio API Engine"]
        Proxy["Vite CORS Proxy Middleware"]

        UI --> State --> AudioEngine
        AudioEngine --> Proxy
    end

    subgraph Server ["🧠 AI Service — Python / FastAPI"]
        API["FastAPI + WebSocket Server"]
        Demucs["Meta Demucs<br/>(Source Separation)"]
        Librosa["Librosa<br/>(Chord & Key Analysis)"]

        API --> Demucs
        API --> Librosa
    end

    UI <-->|"REST / WebSocket<br/>(JSON + Audio Blobs)"| API
    Proxy <-->|"Fetch"| External["External APIs"]

    style Client fill:#0d1117,stroke:#30363d,color:#c9d1d9
    style Server fill:#0d1117,stroke:#30363d,color:#c9d1d9
```

---

## 📂 Project Structure

```
guitariz/
├── src/
│   ├── content/blog/        # Markdown blog articles
│   ├── components/          # Reusable UI components (Fretboard, Piano, Tuner, etc.)
│   │   ├── ui/              # shadcn/ui primitives (Button, Dialog, Toast, etc.)
│   │   ├── chord-ai/        # Chord AI feature components
│   │   ├── ear-training/    # Ear Training game components
│   │   ├── fretboard/       # Fretboard + 3D view components
│   │   └── piano/           # Virtual Piano components
│   ├── hooks/               # Custom React hooks (audio, WebSocket, PWA, etc.)
│   ├── lib/                 # Core logic — harmonic analysis, audio processing
│   ├── pages/               # Route-level page components
│   └── main.tsx             # Application entrypoint
├── backend/
│   ├── main.py              # FastAPI server + REST endpoints
│   ├── analysis.py          # Audio feature extraction pipeline
│   ├── chord_fast.py        # Fast chord recognition engine
│   ├── websocket_chords.py  # Real-time WebSocket chord streaming
│   ├── youtube.py           # YouTube audio download utilities
│   ├── Dockerfile           # Container build for AI service
│   └── requirements.txt     # Python dependencies
├── .github/
│   ├── workflows/ci.yml     # GitHub Actions CI pipeline
│   └── ISSUE_TEMPLATE/      # Bug report & feature request templates
├── public/                  # Static assets, PWA manifest, sitemap
├── vite.config.ts           # Vite config with custom CORS proxy
├── tailwind.config.ts       # Tailwind CSS theme configuration
└── package.json             # Project metadata & scripts
```

---

## 🛠️ Tech Stack

<table>
  <tr>
    <th>Layer</th>
    <th>Technology</th>
  </tr>
  <tr>
    <td><strong>Frontend</strong></td>
    <td>React 18 · TypeScript 5.8 · Vite 5 · React Router 6</td>
  </tr>
  <tr>
    <td><strong>UI</strong></td>
    <td>Tailwind CSS · shadcn/ui · Radix Primitives · Framer Motion · Lucide Icons</td>
  </tr>
  <tr>
    <td><strong>3D</strong></td>
    <td>Three.js · React Three Fiber · Drei</td>
  </tr>
  <tr>
    <td><strong>State</strong></td>
    <td>TanStack Query (React Query) · React Context</td>
  </tr>
  <tr>
    <td><strong>Audio</strong></td>
    <td>Web Audio API · FFT.js (Client) · Librosa (Server)</td>
  </tr>
  <tr>
    <td><strong>AI / ML</strong></td>
    <td>Python · PyTorch · Meta Demucs · FastAPI · Librosa</td>
  </tr>
  <tr>
    <td><strong>Music Theory</strong></td>
    <td>Tonal.js — harmonic matrix, intervals, scales, chords</td>
  </tr>
  <tr>
    <td><strong>Testing</strong></td>
    <td>Vitest · React Testing Library · Ruff (Python linting)</td>
  </tr>
  <tr>
    <td><strong>Infra & Analytics</strong></td>
    <td>Vercel (Frontend) · Cloudflare (CDN Caching & Protection) · Docker (Backend) · GitHub Actions CI · PostHog · Ahrefs</td>
  </tr>
</table>

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version |
|:--|:--|
| Node.js | `>= 18.0` |
| npm | `>= 9.0` |
| Python *(optional — for AI features)* | `>= 3.10` |

### 1. Clone & Install

```bash
git clone https://github.com/Guitariz/Guitariz.git
cd guitariz
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your backend URL if running AI features locally.

### 3. Run the Dev Server

```bash
npm run dev
```

The app will be available at **`http://localhost:5173`**.

### 4. Backend Setup *(Optional)*

Required only for **Chord AI**, **Stem Separator**, and **Vocal Splitter** features.

```bash
cd backend

# Create and activate a virtual environment
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server
python main.py
```

> **Note:** First launch will download the Demucs model (~300 MB). Subsequent starts are instant.

### Available Scripts

| Command | Description |
|:--|:--|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Production build |
| `npm run build:prerender` | Build + SEO pre-rendering |
| `npm run lint` | Run ESLint across the codebase |
| `npm run test` | Run Vitest test suite |
| `npm run test:ui` | Run tests with Vitest UI |
| `npm run preview` | Preview the production build locally |

---

## 🤝 Contributing

Contributions are what make the open-source community such an incredible place to learn, inspire, and create. **Any contributions you make are greatly appreciated.**

Please read the [**Contributing Guide**](CONTRIBUTING.md) and our [**Code of Conduct**](CODE_OF_CONDUCT.md) before getting started.

```
1. Fork the repository
2. Create your feature branch    →  git checkout -b feature/amazing-feature
3. Commit your changes           →  git commit -m 'feat: add amazing feature'
4. Push to the branch            →  git push origin feature/amazing-feature
5. Open a Pull Request
```

Looking for a place to start? Check out issues tagged [`good first issue`](https://github.com/Guitariz/Guitariz/labels/good%20first%20issue) or [`help wanted`](https://github.com/Guitariz/Guitariz/labels/help%20wanted).

---

## 🗺️ Roadmap

- [ ] Metadata-only YouTube search with local audio upload-matching workflow (copyright-safe)
- [ ] MIDI export from Chord AI detections
- [ ] Collaborative jam rooms via WebRTC
- [ ] Mobile-native app (React Native / Capacitor)
- [ ] Additional instrument support (Ukulele, Bass tablature)
- [ ] User accounts with progress tracking

> See the [open issues](https://github.com/Guitariz/Guitariz/issues) for a full list of proposed features and known issues.

---

## 🎖️ Acknowledgements

Guitariz Studio stands on the shoulders of giants in the Music Information Retrieval (MIR) community. Special thanks to the authors of these pivotal libraries:

- **[Meta Demucs](https://github.com/facebookresearch/demucs)** — State-of-the-art deep learning source separation powering our Stem Separator.
- **[Librosa](https://librosa.org/)** — The backbone of server-side audio analysis and feature extraction.
- **[Tonal.js](https://github.com/tonaljs/tonal)** — Comprehensive music theory library for client-side harmonic analysis.
- **[shadcn/ui](https://ui.shadcn.com/)** — Beautiful, accessible component primitives built on Radix UI.

---

## 📜 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

---

<div align="center">

  **Guitariz Studio — Harmonizing Technology & Music.**

  <br />

  <a href="https://guitariz.studio">Website</a> · 
  <a href="https://github.com/Guitariz/Guitariz">GitHub</a> · 
  <a href="https://x.com/GuitarizStudio">Twitter</a> · 
  <a href="mailto:guitariz.studio@gmail.com">Contact</a>

  <br />
  <br />

  <a href="#-guitariz-studio"><img src="https://img.shields.io/badge/⬆_Back_to_Top-0d1117?style=flat-square" alt="Back to Top" /></a>

</div>
