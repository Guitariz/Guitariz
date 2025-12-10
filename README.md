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
- **🎵 Chord Explorer** - Browse different chord voicings (Major, Minor, 7th, sus2/sus4, etc.) with interactive finger position diagrams.
- **🎼 Music Theory Tools** - Circle of Fifths, Scale Explorer, Key Signatures, and Chromatic Reference for visual learning.
- **⏱️ Metronome** - Adjustable tempo (40-300 BPM), multiple time signatures, visual beat indicator, and sound feedback.
- **⌨️ Keyboard Support** - Customizable keyboard mappings (QWERTY, AZERTY) for hands-on practice.
- **🎯 Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices.
- **💾 Persistent Settings** - Your preferences are saved locally for a consistent experience.

---

## 🚀 Quick Start

### Prerequisites

- Node.js 16+
- npm or bun
- A modern web browser

### Installation & Setup

```bash
# Clone the repository
git clone https://github.com/abhi9vaidya/guitariz.git
cd guitariz

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open your browser to `http://localhost:5173` and start exploring.

### Building for Production

```bash
# Create an optimized production build
npm run build

# Preview the production build locally
npm run preview
```

---

## 🛠️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| **React 18** | UI library |
| **TypeScript 5** | Type-safe development |
| **Vite 5** | Build tool & dev server |
| **Tailwind CSS** | Styling & responsive design |
| **shadcn/ui** | Component library |
| **Radix UI** | Accessible primitives |
| **Lucide Icons** | Icon set |

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

---

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/                    # Reusable UI components (badge, button, card, etc.)
│   ├── chord/                 # Chord diagram & variation components
│   ├── piano/                 # Piano keyboard components
│   ├── fretboard/             # Fretboard & keyboard settings
│   ├── Fretboard.tsx          # Main fretboard interface
│   ├── ScaleExplorer.tsx      # Scale exploration tool
│   ├── CircleOfFifths.tsx     # Music theory visualization
│   ├── Metronome.tsx          # Tempo practice tool
│   └── Navigation.tsx         # Header navigation
├── hooks/
│   ├── useKeyboardFretboard.ts    # Keyboard input handling
│   ├── usePianoKeyboard.ts        # Piano keyboard input
│   └── use-toast.ts               # Toast notifications
├── lib/
│   ├── chordDetection.ts      # Core chord detection algorithm
│   ├── chordAudio.ts          # Sound generation
│   ├── chordAdapter.ts        # Data transformation utilities
│   └── utils.ts               # General utilities
├── types/
│   ├── chordTypes.ts          # Chord-related types
│   ├── chordDetectionTypes.ts # Detection algorithm types
│   ├── keyboardTypes.ts       # Keyboard input types
│   └── pianoTypes.ts          # Piano component types
├── data/
│   └── chordData.ts           # Chord database
├── pages/
│   ├── Index.tsx              # Main application page
│   └── NotFound.tsx           # 404 page
├── App.tsx                    # Root component
├── main.tsx                   # Application entry point
├── index.css                  # Global styles
└── vite-env.d.ts              # Vite environment types
```

---

## 🔧 Development

### Available Commands

```bash
npm run dev        # Start development server with hot reload
npm run build      # Create optimized production build
npm run build:dev  # Build in development mode (for debugging)
npm run lint       # Run ESLint for code quality checks
npm run preview    # Preview production build locally
```

### Code Quality

This project uses ESLint for code quality. Run `npm run lint` to check for issues.

### Project Components

| Component | Purpose |
|-----------|---------|
| **Fretboard** | Main 6-string guitar interface with note playback and chord detection |
| **Piano** | 88-key piano keyboard with octave navigation |
| **ScaleExplorer** | Select root note and scale type to see patterns on fretboard |
| **CircleOfFifths** | Visualize key relationships and chord progressions |
| **Metronome** | Adjustable tempo and time signature for practice |
| **ChordDiagram** | Interactive visualization of chord finger positions |

---

## 🌐 Browser Support

| Browser | Support |
|---------|---------|
| Chrome | ✅ Latest version |
| Firefox | ✅ Latest version |
| Safari | ✅ Latest version |
| Edge | ✅ Latest version |
| Mobile (iOS/Android) | ✅ Latest versions |

---

## 🚢 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project" and import your repository
4. Vercel will auto-detect the settings
5. Click "Deploy"

### Deploy to Other Platforms

Any static hosting service works. Build the project and deploy the `dist` folder:

```bash
npm run build
# Then upload the dist/ folder to your hosting provider
```

**Compatible with:** GitHub Pages, Netlify, Cloudflare Pages, AWS S3, Firebase Hosting, etc.

---

## 📊 What Makes It Useful

- **No login required** - Just open and start exploring
- **Real-time feedback** - Instant chord detection as you play
- **Interactive learning** - Understand through exploration, not just reading
- **Keyboard-based** - Your computer keyboard becomes the instrument
- **Clean interface** - Straightforward and intuitive navigation
- **Open source** - Free to use, modify, and learn from

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Keyboard not responding | Ensure keyboard input is enabled in settings. Try refreshing the page. |
| Chord detection not working | Play 2+ notes simultaneously and hold them together. Check lenient mode in settings. |
| Lag or performance issues | Clear your browser cache or try a different browser. |
| Build errors | Run `npm install` again and verify you have Node.js 16+. |
| Port already in use | Change the dev port by running `npm run dev -- --port 3000` |

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

You're free to use, modify, and distribute this project as you wish.

---

## 🙏 Acknowledgments

Built with:
- [React](https://react.dev) - UI library
- [Vite](https://vitejs.dev) - Build tool
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [shadcn/ui](https://ui.shadcn.com) - Components
- [Radix UI](https://www.radix-ui.com) - Primitives
- [Lucide](https://lucide.dev) - Icons

---

**Made with 🎵 by [Abhinav Vaidya](https://github.com/abhi9vaidya)**
