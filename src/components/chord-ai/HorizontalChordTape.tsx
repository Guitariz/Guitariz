/**
 * src/components/chord-ai/HorizontalChordTape.tsx
 *
 * Auto-scrolling horizontal tape showing the current chord in focus
 * with past and future context.
 *
 * Performance: Only re-renders when the active chord index actually
 * changes — not on every 60fps currentTime tick.
 */

import { useMemo, useRef, useState, useEffect } from "react";
import { ChordSegment } from "@/types/chordAI";
import { cn } from "@/lib/utils";

interface HorizontalChordTapeProps {
  segments?: ChordSegment[];
  chords?: ChordSegment[];
  currentTime?: number;
  onSeek?: (time: number) => void;
  onPlayChord?: (chord: string) => void;
  className?: string;
}

/**
 * Binary search for the chord index at a given time.
 * Returns -1 if no chord contains the time.
 */
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

const HorizontalChordTape = ({
  segments,
  chords: chordsProp,
  currentTime = 0,
  onSeek,
  onPlayChord,
  className,
}: HorizontalChordTapeProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rawChords = segments ?? chordsProp ?? [];

  // Stable active index state — only updates when the chord segment changes
  const [activeIndex, setActiveIndex] = useState(-1);
  const lastIndexRef = useRef(-1);

  useEffect(() => {
    const idx = findChordIndex(rawChords, currentTime);
    if (idx !== lastIndexRef.current) {
      lastIndexRef.current = idx;
      setActiveIndex(idx);
    }
  }, [rawChords, currentTime]);

  // Show context: 3 chords before and after
  const contextRange = 3;
  const visibleChords = useMemo(() => {
    if (!Array.isArray(rawChords) || rawChords.length === 0) return [];
    if (activeIndex < 0) {
      return rawChords.slice(0, contextRange * 2 + 1).map((c, i) => ({
        ...c,
        isActive: false,
        offset: i,
      }));
    }
    const start = Math.max(0, activeIndex - contextRange);
    const end = Math.min(rawChords.length, activeIndex + contextRange + 1);
    return rawChords.slice(start, end).map((c, i) => ({
      ...c,
      isActive: start + i === activeIndex,
      offset: start + i - activeIndex,
    }));
  }, [rawChords, activeIndex, contextRange]);

  if (!Array.isArray(rawChords) || rawChords.length === 0) return null;

  return (
    <div className={cn("w-full overflow-hidden", className)}>
      <div
        ref={containerRef}
        className="flex items-center justify-center gap-2 py-3"
      >
        {visibleChords.map((chord, i) => {
          if (!chord) return null;
          const isActive = !!chord.isActive;
          const offset = Math.abs(Number(chord.offset ?? i));
          const opacity = isActive ? 1 : Math.max(0.3, 1 - offset * 0.2);
          const scale = isActive ? 1.15 : Math.max(0.8, 1 - offset * 0.05);

          return (
            <div
              key={`tape-${chord.start ?? i}-${chord.chord ?? 'nc'}`}
              className={cn(
                "flex items-center justify-center rounded-lg px-4 py-2 transition-all duration-300 cursor-pointer select-none",
                isActive
                  ? "bg-primary text-primary-foreground font-black text-lg shadow-lg shadow-primary/30"
                  : "bg-muted/50 text-muted-foreground font-semibold text-sm hover:bg-muted/70"
              )}
              style={{
                opacity,
                transform: `scale(${scale})`,
              }}
              onClick={() => {
                onSeek?.(chord.start ?? 0);
                if (chord.chord && chord.chord !== "N.C.") {
                  onPlayChord?.(chord.chord);
                }
              }}
            >
              {chord.chord === "N.C." ? "—" : chord.chord}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HorizontalChordTape;

