/**
 * Types for keyboard-integrated fretboard controls
 */

export interface FretPosition {
  string: number; // 0-5 (E A D G B e)
  fret: number;   // 0-24
}

export interface NoteMapping {
  key: string;
  position: FretPosition;
  note: string;
}

export interface KeymapConfig {
  notes: NoteMapping[];
  downStrum: string;
  upStrum: string;
  octaveUp: string;
  octaveDown: string;
}

export interface KeyboardFretboardOptions {
  enabled: boolean;
  keymap: KeymapConfig;
  strumSpeed: number; // ms between each string
  velocityProfile: 'linear' | 'exponential' | 'uniform';
  chordMode: boolean; // true = chord strum, false = single note
  onNoteOn?: (note: string, velocity: number, position: FretPosition) => void;
  onNoteOff?: (note: string, position: FretPosition) => void;
  onStrumDown?: () => void;
  onStrumUp?: () => void;
}

export const DEFAULT_KEYMAP: KeymapConfig = {
  notes: [
    // Home row mapped to common positions
    { key: 'a', position: { string: 5, fret: 0 }, note: 'E' },
    { key: 's', position: { string: 5, fret: 1 }, note: 'F' },
    { key: 'd', position: { string: 5, fret: 2 }, note: 'F#' },
    { key: 'f', position: { string: 5, fret: 3 }, note: 'G' },
    { key: 'g', position: { string: 4, fret: 0 }, note: 'A' },
    { key: 'h', position: { string: 4, fret: 1 }, note: 'A#' },
    { key: 'j', position: { string: 4, fret: 2 }, note: 'B' },
    { key: 'k', position: { string: 4, fret: 3 }, note: 'C' },
    { key: 'l', position: { string: 3, fret: 0 }, note: 'D' },
  ],
  downStrum: 'Enter',
  upStrum: 'Shift',
  octaveUp: '=',
  octaveDown: '-',
};
