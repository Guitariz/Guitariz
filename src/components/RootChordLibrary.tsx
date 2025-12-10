import { useState, useMemo, lazy, Suspense } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Search, X, Layers } from "lucide-react";
import { chordLibraryData, findChordByName } from "@/data/chordData";
import { ChordRoot, ChordVariant } from "@/types/chordTypes";
import ChordDiagram from "./chord/ChordDiagram";

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
    <div className="w-full min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-12 px-8">
      <div className="mb-6 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl">
            <Layers className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-3xl font-bold text-gradient">Root Chord Library</h2>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Select a root note to explore all chord variations, or search for specific chords (e.g., A#major, Cm7)
        </p>
      </div>

      {/* Search bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search root note or chord (e.g., C, F#, A#major, Cm7)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10 glass-card border-primary/20"
          aria-label="Search chord roots or specific chords"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchQuery("")}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Searched chord result */}
      {searchedChord && (
        <div className="mb-6 glass-card rounded-2xl p-6 animate-fade-in">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-bold text-gradient mb-1">
                {searchedChord.root.root}{searchedChord.variant.name === "Major" ? "" : searchedChord.variant.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {searchedChord.variant.intervals} • {searchedChord.variant.theoryText}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery("")}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>

          {searchedChord.variant.voicings[0] && (
            <div className="flex justify-center">
              <ChordDiagram
                frets={searchedChord.variant.voicings[0].frets}
                fingers={searchedChord.variant.voicings[0].fingers}
                chordName={`${searchedChord.root.root}${searchedChord.variant.name === "Major" ? "" : searchedChord.variant.name}`}
              />
            </div>
          )}

          <div className="mt-4 p-3 rounded-lg bg-muted/30">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {searchedChord.variant.theoryText}
            </p>
          </div>
        </div>
      )}

      {/* Root grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-6">
        {filteredRoots.map((root) => (
          <Button
            key={root}
            variant={selectedRoot === root ? "default" : "outline"}
            size="lg"
            onClick={() => setSelectedRoot(root)}
            onKeyDown={(e) => handleKeyDown(e, root)}
            className={`
              h-20 text-lg font-bold transition-all
              ${selectedRoot === root
                ? "bg-gradient-accent text-primary-foreground shadow-lg scale-105"
                : "glass-card border-primary/20 hover:border-primary/50 hover:scale-105"
              }
            `}
            aria-pressed={selectedRoot === root}
            aria-label={`Select ${root} chord root`}
          >
            {root.split('/')[0]}
            {root.includes('/') && (
              <span className="text-xs opacity-70 ml-0.5">
                /{root.split('/')[1]}
              </span>
            )}
          </Button>
        ))}
      </div>

      {/* Variants panel */}
      {selectedRoot && (
        <div className="glass-card rounded-2xl p-6 animate-fade-in">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">
              {selectedRoot} Chord Variants
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedRoot(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </div>

          {selectedRootData ? (
            <ScrollArea className="h-[600px] pr-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Suspense fallback={
                  <div className="glass-card p-6 h-64 animate-pulse" />
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
            <div className="text-center py-12 text-muted-foreground">
              <p>No chord data available for {selectedRoot}</p>
              <p className="text-sm mt-2">
                This root note is coming soon!
              </p>
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
