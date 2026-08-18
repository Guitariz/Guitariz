/**
 * src/components/chord-ai/ConfidenceSummary.tsx
 *
 * Overall and per-chord confidence breakdown with visual bars.
 */

import { useMemo } from "react";
import { ChordSegment } from "@/types/chordAI";
import { cn } from "@/lib/utils";

interface ConfidenceSummaryProps {
  segments?: ChordSegment[];
  chords?: ChordSegment[];
  stats?: Record<string, unknown>;
  onSeek?: (time: number) => void;
  className?: string;
}

function confidenceLabel(confidence: number): { label: string; color: string } {
  if (confidence >= 0.85) return { label: "High", color: "text-green-500" };
  if (confidence >= 0.65) return { label: "Medium", color: "text-yellow-500" };
  if (confidence >= 0.45) return { label: "Low", color: "text-orange-500" };
  return { label: "Very Low", color: "text-red-500" };
}

function confidenceBarColor(confidence: number): string {
  if (confidence >= 0.85) return "bg-green-500";
  if (confidence >= 0.65) return "bg-yellow-500";
  if (confidence >= 0.45) return "bg-orange-500";
  return "bg-red-500";
}

const ConfidenceSummary = ({
  segments,
  chords: chordsProp,
  onSeek,
  className,
}: ConfidenceSummaryProps) => {
  const rawChords = segments ?? chordsProp ?? [];

  const calculatedStats = useMemo(() => {
    if (!Array.isArray(rawChords) || rawChords.length === 0) return null;

    const nonNC = rawChords.filter(c => c && c.chord !== "N.C.");
    if (!nonNC.length) return null;

    let totalDuration = 0;
    let weightedConfidence = 0;
    const perChord: Record<string, { totalConf: number; totalDur: number; count: number }> = {};

    for (const c of nonNC) {
      const dur = Math.max(0.1, (c.end ?? 0) - (c.start ?? 0));
      totalDuration += dur;
      weightedConfidence += (c.confidence ?? 0.5) * dur;

      if (!perChord[c.chord]) {
        perChord[c.chord] = { totalConf: 0, totalDur: 0, count: 0 };
      }
      perChord[c.chord].totalConf += (c.confidence ?? 0.5) * dur;
      perChord[c.chord].totalDur += dur;
      perChord[c.chord].count += 1;
    }

    const overall = totalDuration > 0 ? weightedConfidence / totalDuration : 0;

    const chordList = Object.entries(perChord)
      .map(([name, data]) => ({
        name,
        confidence: data.totalDur > 0 ? data.totalConf / data.totalDur : 0,
        duration: data.totalDur,
        count: data.count,
      }))
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 8);

    const high = nonNC.filter(c => (c.confidence ?? 0) >= 0.85).length;
    const medium = nonNC.filter(c => (c.confidence ?? 0) >= 0.65 && (c.confidence ?? 0) < 0.85).length;
    const low = nonNC.filter(c => (c.confidence ?? 0) >= 0.45 && (c.confidence ?? 0) < 0.65).length;
    const veryLow = nonNC.filter(c => (c.confidence ?? 0) < 0.45).length;

    return { overall, chordList, distribution: { high, medium, low, veryLow }, totalChords: nonNC.length };
  }, [rawChords]);

  if (!calculatedStats) return null;

  const { label: overallLabel, color: overallColor } = confidenceLabel(calculatedStats.overall);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Overall confidence */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-muted-foreground">Overall Confidence</span>
            <span className={cn("text-sm font-bold", overallColor)}>
              {Math.round(calculatedStats.overall * 100)}% — {overallLabel}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-muted/50 overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", confidenceBarColor(calculatedStats.overall))}
              style={{ width: `${calculatedStats.overall * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Distribution */}
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="p-2 rounded-lg bg-green-500/10">
          <div className="text-lg font-bold text-green-500">{calculatedStats.distribution.high}</div>
          <div className="text-[10px] text-muted-foreground">High</div>
        </div>
        <div className="p-2 rounded-lg bg-yellow-500/10">
          <div className="text-lg font-bold text-yellow-500">{calculatedStats.distribution.medium}</div>
          <div className="text-[10px] text-muted-foreground">Medium</div>
        </div>
        <div className="p-2 rounded-lg bg-orange-500/10">
          <div className="text-lg font-bold text-orange-500">{calculatedStats.distribution.low}</div>
          <div className="text-[10px] text-muted-foreground">Low</div>
        </div>
        <div className="p-2 rounded-lg bg-red-500/10">
          <div className="text-lg font-bold text-red-500">{calculatedStats.distribution.veryLow}</div>
          <div className="text-[10px] text-muted-foreground">Very Low</div>
        </div>
      </div>

      {/* Per-chord breakdown */}
      <div className="space-y-2">
        <span className="text-xs text-muted-foreground font-medium">Top Chords</span>
        {calculatedStats.chordList.map((chord) => {
          const { color } = confidenceLabel(chord.confidence);
          return (
            <div key={chord.name} className="flex items-center gap-2">
              <span className="text-xs font-bold w-12 text-right">{chord.name}</span>
              <div className="flex-1 h-1.5 rounded-full bg-muted/50 overflow-hidden">
                <div
                  className={cn("h-full rounded-full", confidenceBarColor(chord.confidence))}
                  style={{ width: `${chord.confidence * 100}%` }}
                />
              </div>
              <span className={cn("text-[10px] font-medium w-8", color)}>
                {Math.round(chord.confidence * 100)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ConfidenceSummary;
