/**
 * Types for chord detection system
 */

export interface ChordCandidate {
  name: string;
  root: string;
  intervals: number[];
  inversion: number; // 0 = root position, 1 = first inversion, etc.
  score: number; // 0-100, confidence score
  bassNote: string;
  alternateNames?: string[];
  voicings?: number[][]; // Suggested fretboard voicings
}

export interface ChordPattern {
  name: string;
  intervals: number[];
  priority: number; // Higher = checked first
  alternateNames?: string[];
}

export type DetectionStrictness = 'lenient' | 'strict';

export interface ChordDetectionSettings {
  strictness: DetectionStrictness;
  maxCandidates: number;
  allowInversions: boolean;
  minNotes: number;
}

// Comprehensive chord pattern library
export const CHORD_PATTERNS: ChordPattern[] = [
  // Triads (highest priority)
  { name: 'Major', intervals: [0, 4, 7], priority: 100, alternateNames: ['M', ''] },
  { name: 'Minor', intervals: [0, 3, 7], priority: 100, alternateNames: ['m', 'min', '-'] },
  { name: 'Diminished', intervals: [0, 3, 6], priority: 90, alternateNames: ['dim', 'º'] },
  { name: 'Augmented', intervals: [0, 4, 8], priority: 90, alternateNames: ['aug', '+'] },
  
  // Suspended chords
  { name: 'sus2', intervals: [0, 2, 7], priority: 85 },
  { name: 'sus4', intervals: [0, 5, 7], priority: 85 },
  
  // Seventh chords
  { name: 'Dominant 7', intervals: [0, 4, 7, 10], priority: 80, alternateNames: ['7'] },
  { name: 'Major 7', intervals: [0, 4, 7, 11], priority: 80, alternateNames: ['maj7', 'M7', 'Δ'] },
  { name: 'Minor 7', intervals: [0, 3, 7, 10], priority: 80, alternateNames: ['m7', 'min7', '-7'] },
  { name: 'Minor Major 7', intervals: [0, 3, 7, 11], priority: 70, alternateNames: ['m(maj7)', 'mM7'] },
  { name: 'Diminished 7', intervals: [0, 3, 6, 9], priority: 75, alternateNames: ['dim7', 'º7'] },
  { name: 'Half-Diminished 7', intervals: [0, 3, 6, 10], priority: 75, alternateNames: ['m7♭5', 'ø7'] },
  
  // Sixth chords
  { name: '6', intervals: [0, 4, 7, 9], priority: 70 },
  { name: 'Minor 6', intervals: [0, 3, 7, 9], priority: 70, alternateNames: ['m6'] },
  
  // Extended chords
  { name: '9', intervals: [0, 4, 7, 10, 14], priority: 60 },
  { name: 'Major 9', intervals: [0, 4, 7, 11, 14], priority: 60, alternateNames: ['maj9', 'M9'] },
  { name: 'Minor 9', intervals: [0, 3, 7, 10, 14], priority: 60, alternateNames: ['m9'] },
  { name: 'add9', intervals: [0, 4, 7, 14], priority: 65 },
  { name: 'madd9', intervals: [0, 3, 7, 14], priority: 65 },
  
  // Altered chords
  { name: '7♯9', intervals: [0, 4, 7, 10, 15], priority: 50, alternateNames: ['7#9'] },
  { name: '7♭9', intervals: [0, 4, 7, 10, 13], priority: 50, alternateNames: ['7b9'] },
  { name: '7♯5', intervals: [0, 4, 8, 10], priority: 55, alternateNames: ['7#5', '7aug'] },
  { name: '7♭5', intervals: [0, 4, 6, 10], priority: 55, alternateNames: ['7b5'] },
];

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
