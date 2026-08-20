import { useState, useMemo, useEffect, useCallback, useRef, useLayoutEffect } from "react";
import { 
  Info, Music, Search, ArrowUpDown, Volume2, 
  RotateCcw, Play, Sparkles, SlidersHorizontal, Eye, Guitar as GuitarIcon,
  Check, Share2, Layers
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useKeyboardFretboard } from "@/hooks/useKeyboardFretboard";
import { usePianoKeyboard } from "@/hooks/usePianoKeyboard";
import { KeyboardHelpOverlay } from "./fretboard/KeyboardHelpOverlay";
import { KeyboardSettings } from "./fretboard/KeyboardSettings";
import { PianoKeyboard } from "./piano/PianoKeyboard";
import { PianoSettings } from "./piano/PianoSettings";
import { ChordDetectionPanel } from "./ChordDetectionPanel";
import { ChordDebugPanel } from "./ChordDebugPanel";
import { DEFAULT_KEYMAP, KeymapConfig, FretPosition } from "@/types/keyboardTypes";
import { QWERTY_KEYMAP, AZERTY_KEYMAP, KeyboardPreset } from "@/types/pianoTypes";
import { detectChords, fretboardNotesToMidi, midiToPitchClass, pitchClassToNote } from "@/lib/chordDetection";
import { DetectionStrictness } from "@/types/chordDetectionTypes";
import { playNote, playChord } from "@/lib/chordAudio";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { GUITAR_TUNINGS, COMMON_CHORD_PRESETS } from "@/data/fretboardTunings";

const CHROMATIC: string[] = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const FRETS = 12;
const MARKER_FRETS = new Set([3, 5, 7, 9, 12, 15, 17, 19, 21]);

// Realistic string gauge thicknesses in px (String 0 = Low E ... String 5 = High E)
const STRING_THICKNESSES = [3.6, 2.9, 2.3, 1.7, 1.3, 1.0];

const PITCH_COLORS: Record<string, string> = {
  "C": "bg-rose-500 text-white border-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.6)]",
  "C#": "bg-pink-600 text-white border-pink-400 shadow-[0_0_12px_rgba(219,39,119,0.6)]",
  "D": "bg-orange-500 text-white border-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.6)]",
  "D#": "bg-amber-600 text-white border-amber-400 shadow-[0_0_12px_rgba(217,119,6,0.6)]",
  "E": "bg-yellow-400 text-black border-yellow-300 shadow-[0_0_12px_rgba(250,204,21,0.7)]",
  "F": "bg-emerald-500 text-white border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.6)]",
  "F#": "bg-teal-500 text-white border-teal-400 shadow-[0_0_12px_rgba(20,184,166,0.6)]",
  "G": "bg-cyan-500 text-black border-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.7)]",
  "G#": "bg-sky-500 text-white border-sky-400 shadow-[0_0_12px_rgba(14,165,233,0.6)]",
  "A": "bg-blue-500 text-white border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.6)]",
  "A#": "bg-indigo-500 text-white border-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.6)]",
  "B": "bg-purple-500 text-white border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.6)]",
};

const SCALE_DEFS: Record<string, number[]> = {
  "Major (Ionian)": [0, 2, 4, 5, 7, 9, 11],
  "Minor (Aeolian)": [0, 2, 3, 5, 7, 8, 10],
  "Pentatonic Major": [0, 2, 4, 7, 9],
  "Pentatonic Minor": [0, 3, 5, 7, 10],
  "Blues": [0, 3, 5, 6, 7, 10],
  "Dorian": [0, 2, 3, 5, 7, 9, 10],
  "Mixolydian": [0, 2, 4, 5, 7, 9, 10],
  "Harmonic Minor": [0, 2, 3, 5, 7, 8, 11],
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

export type NoteDisplayMode = "clean" | "scale" | "all" | "intervals" | "colors";

interface FretNote {
  string: number;
  fret: number;
  note: string;
}

// Safe localStorage helpers
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

type FretboardProps = {
  initialChordVoicing?: number[] | null;
};

const Fretboard = ({ initialChordVoicing }: FretboardProps) => {
  const [highlightedNotes, setHighlightedNotes] = useState<FretNote[]>([]);
  const [selectedTuningId, setSelectedTuningId] = useState<string>("standard");
  const [capoFret, setCapoFret] = useState<number>(0);
  const [displayMode, setDisplayMode] = useState<NoteDisplayMode>(() => {
    const saved = readString('fretboard-display-mode', 'clean');
    return (saved as NoteDisplayMode) || 'clean';
  });
  const [isLefty, setIsLefty] = useState<boolean>(() => readJson<boolean>('fretboard-lefty', false));
  const [copiedLink, setCopiedLink] = useState(false);

  const activeTuning = useMemo(() => {
    return GUITAR_TUNINGS.find(t => t.id === selectedTuningId) || GUITAR_TUNINGS[0];
  }, [selectedTuningId]);

  const NOTES = activeTuning.notes;
  const STRING_BASE_FREQ = activeTuning.baseFreqs;

  const fretsContainerRef = useRef<HTMLDivElement>(null);
  const instrumentRef = useRef<HTMLDivElement>(null);

  const [pianoMode, setPianoMode] = useState(() => readJson<boolean>('piano-mode', false));
  const [pianoNotes, setPianoNotes] = useState<number[]>([]);
  const [keyboardEnabled] = useState(() => readJson<boolean>('keyboard-enabled', true));
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
  const [detectionStrictness] = useState<DetectionStrictness>(() => {
    const saved = readString('chord-detection-strictness', 'lenient');
    return (saved as DetectionStrictness) || 'lenient';
  });
  const [maxCandidates] = useState(() => readInt('chord-max-candidates', 3));
  const [showKeymapHints, setShowKeymapHints] = useState<boolean>(() => readJson<boolean>('piano-keymap-hints', true));
  const [showHelp, setShowHelp] = useState(false);
  const [showDebug] = useState(false);

  useEffect(() => {
    localStorage.setItem('piano-keymap-hints', JSON.stringify(showKeymapHints));
  }, [showKeymapHints]);

  // Scale overlay state
  const [scaleOverlayEnabled, setScaleOverlayEnabled] = useState(() => readJson<boolean>('scale-overlay-enabled', false));
  const [scaleRoot, setScaleRoot] = useState(() => readString('scale-root', 'C'));
  const [scaleType, setScaleType] = useState(() => readString('scale-type', 'Major (Ionian)'));
  const [showIntervals] = useState(() => readJson<boolean>('scale-show-intervals', false));
  const [focusScale, setFocusScale] = useState(() => readJson<boolean>('scale-focus', false));
  const [hoverPreviewEnabled, setHoverPreviewEnabled] = useState(() => readJson<boolean>('hover-preview-enabled', true));
  const [hovered, setHovered] = useState<{ string: number; fret: number } | null>(null);
  const [flipStrings, setFlipStrings] = useState(() => readJson<boolean>('fretboard-flip-strings', false));

  useLayoutEffect(() => {
    // Layout sync if needed
  }, [pianoMode]);

  useEffect(() => {
    localStorage.setItem('fretboard-display-mode', displayMode);
  }, [displayMode]);

  useEffect(() => {
    localStorage.setItem('fretboard-lefty', JSON.stringify(isLefty));
  }, [isLefty]);

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
    localStorage.setItem('piano-mode', JSON.stringify(pianoMode));
  }, [pianoMode]);

  useEffect(() => {
    localStorage.setItem('fretboard-flip-strings', JSON.stringify(flipStrings));
  }, [flipStrings]);

  const getNoteAtFret = useCallback((stringIndex: number, fret: number): string => {
    const openNote = NOTES[stringIndex];
    const openNoteIndex = CHROMATIC.indexOf(openNote);
    const effectiveFret = fret === 0 ? capoFret : fret;
    const noteIndex = (openNoteIndex + effectiveFret) % 12;
    return CHROMATIC[noteIndex];
  }, [NOTES, capoFret]);

  const getNoteFrequency = useCallback((stringIndex: number, fret: number): number => {
    const base = STRING_BASE_FREQ[stringIndex] ?? 110;
    const effectiveFret = fret === 0 ? capoFret : fret;
    return base * Math.pow(2, effectiveFret / 12);
  }, [STRING_BASE_FREQ, capoFret]);

  // Fretboard keyboard integration
  const { activeNotes: keyboardActiveNotes } = useKeyboardFretboard({
    enabled: keyboardEnabled && !pianoMode,
    keymap,
    strumSpeed,
    velocityProfile,
    chordMode,
    onNoteOn: (_note: string, velocity: number, position: FretPosition) => {
      const freq = getNoteFrequency(position.string, position.fret);
      playNote(freq, 1.2, velocity * 0.4, 'piano');
    },
  });

  // Piano mode keyboard integration
  const {
    activeNotes: pianoActiveNotes,
    sustained,
    setSustain,
    toggleSustain,
    octaveShift: pianoOctaveShift,
    setOctaveShift: setPianoOctaveShift,
  } = usePianoKeyboard({
    enabled: keyboardEnabled && pianoMode,
    keymap: pianoKeyboardPreset === 'azerty' ? AZERTY_KEYMAP : QWERTY_KEYMAP,
    onNoteOn: (midi: number, velocity: number) => {
      const freq = 440 * Math.pow(2, (midi - 69) / 12);
      playNote(freq, sustained ? 3.0 : 1.2, velocity * 0.5, 'piano');
    },
  });

  // When initial voicing is passed from route
  useEffect(() => {
    if (!initialChordVoicing || initialChordVoicing.length !== NOTES.length) return;
    setPianoMode(false);
    const next: FretNote[] = [];
    initialChordVoicing.forEach((fret, stringIndex) => {
      if (fret < 0) return;
      const note = getNoteAtFret(stringIndex, fret);
      next.push({ string: stringIndex, fret, note });
    });
    setHighlightedNotes(next);
  }, [initialChordVoicing, getNoteAtFret, NOTES.length]);

  const isNoteHighlighted = useCallback((stringIndex: number, fret: number): boolean => {
    return highlightedNotes.some((n) => n.string === stringIndex && n.fret === fret);
  }, [highlightedNotes]);

  const isNoteHovered = useCallback((stringIndex: number, fret: number): boolean => {
    return hovered?.string === stringIndex && hovered?.fret === fret;
  }, [hovered]);

  const getScaleContext = useMemo(() => {
    const rootIndex = CHROMATIC.indexOf(scaleRoot);
    const intervals = SCALE_DEFS[scaleType] ?? SCALE_DEFS["Major (Ionian)"];

    if ((!scaleOverlayEnabled && displayMode !== "scale") || rootIndex < 0) {
      return { enabled: false as const, rootIndex: -1, intervals: [], pcs: new Set<number>() };
    }

    const pcs = new Set<number>(intervals.map(i => (rootIndex + i) % 12));
    return { enabled: true as const, rootIndex, intervals, pcs };
  }, [scaleOverlayEnabled, displayMode, scaleRoot, scaleType]);

  const getScaleLabelForNote = useCallback((noteName: string): string | null => {
    if (!getScaleContext.enabled) return null;
    const noteIdx = CHROMATIC.indexOf(noteName);
    if (noteIdx < 0 || !getScaleContext.pcs.has(noteIdx)) return null;

    if (displayMode === "intervals" || showIntervals) {
      const semis = (noteIdx - getScaleContext.rootIndex + 12) % 12;
      return INTERVAL_LABELS[semis] ?? noteName;
    }
    return noteName;
  }, [getScaleContext, displayMode, showIntervals]);

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

  const toggleNote = useCallback((stringIndex: number, fret: number) => {
    const note = getNoteAtFret(stringIndex, fret);
    let shouldPlay = false;

    setHighlightedNotes(prev => {
      // If clicking already selected fret on this string, remove it
      const exists = prev.some(n => n.string === stringIndex && n.fret === fret);
      if (exists) {
        shouldPlay = false;
        return prev.filter(n => !(n.string === stringIndex && n.fret === fret));
      }

      // Filter out any other fret on the same string so 1 string = 1 note (realistic guitar fingering)
      const others = prev.filter(n => n.string !== stringIndex);
      shouldPlay = true;
      return [...others, { string: stringIndex, fret, note }];
    });

    if (shouldPlay) {
      const freq = getNoteFrequency(stringIndex, fret);
      playNote(freq, 1.2, 0.4, 'piano');
    }
  }, [getNoteAtFret, getNoteFrequency]);

  const clearHighlights = useCallback(() => {
    setHighlightedNotes([]);
    setPianoNotes([]);
    toast.success("Cleared fretboard notes");
  }, []);

  const getStrumPattern = useCallback((): (FretNote & { indexInStrum: number })[] => {
    const byString = new Map<number, FretNote>();
    for (const n of highlightedNotes) {
      const existing = byString.get(n.string);
      if (!existing || n.fret > existing.fret) {
        byString.set(n.string, n);
      }
    }
    const ordered: FretNote[] = [];
    for (let s = 0; s < NOTES.length; s++) {
      const note = byString.get(s);
      if (note) ordered.push(note);
    }
    return ordered.map((note, idx) => ({ ...note, indexInStrum: idx }));
  }, [highlightedNotes, NOTES.length]);

  const strumDown = useCallback(() => {
    const pattern = getStrumPattern();
    if (pattern.length === 0) {
      toast.info("Click notes on the fretboard to build a chord first!");
      return;
    }

    const frets = [-1, -1, -1, -1, -1, -1];
    pattern.forEach(p => {
      frets[p.string] = p.fret === 0 ? capoFret : p.fret;
    });

    playChord(frets, 0.45, 'piano', 'down');
  }, [getStrumPattern, capoFret]);

  const arpeggiate = useCallback(() => {
    const pattern = getStrumPattern();
    if (pattern.length === 0) {
      toast.info("Select notes on the fretboard to arpeggiate!");
      return;
    }

    pattern.forEach((p, idx) => {
      setTimeout(() => {
        const freq = getNoteFrequency(p.string, p.fret);
        playNote(freq, 1.5, 0.35, 'piano');
      }, idx * 140);
    });
  }, [getStrumPattern, getNoteFrequency]);

  const previewNote = useCallback((stringIndex: number, fret: number) => {
    const freq = getNoteFrequency(stringIndex, fret);
    playNote(freq, 0.5, 0.25, 'piano');
  }, [getNoteFrequency]);

  const loadPresetChord = useCallback((preset: typeof COMMON_CHORD_PRESETS[0]) => {
    const next: FretNote[] = [];
    preset.frets.forEach((fret, stringIdx) => {
      if (fret >= 0) {
        next.push({
          string: stringIdx,
          fret: fret,
          note: getNoteAtFret(stringIdx, fret)
        });
      }
    });
    setHighlightedNotes(next);
    toast.success(`Loaded ${preset.displayName}`);
    setTimeout(() => {
      playChord(preset.frets, 0.45, 'piano', 'down');
    }, 100);
  }, [getNoteAtFret]);

  const copyShareLink = useCallback(() => {
    const frets = [-1, -1, -1, -1, -1, -1];
    highlightedNotes.forEach(n => {
      frets[n.string] = n.fret;
    });
    const chordStr = frets.join(",");
    const url = `${window.location.origin}/fretboard?frets=${encodeURIComponent(chordStr)}&tuning=${selectedTuningId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    toast.success("Voicing link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2000);
  }, [highlightedNotes, selectedTuningId]);

  // Handle URL query on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fretsParam = params.get("frets");
    const tuningParam = params.get("tuning");
    if (tuningParam && GUITAR_TUNINGS.some(t => t.id === tuningParam)) {
      setSelectedTuningId(tuningParam);
    }
    if (fretsParam) {
      const fretVals = fretsParam.split(",").map(v => parseInt(v, 10));
      if (fretVals.length === 6) {
        const next: FretNote[] = [];
        fretVals.forEach((fret, sIdx) => {
          if (fret >= 0 && !isNaN(fret)) {
            next.push({
              string: sIdx,
              fret,
              note: getNoteAtFret(sIdx, fret)
            });
          }
        });
        if (next.length > 0) setHighlightedNotes(next);
      }
    }
  }, [getNoteAtFret]);

  // Detect chords from highlighted notes
  const { candidates, midiNotes, noteNames } = useMemo(() => {
    const midis = pianoMode
      ? [...new Set([...pianoNotes, ...pianoActiveNotes.map(e => e[0])])]
      : fretboardNotesToMidi(
          highlightedNotes.map(n => ({
            string: n.string,
            fret: n.fret === 0 ? capoFret : n.fret,
          }))
        );

    const detected = detectChords(midis, {
      strictness: detectionStrictness,
      maxCandidates,
      allowInversions: true,
      minNotes: 2,
    });

    const notes = [...new Set(midis.map(midiToPitchClass))].map(pitchClassToNote);

    return {
      candidates: detected,
      midiNotes: midis,
      noteNames: notes,
    };
  }, [pianoMode, pianoNotes, pianoActiveNotes, highlightedNotes, capoFret, detectionStrictness, maxCandidates]);

  const topChord = candidates[0];

  const handlePianoNoteClick = (midiNote: number) => {
    setPianoNotes(prev => {
      const exists = prev.includes(midiNote);
      if (exists) {
        return prev.filter(n => n !== midiNote);
      }
      return [...prev, midiNote];
    });

    const freq = 440 * Math.pow(2, (midiNote - 69) / 12);
    playNote(freq, sustained ? 2.5 : 1.2, 0.4, 'piano');
  };

  const stringIndices = useMemo(() => {
    const indices = NOTES.map((_, i) => i);
    if (flipStrings) indices.reverse();
    return indices;
  }, [NOTES, flipStrings]);

  const fretIndices = useMemo(() => {
    const arr = Array.from({ length: FRETS }, (_, i) => i + 1);
    if (isLefty) arr.reverse();
    return arr;
  }, [isLefty]);

  return (
    <div className="w-full text-foreground select-none">
      {/* Top Main Command Bar */}
      <div className="flex flex-col gap-4 mb-6">
        {/* Row 1: Mode Switcher & Primary Strum Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 md:p-4 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-xl">
          {/* Instrument Toggle */}
          <div className="flex items-center gap-1.5 p-1 bg-black/50 rounded-xl border border-white/10 shadow-inner">
            <button
              onClick={() => setPianoMode(false)}
              className={cn(
                "relative px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 flex items-center gap-2",
                !pianoMode ? "text-white bg-white/15 border border-white/10 shadow-md" : "text-white/40 hover:text-white"
              )}
            >
              <GuitarIcon className="w-4 h-4 text-primary" />
              <span>Guitar Neck</span>
            </button>
            <button
              onClick={() => setPianoMode(true)}
              className={cn(
                "relative px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 flex items-center gap-2",
                pianoMode ? "text-white bg-white/15 border border-white/10 shadow-md" : "text-white/40 hover:text-white"
              )}
            >
              <Music className="w-4 h-4 text-accent" />
              <span>Virtual Piano</span>
            </button>
          </div>

          {/* Strum & Play Action Group */}
          <div className="flex items-center gap-2">
            <Button
              onClick={strumDown}
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs h-9 px-4 shadow-lg shadow-primary/20"
              title="Strum selected notes (Press Enter / Space)"
            >
              <Volume2 className="w-4 h-4" /> Strum Chord
            </Button>
            <Button
              onClick={arpeggiate}
              variant="outline"
              className="gap-2 border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold text-xs h-9 px-3.5"
              title="Play notes individually from low to high"
            >
              <Play className="w-3.5 h-3.5 text-primary" /> Arpeggiate
            </Button>
            <Button
              onClick={clearHighlights}
              variant="ghost"
              className="text-muted-foreground hover:text-white text-xs h-9 px-3"
              title="Clear all selected notes"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" /> Clear
            </Button>
            <Button
              onClick={copyShareLink}
              variant="ghost"
              className="text-muted-foreground hover:text-white text-xs h-9 px-3"
              title="Share this chord voicing"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-green-400 mr-1" /> : <Share2 className="w-3.5 h-3.5 mr-1" />}
              {copiedLink ? "Copied" : "Share"}
            </Button>
          </div>
        </div>

        {/* Row 2: Display Modes & Guitar Tooling */}
        {!pianoMode && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white/[0.015] border border-white/5">
            {/* Display Modes Pill Bar */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-black mr-1 flex items-center gap-1">
                <Eye className="w-3 h-3" /> View:
              </span>
              {(
                [
                  { id: "clean", label: "Clean / Active Only", icon: Sparkles },
                  { id: "scale", label: "Scale Tones", icon: Layers },
                  { id: "all", label: "All Notes", icon: Eye },
                  { id: "intervals", label: "Intervals", icon: SlidersHorizontal },
                  { id: "colors", label: "Note Colors", icon: Music },
                ] as const
              ).map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => {
                    setDisplayMode(mode.id);
                    if (mode.id === "scale") setScaleOverlayEnabled(true);
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 border",
                    displayMode === mode.id
                      ? "bg-primary/20 border-primary/40 text-primary-foreground shadow-sm"
                      : "bg-white/[0.02] border-white/5 text-muted-foreground hover:text-white hover:bg-white/5"
                  )}
                >
                  <mode.icon className="w-3 h-3" />
                  <span>{mode.label}</span>
                </button>
              ))}
            </div>

            {/* Quick Tunings & Capo Dropdowns */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Tuning Selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Tuning:</span>
                <Select value={selectedTuningId} onValueChange={setSelectedTuningId}>
                  <SelectTrigger className="h-8 text-xs bg-white/5 border-white/10 min-w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GUITAR_TUNINGS.map((t) => (
                      <SelectItem key={t.id} value={t.id} className="text-xs">
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Capo Selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Capo:</span>
                <Select value={capoFret.toString()} onValueChange={(v) => setCapoFret(parseInt(v, 10))}>
                  <SelectTrigger className="h-8 text-xs bg-white/5 border-white/10 w-[95px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0" className="text-xs">No Capo</SelectItem>
                    {Array.from({ length: 7 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()} className="text-xs">
                        Fret {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Lefty Mode Button */}
              <Button
                variant={isLefty ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setIsLefty(!isLefty)}
                className="h-8 px-2.5 text-xs text-muted-foreground hover:text-white"
                title="Flip neck for Left-Handed orientation"
              >
                Lefty: {isLefty ? "ON" : "OFF"}
              </Button>

              {/* Flip Strings Order Button */}
              <Button
                variant={flipStrings ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setFlipStrings(!flipStrings)}
                className="h-8 px-2.5 text-xs text-muted-foreground hover:text-white"
                title="Flip High/Low strings order (Tab vs Guitar order)"
              >
                <ArrowUpDown className="w-3 h-3 mr-1" /> Flip
              </Button>

              {/* Keyboard Help */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHelp(true)}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-white"
                title="Keyboard shortcuts"
              >
                <Info className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Quick Chord Presets Bar */}
        {!pianoMode && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-black shrink-0 mr-1">
              Presets:
            </span>
            {COMMON_CHORD_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => loadPresetChord(preset)}
                className="px-2.5 py-1 rounded-md text-xs font-bold bg-white/[0.03] border border-white/5 hover:bg-primary/20 hover:border-primary/40 hover:text-primary transition-all shrink-0 text-white/80"
              >
                {preset.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Keyboard Help Overlay Modal */}
      <KeyboardHelpOverlay
        keymap={keymap}
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
      />

      {/* Live Detective Chord HUD Banner */}
      {highlightedNotes.length > 0 && !pianoMode && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-primary/10 via-purple-500/10 to-transparent border border-primary/20 backdrop-blur-xl flex flex-wrap items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-primary/80">Identified Chord</p>
              <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                {topChord?.name || "Custom Chord"}
              </h3>
            </div>
            {topChord && (
              <Badge variant="outline" className="text-[11px] font-bold bg-primary/10 border-primary/30 text-primary">
                {Math.round(topChord.score)}% Match
              </Badge>
            )}
          </div>

          {/* Selected Notes Breakdown */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase font-bold text-muted-foreground mr-1">Notes:</span>
            {noteNames.map((n: string, i: number) => (
              <span key={i} className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/10 text-xs font-mono font-bold text-white">
                {n}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" onClick={strumDown} className="h-8 text-xs gap-1.5 font-bold">
              <Volume2 className="w-3.5 h-3.5" /> Play
            </Button>
          </div>
        </motion.div>
      )}

      {/* Main Instrument Sandbox Container */}
      <motion.div
        ref={instrumentRef}
        className="relative bg-gradient-to-b from-[#100c0a] via-[#0c0908] to-[#080605] border border-white/10 rounded-[2.5rem] p-4 md:p-8 mb-8 shadow-2xl overflow-hidden ring-1 ring-white/10"
      >
        {/* Subtle Luxury Rosewood Texture Overlay (Guitar only) */}
        {!pianoMode && (
          <div 
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: `repeating-linear-gradient(90deg, #fff, #fff 1px, transparent 1px, transparent 40px)`
            }}
          />
        )}

        <AnimatePresence mode="wait">
          {pianoMode ? (
            <motion.div
              key="piano"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.3 }}
              className="w-full flex flex-col items-center py-2"
            >
              <div className="w-full flex justify-center overflow-x-auto pb-4 custom-scrollbar">
                <div className="min-w-fit px-2">
                  <PianoKeyboard
                    startOctave={pianoOctaveShift + 3}
                    numOctaves={3}
                    showLabels={true}
                    showKeymapHints={showKeymapHints}
                    rootNote={scaleRoot}
                    intervals={scaleOverlayEnabled ? (SCALE_DEFS[scaleType] ?? []) : []}
                    activeNotes={[...new Set([...pianoNotes, ...pianoActiveNotes.map(entry => entry[0])])]}
                    onNoteClick={handlePianoNoteClick}
                  />
                </div>
              </div>

              {/* Piano Quick Controls */}
              <div className="flex flex-wrap items-center justify-center gap-6 mt-4 p-3.5 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-md shadow-lg">
                <div className="flex items-center gap-3">
                  <div className={cn("w-2 h-2 rounded-full", sustained ? "bg-primary animate-pulse" : "bg-white/20")} />
                  <span className="text-xs font-bold text-muted-foreground uppercase">Sustain Pedal</span>
                  <Switch checked={sustained} onCheckedChange={setSustain} />
                </div>
                <div className="h-4 w-px bg-white/10" />
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-muted-foreground uppercase">Octave</span>
                  <div className="flex items-center bg-white/5 rounded-lg border border-white/10">
                    <button
                      onClick={() => setPianoOctaveShift(prev => Math.max(-2, prev - 1))}
                      className="px-3 py-1 text-white hover:bg-white/10 font-bold"
                    >−</button>
                    <span className="px-3 py-1 text-xs font-mono font-bold text-primary">
                      {pianoOctaveShift > 0 ? `+${pianoOctaveShift}` : pianoOctaveShift}
                    </span>
                    <button
                      onClick={() => setPianoOctaveShift(prev => Math.min(2, prev + 1))}
                      className="px-3 py-1 text-white hover:bg-white/10 font-bold"
                    >+</button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="guitar"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.3 }}
              className="relative overflow-x-auto custom-scrollbar pt-2"
            >
              <div className="md:hidden text-[10px] text-center text-muted-foreground/50 mb-2 font-mono tracking-widest uppercase">
                ← Swipe to explore 12 frets →
              </div>

              <div className="min-w-[850px] py-4 relative">
                {/* Fret position numbers at top */}
                <div className="flex items-center mb-4 pl-12 pr-4">
                  {/* Nut spacer */}
                  <div className="w-12 text-center text-[10px] font-mono font-black text-amber-300/40 uppercase">
                    Nut (0)
                  </div>
                  {fretIndices.map((fretNum) => (
                    <div key={fretNum} className="flex-1 text-center text-xs font-mono font-black text-muted-foreground/40">
                      {fretNum}
                    </div>
                  ))}
                </div>

                {/* Fretboard Neck Construction */}
                <div className="relative rounded-2xl bg-[#140f0c] border border-amber-900/30 p-2 shadow-2xl overflow-hidden">
                  {/* Inlay Position Dots */}
                  <div className="absolute inset-0 flex items-center pointer-events-none pl-12 pr-4">
                    <div className="w-12 shrink-0" />
                    {fretIndices.map((fretNum) => {
                      const isSingleMarker = MARKER_FRETS.has(fretNum) && fretNum !== 12;
                      const isDoubleMarker = fretNum === 12;

                      return (
                        <div key={fretNum} className="flex-1 flex flex-col items-center justify-center gap-8 h-full">
                          {isSingleMarker && (
                            <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-amber-100/30 to-amber-300/10 border border-white/20 shadow-inner" />
                          )}
                          {isDoubleMarker && (
                            <div className="flex flex-col gap-6">
                              <div className="w-3 h-3 rounded-full bg-gradient-to-br from-amber-100/40 to-amber-300/10 border border-white/20" />
                              <div className="w-3 h-3 rounded-full bg-gradient-to-br from-amber-100/40 to-amber-300/10 border border-white/20" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Capo Clamp Visualization (if capo > 0) */}
                  {capoFret > 0 && (
                    <div
                      className="absolute top-0 bottom-0 z-30 pointer-events-none flex flex-col items-center justify-center transition-all duration-300"
                      style={{
                        left: `calc(3rem + ${isLefty ? (FRETS - capoFret + 0.5) : (capoFret - 0.5)} * ((100% - 3rem) / ${FRETS}))`,
                        transform: "translateX(-50%)"
                      }}
                    >
                      <div className="w-3.5 h-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.8)] border border-amber-300 flex items-center justify-center">
                        <span className="text-[8px] font-black text-black -rotate-90">CAPO {capoFret}</span>
                      </div>
                    </div>
                  )}

                  {/* The Strings & Frets Rows */}
                  <div className="space-y-4 relative z-10 py-2">
                    {stringIndices.map((stringIndex, i) => {
                      const gaugeThickness = STRING_THICKNESSES[stringIndex] || 1.5;
                      const openNote = getNoteAtFret(stringIndex, 0);

                      return (
                        <div key={stringIndex} className="flex items-center relative h-11">
                          {/* String Name Label on Left */}
                          <div 
                            onClick={() => toggleNote(stringIndex, 0)}
                            className="w-12 text-center font-mono font-black text-xs text-amber-200/60 hover:text-amber-200 cursor-pointer transition-colors"
                            title={`String ${6 - stringIndex} (${openNote}) - Click to play open`}
                          >
                            <span className="text-[10px] text-muted-foreground/40 block leading-none">{6 - stringIndex}</span>
                            {openNote}
                          </div>

                          {/* Frets Strip for this string */}
                          <div
                            ref={i === 0 ? fretsContainerRef : null}
                            className="flex-1 flex items-center relative h-full"
                          >
                            {/* Realistic Metallic String Line with Gauge */}
                            <div
                              className="absolute left-0 right-0 pointer-events-none shadow-md"
                              style={{
                                top: "50%",
                                transform: "translateY(-50%)",
                                height: `${gaugeThickness}px`,
                                background: stringIndex < 3
                                  ? "linear-gradient(180deg, #d4af37 0%, #aa8528 50%, #685012 100%)" // Wound brass/bronze strings
                                  : "linear-gradient(180deg, #f4f4f5 0%, #a1a1aa 50%, #52525b 100%)"  // Plain nickel steel
                              }}
                            />

                            {/* Nut (Fret 0) */}
                            <div className="relative w-12 h-full flex items-center justify-center border-r-4 border-amber-100/40 bg-black/40">
                              {(() => {
                                const note = openNote;
                                const isHighlighted = isNoteHighlighted(stringIndex, 0);
                                const scaleLabel = getScaleLabelForNote(note);
                                const isInScale = getScaleContext.enabled && !!scaleLabel;
                                const isRoot = isInScale && note === scaleRoot;
                                const isDimmed = getScaleContext.enabled && focusScale && !isInScale;
                                const isActive = isKeyboardActive(stringIndex, 0);
                                const isHovering = isNoteHovered(stringIndex, 0);

                                const shouldShow = isHighlighted || isActive || displayMode === "all" || (displayMode === "scale" && isInScale) || displayMode === "colors";

                                return (
                                  <motion.button
                                    whileHover={{ scale: 1.15 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => toggleNote(stringIndex, 0)}
                                    onMouseEnter={() => {
                                      setHovered({ string: stringIndex, fret: 0 });
                                      if (hoverPreviewEnabled) previewNote(stringIndex, 0);
                                    }}
                                    onMouseLeave={() => setHovered(null)}
                                    className={cn(
                                      "relative w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-200 z-20 border",
                                      isHighlighted
                                        ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.9)] scale-110"
                                        : isActive
                                          ? "bg-primary border-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.8)]"
                                          : displayMode === "colors"
                                            ? PITCH_COLORS[note] || "bg-white/10 text-white"
                                            : isInScale && (displayMode === "scale" || scaleOverlayEnabled)
                                              ? isRoot
                                                ? "bg-amber-500 text-black border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.7)] font-black"
                                                : "bg-cyan-500/20 text-cyan-200 border-cyan-400/50"
                                              : shouldShow
                                                ? "bg-black/80 text-white/80 border-white/20 hover:border-white hover:bg-white/10"
                                                : "opacity-0 hover:opacity-100 bg-white/10 border-white/20 text-white/60",
                                      isHovering ? "ring-2 ring-white/40 shadow-lg" : ""
                                    )}
                                  >
                                    <span className={cn("text-[11px] font-black leading-none", isDimmed ? "opacity-30" : "opacity-100")}>
                                      {displayMode === "intervals" ? (scaleLabel ?? note) : note}
                                    </span>
                                  </motion.button>
                                );
                              })()}
                            </div>

                            {/* Frets 1 to 12 */}
                            {fretIndices.map((fretNum) => {
                              const note = getNoteAtFret(stringIndex, fretNum);
                              const isHighlighted = isNoteHighlighted(stringIndex, fretNum);
                              const isBehindCapo = fretNum < capoFret;
                              const scaleLabel = getScaleLabelForNote(note);
                              const isInScale = getScaleContext.enabled && !!scaleLabel;
                              const isRoot = isInScale && note === scaleRoot;
                              const isDimmed = getScaleContext.enabled && focusScale && !isInScale;
                              const isActive = isKeyboardActive(stringIndex, fretNum);
                              const isHovering = isNoteHovered(stringIndex, fretNum);

                              const shouldShow = isHighlighted || isActive || displayMode === "all" || (displayMode === "scale" && isInScale) || displayMode === "colors";

                              return (
                                <div
                                  key={fretNum}
                                  className="relative flex-1 flex items-center justify-center h-full border-r border-white/15"
                                >
                                  {/* Fret wire visual */}
                                  <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-white/30 via-white/10 to-white/30 shadow-[0_0_4px_rgba(255,255,255,0.2)] pointer-events-none" />

                                  <motion.button
                                    whileHover={isBehindCapo ? {} : { scale: 1.15 }}
                                    whileTap={isBehindCapo ? {} : { scale: 0.9 }}
                                    disabled={isBehindCapo}
                                    onClick={() => toggleNote(stringIndex, fretNum)}
                                    onMouseEnter={() => {
                                      if (isBehindCapo) return;
                                      setHovered({ string: stringIndex, fret: fretNum });
                                      if (hoverPreviewEnabled) previewNote(stringIndex, fretNum);
                                    }}
                                    onMouseLeave={() => setHovered(null)}
                                    className={cn(
                                      "relative w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-200 z-20 border",
                                      isBehindCapo
                                        ? "opacity-10 bg-black text-transparent cursor-not-allowed border-transparent"
                                        : isHighlighted
                                          ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.9)] scale-110 font-black"
                                          : isActive
                                            ? "bg-primary border-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.8)]"
                                            : displayMode === "colors"
                                              ? PITCH_COLORS[note] || "bg-white/10 text-white"
                                              : isInScale && (displayMode === "scale" || scaleOverlayEnabled)
                                                ? isRoot
                                                  ? "bg-amber-500 text-black border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.7)] font-black"
                                                  : "bg-cyan-500/20 text-cyan-200 border-cyan-400/50"
                                                : shouldShow
                                                  ? "bg-black/80 text-white/80 border-white/20 hover:border-white hover:bg-white/10"
                                                  : "opacity-0 hover:opacity-100 bg-white/10 border-white/20 text-white/60",
                                      isHovering ? "ring-2 ring-white/40 shadow-lg" : ""
                                    )}
                                  >
                                    <span className={cn("text-[11px] font-black leading-none", isDimmed ? "opacity-30" : "opacity-100")}>
                                      {displayMode === "intervals" ? (scaleLabel ?? note) : note}
                                    </span>
                                    {isActive && (
                                      <span className="absolute -top-6 text-[9px] font-black text-primary bg-black/90 px-1 rounded shadow border border-primary/30">
                                        {getActiveKey(stringIndex, fretNum)}
                                      </span>
                                    )}
                                  </motion.button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Comprehensive Chord Detective & Scales Analysis Section */}
      {(highlightedNotes.length > 0 || pianoNotes.length > 0) && (
        <div className="mb-12">
          <ChordDetectionPanel
            candidates={candidates}
            selectedNotes={noteNames}
          />
        </div>
      )}

      {/* Bottom Settings & Theory Customization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Keyboard Settings */}
        {pianoMode ? (
          <div className="glass-card rounded-2xl p-6 border-white/10 shadow-xl bg-card/40">
            <PianoSettings
              keyboardPreset={pianoKeyboardPreset}
              onKeyboardPresetChange={setPianoKeyboardPreset}
              showKeymapHints={showKeymapHints}
              onToggleKeymapHints={setShowKeymapHints}
              onClear={clearHighlights}
            />
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-6 border-white/10 shadow-xl bg-card/40">
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

        {/* Scale Theory Controls */}
        <div className="glass-card rounded-2xl p-6 border-white/10 shadow-xl bg-card/40">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Search className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-white tracking-tight">Scale Overlay & Theory</h3>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase">Scale Root</Label>
                <Select value={scaleRoot} onValueChange={setScaleRoot}>
                  <SelectTrigger className="bg-white/5 border-white/10 h-10 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CHROMATIC.map(n => (
                      <SelectItem key={n} value={n} className="text-xs">{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase">Scale Mode</Label>
                <Select value={scaleType} onValueChange={setScaleType}>
                  <SelectTrigger className="bg-white/5 border-white/10 h-10 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(SCALE_DEFS).map(name => (
                      <SelectItem key={name} value={name} className="text-xs">{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <div>
                  <p className="text-sm font-medium text-white">Enable Scale Overlay</p>
                  <p className="text-xs text-muted-foreground">
                    Highlight modal scale degrees on {pianoMode ? "piano keys" : "the guitar neck"}.
                  </p>
                </div>
                <Switch checked={scaleOverlayEnabled} onCheckedChange={setScaleOverlayEnabled} />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <div>
                  <p className="text-sm font-medium text-white">Dim Out-of-Scale Notes</p>
                  <p className="text-xs text-muted-foreground">Focus exclusively on notes inside the scale.</p>
                </div>
                <Switch checked={focusScale} onCheckedChange={setFocusScale} />
              </div>

              {!pianoMode && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div>
                    <p className="text-sm font-medium text-white">Hover Audio Preview</p>
                    <p className="text-xs text-muted-foreground">Pluck string tones upon mouse hover.</p>
                  </div>
                  <Switch checked={hoverPreviewEnabled} onCheckedChange={setHoverPreviewEnabled} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showDebug && (
        <div className="mt-8 p-6 rounded-2xl bg-red-950/10 border border-red-500/20">
          <ChordDebugPanel
            midiNotes={midiNotes}
            candidates={candidates}
            mode={pianoMode ? 'piano' : 'fretboard'}
          />
        </div>
      )}
    </div>
  );
};

export default Fretboard;
