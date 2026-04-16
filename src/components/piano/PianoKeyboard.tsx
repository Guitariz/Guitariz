/**
 * PianoKeyboard.tsx
 * Interactive piano keyboard for Scale Explorer.
 * Highlights scale notes with interval-based color coding:
 *   Root → white/gold   |  3rd → purple  |  5th → cyan  |  other scale notes → default accent
 * Supports 2-octave focused view or expanded 88-key range.
 * Clicking a key plays the note via Web Audio.
 */

import { useMemo, useCallback, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { playNote } from "@/lib/chordAudio";

// ─── Types ────────────────────────────────────────────────────────────────────

export type IntervalRole = "root" | "third" | "fifth" | "scale" | "none";

export interface PianoNoteInfo {
  /** Chromatic pitch class 0-11 matching NOTES array */
  pitchClass: number;
  role: IntervalRole;
}

export interface PianoKeyboardProps {
  /** Note names active in the scale, e.g. ["C", "E", "G", "B", "D"] */
  scaleNotes: string[];
  /** Root note name, e.g. "C" */
  rootNote: string;
  /** Intervals of the scale (semitone offsets from root) */
  intervals: number[];
  /** Starting octave (default 3) */
  startOctave?: number;
  /** Number of octaves to display (default 2) */
  numOctaves?: number;
  /** Whether to show note labels on keys */
  showLabels?: boolean;
  /** Whether to show the full 88-key range */
  fullRange?: boolean;
  className?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;
const BLACK_PITCH_CLASSES = new Set([1, 3, 6, 8, 10]);

// Interval index → role mapping (standard Western scale degree positions)
// Interval idx 0 → root, idx 2 → 3rd (major/minor), idx 4 → 5th (perfect)
const INTERVAL_IDX_TO_ROLE: Record<number, IntervalRole> = {
  0: "root",
  2: "third",
  4: "fifth",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const midiToNoteName = (midi: number): string => {
  const pc = midi % 12;
  const octave = Math.floor(midi / 12) - 1;
  return `${NOTE_NAMES[pc]}${octave}`;
};

const midiToPitchClass = (midi: number): number => midi % 12;

/** Play a note using the global AudioContext */
const playMidiNote = (midi: number): void => {
  const frequency = 440 * Math.pow(2, (midi - 69) / 12);
  playNote(frequency, 1.5, 0.4, "piano");
};

/** Build a map from pitchClass → IntervalRole for the current scale */
const buildRoleMap = (rootNote: string, intervals: number[]): Map<number, IntervalRole> => {
  const rootPc = NOTE_NAMES.indexOf(rootNote as typeof NOTE_NAMES[number]);
  if (rootPc === -1) return new Map();

  const map = new Map<number, IntervalRole>();
  intervals.forEach((semitones, idx) => {
    const pc = (rootPc + semitones) % 12;
    const role = INTERVAL_IDX_TO_ROLE[idx] ?? "scale";
    // Don't overwrite higher-priority roles
    if (!map.has(pc) || map.get(pc) === "scale") {
      map.set(pc, role);
    }
  });
  return map;
};

// ─── Key Style Helpers ────────────────────────────────────────────────────────

const WHITE_KEY_ROLE_STYLES: Record<IntervalRole, string> = {
  root:  "bg-gradient-to-b from-amber-100 to-amber-200 border-amber-400 shadow-amber-400/40 shadow-lg",
  third: "bg-gradient-to-b from-violet-200 to-violet-300 border-violet-500 shadow-violet-400/40 shadow-lg",
  fifth: "bg-gradient-to-b from-cyan-100 to-cyan-200 border-cyan-400 shadow-cyan-400/40 shadow-lg",
  scale: "bg-gradient-to-b from-white/90 to-white/70 border-white/60 shadow-white/20 shadow-md",
  none:  "bg-gradient-to-b from-[#e8e8e8] to-[#d0d0d0] border-white/10",
};

const BLACK_KEY_ROLE_STYLES: Record<IntervalRole, string> = {
  root:  "bg-gradient-to-b from-amber-500 to-amber-700 border-amber-400/60 shadow-amber-500/50 shadow-lg",
  third: "bg-gradient-to-b from-violet-500 to-violet-800 border-violet-400/60 shadow-violet-500/50 shadow-lg",
  fifth: "bg-gradient-to-b from-cyan-500 to-cyan-700 border-cyan-400/60 shadow-cyan-500/50 shadow-lg",
  scale: "bg-gradient-to-b from-neutral-400 to-neutral-600 border-white/30 shadow-white/10 shadow-md",
  none:  "bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] border-white/5",
};

const DOT_COLOR: Record<IntervalRole, string> = {
  root:  "bg-amber-500",
  third: "bg-violet-500",
  fifth: "bg-cyan-400",
  scale: "bg-white/80",
  none:  "",
};

const LABEL_COLOR: Record<IntervalRole, string> = {
  root:  "text-amber-900 font-bold",
  third: "text-violet-900 font-bold",
  fifth: "text-cyan-900 font-bold",
  scale: "text-neutral-600 font-semibold",
  none:  "text-neutral-500",
};

// ─── Sub-Components ──────────────────────────────────────────────────────────

const WhiteKey = ({ 
    midi, 
    role, 
    showLabels, 
    width, 
    height,
    fullRange
  }: { 
    midi: number; 
    role: IntervalRole; 
    showLabels: boolean; 
    width: number; 
    height: number;
    fullRange?: boolean;
  }) => {
    const label = midiToNoteName(midi);
    const labelFontSize = fullRange ? "text-[8px]" : "text-[9px]";
    const dotSize = fullRange ? "w-2 h-2" : "w-2.5 h-2.5";
    const dotTop = fullRange ? "top-1.5" : "top-2";

    return (
      <motion.button
        whileTap={{ scaleY: 0.97, y: 2 }}
        onClick={() => playMidiNote(midi)}
        className={cn(
          "relative border border-b-2 rounded-b-xl transition-all duration-100 cursor-pointer",
          "hover:brightness-105 active:brightness-95",
          WHITE_KEY_ROLE_STYLES[role]
        )}
        style={{ width, height, zIndex: 1 }}
        aria-label={`Piano key ${label}`}
        aria-pressed={role !== "none"}
        title={`${label}${role !== "none" ? ` (${role})` : ""}`}
      >
        <AnimatePresence>
          {role !== "none" && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className={cn(
                "absolute left-1/2 -translate-x-1/2 rounded-full",
                dotTop,
                dotSize,
                DOT_COLOR[role]
              )}
            />
          )}
        </AnimatePresence>

        {showLabels && (
          <span
            className={cn(
              "absolute bottom-2 left-1/2 -translate-x-1/2 leading-none",
              labelFontSize,
              LABEL_COLOR[role]
            )}
          >
            {NOTE_NAMES[midiToPitchClass(midi)]}
            <span className={cn("opacity-50 ml-0.5", fullRange ? "text-[6px]" : "text-[7px]")}>
              {Math.floor(midi / 12) - 1}
            </span>
          </span>
        )}
      </motion.button>
    );
  };

const BlackKey = ({ 
    midi, 
    role, 
    showLabels, 
    width, 
    height, 
    left,
    fullRange
  }: { 
    midi: number; 
    role: IntervalRole; 
    showLabels: boolean; 
    width: number; 
    height: number; 
    left: number;
    fullRange?: boolean;
  }) => {
    const label = midiToNoteName(midi);
    const labelFontSize = fullRange ? "text-[7px]" : "text-[7px]";
    const dotSize = fullRange ? "w-1.5 h-1.5" : "w-1.5 h-1.5";
    const dotTop = fullRange ? "top-1" : "top-1.5";

    return (
      <motion.button
        whileTap={{ scaleY: 0.97, y: 2 }}
        onClick={() => playMidiNote(midi)}
        className={cn(
          "absolute pointer-events-auto rounded-b-md border transition-all duration-100 cursor-pointer",
          "hover:brightness-125 active:brightness-75",
          BLACK_KEY_ROLE_STYLES[role]
        )}
        style={{
          left,
          width,
          height,
          zIndex: 2,
        }}
        aria-label={`Piano key ${label}`}
        aria-pressed={role !== "none"}
        title={`${label}${role !== "none" ? ` (${role})` : ""}`}
      >
        <AnimatePresence>
          {role !== "none" && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className={cn(
                "absolute left-1/2 -translate-x-1/2 rounded-full",
                dotTop,
                dotSize,
                DOT_COLOR[role]
              )}
            />
          )}
        </AnimatePresence>

        {showLabels && role !== "none" && (
          <span className={cn(
            "absolute bottom-1 left-1/2 -translate-x-1/2 font-bold text-white/90 leading-none",
            labelFontSize
          )}>
            {NOTE_NAMES[midiToPitchClass(midi)]}
          </span>
        )}
      </motion.button>
    );
  };

// ─── Component ────────────────────────────────────────────────────────────────

export const PianoKeyboard = ({
  scaleNotes,
  rootNote,
  intervals,
  startOctave = 3,
  numOctaves = 2,
  showLabels = true,
  fullRange = false,
  className,
}: PianoKeyboardProps) => {
  const WHITE_KEY_WIDTH = fullRange ? 24.5 : 44;
  const BLACK_KEY_WIDTH = fullRange ? 16 : 26;
  const KEY_HEIGHT = fullRange ? 140 : 160;

  // Build role map: pitchClass → IntervalRole
  const roleMap = useMemo(
    () => buildRoleMap(rootNote, intervals),
    [rootNote, intervals]
  );

  // Generate all keys in the range
  const allKeys = useMemo(() => {
    const keys: { midi: number; isBlack: boolean }[] = [];
    
    if (fullRange) {
      // 88-key range: A0 (MIDI 21) to C8 (MIDI 108)
      for (let midi = 21; midi <= 108; midi++) {
        keys.push({ midi, isBlack: BLACK_PITCH_CLASSES.has(midi % 12) });
      }
    } else {
      // Octave-based range
      for (let oct = startOctave; oct < startOctave + numOctaves; oct++) {
        for (let note = 0; note < 12; note++) {
          const midi = (oct + 1) * 12 + note;
          keys.push({ midi, isBlack: BLACK_PITCH_CLASSES.has(note) });
        }
      }
    }
    return keys;
  }, [startOctave, numOctaves, fullRange]);

  const whiteKeys = useMemo(() => allKeys.filter((k) => !k.isBlack), [allKeys]);
  const blackKeys = useMemo(() => allKeys.filter((k) => k.isBlack), [allKeys]);

  // Position map: white key midi → its index among white keys
  const whiteIdxByMidi = useMemo(() => {
    const m = new Map<number, number>();
    whiteKeys.forEach((k, i) => m.set(k.midi, i));
    return m;
  }, [whiteKeys]);

  const getRole = useCallback(
    (midi: number): IntervalRole => {
      const pc = midiToPitchClass(midi);
      return roleMap.get(pc) ?? "none";
    },
    [roleMap]
  );

  const totalWidth = whiteKeys.length * WHITE_KEY_WIDTH;
  const scrollRef = useRef<HTMLDivElement>(null);

  // Center on C4 (Middle C) in full range mode initially or when visibility changes
  useEffect(() => {
    if (fullRange && scrollRef.current) {
      const c4Midi = 60;
      const whiteIdx = whiteIdxByMidi.get(c4Midi);
      if (whiteIdx !== undefined) {
        const c4Pos = whiteIdx * WHITE_KEY_WIDTH;
        const containerWidth = scrollRef.current.clientWidth;
        // Center C4
        scrollRef.current.scrollLeft = c4Pos - containerWidth / 2 + WHITE_KEY_WIDTH / 2;
      }
    }
  }, [fullRange, whiteIdxByMidi, WHITE_KEY_WIDTH]);

  return (
    <div 
      ref={scrollRef}
      className={cn(
        "relative select-none pb-2 custom-scrollbar-visible overflow-x-auto w-full", 
        className
      )}
    >
      <div style={{ width: totalWidth }} className="relative mx-auto flex-shrink-0">
        {/* White Keys */}
        <div className="flex bg-[#050505] rounded-xl overflow-hidden shadow-2xl border border-white/5 relative" style={{ height: KEY_HEIGHT }}>
          {whiteKeys.map((key) => (
            <WhiteKey
              key={key.midi}
              midi={key.midi}
              role={getRole(key.midi)}
              showLabels={showLabels}
              width={WHITE_KEY_WIDTH}
              height={KEY_HEIGHT}
              fullRange={fullRange}
            />
          ))}
        </div>

        {/* Black Keys */}
        <div className="absolute top-0 left-0 pointer-events-none" style={{ height: KEY_HEIGHT * 0.62 }}>
          {blackKeys.map((key) => {
            const prevWhiteMidi = key.midi - 1;
            const whiteIdx = whiteIdxByMidi.get(prevWhiteMidi);
            if (whiteIdx === undefined) return null;

            const left = whiteIdx * WHITE_KEY_WIDTH + WHITE_KEY_WIDTH * 0.68;

            return (
              <BlackKey
                key={key.midi}
                midi={key.midi}
                role={getRole(key.midi)}
                showLabels={showLabels}
                width={BLACK_KEY_WIDTH}
                height={KEY_HEIGHT * 0.6}
                left={left}
                fullRange={fullRange}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PianoKeyboard;
