import { memo, useState, useCallback, useMemo } from "react";
import { Volume2, ChevronLeft, ChevronRight } from "lucide-react";
import ChordDiagram from "./ChordDiagram";
import { ChordVariant } from "@/types/chordTypes";
import { playChord } from "@/lib/chordAudio";

interface ChordVariantCardProps {
  variant: ChordVariant;
  rootNote: string;
  onSelect?: (chord: {
    root: string;
    variantName: string;
    displayName: string;
    intervals: string;
    voicingFrets: number[];
    voicingIndex: number;
  }) => void;
}

const ChordVariantCard = memo(({ variant, rootNote, onSelect }: ChordVariantCardProps) => {
  const [currentVoicingIndex, setCurrentVoicingIndex] = useState(0);

  const currentVoicing = variant.voicings[currentVoicingIndex];
  const hasMultipleVoicings = useMemo(
    () => variant.voicings.length > 1,
    [variant.voicings.length]
  );

  // Memoize callbacks to prevent unnecessary re-renders of child components
  const handlePlayChord = useCallback(() => {
    if (currentVoicing) {
      playChord(currentVoicing.frets);
    }
  }, [currentVoicing]);

  const nextVoicing = useCallback(() => {
    setCurrentVoicingIndex((prev) =>
      prev < variant.voicings.length - 1 ? prev + 1 : 0
    );
  }, [variant.voicings.length]);

  const prevVoicing = useCallback(() => {
    setCurrentVoicingIndex((prev) =>
      prev > 0 ? prev - 1 : variant.voicings.length - 1
    );
  }, [variant.voicings.length]);

  // Memoize chord display name
  const chordDisplayName = useMemo(
    () => `${rootNote}${variant.name === "Major" ? "" : variant.name}`,
    [rootNote, variant.name]
  );

  const handleSelect = useCallback(() => {
    if (!onSelect || !currentVoicing) return;
    onSelect({
      root: rootNote,
      variantName: variant.name,
      displayName: chordDisplayName,
      intervals: variant.intervals,
      voicingFrets: currentVoicing.frets,
      voicingIndex: currentVoicingIndex,
    });
  }, [onSelect, currentVoicing, rootNote, variant.name, chordDisplayName, variant.intervals, currentVoicingIndex]);

  const handlePlayClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      handlePlayChord();
    },
    [handlePlayChord]
  );

  const handlePrevClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      prevVoicing();
    },
    [prevVoicing]
  );

  const handleNextClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      nextVoicing();
    },
    [nextVoicing]
  );

  return (
    <div
      className="group relative flex flex-col p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300 cursor-pointer"
      onClick={handleSelect}
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : -1}
      onKeyDown={onSelect ? (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleSelect();
        }
      } : undefined}
    >
      <div className="flex justify-between items-start mb-6">
        <div className="space-y-1">
          <h3 className="text-2xl font-black text-white tracking-tighter group-hover:text-primary transition-colors">
            {chordDisplayName}
          </h3>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold opacity-60">
            {variant.intervals}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasMultipleVoicings && (
            <span className="text-[10px] font-black text-muted-foreground bg-white/5 px-2 py-0.5 rounded border border-white/5">
              {currentVoicingIndex + 1}/{variant.voicings.length}
            </span>
          )}
          <button
            onClick={handlePlayClick}
            className="p-2 rounded-lg bg-white/5 border border-white/10 text-muted-foreground hover:text-white hover:bg-white/10 transition-all"
            aria-label="Play chord"
          >
            <Volume2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {currentVoicing && (
        <div className="flex flex-col items-center flex-1 justify-center space-y-6">
          <div className="p-4 rounded-xl bg-white/[0.01] border border-white/5 group-hover:border-white/10 transition-colors">
            <ChordDiagram
              frets={currentVoicing.frets}
              fingers={currentVoicing.fingers}
              chordName={""}
              compact
            />
          </div>

          {/* Voicing navigation */}
          <div className="w-full flex items-center justify-between gap-2 mt-auto">
             <button
               onClick={handlePrevClick}
                disabled={!hasMultipleVoicings}
                className={`p-1.5 rounded-lg border transition-all ${
                  !hasMultipleVoicings 
                    ? "opacity-5 cursor-not-allowed border-transparent" 
                    : "bg-white/5 border-white/10 hover:text-white hover:bg-white/10"
                }`}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              
              <div className="flex-1 text-center">
                 <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-40">
                   {currentVoicing.difficulty || "Standard"} • Shape {currentVoicingIndex + 1}
                 </span>
              </div>

              <button
                onClick={handleNextClick}
                disabled={!hasMultipleVoicings}
                className={`p-1.5 rounded-lg border transition-all ${
                  !hasMultipleVoicings 
                    ? "opacity-5 cursor-not-allowed border-transparent" 
                    : "bg-white/5 border-white/10 hover:text-white hover:bg-white/10"
                }`}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
          </div>
          
          {/* Tablature notation - Clean modern look */}
          <div className="w-full grid grid-cols-6 gap-2 bg-white/[0.02] p-3 rounded-xl border border-white/5">
            {currentVoicing.frets.map((fret, i) => (
              <div key={i} className="flex flex-col items-center">
                <span className="text-[9px] font-bold text-muted-foreground/30 uppercase mb-1">
                  {["E", "A", "D", "G", "B", "e"][i]}
                </span>
                <span className={`text-xs font-black ${fret === -1 ? "text-muted-foreground/20" : "text-white"}`}>
                  {fret === -1 ? "×" : fret}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-white/5">
        <p className="text-[11px] text-muted-foreground leading-relaxed italic opacity-80 group-hover:opacity-100 transition-opacity">
          {variant.theoryText}
        </p>
      </div>
    </div>
  );
});

ChordVariantCard.displayName = "ChordVariantCard";

export default ChordVariantCard;
