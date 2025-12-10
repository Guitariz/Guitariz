/**
 * QA/Debug panel for chord detection system
 * Shows live MIDI numbers, pitch classes, and detection internals
 */

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ChevronDown, ChevronUp, Bug } from 'lucide-react';
import { ChordCandidate } from '@/types/chordDetectionTypes';
import { midiToPitchClass, pitchClassToNote } from '@/lib/chordDetection';

interface ChordDebugPanelProps {
  midiNotes: number[];
  candidates: ChordCandidate[];
  mode: 'fretboard' | 'piano';
}

export const ChordDebugPanel = ({
  midiNotes,
  candidates,
  mode,
}: ChordDebugPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isExpanded) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsExpanded(true)}
        className="gap-2"
      >
        <Bug className="w-4 h-4" />
        Show Debug Info
        <ChevronDown className="w-3 h-3" />
      </Button>
    );
  }

  const pitchClasses = midiNotes.map(midiToPitchClass);
  const uniquePitchClasses = [...new Set(pitchClasses)];
  const noteNames = uniquePitchClasses.map(pitchClassToNote);

  return (
    <Card className="p-4 space-y-4 border-dashed">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bug className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Detection Debug Panel</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(false)}
        >
          <ChevronUp className="w-4 h-4" />
        </Button>
      </div>

      <Separator />

      {/* Mode indicator */}
      <div>
        <p className="text-xs text-muted-foreground mb-1">Input Mode:</p>
        <Badge variant="secondary" className="capitalize">
          {mode}
        </Badge>
      </div>

      {/* MIDI notes */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">MIDI Notes ({midiNotes.length}):</p>
        <div className="flex flex-wrap gap-1">
          {midiNotes.length === 0 ? (
            <span className="text-xs italic text-muted-foreground">None</span>
          ) : (
            midiNotes.map((midi, i) => (
              <Badge key={i} variant="outline" className="font-mono text-xs">
                {midi}
              </Badge>
            ))
          )}
        </div>
      </div>

      {/* Pitch classes */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">Pitch Classes (mod 12):</p>
        <div className="flex flex-wrap gap-1">
          {uniquePitchClasses.length === 0 ? (
            <span className="text-xs italic text-muted-foreground">None</span>
          ) : (
            uniquePitchClasses.map((pc, i) => (
              <Badge key={i} variant="secondary" className="font-mono text-xs">
                {pc} = {noteNames[i]}
              </Badge>
            ))
          )}
        </div>
      </div>

      {/* Candidates */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">
          Chord Candidates ({candidates.length}):
        </p>
        {candidates.length === 0 ? (
          <span className="text-xs italic text-muted-foreground">No matches</span>
        ) : (
          <div className="space-y-2">
            {candidates.map((cand, i) => (
              <div key={i} className="p-2 rounded bg-muted/30 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{cand.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {Math.round(cand.score)}%
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-x-3 text-muted-foreground font-mono">
                  <span>Root: {cand.root}</span>
                  <span>Bass: {cand.bassNote}</span>
                  <span>Inv: {cand.inversion}</span>
                  <span>Intervals: [{cand.intervals.join(', ')}]</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};
