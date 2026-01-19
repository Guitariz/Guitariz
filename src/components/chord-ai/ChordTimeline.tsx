import { ChordSegment } from "@/types/chordAI";
import { useEffect, useRef } from "react";

export type ChordTimelineProps = {
  segments: ChordSegment[];
  currentTime: number;
  onSeek: (time: number) => void;
};

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
};

const ChordTimeline = ({ segments, currentTime, onSeek }: ChordTimelineProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);

  const activeIndex = segments.findIndex(s => currentTime >= s.start && currentTime <= (s.end || s.start + 0.1));

  useEffect(() => {
    if (activeRef.current && containerRef.current) {
      const container = containerRef.current;
      const activeElement = activeRef.current;
      
      const relativeTop = activeElement.offsetTop;
      const containerScrollTop = container.scrollTop;
      const containerHeight = container.offsetHeight;

      if (relativeTop < containerScrollTop || relativeTop > containerScrollTop + containerHeight - 100) {
        container.scrollTo({ top: relativeTop - 100, behavior: "smooth" });
      }
    }
  }, [activeIndex]);

  return (
    <div 
      ref={containerRef}
      className="h-[432px] overflow-y-auto pr-4 custom-scrollbar scroll-smooth"
    >
      <div className="space-y-3 py-2">
        {segments.map((seg, idx) => {
          const isActive = currentTime >= seg.start && currentTime <= (seg.end || seg.start + 0.1);
          const progress = isActive && seg.end ? ((currentTime - seg.start) / (seg.end - seg.start)) * 100 : 0;
          
          return (
            <div
              key={`${seg.chord}-${seg.start}-${idx}`}
              ref={isActive ? activeRef : null}
              onClick={() => onSeek(seg.start)}
              className={`group relative overflow-hidden rounded-2xl border px-5 py-5 cursor-pointer transition-all duration-300 ${
                isActive 
                  ? "border-white bg-white/5 scale-[1.02] shadow-xl" 
                  : "border-white/5 bg-white/[0.01] opacity-40 hover:opacity-100 hover:border-white/10 hover:bg-white/[0.02]"
              }`}
            >
              {/* Progress Line */}
              {isActive && (
                <div 
                  className="absolute bottom-0 left-0 h-0.5 bg-white/40 transition-all duration-100 ease-linear"
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              )}

              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col">
                  <span className={`text-2xl font-light tracking-tight ${isActive ? "text-white" : "text-muted-foreground"}`}>
                    {seg.chord}
                  </span>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded border ${isActive ? "border-white/20 text-white" : "border-white/5 text-muted-foreground"}`}>
                      {Math.round((seg.confidence || 0.94) * 100)}% Match
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-mono text-muted-foreground tabular-nums">
                    {formatTime(seg.start)}
                  </div>
                  <div className="text-[10px] text-muted-foreground/40 mt-1 uppercase font-bold tracking-tighter">
                    {((seg.end || seg.start) - seg.start).toFixed(1)}s
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {segments.length === 0 && (
           <div className="h-full flex items-center justify-center text-muted-foreground text-sm font-light italic opacity-50">
             Waiting for harmonic sequence...
           </div>
        )}
      </div>
    </div>
  );
};

export default ChordTimeline;

