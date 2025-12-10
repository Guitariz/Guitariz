import { ChordRoot, ChordVariant } from "@/types/chordTypes";

interface OldChordData {
  name: string;
  positions: number[];
  fingers: string[];
}

/**
 * Adapter to convert old flat chord list to new root→variants schema
 * This ensures backward compatibility with existing chord data
 */
export const adaptOldChordData = (oldChords: OldChordData[]): ChordRoot[] => {
  const rootMap = new Map<string, ChordVariant[]>();

  oldChords.forEach((chord) => {
    // Extract root and variant from chord name (e.g., "C Major" → root: "C", variant: "Major")
    const match = chord.name.match(/^([A-G][#b]?)\s*(.*)$/);
    if (!match) return;

    const [, root, variantName] = match;
    const variant = variantName.trim() || "Major";

    // Create variant object
    const chordVariant: ChordVariant = {
      name: variant,
      fullName: chord.name,
      intervals: getIntervals(variant),
      voicings: [
        {
          frets: chord.positions,
          fingers: chord.fingers,
          position: Math.min(...chord.positions.filter(p => p > 0)) || 0,
          difficulty: getDifficulty(chord.positions),
        },
      ],
      theoryText: getTheoryText(variant),
    };

    // Add to root map
    if (!rootMap.has(root)) {
      rootMap.set(root, []);
    }
    rootMap.get(root)!.push(chordVariant);
  });

  // Convert map to array of ChordRoot objects
  return Array.from(rootMap.entries()).map(([root, variants]) => ({
    root,
    variants,
  }));
};

// Helper functions
const getIntervals = (variant: string): string => {
  const intervalMap: Record<string, string> = {
    "Major": "1-3-5",
    "Minor": "1-♭3-5",
    "m": "1-♭3-5",
    "7": "1-3-5-♭7",
    "M7": "1-3-5-7",
    "maj7": "1-3-5-7",
    "m7": "1-♭3-5-♭7",
    "sus4": "1-4-5",
    "sus2": "1-2-5",
    "add9": "1-3-5-9",
    "dim": "1-♭3-♭5",
    "aug": "1-3-♯5",
    "6": "1-3-5-6",
    "m6": "1-♭3-5-6",
  };
  return intervalMap[variant] || "1-3-5";
};

const getTheoryText = (variant: string): string => {
  const theoryMap: Record<string, string> = {
    "Major": "The major chord consists of the root, major third, and perfect fifth. It has a bright, happy sound.",
    "Minor": "The minor chord replaces the major third with a minor third, creating a sad or melancholic sound.",
    "m": "The minor chord replaces the major third with a minor third, creating a sad or melancholic sound.",
    "7": "The dominant 7th chord adds a minor seventh to the major triad. Common in blues and jazz.",
    "M7": "The major 7th chord adds a major seventh to the major triad. Creates a dreamy, jazzy sound.",
    "maj7": "The major 7th chord adds a major seventh to the major triad. Creates a dreamy, jazzy sound.",
    "m7": "The minor 7th chord adds a minor seventh to the minor triad. Common in jazz and R&B.",
    "sus4": "The sus4 chord replaces the third with a perfect fourth, creating tension that resolves to major.",
    "sus2": "The sus2 chord replaces the third with a major second, creating an open, airy sound.",
  };
  return theoryMap[variant] || "A common chord variant.";
};

const getDifficulty = (positions: number[]): "easy" | "medium" | "hard" => {
  const activePositions = positions.filter(p => p >= 0);
  const hasBarres = positions.filter((p, i) => p > 0 && positions[i + 1] === p).length > 1;
  const maxFret = Math.max(...activePositions);
  
  if (hasBarres || maxFret > 5) return "hard";
  if (activePositions.length > 4) return "medium";
  return "easy";
};
