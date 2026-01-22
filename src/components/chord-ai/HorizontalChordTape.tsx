import { ChordSegment } from "@/types/chordAI";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

export type HorizontalChordTapeProps = {
  segments: ChordSegment[];
  currentTime: number;
  onSeek: (time: number) => void;
};

const HorizontalChordTape = ({ segments, currentTime, onSeek }: HorizontalChordTapeProps) => {
  // Find current index
  const activeIndex = useMemo(() => {
    return segments.findIndex(s => currentTime >= s.start && currentTime <= (s.end || s.start + 0.1));
  }, [segments, currentTime]);

  if (segments.length === 0) return null;

  // Each item has a fixed width
  const itemWidth = 180; 
  // Offset depends on the original index of the active chord
  const offset = activeIndex !== -1 ? -(activeIndex * itemWidth) : 0;

  return (
    <div className="relative w-full overflow-hidden py-10 select-none">
      {/* Visual background guide */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-32 border border-white/5 bg-white/[0.01] rounded-[2rem] z-0 hidden md:block" />

      {/* The moving track */}
      <div 
        className="flex items-center transition-transform duration-300 ease-out will-change-transform"
        style={{ 
          transform: `translateX(calc(50% - ${itemWidth / 2}px + ${offset}px))`,
        }}
      >
        {segments.map((seg, idx) => {
          const isActive = idx === activeIndex;
          const isPrev = idx === activeIndex - 1;
          const isNext = idx === activeIndex + 1;
          const isFar = Math.abs(idx - activeIndex) > 1;
          const isVeryFar = Math.abs(idx - activeIndex) > 3;

          // Don't render items very far away for performance
          if (isVeryFar) return <div key={idx} style={{ width: `${itemWidth}px` }} className="flex-none" />;
          
          const duration = (seg.end || seg.start + 0.1) - seg.start;
          const progress = Math.min(100, Math.max(0, ((currentTime - seg.start) / Math.max(0.01, duration)) * 100));

          return (
            <div
              key={`${seg.chord}-${seg.start}-${idx}`}
              onClick={() => onSeek(seg.start)}
              style={{ width: `${itemWidth}px` }}
              className={cn(
                "flex-none flex flex-col items-center justify-center transition-all duration-300 cursor-pointer",
                isActive ? "opacity-100 scale-100 z-10" : "opacity-20 scale-90",
                isFar && "opacity-5"
              )}
            >
              <div className="flex flex-col items-center">
                <div className="h-6 flex items-center justify-center mb-4 transition-opacity duration-300">
                  {isActive && (
                    <span className="text-[10px] text-blue-400 font-bold uppercase tracking-[0.2em]">
                      Now
                    </span>
                  )}
                  {isPrev && (
                    <span className="text-[8px] text-muted-foreground/30 font-bold uppercase tracking-wider">
                      Prev
                    </span>
                  )}
                  {isNext && (
                    <span className="text-[8px] text-muted-foreground/30 font-bold uppercase tracking-wider">
                      Next
                    </span>
                  )}
                </div>
                
                <span className={cn(
                  "text-5xl md:text-6xl font-sans tracking-tight tabular-nums transition-all duration-300",
                  isActive ? "text-white" : "text-muted-foreground"
                )}>
                  {seg.chord}
                </span>

                <div className={cn(
                  "mt-6 flex flex-col items-center h-1",
                  isActive ? "opacity-100" : "opacity-0"
                )}>
                  {/* Progress Line */}
                  <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-none"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edge Fading */}
      <div className="absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
    </div>
  );
};

export default HorizontalChordTape;
