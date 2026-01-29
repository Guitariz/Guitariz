import { useState, useMemo, useEffect, useCallback, useRef, useLayoutEffect } from "react";
import { Keyboard, Info, Music, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useKeyboardFretboard } from "@/hooks/useKeyboardFretboard";
import { usePianoKeyboard } from "@/hooks/usePianoKeyboard";
import { KeyboardHelpOverlay } from "./fretboard/KeyboardHelpOverlay";
import { KeyboardSettings } from "./fretboard/KeyboardSettings";
import { PianoKeyboard } from "./piano/PianoKeyboard";
import { PianoSettings } from "./piano/PianoSettings";
import { ChordDetectionPanel } from "./ChordDetectionPanel";
import { ChordDebugPanel } from "./ChordDebugPanel";
import { DEFAULT_KEYMAP, KeymapConfig } from "@/types/keyboardTypes";
import { QWERTY_KEYMAP, AZERTY_KEYMAP, KeyboardPreset } from "@/types/pianoTypes";
import { detectChords, fretboardNotesToMidi, midiToPitchClass, pitchClassToNote } from "@/lib/chordDetection";
import { DetectionStrictness } from "@/types/chordDetectionTypes";
import { playNote, playChord } from "@/lib/chordAudio";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, animate } from "framer-motion";

const NOTES = ["E", "A", "D", "G", "B", "E"];
const CHROMATIC = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const FRETS = 12;
const STRING_BASE_FREQ = [82.41, 110.0, 146.83, 196.0, 246.94, 329.63]; // Low E to high E
const MARKER_FRETS = new Set([3, 5, 7, 9, 12, 15, 17, 19, 21]);

const SCALE_DEFS: Record<string, number[]> = {
  "Major (Ionian)": [0, 2, 4, 5, 7, 9, 11],
  "Minor (Aeolian)": [0, 2, 3, 5, 7, 8, 10],
  "Pentatonic Major": [0, 2, 4, 7, 9],
  "Pentatonic Minor": [0, 3, 5, 7, 10],
  "Blues": [0, 3, 5, 6, 7, 10],
  "Dorian": [0, 2, 3, 5, 7, 9, 10],
  "Mixolydian": [0, 2, 4, 5, 7, 9, 10],
};

const INTERVAL_LABELS: Record<number, string> = {
  0: "R",
  1: "b2",
  2: "2",
  3: "b3",
  4: "3",
  5: "4",
  6: "b5",
  7: "5",
  8: "b6",
  9: "6",
  10: "b7",
  11: "7",
};
interface FretNote {
  string: number;
  fret: number;
  note: string;
}

// Chord patterns: intervals from root

type FretboardProps = {
  initialChordVoicing?: number[] | null;
};

const Fretboard = ({ initialChordVoicing }: FretboardProps) => {
  const [highlightedNotes, setHighlightedNotes] = useState<FretNote[]>([]);
  const [barreFret, setBarreFret] = useState(0);
  const [isMeasured, setIsMeasured] = useState(false);
  const barreX = useMotionValue(0);
  const fretsContainerRef = useRef<HTMLDivElement>(null);
  const fretsContainerWidthRef = useRef(0);
  const instrumentRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (fretsContainerRef.current) {
        fretsContainerWidthRef.current = fretsContainerRef.current.offsetWidth;
        setIsMeasured(true);
    }
  }, []); // Only run once after mount, as pianoMode is undefined here

  // Motion values for 3D Tilt
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7deg", "-7deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7deg", "7deg"]);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!instrumentRef.current) return;
    const rect = instrumentRef.current.getBoundingClientRect();

    const width = rect.width;
    const height = rect.height;

    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  // Safe localStorage helpers (prevents crashes on malformed/corrupted values)
  const readJson = <T,>(key: string, fallback: T): T => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  };

  const readString = (key: string, fallback: string): string => {
    try {
      const raw = localStorage.getItem(key);
      return raw ?? fallback;
    } catch {
      return fallback;
    }
  };

  const readInt = (key: string, fallback: number): number => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      const n = parseInt(raw, 10);
      return Number.isFinite(n) ? n : fallback;
    } catch {
      return fallback;
    }
  };

  const [pianoMode, setPianoMode] = useState(() => readJson<boolean>('piano-mode', false));
  const [pianoNotes, setPianoNotes] = useState<number[]>([]);
  const [keyboardEnabled, setKeyboardEnabled] = useState(() => readJson<boolean>('keyboard-enabled', true));
  const [keymap, setKeymap] = useState<KeymapConfig>(() => readJson<KeymapConfig>('keyboard-keymap', DEFAULT_KEYMAP));
  const [strumSpeed, setStrumSpeed] = useState(() => readInt('keyboard-strum-speed', 30));
  const [velocityProfile, setVelocityProfile] = useState<'linear' | 'exponential' | 'uniform'>(() => {
    const saved = readString('keyboard-velocity-profile', 'exponential');
    return (saved as 'linear' | 'exponential' | 'uniform') || 'exponential';
  });
  const [chordMode, setChordMode] = useState(() => readJson<boolean>('keyboard-chord-mode', false));
  const [pianoKeyboardPreset, setPianoKeyboardPreset] = useState<KeyboardPreset>(() => {
    const saved = readString('piano-keyboard-preset', 'qwerty');
    return (saved as KeyboardPreset) || 'qwerty';
  });
  const [detectionStrictness, setDetectionStrictness] = useState<DetectionStrictness>(() => {
    const saved = readString('chord-detection-strictness', 'lenient');
    return (saved as DetectionStrictness) || 'lenient';
  });
  const [maxCandidates, setMaxCandidates] = useState(() => readInt('chord-max-candidates', 3));
  const [showHelp, setShowHelp] = useState(false);
  const [showDebug] = useState(false);

  // UX: scale overlay + hover preview (fretboard mode)
  const [scaleOverlayEnabled, setScaleOverlayEnabled] = useState(() => readJson<boolean>('scale-overlay-enabled', false));
  const [scaleRoot, setScaleRoot] = useState(() => readString('scale-root', 'C'));
  const [scaleType, setScaleType] = useState(() => readString('scale-type', 'Major (Ionian)'));
  const [showIntervals, setShowIntervals] = useState(() => readJson<boolean>('scale-show-intervals', false));
  const [focusScale, setFocusScale] = useState(() => readJson<boolean>('scale-focus', false));
  const [hoverPreviewEnabled, setHoverPreviewEnabled] = useState(() => readJson<boolean>('hover-preview-enabled', true));
  const [hovered, setHovered] = useState<{ string: number; fret: number } | null>(null);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('keyboard-enabled', JSON.stringify(keyboardEnabled));
  }, [keyboardEnabled]);

  useEffect(() => {
    localStorage.setItem('keyboard-keymap', JSON.stringify(keymap));
  }, [keymap]);

  useEffect(() => {
    localStorage.setItem('keyboard-strum-speed', strumSpeed.toString());
  }, [strumSpeed]);

  useEffect(() => {
    localStorage.setItem('keyboard-velocity-profile', velocityProfile);
  }, [velocityProfile]);

  useEffect(() => {
    localStorage.setItem('keyboard-chord-mode', JSON.stringify(chordMode));
  }, [chordMode]);

  useEffect(() => {
    localStorage.setItem('piano-mode', JSON.stringify(pianoMode));
  }, [pianoMode]);

  useEffect(() => {
    localStorage.setItem('piano-keyboard-preset', pianoKeyboardPreset);
  }, [pianoKeyboardPreset]);

  useEffect(() => {
    localStorage.setItem('chord-detection-strictness', detectionStrictness);
  }, [detectionStrictness]);

  useEffect(() => {
    localStorage.setItem('chord-max-candidates', maxCandidates.toString());
  }, [maxCandidates]);

  useEffect(() => {
    localStorage.setItem('scale-overlay-enabled', JSON.stringify(scaleOverlayEnabled));
  }, [scaleOverlayEnabled]);

  useEffect(() => {
    localStorage.setItem('scale-root', scaleRoot);
  }, [scaleRoot]);

  useEffect(() => {
    localStorage.setItem('scale-type', scaleType);
  }, [scaleType]);

  useEffect(() => {
    localStorage.setItem('scale-show-intervals', JSON.stringify(showIntervals));
  }, [showIntervals]);

  useEffect(() => {
    localStorage.setItem('scale-focus', JSON.stringify(focusScale));
  }, [focusScale]);

  useEffect(() => {
    localStorage.setItem('hover-preview-enabled', JSON.stringify(hoverPreviewEnabled));
  }, [hoverPreviewEnabled]);

  // Handle Enter key to strum fretboard notes
  // (moved below strum helpers to avoid reference order issues)

  // Fretboard keyboard integration
  const { activeNotes: keyboardActiveNotes } = useKeyboardFretboard({
    enabled: keyboardEnabled && !pianoMode,
    keymap,
    strumSpeed,
    velocityProfile,
    chordMode,
    onNoteOn: (note, _velocity, position) => {
      const exists = highlightedNotes.some(
        n => n.string === position.string && n.fret === position.fret
      );
      if (!exists) {
        setHighlightedNotes(prev => [
          ...prev,
          { string: position.string, fret: position.fret, note }
        ]);
      }
    },
    onNoteOff: (_note, position) => {
      setHighlightedNotes(prev =>
        prev.filter(n => !(n.string === position.string && n.fret === position.fret))
      );
    },
  });

  // Piano keyboard integration
  const pianoKeymapConfig = pianoKeyboardPreset === 'azerty' ? AZERTY_KEYMAP : QWERTY_KEYMAP;
  const {
    activeNotes: pianoActiveNotes,
    octaveShift: pianoOctaveShift,
    sustained,
    setSustain: setSustained,
    setOctaveShift: setPianoOctaveShift,
    toggleSustain,
    playMidiNote
  } = usePianoKeyboard({
    enabled: keyboardEnabled && pianoMode,
    keymap: pianoKeymapConfig,
    onNoteOn: (midiNote, _velocity) => {
      // Prevent duplicates in state (can happen with key-repeat, focus glitches, sustain transitions)
      setPianoNotes(prev => (prev.includes(midiNote) ? prev : [...prev, midiNote]));
    },
    onNoteOff: (midiNote) => {
      setPianoNotes(prev => prev.filter(n => n !== midiNote));
    },
  });

  // Advanced chord detection
  const chordDetectionResult = useMemo(() => {
    let midiNotes: number[];
    let noteNames: string[];

    if (pianoMode) {
      // Piano mode: use MIDI notes directly
      midiNotes = [...new Set(pianoNotes)];
      noteNames = midiNotes.map(midi => pitchClassToNote(midiToPitchClass(midi)));
    } else {
      // Fretboard mode: convert fretboard positions to MIDI
      if (highlightedNotes.length === 0) {
        return { candidates: [], midiNotes: [], noteNames: [] };
      }
      midiNotes = fretboardNotesToMidi(highlightedNotes);
      noteNames = [...new Set(highlightedNotes.map(n => n.note))];
    }

    const candidates = detectChords(midiNotes, {
      strictness: detectionStrictness,
      maxCandidates,
      allowInversions: true,
      minNotes: 2,
    });

    return { candidates, midiNotes, noteNames };
  }, [highlightedNotes, pianoNotes, pianoMode, detectionStrictness, maxCandidates]);

  const getNoteAtFret = (stringIndex: number, fret: number): string => {
    const openNote = NOTES[stringIndex];
    const openNoteIndex = CHROMATIC.indexOf(openNote);
    const noteIndex = (openNoteIndex + fret) % 12;
    return CHROMATIC[noteIndex];
  };

  const getNotesForFret = useCallback((fret: number): FretNote[] => {
    return NOTES.map((_, stringIndex) => ({
      string: stringIndex,
      fret: fret,
      note: getNoteAtFret(stringIndex, fret)
    }));
  }, [getNoteAtFret]);

  const toggleFret = (fretToToggle: number) => {
    const notesForFret = getNotesForFret(fretToToggle);

    setHighlightedNotes(prev => {
      const prevIdentifiers = new Set(prev.map(n => `${n.string}-${n.fret}`));
      const notesForFretIdentifiers = notesForFret.map(n => `${n.string}-${n.fret}`);

      const allNotesOnFretSelected = notesForFretIdentifiers.every(id => prevIdentifiers.has(id));

      if (allNotesOnFretSelected) {
        // Deselect all notes on this fret
        const notesForFretSet = new Set(notesForFretIdentifiers);
        return prev.filter(n => !notesForFretSet.has(`${n.string}-${n.fret}`));
      } else {
        // Select all notes on this fret, ensuring no duplicates are added to the overall state
        const notesToAdd = notesForFret.filter(note =>
          !prev.some(n => n.string === note.string && n.fret === note.fret)
        );
        return [...prev, ...notesToAdd];
      }
    });
  };

  // Link drag position to barre fret state
  useEffect(() => {
    const unsubscribe = barreX.onChange(latestX => {
        if (fretsContainerWidthRef.current > 0) {
            const fretPlusNutWidth = fretsContainerWidthRef.current / (FRETS + 1);
            const handleCenter = latestX + (28 / 2); // 28px is handle width, find center
            const currentFret = Math.max(0, Math.min(FRETS, Math.floor(handleCenter / fretPlusNutWidth)));
            setBarreFret(currentFret);
        }
    });
    return () => unsubscribe();
  }, [barreX]);

  const handleDragEnd = () => {
      if (fretsContainerWidthRef.current > 0) {
          const fretPlusNutWidth = fretsContainerWidthRef.current / (FRETS + 1);
          const targetX = barreFret * fretPlusNutWidth;
          animate(barreX, targetX, { type: 'spring', stiffness: 500, damping: 30 });
      }
  };

  const handleTap = () => {
      toggleFret(barreFret);
  };

  // When a chord voicing is provided (e.g. from the Chords page),
  // pre-populate the highlighted notes on the fretboard so the shape
  // is immediately visualized for the user.
  // Also ensure we're in guitar mode (not piano mode) when a chord is passed.
  useEffect(() => {
    if (!initialChordVoicing || initialChordVoicing.length !== NOTES.length) return;

    // Force guitar mode when a chord is provided
    setPianoMode(false);

    const next: FretNote[] = [];
    initialChordVoicing.forEach((fret, stringIndex) => {
      if (fret < 0) return;
      const note = getNoteAtFret(stringIndex, fret);
      next.push({ string: stringIndex, fret, note });
    });

    setHighlightedNotes(next);
  }, [initialChordVoicing]);

  const isNoteHighlighted = (stringIndex: number, fret: number): boolean => {
    return highlightedNotes.some(
      (n) => n.string === stringIndex && n.fret === fret
    );
  };

  const isNoteHovered = (stringIndex: number, fret: number): boolean => {
    return hovered?.string === stringIndex && hovered?.fret === fret;
  };

  const getScaleContext = useMemo(() => {
    const rootIndex = CHROMATIC.indexOf(scaleRoot);
    const intervals = SCALE_DEFS[scaleType] ?? SCALE_DEFS["Major (Ionian)"];

    if (!scaleOverlayEnabled || rootIndex < 0) {
      return { enabled: false as const, rootIndex: -1, intervals: [], pcs: new Set<number>() };
    }

    const pcs = new Set<number>(intervals.map(i => (rootIndex + i) % 12));
    return { enabled: true as const, rootIndex, intervals, pcs };
  }, [scaleOverlayEnabled, scaleRoot, scaleType]);

  const getScaleLabelForNote = (noteName: string): string | null => {
    if (!getScaleContext.enabled) return null;
    const noteIdx = CHROMATIC.indexOf(noteName);
    if (noteIdx < 0) return null;
    if (!getScaleContext.pcs.has(noteIdx)) return null;

    if (!showIntervals) return noteName;

    const semis = (noteIdx - getScaleContext.rootIndex + 12) % 12;
    return INTERVAL_LABELS[semis] ?? noteName;
  };

  const isKeyboardActive = (stringIndex: number, fret: number): boolean => {
    return keyboardActiveNotes.some(
      ([, pos]) => pos.string === stringIndex && pos.fret === fret
    );
  };

  const getActiveKey = (stringIndex: number, fret: number): string | undefined => {
    const active = keyboardActiveNotes.find(
      ([, pos]) => pos.string === stringIndex && pos.fret === fret
    );
    return active?.[0];
  };

  const toggleNote = (stringIndex: number, fret: number) => {
    const note = getNoteAtFret(stringIndex, fret);

    // Decide add/remove based on the same snapshot of state used for the update
    let shouldPlay = false;

    setHighlightedNotes(prev => {
      const exists = prev.some(n => n.string === stringIndex && n.fret === fret);
      if (exists) {
        shouldPlay = false;
        return prev.filter(n => !(n.string === stringIndex && n.fret === fret));
      }

      shouldPlay = true;
      return [...prev, { string: stringIndex, fret, note }];
    });

    if (shouldPlay) {
      const freq = getNoteFrequency(stringIndex, fret);
      playNote(freq, 1.2, 0.35, 'piano');
    }
  };

  const clearHighlights = () => {
    setHighlightedNotes([]);
    setPianoNotes([]);
  };

  /* 
  const getVelocity = useCallback((index: number, total: number): number => {
    const position = index / Math.max(total - 1, 1);

    if (velocityProfile === 'uniform') {
      return 0.4;
    }

    if (velocityProfile === 'linear') {
      return 0.2 + position * 0.3;
    }

    // Exponential velocity profile for natural dynamics (default)
    return 0.2 + Math.pow(position, 1.5) * 0.3;
  }, [velocityProfile]);
  */

  const getStrumPattern = useCallback((): (FretNote & { indexInStrum: number })[] => {
    // Build a per-string pattern from the *actual* highlighted fretboard positions.
    // If multiple frets are selected on a single string, pick the highest fret (furthest from the nut)
    // as it overrides lower frets on the same string.
    const byString = new Map<number, FretNote>();

    for (const n of highlightedNotes) {
      const existing = byString.get(n.string);
      if (!existing || n.fret > existing.fret) {
        byString.set(n.string, n);
      }
    }

    // Strum order should follow guitar strings:
    // 0..5 == Low E -> High E (down-strum)
    const ordered: FretNote[] = [];
    for (let s = 0; s < NOTES.length; s++) {
      const note = byString.get(s);
      if (note) ordered.push(note);
    }

    return ordered.map((note, idx) => ({ ...note, indexInStrum: idx }));
  }, [highlightedNotes]);

  const getNoteFrequency = useCallback((stringIndex: number, fret: number): number => {
    const base = STRING_BASE_FREQ[stringIndex] ?? 110; // fallback A2
    return base * Math.pow(2, fret / 12);
  }, []);

  const previewNote = useCallback((stringIndex: number, fret: number) => {
    const freq = getNoteFrequency(stringIndex, fret);
    playNote(freq, 0.5, 0.25, 'piano');
  }, [getNoteFrequency]);

  const strumDown = useCallback(() => {
    const pattern = getStrumPattern();
    if (pattern.length === 0) return;

    // Convert pattern to a 6-fret array for playChord
    const frets = [-1, -1, -1, -1, -1, -1];
    pattern.forEach(p => {
      frets[p.string] = p.fret;
    });

    // Use optimized playChord with arpeggiation and correct timing
    playChord(frets, 0.45, 'piano', 'down');
  }, [getStrumPattern]);

  const strumUp = useCallback(() => {
    const pattern = getStrumPattern();
    if (pattern.length === 0) return;

    const frets = [-1, -1, -1, -1, -1, -1];
    pattern.forEach(p => {
      frets[p.string] = p.fret;
    });

    // Use optimized playChord for upstrum
    playChord(frets, 0.45, 'piano', 'up');
  }, [getStrumPattern]);

  // Allow Enter to strum highlighted frets when keyboard control is off
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Always prevent Enter and Space from scrolling the page when interacting with the instrument
      if (e.key === 'Enter' || e.code === 'Enter' || e.code === 'Space') {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable) {
          e.preventDefault();
          e.stopPropagation();
        }
      }

      if (pianoMode) return;

      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Handle Enter (Strum) for Fretboard - Always active regardless of keyboardEnabled state
      if (e.key === 'Enter' || e.code === 'Enter') {
        if (e.shiftKey) {
          strumUp();
        } else {
          strumDown();
        }
        return;
      }

      if (keyboardEnabled) return; // ignore other keys if keyboard hook is handling them
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pianoMode, keyboardEnabled, strumDown, strumUp]);

  const handlePianoNoteClick = (midiNote: number) => {
    setPianoNotes(prev => {
      if (prev.includes(midiNote)) {
        return prev.filter(n => n !== midiNote);
      } else {
        // Play sound when clicking key in UI
        playMidiNote(midiNote, 0.6);
        return [...prev, midiNote];
      }
    });
  };

  return (
    <div className="relative overflow-visible bg-transparent p-0 perspective-container">
      <div className="relative z-10 p-4 md:p-8">
        {/* Modern Control Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center justify-between gap-6 mb-8 bg-white/[0.03] border border-white/5 p-4 rounded-2xl backdrop-blur-md shadow-2xl"
        >
          <div className="flex items-center p-1.5 bg-black/40 rounded-xl border border-white/5 backdrop-blur-sm self-start">
            <button
              onClick={() => setPianoMode(false)}
              className={cn(
                "relative px-5 py-2 rounded-lg text-sm font-bold transition-all duration-300",
                !pianoMode ? "text-white" : "text-white/40 hover:text-white/70"
              )}
            >
              {!pianoMode && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 bg-white/10 rounded-lg border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Music className="w-3.5 h-3.5" />
                Guitar
              </span>
            </button>
            <button
              onClick={() => setPianoMode(true)}
              className={cn(
                "relative px-5 py-2 rounded-lg text-sm font-bold transition-all duration-300",
                pianoMode ? "text-white" : "text-white/40 hover:text-white/70"
              )}
            >
              {pianoMode && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 bg-white/10 rounded-lg border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Keyboard className="w-3.5 h-3.5" />
                Piano
              </span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Quick Detection Settings */}
            <div className="flex items-center gap-2 bg-white/[0.03] border border-white/5 rounded-xl px-3 py-1.5 focus-within:border-white/20 transition-all shadow-lg">
              <span className="text-[9px] uppercase font-black text-white/30 tracking-widest leading-none">Detection</span>
              <div className="h-4 w-[1px] bg-white/5 mx-1"></div>

              <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setDetectionStrictness(detectionStrictness === 'strict' ? 'lenient' : 'strict')}>
                <span className={cn("text-[10px] font-bold transition-colors", detectionStrictness === 'strict' ? "text-primary" : "text-white/60")}>High Precision</span>
                <Switch
                  checked={detectionStrictness === 'strict'}
                  onCheckedChange={(checked) => setDetectionStrictness(checked ? 'strict' : 'lenient')}
                  className="scale-75"
                />
              </div>

              <div className="h-4 w-[1px] bg-white/5 mx-1"></div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-white/60">Results</span>
                <select
                  value={maxCandidates}
                  onChange={(e) => setMaxCandidates(parseInt(e.target.value))}
                  className="bg-transparent text-[10px] font-bold text-white outline-none cursor-pointer hover:text-primary transition-colors pr-1"
                >
                  <option value="1" className="bg-[#121212]">1</option>
                  <option value="3" className="bg-[#121212]">3</option>
                  <option value="5" className="bg-[#121212]">5</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => setKeyboardEnabled(!keyboardEnabled)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${keyboardEnabled
                ? "bg-primary/20 border-primary/30 text-primary-foreground stroke-primary"
                : "bg-white/5 border-white/10 text-muted-foreground"
                }`}
            >
              <Keyboard className="w-4 h-4" />
              <span>Keyboard {keyboardEnabled ? "Enabled" : "Disabled"}</span>
            </button>

            <div className="h-4 w-[1px] bg-white/10 mx-1 hidden sm:block"></div>

            <button
              onClick={() => setShowHelp(true)}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-muted-foreground hover:text-white hover:bg-white/10 transition-all"
              title="Keyboard Shortcuts"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        {/* Keyboard Help Overlay */}
        <KeyboardHelpOverlay
          keymap={keymap}
          isOpen={showHelp}
          onClose={() => setShowHelp(false)}
        />

        {/* ARIA live region for accessibility */}
        <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {keyboardEnabled && !pianoMode && keyboardActiveNotes.length > 0 && (
            `Playing notes: ${keyboardActiveNotes.map(([key]) => key.toUpperCase()).join(', ')}`
          )}
          {keyboardEnabled && pianoMode && pianoActiveNotes.length > 0 && (
            `Playing piano notes: ${pianoActiveNotes.map(([midi]) => midi).join(', ')}`
          )}
        </div>

        {/* Main instrument display */}
        <motion.div
          ref={instrumentRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            rotateX,
            rotateY,
            transformStyle: "preserve-3d",
          }}
          className="bg-black/40 border border-white/5 rounded-[2rem] p-4 md:p-12 mb-8 backdrop-blur-md shadow-2xl overflow-hidden ring-1 ring-white/10 group transition-all duration-500 ease-out"
        >
          <AnimatePresence mode="wait">
            {pianoMode ? (
              <motion.div
                key="piano"
                initial={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 1.02, filter: "blur(10px)" }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="w-full flex flex-col items-center"
              >
                {/* Piano Play Area */}
                <div className="w-full overflow-x-auto pb-6 custom-scrollbar">
                  <div className="flex justify-center min-w-max px-4">
                    <div className="relative">
                      {/* Background glow for active notes */}
                      {(pianoNotes.length > 0 || pianoActiveNotes.length > 0) && (
                        <div className="absolute -inset-4 bg-primary/20 blur-[80px] opacity-40 z-0 animate-pulse"></div>
                      )}
                      <div className="relative z-10">
                        <PianoKeyboard
                          startOctave={pianoOctaveShift + 4}
                          numOctaves={2}
                          activeNotes={[...new Set([...pianoNotes, ...pianoActiveNotes.map(entry => entry[0])])]}
                          onNoteClick={handlePianoNoteClick}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Controls */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-10 flex flex-wrap items-center justify-center gap-6 p-5 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-md shadow-2xl relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                  <div className="flex items-center gap-3 relative z-10">
                    <div className={cn(
                      "w-2.5 h-2.5 rounded-full transition-all duration-500",
                      sustained ? "bg-primary shadow-[0_0_15px_var(--primary)]" : "bg-white/10"
                    )} />
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Sustain</span>
                    <Switch checked={sustained} onCheckedChange={setSustained} className="scale-90" />
                  </div>

                  <div className="h-5 w-px bg-white/10 hidden sm:block" />

                  <div className="flex items-center gap-5 relative z-10">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Octave Map</span>
                    <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/10 shadow-lg">
                      <motion.button
                        whileHover={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setPianoOctaveShift(prev => Math.max(-2, prev - 1))}
                        className="w-10 h-10 flex items-center justify-center rounded-lg transition-all text-white font-black text-lg"
                      >−</motion.button>
                      <div className="px-6 py-1 bg-white/5 rounded-md mx-1 border border-white/5">
                        <span className="text-sm font-mono font-black text-primary min-w-[3.5rem] text-center drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]">
                          {pianoOctaveShift > 0 ? `+${pianoOctaveShift}` : pianoOctaveShift}
                        </span>
                      </div>
                      <motion.button
                        whileHover={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setPianoOctaveShift(prev => Math.min(2, prev + 1))}
                        className="w-10 h-10 flex items-center justify-center rounded-lg transition-all text-white font-black text-lg"
                      >+</motion.button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="guitar"
                initial={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 1.02, filter: "blur(10px)" }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="relative overflow-x-auto custom-scrollbar"
              >
                <div className="md:hidden text-[10px] text-center text-muted-foreground/50 mb-2 animate-pulse font-mono tracking-widest uppercase">
                  ← Scroll Fretboard →
                </div>
                <div className="min-w-[800px] py-4">
                  {/* Fret markers */}
                  <div className="absolute top-0 left-0 right-0 flex px-12 h-6 items-center">
                    {/* Markers aligned to the same flex grid as the frets */}
                    <div className="w-10" />
                    {Array.from({ length: FRETS }).map((_, fretIdx) => {
                      const fretNumber = fretIdx + 1;
                      return (
                        <div key={fretNumber} className="flex-1 flex justify-center">
                          {fretNumber === 12 ? (
                            <div className="flex flex-col gap-1">
                              <div className="w-1 h-1 rounded-full bg-white/30" />
                              <div className="w-1 h-1 rounded-full bg-white/30" />
                            </div>
                          ) : MARKER_FRETS.has(fretNumber) ? (
                            <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                          ) : null}
                        </div>
                      );
                    })}
                  </div>

                  {/* Fretboard */}
                  <div className="space-y-4 mt-8">
                    {/* Draggable Barre Tool Row */}
                    <div className="flex items-center gap-2 h-10 -mb-4">
                        <div className="w-10 shrink-0" /> {/* Spacer */}
                        <div className="relative flex-1 h-full flex">
                            {/* Invisible snap points */}
                            {Array.from({ length: FRETS + 1 }).map((_, i) => (
                                <div key={i} className="flex-1" />
                            ))}
                            {/* Visual indicator bar that follows the handle */}
                            <motion.div
                                className="absolute top-0 h-full w-1 bg-primary/50 rounded-full pointer-events-none z-20"
                                style={{ x: barreX }}
                            />
                            {/* Draggable Handle */}
                            <motion.div
                                className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-full bg-black/40 border-2 border-dashed border-white/20 hover:border-primary hover:bg-primary/10 transition-colors text-white/50 hover:text-primary cursor-grab active:cursor-grabbing z-30"
                                style={{ x: barreX }}
                                drag={isMeasured ? "x" : false}
                                dragConstraints={isMeasured ? { left: 0, right: fretsContainerWidthRef.current - 28 } : { left: 0, right: 0 }}
                                dragElastic={0.1}
                                onDragEnd={handleDragEnd}
                                onTap={handleTap}
                            >
                                <X className="w-3 h-3" />
                            </motion.div>
                        </div>
                    </div>

                    {NOTES.map((openNote, stringIndex) => (
                      <div key={stringIndex} className="flex items-center gap-2">
                        {/* Open string note */}
                        <div className="w-10 text-center font-bold text-xs text-muted-foreground/50 italic">
                          {openNote}
                        </div>

                        {/* Frets */}
                        <div ref={stringIndex === 0 ? fretsContainerRef : null} className="flex-1 flex items-center relative h-10">
                          {/* String line */}
                          <div
                            className="absolute left-0 right-0 h-[1.5px] bg-white/10"
                            style={{ top: "50%" }}
                          />

                          {/* Nut (fret 0) */}
                          <div className="relative w-10 h-10 flex items-center justify-center">
                            {(() => {
                              const note = getNoteAtFret(stringIndex, 0);
                              const scaleLabel = getScaleLabelForNote(note);
                              const isInScale = getScaleContext.enabled && !!scaleLabel;
                              const isRoot = isInScale && note === scaleRoot;
                              const isDimmed = getScaleContext.enabled && focusScale && !isInScale;
                              const isActive = isKeyboardActive(stringIndex, 0);
                              const isHighlighted = isNoteHighlighted(stringIndex, 0);
                              const isHovered = isNoteHovered(stringIndex, 0);

                              return (
                                <motion.button
                                  whileHover={{ scale: 1.15, shadow: "0 0 20px rgba(255,255,255,0.2)" }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => toggleNote(stringIndex, 0)}
                                  onMouseEnter={() => {
                                    setHovered({ string: stringIndex, fret: 0 });
                                    if (!pianoMode && hoverPreviewEnabled) previewNote(stringIndex, 0);
                                  }}
                                  onMouseLeave={() => setHovered(null)}
                                  className={cn(
                                    "relative w-9 h-9 rounded-full border-2 transition-all duration-300 group z-10",
                                    isHighlighted
                                      ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.5)]"
                                      : isActive
                                        ? "bg-primary border-primary text-primary-foreground shadow-[0_0_20px_hsla(var(--primary),0.5)]"
                                        : isInScale
                                          ? isRoot
                                            ? "border-primary bg-primary/30 text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.3)]"
                                            : "border-accent/60 bg-accent/20 text-white hover:border-accent"
                                          : isDimmed
                                            ? "border-white/5 opacity-20 filter grayscale"
                                            : "border-white/10 hover:border-white/30 bg-white/5 text-white/70",
                                    isHovered && !isDimmed ? "ring-2 ring-white/20 ring-offset-2 ring-offset-black/50" : ""
                                  )}
                                >
                                  <motion.span
                                    layout
                                    className={cn(
                                      "text-[11px] font-black transition-opacity",
                                      isDimmed ? "opacity-0" : "opacity-100",
                                      isHighlighted ? "text-black" : ""
                                    )}
                                  >
                                    {getScaleContext.enabled && showIntervals ? (scaleLabel ?? note) : note}
                                  </motion.span>
                                  {isActive && (
                                    <motion.span
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-black text-primary uppercase tracking-tighter bg-black/90 px-1.5 rounded shadow-xl border border-primary/20"
                                    >
                                      {getActiveKey(stringIndex, 0)}
                                    </motion.span>
                                  )}
                                </motion.button>
                              );
                            })()}
                          </div>

                          {/* Frets 1-12 */}
                          {Array.from({ length: FRETS }).map((_, fret) => {
                            const fretNumber = fret + 1;
                            const note = getNoteAtFret(stringIndex, fretNumber);
                            const scaleLabel = getScaleLabelForNote(note);
                            const isInScale = getScaleContext.enabled && !!scaleLabel;
                            const isRoot = isInScale && note === scaleRoot;
                            const isDimmed = getScaleContext.enabled && focusScale && !isInScale;
                            const isActive = isKeyboardActive(stringIndex, fretNumber);
                            const isHighlighted = isNoteHighlighted(stringIndex, fretNumber);
                            const isHovered = isNoteHovered(stringIndex, fretNumber);

                            return (
                              <div key={fretNumber} className="relative flex-1 flex items-center justify-center h-10">
                                {/* Fret wire */}
                                <div className="absolute left-0 w-[1.5px] h-10 bg-white/10" />

                                <motion.button
                                  whileHover={{ scale: 1.15, shadow: "0 0 20px rgba(255,255,255,0.2)" }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => toggleNote(stringIndex, fretNumber)}
                                  onMouseEnter={() => {
                                    setHovered({ string: stringIndex, fret: fretNumber });
                                    if (!pianoMode && hoverPreviewEnabled) previewNote(stringIndex, fretNumber);
                                  }}
                                  onMouseLeave={() => setHovered(null)}
                                  className={cn(
                                    "relative w-9 h-9 rounded-full border-2 transition-all duration-300 group z-10",
                                    isHighlighted
                                      ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.5)]"
                                      : isActive
                                        ? "bg-primary border-primary text-primary-foreground shadow-[0_0_20px_hsla(var(--primary),0.5)]"
                                        : isInScale
                                          ? isRoot
                                            ? "border-primary bg-primary/30 text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.3)]"
                                            : "border-accent/60 bg-accent/20 text-white hover:border-accent"
                                          : isDimmed
                                            ? "border-white/5 opacity-20 filter grayscale"
                                            : "border-white/10 hover:border-white/30 bg-white/5 text-white/70",
                                    isHovered && !isDimmed ? "ring-2 ring-white/20 ring-offset-2 ring-offset-black/50" : ""
                                  )}
                                >
                                  <motion.span
                                    layout
                                    className={cn(
                                      "text-[11px] font-black transition-opacity",
                                      isDimmed ? "opacity-0" : "opacity-100",
                                      isHighlighted ? "text-black" : ""
                                    )}
                                  >
                                    {getScaleContext.enabled && showIntervals ? (scaleLabel ?? note) : note}
                                  </motion.span>
                                  {isActive && (
                                    <motion.span
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-black text-primary uppercase tracking-tighter bg-black/90 px-1.5 rounded shadow-xl border border-primary/20"
                                    >
                                      {getActiveKey(stringIndex, fretNumber)}
                                    </motion.span>
                                  )}
                                </motion.button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    {/* Fret numbers */}
                    <div className="flex items-center gap-2 mt-6 pl-12">
                      <div className="w-10 text-center text-[10px] font-bold text-muted-foreground/30">0</div>
                      {Array.from({ length: FRETS }).map((_, i) => (
                        <div
                          key={i}
                          className="flex-1 text-center text-[10px] font-bold text-muted-foreground/30"
                        >
                          {i + 1}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Dynamic Status/Detection Bar */}
        {(highlightedNotes.length > 0 || pianoNotes.length > 0) && (
          <div className="mt-8 pt-6 border-t border-white/5 mb-8">
            <ChordDetectionPanel
              candidates={chordDetectionResult.candidates}
              selectedNotes={chordDetectionResult.noteNames}
            />
          </div>
        )}

        {/* Modern Settings Panel (Moved to bottom) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-12">
          {/* Mode-specific settings */}
          {pianoMode ? (
            <div className="glass-card rounded-2xl p-6 border-primary/30 shadow-xl">
              <PianoSettings
                keyboardPreset={pianoKeyboardPreset}
                onKeyboardPresetChange={setPianoKeyboardPreset}
                sustained={sustained}
                onSustainChange={toggleSustain}
                onClear={clearHighlights}
                octaveShift={pianoOctaveShift}
              />
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-6 border-primary/30 shadow-xl" role="region" aria-label="Keyboard settings">
              <KeyboardSettings
                keymap={keymap}
                strumSpeed={strumSpeed}
                velocityProfile={velocityProfile}
                chordMode={chordMode}
                onKeymapChange={setKeymap}
                onStrumSpeedChange={setStrumSpeed}
                onVelocityProfileChange={setVelocityProfile}
                onChordModeChange={setChordMode}
              />
            </div>
          )}

          {/* Scale Theory Settings */}
          <div className="glass-card rounded-2xl p-6 border-primary/30 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Search className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-white tracking-tight">Theory & Visuals</h3>
            </div>

            <div className="space-y-6">
              {/* UX settings (fretboard mode) */}
              {!pianoMode ? (
                <div className="space-y-5">
                  <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-semibold text-white">Scale overlay</Label>
                      <p className="text-[11px] text-muted-foreground">Highlight scale tones across the fretboard.</p>
                    </div>
                    <Switch checked={scaleOverlayEnabled} onCheckedChange={setScaleOverlayEnabled} />
                  </div>

                  {scaleOverlayEnabled && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Scale root</Label>
                          <Select value={scaleRoot} onValueChange={setScaleRoot}>
                            <SelectTrigger className="bg-white/5 border-white/10 hover:border-white/20 transition-colors h-10">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CHROMATIC.map(n => (
                                <SelectItem key={n} value={n}>{n}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Scale type</Label>
                          <Select value={scaleType} onValueChange={setScaleType}>
                            <SelectTrigger className="bg-white/5 border-white/10 hover:border-white/20 transition-colors h-10">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.keys(SCALE_DEFS).map(name => (
                                <SelectItem key={name} value={name}>{name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                        <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg hover:bg-white/[0.02] transition-colors">
                          <div>
                            <p className="text-sm font-medium text-white/90">Show intervals</p>
                            <p className="text-[10px] text-muted-foreground">Display R, b3, 5… instead of note names.</p>
                          </div>
                          <Switch checked={showIntervals} onCheckedChange={setShowIntervals} />
                        </div>

                        <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg hover:bg-white/[0.02] transition-colors">
                          <div>
                            <p className="text-sm font-medium text-white/90">Highlight mode</p>
                            <p className="text-[10px] text-muted-foreground">Dim notes that are not in the selected scale.</p>
                          </div>
                          <Switch checked={focusScale} onCheckedChange={setFocusScale} />
                        </div>

                        <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg hover:bg-white/[0.02] transition-colors">
                          <div>
                            <p className="text-sm font-medium text-white/90">Hover preview</p>
                            <p className="text-[10px] text-muted-foreground">Hover a fret to preview its sound.</p>
                          </div>
                          <Switch checked={hoverPreviewEnabled} onCheckedChange={setHoverPreviewEnabled} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 opacity-50">
                  <Music className="w-12 h-12 text-muted-foreground/20" />
                  <p className="text-sm text-muted-foreground max-w-[200px]">Theory overlays are optimized for Fretboard mode.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showDebug && (
        <div className="mb-8 p-6 rounded-2xl bg-red-950/10 border border-red-500/20 animate-in fade-in slide-in-from-top-4">
          <ChordDebugPanel
            midiNotes={chordDetectionResult.midiNotes}
            candidates={chordDetectionResult.candidates}
            mode={pianoMode ? 'piano' : 'fretboard'}
          />
        </div>
      )}
    </div>
  );
};

export default Fretboard;
