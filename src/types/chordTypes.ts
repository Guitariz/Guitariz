export interface ChordVoicing {
  frets: number[];
  fingers: string[];
  position: number; // Fret position (0 = open, 1+ = barre position)
  difficulty: "easy" | "medium" | "hard";
}

export interface ChordVariant {
  name: string; // e.g., "Major", "Minor", "sus4"
  fullName: string; // e.g., "C Major", "C Minor"
  intervals: string; // e.g., "1-3-5", "1-♭3-5"
  voicings: ChordVoicing[];
  theoryText: string;
  audioSampleUrl?: string;
}

export interface ChordRoot {
  root: string; // e.g., "C", "C#/Db"
  variants: ChordVariant[];
}

export interface ChordLibraryData {
  roots: ChordRoot[];
  version: string;
}
