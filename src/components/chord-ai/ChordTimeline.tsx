/**
 * src/components/chord-ai/ChordTimeline.tsx
 *
 * Time-aligned chord blocks with color-coded confidence and click-to-seek.
 * Shows chord labels aligned to a horizontal timeline synchronized with audio playback.
 */

import { useMemo, useRef, useEffect, useState } from "react";
import { ChordSegment } from "@/types/chordAI";
import { cn } from "@/lib/utils";

interface ChordTimelineProps {
  segments?: ChordSegment[];
  chords?: ChordSegment[];
  currentTime?: number;
  duration?: number;
  onSeek?: (time: number) => void;
  onPlayChord?: (chord: string) => void;
  transposeSemitones?: number;
  className?: string;
}

/** Map confidence [0, 1] to a hue (red → yellow → green) */
function confidenceColor(confidence: number): string {
  const hue = Math.round(Math.max(0, Math.min(1, confidence)) * 120);
  return `hsl(${hue}, 75%, 45%)`;
}

/** Binary search for the chord index at a given time. */
function findChordIndex(chords: ChordSegment[], time: number): number {
  if (!chords.length) return -1;
  let lo = 0;
  let hi = chords.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >>> 1;
    const c = chords[mid];
    if (time < c.start) {
      hi = mid - 1;
    } else if (time >= c.end) {
      lo = mid + 1;
    } else {
      return mid;
    }
  }
  return -1;
}

const ChordTimeline = ({
  segments,
  chords: chordsProp,
  currentTime = 0,
  duration = 0,
  onSeek,
  onPlayChord,
  transposeSemitones = 0,
  className,
}: ChordTimelineProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);

  const rawChords = segments ?? chordsProp ?? [];

  // Stable active index — only re-renders when the active chord changes
  const [activeIndex, setActiveIndex] = useState(-1);
  const lastIndexRef = useRef(-1);

  useEffect(() => {
    const idx = findChordIndex(rawChords, currentTime);
    if (idx !== lastIndexRef.current) {
      lastIndexRef.current = idx;
      setActiveIndex(idx);
    }
  }, [rawChords, currentTime]);

  // Auto-scroll to active chord
  useEffect(() => {
    if (activeRef.current && containerRef.current) {
      const container = containerRef.current;
      const active = activeRef.current;
      const containerRect = container.getBoundingClientRect();
      const activeRect = active.getBoundingClientRect();

      const isVisible =
        activeRect.left >= containerRect.left &&
        activeRect.right <= containerRect.right;

      if (!isVisible) {
        active.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }
  }, [activeIndex]);

  if (!Array.isArray(rawChords) || rawChords.length === 0) return null;

  const effectiveDur = duration > 0 ? duration : (rawChords[rawChords.length - 1]?.end ?? 1);

  return (
    <div className={cn("w-full", className)}>
      <div
        ref={containerRef}
        className="flex gap-1 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted"
      >
        {rawChords.map((chord, i) => {
          if (!chord) return null;
          const isActive = i === activeIndex;
          const chordDur = Math.max(0.1, (chord.end ?? 0) - (chord.start ?? 0));
          const widthPercent = effectiveDur > 0
            ? Math.max(2, (chordDur / effectiveDur) * 100)
            : 10;

          return (
            <div
              key={`${chord.start ?? i}-${chord.chord ?? 'nc'}`}
              ref={isActive ? activeRef : undefined}
              className={cn(
                "flex-shrink-0 flex items-center justify-center rounded-md px-2 py-2 cursor-pointer transition-all duration-150",
                "text-xs font-bold select-none border",
                isActive
                  ? "ring-2 ring-primary scale-105 bg-primary/15 border-primary/40 text-primary"
                  : "bg-muted/40 border-border/50 text-foreground/80 hover:bg-muted/60"
              )}
              style={{
                minWidth: `${Math.max(40, widthPercent * 3)}px`,
                borderLeftColor: confidenceColor(chord.confidence ?? 0.5),
                borderLeftWidth: "3px",
              }}
              onClick={() => {
                onSeek?.(chord.start ?? 0);
                if (chord.chord && chord.chord !== "N.C.") {
                  onPlayChord?.(chord.chord);
                }
              }}
              title={`${chord.chord} (${Math.round((chord.confidence ?? 0) * 100)}% confidence)\n${(chord.start ?? 0).toFixed(1)}s - ${(chord.end ?? 0).toFixed(1)}s`}
            >
              <span className="truncate">
                {chord.chord === "N.C." ? "—" : chord.chord}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChordTimeline;
