import { memo } from "react";

interface ChordDiagramProps {
  frets: number[];
  fingers: string[];
  chordName: string;
  compact?: boolean;
}

const ChordDiagram = memo(({ frets, fingers, chordName, compact = false }: ChordDiagramProps) => {
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
        viewBox={`0 0 ${size} ${size}`}
        className="chord-diagram"
        role="img"
        aria-label={`${chordName} chord diagram`}
      >
        {/* Finger positions above nut */}
        <g className="finger-markers">
          {fingers.map((finger, i) => (
            <text
              key={`finger-${i}`}
              x={padding + i * stringSpacing}
              y={padding - 8}
              textAnchor="middle"
              className={`text-xs font-medium ${
                finger === "x" ? "fill-destructive" : "fill-muted-foreground"
              }`}
            >
              {finger === "x" ? "✕" : finger}
            </text>
          ))}
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
              strokeWidth={i === 0 ? 3 : 1.5}
            />
          ))}
        </g>

        {/* String lines (vertical) */}
        <g className="string-lines">
          {Array.from({ length: strings }).map((_, i) => (
            <line
              key={`string-${i}`}
              x1={padding + i * stringSpacing}
              y1={padding}
              x2={padding + i * stringSpacing}
              y2={size - padding}
              stroke="hsl(var(--border))"
              strokeWidth={1}
              opacity={0.6}
            />
          ))}
        </g>

        {/* Finger dots */}
        <g className="finger-dots">
          {frets.map((fret, stringIndex) => {
            if (fret <= 0) return null;
            
            const x = padding + stringIndex * stringSpacing;
            const y = padding + (fret - 0.5) * fretSpacing;

            return (
              <circle
                key={`dot-${stringIndex}`}
                cx={x}
                cy={y}
                r={compact ? 8 : 10}
                className="fill-primary stroke-primary-foreground animate-scale-in"
                strokeWidth={2}
                style={{ 
                  filter: "drop-shadow(0 2px 4px hsl(var(--primary) / 0.4))",
                  animationDelay: `${stringIndex * 0.05}s`
                }}
              />
            );
          })}
        </g>

        {/* String labels at bottom */}
        <g className="string-labels">
          {["E", "A", "D", "G", "B", "e"].map((note, i) => (
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
