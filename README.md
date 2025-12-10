# 🎸 Guitariz

An interactive web application I built for exploring guitar, music theory, and chord patterns. It features an interactive fretboard, piano keyboard, chord library, and music theory tools like the circle of fifths and scale explorer.

**[🌐 Live Demo](https://guitariz.vercel.app)**

---

## What's Included

## What's Included

### Interactive Fretboard
- Visual 6-string guitar fretboard you can click to play notes
- Keyboard controls with customizable key mappings (QWERTY, AZERTY)
- Chord detection to see what chords you're playing
- Visual highlighting of notes as you play
- Octave shifting for extended range

### Piano Keyboard
- 88-key piano keyboard with MIDI representation
- Play notes using your computer keyboard
- Navigate octaves with arrow keys
- Visual feedback for which keys you're pressing

### Chord Library
- Explorer for different chord voicings (Major, Minor, 7th, sus2/sus4, etc.)
- Interactive chord diagrams showing finger positions
- Different ways to play the same chord
- Searchable chord database

### Music Theory Tools
- **Circle of Fifths** - Visualize relationships between keys
- **Scale Explorer** - Check out different scales and modes
- **Chromatic Reference** - Learn note positions on the fretboard
- **Key Signatures** - Quick reference

### Metronome
- Adjustable tempo (40-300 BPM)
- Different time signatures (4/4, 3/4, 6/8, etc.)
- Visual beat indicator
- Sound feedback for practice

---

## Built With

- React + TypeScript
- Vite for fast development and building
- Tailwind CSS for styling
- shadcn/ui for components
- Lucide Icons
- Radix UI for accessible primitives

---

## Getting Started

### Prerequisites
- Node.js 16+
- npm or bun

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

Visit `http://localhost:8080` to see it running.

### Building

```bash
# Create an optimized production build
npm run build

# Preview the production build locally
npm run preview
```

---

## Project Structure

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

## How to Use

### Playing the Fretboard
1. Click on frets to play individual notes
2. Use your keyboard - press mapped keys for notes
3. Watch the chord detection show what you're playing
4. Toggle to Piano mode to switch instruments

### Exploring Scales
1. Select a root note
2. Choose a scale type (Major, Minor, Pentatonic, etc.)
3. See the scale highlighted on the fretboard

### Using the Metronome
1. Adjust the BPM with the slider
2. Select a time signature
3. Click play to practice with a tempo

### Music Theory
Learn how keys relate to each other using the Circle of Fifths and explore common chord progressions.

---

## Customization

### Keyboard Layouts
You can switch between QWERTY and AZERTY keyboard layouts in the settings.

### Chord Detection
Adjust the detection mode:
- **Lenient** - tolerates extra notes (good for practice)
- **Strict** - exact matches only (good for testing)

---

## Development

### Available Commands

```bash
npm run dev       # Start development server
npm run build     # Create production build
npm run build:dev # Build in development mode
npm run lint      # Check code quality
npm run preview   # View production build locally
```

---

## Browser Support

Works on Chrome, Firefox, Safari, and Edge (latest versions). Also works on mobile browsers.

---

## Deployment

The app is currently deployed on Vercel. To deploy your own version:

1. Push to GitHub
2. Connect your repository to Vercel
3. Set build command to `npm run build` and output directory to `dist`
4. Deploy

Alternatively, you can build and deploy the `dist` folder to any static hosting service.

---

## Troubleshooting

**Keyboard not working?** - Check that keyboard input is enabled in settings. Try refreshing the page.

**Chord detection issues?** - Make sure you're playing at least 2 notes simultaneously and they're held down.

**Performance lag?** - Clear your browser cache or try a different browser.

**Build errors?** - Run `npm install` again and make sure you have Node.js 16+.

---

## License

MIT License - see [LICENSE](LICENSE) for details.
