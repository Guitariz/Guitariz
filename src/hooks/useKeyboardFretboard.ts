/**
 * Custom hook for keyboard-integrated fretboard controls
 * Maps keyboard input to note playback with strum support
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { KeyboardFretboardOptions, FretPosition } from '@/types/keyboardTypes';
import { playNote, playChord } from '@/lib/chordAudio';

const GUITAR_TUNING = [82.41, 110.00, 146.83, 196.00, 246.94, 329.63]; // E A D G B e (Low to High)

const getNoteFrequency = (position: FretPosition): number => {
  const stringFreq = GUITAR_TUNING[position.string];
  return stringFreq * Math.pow(2, position.fret / 12);
};

export const useKeyboardFretboard = (options: KeyboardFretboardOptions) => {
  const {
    enabled,
    keymap,
    chordMode = false,
    onNoteOn,
    onNoteOff,
    onStrumDown,
  } = options;

  const pressedKeys = useRef<Set<string>>(new Set());
  const [activeNotes, setActiveNotes] = useState<Map<string, FretPosition>>(new Map());
  const octaveShift = useRef<number>(0);
  const enabledRef = useRef(enabled);

  const strumDown = useCallback(() => {
    if (!enabledRef.current) return;

    onStrumDown?.();

    // Get currently pressed notes
    const positions = Array.from(activeNotes.values());

    if (positions.length === 0) return;

    // Map positions to a chord array (6 strings)
    const frets = [-1, -1, -1, -1, -1, -1];
    positions.forEach(pos => {
      // If multiple frets on one string, keep the highest (standard guitar behavior)
      if (pos.fret > frets[pos.string]) {
        frets[pos.string] = pos.fret;
      }
    });

    // Use the optimized playChord from chordAudio for that beautiful arpeggiated sound
    playChord(frets, 0.45, 'piano');

    // After strumming, clear accumulated notes (for chord mode)
    setTimeout(() => {
      setActiveNotes(new Map());
      pressedKeys.current.clear();
    }, 150);
  }, [onStrumDown]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;

    // Ignore if focused in input fields
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    const key = e.key.toLowerCase();

    // Handle octave shift
    if (key === '=') {
      e.preventDefault();
      octaveShift.current = Math.min(octaveShift.current + 1, 3);
      return;
    }
    if (key === '-') {
      e.preventDefault();
      octaveShift.current = Math.max(octaveShift.current - 1, -3);
      return;
    }

    // Handle note keys from keymap
    const noteMapping = keymap.notes.find(m => m.key === key);
    if (noteMapping) {
      e.preventDefault();

      if (chordMode) {
        // In chord mode, accumulate notes and wait for Enter
        const fret = noteMapping.position.fret + octaveShift.current * 12;
        const position = { ...noteMapping.position, fret };
        setActiveNotes(prev => new Map(prev).set(key, position));
        pressedKeys.current.add(key);
        onNoteOn?.(noteMapping.note, 0.3, position);
      } else {
        // In normal mode, play immediately
        const fret = noteMapping.position.fret + octaveShift.current * 12;
        const position = { ...noteMapping.position, fret };
        const freq = getNoteFrequency(position);
        playNote(freq, 0.9, 0.5, 'piano');
        setActiveNotes(prev => new Map(prev).set(key, position));
        pressedKeys.current.add(key);
        onNoteOn?.(noteMapping.note, 0.5, position);
      }
      return;
    }
  }, [enabled, keymap, chordMode, onNoteOn]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;

    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    const key = e.key.toLowerCase();

    // In chord mode, don't clear notes on key release - they stay until strum
    if (chordMode) return;

    // In normal mode, clear note from active notes when key is released
    const noteMapping = keymap.notes.find(m => m.key === key);
    if (noteMapping) {
      const fret = noteMapping.position.fret + octaveShift.current * 12;
      const position = { ...noteMapping.position, fret };
      setActiveNotes(prev => {
        const next = new Map(prev);
        next.delete(key);
        return next;
      });
      pressedKeys.current.delete(key);
      onNoteOff?.(noteMapping.note, position);
    }
  }, [enabled, keymap, chordMode, onNoteOff]);

  useEffect(() => {
    if (!enabled) {
      pressedKeys.current.clear();
      setActiveNotes(new Map());
      return;
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [enabled, handleKeyDown, handleKeyUp]);

  return {
    pressedKeys: Array.from(pressedKeys.current),
    activeNotes: Array.from(activeNotes.entries()),
    octaveShift: octaveShift.current,
    strumDown,
  };
};
