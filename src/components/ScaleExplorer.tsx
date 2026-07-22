import { useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Scale, Hash, Globe, Info, Guitar, Search, PlayCircle, Piano, Disc } from "lucide-react";
import { playNote } from "@/lib/chordAudio";
import { motion, AnimatePresence } from "framer-motion";
import { PianoKeyboard } from "@/components/piano/PianoKeyboard";
import React from "react";

// ─── Fretboard Components ─────────────────────────────────────────────────────

const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const FretNote = React.memo(({ 
  note, 
  rootNote, 
  fIdx, 
  sIdx 
}: { 
  note: string; 
  rootNote: string; 
  fIdx: number; 
  sIdx: number 
}) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className="absolute group cursor-help transition-all duration-300 z-10" 
            style={{ 
              left: `${fIdx * (100 / 12)}%`, 
              top: `${sIdx * 30}px`, 
              transform: "translate(-50%, -50%)" 
            }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: fIdx * 0.03 + sIdx * 0.01 }}
              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[8px] border transition-all ${
                note === rootNote 
                  ? "bg-white text-black border-white shadow-lg scale-110" 
                  : "bg-black/90 text-white border-white/10"
              }`}
            >
              {note}
            </motion.div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-zinc-900 border-white/10 text-white text-[9px] font-mono">
          {note} on Fret {fIdx}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

FretNote.displayName = "FretNote";

const GuitarFretboard = React.memo(({ 
  scaleNotes, 
  rootNote 
}: { 
  scaleNotes: string[]; 
  rootNote: string 
}) => {
  const strings = ["E", "A", "D", "G", "B", "E"];
  
  return (
    <div className="relative bg-[#050505] p-6 md:p-8 rounded-[1.5rem] border border-white/5 shadow-inner w-full flex justify-center overflow-hidden">
      <div className="relative" style={{ width: "100%", height: "150px" }}>
        {/* Strings */}
        {Array.from({ length: 6 }, (_, idx) => (
          <div key={idx} className="absolute w-full h-[1px] bg-white/[0.05]" style={{ top: `${idx * 30}px` }} />
        ))}
        {/* Frets */}
        {Array.from({ length: 13 }, (_, idx) => (
          <div 
            key={idx} 
            className={`absolute h-full w-[1px] ${idx === 0 ? "bg-white/20" : "bg-white/5"}`} 
            style={{ left: `${idx * (100 / 12)}%` }}
          >
            {[3, 5, 7, 9, 12].includes(idx) && (
              <div className="absolute left-1/2 -translate-x-1/2 -bottom-6 flex flex-col items-center opacity-10">
                <div className="w-1 h-1 rounded-full bg-white" />
                <span className="text-[8px] font-mono mt-1 font-bold">{idx}</span>
              </div>
            )}
          </div>
        ))}
        {/* Notes */}
        {strings.map((startNote, sIdx) => {
          const openIdx = NOTES.indexOf(startNote);
          return Array.from({ length: 13 }, (_, fIdx) => {
            const note = NOTES[(openIdx + fIdx) % 12];
            if (!scaleNotes.includes(note)) return null;
            return (
              <FretNote 
                key={`${sIdx}-${fIdx}`} 
                note={note} 
                rootNote={rootNote} 
                fIdx={fIdx} 
                sIdx={sIdx} 
              />
            );
          });
        })}
      </div>
      <div className="absolute -left-6 top-8 bottom-8 flex flex-col justify-between text-[9px] font-mono text-muted-foreground/20">
        {["e", "B", "G", "D", "A", "E"].reverse().map((s, i) => (
          <div key={i} className="h-0 flex items-center">{s}</div>
        ))}
      </div>
    </div>
  );
});

GuitarFretboard.displayName = "GuitarFretboard";

type ScaleDataBase = {
  intervals: number[];
  description: string;
};

type WesternScaleData = ScaleDataBase & {
  chords: string[];
  usage: string;
  category?: "mode" | "pentatonic" | "exotic" | "blues";
};

type RagaScaleData = ScaleDataBase & {
  aroha: string;
  avaroha: string;
  time: string;
  mood: string;
};

type ScaleData = WesternScaleData | RagaScaleData;

const WESTERN_SCALES = {
  "Major (Ionian)": {
    intervals: [0, 2, 4, 5, 7, 9, 11],
    description: "The standard major scale - happy, bright sound",
    chords: ["I", "ii", "iii", "IV", "V", "vi", "vii"],
    usage: "Most common scale in Western music",
    category: "mode" as const
  },
  "Natural Minor (Aeolian)": {
    intervals: [0, 2, 3, 5, 7, 8, 10],
    description: "Sad, melancholic sound",
    chords: ["i", "ii", "III", "iv", "v", "VI", "VII"],
    usage: "Minor key compositions",
    category: "mode" as const
  },
  "Harmonic Minor": {
    intervals: [0, 2, 3, 5, 7, 8, 11],
    description: "Minor scale with raised 7th - dramatic, exotic",
    chords: ["i", "ii", "III+", "iv", "V", "VI", "vii"],
    usage: "Classical music, metal, jazz",
    category: "mode" as const
  },
  "Melodic Minor": {
    intervals: [0, 2, 3, 5, 7, 9, 11],
    description: "Minor scale with raised 6th and 7th",
    chords: ["i", "ii", "III+", "IV", "V", "vi", "vii"],
    usage: "Jazz, fusion, classical",
    category: "mode" as const
  },
  "Dorian": {
    intervals: [0, 2, 3, 5, 7, 9, 10],
    description: "Minor scale with raised 6th - jazzy, mysterious",
    chords: ["i", "ii", "III", "IV", "v", "vi", "VII"],
    usage: "Jazz, rock, folk",
    category: "mode" as const
  },
  "Phrygian": {
    intervals: [0, 1, 3, 5, 7, 8, 10],
    description: "Spanish-sounding scale - tense, exotic",
    chords: ["i", "II", "III", "iv", "v", "VI", "vii"],
    usage: "Flamenco, metal, world music",
    category: "mode" as const
  },
  "Lydian": {
    intervals: [0, 2, 4, 6, 7, 9, 11],
    description: "Major scale with raised 4th - dreamy, ethereal",
    chords: ["I", "II", "iii", "#iv", "V", "vi", "vii"],
    usage: "Film scores, jazz, progressive rock",
    category: "mode" as const
  },
  "Mixolydian": {
    intervals: [0, 2, 4, 5, 7, 9, 10],
    description: "Major scale with flattened 7th - bluesy, dominant",
    chords: ["I", "ii", "iii", "IV", "v", "vi", "VII"],
    usage: "Blues, rock, folk",
    category: "mode" as const
  },
  "Locrian": {
    intervals: [0, 1, 3, 5, 6, 8, 10],
    description: "Diminished scale - unstable, dissonant",
    chords: ["i", "ii", "iii", "iv", "V", "VI", "vii"],
    usage: "Rare, experimental music",
    category: "mode" as const
  },
  "Pentatonic Major": {
    intervals: [0, 2, 4, 7, 9],
    description: "Five-note major scale - simple, pure",
    chords: ["I", "IV", "V"],
    usage: "Folk, country, rock",
    category: "pentatonic" as const
  },
  "Pentatonic Minor": {
    intervals: [0, 3, 5, 7, 10],
    description: "Five-note minor scale - bluesy, soulful",
    chords: ["i", "iv", "v"],
    usage: "Blues, rock, world music",
    category: "pentatonic" as const
  },
  "Blues": {
    intervals: [0, 3, 5, 6, 7, 10],
    description: "Hexatonic blues scale - expressive, emotive",
    chords: ["i", "iv", "V"],
    usage: "Blues, jazz, rock",
    category: "blues" as const
  },
  "Whole Tone": {
    intervals: [0, 2, 4, 6, 8, 10],
    description: "Dreamy, ambiguous scale",
    chords: ["I", "ii", "iii", "IV", "V", "vi"],
    usage: "Impressionist music, jazz",
    category: "exotic" as const
  },
  "Diminished": {
    intervals: [0, 2, 3, 5, 6, 8, 9, 11],
    description: "Alternating whole and half steps",
    chords: ["i", "ii", "III", "iv", "V", "VI", "vii"],
    usage: "Jazz, classical, modern",
    category: "exotic" as const
  }
};

const RAGA_SCALES = {
  "Bhairav": {
    intervals: [0, 1, 4, 5, 7, 8, 11],
    description: "Morning raga - devotional, serious. Equivalent to Phrygian dominant scale.",
    aroha: "S r G M P d N S",
    avaroha: "S N d P M G r S",
    time: "Dawn (6-9 AM)",
    mood: "Devotional, contemplative"
  },
  "Yaman": {
    intervals: [0, 2, 4, 6, 7, 9, 11],
    description: "Evening raga - romantic, majestic. Uses tivra Ma (sharp 4th).",
    aroha: "N R G m D N S",
    avaroha: "S N D m G R S",
    time: "Evening (6-9 PM)",
    mood: "Romantic, heroic"
  },
  "Bhairavi": {
    intervals: [0, 1, 3, 5, 7, 8, 10],
    description: "Dawn raga - devotional, soothing. All komal (flat) notes except Sa and Pa.",
    aroha: "S r g M P d n S",
    avaroha: "S n d P M g r S",
    time: "Dawn/Morning (6-9 AM)",
    mood: "Devotional, peaceful"
  },
  "Kafi": {
    intervals: [0, 2, 3, 5, 7, 9, 10],
    description: "Evening raga - romantic, light. Equivalent to Dorian mode.",
    aroha: "N R g M D n S",
    avaroha: "S n D M g R S",
    time: "Evening (6-9 PM)",
    mood: "Romantic, joyful"
  },
  "Bilawal": {
    intervals: [0, 2, 4, 5, 7, 9, 11],
    description: "Morning raga - pure, bright. All shuddha notes. One of the 10 parent ragas (thaats).",
    aroha: "S R G M P D N S",
    avaroha: "S N D P M G R S",
    time: "Morning (9-12 PM)",
    mood: "Bright, joyful"
  },
  "Darbari": {
    intervals: [0, 2, 3, 5, 7, 8, 10],
    description: "Night raga - deep, serious. Associated with royalty and profound emotions.",
    aroha: "S R g M P d n S",
    avaroha: "S n d P M g R S",
    time: "Late Night (12-3 AM)",
    mood: "Serious, majestic"
  },
  "Bageshri": {
    intervals: [0, 2, 3, 5, 7, 9, 10],
    description: "Night raga - romantic, yearning. Expresses longing and devotion.",
    aroha: "S g M D n S",
    avaroha: "S n D M g R S",
    time: "Late Night (12-3 AM)",
    mood: "Longing, romantic"
  },
  "Malkauns": {
    intervals: [0, 3, 5, 8, 10],
    description: "Midnight raga - mysterious, deep. Pentatonic scale without Re and Pa.",
    aroha: "S g M d n S",
    avaroha: "S n d M g S",
    time: "Midnight (12-3 AM)",
    mood: "Mysterious, meditative"
  },
  "Bihag": {
    intervals: [0, 2, 4, 5, 7, 9, 11],
    description: "Night raga - romantic, playful. Similar to Bilawal but with different emphasis.",
    aroha: "S G M D N S",
    avaroha: "S N D P M G R S",
    time: "Night (9-12 AM)",
    mood: "Romantic, playful"
  },
  "Puriya Dhanashree": {
    intervals: [0, 1, 4, 6, 7, 9, 11],
    description: "Evening raga - romantic, devotional. Uses komal Re and tivra Ma.",
    aroha: "N r G m D N S",
    avaroha: "S N D m G r S",
    time: "Evening (6-9 PM)",
    mood: "Romantic, devotional"
  },
  "Jaunpuri": {
    intervals: [0, 2, 3, 5, 7, 8, 11],
    description: "Morning raga - serious, deep. Similar to Asavari with shuddha Ni.",
    aroha: "S R g M P d N S",
    avaroha: "S N d P M g R S",
    time: "Morning (9-12 PM)",
    mood: "Serious, contemplative"
  },
  "Durga": {
    intervals: [0, 2, 4, 7, 9],
    description: "Evening raga - joyful, pure. Pentatonic scale without Ma and Ni.",
    aroha: "S R G P D S",
    avaroha: "S D P G R S",
    time: "Evening (6-9 PM)",
    mood: "Joyful, uplifting"
  }
};

// ─── Scale Data ──────────────────────────────────────────────────────────────
const ScaleExplorer = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const paramRoot = searchParams.get("root");
  const paramScale = searchParams.get("scale");

  const [rootNote, setRootNote] = useState(() => {
    if (paramRoot && NOTES.includes(paramRoot.toUpperCase())) return paramRoot.toUpperCase();
    return "C";
  });

  const [selectedScale, setSelectedScale] = useState(() => {
    if (!paramScale) return "Major (Ionian)";
    const decoded = decodeURIComponent(paramScale);
    if (WESTERN_SCALES[decoded as keyof typeof WESTERN_SCALES]) return decoded;
    const matched = Object.keys(WESTERN_SCALES).find(k => k.toLowerCase().includes(decoded.toLowerCase()));
    return matched || "Major (Ionian)";
  });

  const [scaleCategory, setScaleCategory] = useState("western");
  const [lastPlayed, setLastPlayed] = useState<string | null>(null);
  const [scaleSearchQuery, setScaleSearchQuery] = useState("");

  // Sync state to URL search params
  const handleSetRootNote = (note: string) => {
    setRootNote(note);
    setSearchParams({ root: note, scale: selectedScale });
  };

  const handleSetSelectedScale = (scale: string) => {
    setSelectedScale(scale);
    setSearchParams({ root: rootNote, scale });
  };

  const currentScales = (scaleCategory === "western" ? WESTERN_SCALES : RAGA_SCALES) as Record<string, ScaleData>;

  const filteredScales = useMemo(() => {
    let scales = Object.keys(currentScales);
    if (scaleSearchQuery.trim()) {
      scales = scales.filter(scale =>
        scale.toLowerCase().includes(scaleSearchQuery.toLowerCase())
      );
    }
    return scales;
  }, [scaleSearchQuery, currentScales]);

  const getScaleNotes = useMemo(() => {
    const rootIndex = NOTES.indexOf(rootNote);
    const scaleData = currentScales[selectedScale];
    if (!scaleData) return [];
    return scaleData.intervals.map((interval: number) => NOTES[(rootIndex + interval) % 12]);
  }, [rootNote, selectedScale, currentScales]);

  const scaleData = currentScales[selectedScale];

  const playScale = () => {
    getScaleNotes.forEach((note, index) => {
      setTimeout(() => {
        const noteFreq = 440 * Math.pow(2, (NOTES.indexOf(note) - 9) / 12);
        playNote(noteFreq, 1.2, 0.4, "piano");
        setLastPlayed(note);
      }, index * 300);
    });
    setTimeout(() => setLastPlayed(null), getScaleNotes.length * 300);
  };

  return (
    <div className="space-y-8 w-full">
      <div className="flex flex-col lg:flex-row gap-8 w-full min-h-[600px]">
      {/* Selection Sidebar */}
      <div className="w-full lg:w-64 flex flex-col gap-4 lg:sticky lg:top-8 h-full min-h-[750px] lg:h-[calc(100vh-4rem)]">
        <div className="glass-card rounded-2xl p-4 border-white/5 bg-[#0a0a0a]/60 flex flex-col h-full overflow-hidden shadow-xl">
          <div className="space-y-4 flex flex-col h-full pt-2">
            <div className="flex p-0.5 bg-white/[0.03] rounded-xl border border-white/5">
              <button
                onClick={() => {
                  setScaleCategory("western");
                  handleSetSelectedScale("Major (Ionian)");
                }}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${scaleCategory === "western"
                  ? "bg-white/10 text-white shadow-sm border border-white/10"
                  : "text-muted-foreground hover:text-white"
                  }`}
              >
                Western
              </button>
              <button
                onClick={() => {
                  setScaleCategory("raga");
                  handleSetSelectedScale("Bhairav");
                }}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${scaleCategory === "raga"
                  ? "bg-white/10 text-white shadow-sm border border-white/10"
                  : "text-muted-foreground hover:text-white"
                  }`}
              >
                Raga
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] uppercase tracking-widest text-muted-foreground/40 font-bold px-1">Root Note</label>
              <div className="grid grid-cols-4 gap-1">
                {NOTES.map((note) => (
                  <button
                    key={note}
                    onClick={() => handleSetRootNote(note)}
                    className={`h-8 rounded-lg text-xs font-mono transition-all border ${rootNote === note
                      ? "bg-white text-black border-white shadow-lg"
                      : "bg-white/[0.02] border-white/5 text-muted-foreground hover:border-white/10 hover:text-white"
                      }`}
                  >
                    {note}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 flex flex-col min-h-0 overflow-hidden space-y-2">
              <label className="text-[9px] uppercase tracking-widest text-muted-foreground/40 font-bold px-1">Structure</label>
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/30 group-focus-within:text-white transition-colors" />
                <input
                  type="text"
                  placeholder="Filter scales..."
                  value={scaleSearchQuery}
                  onChange={(e) => setScaleSearchQuery(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/5 rounded-lg py-1.5 pl-9 pr-4 text-xs text-white placeholder:text-muted-foreground/20 focus:outline-none focus:ring-1 focus:ring-white/10 transition-all font-medium"
                />
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar-visible min-h-[500px]">
                <div className="space-y-0.5">
                  {filteredScales.map((scale) => (
                    <button
                      key={scale}
                      onClick={() => handleSetSelectedScale(scale)}
                      className={`w-full text-left px-3 py-1 rounded-lg text-xs font-sans transition-all border group relative overflow-hidden ${selectedScale === scale
                        ? "bg-white/[0.06] border-white/10 text-white font-normal shadow-sm"
                        : "border-transparent text-muted-foreground/60 hover:bg-white/[0.03] hover:text-white"
                        }`}
                    >
                      {selectedScale === scale && (
                        <motion.div layoutId="activeScale" className="absolute left-0 top-1 bottom-1 w-0.5 bg-white rounded-r-full" />
                      )}
                      <span className={selectedScale === scale ? "pl-1" : "pl-0"}>{scale}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 space-y-4">
        <div className="glass-card rounded-[1.50rem] p-6 border-white/10 bg-white/[0.01] overflow-hidden relative min-h-[140px] flex items-center shadow-xl">
          <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
            <Scale className="w-48 h-48 text-white" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 w-full">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary px-2 py-0.5 text-[9px] uppercase tracking-widest font-bold">
                  {scaleCategory} structure
                </Badge>
              </div>
              <div className="space-y-1">
                <h1 className="text-3xl md:text-4xl font-light tracking-tighter text-white">
                  {rootNote} <span className="text-muted-foreground font-thin italic">{selectedScale}</span>
                </h1>
                <p className="text-[11px] text-muted-foreground max-w-lg leading-relaxed opacity-50 font-medium font-sans">
                  {scaleData.description}
                </p>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={playScale}
                  disabled={!!lastPlayed}
                  className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full text-[10px] font-bold hover:bg-neutral-200 transition-all shadow-lg group disabled:opacity-50"
                >
                  <PlayCircle className="w-3.5 h-3.5 fill-current group-hover:scale-110 transition-transform" />
                  Audition Scale
                </button>

                <Link
                  to={`/theory?root=${rootNote}`}
                  className="flex items-center gap-2 bg-white/10 text-white border border-white/20 px-4 py-2 rounded-full text-[10px] font-bold hover:bg-white/20 transition-all shadow-lg"
                >
                  <Disc className="w-3.5 h-3.5 text-primary" />
                  Analyze {rootNote} on Circle of Fifths →
                </Link>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 md:max-w-[280px] justify-end">
              <AnimatePresence mode="popLayout">
                {getScaleNotes.map((note, idx) => (
                  <motion.div
                    key={`${note}-${idx}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: idx * 0.03 }}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono text-[11px] font-bold border transition-all ${note === rootNote
                      ? "bg-white text-black border-white shadow-xl"
                      : "bg-white/[0.02] border-white/5 text-white"
                      } ${lastPlayed === note ? "scale-105 ring-1 ring-primary border-primary shadow-[0_0_20px_rgba(255,255,255,0.3)]" : ""}`}
                  >
                    {note}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-[2rem] p-1 border-white/5 bg-black/40 shadow-xl overflow-hidden">
          <div className="p-4 md:p-5 pb-1 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-secondary/20 rounded-lg">
                <Guitar className="w-3.5 h-3.5 text-secondary" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-xs font-bold text-white tracking-tight">Fretboard Mapping</h3>
                <span className="text-[9px] text-muted-foreground/40 font-medium uppercase tracking-tighter">0-12 Frets • Standard</span>
              </div>
            </div>
          </div>
          <div className="p-4 md:p-6 overflow-x-auto scrollbar-hide flex justify-center">
            <div className="relative w-full max-w-[750px] flex items-center justify-center py-4">
              <GuitarFretboard scaleNotes={getScaleNotes} rootNote={rootNote} />
            </div>
          </div>
        </div>

        {/* ── Modal Degrees & Theory Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {scaleCategory === "western" ? (
            <div className="glass-card rounded-2xl p-6 border-white/5 bg-white/[0.01]">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/10 rounded-xl text-primary"><Hash className="w-4 h-4" /></div>
                <h3 className="text-sm font-semibold text-white tracking-tight">Modal Degrees & Diatonic Chords</h3>
              </div>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {(scaleData as WesternScaleData).chords.map((chord, idx) => {
                    const scaleNote = getScaleNotes[idx] || "";
                    const cleanRoman = chord.replace(/[°+]/g, "").trim();
                    const isMinor = cleanRoman === cleanRoman.toLowerCase();
                    const isDiminished = chord.includes("°") || chord.toLowerCase().includes("dim") || cleanRoman === "vii";
                    const isAugmented = chord.includes("+");

                    let suffix = "";
                    if (isDiminished) suffix = "dim";
                    else if (isAugmented) suffix = "aug";
                    else if (isMinor) suffix = "m";

                    const actualChord = scaleNote ? `${scaleNote}${suffix}` : "";

                    return (
                      <div
                        key={idx}
                        className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-[11px] font-mono text-white flex items-center gap-2 hover:border-primary/40 transition-colors cursor-pointer"
                        onClick={() => {
                          if (scaleNote) {
                            const noteFreq = 440 * Math.pow(2, (NOTES.indexOf(scaleNote) - 9) / 12);
                            playNote(noteFreq, 1.2, 0.4, "piano");
                            setLastPlayed(scaleNote);
                          }
                        }}
                        title={`Click to play root note ${scaleNote}`}
                      >
                        <span className="text-muted-foreground/45">{idx + 1}.</span>
                        <span className="font-bold text-primary">{actualChord || scaleNote}</span>
                        <span className="text-[10px] text-muted-foreground">({chord})</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-6 border-white/5 bg-white/[0.01]">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-accent/10 rounded-xl text-accent"><Globe className="w-4 h-4" /></div>
                <h3 className="text-sm font-semibold text-white tracking-tight">Raga Details</h3>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                    <span className="text-[10px] text-muted-foreground uppercase block mb-1 font-bold tracking-widest">Time</span>
                    <span className="text-xs text-white">{(scaleData as RagaScaleData).time}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                    <span className="text-[10px] text-muted-foreground uppercase block mb-1 font-bold tracking-widest">Mood</span>
                    <span className="text-xs text-white">{(scaleData as RagaScaleData).mood}</span>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 font-mono text-[11px] space-y-3 text-center">
                  <div className="flex items-center gap-3 justify-center">
                    <span className="text-primary opacity-50 font-bold">↑</span>
                    <span className="tracking-[0.2em]">{(scaleData as RagaScaleData).aroha}</span>
                  </div>
                  <div className="h-px bg-white/5 mx-4" />
                  <div className="flex items-center gap-3 justify-center">
                    <span className="text-accent opacity-50 font-bold">↓</span>
                    <span className="tracking-[0.2em]">{(scaleData as RagaScaleData).avaroha}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="glass-card rounded-2xl p-6 border-white/5 bg-white/[0.01] flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-neutral-100/10 rounded-xl text-white"><Info className="w-4 h-4" /></div>
                <h3 className="text-sm font-semibold text-white tracking-tight">Theory Context & Character</h3>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-widest">
                {scaleCategory}
              </span>
            </div>

            {/* Interval Construction Pill */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground/50 font-bold block mb-1">Scale Intervals</span>
                <span className="text-xs font-mono font-bold text-primary">
                  {scaleData.intervals.map((semitones: number) => {
                    const degreeMap: Record<number, string> = {
                      0: "1",
                      1: "b2",
                      2: "2",
                      3: "b3",
                      4: "3",
                      5: "4",
                      6: "#4",
                      7: "5",
                      8: "b6",
                      9: "6",
                      10: "b7",
                      11: "7"
                    };
                    return degreeMap[semitones] || semitones.toString();
                  }).join(" - ")}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground/50 font-bold block mb-1">Scale Family</span>
                <span className="text-xs font-bold text-white capitalize">
                  {scaleCategory === "raga" ? "Indian Raga" : ("chords" in scaleData ? scaleData.category : undefined) || "Western Scale"}
                </span>
              </div>
            </div>

            {/* Custom Dynamic Insight */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
              <span className="text-[9px] uppercase tracking-widest text-muted-foreground/50 font-bold block">Harmonic Insight</span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {scaleCategory === "raga" ? (
                  <>
                    <strong>{selectedScale}</strong> is a classical Indian raga.
                    {selectedScale === "Bhairav" && " It represents the dawn and Shiva's meditative consciousness. It uses Komal Re (flat 2) and Komal Dha (flat 6) to evoke a deep, serious, and spiritual devotion."}
                    {selectedScale === "Yaman" && " It is a majestic evening raga that introduces Tivra Madhyam (sharp 4th), generating a pure, romantic, and heroic mood."}
                    {selectedScale === "Bhairavi" && " Known as the 'queen of ragas', Bhairavi uses all komal (flat) notes except Sa and Pa, producing a peaceful, meditative, and sweet mood."}
                    {selectedScale === "Kafi" && " A light evening raga that uses flat 3rd (Ga) and flat 7th (Ni), equivalent to the Western Dorian mode. It is popular in light classical and semi-classical songs."}
                    {selectedScale === "Bilawal" && " The standard natural major scale equivalent. It represents pure dawn, joy, and simplicity using all shuddha (natural) notes."}
                    {selectedScale === "Darbari" && " A deep, slow, late-night raga using komal Ga, Dha, and Ni. It creates a serious, dark, and royal mood with slow oscillations (andolan)."}
                    {selectedScale === "Bageshri" && " A beautiful late-night raga expressing yearning, love, and devotion. It omits Re and Pa in the ascent to build anticipation."}
                    {selectedScale === "Malkauns" && " A pentatonic midnight raga that skips Re and Pa entirely, creating a serious, deeply meditative, and mysterious atmosphere."}
                    {!["Bhairav", "Yaman", "Bhairavi", "Kafi", "Bilawal", "Darbari", "Bageshri", "Malkauns"].includes(selectedScale) && ` ${scaleData.description}`}
                  </>
                ) : (
                  <>
                    <strong>{rootNote} {selectedScale}</strong> is a Western { ("chords" in scaleData ? scaleData.category : undefined) || "scale" }.
                    {selectedScale === "Major (Ionian)" && " The fundamental happy, bright Major scale. Used as the benchmark for Western harmony. Evokes triumph, resolution, and joy."}
                    {selectedScale === "Natural Minor (Aeolian)" && " The natural minor scale. Melancholic, emotional, and serious. Used extensively to convey sadness, introspection, and drama."}
                    {selectedScale === "Dorian" && " A minor scale with a raised 6th degree. It balances sadness with a bright, jazzy, and hopeful mood. Common in jazz fusion and classic rock (e.g. Santana)."}
                    {selectedScale === "Phrygian" && " A minor scale with a flattened 2nd degree. Extremely dark, tense, and exotic. Evokes Flamenco, heavy metal riffs, and Spanish classical motifs."}
                    {selectedScale === "Lydian" && " A major scale with a raised 4th degree (#4). Dreamy, floating, spacey, and mystical. Extensively used in sci-fi, cinematic scores, and progressive rock."}
                    {selectedScale === "Mixolydian" && " A major scale with a flattened 7th degree (b7). Bluesy, dominant, and grounded. The ultimate classic rock and blues solo scale."}
                    {selectedScale === "Locrian" && " A highly dissonant scale with a flattened 2nd and 5th (b5). Unstable and tense, resolving back to the tonic is difficult. Used in avant-garde and progressive metal."}
                    {selectedScale === "Harmonic Minor" && " A minor scale with a raised 7th (leading tone). Creates a dramatic, neoclassical, and exotic feel with its large augmented 2nd interval."}
                    {selectedScale === "Melodic Minor" && " A minor scale with a raised 6th and 7th. Often used in jazz to improvise over dominant chords, offering a sophisticated, smooth sound."}
                    {!["Major (Ionian)", "Natural Minor (Aeolian)", "Dorian", "Phrygian", "Lydian", "Mixolydian", "Locrian", "Harmonic Minor", "Melodic Minor"].includes(selectedScale) && ` ${scaleData.description}`}
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

      <div className="space-y-8 w-full">
        {/* ── Piano Keyboard Section ── */}
        <div className="glass-card rounded-[2rem] p-1 border-white/5 bg-black/40 shadow-xl overflow-hidden">
          <div className="p-4 md:p-5 pb-3 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 rounded-lg">
                <Piano className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-xs font-bold text-white tracking-tight">Piano Keyboard Visualization</h3>
                <span className="text-[9px] text-muted-foreground/60 font-medium uppercase tracking-tighter">
                  Showing scale notes for {rootNote} {selectedScale}
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 md:p-6 flex justify-center">
            <PianoKeyboard
              scaleNotes={getScaleNotes}
              rootNote={rootNote}
              intervals={(currentScales[selectedScale] as { intervals: number[] }).intervals}
              startOctave={3}
              numOctaves={2}
              fullRange={false}
              showLabels={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScaleExplorer;
