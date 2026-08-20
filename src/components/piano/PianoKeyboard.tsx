/**
 * PianoKeyboard.tsx
 * High-fidelity realistic virtual piano keyboard.
 * Features ivory white keys, ebony black keys, red felt acoustic strip,
 * active glowing note states, scale interval coloring, computer keyboard hints,
 * and an interactive bouncing C4 onboarding guide.
 */

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { playNote } from "@/lib/chordAudio";

// ─── Types ────────────────────────────────────────────────────────────────────

export type IntervalRole = "root" | "third" | "fifth" | "scale" | "none";

export interface PianoNoteInfo {
  pitchClass: number;
  role: IntervalRole;
}

export interface PianoKeyboardProps {
  scaleNotes?: string[];
  rootNote?: string;
  intervals?: number[];
  startOctave?: number;
  numOctaves?: number;
  showLabels?: boolean;
  showKeymapHints?: boolean;
  fullRange?: boolean;
  className?: string;
  activeNotes?: number[];
  onNoteClick?: (midi: number) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;
const BLACK_PITCH_CLASSES = new Set([1, 3, 6, 8, 10]);

// QWERTY Computer keyboard mapping (C4 to E5)
const KEYBOARD_SHORTCUTS: Record<number, string> = {
  60: "A", // C4
  61: "W", // C#4
  62: "S", // D4
  63: "E", // D#4
  64: "D", // E4
  65: "F", // F4
  66: "T", // F#4
  67: "G", // G4
  68: "Y", // G#4
  69: "H", // A4
  70: "U", // A#4
  71: "J", // B4
  72: "K", // C5
  73: "O", // C#5
  74: "L", // D5
  75: "P", // D#5
  76: ";", // E5
  77: "'", // F5
};

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

const playMidiNote = (midi: number): void => {
  const frequency = 440 * Math.pow(2, (midi - 69) / 12);
  playNote(frequency, 1.8, 0.45, "piano");
};

const buildRoleMap = (rootNote: string, intervals: number[]): Map<number, IntervalRole> => {
  if (!intervals || intervals.length === 0) return new Map();
  const rootPc = NOTE_NAMES.indexOf(rootNote as typeof NOTE_NAMES[number]);
  if (rootPc === -1) return new Map();

  const map = new Map<number, IntervalRole>();
  intervals.forEach((semitones, idx) => {
    const pc = (rootPc + semitones) % 12;
    const role = INTERVAL_IDX_TO_ROLE[idx] ?? "scale";
    if (!map.has(pc) || map.get(pc) === "scale") {
      map.set(pc, role);
    }
  });
  return map;
};

// ─── Key Style Configurations ─────────────────────────────────────────────────

const WHITE_KEY_ROLE_STYLES: Record<IntervalRole, string> = {
  root:  "bg-gradient-to-b from-amber-100 via-amber-200 to-amber-300 border-amber-400 text-amber-950 shadow-[0_0_15px_rgba(245,158,11,0.5)]",
  third: "bg-gradient-to-b from-violet-100 via-violet-200 to-violet-300 border-violet-400 text-violet-950 shadow-[0_0_15px_rgba(139,92,246,0.5)]",
  fifth: "bg-gradient-to-b from-cyan-100 via-cyan-200 to-cyan-300 border-cyan-400 text-cyan-950 shadow-[0_0_15px_rgba(6,182,212,0.5)]",
  scale: "bg-gradient-to-b from-emerald-100 via-emerald-200 to-emerald-300 border-emerald-400 text-emerald-950 shadow-[0_0_15px_rgba(16,185,129,0.4)]",
  none:  "bg-gradient-to-b from-[#ffffff] via-[#f7f7f9] to-[#e4e4e7] border-zinc-400/90 text-zinc-900 shadow-[0_5px_8px_rgba(0,0,0,0.3),inset_0_-4px_4px_rgba(0,0,0,0.06),inset_0_1px_2px_rgba(255,255,255,1)] hover:from-[#fcfcfd] hover:to-[#dbdbe0]",
};

const BLACK_KEY_ROLE_STYLES: Record<IntervalRole, string> = {
  root:  "bg-gradient-to-b from-amber-500 via-amber-600 to-amber-700 border-amber-400 text-white shadow-[0_0_15px_rgba(245,158,11,0.6)]",
  third: "bg-gradient-to-b from-violet-500 via-violet-600 to-violet-700 border-violet-400 text-white shadow-[0_0_15px_rgba(139,92,246,0.6)]",
  fifth: "bg-gradient-to-b from-cyan-500 via-cyan-600 to-cyan-700 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.6)]",
  scale: "bg-gradient-to-b from-emerald-500 via-emerald-600 to-emerald-700 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]",
  none:  "bg-gradient-to-b from-[#2d2d32] via-[#1a1a1d] to-[#09090c] border-black/90 text-zinc-100 shadow-[0_8px_14px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.2),inset_0_-3px_5px_rgba(0,0,0,0.8)] hover:from-[#3a3a40] hover:to-[#121216]",
};

const DOT_COLOR: Record<IntervalRole, string> = {
  root:  "bg-amber-500",
  third: "bg-violet-500",
  fifth: "bg-cyan-400",
  scale: "bg-emerald-400",
  none:  "",
};

// ─── Sub-Components ───────────────────────────────────────────────────────────

const WhiteKey = ({ 
  midi, 
  role, 
  showLabels, 
  showKeymapHints,
  width, 
  height,
  fullRange,
  isActive,
  showGuide,
  onDismissGuide,
  onNoteClick
}: { 
  midi: number; 
  role: IntervalRole; 
  showLabels: boolean; 
  showKeymapHints?: boolean;
  width: number; 
  height: number;
  fullRange?: boolean;
  isActive?: boolean;
  showGuide?: boolean;
  onDismissGuide?: () => void;
  onNoteClick?: (midi: number) => void;
}) => {
  const noteName = NOTE_NAMES[midiToPitchClass(midi)];
  const octave = Math.floor(midi / 12) - 1;
  const label = `${noteName}${octave}`;
  const isCKey = noteName === "C";
  const shortcutKey = KEYBOARD_SHORTCUTS[midi];

  return (
    <motion.button
      animate={isActive ? { scaleY: 0.96, y: 3 } : { scaleY: 1, y: 0 }}
      whileTap={{ scaleY: 0.96, y: 3 }}
      onClick={() => {
        if (showGuide && onDismissGuide) onDismissGuide();
        if (onNoteClick) onNoteClick(midi);
        else playMidiNote(midi);
      }}
      className={cn(
        "relative rounded-b-xl border-x border-b-2 transition-all duration-75 cursor-pointer origin-top select-none shrink-0 group",
        WHITE_KEY_ROLE_STYLES[role],
        isActive && "!bg-gradient-to-b !from-amber-200 !via-primary !to-amber-400 !border-amber-400 !text-black !shadow-[0_0_25px_rgba(245,158,11,0.9),inset_0_2px_4px_rgba(255,255,255,0.6)] !z-30",
        !isActive && "z-10"
      )}
      style={{ width, height }}
      aria-label={`Piano key ${label}`}
      title={`${label}${shortcutKey ? ` [Key: ${shortcutKey}]` : ""}${role !== "none" ? ` (${role})` : ""}`}
    >
      {/* Floating Animated Guide Tooltip above C4 (Middle C) */}
      {midi === 60 && showGuide && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: [0, -6, 0] }}
          transition={{ y: { repeat: Infinity, duration: 2, ease: "easeInOut" }, opacity: { duration: 0.3 } }}
          onClick={(e) => {
            e.stopPropagation();
            onDismissGuide?.();
          }}
          className="absolute -top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-auto cursor-pointer whitespace-nowrap bg-black/95 text-white border border-primary/70 px-3.5 py-2 rounded-xl shadow-[0_0_25px_rgba(245,158,11,0.7)] backdrop-blur-xl flex items-center gap-2"
          title="Click to dismiss guide"
        >
          <span className="text-sm">🎹</span>
          <div className="flex flex-col text-left leading-tight">
            <span className="text-[11px] font-black text-amber-300">
              Press <kbd className="px-1.5 py-0.5 rounded bg-primary text-black font-mono font-black text-[10px] shadow">A</kbd> to play!
            </span>
            <span className="text-[9px] text-muted-foreground">Type on your keyboard like a piano</span>
          </div>
          {/* Arrow pointing down */}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-black/95 border-r border-b border-primary/70 rotate-45" />
        </motion.div>
      )}

      {/* Interval Role Accent Dot */}
      {role !== "none" && (
        <span
          className={cn(
            "absolute top-3 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full shadow-sm",
            DOT_COLOR[role]
          )}
        />
      )}

      {/* Keyboard Shortcut Key Hint (A, S, D, F...) */}
      {showKeymapHints && shortcutKey && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 pointer-events-none">
          <span className={cn(
            "px-1 py-0.5 rounded text-[8px] font-mono font-black uppercase transition-opacity shadow-sm",
            isActive
              ? "bg-black text-white"
              : "bg-black/10 text-black/60 group-hover:bg-black/20 group-hover:text-black"
          )}>
            {shortcutKey}
          </span>
        </div>
      )}

      {/* Note Label at bottom of key */}
      {showLabels && (
        <div className="absolute bottom-2.5 left-0 right-0 text-center pointer-events-none">
          <span className={cn(
            "font-black tracking-tighter leading-none block",
            fullRange ? "text-[8px]" : "text-[11px]",
            isActive ? "text-black drop-shadow" : isCKey ? "text-primary font-black" : "text-zinc-700"
          )}>
            {noteName}
            <span className="text-[8px] opacity-60 ml-0.5 font-bold">{octave}</span>
          </span>
        </div>
      )}
    </motion.button>
  );
};

const BlackKey = ({ 
  midi, 
  role, 
  showLabels, 
  showKeymapHints,
  width, 
  height, 
  left,
  fullRange,
  isActive,
  onNoteClick
}: { 
  midi: number; 
  role: IntervalRole; 
  showLabels: boolean; 
  showKeymapHints?: boolean;
  width: number; 
  height: number; 
  left: number;
  fullRange?: boolean;
  isActive?: boolean;
  onNoteClick?: (midi: number) => void;
}) => {
  const noteName = NOTE_NAMES[midiToPitchClass(midi)];
  const octave = Math.floor(midi / 12) - 1;
  const label = `${noteName}${octave}`;
  const shortcutKey = KEYBOARD_SHORTCUTS[midi];

  return (
    <motion.button
      animate={isActive ? { scaleY: 0.94, y: 2 } : { scaleY: 1, y: 0 }}
      whileTap={{ scaleY: 0.94, y: 2 }}
      onClick={() => {
        if (onNoteClick) onNoteClick(midi);
        else playMidiNote(midi);
      }}
      className={cn(
        "absolute pointer-events-auto rounded-b-lg border border-black/80 transition-all duration-75 cursor-pointer origin-top select-none group",
        BLACK_KEY_ROLE_STYLES[role],
        isActive && "!bg-gradient-to-b !from-cyan-300 !via-primary !to-cyan-500 !border-cyan-200 !text-black !shadow-[0_0_25px_rgba(6,182,212,0.9),inset_0_2px_4px_rgba(255,255,255,0.6)] !z-40",
        !isActive && "z-20"
      )}
      style={{
        left,
        width,
        height,
      }}
      aria-label={`Piano key ${label}`}
      title={`${label}${shortcutKey ? ` [Key: ${shortcutKey}]` : ""}${role !== "none" ? ` (${role})` : ""}`}
    >
      {/* Interval Role Accent Dot */}
      {role !== "none" && (
        <span
          className={cn(
            "absolute top-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full shadow-sm",
            DOT_COLOR[role]
          )}
        />
      )}

      {/* Keyboard Shortcut Key Hint (W, E, T, Y...) */}
      {showKeymapHints && shortcutKey && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 pointer-events-none">
          <span className={cn(
            "px-1 py-0.5 rounded text-[8px] font-mono font-bold uppercase transition-opacity shadow-sm",
            isActive
              ? "bg-black text-white"
              : "bg-white/10 text-white/70 group-hover:bg-white/20 group-hover:text-white"
          )}>
            {shortcutKey}
          </span>
        </div>
      )}

      {/* Note Label at bottom of key */}
      {showLabels && (
        <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none">
          <span className={cn(
            "font-black tracking-tight leading-none block",
            fullRange ? "text-[7px]" : "text-[9px]",
            isActive ? "text-black font-black" : "text-zinc-300/80"
          )}>
            {noteName}
          </span>
        </div>
      )}
    </motion.button>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const PianoKeyboard = ({
  rootNote = "C",
  intervals = [],
  startOctave = 3,
  numOctaves = 2,
  showLabels = true,
  showKeymapHints = true,
  fullRange = false,
  className,
  activeNotes = [],
  onNoteClick
}: PianoKeyboardProps) => {
  const [showGuide, setShowGuide] = useState(() => {
    // Show guide by default on desktop, dismissible
    return true;
  });

  const WHITE_KEY_WIDTH = fullRange ? 26 : 46;
  const BLACK_KEY_WIDTH = fullRange ? 18 : 28;
  const KEY_HEIGHT = fullRange ? 150 : 175;
  const BLACK_KEY_HEIGHT = KEY_HEIGHT * 0.62;

  const roleMap = useMemo(
    () => buildRoleMap(rootNote, intervals),
    [rootNote, intervals]
  );

  const allKeys = useMemo(() => {
    const keys: { midi: number; isBlack: boolean }[] = [];
    
    if (fullRange) {
      for (let midi = 21; midi <= 108; midi++) {
        keys.push({ midi, isBlack: BLACK_PITCH_CLASSES.has(midi % 12) });
      }
    } else {
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

  useEffect(() => {
    if (fullRange && scrollRef.current) {
      const c4WhiteIndex = whiteIdxByMidi.get(60) ?? 23;
      const scrollPos = c4WhiteIndex * WHITE_KEY_WIDTH - scrollRef.current.clientWidth / 2 + WHITE_KEY_WIDTH / 2;
      scrollRef.current.scrollLeft = Math.max(0, scrollPos);
    }
  }, [fullRange, whiteIdxByMidi, WHITE_KEY_WIDTH]);

  // If any note is actively played via keyboard, dismiss guide automatically
  useEffect(() => {
    if (activeNotes.length > 0 && showGuide) {
      setShowGuide(false);
    }
  }, [activeNotes, showGuide]);

  return (
    <div
      ref={scrollRef}
      className={cn(
        "relative rounded-2xl bg-[#121014] p-3 md:p-4 pt-10 border border-zinc-800 shadow-[0_20px_50px_rgba(0,0,0,0.9)] max-w-full overflow-x-auto custom-scrollbar select-none",
        className
      )}
    >
      {/* Top Red Velvet / Acoustic Felt Strip */}
      <div 
        className="h-2.5 w-full rounded-t-sm mb-1 shadow-inner border-b border-red-950"
        style={{
          background: "linear-gradient(180deg, #991b1b 0%, #7f1d1d 50%, #450a0a 100%)",
          boxShadow: "inset 0 1px 2px rgba(255,255,255,0.2), 0 2px 4px rgba(0,0,0,0.5)"
        }}
      />

      {/* Keys Bed Area */}
      <div
        className="relative flex rounded-b-xl overflow-visible shadow-2xl bg-black"
        style={{ width: totalWidth, height: KEY_HEIGHT }}
      >
        {/* White Keys Row */}
        <div className="flex relative z-10">
          {whiteKeys.map((k) => (
            <WhiteKey
              key={k.midi}
              midi={k.midi}
              role={getRole(k.midi)}
              showLabels={showLabels}
              showKeymapHints={showKeymapHints}
              width={WHITE_KEY_WIDTH}
              height={KEY_HEIGHT}
              fullRange={fullRange}
              isActive={activeNotes.includes(k.midi)}
              showGuide={showGuide && k.midi === 60}
              onDismissGuide={() => setShowGuide(false)}
              onNoteClick={onNoteClick}
            />
          ))}
        </div>

        {/* Black Keys Layer (Absolute Positioned above White Keys) */}
        {blackKeys.map((k) => {
          const prevWhiteMidi = k.midi - 1;
          const whiteIndex = whiteIdxByMidi.get(prevWhiteMidi);
          if (whiteIndex === undefined) return null;

          const left = (whiteIndex + 1) * WHITE_KEY_WIDTH - BLACK_KEY_WIDTH / 2;

          return (
            <BlackKey
              key={k.midi}
              midi={k.midi}
              role={getRole(k.midi)}
              showLabels={showLabels}
              showKeymapHints={showKeymapHints}
              width={BLACK_KEY_WIDTH}
              height={BLACK_KEY_HEIGHT}
              left={left}
              fullRange={fullRange}
              isActive={activeNotes.includes(k.midi)}
              onNoteClick={onNoteClick}
            />
          );
        })}
      </div>
    </div>
  );
};

export default PianoKeyboard;
