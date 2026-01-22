import { useMemo } from "react";
import { ChordSegment } from "@/types/chordAI";

export type WaveformViewerProps = {
  peaks: number[];
  duration: number;
  currentTime: number;
  chordSegments: ChordSegment[];
  onSeek: (time: number) => void;
};

const WaveformViewer = ({ peaks, duration, currentTime, chordSegments, onSeek }: WaveformViewerProps) => {
  const width = Math.max(1, peaks.length);
  const height = 160;
  const safeDuration = Math.max(0.01, duration);

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
    <div className="relative w-full h-[160px] group/waveform select-none">
      <svg
        className="w-full h-full rounded-2xl cursor-crosshair"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const ratio = clickX / rect.width;
          onSeek(ratio * safeDuration);
        }}
      >
        <rect x={0} y={0} width={width} height={height} fill="rgba(255,255,255,0.01)" rx={12} />
        
        {bars.map((bar, idx) => {
          const isPlayed = (idx / width) * safeDuration < currentTime;
          return (
            <rect
              key={idx}
              x={bar.x}
              y={bar.y}
              width={0.7}
              height={bar.h}
              className={`transition-all duration-300 ${
                isPlayed ? "fill-white/80" : "fill-white/10"
              }`}
            />
          );
        })}

        {chordSegments.map((seg, idx) => {
          const startX = (seg.start / safeDuration) * width;
          const endX = (seg.end / safeDuration) * width;
          const w = Math.max(1, endX - startX);
          const isActive = activeChord && activeChord.start === seg.start && activeChord.end === seg.end;
          
          if (!isActive) return null;
          return (
            <rect
              key={idx}
              x={startX}
              y={0}
              width={w}
              height={height}
              fill="white"
              fillOpacity={0.04}
            />
          );
        })}
      </svg>
      
      {/* Current position line */}
      <div 
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_white] pointer-events-none transition-all duration-100 ease-linear"
        style={{ left: `${(currentTime / safeDuration) * 100}%` }}
      />
    </div>
  );
};

export default WaveformViewer;

