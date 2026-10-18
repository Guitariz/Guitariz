import { Chord, Note } from "tonal";

export interface IdentifiedChord {
  symbol: string;
  notes: string[];
  intervals: string[];
  inversion?: "1st" | "2nd" | "3rd" | "root";
  root?: string;
  bass?: string;
  type?: string;
  score: number;
  omittedFifth?: boolean;
}

export interface NearMatch {
  symbol: string;
  ignoredNote?: string;
  message: string;
}

export interface ChordIdentificationResult {
  status: "empty" | "single" | "interval" | "match" | "none";
  primary?: IdentifiedChord;
  alternates: IdentifiedChord[];
  moreNames: IdentifiedChord[];
  nearMatches: NearMatch[];
  message?: string;
}

export interface IdentifyChordOptions {
  accidental?: "sharp" | "flat";
}

const SHARP_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const FLAT_NAMES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

const INTERVAL_NAMES: Record<number, string> = {
  0: "unison",
  1: "minor 2nd",
  2: "major 2nd",
  3: "minor 3rd",
  4: "major 3rd",
  5: "perfect 4th",
  6: "tritone",
  7: "perfect 5th",
  8: "minor 6th",
  9: "major 6th",
  10: "minor 7th",
  11: "major 7th",
};

/**
 * Standardize raw chord symbol from Tonal:
 * e.g. "CM" -> "C", "CM/E" -> "C/E", "C7no5" -> "C7"
 */
function normalizeSymbol(sym: string): string {
  let s = sym.replace(/^([A-G][b#]?)M(\b|\/)/, "$1$2");
  s = s.replace(/no5/g, "");
  return s;
}

/**
 * Score a chord type to rank common types ahead of exotic ones.
 */
function getChordWeight(symbol: string): { weight: number; isExotic: boolean } {
  // Strip slash note for quality check
  const base = symbol.split("/")[0];
  const quality = base.replace(/^[A-G][b#]?/, "");

  // Highly exotic spellings
  if (
    quality.includes("#5") ||
    quality.includes("b5") ||
    quality.includes("alt") ||
    quality.includes("lyd") ||
    quality.includes("maj7#5") ||
    quality.includes("11b")
  ) {
    return { weight: 30, isExotic: true };
  }

  // Major / Minor triads
  if (quality === "" || quality === "m") {
    return { weight: 100, isExotic: false };
  }

  // Common 7ths, 6ths, sus, add9
  if (
    ["7", "maj7", "m7", "6", "m6", "sus4", "sus2", "add9", "9", "m9", "maj9"].includes(
      quality
    )
  ) {
    return { weight: 88, isExotic: false };
  }

  // Diminished, augmented, m7b5
  if (["dim", "aug", "dim7", "m7b5", "h7"].includes(quality)) {
    return { weight: 75, isExotic: false };
  }

  // Extended chords
  if (["11", "13", "m11", "maj13"].includes(quality)) {
    return { weight: 65, isExotic: false };
  }

  return { weight: 50, isExotic: false };
}

/**
 * Determine inversion label (1st, 2nd, 3rd) given root and bass note
 */
function calculateInversion(
  chordObj: ReturnType<typeof Chord.get>,
  bassPitchClass: string
): "1st" | "2nd" | "3rd" | undefined {
  if (!chordObj || chordObj.empty) {
    return undefined;
  }
  const rootPc = chordObj.tonic || chordObj.notes?.[0];
  if (!rootPc || rootPc === bassPitchClass) {
    return undefined;
  }

  if (chordObj.rootDegree === 2) return "1st";
  if (chordObj.rootDegree === 3) return "2nd";
  if (chordObj.rootDegree === 4) return "3rd";

  // Fallback: check index within root-position chord notes
  const rootChord = Chord.get(chordObj.tonic || rootPc);
  if (rootChord && rootChord.notes && rootChord.notes.length > 0) {
    const idx = rootChord.notes.findIndex(
      (n) => Note.pitchClass(n) === Note.pitchClass(bassPitchClass)
    );
    if (idx === 1) return "1st";
    if (idx === 2) return "2nd";
    if (idx === 3) return "3rd";
  }

  return "1st";
}

export function identifyChord(
  midiNotes: number[],
  options: IdentifyChordOptions = {}
): ChordIdentificationResult {
  if (!midiNotes || midiNotes.length === 0) {
    return {
      status: "empty",
      alternates: [],
      moreNames: [],
      nearMatches: [],
      message: "No notes selected",
    };
  }

  // Sort by MIDI pitch ascending so lowest note is bass
  const sortedMidi = [...new Set(midiNotes)].sort((a, b) => a - b);
  const scale = options.accidental === "sharp" ? SHARP_NAMES : FLAT_NAMES;

  // Bass note
  const bassMidi = sortedMidi[0];
  const bassPitchClass = scale[bassMidi % 12];

  // Unique pitch classes in order of first appearance from lowest to highest
  const pitchClasses: string[] = [];
  const seenPcs = new Set<number>();
  for (const m of sortedMidi) {
    const pcNum = m % 12;
    if (!seenPcs.has(pcNum)) {
      seenPcs.add(pcNum);
      pitchClasses.push(scale[pcNum]);
    }
  }

  // Single note
  if (pitchClasses.length === 1) {
    const noteName = pitchClasses[0];
    return {
      status: "single",
      primary: {
        symbol: noteName,
        notes: [noteName],
        intervals: ["1P"],
        root: noteName,
        bass: noteName,
        score: 100,
      },
      alternates: [],
      moreNames: [],
      nearMatches: [],
      message: `Single note: ${noteName}`,
    };
  }

  // Two notes
  if (pitchClasses.length === 2) {
    const intervalSemitones = (sortedMidi[1] - sortedMidi[0]) % 12;
    const intervalName = INTERVAL_NAMES[intervalSemitones] || `${intervalSemitones} semitones`;
    const note1 = pitchClasses[0];
    const note2 = pitchClasses[1];

    // Perfect 5th forms a power chord (e.g. C5)
    if (intervalSemitones === 7) {
      const symbol = `${note1}5`;
      return {
        status: "match",
        primary: {
          symbol,
          notes: [note1, note2],
          intervals: ["1P", "5P"],
          root: note1,
          bass: note1,
          score: 95,
        },
        alternates: [],
        moreNames: [],
        nearMatches: [],
        message: `${note1} Power Chord (${symbol})`,
      };
    }

    return {
      status: "interval",
      primary: {
        symbol: `${note1} + ${note2}`,
        notes: [note1, note2],
        intervals: ["1P", `${intervalSemitones}s`],
        root: note1,
        bass: note1,
        score: 80,
      },
      alternates: [],
      moreNames: [],
      nearMatches: [],
      message: `${note1} + ${note2}: a ${intervalName}`,
    };
  }

  // 3 or more notes: detect candidates
  const candidatesMap = new Map<string, IdentifiedChord>();

  const processCandidates = (rawDetections: string[], omittedFifth = false) => {
    for (const raw of rawDetections) {
      const sym = normalizeSymbol(raw);
      if (candidatesMap.has(sym)) continue;

      const chordInfo = Chord.get(raw) || Chord.get(sym);
      const { weight, isExotic } = getChordWeight(sym);

      let score = weight;
      const isSlash = sym.includes("/");

      if (isSlash) {
        score -= 8;
      }

      if (omittedFifth) {
        score -= 8;
      }

      const rootPc = chordInfo.tonic || sym.split("/")[0].replace(/m|dim|aug|sus.*|add.*|\d+.*/, "");
      const isRootInBass = !isSlash && rootPc === bassPitchClass;
      if (isRootInBass) {
        score += 5; // Bonus for root position
      }

      let inversion: "1st" | "2nd" | "3rd" | undefined = undefined;
      if (isSlash || rootPc !== bassPitchClass) {
        inversion = calculateInversion(chordInfo, bassPitchClass);
      }

      candidatesMap.set(sym, {
        symbol: sym,
        notes: chordInfo.notes?.length ? chordInfo.notes : pitchClasses,
        intervals: chordInfo.intervals || [],
        inversion,
        root: rootPc,
        bass: bassPitchClass,
        score,
        omittedFifth,
        type: chordInfo.type,
      });
    }
  };

  // 1. Direct detection on current pitch classes
  const rawList1 = Chord.detect(pitchClasses);
  processCandidates(rawList1);

  // 2. Detection with candidate missing 5th (assumePerfectFifth)
  // For each pitch class in the chord, add a perfect 5th (7 semitones) and run Chord.detect
  for (const pc of pitchClasses) {
    const pcNum = (scale.indexOf(pc) + 7) % 12;
    const fifthPc = scale[pcNum];
    if (!pitchClasses.includes(fifthPc)) {
      const augmentedWithFifth = [...pitchClasses, fifthPc];
      const rawList5th = Chord.detect(augmentedWithFifth);
      // Filter rawList5th to ones where the root tonic matches pc
      for (const raw of rawList5th) {
        const info = Chord.get(raw);
        if (info && info.tonic === pc) {
          processCandidates([raw], true);
        }
      }
    }
  }

  // Sort candidates by score descending
  const allCandidates = Array.from(candidatesMap.values()).sort((a, b) => b.score - a.score);

  if (allCandidates.length > 0) {
    const primary = allCandidates[0];
    const alternates: IdentifiedChord[] = [];
    const moreNames: IdentifiedChord[] = [];

    for (let i = 1; i < allCandidates.length; i++) {
      const c = allCandidates[i];
      const { isExotic } = getChordWeight(c.symbol);
      if (isExotic || c.score < 50) {
        moreNames.push(c);
      } else {
        alternates.push(c);
      }
    }

    return {
      status: "match",
      primary,
      alternates,
      moreNames,
      nearMatches: [],
    };
  }

  // If no match with >= 4 notes, search nearMatches by omitting 1 non-bass note
  const nearMatches: NearMatch[] = [];
  if (pitchClasses.length >= 4) {
    for (let i = 1; i < pitchClasses.length; i++) {
      const ignoredNote = pitchClasses[i];
      const subset = pitchClasses.filter((_, idx) => idx !== i);
      const subsetDetections = Chord.detect(subset);
      for (const raw of subsetDetections) {
        const sym = normalizeSymbol(raw);
        const { isExotic } = getChordWeight(sym);
        if (!isExotic && !nearMatches.some((nm) => nm.symbol === sym)) {
          nearMatches.push({
            symbol: sym,
            ignoredNote,
            message: `${sym} if you ignore the ${ignoredNote}`,
          });
          if (nearMatches.length >= 3) break;
        }
      }
      if (nearMatches.length >= 3) break;
    }
  }

  return {
    status: "none",
    alternates: [],
    moreNames: [],
    nearMatches,
    message: "No standard chord matches the selected notes",
  };
}
