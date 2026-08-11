import { memo, useMemo } from "react";

interface ChordDiagramProps {
  frets: number[];
  fingers: string[];
  chordName: string;
  compact?: boolean;
  flipped?: boolean;
  horizontal?: boolean;
}

// String thickness: index 0 = low E (thickest), index 5 = high e (thinnest)
const STRING_WIDTHS = [2.6, 2.1, 1.6, 1.2, 0.9, 0.7];
const STRING_LABELS = ["E", "A", "D", "G", "B", "e"];

const ChordDiagram = memo(({
  frets,
  fingers,
  chordName,
  compact = false,
  flipped = false,
  horizontal = false,
}: ChordDiagramProps) => {

  // Compute the starting fret (startFret) of the diagram.
  const startFret = useMemo(() => {
    const maxFret = Math.max(...frets);
    const frettedFrets = frets.filter(f => f > 0);
    return maxFret > 5 && frettedFrets.length > 0 
      ? Math.max(1, Math.min(...frettedFrets)) 
      : 1;
  }, [frets]);

  // ─── HORIZONTAL / FACE-TO-FACE VIEW ─────────────────────────────────────────
  if (horizontal) {
    const numFrets = 5;
    const numStrings = 6;
    const w = compact ? 220 : 300;
    const h = compact ? 158 : 214;

    const padL = compact ? 30 : 40;  // room for string labels + mute markers
    const padR = compact ? 12 : 16;
    const padT = compact ? 14 : 18;
    const padB = compact ? 22 : 28;  // room for fret numbers

    const usableW = w - padL - padR;
    const usableH = h - padT - padB;
    const fretW = usableW / numFrets;
    const strH = usableH / (numStrings - 1);

    // Low E (si=0) at top row, high e (si=5) at bottom row
    const stringY = (si: number) => padT + si * strH;
    // Centre X of fret slot f (1-indexed relative to startFret)
    const fretCX = (f: number) => padL + (f - startFret + 0.5) * fretW;

    return (
      <div className="flex flex-col items-center">
        {!compact && (
          <h4 className="text-sm font-semibold mb-3 text-foreground">{chordName}</h4>
        )}
        <svg
          width={w}
          height={h}
          viewBox={`0 0 ${w} ${h}`}
          className="chord-diagram"
          role="img"
          aria-label={`${chordName} guitar chord diagram — neck view`}
        >
          <title>{`${chordName} Guitar Chord Diagram (Neck View)`}</title>

          {/* String labels on the LEFT (E at top, e at bottom) */}
          {STRING_LABELS.map((label, si) => {
            const isMuted = fingers[si] === "x" || frets[si] < 0;
            return (
              <text
                key={`lbl-${si}`}
                x={6}
                y={stringY(si) + 4}
                textAnchor="start"
                fontSize={compact ? 9 : 11}
                fontWeight="600"
                className={isMuted ? "fill-destructive" : "fill-muted-foreground"}
              >
                {label}
              </text>
            );
          })}

          {/* Mute markers (✕) — between label and nut */}
          {frets.map((fret, si) => {
            if (fingers[si] !== "x" && fret >= 0) return null;
            return (
              <text
                key={`mute-${si}`}
                x={padL - 5}
                y={stringY(si) + 4}
                textAnchor="end"
                fontSize={compact ? 8 : 10}
                className="fill-destructive font-bold"
              >
                ✕
              </text>
            );
          })}

          {/* String lines (horizontal) with realistic thickness */}
          {STRING_LABELS.map((_, si) => (
            <line
              key={`str-${si}`}
              x1={padL}
              y1={stringY(si)}
              x2={padL + usableW}
              y2={stringY(si)}
              stroke="hsl(var(--foreground) / 0.5)"
              strokeWidth={STRING_WIDTHS[si]}
            />
          ))}

          {/* Nut — thick vertical bar on the left (only thick if starting at fret 1) */}
          <line
            x1={padL}
            y1={padT}
            x2={padL}
            y2={padT + (numStrings - 1) * strH}
            stroke="hsl(var(--foreground))"
            strokeWidth={startFret === 1 ? 4 : 1.5}
            strokeLinecap="round"
          />

          {/* Fret lines (vertical) */}
          {Array.from({ length: numFrets }).map((_, i) => (
            <line
              key={`fret-${i}`}
              x1={padL + (i + 1) * fretW}
              y1={padT}
              x2={padL + (i + 1) * fretW}
              y2={padT + (numStrings - 1) * strH}
              stroke="hsl(var(--border))"
              strokeWidth={1.5}
            />
          ))}

          {/* Finger dots with finger numbers inside */}
          {frets.map((fret, si) => {
            if (fret <= 0) return null;
            const finger = fingers[si];
            return (
              <g key={`dot-${si}`}>
                <circle
                  cx={fretCX(fret)}
                  cy={stringY(si)}
                  r={compact ? 7 : 9}
                  className="fill-primary animate-scale-in"
                  style={{
                    filter: "drop-shadow(0 2px 6px hsl(var(--primary) / 0.5))",
                    animationDelay: `${si * 0.05}s`,
                  }}
                />
                {finger !== "0" && finger !== "x" && (
                  <text
                    x={fretCX(fret)}
                    y={stringY(si) + (compact ? 2.5 : 3.5)}
                    textAnchor="middle"
                    fontSize={compact ? 7.5 : 10}
                    fontWeight="bold"
                    fill="white"
                  >
                    {finger}
                  </text>
                )}
              </g>
            );
          })}

          {/* Fret numbers — bottom */}
          {Array.from({ length: numFrets }).map((_, i) => (
            <text
              key={`fn-${i}`}
              x={padL + (i + 0.5) * fretW}
              y={padT + (numStrings - 1) * strH + (compact ? 13 : 16)}
              textAnchor="middle"
              fontSize={compact ? 7 : 9}
              className="fill-muted-foreground/50 font-bold"
            >
              {startFret + i}
            </text>
          ))}
        </svg>
      </div>
    );
  }

  // ─── STANDARD VERTICAL CHORD BOX ────────────────────────────────────────────
  const strings = 6;
  const numFrets = 5;
  const size = compact ? 200 : 280;
  const padding = compact ? 20 : 30;
  const stringSpacing = (size - 2 * padding) / (strings - 1);
  const fretSpacing = (size - 2 * padding) / numFrets;

  return (
    <div className="flex flex-col items-center">
      {!compact && (
        <h4 className="text-sm font-semibold mb-3 text-foreground">{chordName}</h4>
      )}

      <svg
        width={size}
        height={size}
        // Offset viewBox to start at x = -28 to prevent startFret text from clipping
        viewBox={`-28 0 ${size + 28} ${size}`}
        className="chord-diagram"
        role="img"
        aria-label={`${chordName} guitar chord diagram`}
      >
        <title>{`${chordName} Guitar Chord Diagram`}</title>
        <desc>{`Interactive guitar chord diagram for ${chordName} showing finger positions, muted strings, and fretboard layout.`}</desc>

        {/* Fret number label next to the first fret slot (if starting above fret 1) */}
        {startFret > 1 && (
          <text
            x={padding - 8}
            y={padding + fretSpacing * 0.5 + 4}
            textAnchor="end"
            fontSize={compact ? 9.5 : 12}
            fontWeight="bold"
            className="fill-primary select-none animate-fade-in"
          >
            {startFret}fr
          </text>
        )}

        {/* Mute / open markers above nut (✕ for mute, ◯ for open, nothing for fretted) */}
        <g className="finger-markers">
          {fingers.map((finger, i) => {
            const displayIdx = flipped ? strings - 1 - i : i;
            const isMuted = finger === "x" || frets[i] < 0;
            const isOpen = frets[i] === 0;
            if (!isMuted && !isOpen) return null;
            return (
              <text
                key={`finger-${i}`}
                x={padding + displayIdx * stringSpacing}
                y={padding - 8}
                textAnchor="middle"
                className={`text-xs font-bold ${
                  isMuted ? "fill-destructive" : "fill-muted-foreground"
                }`}
              >
                {isMuted ? "✕" : "◯"}
              </text>
            );
          })}
        </g>

        {/* Fret lines (horizontal) */}
        <g className="fret-lines">
          {Array.from({ length: numFrets + 1 }).map((_, i) => (
            <line
              key={`fret-${i}`}
              x1={padding}
              y1={padding + i * fretSpacing}
              x2={size - padding}
              y2={padding + i * fretSpacing}
              stroke="hsl(var(--border))"
              strokeWidth={i === 0 && startFret === 1 ? 3 : 1.5}
            />
          ))}
        </g>

        {/* String lines (vertical) with thickness */}
        <g className="string-lines">
          {Array.from({ length: strings }).map((_, i) => {
            const si = flipped ? strings - 1 - i : i;
            return (
              <line
                key={`string-${i}`}
                x1={padding + i * stringSpacing}
                y1={padding}
                x2={padding + i * stringSpacing}
                y2={size - padding}
                stroke="hsl(var(--border))"
                strokeWidth={STRING_WIDTHS[si]}
                opacity={0.6}
              />
            );
          })}
        </g>

        {/* Finger dots with finger numbers inside */}
        <g className="finger-dots">
          {frets.map((fret, stringIndex) => {
            if (fret <= 0) return null;
            const displayIdx = flipped ? strings - 1 - stringIndex : stringIndex;
            const x = padding + displayIdx * stringSpacing;
            const y = padding + (fret - startFret + 0.5) * fretSpacing;
            const finger = fingers[stringIndex];

            return (
              <g key={`dot-${stringIndex}`}>
                <circle
                  cx={x}
                  cy={y}
                  r={compact ? 8 : 10}
                  className="fill-primary stroke-primary-foreground animate-scale-in"
                  strokeWidth={2}
                  style={{
                    filter: "drop-shadow(0 2px 4px hsl(var(--primary) / 0.4))",
                    animationDelay: `${stringIndex * 0.05}s`,
                  }}
                />
                {finger !== "0" && finger !== "x" && (
                  <text
                    x={x}
                    y={y + (compact ? 2.5 : 3.5)}
                    textAnchor="middle"
                    fontSize={compact ? 8.5 : 11}
                    fontWeight="bold"
                    fill="white"
                  >
                    {finger}
                  </text>
                )}
              </g>
            );
          })}
        </g>

        {/* String labels at bottom */}
        <g className="string-labels">
          {(flipped
            ? ["e", "B", "G", "D", "A", "E"]
            : ["E", "A", "D", "G", "B", "e"]
          ).map((note, i) => (
            <text
              key={`label-${i}`}
              x={padding + i * stringSpacing}
              y={size - padding + 16}
              textAnchor="middle"
              className="text-xs fill-muted-foreground"
            >
              {note}
            </text>
          ))}
        </g>
      </svg>
    </div>
  );
});

ChordDiagram.displayName = "ChordDiagram";

export default ChordDiagram;
