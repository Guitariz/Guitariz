import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  frequencyFromMidi,
  playChordByName,
  playPianoArpeggio,
  playChord,
} from "../lib/chordAudio";
import { parseChordName, getChordMidi, getUkuleleFrets } from "../lib/chordTones";

describe("chordAudio Utility", () => {
  describe("frequencyFromMidi", () => {
    it("should correctly compute A4 (MIDI 69) as 440 Hz", () => {
      expect(frequencyFromMidi(69)).toBeCloseTo(440, 2);
    });

    it("should correctly compute C4 (MIDI 60) as ~261.63 Hz", () => {
      expect(frequencyFromMidi(60)).toBeCloseTo(261.63, 1);
    });

    it("should correctly compute A3 (MIDI 57) as 220 Hz", () => {
      expect(frequencyFromMidi(57)).toBeCloseTo(220, 2);
    });
  });

  describe("playChordByName & chord parsing integration", () => {
    beforeEach(() => {
      const connectMock = vi.fn((dest) => dest);
      const mockGain = {
        gain: {
          value: 1,
          setValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
        connect: connectMock,
      };
      const mockPanner = {
        pan: { setValueAtTime: vi.fn() },
        connect: connectMock,
      };
      const mockOscillator = {
        type: "sine",
        frequency: { setValueAtTime: vi.fn() },
        detune: { setValueAtTime: vi.fn() },
        connect: connectMock,
        start: vi.fn(),
        stop: vi.fn(),
      };
      const mockFilter = {
        type: "lowpass",
        frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
        Q: { setValueAtTime: vi.fn() },
        connect: connectMock,
      };
      const mockDelay = {
        delayTime: { setValueAtTime: vi.fn() },
        connect: connectMock,
      };
      const mockBuffer = {
        getChannelData: vi.fn(() => new Float32Array(100)),
        duration: 1.0,
      };
      const mockSource = {
        buffer: null,
        playbackRate: { setValueAtTime: vi.fn() },
        connect: connectMock,
        start: vi.fn(),
        stop: vi.fn(),
      };

      class MockAudioContext {
        state = "running";
        currentTime = 0;
        sampleRate = 44100;
        destination = {};
        createGain = vi.fn(() => mockGain);
        createStereoPanner = vi.fn(() => mockPanner);
        createOscillator = vi.fn(() => mockOscillator);
        createBiquadFilter = vi.fn(() => mockFilter);
        createDelay = vi.fn(() => mockDelay);
        createBuffer = vi.fn(() => mockBuffer);
        createBufferSource = vi.fn(() => mockSource);
        createDynamicsCompressor = vi.fn(() => ({
          threshold: { setValueAtTime: vi.fn() },
          ratio: { setValueAtTime: vi.fn() },
          connect: vi.fn(),
        }));
        resume = vi.fn().mockResolvedValue(undefined);
      }

      // @ts-expect-error Mocking window AudioContext for vitest
      window.AudioContext = MockAudioContext;
      // @ts-expect-error Mocking webkitAudioContext
      window.webkitAudioContext = MockAudioContext;
    });

    it("should safely ignore empty or N.C. chords", () => {
      expect(() => playChordByName("")).not.toThrow();
      expect(() => playChordByName("N.C.")).not.toThrow();
      expect(() => playChordByName("—")).not.toThrow();
    });

    it("should play piano chord arpeggios for C major", () => {
      expect(() => playChordByName("C", "piano")).not.toThrow();
    });

    it("should play guitar chord strums for Am", () => {
      expect(() => playChordByName("Am", "guitar")).not.toThrow();
    });

    it("should play ukulele chord strums for G", () => {
      expect(() => playChordByName("G", "ukulele")).not.toThrow();
    });

    it("should handle custom chords with complex suffixes", () => {
      expect(() => playChordByName("F#m7", "piano")).not.toThrow();
      expect(() => playChordByName("Bbmaj7", "guitar")).not.toThrow();
    });
  });

  describe("Chord tone resolution for piano & ukulele", () => {
    it("should resolve correct MIDI notes for C major triad", () => {
      const midi = getChordMidi("C", 4);
      expect(midi).toEqual([60, 64, 67]); // C4, E4, G4
    });

    it("should resolve correct MIDI notes for A minor 7th", () => {
      const midi = getChordMidi("Am7", 4);
      expect(midi).toEqual([69, 72, 76, 79]); // A4, C5, E5, G5
    });

    it("should resolve ukulele frets for C major", () => {
      const uke = getUkuleleFrets("C");
      // Standard C chord on ukulele is [0, 0, 0, 3] or produces tones [C, E, G]
      expect(uke.frets.length).toBe(4);
      expect(uke.frets.every((f) => f >= 0)).toBe(true);
    });
  });
});
