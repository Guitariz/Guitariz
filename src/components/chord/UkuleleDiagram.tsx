import { memo, useMemo } from "react";
import { UKE_STRING_LABELS } from "@/lib/chordTones";

interface UkuleleDiagramProps {
  frets: number[];
  fingers: string[];
  chordName: string;
  compact?: boolean;
  flipped?: boolean;
  horizontal?: boolean;
}

// Ukulele strings are close in gauge — subtle thickness variation
const UKE_STRING_WIDTHS = [1.4, 1.0, 0.8, 0.7]; // G, C, E, A

const UkuleleDiagram = memo(({
  frets,
  fingers,
  chordName,
  compact = false,
  flipped = false,
  horizontal = false,
}: UkuleleDiagramProps) => {
  const numStrings = 4;
  const numFrets  = 5;

  // Compute the starting fret (startFret) of the diagram.
  const startFret = useMemo(() => {
    const maxFret = Math.max(...frets);
    const frettedFrets = frets.filter(f => f > 0);
    return maxFret > 5 && frettedFrets.length > 0 
      ? Math.max(1, Math.min(...frettedFrets)) 
      : 1;
  }, [frets]);

  // ─── HORIZONTAL / NECK VIEW ─────────────────────────────────────────────────
  if (horizontal) {
    const w = compact ? 200 : 280;
    const h = compact ? 130 : 180;
    const padL = compact ? 26 : 34;
    const padR = compact ? 14 : 18;
    const padT = compact ? 14 : 18;
    const padB = compact ? 20 : 26;

    const usableW = w - padL - padR;
    const usableH = h - padT - padB;
    const fretW  = usableW / numFrets;
    const strH   = usableH / (numStrings - 1);

    // Low-G at top (row 0 = string 0)
    const stringY = (si: number) => padT + si * strH;
    const fretCX  = (f: number)  => padL + (f - startFret + 0.5) * fretW;

    const labels = flipped
      ? [...UKE_STRING_LABELS].reverse()
      : [...UKE_STRING_LABELS];

    return (
      <div className="flex flex-col items-center">
        {!compact && (
          <h4 className="text-sm font-semibold mb-3 text-foreground">{chordName}</h4>
        )}
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img"
          aria-label={`${chordName} ukulele chord diagram — neck view`}>
          <title>{`${chordName} Ukulele Chord (Neck View)`}</title>

          {/* String lines */}
          {labels.map((label, row) => {
            const si = flipped ? numStrings - 1 - row : row;
            const y = stringY(row);
            const isMuted = fingers[si] === "x" || frets[si] < 0;
            return (
              <g key={`str-${row}`}>
                <line x1={padL} y1={y} x2={padL + usableW} y2={y}
                  stroke="hsl(var(--foreground) / 0.5)"
                  strokeWidth={UKE_STRING_WIDTHS[si]} />
                <text x={6} y={y + 4} textAnchor="start"
                  fontSize={compact ? 8 : 10} fontWeight="600"
                  className={isMuted ? "fill-destructive" : "fill-muted-foreground"}>
                  {label}
                </text>
                {isMuted && (
                  <text x={padL - 5} y={y + 4} textAnchor="end"
                    fontSize={compact ? 8 : 10} className="fill-destructive font-bold">✕</text>
                )}
              </g>
            );
          })}

          {/* Nut (only thick if starting at fret 1) */}
          <line x1={padL} y1={padT} x2={padL} y2={padT + (numStrings - 1) * strH}
            stroke="hsl(var(--foreground))" strokeWidth={startFret === 1 ? 4 : 1.5} strokeLinecap="round" />

          {/* Fret lines */}
          {Array.from({ length: numFrets }).map((_, i) => (
            <line key={`fret-${i}`}
              x1={padL + (i + 1) * fretW} y1={padT}
              x2={padL + (i + 1) * fretW} y2={padT + (numStrings - 1) * strH}
              stroke="hsl(var(--border))" strokeWidth={1.5} />
          ))}

          {/* Dots with finger numbers inside */}
          {frets.map((fret, si) => {
            if (fret <= 0) return null;
            const row = flipped ? numStrings - 1 - si : si;
            const finger = fingers[si];
            return (
              <g key={`dot-${si}`}>
                <circle cx={fretCX(fret)} cy={stringY(row)}
                  r={compact ? 6 : 8} className="fill-primary animate-scale-in"
                  style={{ filter: "drop-shadow(0 2px 6px hsl(var(--primary) / 0.5))" }} />
                {finger !== "0" && finger !== "x" && (
                  <text
                    x={fretCX(fret)}
                    y={stringY(row) + (compact ? 2.5 : 3.5)}
                    textAnchor="middle"
                    fontSize={compact ? 6.5 : 8.5}
                    fontWeight="bold"
                    fill="white"
                  >
                    {finger}
                  </text>
                )}
              </g>
            );
          })}

          {/* Fret numbers */}
          {Array.from({ length: numFrets }).map((_, i) => (
            <text key={`fn-${i}`}
              x={padL + (i + 0.5) * fretW}
              y={padT + (numStrings - 1) * strH + (compact ? 12 : 15)}
              textAnchor="middle" fontSize={compact ? 7 : 9}
              className="fill-muted-foreground/50 font-bold">{startFret + i}</text>
          ))}
        </svg>
      </div>
    );
  }

  // ─── STANDARD VERTICAL BOX ──────────────────────────────────────────────────
  const size    = compact ? 170 : 240;
  const padding = compact ? 20 : 28;
  const strSpacing  = (size - 2 * padding) / (numStrings - 1);
  const fretSpacing = (size - 2 * padding) / numFrets;

  const labels = flipped
    ? [...UKE_STRING_LABELS].reverse()
    : [...UKE_STRING_LABELS];

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
        role="img"
        aria-label={`${chordName} ukulele chord diagram`}
      >
        <title>{`${chordName} Ukulele Chord`}</title>

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
            const di = flipped ? numStrings - 1 - i : i;
            const isMuted = finger === "x" || frets[i] < 0;
            const isOpen = frets[i] === 0;
            if (!isMuted && !isOpen) return null;
            return (
              <text key={`mk-${i}`} x={padding + di * strSpacing} y={padding - 8}
                textAnchor="middle"
                className={`text-xs font-bold ${isMuted ? "fill-destructive" : "fill-muted-foreground"}`}>
                {isMuted ? "✕" : "◯"}
              </text>
            );
          })}
        </g>

        {/* Fret lines (horizontal) */}
        {Array.from({ length: numFrets + 1 }).map((_, i) => (
          <line key={`fret-${i}`}
            x1={padding} y1={padding + i * fretSpacing}
            x2={size - padding} y2={padding + i * fretSpacing}
            stroke="hsl(var(--border))" strokeWidth={i === 0 && startFret === 1 ? 3 : 1.5} />
        ))}

        {/* String lines (vertical) */}
        {Array.from({ length: numStrings }).map((_, i) => {
          const si = flipped ? numStrings - 1 - i : i;
          return (
            <line key={`str-${i}`}
              x1={padding + i * strSpacing} y1={padding}
              x2={padding + i * strSpacing} y2={size - padding}
              stroke="hsl(var(--border))" strokeWidth={UKE_STRING_WIDTHS[si]} opacity={0.65} />
          );
        })}

        {/* Finger dots with finger numbers inside */}
        {frets.map((fret, si) => {
          if (fret <= 0) return null;
          const di = flipped ? numStrings - 1 - si : si;
          const finger = fingers[si];
          return (
            <g key={`dot-${si}`}>
              <circle
                cx={padding + di * strSpacing}
                cy={padding + (fret - startFret + 0.5) * fretSpacing}
                r={compact ? 7 : 9}
                className="fill-primary stroke-primary-foreground animate-scale-in"
                strokeWidth={2}
                style={{ filter: "drop-shadow(0 2px 4px hsl(var(--primary) / 0.4))" }}
              />
              {finger !== "0" && finger !== "x" && (
                <text
                  x={padding + di * strSpacing}
                  y={padding + (fret - startFret + 0.5) * fretSpacing + (compact ? 2.5 : 3.5)}
                  textAnchor="middle"
                  fontSize={compact ? 8 : 10.5}
                  fontWeight="bold"
                  fill="white"
                >
                  {finger}
                </text>
              )}
            </g>
          );
        })}

        {/* String labels (G C E A) */}
        {labels.map((note, i) => (
          <text key={`lbl-${i}`}
            x={padding + i * strSpacing} y={size - padding + 15}
            textAnchor="middle" className="text-xs fill-muted-foreground">{note}</text>
        ))}
      </svg>
    </div>
  );
});

UkuleleDiagram.displayName = "UkuleleDiagram";
export default UkuleleDiagram;
