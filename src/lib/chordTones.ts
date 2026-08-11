/**
 * chordTones.ts
 * Shared utilities for computing chord tones across instruments.
 *
 * - parseChordName   → { root, quality }
 * - getUkuleleFrets  → number[4] fret positions for GCEA ukulele
 * - getChordMidi     → MIDI note numbers for piano chord display
 */

// ─── Chromatic Reference ──────────────────────────────────────────────────────

const CHROMATIC = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;

const FLAT_TO_SHARP: Record<string, string> = {
  Db: "C#", Eb: "D#", Fb: "E", Gb: "F#", Ab: "G#", Bb: "A#", Cb: "B",
};

// ─── Chord Quality → Semitone Intervals ──────────────────────────────────────

const QUALITY_INTERVALS: Record<string, number[]> = {
  Major:  [0, 4, 7],
  minor:  [0, 3, 7],
  "7":    [0, 4, 7, 10],
  maj7:   [0, 4, 7, 11],
  m7:     [0, 3, 7, 10],
  sus4:   [0, 5, 7],
  sus2:   [0, 2, 7],
  dim:    [0, 3, 6],
  dim7:   [0, 3, 6, 9],
  aug:    [0, 4, 8],
  "6":    [0, 4, 7, 9],
  m6:     [0, 3, 7, 9],
  add9:   [0, 2, 4, 7],
  "9":    [0, 4, 7, 10, 14],
  m9:     [0, 3, 7, 10, 14],
  m7b5:   [0, 3, 6, 10],
};

// Suffix → quality key (longest match first to avoid "m" eating "maj7")
const SUFFIX_QUALITY: [string, string][] = [
  ["maj7",  "maj7"],
  ["maj9",  "maj7"],  // approximate
  ["maj",   "Major"],
  ["min7",  "m7"],
  ["min9",  "m9"],
  ["min",   "minor"],
  ["m7b5",  "m7b5"],
  ["m7",    "m7"],
  ["m9",    "m9"],
  ["m6",    "m6"],
  ["m",     "minor"],
  ["sus4",  "sus4"],
  ["sus2",  "sus2"],
  ["dim7",  "dim7"],
  ["dim",   "dim"],
  ["aug",   "aug"],
  ["+",     "aug"],
  ["°7",    "dim7"],
  ["°",     "dim"],
  ["add9",  "add9"],
  ["9",     "9"],
  ["7",     "7"],
  ["6",     "6"],
  ["",      "Major"],
];

// ─── Parse chord name ─────────────────────────────────────────────────────────

export interface ParsedChord {
  root: string;         // sharp-normalised, e.g. "C#"
  rootPc: number;       // pitch class 0-11
  quality: string;      // key into QUALITY_INTERVALS
  intervals: number[];
}

export function parseChordName(name: string): ParsedChord | null {
  if (!name) return null;

  // Strip Camelot / Chord-AI prefixes like "C:min", "D:maj"
  const cleaned = name.replace(/:/g, "");

  const rootMatch = cleaned.match(/^([A-G][#b]?)/);
  if (!rootMatch) return null;

  let root = rootMatch[1];
  root = FLAT_TO_SHARP[root] ?? root;

  const rootPc = CHROMATIC.indexOf(root as typeof CHROMATIC[number]);
  if (rootPc === -1) return null;

  const suffix = cleaned.slice(rootMatch[0].length).trim();

  // Find first matching quality by trying longest suffixes first
  let quality = "Major";
  for (const [sfx, q] of SUFFIX_QUALITY) {
    if (suffix.toLowerCase() === sfx.toLowerCase() || suffix === sfx) {
      quality = q;
      break;
    }
  }

  const intervals = QUALITY_INTERVALS[quality] ?? QUALITY_INTERVALS["Major"];
  return { root, rootPc, quality, intervals };
}

// ─── Ukulele voicing (GCEA standard tuning) ──────────────────────────────────

// Open string pitch classes: G=7, C=0, E=4, A=9
const UKE_OPEN_PC = [7, 0, 4, 9] as const;
// Open string names
export const UKE_STRING_LABELS = ["G", "C", "E", "A"] as const;

/**
 * Compute ukulele fret positions for a chord name.
 * Strategy: for each string find the lowest fret (0–5) that produces a chord tone.
 * Returns [-1,-1,-1,-1] if chord can't be parsed.
 */
export function getUkuleleFrets(chordName: string): { frets: number[]; fingers: string[] } {
  const parsed = parseChordName(chordName);
  if (!parsed) return { frets: [-1, -1, -1, -1], fingers: ["x", "x", "x", "x"] };

  const chordPcs = new Set(parsed.intervals.map(i => (parsed.rootPc + i) % 12));

  const frets = UKE_OPEN_PC.map(openPc => {
    for (let fret = 0; fret <= 5; fret++) {
      const pc = (openPc + fret) % 12;
      if (chordPcs.has(pc)) return fret;
    }
    return -1; // no chord tone reachable in 0-5
  });

  // Auto-compute finger numbers (sequential for fretted strings, ordered by fret)
  const fretted = frets
    .map((f, i) => ({ f, i }))
    .filter(x => x.f > 0)
    .sort((a, b) => a.f - b.f);

  let finger = 1;
  const fingerMap: Record<number, string> = {};
  let lastFret = -1;
  for (const { f, i } of fretted) {
    if (f !== lastFret) { finger++; lastFret = f; }
    fingerMap[i] = String(Math.min(finger, 4));
  }
  // Reset to 1-based sequential
  let nextFinger = 1;
  const seenFrets = new Map<number, string>();
  const fingers: string[] = frets.map((f, i) => {
    if (f < 0) return "x";
    if (f === 0) return "0";
    if (seenFrets.has(f)) return seenFrets.get(f)!;
    const s = String(nextFinger++);
    seenFrets.set(f, s);
    return s;
  });

  return { frets, fingers };
}

// ─── Piano / MIDI chord tones ─────────────────────────────────────────────────

/**
 * Returns MIDI note numbers for the chord, rooted in the given octave.
 * Intervals > 11 (e.g. 9ths) wrap into the next octave naturally.
 */
export function getChordMidi(chordName: string, octave = 4): number[] {
  const parsed = parseChordName(chordName);
  if (!parsed) return [];

  // MIDI = 12*(octave+1) + pitchClass  (C4=60 standard)
  const rootMidi = 12 * (octave + 1) + parsed.rootPc;
  return parsed.intervals.map(i => rootMidi + i);
}
