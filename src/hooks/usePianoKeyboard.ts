/**
 * Custom hook for piano keyboard integration
 * Maps computer keyboard to piano keys with MIDI playback
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { PianoKeyboardOptions } from '@/types/pianoTypes';
import { playNote } from '@/lib/chordAudio';

// MIDI note to frequency conversion
const midiToFrequency = (midiNote: number): number => {
  return 440 * Math.pow(2, (midiNote - 69) / 12);
};

export const usePianoKeyboard = (options: PianoKeyboardOptions) => {
  const {
    enabled,
    keymap,
    onNoteOn,
    onNoteOff,
    onSustainChange,
  } = options;

  const [activeNotes, setActiveNotes] = useState<Map<number, string>>(new Map());
  const [octaveShift, setOctaveShift] = useState<number>(0);
  const [sustained, setSustained] = useState<boolean>(false);

  const pressedKeys = useRef<Set<string>>(new Set());
  const sustainedNotes = useRef<Set<number>>(new Set());
  const keyDebounce = useRef<Map<string, number>>(new Map());
  const sustainHeld = useRef<boolean>(false);

  const playMidiNote = useCallback((midiNote: number, velocity: number = 0.5) => {
    const frequency = midiToFrequency(midiNote);
    playNote(frequency, 2.2, velocity, 'piano');
  }, []);

  const handleNoteOn = useCallback((midiNote: number, key: string, velocity: number = 0.5) => {
    setActiveNotes(prev => new Map(prev).set(midiNote, key));
    playMidiNote(midiNote, velocity);
    onNoteOn?.(midiNote, velocity);

    if (sustained) {
      sustainedNotes.current.add(midiNote);
    }
  }, [sustained, playMidiNote, onNoteOn]);

  const handleNoteOff = useCallback((midiNote: number) => {
    // If sustain is held, keep note alive until sustain is released
    if (sustained && sustainHeld.current) {
      sustainedNotes.current.add(midiNote);
      return;
    }

    setActiveNotes(prev => {
      const next = new Map(prev);
      next.delete(midiNote);
      return next;
    });
    onNoteOff?.(midiNote);
  }, [sustained, onNoteOff]);

  const releaseSustainedNotes = useCallback(() => {
    if (sustainedNotes.current.size === 0) return;
    const notesToRelease = Array.from(sustainedNotes.current);
    sustainedNotes.current.clear();

    setActiveNotes(prev => {
      const next = new Map(prev);
      notesToRelease.forEach(n => next.delete(n));
      return next;
    });
    notesToRelease.forEach(n => onNoteOff?.(n));
  }, [onNoteOff]);

  const setSustainState = useCallback((next: boolean) => {
    sustainHeld.current = next;
    setSustained(next);
    onSustainChange?.(next);
    if (!next) {
      releaseSustainedNotes();
    }
  }, [onSustainChange, releaseSustainedNotes]);

  const toggleSustain = useCallback(() => {
    setSustainState(!sustainHeld.current);
  }, [setSustainState]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;

    // Ignore if focused in input fields
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    const key = e.key.toLowerCase();

    // Prevent Enter from scrolling or triggering default actions
    if (e.key === 'Enter' || e.code === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // Debounce repeated key events
    const now = Date.now();
    const lastTime = keyDebounce.current.get(key) || 0;
    if (now - lastTime < 50) return;
    keyDebounce.current.set(key, now);

    // Handle octave shift
    if (key === keymap.octaveUp.toLowerCase()) {
      e.preventDefault();
      setOctaveShift(prev => Math.min(prev + 1, 2));
      return;
    }

    if (key === keymap.octaveDown.toLowerCase()) {
      e.preventDefault();
      setOctaveShift(prev => Math.max(prev - 1, -2));
      return;
    }

    // Handle sustain (momentary pedal behaviour)
    if (key === keymap.sustain) {
      e.preventDefault();
      if (!sustainHeld.current) {
        setSustainState(true);
      }
      return;
    }

    // Handle note keys
    const mapping = keymap.keys.find(m => m.key.toLowerCase() === key);
    if (mapping) {
      e.preventDefault();

      if (pressedKeys.current.has(key)) return; // Already pressed

      pressedKeys.current.add(key);

      // Apply octave shift
      const shiftedMidiNote = mapping.midiNote + (octaveShift * 12);

      // Ensure MIDI note is in valid range (0-127)
      if (shiftedMidiNote >= 0 && shiftedMidiNote <= 127) {
        handleNoteOn(shiftedMidiNote, key, 0.5);
      }
    }
  }, [enabled, keymap, octaveShift, handleNoteOn, setSustainState]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;

    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    const key = e.key.toLowerCase();

    // Sustain key release ends pedal
    if (key === keymap.sustain) {
      setSustainState(false);
      return;
    }

    const mapping = keymap.keys.find(m => m.key.toLowerCase() === key);
    if (mapping) {
      pressedKeys.current.delete(key);

      const shiftedMidiNote = mapping.midiNote + (octaveShift * 12);
      if (shiftedMidiNote >= 0 && shiftedMidiNote <= 127) {
        handleNoteOff(shiftedMidiNote);
      }
    }
  }, [enabled, keymap, octaveShift, handleNoteOff, setSustainState]);

  useEffect(() => {
    if (!enabled) {
      pressedKeys.current.clear();
      setActiveNotes(new Map());
      sustainedNotes.current.clear();
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
    activeNotes: Array.from(activeNotes.entries()),
    octaveShift,
    sustained,
    playMidiNote,
    setSustain: setSustainState,
    toggleSustain,
    setOctaveShift,
  };
};
