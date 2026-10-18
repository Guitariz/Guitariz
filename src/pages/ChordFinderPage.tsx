import { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { 
  Music, Volume2, RotateCcw, ArrowRight, Sparkles, Guitar, Piano,
  HelpCircle, ChevronDown, ChevronUp, Layers, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePageMetadata } from "@/hooks/usePageMetadata";
import { SEOContent, Breadcrumb } from "@/components/SEOContent";
import RelatedTools from "@/components/RelatedTools";
import { identifyChord, ChordIdentificationResult } from "@/lib/chordFinder";
import { playNote, playChord, playPianoArpeggio, frequencyFromMidi } from "@/lib/chordAudio";
import { findChordByName, chordLibraryData } from "@/data/chordData";
import staticContent from "@/data/staticContent.json";

// Standard guitar tuning strings base MIDI numbers:
// String 0 = Low E (40), String 1 = A (45), String 2 = D (50),
// String 3 = G (55), String 4 = B (59), String 5 = High E (64)
const GUITAR_STRINGS = [
  { name: "e", baseMidi: 64, stringNum: 1 }, // High E
  { name: "B", baseMidi: 59, stringNum: 2 },
  { name: "G", baseMidi: 55, stringNum: 3 },
  { name: "D", baseMidi: 50, stringNum: 4 },
  { name: "A", baseMidi: 45, stringNum: 5 },
  { name: "E", baseMidi: 40, stringNum: 6 }, // Low E
];

const FRETS_COUNT = 12;
const FRET_MARKERS = [3, 5, 7, 9, 12];

// Piano notes across 2 octaves (C3 to B4: MIDI 48 to 71)
const PIANO_KEYS = [
  { midi: 48, note: "C", isBlack: false },
  { midi: 49, note: "C#", isBlack: true },
  { midi: 50, note: "D", isBlack: false },
  { midi: 51, note: "D#", isBlack: true },
  { midi: 52, note: "E", isBlack: false },
  { midi: 53, note: "F", isBlack: false },
  { midi: 54, note: "F#", isBlack: true },
  { midi: 55, note: "G", isBlack: false },
  { midi: 56, note: "G#", isBlack: true },
  { midi: 57, note: "A", isBlack: false },
  { midi: 58, note: "A#", isBlack: true },
  { midi: 59, note: "B", isBlack: false },
  { midi: 60, note: "C", isBlack: false },
  { midi: 61, note: "C#", isBlack: true },
  { midi: 62, note: "D", isBlack: false },
  { midi: 63, note: "D#", isBlack: true },
  { midi: 64, note: "E", isBlack: false },
  { midi: 65, note: "F", isBlack: false },
  { midi: 66, note: "F#", isBlack: true },
  { midi: 67, note: "G", isBlack: false },
  { midi: 68, note: "G#", isBlack: true },
  { midi: 69, note: "A", isBlack: false },
  { midi: 70, note: "A#", isBlack: true },
  { midi: 71, note: "B", isBlack: false },
];

const PRESETS: Record<string, number[]> = {
  "C Major": [48, 52, 55, 60, 64], // x32010
  "G Major": [43, 47, 50, 55, 59, 67], // 320003
  "D Major": [50, 57, 62, 66], // xx0232
  "A Minor": [45, 52, 57, 60, 64], // x02210
  "E Minor": [40, 47, 52, 55, 59, 64], // 022000
  "F Major": [41, 45, 50, 53, 57, 65], // 133211
};

const ChordFinderPage = () => {
  const content = staticContent.chordFinder;

  usePageMetadata({
    title: content.title,
    description: content.description,
    keywords: "chord finder, chord identifier, chord analyzer, guitar chord finder, chord finder piano, identify chords from notes, reverse chord finder",
    canonicalUrl: "https://guitariz.studio/chord-finder",
    ogImage: "https://guitariz.studio/logo2.png",
    ogType: "website",
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "SoftwareApplication",
          "name": "Chord Finder - Guitariz",
          "url": "https://guitariz.studio/chord-finder",
          "description": content.description,
          "applicationCategory": "MusicApplication",
          "operatingSystem": "Web",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
        },
        {
          "@type": "FAQPage",
          "mainEntity": content.faqs.map((f) => ({
            "@type": "Question",
            "name": f.q,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": f.a
            }
          }))
        }
      ]
    }
  });

  const [inputMode, setInputMode] = useState<"guitar" | "piano">("guitar");
  const [accidental, setAccidental] = useState<"sharp" | "flat">("sharp");
  const [showMoreNames, setShowMoreNames] = useState(false);

  // Guitar frets state: array of 6 elements (-1 means muted/unselected, 0-12 means fret)
  // Index 0: High E, Index 1: B, Index 2: G, Index 3: D, Index 4: A, Index 5: Low E
  const [guitarFrets, setGuitarFrets] = useState<number[]>([-1, -1, -1, -1, -1, -1]);

  // Piano selected MIDI numbers set
  const [pianoNotes, setPianoNotes] = useState<Set<number>>(new Set());

  // "Find by name" reverse search state
  const [selectedRoot, setSelectedRoot] = useState("C");
  const [selectedVariant, setSelectedVariant] = useState("Major");

  // Calculate current MIDI notes based on mode
  const currentMidiNotes = useMemo(() => {
    if (inputMode === "guitar") {
      const notes: number[] = [];
      guitarFrets.forEach((fret, stringIdx) => {
        if (fret >= 0) {
          notes.push(GUITAR_STRINGS[stringIdx].baseMidi + fret);
        }
      });
      return notes;
    } else {
      return Array.from(pianoNotes).sort((a, b) => a - b);
    }
  }, [inputMode, guitarFrets, pianoNotes]);

  // Run chord identification
  const result: ChordIdentificationResult = useMemo(() => {
    return identifyChord(currentMidiNotes, { accidental });
  }, [currentMidiNotes, accidental]);

  // Guitar fret click handler
  const handleGuitarFretClick = (stringIdx: number, fret: number) => {
    setGuitarFrets((prev) => {
      const next = [...prev];
      if (next[stringIdx] === fret) {
        next[stringIdx] = -1; // Unselect / mute
      } else {
        next[stringIdx] = fret;
        const midi = GUITAR_STRINGS[stringIdx].baseMidi + fret;
        playNote(frequencyFromMidi(midi));
      }
      return next;
    });
  };

  // Piano key click handler
  const handlePianoKeyClick = (midi: number) => {
    setPianoNotes((prev) => {
      const next = new Set(prev);
      if (next.has(midi)) {
        next.delete(midi);
      } else {
        next.add(midi);
        playNote(frequencyFromMidi(midi));
      }
      return next;
    });
  };

  // Clear notes
  const handleClear = () => {
    setGuitarFrets([-1, -1, -1, -1, -1, -1]);
    setPianoNotes(new Set());
    setShowMoreNames(false);
  };

  // Play full chord
  const handlePlayChord = useCallback(() => {
    if (currentMidiNotes.length === 0) return;
    if (inputMode === "guitar") {
      playChord(guitarFrets);
    } else {
      playPianoArpeggio(currentMidiNotes);
    }
  }, [currentMidiNotes, inputMode, guitarFrets]);

  // Apply preset
  const applyPreset = (presetMidis: number[]) => {
    if (inputMode === "guitar") {
      const newFrets = [-1, -1, -1, -1, -1, -1];
      presetMidis.forEach((midi) => {
        GUITAR_STRINGS.forEach((str, strIdx) => {
          const fret = midi - str.baseMidi;
          if (fret >= 0 && fret <= 12 && newFrets[strIdx] === -1) {
            newFrets[strIdx] = fret;
          }
        });
      });
      setGuitarFrets(newFrets);
    } else {
      setPianoNotes(new Set(presetMidis));
    }
  };

  // Reverse search lookup
  const nameLookupResult = useMemo(() => {
    return findChordByName(`${selectedRoot} ${selectedVariant}`, chordLibraryData.roots);
  }, [selectedRoot, selectedVariant]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden selection:bg-white/10 text-foreground">
      <main className="container mx-auto px-4 md:px-6 pt-8 md:pt-12 pb-16 relative z-10">
        <div className="max-w-6xl mx-auto space-y-12">

          {/* Breadcrumb */}
          <Breadcrumb items={[
            { name: "Home", url: "https://guitariz.studio/" },
            { name: "Chord Finder", url: "https://guitariz.studio/chord-finder" }
          ]} />

          {/* Hero Header */}
          <div className="space-y-4">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-border bg-card/50 text-muted-foreground text-[10px] font-bold tracking-[0.2em] uppercase">
              <Sparkles className="w-3 h-3 text-primary" />
              <span>Reverse Chord Identifier</span>
            </div>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-2">
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-foreground">
                  Chord Finder
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl font-light leading-relaxed">
                  {content.intro}
                </p>
              </div>

              {/* Mode & Accidental Toggles */}
              <div className="flex items-center gap-3 bg-card/60 p-1.5 rounded-2xl border border-border">
                <div className="flex bg-muted/50 p-1 rounded-xl">
                  <button
                    onClick={() => setInputMode("guitar")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      inputMode === "guitar" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Guitar className="w-3.5 h-3.5" />
                    Guitar
                  </button>
                  <button
                    onClick={() => setInputMode("piano")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      inputMode === "piano" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Piano className="w-3.5 h-3.5" />
                    Piano
                  </button>
                </div>

                <div className="flex bg-muted/50 p-1 rounded-xl">
                  <button
                    onClick={() => setAccidental("sharp")}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      accidental === "sharp" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
                    }`}
                    title="Display Sharps (#)"
                  >
                    ♯
                  </button>
                  <button
                    onClick={() => setAccidental("flat")}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      accidental === "flat" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
                    }`}
                    title="Display Flats (b)"
                  >
                    ♭
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Interactive Tool Card */}
          <div className="p-6 md:p-8 rounded-3xl bg-card/60 border border-border/80 shadow-2xl backdrop-blur-xl space-y-8">

            {/* Presets Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border/40">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mr-1">Quick Presets:</span>
                {Object.keys(PRESETS).map((pName) => (
                  <button
                    key={pName}
                    onClick={() => applyPreset(PRESETS[pName])}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                  >
                    {pName}
                  </button>
                ))}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="text-xs text-muted-foreground hover:text-foreground h-8 px-3"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                Clear Notes
              </Button>
            </div>

            {/* Live Chord Detection Readout Box */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 via-card/80 to-card border border-primary/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                    Identified Chord
                  </span>
                  {result.primary?.inversion && (
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wider border-primary/30 text-primary bg-primary/5">
                      {result.primary.inversion} Inversion
                    </Badge>
                  )}
                  {result.primary && !result.primary.inversion && !result.primary.symbol.includes("/") && (
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wider border-emerald-500/30 text-emerald-400 bg-emerald-500/5">
                      Root Position
                    </Badge>
                  )}
                </div>

                <div className="flex items-baseline gap-4">
                  <h2 className="text-5xl md:text-6xl font-black tracking-tighter text-foreground">
                    {result.primary?.symbol || (result.status === "interval" ? result.primary?.symbol : "—")}
                  </h2>
                  {result.message && (
                    <p className="text-sm text-muted-foreground font-medium">
                      {result.message}
                    </p>
                  )}
                </div>

                {/* Notes & Intervals List */}
                {result.primary && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-xs text-muted-foreground">Notes:</span>
                    {result.primary.notes.map((n, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-md bg-foreground/10 text-xs font-semibold text-foreground">
                        {n}
                      </span>
                    ))}
                    {result.primary.intervals && result.primary.intervals.length > 0 && (
                      <>
                        <span className="text-xs text-muted-foreground ml-2">Intervals:</span>
                        {result.primary.intervals.map((iv, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-md bg-muted text-xs font-mono text-muted-foreground">
                            {iv}
                          </span>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Play Chord Action */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                <Button
                  onClick={handlePlayChord}
                  disabled={currentMidiNotes.length === 0}
                  className="h-12 px-6 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl transition-all"
                >
                  <Volume2 className="w-4 h-4 mr-2" />
                  Audition Chord
                </Button>
              </div>
            </div>

            {/* Alternates & Near Matches */}
            {(result.alternates.length > 0 || result.nearMatches.length > 0 || result.moreNames.length > 0) && (
              <div className="space-y-3 pt-2">
                {result.alternates.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted-foreground font-medium">Also Known As:</span>
                    {result.alternates.map((alt, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-card border border-border text-xs font-semibold text-foreground">
                        {alt.symbol}
                      </span>
                    ))}
                  </div>
                )}

                {result.nearMatches.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 text-xs text-amber-400">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Suggestions:</span>
                    {result.nearMatches.map((nm, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs font-medium">
                        {nm.message}
                      </span>
                    ))}
                  </div>
                )}

                {result.moreNames.length > 0 && (
                  <div>
                    <button
                      onClick={() => setShowMoreNames(!showMoreNames)}
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 font-medium transition-colors"
                    >
                      <span>{showMoreNames ? "Hide exotic names" : `More theoretical spellings (${result.moreNames.length})`}</span>
                      {showMoreNames ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                    {showMoreNames && (
                      <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-border/40">
                        {result.moreNames.map((mn, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md bg-muted/60 text-[11px] font-mono text-muted-foreground">
                            {mn.symbol}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Instrument View: Guitar vs Piano */}
            {inputMode === "guitar" ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Click frets to place fingers. Click the active fret again or the <span className="font-mono text-foreground font-semibold">✕</span> to mute that string.
                  </p>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    Strings: 1 (High e) to 6 (Low E)
                  </span>
                </div>

                {/* Guitar Neck Interactive SVG / Grid */}
                <div className="overflow-x-auto pb-4 pt-2">
                  <div className="min-w-[760px] p-6 rounded-2xl bg-[#080808] border border-border/60 select-none">

                    {/* Fret Markers Row Top */}
                    <div className="grid grid-cols-[60px_repeat(13,1fr)] mb-2 text-center text-[11px] font-mono text-muted-foreground">
                      <div>String</div>
                      <div>Open</div>
                      {Array.from({ length: FRETS_COUNT }).map((_, f) => (
                        <div key={f} className={FRET_MARKERS.includes(f + 1) ? "text-primary font-bold" : ""}>
                          {f + 1}
                        </div>
                      ))}
                    </div>

                    {/* Strings Rows */}
                    <div className="space-y-3">
                      {GUITAR_STRINGS.map((str, stringIdx) => {
                        const activeFret = guitarFrets[stringIdx];
                        const isMuted = activeFret === -1;

                        return (
                          <div key={stringIdx} className="grid grid-cols-[60px_repeat(13,1fr)] items-center gap-1 group">
                            {/* String Header / Mute Toggle */}
                            <button
                              onClick={() => {
                                setGuitarFrets((prev) => {
                                  const next = [...prev];
                                  next[stringIdx] = isMuted ? 0 : -1;
                                  return next;
                                });
                              }}
                              className={`h-8 px-2 rounded-lg text-xs font-mono font-bold flex items-center justify-between border transition-all ${
                                isMuted 
                                  ? "bg-red-500/10 border-red-500/30 text-red-400" 
                                  : "bg-primary/10 border-primary/30 text-primary"
                              }`}
                              title={isMuted ? "Click to unmute" : "Click to mute"}
                            >
                              <span>{str.name}</span>
                              <span className="text-[10px]">{isMuted ? "✕" : "○"}</span>
                            </button>

                            {/* Fret 0 (Open string) */}
                            <button
                              onClick={() => handleGuitarFretClick(stringIdx, 0)}
                              className={`h-8 rounded-lg flex items-center justify-center font-mono text-xs transition-all border ${
                                activeFret === 0
                                  ? "bg-primary text-primary-foreground font-bold border-primary shadow-[0_0_12px_rgba(59,130,246,0.5)] scale-105"
                                  : "bg-muted/20 border-border/40 hover:bg-muted/40 text-muted-foreground"
                              }`}
                            >
                              {activeFret === 0 ? "0" : "—"}
                            </button>

                            {/* Frets 1 to 12 */}
                            {Array.from({ length: FRETS_COUNT }).map((_, fIdx) => {
                              const fret = fIdx + 1;
                              const isFretSelected = activeFret === fret;

                              return (
                                <button
                                  key={fret}
                                  onClick={() => handleGuitarFretClick(stringIdx, fret)}
                                  className={`h-8 rounded-lg flex items-center justify-center font-mono text-xs transition-all relative border ${
                                    isFretSelected
                                      ? "bg-primary text-primary-foreground font-black border-primary shadow-[0_0_12px_rgba(59,130,246,0.6)] scale-105 z-10"
                                      : "bg-card/40 border-border/30 hover:bg-primary/10 hover:border-primary/30 text-muted-foreground"
                                  }`}
                                >
                                  {isFretSelected ? fret : ""}
                                </button>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>

                    {/* Fret Dots Underneath */}
                    <div className="grid grid-cols-[60px_repeat(13,1fr)] mt-3 text-center text-xs text-muted-foreground/60">
                      <div></div>
                      <div></div>
                      {Array.from({ length: FRETS_COUNT }).map((_, f) => (
                        <div key={f} className="flex justify-center">
                          {FRET_MARKERS.includes(f + 1) && (
                            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  Click piano keys across 2 octaves (C3 to B4) to add or remove notes.
                </p>

                {/* Piano Keyboard Component */}
                <div className="overflow-x-auto pb-4">
                  <div className="min-w-[680px] p-6 rounded-2xl bg-[#080808] border border-border/60 flex justify-center">
                    <div className="relative flex select-none">
                      {PIANO_KEYS.map((k) => {
                        const isSelected = pianoNotes.has(k.midi);

                        if (!k.isBlack) {
                          return (
                            <button
                              key={k.midi}
                              onClick={() => handlePianoKeyClick(k.midi)}
                              className={`w-11 h-44 rounded-b-xl border border-border/80 transition-all flex flex-col justify-end items-center pb-3 ${
                                isSelected
                                  ? "bg-primary text-primary-foreground shadow-[0_0_16px_rgba(59,130,246,0.8)] border-primary font-bold"
                                  : "bg-white text-zinc-900 hover:bg-zinc-100"
                              }`}
                            >
                              <span className="text-[11px] font-mono font-semibold">{k.note}</span>
                            </button>
                          );
                        } else {
                          return (
                            <button
                              key={k.midi}
                              onClick={() => handlePianoKeyClick(k.midi)}
                              className={`w-7 h-28 -mx-3.5 z-20 rounded-b-lg border transition-all flex flex-col justify-end items-center pb-2 ${
                                isSelected
                                  ? "bg-primary text-primary-foreground shadow-[0_0_16px_rgba(59,130,246,0.9)] border-primary font-bold"
                                  : "bg-zinc-900 text-zinc-300 border-zinc-700 hover:bg-zinc-800"
                              }`}
                            >
                              <span className="text-[9px] font-mono font-semibold">{k.note}</span>
                            </button>
                          );
                        }
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Mode 2: "Find by Name" / Reverse Lookup Card */}
          <div className="p-6 md:p-8 rounded-3xl bg-card/60 border border-border/80 shadow-xl space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                <Layers className="w-4 h-4" />
                <span>Search by Chord Name</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                Looking for a specific chord's shapes?
              </h2>
              <p className="text-xs md:text-sm text-muted-foreground">
                Select a root and quality to instantly view fingering coordinates and voicings.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Root</label>
                <select
                  value={selectedRoot}
                  onChange={(e) => setSelectedRoot(e.target.value)}
                  className="h-10 px-3 rounded-xl bg-muted/60 border border-border text-sm font-semibold text-foreground"
                >
                  {["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"].map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Quality</label>
                <select
                  value={selectedVariant}
                  onChange={(e) => setSelectedVariant(e.target.value)}
                  className="h-10 px-3 rounded-xl bg-muted/60 border border-border text-sm font-semibold text-foreground"
                >
                  {["Major", "Minor", "7", "maj7", "m7", "sus4", "sus2", "add9", "dim", "aug"].map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 self-end">
                <Button
                  onClick={() => {
                    if (nameLookupResult && nameLookupResult.variant.voicings.length > 0) {
                      const v = nameLookupResult.variant.voicings[0];
                      // v.frets is [lowE, A, D, G, B, highE] -> reverse to match GUITAR_STRINGS order
                      const reversedFrets = [...v.frets].reverse();
                      setGuitarFrets(reversedFrets);
                      setInputMode("guitar");
                    }
                  }}
                  className="h-10 px-4 rounded-xl text-xs font-bold"
                >
                  <Check className="w-3.5 h-3.5 mr-1.5" />
                  Load into Fretboard
                </Button>
              </div>
            </div>

            {nameLookupResult && (
              <div className="p-4 rounded-xl bg-muted/30 border border-border/40 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-foreground">
                    {nameLookupResult.root.root} {nameLookupResult.variant.name}
                  </h3>
                  <span className="text-xs text-muted-foreground font-mono">
                    Formula: {nameLookupResult.variant.intervals}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-mono text-muted-foreground">
                  {nameLookupResult.variant.voicings.map((v, i: number) => (
                    <span key={i} className="px-2.5 py-1 rounded-md bg-card border border-border">
                      Shape {i + 1}: [{v.frets.map((f: number) => (f === -1 ? "x" : f)).join(", ")}]
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* CTA Box: Have a Song Instead? */}
          <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-blue-600/15 via-indigo-600/10 to-transparent border border-blue-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400">
                <Music className="w-4 h-4" />
                <span>Audio Chord Detection</span>
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-foreground">
                Have a song recording instead of notes?
              </h3>
              <p className="text-sm text-muted-foreground font-light leading-relaxed">
                If you want to extract chords directly from an MP3, WAV file, or YouTube link without manually entering notes, use our free AI-powered song transcriber.
              </p>
            </div>
            <Link to="/chord-ai">
              <Button className="h-12 px-6 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-xl shrink-0">
                Open Chord AI <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          {/* Unique Prose Copy (SEO & Theory) */}
          <div className="mt-20 max-w-4xl mx-auto space-y-12">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-5xl font-light tracking-tighter text-foreground font-display">
                Music Theory & <span className="text-muted-foreground font-thin italic">Operation</span>
              </h2>
              <div className="h-[1px] w-full bg-gradient-to-r from-primary/30 via-border to-transparent" />
            </div>

            <div 
              className="prose prose-invert max-w-none text-sm md:text-base text-zinc-300 leading-relaxed space-y-6 [&>h2]:text-xl [&>h2]:font-semibold [&>h2]:text-white [&>h2]:mt-8 [&>h2]:mb-4 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:space-y-2 [&>ul]:text-zinc-400 [&>p]:leading-relaxed [&_a]:text-primary [&_a]:hover:underline"
              dangerouslySetInnerHTML={{ __html: content.html }}
            />
          </div>

          {/* 7 FAQs */}
          <SEOContent
            pageName="chord-finder"
            faqs={content.faqs.map((f) => ({
              question: f.q,
              answer: f.a
            }))}
          />

          {/* Related Tools */}
          <RelatedTools currentPath="/chord-finder" />
        </div>
      </main>
    </div>
  );
};

export default ChordFinderPage;
