import { useState, useMemo, useEffect, useCallback } from "react";
import { Keyboard, Info, Music } from "lucide-react";
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
  const [showDebug] = useState(false);

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

  const getNoteFrequency = useCallback((stringIndex: number, fret: number): number => {
    const base = STRING_BASE_FREQ[stringIndex] ?? 110; // fallback A2
    return base * Math.pow(2, fret / 12);
  }, []);

  const strumDown = useCallback(() => {
    if (highlightedNotes.length === 0) return;
    
    // Play all notes together for a tight chord instead of a sweep
    const sorted = [...highlightedNotes].sort((a, b) => b.string - a.string);
    sorted.forEach((noteData, index) => {
      const freq = getNoteFrequency(noteData.string, noteData.fret);
      const velocity = getVelocity(index, sorted.length);
      playNote(freq, 1.8, velocity, 'piano');
    });
  }, [highlightedNotes, getNoteFrequency]);

  const strumUp = useCallback(() => {
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
  }, [highlightedNotes, getNoteFrequency, strumSpeed]);

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
    <div className="relative overflow-hidden bg-transparent p-0">
      <div className="relative z-10 p-4 md:p-8">
        {/* Modern Control Panel */}
        <div className="flex flex-wrap items-center justify-between gap-6 mb-8 bg-white/[0.03] border border-white/5 p-4 rounded-2xl backdrop-blur-md">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPianoMode(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                !pianoMode 
                  ? "bg-white/10 text-white shadow-inner border border-white/10" 
                  : "text-muted-foreground hover:text-white hover:bg-white/5"
              }`}
            >
              Guitar Fretboard
            </button>
            <button
              onClick={() => setPianoMode(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                pianoMode 
                  ? "bg-white/10 text-white shadow-inner border border-white/10" 
                  : "text-muted-foreground hover:text-white hover:bg-white/5"
              }`}
            >
              Piano Keys
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setKeyboardEnabled(!keyboardEnabled)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                keyboardEnabled
                  ? "bg-primary/20 border-primary/30 text-primary-foreground stroke-primary"
                  : "bg-white/5 border-white/10 text-muted-foreground"
              }`}
            >
              <Keyboard className="w-4 h-4" />
              <span>Keyboard {keyboardEnabled ? "Enabled" : "Disabled"}</span>
            </button>

            {pianoMode && (
              <button
                onClick={toggleSustain}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                  sustained
                    ? "bg-accent/20 border-accent/30 text-accent-foreground"
                    : "bg-white/5 border-white/10 text-muted-foreground"
                }`}
              >
                Sustain
              </button>
            )}

            <div className="h-4 w-[1px] bg-white/10 mx-1 hidden sm:block"></div>

            <button
              onClick={() => setShowHelp(true)}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-muted-foreground hover:text-white hover:bg-white/10 transition-all"
              title="Keyboard Shortcuts"
            >
              <Info className="w-4 h-4" />
            </button>

            <button
              onClick={clearHighlights}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-muted-foreground hover:text-white hover:bg-white/10 transition-all text-sm font-medium"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Quick Help Hints */}
        {!pianoMode && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="mt-1 p-1.5 rounded-md bg-primary/10 border border-primary/20">
                <Music className="w-3 h-3 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Strumming</p>
                <p className="text-[11px] text-muted-foreground">Press Enter to strum your selected notes.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="mt-1 p-1.5 rounded-md bg-secondary/10 border border-secondary/20">
                <Keyboard className="w-3 h-3 text-secondary" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Input mapping</p>
                <p className="text-[11px] text-muted-foreground">Mapped letters light up frets/keys.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="mt-1 p-1.5 rounded-md bg-accent/10 border border-accent/20">
                <Info className="w-3 h-3 text-accent" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Interactivity</p>
                <p className="text-[11px] text-muted-foreground">Click frets to toggle notes; chords are auto-detected.</p>
              </div>
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
      <div className="bg-black/40 border border-white/5 rounded-2xl p-4 md:p-8 mb-8 backdrop-blur-sm shadow-xl">
        {pianoMode ? (
          <div className="relative">
            {/* Piano Play Area */}
            <div className="flex justify-center mb-8 overflow-x-auto">
              <div className="relative min-w-[700px]">
                {/* Background glow for active notes */}
                {pianoNotes.length > 0 && (
                  <div className="absolute inset-0 bg-primary/5 rounded-3xl blur-2xl animate-pulse"></div>
                )}
                <div className="relative">
                  <PianoKeyboard
                    startOctave={pianoOctaveShift + 4}
                    numOctaves={2}
                    activeNotes={[...pianoNotes, ...pianoActiveNotes.map(entry => entry[0])]}
                    onNoteClick={handlePianoNoteClick}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative overflow-x-auto">
            <div className="min-w-[800px] py-4">
              {/* Fret markers */}
              <div className="absolute top-0 left-0 right-0 flex justify-around px-12 h-6 items-center">
                {[3, 5, 7, 9, 12, 15, 17, 19, 21].map((fret) => (
                  <div
                    key={fret}
                    className="w-1.5 h-1.5 rounded-full bg-white/20"
                    style={{ marginLeft: `${(fret - 1) * 8.33}%` }}
                  />
                ))}
              </div>

              {/* Fretboard */}
              <div className="space-y-4 mt-8">
                {NOTES.map((openNote, stringIndex) => (
                  <div key={stringIndex} className="flex items-center gap-2">
                    {/* Open string note */}
                    <div className="w-10 text-center font-bold text-xs text-muted-foreground/50 italic">
                      {openNote}
                    </div>

                    {/* Frets */}
                    <div className="flex-1 flex items-center relative h-10">
                      {/* String line */}
                      <div
                        className="absolute left-0 right-0 h-[1.5px] bg-white/10"
                        style={{ top: "50%" }}
                      />

                      {/* Nut (fret 0) */}
                      <div className="relative w-10 h-10 flex items-center justify-center">
                        <button
                          onClick={() => toggleNote(stringIndex, 0)}
                          className={`relative w-8 h-8 rounded-full border-2 transition-all duration-200 group ${
                            isNoteHighlighted(stringIndex, 0)
                              ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.4)]"
                              : isKeyboardActive(stringIndex, 0)
                              ? "bg-primary border-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.4)]"
                              : "border-white/10 hover:border-white/30 bg-white/5"
                          }`}
                        >
                          <span className={`text-[10px] font-bold ${isNoteHighlighted(stringIndex, 0) ? "text-black" : "text-white"}`}>
                            {getNoteAtFret(stringIndex, 0)}
                          </span>
                          {isKeyboardActive(stringIndex, 0) && (
                            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-black text-primary uppercase tracking-tighter bg-black/80 px-1 rounded">
                              {getActiveKey(stringIndex, 0)}
                            </span>
                          )}
                        </button>
                      </div>

                      {/* Frets 1-12 */}
                      {Array.from({ length: FRETS }).map((_, fret) => {
                        const fretNumber = fret + 1;
                        return (
                          <div key={fretNumber} className="relative flex-1 flex items-center justify-center h-10">
                            {/* Fret wire */}
                            <div className="absolute left-0 w-[1.5px] h-10 bg-white/10" />

                            <button
                              onClick={() => toggleNote(stringIndex, fretNumber)}
                              className={`relative w-8 h-8 rounded-full border-2 transition-all duration-200 group z-10 ${
                                isNoteHighlighted(stringIndex, fretNumber)
                                  ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.4)]"
                                  : isKeyboardActive(stringIndex, fretNumber)
                                  ? "bg-primary border-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.4)]"
                                  : "border-white/5 hover:border-white/20 bg-white/[0.02]"
                              }`}
                            >
                              <span className={`text-[10px] font-bold ${isNoteHighlighted(stringIndex, fretNumber) ? "text-black" : "text-white"}`}>
                                {getNoteAtFret(stringIndex, fretNumber)}
                              </span>
                              {isKeyboardActive(stringIndex, fretNumber) && (
                                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-black text-primary uppercase tracking-tighter bg-black/80 px-1 rounded">
                                  {getActiveKey(stringIndex, fretNumber)}
                                </span>
                              )}
                            </button>
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
          </div>
        )}

        {/* Dynamic Status/Detection Bar */}
        {(highlightedNotes.length > 0 || pianoNotes.length > 0) && (
          <div className="mt-8 pt-6 border-t border-white/5">
            <ChordDetectionPanel
              candidates={chordDetectionResult.candidates}
              selectedNotes={chordDetectionResult.noteNames}
            />
          </div>
        )}
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
  </div>
);
};

export default Fretboard;
