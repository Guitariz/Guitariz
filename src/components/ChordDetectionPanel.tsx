/**
 * Chord detection display panel
 * Shows detected chords with confidence scores and alternatives
 */

import { ChordCandidate } from '@/types/chordDetectionTypes';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Music, TrendingUp, Info } from 'lucide-react';
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
      <Card className={cn("p-6", className)}>
        <div className="text-center text-muted-foreground">
          <Music className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Play notes to detect chords</p>
        </div>
      </Card>
    );
  }

  if (candidates.length === 0) {
    return (
      <Card className={cn("p-6", className)}>
        <div>
          <p className="text-sm text-muted-foreground mb-3">Selected notes:</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedNotes.map((note, i) => (
              <Badge key={i} variant="secondary" className="text-sm">
                {note}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground italic">
            No chord pattern detected. Try adding more notes.
          </p>
        </div>
      </Card>
    );
  }

  const getConfidenceColor = (score: number): string => {
    if (score >= 90) return 'text-green-500';
    if (score >= 75) return 'text-blue-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-orange-500';
  };

  const getConfidenceLabel = (score: number): string => {
    if (score >= 90) return 'Very High';
    if (score >= 75) return 'High';
    if (score >= 60) return 'Medium';
    return 'Low';
  };

  return (
    <Card className={cn("p-6", className)}>
      <div className="space-y-4">
        {/* Top candidate - prominent display */}
        <div className="text-center pb-4 border-b border-border">
          <p className="text-sm text-muted-foreground mb-2">Detected Chord:</p>
          <div className="text-4xl font-bold text-gradient mb-3 animate-scale-in">
            {candidates[0].name}
          </div>
          <div className="flex items-center justify-center gap-3 text-sm">
            <div className="flex items-center gap-1">
              <TrendingUp className={cn("w-4 h-4", getConfidenceColor(candidates[0].score))} />
              <span className={getConfidenceColor(candidates[0].score)}>
                {getConfidenceLabel(candidates[0].score)} ({Math.round(candidates[0].score)}%)
              </span>
            </div>
            {candidates[0].inversion > 0 && (
              <Badge variant="outline" className="text-xs">
                {candidates[0].inversion === 1 ? '1st' : candidates[0].inversion === 2 ? '2nd' : '3rd'} Inversion
              </Badge>
            )}
          </div>
          {candidates[0].alternateNames && candidates[0].alternateNames.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              Also known as: {candidates[0].alternateNames.join(', ')}
            </p>
          )}
          {onApplyChord && (
            <Button
              variant="default"
              size="sm"
              className="mt-3"
              onClick={() => onApplyChord(candidates[0])}
            >
              Apply Voicing
            </Button>
          )}
        </div>

        {/* Alternative candidates */}
        {candidates.length > 1 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm font-medium">Alternative Interpretations:</p>
            </div>
            <div className="space-y-2">
              {candidates.slice(1).map((candidate, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{candidate.name}</span>
                      {candidate.inversion > 0 && (
                        <Badge variant="outline" className="text-xs">
                          Inv. {candidate.inversion}
                        </Badge>
                      )}
                    </div>
                    {candidate.alternateNames && candidate.alternateNames.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {candidate.alternateNames.join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className={cn("text-sm font-medium", getConfidenceColor(candidate.score))}>
                      {Math.round(candidate.score)}%
                    </div>
                    {onApplyChord && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-1 text-xs h-7"
                        onClick={() => onApplyChord(candidate)}
                      >
                        Apply
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected notes display */}
        <div className="pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">Notes analyzed:</p>
          <div className="flex flex-wrap gap-1">
            {selectedNotes.map((note, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {note}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};
