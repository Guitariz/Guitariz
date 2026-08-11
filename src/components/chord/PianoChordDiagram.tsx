/**
 * PianoChordDiagram.tsx
 * Ultra-readable read-only piano keyboard showing chord tones.
 * Displays 1.5 octaves (C3–E5) with clear note spelling, labeled keys,
 * and high-contrast marker dots indicating the root and chord tones.
 */

import { memo, useMemo } from "react";
import { getChordMidi, parseChordName } from "@/lib/chordTones";

interface PianoChordDiagramProps {
  chordName: string;
  compact?: boolean;
}

// White key pitch classes within an octave
const WHITE_PCS = [0, 2, 4, 5, 7, 9, 11]; // C D E F G A B
const WHITE_NAMES = ["C", "D", "E", "F", "G", "A", "B"];

// Black key pitch classes
const BLACK_PCS = new Set([1, 3, 6, 8, 10]); // C# D# F# G# A#

// Black key x-offset factor within a pair of white keys (0 = left edge of white key)
const BLACK_OFFSETS: Record<number, number> = {
  1: 0.62,  // C# between C-D
  3: 1.62,  // D# between D-E
  6: 3.62,  // F# between F-G
  8: 4.62,  // G# between G-A
  10: 5.62, // A# between A-B
};

const PianoChordDiagram = memo(({ chordName, compact = false }: PianoChordDiagramProps) => {
  const parsed = useMemo(() => parseChordName(chordName), [chordName]);

  // Determine whether to spell accidentals as flats or sharps
  const spelling = useMemo(() => {
    if (!parsed) return { notes: [], useFlats: false };
    const rootName = parsed.root;
    const isMinorOrDim =
      parsed.quality.toLowerCase().includes("minor") ||
      parsed.quality.toLowerCase().includes("m7") ||
      parsed.quality.toLowerCase().includes("dim") ||
      parsed.quality.toLowerCase().includes("m6") ||
      parsed.quality.toLowerCase().includes("m9");

    const useFlats =
      chordName.includes("b") ||
      (isMinorOrDim && (rootName === "C" || rootName === "F" || rootName === "G" || rootName === "D"));

    const sharpNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const flatNames = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
    const names = useFlats ? flatNames : sharpNames;

    const notes = parsed.intervals.map((interval) => {
      const pc = (parsed.rootPc + interval) % 12;
      return names[pc];
    });

    return { notes, useFlats };
  }, [parsed, chordName]);

  // Show 15 white keys: C3(octave 3) to E5 → keys 0..14
  // C3 = MIDI 48, first key index 0
  const startMidi = 48; // C3
  const numWhiteKeys = 15; // C3 to E5

  // Get chord MIDI notes
  const chordMidi3 = useMemo(() => new Set(getChordMidi(chordName, 3)), [chordName]);
  const chordMidi4 = useMemo(() => new Set(getChordMidi(chordName, 4)), [chordName]);
  const chordMidi5 = useMemo(() => new Set(getChordMidi(chordName, 5)), [chordName]);
  const allChordMidi = useMemo(
    () => new Set([...chordMidi3, ...chordMidi4, ...chordMidi5]),
    [chordMidi3, chordMidi4, chordMidi5]
  );

  const rootMidi3 = parsed ? 12 * 4 + parsed.rootPc : -1;
  const rootMidi4 = parsed ? 12 * 5 + parsed.rootPc : -1;
  const rootMidi5 = parsed ? 12 * 6 + parsed.rootPc : -1;

  const w = compact ? 240 : 320;
  const h = compact ? 95 : 125;
  const padH = compact ? 8 : 10;
  const padV = compact ? 6 : 8;

  const usableW = w - 2 * padH;
  const whiteKeyW = usableW / numWhiteKeys;
  const whiteKeyH = h - 2 * padV - (compact ? 12 : 16); // Leave room at top for chord spelling
  const blackKeyW = whiteKeyW * 0.58;
  const blackKeyH = whiteKeyH * 0.58;

  // Map white key index 0..N to MIDI note
  const whiteKeyToMidi = (idx: number): number => {
    const octave = Math.floor(idx / 7);
    const posInOctave = idx % 7;
    return startMidi + octave * 12 + WHITE_PCS[posInOctave];
  };

  // Generate all white keys
  const whiteKeys = Array.from({ length: numWhiteKeys }, (_, i) => {
    const midi = whiteKeyToMidi(i);
    const isChordTone = allChordMidi.has(midi);
    const isRoot = midi === rootMidi3 || midi === rootMidi4 || midi === rootMidi5;
    const name = WHITE_NAMES[i % 7];
    return { idx: i, midi, isChordTone, isRoot, name };
  });

  // Generate black keys
  const blackKeys: { x: number; midi: number; isChordTone: boolean; isRoot: boolean; name: string }[] = [];
  const sharpNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const flatNames = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
  const keyNames = spelling.useFlats ? flatNames : sharpNames;

  for (let i = 0; i < numWhiteKeys; i++) {
    const octave = Math.floor(i / 7);
    const posInOctave = i % 7;
    const pc = WHITE_PCS[posInOctave];
    const nextBlackPc = pc + 1;
    if (BLACK_PCS.has(nextBlackPc) && BLACK_OFFSETS[nextBlackPc] !== undefined) {
      const rawOffset = BLACK_OFFSETS[nextBlackPc];
      const x = padH + (octave * 7 + rawOffset) * whiteKeyW;
      if (x + blackKeyW / 2 <= w - padH) {
        const midi = startMidi + octave * 12 + nextBlackPc;
        const isChordTone = allChordMidi.has(midi);
        const isRoot = midi === rootMidi3 || midi === rootMidi4 || midi === rootMidi5;
        const name = keyNames[nextBlackPc % 12];
        if (!blackKeys.find((k) => k.midi === midi)) {
          blackKeys.push({ x, midi, isChordTone, isRoot, name });
        }
      }
    }
  }

  if (!parsed) {
    return (
      <div className="flex items-center justify-center text-xs text-muted-foreground" style={{ width: w, height: h }}>
        No voicing found
      </div>
    );
  }

  const yOffset = compact ? 14 : 18; // offset to draw keyboard below note spelling

  return (
    <div className="flex flex-col items-center">
      {/* Chord Note Spelling */}
      <div className="mb-2 text-center select-none">
        <span className="text-xs font-bold text-primary mr-1.5">{chordName}</span>
        <span className="text-[11px] text-muted-foreground font-medium bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
          {spelling.notes.join(" • ")}
        </span>
      </div>

      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        role="img"
        aria-label={`${chordName} piano voicing`}
      >
        <title>{`${chordName} Piano Chord`}</title>

        {/* White keys */}
        {whiteKeys.map(({ idx, isChordTone, isRoot, name }) => {
          const x = padH + idx * whiteKeyW;
          return (
            <g key={`wk-${idx}`} className="select-none">
              {/* Key background */}
              <rect
                x={x + 1}
                y={yOffset}
                width={whiteKeyW - 2}
                height={whiteKeyH}
                rx={compact ? 2 : 3}
                fill="white"
                stroke="#18181b"
                strokeWidth={1}
              />
              {/* Key note label at bottom */}
              <text
                x={x + whiteKeyW / 2}
                y={yOffset + whiteKeyH - (compact ? 4 : 6)}
                textAnchor="middle"
                fontSize={compact ? 7 : 9}
                fontWeight="600"
                fill="#71717a"
              >
                {name}
              </text>
              {/* Active Marker Dot */}
              {isChordTone && (
                <circle
                  cx={x + whiteKeyW / 2}
                  cy={yOffset + whiteKeyH * 0.65}
                  r={compact ? 5 : 7}
                  fill={isRoot ? "#f59e0b" : "#0ea5e9"}
                  style={{
                    filter: isRoot ? "drop-shadow(0 0 4px rgba(245,158,11,0.8))" : "drop-shadow(0 0 3px rgba(14,165,233,0.6))",
                  }}
                />
              )}
              {/* Letter inside dot */}
              {isChordTone && (
                <text
                  x={x + whiteKeyW / 2}
                  y={yOffset + whiteKeyH * 0.65 + (compact ? 2 : 2.5)}
                  textAnchor="middle"
                  fontSize={compact ? 5.5 : 8}
                  fontWeight="bold"
                  fill="white"
                >
                  {name}
                </text>
              )}
            </g>
          );
        })}

        {/* Black keys */}
        {blackKeys.map(({ x, isChordTone, isRoot, name }) => {
          return (
            <g key={`bk-${x}`} className="select-none">
              {/* Key background */}
              <rect
                x={x + 1}
                y={yOffset}
                width={blackKeyW - 2}
                height={blackKeyH}
                rx={compact ? 1.5 : 2}
                fill="#18181b"
                stroke="#09090b"
                strokeWidth={0.5}
              />
              {/* Active Marker Dot */}
              {isChordTone && (
                <circle
                  cx={x + blackKeyW / 2}
                  cy={yOffset + blackKeyH * 0.5}
                  r={compact ? 4 : 5.5}
                  fill={isRoot ? "#f59e0b" : "#0ea5e9"}
                  style={{
                    filter: isRoot ? "drop-shadow(0 0 4px rgba(245,158,11,0.8))" : "drop-shadow(0 0 3px rgba(14,165,233,0.6))",
                  }}
                />
              )}
              {/* Letter inside dot */}
              {isChordTone && (
                <text
                  x={x + blackKeyW / 2}
                  y={yOffset + blackKeyH * 0.5 + (compact ? 1.5 : 2)}
                  textAnchor="middle"
                  fontSize={compact ? 4.5 : 6}
                  fontWeight="bold"
                  fill="white"
                >
                  {name.replace("#", "").replace("b", "")}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-1 select-none">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
          <span className="text-[9px] text-muted-foreground font-semibold">Root Note</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#0ea5e9]" />
          <span className="text-[9px] text-muted-foreground font-semibold">Chord Tone</span>
        </div>
      </div>
    </div>
  );
});

PianoChordDiagram.displayName = "PianoChordDiagram";
export default PianoChordDiagram;
