import { useState, useMemo, lazy, Suspense } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Search, X, Layers } from "lucide-react";
import { chordLibraryData, findChordByName } from "@/data/chordData";
import { ChordRoot, ChordVariant } from "@/types/chordTypes";
import ChordDiagram from "./chord/ChordDiagram";
import { Bot, Music } from "lucide-react";

const ChordVariantCard = lazy(() => import("./chord/ChordVariantCard"));

// Move constant outside component to prevent recreating on every render
const CHROMATIC_ROOTS = [
  "C", "C#/Db", "D", "D#/Eb", "E", "F",
  "F#/Gb", "G", "G#/Ab", "A", "A#/Bb", "B"
] as const;

const RootChordLibrary = () => {
  const [selectedRoot, setSelectedRoot] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter roots based on search - no unnecessary filtering
  const filteredRoots = useMemo(() => {
    if (!searchQuery) return Array.from(CHROMATIC_ROOTS);
    return Array.from(CHROMATIC_ROOTS).filter(root =>
      root.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  // Optimized search using indexed lookup - O(1) instead of O(n²)
  const searchedChord = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return null;
    return findChordByName(searchQuery, chordLibraryData.roots) || null;
  }, [searchQuery]);

  // Get selected root data with optimized lookup
  const selectedRootData = useMemo(() => {
    if (!selectedRoot) return null;

    // Handle enharmonic equivalents (e.g., C# = Db) - use cached lookup
    const rootVariations = selectedRoot.split('/');
    return chordLibraryData.roots.find(r =>
      rootVariations.some(variant => r.root === variant)
    ) || null;
  }, [selectedRoot]);

  // Memoize keyboard handler callback
  const handleKeyDown = useMemo(() => {
    return (e: React.KeyboardEvent, root: string) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setSelectedRoot(root);
      }
    };
  }, []);

  return (
    <div className="w-full bg-transparent p-4 md:p-8">
      {/* Search & Control Header */}
      <div className="flex flex-col md:flex-row items-center gap-4 mb-8 bg-white/[0.03] border border-white/5 p-4 rounded-2xl backdrop-blur-md">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-white transition-colors" />
          <Input
            type="text"
            placeholder="Search root (e.g., C, F#) or specific chord (e.g., Am7, Dmaj9)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 bg-white/5 border-white/10 focus:border-white/20 h-11 text-sm rounded-lg"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery("")}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedRoot(null);
                setSearchQuery("");
              }}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-muted-foreground hover:text-white hover:bg-white/10 transition-all text-xs font-medium h-11"
            >
              Reset Filters
            </Button>
        </div>
      </div>

      {/* Searched chord result - Minimal DAW-like view */}
      {searchedChord && (
        <div className="mb-8 p-6 rounded-2xl bg-white/[0.03] border border-white/10 animate-in fade-in slide-in-from-top-4">
          <div className="flex justify-between items-start mb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h3 className="text-3xl font-black text-white tracking-tighter">
                  {searchedChord.root.root}{searchedChord.variant.name === "Major" ? "" : searchedChord.variant.name}
                </h3>
                <div className="px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary uppercase">
                  Direct Match
                </div>
              </div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider opacity-60">
                {searchedChord.variant.intervals} • {searchedChord.variant.theoryText}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery("")}
              className="h-8 rounded-lg hover:bg-white/5 text-muted-foreground"
            >
              <X className="h-4 w-4 mr-2" />
              Discard Result
            </Button>
          </div>

          <div className="flex flex-col md:flex-row gap-8 items-center">
            {searchedChord.variant.voicings[0] && (
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <ChordDiagram
                  frets={searchedChord.variant.voicings[0].frets}
                  fingers={searchedChord.variant.voicings[0].fingers}
                  chordName={""}
                />
              </div>
            )}
            
            <div className="flex-1 space-y-4">
              <div className="p-4 rounded-xl bg-white/[0.01] border border-white/5 border-dashed">
                <p className="text-sm text-white/80 leading-relaxed font-medium italic">
                  "{searchedChord.variant.theoryText}"
                </p>
              </div>
              <Button className="w-full md:w-auto bg-white text-black hover:bg-white/90 font-bold rounded-lg h-10 px-6">
                Hear Voicing
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Root Selection Grid - Monochromatic & Precise */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2 mb-8">
        {filteredRoots.map((root) => {
          const isActive = selectedRoot === root;
          return (
            <button
              key={root}
              onClick={() => setSelectedRoot(root)}
              className={`
                flex flex-col items-center justify-center h-16 rounded-xl border transition-all duration-200
                ${isActive
                  ? "bg-white border-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)] scale-[1.02] z-10"
                  : "bg-white/[0.03] border-white/5 text-muted-foreground hover:border-white/20 hover:text-white"
                }
              `}
              aria-pressed={isActive}
            >
              <span className={`text-base font-black ${isActive ? "text-black" : "text-white"}`}>
                {root.split('/')[0]}
              </span>
              {root.includes('/') && (
                <span className={`text-[9px] font-bold ${isActive ? "text-black/60" : "text-muted-foreground/60"}`}>
                  {root.split('/')[1]}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Variants panel - Sliding Drawer Look */}
      {selectedRoot && (
        <div className="rounded-3xl bg-white/[0.02] border border-white/10 p-4 md:p-8 animate-in fade-in zoom-in-95 duration-300 shadow-2xl backdrop-blur-md">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-10 pb-6 border-b border-white/5">
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold">Catalog Exploration</p>
              <h3 className="text-4xl font-black text-white tracking-tighter">
                {selectedRoot} <span className="text-muted-foreground">Variations</span>
              </h3>
            </div>
            <button
              onClick={() => setSelectedRoot(null)}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2"
            >
              <X className="h-3 w-3" />
              EXIT CATALOG
            </button>
          </div>

          {selectedRootData ? (
            <ScrollArea className="h-[750px] pr-6 -mr-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pb-12">
                <Suspense fallback={
                  Array.from({length: 8}).map((_, i) => (
                    <div key={i} className="bg-white/5 h-64 rounded-2xl animate-pulse border border-white/5" />
                  ))
                }>
                  {selectedRootData.variants.map((variant) => (
                    <ChordVariantCard
                      key={variant.name}
                      variant={variant}
                      rootNote={selectedRootData.root}
                    />
                  ))}
                </Suspense>
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-24">
              <div className="p-4 bg-white/5 rounded-full w-fit mx-auto mb-4 border border-white/10 animate-pulse">
                <Layers className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium italic">Loading harmonic patterns...</p>
            </div>
          )}
        </div>
      )}
        </div>
      )}

      {!selectedRoot && !searchedChord && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">Select a root note above to view chord variations</p>
          <p className="text-sm mt-2">Or search for specific chords like "A#major" or "Cm7"</p>
        </div>
      )}
    </div>
  );
};

export default RootChordLibrary;
