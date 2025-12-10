# 🎸 Guitariz

A modern, interactive web application for guitar learning, music theory, and chord exploration. Master the fretboard, explore scales, understand music theory, and play with an interactive piano—all in one beautifully designed platform.

**[🌐 Live Demo](https://guitariz.vercel.app)** | **[📖 Documentation](#documentation)** | **[🤝 Contributing](CONTRIBUTING.md)**

---

## ✨ Features

### 🎹 Interactive Fretboard
- **Visual fretboard** with 6-string guitar representation
- **Keyboard support** for playing notes with customizable keymaps (QWERTY, AZERTY)
- **Chord detection** with AI-powered chord recognition
- **Real-time highlighting** of played notes
- **Octave shifting** for extended range

### 🎹 Interactive Piano Keyboard
- **88-key visual piano** with MIDI representation
- **Keyboard controls** for playing with your computer keyboard
- **Octave navigation** with arrow keys
- **Visual feedback** for active notes
- **Sustain simulation** for realistic playing experience

### 🎵 Chord Library
- **Root chord explorer** for all 12 chromatic roots
- **Multiple chord voicings** (Major, Minor, 7, M7, m7, sus2, sus4, dim, aug, etc.)
- **Interactive chord diagrams** showing finger positions
- **Variation explorer** to see different ways to play the same chord
- **Searchable chord database**

### 🎼 Music Theory Tools
- **Circle of Fifths** visualization with relationships between keys
- **Scale explorer** for all modes and scales
- **Chromatic reference** for learning note positions
- **Harmonic relationships** visualization
- **Key signatures** quick reference

### ⏱️ Metronome
- **Adjustable BPM** (40-300)
- **Time signatures** support (4/4, 3/4, 6/8, etc.)
- **Visual beat indicator**
- **Sound feedback** for tempo training
- **Customizable accent patterns**

### 🎯 Advanced Features
- **Chord detection strictness** (lenient/strict mode)
- **Customizable keyboard settings** (strum speed, velocity profile)
- **localStorage persistence** for user preferences
- **Responsive design** for all devices
- **Accessibility features** (ARIA labels, keyboard navigation)
- **Performance optimized** with no lag

---

## 🧩 Tech Stack

| Technology | Purpose |
|-------------|---------|
| **React** | Dynamic UI library |
| **TypeScript** | Type-safe development |
| **Vite** | Fast build tool & dev server |
| **Tailwind CSS** | Responsive styling |
| **shadcn/ui** | Beautiful UI components |
| **Lucide Icons** | High-quality icons |
| **Radix UI** | Accessible component primitives |
| **React Router** | Client-side routing |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/abhi9vaidya/guitariz.git
cd guitariz/rift-rhythm

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will open at `http://localhost:8080`

### Build for Production

```bash
# Build optimized bundle
npm run build

# Preview production build
npm run preview
```

---

## 📖 Documentation

### Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   ├── chord/          # Chord-related components
│   ├── piano/          # Piano keyboard components
│   ├── fretboard/      # Fretboard-related components
│   ├── Fretboard.tsx   # Main fretboard interface
│   ├── Navigation.tsx   # Top navigation bar
│   └── ...
├── hooks/              # Custom React hooks
│   ├── useKeyboardFretboard.ts
│   ├── usePianoKeyboard.ts
│   └── use-toast.ts
├── lib/                # Utility functions
│   ├── chordDetection.ts
│   ├── chordAudio.ts
│   ├── chordAdapter.ts
│   └── utils.ts
├── types/              # TypeScript type definitions
├── data/               # Static data (chord data)
├── pages/              # Page components
│   ├── Index.tsx
│   └── NotFound.tsx
├── App.tsx             # Main app component
├── main.tsx            # Entry point
└── index.css           # Global styles
```

### Key Components

#### Fretboard
Interactive 6-string guitar fretboard with:
- Click to play notes
- Keyboard input support
- Chord detection
- Piano mode toggle

#### ScaleExplorer
Explore music scales:
- Root note selection
- Scale type selection
- Visual display on fretboard
- Interval information

#### CircleOfFifths
Music theory visualization:
- Harmonic relationships
- Key signatures
- Major/Minor modes
- Chord progressions

#### Metronome
Tempo training tool:
- BPM control (40-300)
- Time signature selection
- Visual beat indicator
- Audio feedback

---

## 🎮 How to Use

### Playing the Fretboard
1. **Click on frets** to play individual notes
2. **Use keyboard** - Press keys mapped to notes
3. **View chord detection** - Play notes and see detected chords
4. **Toggle Piano mode** - Switch between fretboard and piano keyboard

### Exploring Scales
1. **Select root note** from dropdown
2. **Choose scale type** (Major, Minor, Pentatonic, etc.)
3. **See scale on fretboard** with all positions highlighted

### Using the Metronome
1. **Adjust BPM** with slider (40-300 bpm)
2. **Select time signature** for different patterns
3. **Click play** to start tempo training

### Learning with Circle of Fifths
1. **Understand key relationships** visually
2. **Learn chord progressions** common in music
3. **Explore major and minor modes** and their relationships

---

## ⚙️ Configuration

### Environment Variables

Create a `.env.local` file (not required for basic usage):

```env
# Vite config (optional)
VITE_API_URL=http://localhost:3000
```

### Keyboard Presets

- **QWERTY** (Default) - Standard US keyboard layout
- **AZERTY** - European keyboard layout (French/Belgian)

Customize in `src/types/pianoTypes.ts`

### Chord Detection

Adjust strictness in the Fretboard settings:
- **Lenient** - Tolerates extra notes (good for practice)
- **Strict** - Only exact chord matches (good for testing)

---

## 🛠️ Development

### Available Scripts

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Build in dev mode
npm run build:dev

# Lint code
npm run lint

# Preview production build
npm run preview
```

### ESLint Configuration

The project uses ESLint for code quality:

```bash
npm run lint
```

Fix linting issues:

```bash
npm run lint -- --fix
```

---

## 📱 Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Click "Deploy"

3. **Domain Setup**
   - Add custom domain in Vercel dashboard
   - Update DNS records (if using custom domain)

### Deploy to Other Platforms

**Netlify:**
```bash
npm install -g netlify-cli
netlify deploy --prod
```

**Traditional Server:**
```bash
# Build static files
npm run build

# Upload dist/ folder to server
# Set up 404 redirects to index.html for SPA routing
```

---

## 🐛 Troubleshooting

### Keyboard not working
- Ensure keyboard is enabled (toggle button in Fretboard)
- Check keyboard settings for correct keymap
- Try refreshing the page

### Chord detection not working
- Ensure at least 2 notes are played
- Check detection strictness setting
- Verify notes are held down simultaneously

### Piano mode lag
- Disable other browser extensions
- Clear browser cache
- Ensure no other CPU-intensive apps running

### Build errors
- Clear `node_modules`: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf node_modules/.vite`
- Verify Node.js version: `node --version` (should be 16+)

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Report Issues
Found a bug? [Open an issue](https://github.com/abhi9vaidya/guitariz/issues)

### Feature Requests
Have an idea? [Create a discussion](https://github.com/abhi9vaidya/guitariz/discussions)

---

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

---

## 🎵 Credits

- Built with [React](https://react.dev)
- Styled with [Tailwind CSS](https://tailwindcss.com)
- Components from [shadcn/ui](https://ui.shadcn.com)
- Icons from [Lucide](https://lucide.dev)

---

## 📞 Support

- 📧 Email: contact@guitariz.dev
- 🐦 Twitter: [@guitariz_app](https://twitter.com/guitariz_app)
- 💬 GitHub Discussions: [Ask questions](https://github.com/abhi9vaidya/guitariz/discussions)

---

## 🗺️ Roadmap

- [ ] MIDI device support
- [ ] Audio recording & playback
- [ ] Lesson system with tutorials
- [ ] Multiplayer mode
- [ ] Mobile app (React Native)
- [ ] Advanced music theory lessons
- [ ] Chord progression generator
- [ ] Finger strength exercises

---

**Made with ❤️ by Abhinav Vaidya**
