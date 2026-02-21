import { useMemo, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Box, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

import Fretboard from "@/components/Fretboard";
import Fretboard3DWrapper from "@/components/fretboard/Fretboard3DWrapper";
import type { FretNote } from "@/components/fretboard/Fretboard3D";
import { usePageMetadata } from "@/hooks/usePageMetadata";
import { chordLibraryData } from "@/data/chordData";
import { SEOContent, Breadcrumb } from "@/components/SEOContent";

const NOTES = ["E", "A", "D", "G", "B", "E"];
const CHROMATIC = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function getNoteAtFret(stringIndex: number, fret: number): string {
  const openNote = NOTES[stringIndex];
  const openNoteIndex = CHROMATIC.indexOf(openNote);
  const noteIndex = (openNoteIndex + fret) % 12;
  return CHROMATIC[noteIndex];
}

const FretboardPage = () => {
  const [viewMode, setViewMode] = useState<"2d" | "3d">("2d");
  const [highlightedNotes3D, setHighlightedNotes3D] = useState<FretNote[]>([]);

  usePageMetadata({
    title: "Interactive Guitar Fretboard & Piano | Guitariz - Learn Guitar Theory",
    description: "Master guitar theory with our interactive fretboard. Visualize scales, chords, and notes across the neck. Perfect for guitarists of all levels.",
    keywords: "guitar fretboard, virtual piano, music theory, chord patterns, scale patterns, instrument simulator, interactive fretboard, 3d fretboard",
    canonicalUrl: "https://guitariz.studio/fretboard",
    ogImage: "https://guitariz.studio/logo2.png",
    ogType: "website",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Guitariz Virtual Fretboard",
      "applicationCategory": "MusicApplication",
      "operatingSystem": "Web",
      "description": "Interactive instrument sandbox for guitar and piano with real-time feedback.",
      "url": "https://guitariz.studio/fretboard",
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "bestRating": "5",
        "worstRating": "1",
        "reviewCount": "215"
      }
    }
  });

  const { root, variant, voicingIndex } = useParams<{ root?: string; variant?: string; voicingIndex?: string }>();

  const selectedChord = useMemo(() => {
    if (!root || !variant) return null;

    const rootData = chordLibraryData.roots.find(r => r.root === root);
    if (!rootData) return null;

    const chordVariant = rootData.variants.find(v => v.name === variant);
    if (!chordVariant || !chordVariant.voicings.length) return null;

    const index = voicingIndex ? parseInt(voicingIndex, 10) : 0;
    const validIndex = index >= 0 && index < chordVariant.voicings.length ? index : 0;
    const selectedVoicing = chordVariant.voicings[validIndex];

    return {
      root: rootData.root,
      name: chordVariant.name,
      displayName: `${rootData.root}${chordVariant.name === "Major" ? "" : chordVariant.name}`,
      voicingFrets: selectedVoicing.frets,
    };
  }, [root, variant, voicingIndex]);

  // When a chord is selected, pre-populate 3D highlighted notes too
  useMemo(() => {
    if (!selectedChord?.voicingFrets) return;
    const notes: FretNote[] = [];
    selectedChord.voicingFrets.forEach((fret: number, stringIndex: number) => {
      if (fret < 0) return;
      notes.push({ string: stringIndex, fret, note: getNoteAtFret(stringIndex, fret) });
    });
    setHighlightedNotes3D(notes);
  }, [selectedChord]);

  const handleNoteClick3D = useCallback((stringIndex: number, fret: number) => {
    const note = getNoteAtFret(stringIndex, fret);
    setHighlightedNotes3D(prev => {
      const exists = prev.some(n => n.string === stringIndex && n.fret === fret);
      if (exists) {
        return prev.filter(n => !(n.string === stringIndex && n.fret === fret));
      }
      return [...prev, { string: stringIndex, fret, note }];
    });
  }, []);

  return (
    <div className="min-h-screen bg-transparent relative overflow-hidden selection:bg-white/10">
      <main className="container mx-auto px-4 md:px-6 pt-8 md:pt-12 pb-16 relative z-10">
        {/* Breadcrumb */}
        <Breadcrumb items={[
          { name: "Home", url: "https://guitariz.studio/" },
          { name: "Virtual Fretboard", url: "https://guitariz.studio/fretboard" }
        ]} />

        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div className="space-y-4">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-medium tracking-wider uppercase">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span>Interactive Simulator</span>
            </div>

            {selectedChord && (
              <div className="mt-4 inline-flex items-baseline gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/10">
                <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                  Showing
                </span>
                <span className="text-sm font-semibold text-white">
                  {selectedChord.displayName}
                </span>
              </div>
            )}

            <header className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-light tracking-tighter text-white font-display">
                Fretboard <span className="text-muted-foreground font-thin italic">&</span> Piano
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed font-light">
                A high-fidelity instrument sandbox. Explore chord voicings, scale patterns, and <span className="text-white/80">interval relationships</span> in real-time.
              </p>
            </header>
          </div>

          {/* 2D / 3D View Toggle */}
          <div className="flex items-center gap-1 p-1 bg-black/60 rounded-xl border border-white/5 self-start md:self-end">
            <button
              onClick={() => setViewMode("2d")}
              className={cn(
                "relative px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300",
                viewMode === "2d" ? "text-white" : "text-white/40 hover:text-white/70"
              )}
            >
              {viewMode === "2d" && (
                <motion.div
                  layoutId="view-mode-pill"
                  className="absolute inset-0 bg-white/10 rounded-lg border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5" />
                2D
              </span>
            </button>
            <button
              onClick={() => setViewMode("3d")}
              className={cn(
                "relative px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300",
                viewMode === "3d" ? "text-white" : "text-white/40 hover:text-white/70"
              )}
            >
              {viewMode === "3d" && (
                <motion.div
                  layoutId="view-mode-pill"
                  className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-lg border border-primary/20 shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)]"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Box className="w-3.5 h-3.5" />
                3D
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-black tracking-wider">BETA</span>
              </span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <AnimatePresence mode="wait">
          {viewMode === "2d" ? (
            <motion.div
              key="2d-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="glass-card rounded-[2rem] border border-white/5 bg-[#0a0a0a]/80 shadow-2xl overflow-hidden min-h-[600px]">
                <Fretboard initialChordVoicing={selectedChord?.voicingFrets} />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="3d-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="glass-card rounded-[2rem] border border-white/5 bg-[#0a0a0a]/80 shadow-2xl overflow-hidden">
                <div className="p-4 md:p-8">
                  {/* Feature in Progress Banner */}
                  <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/[0.06] border border-amber-500/15">
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
                    </span>
                    <p className="text-[12px] text-amber-200/70 font-medium">
                      <span className="text-amber-400 font-bold">3D Fretboard</span> — This feature is under active development. More interactions, textures, and visual enhancements coming soon.
                    </p>
                  </div>

                  <Fretboard3DWrapper
                    highlightedNotes={highlightedNotes3D}
                    onNoteClick={handleNoteClick3D}
                  />

                  {/* 3D Controls hint */}
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-[11px] text-white/30">
                    <span className="inline-flex items-center gap-1.5">
                      <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono">Drag</kbd>
                      Rotate
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono">Scroll</kbd>
                      Zoom
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono">Click</kbd>
                      Toggle notes
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
            <h3 className="text-white font-medium mb-1">Low Latency</h3>
            <p className="text-sm text-muted-foreground text-pretty">Optimized audio engine for immediate feedback as you play or explore.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
            <h3 className="text-white font-medium mb-1">Flexible Input</h3>
            <p className="text-sm text-muted-foreground text-pretty">Supports QWERTY/AZERTY keyboard input, touch, and mouse interactions.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
            <h3 className="text-white font-medium mb-1">Visual Learning</h3>
            <p className="text-sm text-muted-foreground text-pretty">Real-time chord detection and interval labeling for every note played.</p>
          </div>
        </div>

        {/* SEO FAQ Section */}
        <SEOContent
          pageName="fretboard"
          faqs={[
            {
              question: "How do I use the Virtual Fretboard to learn guitar chords?",
              answer: "The Virtual Fretboard is an interactive simulator that shows you exactly where to place your fingers for any chord or scale. You can select a root note and a chord type, and the fretboard will light up the correct positions. It's a perfect visual aid for beginners and intermediate players looking to expand their chord vocabulary."
            },
            {
              question: "Does the Virtual Fretboard play actual sounds?",
              answer: "Yes! Every note on the fretboard and the accompanying virtual piano is sampled with high fidelity. When you click a note or play a chord pattern, you'll hear the real tone of the instrument, making it easier to train your ear while you learn visually."
            },
            {
              question: "Can I use my computer keyboard to play the virtual piano?",
              answer: "Absolutely. We've optimized the instrument sandbox for low-latency QWERTY and AZERTY keyboard input. This turns your computer into a functional musical instrument that you can play in real-time."
            },
            {
              question: "How do the 'Visual Learning' features work?",
              answer: "The tool features real-time interval labeling. This means as you play, you'll see how notes relate to each other (e.g., Root, Major 3rd, Perfect 5th), which is the fastest way to understand the 'why' behind the music theory you're practicing."
            }
          ]}
        />
      </main>
    </div>
  );
};

export default FretboardPage;
