/**
 * src/components/chord-ai/LiveChordIndicator.tsx
 *
 * Real-time microphone chord display using WebSocket.
 * Supports both standalone hook mode and parent-controlled props mode.
 */

import { cn } from "@/lib/utils";
import { Activity, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LiveChordIndicatorProps {
  chord?: string | null;
  confidence?: number;
  isConnected?: boolean;
  isActive?: boolean;
  enabled?: boolean;
  onToggle?: (enabled: boolean) => void;
  className?: string;
}

export const LiveChordIndicator = ({
  chord,
  confidence = 0,
  isConnected = false,
  isActive = false,
  enabled,
  onToggle,
  className,
}: LiveChordIndicatorProps) => {
  // If controlled by parent with direct chord / confidence
  const displayChord = chord && chord !== "N.C." ? chord : null;
  const displayConfidence = Math.round(confidence * 100);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1 rounded-xl">
        <span className={cn(
          "w-2 h-2 rounded-full",
          isConnected
            ? (isActive ? "bg-emerald-500 animate-pulse" : "bg-primary")
            : "bg-muted-foreground/40"
        )} />
        <span className="text-xs font-bold font-mono text-primary min-w-[28px] text-center">
          {displayChord || "—"}
        </span>
        {displayChord && (
          <span className="text-[10px] text-muted-foreground font-mono">
            {displayConfidence}%
          </span>
        )}
      </div>

      {typeof onToggle === "function" && (
        <Button
          variant={enabled ? "destructive" : "outline"}
          size="sm"
          onClick={() => onToggle(!enabled)}
          className="gap-1.5 h-7 text-xs"
        >
          {enabled ? (
            <>
              <MicOff className="w-3 h-3" />
              Stop
            </>
          ) : (
            <>
              <Mic className="w-3 h-3" />
              Mic
            </>
          )}
        </Button>
      )}
    </div>
  );
};

export default LiveChordIndicator;
