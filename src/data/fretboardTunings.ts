export interface GuitarTuning {
  id: string;
  name: string;
  notes: string[]; // From low (string 6) to high (string 1)
  baseFreqs: number[];
  description: string;
}

export const GUITAR_TUNINGS: GuitarTuning[] = [
  {
    id: "standard",
    name: "Standard (E A D G B E)",
    notes: ["E", "A", "D", "G", "B", "E"],
    baseFreqs: [82.41, 110.00, 146.83, 196.00, 246.94, 329.63],
    description: "Standard concert guitar tuning"
  },
  {
    id: "drop_d",
    name: "Drop D (D A D G B E)",
    notes: ["D", "A", "D", "G", "B", "E"],
    baseFreqs: [73.42, 110.00, 146.83, 196.00, 246.94, 329.63],
    description: "Low E dropped by a full step for heavy power chords"
  },
  {
    id: "half_step_down",
    name: "Half-Step Down (Eb Ab Db Gb Bb Eb)",
    notes: ["D#", "G#", "C#", "F#", "A#", "D#"],
    baseFreqs: [77.78, 103.83, 138.59, 185.00, 233.08, 311.13],
    description: "Hendrix / SRV / Slash tuning (Eb Standard)"
  },
  {
    id: "full_step_down",
    name: "Full Step Down (D G C F A D)",
    notes: ["D", "G", "C", "F", "A", "D"],
    baseFreqs: [73.42, 98.00, 130.81, 174.61, 220.00, 293.66],
    description: "D Standard tuning with lower tension"
  },
  {
    id: "open_d",
    name: "Open D (D A D F# A D)",
    notes: ["D", "A", "D", "F#", "A", "D"],
    baseFreqs: [73.42, 110.00, 146.83, 185.00, 220.00, 293.66],
    description: "Resonates into a full D major triad when strummed open"
  },
  {
    id: "open_g",
    name: "Open G (D G D G B D)",
    notes: ["D", "G", "D", "G", "B", "D"],
    baseFreqs: [73.42, 98.00, 146.83, 196.00, 246.94, 293.66],
    description: "Classic blues and Rolling Stones Keith Richards tuning"
  },
  {
    id: "dadgad",
    name: "DADGAD (Celtic / Folk)",
    notes: ["D", "A", "D", "G", "A", "D"],
    baseFreqs: [73.42, 110.00, 146.83, 196.00, 220.00, 293.66],
    description: "Rich modal drone tuning widely used in Celtic and fingerstyle"
  }
];

export interface QuickChordPreset {
  name: string;
  displayName: string;
  frets: number[]; // -1 = mute, 0 = open, 1+ = frets [Low E, A, D, G, B, e]
  category: "open" | "barre" | "seventh";
}

export const COMMON_CHORD_PRESETS: QuickChordPreset[] = [
  { name: "C", displayName: "C Major", frets: [-1, 3, 2, 0, 1, 0], category: "open" },
  { name: "G", displayName: "G Major", frets: [3, 2, 0, 0, 0, 3], category: "open" },
  { name: "D", displayName: "D Major", frets: [-1, -1, 0, 2, 3, 2], category: "open" },
  { name: "A", displayName: "A Major", frets: [-1, 0, 2, 2, 2, 0], category: "open" },
  { name: "E", displayName: "E Major", frets: [0, 2, 2, 1, 0, 0], category: "open" },
  { name: "Am", displayName: "A Minor", frets: [-1, 0, 2, 2, 1, 0], category: "open" },
  { name: "Em", displayName: "E Minor", frets: [0, 2, 2, 0, 0, 0], category: "open" },
  { name: "Dm", displayName: "D Minor", frets: [-1, -1, 0, 2, 3, 1], category: "open" },
  { name: "F", displayName: "F Major (Barre)", frets: [1, 3, 3, 2, 1, 1], category: "barre" },
  { name: "Bm", displayName: "B Minor (Barre)", frets: [-1, 2, 4, 4, 3, 2], category: "barre" },
  { name: "C7", displayName: "C Dominant 7", frets: [-1, 3, 2, 3, 1, 0], category: "seventh" },
  { name: "Am7", displayName: "A Minor 7", frets: [-1, 0, 2, 0, 1, 0], category: "seventh" },
];
