import { describe, it, expect, vi } from "vitest";
import {
  encodeVLQ,
  parseChordToMidiNotes,
  buildMidiBuffer,
  exportChordsToMidi,
} from "../lib/midiExport";
import { AnalysisResult } from "../types/chordAI";

describe("midiExport Utility", () => {
  describe("encodeVLQ", () => {
    it("should encode single-byte VLQ (0 to 127)", () => {
      expect(encodeVLQ(0)).toEqual([0x00]);
      expect(encodeVLQ(127)).toEqual([0x7f]);
    });

    it("should encode multi-byte VLQ values", () => {
      expect(encodeVLQ(128)).toEqual([0x81, 0x00]);
      expect(encodeVLQ(240)).toEqual([0x81, 0x70]);
    });
  });

  describe("parseChordToMidiNotes", () => {
    it("should return empty array for rests / silence", () => {
      expect(parseChordToMidiNotes("N.C.")).toEqual([]);
      expect(parseChordToMidiNotes("N")).toEqual([]);
      expect(parseChordToMidiNotes("silence")).toEqual([]);
      expect(parseChordToMidiNotes("")).toEqual([]);
    });

    it("should parse C major triad", () => {
      const notes = parseChordToMidiNotes("C");
      // C3 (48), E4 (64), G4 (67)
      expect(notes).toContain(48); // C3 root
      expect(notes).toContain(64); // E4 3rd
      expect(notes).toContain(67); // G4 5th
    });

    it("should parse A minor triad", () => {
      const notes = parseChordToMidiNotes("Am");
      expect(notes).toContain(57); // A3 root
      expect(notes).toContain(60); // C4 3rd
      expect(notes).toContain(64); // E4 5th
    });

    it("should handle slash chords properly with low bass note", () => {
      const notes = parseChordToMidiNotes("D/F#");
      // F#2 or F#3 bass + D3 root
      expect(notes.length).toBeGreaterThanOrEqual(3);
    });

    it("should clean backend outputs like C:maj or A:min", () => {
      const notesMaj = parseChordToMidiNotes("C:maj");
      const notesC = parseChordToMidiNotes("C");
      expect(notesMaj).toEqual(notesC);
    });
  });

  describe("buildMidiBuffer", () => {
    const mockSegments = [
      { start: 0, end: 1.0, chord: "C", confidence: 0.9 },
      { start: 1.0, end: 2.0, chord: "G", confidence: 0.85 },
      { start: 2.0, end: 3.0, chord: "Am", confidence: 0.95 },
      { start: 3.0, end: 4.0, chord: "F", confidence: 0.9 },
    ];

    it("should generate valid Standard MIDI Header (MThd)", () => {
      const buffer = buildMidiBuffer(mockSegments, 120);
      expect(buffer.length).toBeGreaterThan(30);

      // Verify MThd magic bytes: 0x4D, 0x54, 0x68, 0x64 ('MThd')
      expect(buffer[0]).toBe(0x4d);
      expect(buffer[1]).toBe(0x54);
      expect(buffer[2]).toBe(0x68);
      expect(buffer[3]).toBe(0x64);

      // Header length = 6
      expect(buffer[7]).toBe(6);

      // Format 0 (single track)
      expect(buffer[8]).toBe(0);
      expect(buffer[9]).toBe(0);

      // Track count = 1
      expect(buffer[10]).toBe(0);
      expect(buffer[11]).toBe(1);
    });

    it("should generate valid Track Chunk (MTrk)", () => {
      const buffer = buildMidiBuffer(mockSegments, 120);
      // MTrk magic bytes at index 14
      expect(buffer[14]).toBe(0x4d);
      expect(buffer[15]).toBe(0x54);
      expect(buffer[16]).toBe(0x72);
      expect(buffer[17]).toBe(0x6b);
    });
  });

  describe("exportChordsToMidi", () => {
    it("should throw error if result has no chords", () => {
      const emptyResult: AnalysisResult = {
        tempo: 120,
        meter: 4,
        key: "C",
        scale: "major",
        chords: [],
        simpleChords: [],
      };
      expect(() => exportChordsToMidi(emptyResult)).toThrow("No chord data available to export.");
    });

    it("should trigger download with correct filename", () => {
      // Mock DOM element creation and click
      const mockAnchor = {
        href: "",
        download: "",
        click: vi.fn(),
      };
      vi.spyOn(document, "createElement").mockReturnValue(mockAnchor as unknown as HTMLElement);
      vi.spyOn(document.body, "appendChild").mockImplementation(() => mockAnchor as unknown as HTMLElement);
      vi.spyOn(document.body, "removeChild").mockImplementation(() => mockAnchor as unknown as HTMLElement);
      vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:fake-url");
      vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

      const sampleResult: AnalysisResult = {
        tempo: 120,
        meter: 4,
        key: "C",
        scale: "major",
        chords: [{ start: 0, end: 2, chord: "C", confidence: 0.9 }],
        simpleChords: [],
      };

      const res = exportChordsToMidi(sampleResult, "my_awesome_track.mp3");
      expect(res.success).toBe(true);
      expect(res.filename).toBe("my_awesome_track_chords.mid");
      expect(mockAnchor.click).toHaveBeenCalled();
    });
  });
});
