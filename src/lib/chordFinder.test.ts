import { describe, it, expect } from "vitest";
import { identifyChord } from "./chordFinder";

const sym = (m: number[], o = {}) => identifyChord(m, o).primary?.symbol;

describe("identifyChord", () => {
  it("names basic triads", () => {
    expect(sym([60, 64, 67])).toBe("C");
    expect(sym([57, 60, 64])).toBe("Am");
    expect(sym([60, 63, 66])).toBe("Cdim");
    expect(sym([60, 64, 68])).toBe("Caug");
  });

  it("prefers inversions over exotic root-position names (raw tonal says Em#5)", () => {
    const r = identifyChord([64, 67, 72]); // E G C
    expect(r.primary?.symbol).toBe("C/E");
    expect(r.primary?.inversion).toBe("1st");
    expect(sym([55, 60, 64])).toBe("C/G"); // G C E
    expect(identifyChord([55, 60, 64]).primary?.inversion).toBe("2nd");
  });

  it("uses the bass to choose between equivalent names", () => {
    expect(sym([57, 60, 64, 67])).toBe("Am7"); // A C E G
    expect(sym([60, 64, 67, 69])).toBe("C6"); //  C E G A
    expect(identifyChord([57, 60, 64, 67]).alternates.map((a) => a.symbol)).toContain("C6/A");
  });

  it("hides exotic spellings behind moreNames", () => {
    const r = identifyChord([64, 67, 72]); // E G C
    expect(r.alternates.map((a) => a.symbol)).not.toContain("Em#5");
    expect(r.moreNames.map((a) => a.symbol)).toContain("Em#5");
  });

  it("handles an open C guitar voicing (x32010) with doubled notes", () => {
    expect(sym([48, 52, 55, 60, 64])).toBe("C");
  });

  it("handles voicings without a 5th", () => {
    expect(sym([48, 52, 59])).toBe("Cmaj7"); // C E B
    expect(sym([48, 52, 58])).toBe("C7"); //   C E Bb
  });

  it("handles sus and power chords", () => {
    expect(sym([50, 57, 64])).toBe("Dsus2");
    expect(sym([48, 55])).toBe("C5");
  });

  it("handles 0, 1 and 2 notes", () => {
    expect(identifyChord([]).status).toBe("empty");
    expect(identifyChord([60]).status).toBe("single");
    const two = identifyChord([60, 64]);
    expect(two.status).toBe("interval");
    expect(two.message).toContain("major 3rd");
  });

  it("respects flat/sharp spelling", () => {
    expect(sym([58, 62, 65], { accidental: "flat" })).toBe("Bb");
    expect(sym([58, 62, 65], { accidental: "sharp" })).toBe("A#");
  });

  it("returns a none status without throwing on clusters", () => {
    const r = identifyChord([60, 61, 62, 63, 64, 65, 66]);
    expect(["match", "none"]).toContain(r.status);
  });

  it("ignores octave doubling and duplicate MIDI values", () => {
    expect(sym([48, 60, 64, 67, 67, 72])).toBe("C");
  });
});
