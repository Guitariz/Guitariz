/**
 * Types for piano keyboard integration
 */

export interface PianoKeyMapping {
  key: string;
  midiNote: number;
  noteName: string;
}

export interface PianoKeymapConfig {
  keys: PianoKeyMapping[];
  octaveUp: string;
  octaveDown: string;
  sustain: string;
}

export interface PianoKeyboardOptions {
  enabled: boolean;
  keymap: PianoKeymapConfig;
  onNoteOn?: (midiNote: number, velocity: number) => void;
  onNoteOff?: (midiNote: number) => void;
  onSustainChange?: (sustained: boolean) => void;
}

// QWERTY layout: C4-C5 chromatic
export const QWERTY_KEYMAP: PianoKeymapConfig = {
  keys: [
    // Lower row (white keys) - C4 to B4
    { key: 'a', midiNote: 60, noteName: 'C4' },
    { key: 's', midiNote: 62, noteName: 'D4' },
    { key: 'd', midiNote: 64, noteName: 'E4' },
    { key: 'f', midiNote: 65, noteName: 'F4' },
    { key: 'g', midiNote: 67, noteName: 'G4' },
    { key: 'h', midiNote: 69, noteName: 'A4' },
    { key: 'j', midiNote: 71, noteName: 'B4' },
    { key: 'k', midiNote: 72, noteName: 'C5' },
    { key: 'l', midiNote: 74, noteName: 'D5' },
    { key: ';', midiNote: 76, noteName: 'E5' },
    { key: '\'', midiNote: 77, noteName: 'F5' },
    
    // Upper row (black keys)
    { key: 'w', midiNote: 61, noteName: 'C#4' },
    { key: 'e', midiNote: 63, noteName: 'D#4' },
    { key: 't', midiNote: 66, noteName: 'F#4' },
    { key: 'y', midiNote: 68, noteName: 'G#4' },
    { key: 'u', midiNote: 70, noteName: 'A#4' },
    { key: 'o', midiNote: 73, noteName: 'C#5' },
    { key: 'p', midiNote: 75, noteName: 'D#5' },
    { key: '[', midiNote: 78, noteName: 'F#5' },
  ],
  octaveUp: 'x',
  octaveDown: 'z',
  sustain: ' ', // spacebar
};

// AZERTY layout variant
export const AZERTY_KEYMAP: PianoKeymapConfig = {
  keys: [
    { key: 'q', midiNote: 60, noteName: 'C4' },
    { key: 's', midiNote: 62, noteName: 'D4' },
    { key: 'd', midiNote: 64, noteName: 'E4' },
    { key: 'f', midiNote: 65, noteName: 'F4' },
    { key: 'g', midiNote: 67, noteName: 'G4' },
    { key: 'h', midiNote: 69, noteName: 'A4' },
    { key: 'j', midiNote: 71, noteName: 'B4' },
    { key: 'k', midiNote: 72, noteName: 'C5' },
    
    { key: 'z', midiNote: 61, noteName: 'C#4' },
    { key: 'e', midiNote: 63, noteName: 'D#4' },
    { key: 't', midiNote: 66, noteName: 'F#4' },
    { key: 'y', midiNote: 68, noteName: 'G#4' },
    { key: 'u', midiNote: 70, noteName: 'A#4' },
  ],
  octaveUp: 'x',
  octaveDown: 'w',
  sustain: ' ',
};

export type KeyboardPreset = 'qwerty' | 'azerty';
