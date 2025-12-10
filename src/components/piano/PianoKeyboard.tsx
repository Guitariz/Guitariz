/**
 * Visual piano keyboard component
 * Displays interactive piano keys with active note highlighting
 */

import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface PianoKey {
  midiNote: number;
  noteName: string;
  isBlack: boolean;
  octave: number;
}

interface PianoKeyboardProps {
  startOctave?: number;
  numOctaves?: number;
  activeNotes?: number[];
  onNoteClick?: (midiNote: number) => void;
  className?: string;
}

// Generate piano keys for given range
const generateKeys = (startOctave: number, numOctaves: number): PianoKey[] => {
  const keys: PianoKey[] = [];
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const blackKeys = new Set([1, 3, 6, 8, 10]); // C#, D#, F#, G#, A#
  
  for (let octave = startOctave; octave < startOctave + numOctaves; octave++) {
    for (let note = 0; note < 12; note++) {
      // MIDI note calculation: C4 (middle C) = 60, so C0 = 12, C-1 = 0
      const midiNote = (octave + 1) * 12 + note;
      keys.push({
        midiNote,
        noteName: `${noteNames[note]}${octave - 1}`,
        isBlack: blackKeys.has(note),
        octave,
      });
    }
  }
  
  return keys;
};

export const PianoKeyboard = ({
  startOctave = 3,
  numOctaves = 2,
  activeNotes = [],
  onNoteClick,
  className,
}: PianoKeyboardProps) => {
  const keys = useMemo(() => generateKeys(startOctave, numOctaves), [startOctave, numOctaves]);
  const activeNoteSet = useMemo(() => new Set(activeNotes), [activeNotes]);

  const whiteKeys = keys.filter(k => !k.isBlack);
  const blackKeys = keys.filter(k => k.isBlack);

  return (
    <div className={cn("relative select-none", className)} role="group" aria-label="Piano keyboard">
      {/* White keys */}
      <div className="flex gap-[2px]">
        {whiteKeys.map((key) => (
          <button
            key={key.midiNote}
            onClick={() => onNoteClick?.(key.midiNote)}
            className={cn(
              "relative h-32 w-10 rounded-b-lg border-2 border-border bg-background transition-all",
              "hover:bg-accent hover:shadow-md active:translate-y-1",
              activeNoteSet.has(key.midiNote) && "bg-primary text-primary-foreground shadow-lg shadow-primary/50 scale-95"
            )}
            aria-label={`Piano key ${key.noteName}`}
            aria-pressed={activeNoteSet.has(key.midiNote)}
          >
            <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-medium font-['Inter'] opacity-50">
              {key.noteName}
            </span>
          </button>
        ))}
      </div>

      {/* Black keys - positioned absolutely over white keys */}
      <div className="absolute top-0 left-0 right-0 flex pointer-events-none">
        {whiteKeys.map((whiteKey) => {
          // Determine the note name to check if there should be a black key after it
          const whiteNoteName = whiteKey.noteName.replace(/\d+$/, ''); // Remove octave number
          
          // E and B don't have black keys after them
          if (whiteNoteName === 'E' || whiteNoteName === 'B') {
            return <div key={whiteKey.midiNote} className="w-10 flex-shrink-0" />;
          }

          // Find the black key that comes after this white key (should be +1 semitone)
          const nextBlackKey = blackKeys.find(
            bk => bk.midiNote === whiteKey.midiNote + 1
          );

          if (!nextBlackKey) {
            return <div key={whiteKey.midiNote} className="w-10 flex-shrink-0" />;
          }

          return (
            <div key={whiteKey.midiNote} className="relative w-10 flex-shrink-0">
              <button
                onClick={() => onNoteClick?.(nextBlackKey.midiNote)}
                className={cn(
                  "absolute top-0 left-[70%] -translate-x-1/2 h-20 w-7 rounded-b-md",
                  "bg-foreground border-2 border-border pointer-events-auto",
                  "hover:bg-foreground/80 transition-all active:translate-y-1 shadow-md",
                  activeNoteSet.has(nextBlackKey.midiNote) && "bg-primary border-primary shadow-lg shadow-primary/50 scale-95"
                )}
                aria-label={`Piano key ${nextBlackKey.noteName}`}
                aria-pressed={activeNoteSet.has(nextBlackKey.midiNote)}
              >
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-medium font-['Inter'] text-background opacity-70">
                  {nextBlackKey.noteName}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
