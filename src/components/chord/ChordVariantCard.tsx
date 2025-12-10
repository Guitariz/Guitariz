import { memo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Volume2, ChevronLeft, ChevronRight } from "lucide-react";
import ChordDiagram from "./ChordDiagram";
import { ChordVariant } from "@/types/chordTypes";
import { playChord } from "@/lib/chordAudio";

interface ChordVariantCardProps {
  variant: ChordVariant;
  rootNote: string;
}

const ChordVariantCard = memo(({ variant, rootNote }: ChordVariantCardProps) => {
  const [currentVoicingIndex, setCurrentVoicingIndex] = useState(0);

  const currentVoicing = variant.voicings[currentVoicingIndex];
  const hasMultipleVoicings = variant.voicings.length > 1;

  const handlePlayChord = () => {
    if (currentVoicing) {
      playChord(currentVoicing.frets);
    }
  };

  const nextVoicing = () => {
    setCurrentVoicingIndex((prev) =>
      prev < variant.voicings.length - 1 ? prev + 1 : 0
    );
  };

  const prevVoicing = () => {
    setCurrentVoicingIndex((prev) =>
      prev > 0 ? prev - 1 : variant.voicings.length - 1
    );
  };

  return (
    <Card className="glass-card p-6 animate-fade-in">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-gradient mb-1">
            {rootNote}{variant.name === "Major" ? "" : variant.name}
          </h3>
          <p className="text-xs text-muted-foreground">
            Intervals: {variant.intervals}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-xs">
            {currentVoicing?.difficulty || "medium"}
          </Badge>
          {hasMultipleVoicings && (
            <Badge variant="secondary" className="text-xs">
              {currentVoicingIndex + 1}/{variant.voicings.length}
            </Badge>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={handlePlayChord}
            className="h-8 w-8 p-0"
            aria-label="Play chord"
          >
            <Volume2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {currentVoicing && (
        <div className="space-y-4">
          <ChordDiagram
            frets={currentVoicing.frets}
            fingers={currentVoicing.fingers}
            chordName={variant.fullName}
            compact
          />

          {/* Voicing navigation */}
          {hasMultipleVoicings && (
            <div className="flex items-center justify-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={prevVoicing}
                className="h-8 w-8 p-0"
                aria-label="Previous voicing"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground">
                Shape {currentVoicingIndex + 1} • Fret {currentVoicing.position}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={nextVoicing}
                className="h-8 w-8 p-0"
                aria-label="Next voicing"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Tablature notation */}
          <div className="p-2 rounded bg-background/50 font-mono text-xs">
            <div className="grid grid-cols-6 gap-2 text-center">
              {currentVoicing.frets.map((fret, i) => (
                <div key={i}>
                  <div className="text-muted-foreground">
                    {["E", "A", "D", "G", "B", "e"][i]}
                  </div>
                  <div className="font-semibold">
                    {fret === -1 ? "x" : fret}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 p-3 rounded-lg bg-muted/30">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {variant.theoryText}
        </p>
      </div>
    </Card>
  );
});

ChordVariantCard.displayName = "ChordVariantCard";

export default ChordVariantCard;
