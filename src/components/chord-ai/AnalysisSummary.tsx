/**
 * src/components/chord-ai/AnalysisSummary.tsx
 *
 * Displays key, tempo, and meter badges after analysis completes.
 */

import { cn } from "@/lib/utils";

interface AnalysisSummaryProps {
  keyName?: string;
  scale?: string;
  keySignature?: string | null;
  tempo?: number;
  meter?: number;
  className?: string;
}

const AnalysisSummary = ({
  keyName,
  scale,
  keySignature,
  tempo,
  meter = 4,
  className,
}: AnalysisSummaryProps) => {
  const displayKey = keySignature || (keyName ? `${keyName} ${scale || ""}`.trim() : null);

  return (
    <div className={cn("flex flex-wrap gap-3", className)}>
      {displayKey && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
          <span className="text-xs text-muted-foreground font-medium">Key</span>
          <span className="text-sm font-bold text-primary">
            {displayKey}
          </span>
        </div>
      )}

      {typeof tempo === "number" && tempo > 0 && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20">
          <span className="text-xs text-muted-foreground font-medium">BPM</span>
          <span className="text-sm font-bold text-orange-500">
            {Math.round(tempo)}
          </span>
        </div>
      )}

      {typeof meter === "number" && meter > 0 && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <span className="text-xs text-muted-foreground font-medium">Meter</span>
          <span className="text-sm font-bold text-blue-500">
            {meter}/4
          </span>
        </div>
      )}
    </div>
  );
};

export default AnalysisSummary;
