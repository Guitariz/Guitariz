import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
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
  const activeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [currentTime, segments.length]);

  return (
    <ScrollArea className="h-[432px] pr-4">
      <div className="space-y-3 py-2">
        {segments.map((seg, idx) => {
          const isActive = currentTime >= seg.start && currentTime <= seg.end;
          const progress = isActive ? ((currentTime - seg.start) / (seg.end - seg.start)) * 100 : 0;
          
          return (
            <div
              key={`${seg.chord}-${seg.start.toFixed(3)}-${idx}`}
              ref={isActive ? activeRef : null}
              onClick={() => onSeek(seg.start)}
              className={`group relative overflow-hidden rounded-2xl border px-5 py-4 cursor-pointer transition-all duration-300 active:scale-95 ${
                isActive 
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20 shadow-lg shadow-primary/10 scale-[1.02]" 
                  : "border-border/40 bg-card/40 opacity-70 hover:opacity-100 hover:border-primary/40 hover:bg-card"
              }`}
            >
              {/* Progress Bar Background */}
              {isActive && (
                <div 
                  className="absolute bottom-0 left-0 h-1 bg-primary/30 transition-all duration-100 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              )}

              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col">
                  <span className={`text-2xl font-black tracking-tight ${isActive ? "text-primary" : "text-foreground"}`}>
                    {seg.chord}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className={`text-[10px] uppercase font-bold tracking-widest px-1.5 h-4 flex items-center ${isActive ? "border-primary/50 text-primary" : "border-muted-foreground/30 text-muted-foreground"}`}>
                      {Math.round(seg.confidence * 100)}% Match
                    </Badge>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                    {formatTime(seg.start)}
                  </div>
                  <div className="text-[10px] text-muted-foreground/60 mt-1 uppercase">
                    {(seg.end - seg.start).toFixed(1)}s
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
};

export default ChordTimeline;
