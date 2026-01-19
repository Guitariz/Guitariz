/**
 * Chord detection display panel
 * Shows detected chords with confidence scores and alternatives
 */

import { ChordCandidate } from '@/types/chordDetectionTypes';
import { Button } from '@/components/ui/button';
import { Music, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChordDetectionPanelProps {
  candidates: ChordCandidate[];
  selectedNotes: string[];
  onApplyChord?: (candidate: ChordCandidate) => void;
  className?: string;
}

export const ChordDetectionPanel = ({
  candidates,
  selectedNotes,
  onApplyChord,
  className,
}: ChordDetectionPanelProps) => {
  if (selectedNotes.length === 0) {
    return (
      <div className={cn("text-center py-6", className)}>
        <Music className="w-8 h-8 mx-auto mb-2 opacity-20 text-white" />
        <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Ready to Analyze</p>
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div className={cn("p-4", className)}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Selected Tones</p>
          <div className="h-[1px] flex-1 bg-white/5 mx-4"></div>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {selectedNotes.map((note, i) => (
            <div key={i} className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] font-bold text-white uppercase">
              {note}
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground italic text-center">
          No complex harmonic structure detected.
        </p>
      </div>
    );
  }


  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex flex-col md:flex-row items-center gap-8">
        {/* Main Identification */}
        <div className="flex-1 text-center md:text-left space-y-1">
          <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold">Primary Identification</p>
          <div className="flex flex-col md:flex-row md:items-baseline gap-2">
            <h2 className="text-5xl md:text-6xl font-black text-white tracking-tighter">
              {candidates[0].name}
            </h2>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 w-fit mx-auto md:mx-0">
              <div className={cn("w-1.5 h-1.5 rounded-full", candidates[0].score > 80 ? "bg-primary" : "bg-white/40")}></div>
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                {Math.round(candidates[0].score)}% Match
              </span>
            </div>
          </div>
          {candidates[0].alternateNames && candidates[0].alternateNames.length > 0 && (
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-1 opacity-60">
              Aliases: {candidates[0].alternateNames.join(' | ')}
            </p>
          )}
        </div>

        {/* Selected tones */}
        <div className="flex-1 w-full md:w-auto">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-3 flex items-center gap-2">
            Harmonic Content <span className="h-[1px] flex-1 bg-white/5"></span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {selectedNotes.map((note, i) => (
              <div key={i} className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[11px] font-black text-white hover:bg-white/10 transition-colors">
                {note}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alternatives */}
      {candidates.length > 1 && (
        <div className="pt-6 border-t border-white/5">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-4">Alternative voicings / interpretations</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {candidates.slice(1, 5).map((candidate, idx) => (
              <div 
                key={idx}
                className="group flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/20 transition-all cursor-pointer"
                onClick={() => onApplyChord?.(candidate)}
              >
                <div>
                  <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">{candidate.name}</p>
                  <p className="text-[10px] text-muted-foreground">{Math.round(candidate.score)}% reliability</p>
                </div>
                {onApplyChord && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100">
                    <TrendingUp className="w-3 h-3 text-white" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
