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

  const playMidiNote = useCallback((midiNote: number, velocity: number = 0.5) => {
    const frequency = midiToFrequency(midiNote);
    playNote(frequency, 2.0, velocity);
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
    // Don't stop if sustained
    if (sustained && sustainedNotes.current.has(midiNote)) {
      return;
    }
    
    setActiveNotes(prev => {
      const next = new Map(prev);
      next.delete(midiNote);
      return next;
    });
    onNoteOff?.(midiNote);
  }, [sustained, onNoteOff]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;
    
    // Ignore if focused in input fields
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    const key = e.key.toLowerCase();
    
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

    // Handle sustain
    if (key === keymap.sustain) {
      e.preventDefault();
      setSustained(prev => {
        const next = !prev;
        onSustainChange?.(next);
        
        // If turning off sustain, release sustained notes
        if (!next) {
          sustainedNotes.current.clear();
        }
        
        return next;
      });
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
  }, [enabled, keymap, octaveShift, handleNoteOn, onSustainChange]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;
    
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    const key = e.key.toLowerCase();
    
    // Ignore sustain key release
    if (key === keymap.sustain) {
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
  }, [enabled, keymap, octaveShift, handleNoteOff]);

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
  };
};
