  import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Keyboard, Info, Piano as PianoIcon, Music } from "lucide-react";
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
import { playNote } from "@/lib/chordAudio";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const NOTES = ["E", "A", "D", "G", "B", "E"];
const CHROMATIC = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const FRETS = 12;
const STRING_BASE_FREQ = [82.41, 110.0, 146.83, 196.0, 246.94, 329.63]; // Low E to high E
interface FretNote {
  string: number;
  fret: number;
  note: string;
}

// Chord patterns: intervals from root

const Fretboard = () => {
  const [highlightedNotes, setHighlightedNotes] = useState<FretNote[]>([]);
  const [pianoMode, setPianoMode] = useState(() => {
    const saved = localStorage.getItem('piano-mode');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [pianoNotes, setPianoNotes] = useState<number[]>([]);
  const [keyboardEnabled, setKeyboardEnabled] = useState(() => {
    const saved = localStorage.getItem('keyboard-enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [keymap, setKeymap] = useState<KeymapConfig>(() => {
    const saved = localStorage.getItem('keyboard-keymap');
    return saved ? JSON.parse(saved) : DEFAULT_KEYMAP;
  });
  const [strumSpeed, setStrumSpeed] = useState(() => {
    const saved = localStorage.getItem('keyboard-strum-speed');
    return saved ? parseInt(saved) : 30;
  });
  const [velocityProfile, setVelocityProfile] = useState<'linear' | 'exponential' | 'uniform'>(() => {
    const saved = localStorage.getItem('keyboard-velocity-profile');
    return (saved as 'linear' | 'exponential' | 'uniform') || 'exponential';
  });
  const [chordMode, setChordMode] = useState(() => {
    const saved = localStorage.getItem('keyboard-chord-mode');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [pianoKeyboardPreset, setPianoKeyboardPreset] = useState<KeyboardPreset>(() => {
    const saved = localStorage.getItem('piano-keyboard-preset');
    return (saved as KeyboardPreset) || 'qwerty';
  });
  const [detectionStrictness, setDetectionStrictness] = useState<DetectionStrictness>(() => {
    const saved = localStorage.getItem('chord-detection-strictness');
    return (saved as DetectionStrictness) || 'lenient';
  });
  const [maxCandidates, setMaxCandidates] = useState(() => {
    const saved = localStorage.getItem('chord-max-candidates');
    return saved ? parseInt(saved) : 3;
  });
  const [showHelp, setShowHelp] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

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

  // Handle Enter key to strum fretboard notes
  // (moved below strum helpers to avoid reference order issues)

  // Fretboard keyboard integration
  const { activeNotes: keyboardActiveNotes, octaveShift } = useKeyboardFretboard({
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
  const { activeNotes: pianoActiveNotes, octaveShift: pianoOctaveShift, sustained, toggleSustain } = usePianoKeyboard({
    enabled: keyboardEnabled && pianoMode,
    keymap: pianoKeymapConfig,
    onNoteOn: (midiNote, _velocity) => {
      setPianoNotes(prev => [...prev, midiNote]);
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

  const isNoteHighlighted = (stringIndex: number, fret: number): boolean => {
    return highlightedNotes.some(
      (n) => n.string === stringIndex && n.fret === fret
    );
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
    const existing = highlightedNotes.find(
      (n) => n.string === stringIndex && n.fret === fret
    );

    if (existing) {
      setHighlightedNotes(
        highlightedNotes.filter(
          (n) => !(n.string === stringIndex && n.fret === fret)
        )
      );
    } else {
      setHighlightedNotes([
        ...highlightedNotes,
        { string: stringIndex, fret, note },
      ]);

      // Play the clicked note immediately for feedback
      const freq = getNoteFrequency(stringIndex, fret);
      playNote(freq, 1.2, 0.35, 'piano');
    }
  };

  const clearHighlights = () => {
    setHighlightedNotes([]);
    setPianoNotes([]);
  };

  const getVelocity = (index: number, total: number): number => {
    const position = index / Math.max(total - 1, 1);
    // Exponential velocity profile for natural dynamics
    return 0.2 + Math.pow(position, 1.5) * 0.3;
  };

  const getNoteFrequency = (stringIndex: number, fret: number): number => {
    const base = STRING_BASE_FREQ[stringIndex] ?? 110; // fallback A2
    return base * Math.pow(2, fret / 12);
  };

  const strumDown = () => {
    if (highlightedNotes.length === 0) return;
    
    // Play all notes together for a tight chord instead of a sweep
    const sorted = [...highlightedNotes].sort((a, b) => b.string - a.string);
    sorted.forEach((noteData, index) => {
      const freq = getNoteFrequency(noteData.string, noteData.fret);
      const velocity = getVelocity(index, sorted.length);
      playNote(freq, 1.8, velocity, 'piano');
    });
  };

  const strumUp = () => {
    if (highlightedNotes.length === 0) return;
    
    // Sort by string (ascending: 0→5, which is low E to high E)
    const sorted = [...highlightedNotes].sort((a, b) => a.string - b.string);
    
    sorted.forEach((noteData, index) => {
      setTimeout(() => {
        const freq = getNoteFrequency(noteData.string, noteData.fret);
        const velocity = getVelocity(index, sorted.length);
        playNote(freq, 1.8, velocity, 'piano');
      }, index * strumSpeed);
    });
  };

  // Allow Enter to strum highlighted frets when keyboard control is off
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (pianoMode) return;
      if (keyboardEnabled) return; // avoid double fire with keyboard hook

      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (e.code === 'Enter') {
        e.preventDefault();
        strumDown();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pianoMode, keyboardEnabled, highlightedNotes, strumSpeed, strumDown, strumUp]);

  const togglePianoMode = () => {
    setPianoMode((prev: boolean) => !prev);
    clearHighlights();
  };

  const handlePianoNoteClick = (midiNote: number) => {
    setPianoNotes(prev => {
      if (prev.includes(midiNote)) {
        return prev.filter(n => n !== midiNote);
      } else {
        return [...prev, midiNote];
      }
    });
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-background via-background to-secondary/10 rounded-3xl p-8 border border-primary/30 shadow-2xl backdrop-blur-xl">
      {/* Ambient lighting effects - minimal animations */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-secondary/10" style={{animationDelay: '1s'}}></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-accent/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-ocean/5 rounded-full blur-3xl" style={{ animationDelay: '2s' }}></div>

      <div className="relative z-10">
        {/* Modern Header */}
        <div className="text-center mb-8">
          <h2 className="text-5xl font-bold mb-4 text-gradient animate-gradient-x font-['Inter'] tracking-tight">
            Interactive {pianoMode ? 'Piano' : 'Fretboard'}
          </h2>
          <p className="text-lg text-muted-foreground font-medium max-w-md mx-auto leading-relaxed">
            {pianoMode
              ? 'Play piano keys or use your keyboard'
              : 'Click on frets or use your keyboard to play'}
          </p>
        </div>

        {/* Control Panel */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
          {keyboardEnabled && (pianoMode ? pianoOctaveShift : octaveShift) !== 0 && (
            <div className="glass-card px-4 py-2 rounded-full border-primary/30">
              <span className="text-primary font-mono text-sm font-semibold">
                {(pianoMode ? pianoOctaveShift : octaveShift) > 0 ? '+' : ''}{pianoMode ? pianoOctaveShift : octaveShift} Oct
              </span>
            </div>
          )}

          {/* Modern Toggle Buttons */}
          <button
            onClick={togglePianoMode}
            className={`px-6 py-3 rounded-full font-semibold text-sm transition-all duration-300 transform hover:scale-105 shadow-lg backdrop-blur-sm border ${
              pianoMode
                ? 'bg-gradient-accent text-primary-foreground glow-accent border-primary/50'
                : 'glass-card hover-lift border-primary/30 hover:border-primary/50'
            }`}
          >
            <PianoIcon className="w-4 h-4 inline mr-2" />
            Piano {pianoMode ? "ON" : "OFF"}
          </button>

          <button
            onClick={() => setKeyboardEnabled(!keyboardEnabled)}
            className={`px-6 py-3 rounded-full font-semibold text-sm transition-all duration-300 transform hover:scale-105 shadow-lg backdrop-blur-sm border ${
              keyboardEnabled
                ? 'bg-gradient-ocean text-primary-foreground glow-accent border-primary/50'
                : 'glass-card hover-lift border-primary/30 hover:border-primary/50'
            }`}
          >
            <Keyboard className="w-4 h-4 inline mr-2" />
            Keyboard {keyboardEnabled ? "ON" : "OFF"}
          </button>

          {pianoMode && (
            <button
              onClick={toggleSustain}
              className={`px-6 py-3 rounded-full font-semibold text-sm transition-all duration-300 transform hover:scale-105 shadow-lg backdrop-blur-sm border ${
                sustained
                  ? 'bg-primary text-primary-foreground glow-accent border-primary/50'
                  : 'glass-card hover-lift border-primary/30 hover:border-primary/50'
              }`}
              title="Toggle sustain (Space)"
            >
              Sustain {sustained ? 'ON' : 'OFF'}
            </button>
          )}

          <button
            onClick={() => setShowHelp(true)}
            className="p-3 rounded-full glass-card hover-lift border-primary/30 hover:border-primary/50 transition-all duration-300 transform hover:scale-105 shadow-lg backdrop-blur-sm"
          >
            <Info className="w-5 h-5" />
          </button>

          {!pianoMode && highlightedNotes.length > 0 && (
            <button
              onClick={strumDown}
              className="px-4 py-3 rounded-full glass-card hover-lift border-primary/30 hover:border-primary/50 transition-all duration-300 transform hover:scale-105 shadow-lg backdrop-blur-sm font-semibold text-sm flex items-center gap-2"
              title="Enter - Strum (High to Low)"
            >
              <Music className="w-4 h-4" />
              Strum
            </button>
          )}

          <button
            onClick={clearHighlights}
            className="px-6 py-3 rounded-full glass-card hover-lift border-primary/30 hover:border-primary/50 transition-all duration-300 transform hover:scale-105 shadow-lg backdrop-blur-sm font-semibold text-sm"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Quick guidance for fretboard mode */}
      {!pianoMode && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
          <div className="glass-card border-primary/20 rounded-xl p-4">
            <p className="text-sm font-semibold">Strumming</p>
            <p className="text-sm text-muted-foreground">Press Enter to strum your selected notes. Tune the feel with strum speed and velocity in settings.</p>
          </div>
          <div className="glass-card border-primary/20 rounded-xl p-4">
            <p className="text-sm font-semibold">Keyboard layout</p>
            <p className="text-sm text-muted-foreground">Mapped letters light frets; '-' and '=' shift octaves. Toggle chord mode to stack notes before strumming.</p>
          </div>
          <div className="glass-card border-primary/20 rounded-xl p-4">
            <p className="text-sm font-semibold">Clicks & cleanup</p>
            <p className="text-sm text-muted-foreground">Click frets to toggle notes, watch mapped keys float above active frets, and use Clear anytime to reset the board.</p>
          </div>
        </div>
      )}

      {/* Modern Settings Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Mode-specific settings */}
        {pianoMode ? (
          <div className="glass-card rounded-2xl p-6 border-primary/30 shadow-xl">
            <PianoSettings
              keyboardPreset={pianoKeyboardPreset}
              onKeyboardPresetChange={setPianoKeyboardPreset}
              sustained={sustained}
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

        {/* Enhanced Chord Detection Settings */}
        <div className="glass-card rounded-2xl p-6 border-primary/30 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-accent/20 rounded-lg">
              <Info className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-gradient">Chord Detection</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="strictness" className="text-sm font-medium text-muted-foreground">Detection Mode</Label>
              <Select
                value={detectionStrictness}
                onValueChange={(value) => setDetectionStrictness(value as DetectionStrictness)}
              >
                <SelectTrigger id="strictness" className="glass-card border-primary/20 hover:border-primary/40 transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lenient">Lenient (tolerates extra notes)</SelectItem>
                  <SelectItem value="strict">Strict (exact matches only)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-candidates" className="text-sm font-medium text-muted-foreground">Max Candidates</Label>
              <Select
                value={maxCandidates.toString()}
                onValueChange={(value) => setMaxCandidates(parseInt(value))}
              >
                <SelectTrigger id="max-candidates" className="glass-card border-primary/20 hover:border-primary/40 transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 candidate</SelectItem>
                  <SelectItem value="3">3 candidates</SelectItem>
                  <SelectItem value="5">5 candidates</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

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
      {pianoMode ? (
        <div className="relative">
          {/* Piano Play Area with Glow */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              {/* Background glow for active notes */}
              {pianoNotes.length > 0 && (
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-teal-500/20 rounded-3xl blur-2xl animate-pulse"></div>
              )}
              <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50 shadow-2xl max-w-4xl w-full">
                <PianoKeyboard
                  startOctave={pianoOctaveShift + 4}
                  numOctaves={2}
                  activeNotes={[...pianoNotes, ...pianoActiveNotes.map(entry => entry[0])]}
                  onNoteClick={handlePianoNoteClick}
                />
              </div>
            </div>
          </div>

          {/* Chord Detection Panel - Centered and Modern */}
          <div className="flex justify-center mb-8">
            <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 shadow-xl max-w-2xl w-full">
              <ChordDetectionPanel
                candidates={chordDetectionResult.candidates}
                selectedNotes={chordDetectionResult.noteNames}
              />
            </div>
          </div>
        </div>

      ) : (
        <div className="relative glass-card rounded-2xl p-8 overflow-x-auto">
        {/* Fret markers */}
        <div className="absolute top-4 left-0 right-0 flex justify-around px-12">
          {[3, 5, 7, 9, 12].map((fret) => (
            <div
              key={fret}
              className="w-3 h-3 rounded-full bg-muted/30"
              style={{ marginLeft: `${(fret - 1) * 8.33}%` }}
            />
          ))}
        </div>

        {/* Fretboard */}
        <div className="space-y-4 mt-8">
          {NOTES.map((openNote, stringIndex) => (
            <div key={stringIndex} className="flex items-center gap-2">
              {/* Open string note */}
              <div className="w-12 text-center font-medium text-sm text-muted-foreground">
                {openNote}
              </div>

              {/* Frets */}
              <div className="flex-1 flex items-center relative">
                {/* String line */}
                <div
                  className="absolute left-0 right-0 h-[2px] bg-foreground/20"
                  style={{ top: "50%" }}
                />

                {/* Nut (fret 0) */}
                <div className="relative w-8 h-8">
                  <button
                    onClick={() => toggleNote(stringIndex, 0)}
                    className={`relative w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                      isNoteHighlighted(stringIndex, 0)
                        ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/50"
                        : isKeyboardActive(stringIndex, 0)
                        ? "bg-accent border-accent-foreground text-accent-foreground shadow-md animate-pulse"
                        : "border-muted hover:border-primary/50 bg-background/50"
                    }`}
                  >
                    <span className="text-xs font-medium">
                      {getNoteAtFret(stringIndex, 0)}
                    </span>
                    {isKeyboardActive(stringIndex, 0) && (
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-primary uppercase">
                        {getActiveKey(stringIndex, 0)}
                      </span>
                    )}
                  </button>
                </div>

                {/* Frets 1-12 */}
                {Array.from({ length: FRETS }).map((_, fret) => {
                  const fretNumber = fret + 1;
                  return (
                    <div key={fretNumber} className="relative flex-1">
                      {/* Fret wire */}
                      <div className="absolute left-0 w-[2px] h-12 bg-border -top-2" />

                      {/* Note position */}
                      <div className="flex items-center justify-center h-8">
                        <button
                          onClick={() => toggleNote(stringIndex, fretNumber)}
                          className={`relative w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                            isNoteHighlighted(stringIndex, fretNumber)
                              ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/50"
                              : isKeyboardActive(stringIndex, fretNumber)
                              ? "bg-accent border-accent-foreground text-accent-foreground shadow-md animate-pulse"
                              : "border-muted/30 hover:border-primary/50 bg-background/30"
                          }`}
                        >
                          <span className="text-xs font-medium">
                            {getNoteAtFret(stringIndex, fretNumber)}
                          </span>
                          {isKeyboardActive(stringIndex, fretNumber) && (
                            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-primary uppercase">
                              {getActiveKey(stringIndex, fretNumber)}
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Fret numbers */}
          <div className="flex items-center gap-2 mt-6 pl-14">
            <div className="w-8 text-center text-xs text-muted-foreground">0</div>
            {Array.from({ length: FRETS }).map((_, i) => (
              <div
                key={i}
                className="flex-1 text-center text-xs text-muted-foreground"
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>
        </div>
      )}

      {/* Debug panel toggle */}
      <div className="flex justify-center mt-8 mb-8">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDebug(!showDebug)}
          className="glass-card border-primary/30 hover:border-primary/50 text-xs"
        >
          {showDebug ? 'Hide' : 'Show'} Debug Info
        </Button>
      </div>

      {showDebug && (
        <div className="flex justify-center mb-8">
          <ChordDebugPanel
            midiNotes={chordDetectionResult.midiNotes}
            candidates={chordDetectionResult.candidates}
            mode={pianoMode ? 'piano' : 'fretboard'}
          />
        </div>
      )}

      {/* Chord Detection Display */}
      {(highlightedNotes.length > 0 || pianoNotes.length > 0) && (
        <div className="flex justify-center mt-8 mb-8">
          <div className="glass-card rounded-2xl p-6 border-primary/30 shadow-xl max-w-2xl w-full">
            <ChordDetectionPanel
              candidates={chordDetectionResult.candidates}
              selectedNotes={chordDetectionResult.noteNames}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Fretboard;
