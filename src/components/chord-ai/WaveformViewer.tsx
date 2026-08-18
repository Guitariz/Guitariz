/**
 * src/components/chord-ai/WaveformViewer.tsx
 *
 * Canvas-based waveform visualization with playback position indicator.
 */

import { useRef, useEffect } from "react";
import { ChordSegment } from "@/types/chordAI";
import { cn } from "@/lib/utils";

interface WaveformViewerProps {
  audioBuffer?: AudioBuffer | null;
  peaks?: number[];
  currentTime?: number;
  duration?: number;
  chordSegments?: ChordSegment[];
  onSeek?: (time: number) => void;
  className?: string;
}

const WaveformViewer = ({
  audioBuffer,
  peaks: peaksProp,
  currentTime = 0,
  duration = 0,
  chordSegments,
  onSeek,
  className,
}: WaveformViewerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Draw waveform
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    ctx.clearRect(0, 0, width, height);

    // Get peak data from peaks prop or compute from audioBuffer
    let peakData: number[] = [];
    if (Array.isArray(peaksProp) && peaksProp.length > 0) {
      peakData = peaksProp;
    } else if (audioBuffer) {
      const channel = audioBuffer.getChannelData(0);
      const buckets = Math.floor(width);
      const blockSize = Math.max(1, Math.floor(channel.length / buckets));
      for (let i = 0; i < buckets; i++) {
        const start = i * blockSize;
        const end = Math.min(start + blockSize, channel.length);
        let max = 0;
        for (let j = start; j < end; j++) {
          const abs = Math.abs(channel[j]);
          if (abs > max) max = abs;
        }
        peakData.push(max);
      }
    }

    if (peakData.length === 0) return;

    const mid = height / 2;
    const numBars = peakData.length;
    const barStep = width / numBars;

    // Draw unplayed waveform
    ctx.fillStyle = "rgba(168, 85, 247, 0.25)"; // primary muted

    for (let i = 0; i < numBars; i++) {
      const val = peakData[i] || 0;
      const barHeight = Math.max(2, val * (height * 0.85));
      const x = i * barStep;
      ctx.fillRect(x, mid - barHeight / 2, Math.max(1, barStep - 0.5), barHeight);
    }

    // Draw played portion
    if (duration > 0 && currentTime > 0) {
      const playedWidth = Math.min(width, (currentTime / duration) * width);
      const playedBars = Math.floor((playedWidth / width) * numBars);

      ctx.fillStyle = "rgba(168, 85, 247, 0.85)"; // primary solid

      for (let i = 0; i < playedBars; i++) {
        const val = peakData[i] || 0;
        const barHeight = Math.max(2, val * (height * 0.85));
        const x = i * barStep;
        ctx.fillRect(x, mid - barHeight / 2, Math.max(1, barStep - 0.5), barHeight);
      }

      // Playhead line
      ctx.strokeStyle = "#a855f7";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playedWidth, 0);
      ctx.lineTo(playedWidth, height);
      ctx.stroke();
    }
  }, [audioBuffer, peaksProp, currentTime, duration, chordSegments]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onSeek || !canvasRef.current || duration <= 0) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    onSeek(ratio * duration);
  };

  return (
    <div ref={containerRef} className={cn("w-full", className)}>
      <canvas
        ref={canvasRef}
        className="w-full h-16 cursor-pointer rounded-lg bg-muted/20"
        onClick={handleClick}
      />
    </div>
  );
};

export default WaveformViewer;
