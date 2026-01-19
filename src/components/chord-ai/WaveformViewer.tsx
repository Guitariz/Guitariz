import { useMemo } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ChordSegment } from "@/types/chordAI";

export type WaveformViewerProps = {
  peaks: number[];
  duration: number;
  currentTime: number;
  chordSegments: ChordSegment[];
  onSeek: (time: number) => void;
};

const chordColors = [
  "#7C3AED",
  "#F97316",
  "#0EA5E9",
  "#10B981",
  "#E11D48",
  "#F59E0B",
  "#3B82F6",
];

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
};

const WaveformViewer = ({ peaks, duration, currentTime, chordSegments, onSeek }: WaveformViewerProps) => {
  const width = Math.max(1, peaks.length);
  const height = 160;

  const activeChord = useMemo(() => {
    return chordSegments.find((seg) => currentTime >= seg.start && currentTime <= seg.end);
  }, [chordSegments, currentTime]);

  const bars = useMemo(
    () =>
      peaks.map((peak, idx) => {
        const x = idx;
        const barHeight = Math.max(2, peak * (height / 1.1));
        return { x, y: height / 2 - barHeight / 2, h: barHeight };
      }),
    [peaks, height],
  );

  return (
    <div className="relative w-full group/waveform select-none">
      <svg
        className="w-full rounded-2xl cursor-crosshair drop-shadow-2xl"
        viewBox={`0 0 ${width} ${height}`}
        role="presentation"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const ratio = clickX / rect.width;
          onSeek(ratio * duration);
        }}
      >
        <rect x={0} y={0} width={width} height={height} fill="rgba(0,0,0,0.2)" rx={12} />
        
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((p) => (
          <line
            key={p}
            x1={p * width}
            y1={0}
            x2={p * width}
            y2={height}
            stroke="white"
            strokeWidth={0.5}
            opacity={0.05}
          />
        ))}

        {bars.map((bar, idx) => {
          const isPlayed = (idx / width) * duration < currentTime;
          return (
            <rect
              key={idx}
              x={bar.x}
              y={bar.y}
              width={0.7}
              height={bar.h}
              className={`transition-all duration-500 ease-out ${
                isPlayed ? "fill-primary" : "fill-muted-foreground/30"
              }`}
            />
          );
        })}

        {chordSegments.map((seg, idx) => {
          const startX = (seg.start / duration) * width;
          const endX = (seg.end / duration) * width;
          const w = Math.max(1, endX - startX);
          const isActive = activeChord && activeChord.start === seg.start && activeChord.end === seg.end;
          
          return (
            <TooltipProvider key={`${seg.chord}-${idx}`}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <rect
                    x={startX}
                    y={0}
                    width={w}
                    height={height}
                    fill={chordColors[idx % chordColors.length]}
                    opacity={isActive ? 0.3 : 0.05}
                    className="transition-all duration-300 hover:opacity-40"
                    pointerEvents="auto"
                  />
                </TooltipTrigger>
                <TooltipContent className="bg-popover/90 backdrop-blur border-primary/20">
                  <div className="text-base font-black text-primary">{seg.chord}</div>
                  <div className="text-[10px] font-mono opacity-70">
                    {formatTime(seg.start)} → {formatTime(seg.end)}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}

        {/* Current Time Playhead */}
        <g className="transition-all duration-100 ease-linear">
          <line
            x1={(currentTime / duration) * width}
            y1={0}
            x2={(currentTime / duration) * width}
            y2={height}
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            className="drop-shadow-[0_0_10px_rgba(var(--primary),0.8)]"
          />
          <circle
            cx={(currentTime / duration) * width}
            cy={0}
            r={5}
            fill="hsl(var(--primary))"
            className="animate-pulse"
          />
          <circle
            cx={(currentTime / duration) * width}
            cy={height}
            r={5}
            fill="hsl(var(--primary))"
            className="animate-pulse"
          />
        </g>
      </svg>
    </div>
  );
};

export default WaveformViewer;
