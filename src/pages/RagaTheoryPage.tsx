import { useState, useMemo } from "react";
import { usePageMetadata } from "@/hooks/usePageMetadata";
import { SEOContent, Breadcrumb } from "@/components/SEOContent";
import RelatedTools from "@/components/RelatedTools";
import { PianoKeyboard } from "@/components/piano/PianoKeyboard";
import { playNote } from "@/lib/chordAudio";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { 
  BookOpen, 
  ArrowLeftRight, 
  Info, 
  Music, 
  HelpCircle,
  Sparkles,
  GitCompare,
  ArrowRight
} from "lucide-react";

// Notes array
const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

// Hindustani notation to Western equivalent naming map
const SWARA_EXPLANATIONS: Record<string, string> = {
  "S": "Sa (Shadaj) - Tonic / Root",
  "r": "Re (Komal Rishabh) - Flat 2nd",
  "R": "Re (Shuddha Rishabh) - Major 2nd",
  "g": "Ga (Komal Gandhar) - Minor 3rd",
  "G": "Ga (Shuddha Gandhar) - Major 3rd",
  "M": "Ma (Shuddha Madhyam) - Perfect 4th",
  "m": "Ma (Teevra Madhyam) - Sharp 4th",
  "P": "Pa (Pancham) - Perfect 5th",
  "d": "Dha (Komal Dhaivat) - Flat 6th",
  "D": "Dha (Shuddha Dhaivat) - Major 6th",
  "n": "Ni (Komal Nishad) - Flat 7th",
  "N": "Ni (Shuddha Nishad) - Major 7th"
};

interface ThaatInfo {
  name: string;
  swaras: string;
  westernNotes: string[];
  mode: string;
  description: string;
  aroha: string;
  avaroha: string;
  raga: string;
  intervals: number[];
}

// Canonical 10 Hindustani Thaats from Bhatkhande's system
const THAATS: ThaatInfo[] = [
  {
    name: "Bilawal",
    swaras: "S R G M P D N",
    westernNotes: ["C", "D", "E", "F", "G", "A", "B"],
    mode: "Ionian Mode (Major Scale)",
    description: "All shuddha (natural) notes. The standard reference scale for Hindustani music.",
    aroha: "S R G M P D N S",
    avaroha: "S N D P M G R S",
    raga: "Alhaiya Bilawal",
    intervals: [0, 2, 4, 5, 7, 9, 11]
  },
  {
    name: "Kalyan",
    swaras: "S R G m P D N",
    westernNotes: ["C", "D", "E", "F#", "G", "A", "B"],
    mode: "Lydian Mode",
    description: "Uses Teevra Madhyam (sharp 4th). Majestic, bright, and devotional evening mood.",
    aroha: "S R G m P D N S",
    avaroha: "S N D P m G R S",
    raga: "Yaman",
    intervals: [0, 2, 4, 6, 7, 9, 11]
  },
  {
    name: "Khamaj",
    swaras: "S R G M P D n",
    westernNotes: ["C", "D", "E", "F", "G", "A", "Bb"],
    mode: "Mixolydian Mode",
    description: "Uses Komal Nishad (flat 7th). Associated with light classical and romantic forms.",
    aroha: "S R G M P D N S",
    avaroha: "S n D P M G R S",
    raga: "Khamaj",
    intervals: [0, 2, 4, 5, 7, 9, 10]
  },
  {
    name: "Kafi",
    swaras: "S R g M P D n",
    westernNotes: ["C", "D", "Eb", "F", "G", "A", "Bb"],
    mode: "Dorian Mode",
    description: "Uses Komal Gandhar (flat 3rd) and Komal Nishad (flat 7th). Light and playful.",
    aroha: "S R g M P D n S",
    avaroha: "S n D P M g R S",
    raga: "Kafi",
    intervals: [0, 2, 3, 5, 7, 9, 10]
  },
  {
    name: "Asavari",
    swaras: "S R g M P d n",
    westernNotes: ["C", "D", "Eb", "F", "G", "Ab", "Bb"],
    mode: "Aeolian Mode (Natural Minor)",
    description: "Uses Komal Ga, Dha, and Ni. Solemn, deep, and devotional evening mood.",
    aroha: "S R M P d S",
    avaroha: "S n d P M g R S",
    raga: "Jaunpuri",
    intervals: [0, 2, 3, 5, 7, 8, 10]
  },
  {
    name: "Bhairavi",
    swaras: "S r g M P d n",
    westernNotes: ["C", "Db", "Eb", "F", "G", "Ab", "Bb"],
    mode: "Phrygian Mode",
    description: "All komal (flat) notes except Sa and Pa. Peaceful, soothing, traditionally played at concert conclusions.",
    aroha: "S r g M P d n S",
    avaroha: "S n d P M g r S",
    raga: "Raag Bhairavi",
    intervals: [0, 1, 3, 5, 7, 8, 10]
  },
  {
    name: "Bhairav",
    swaras: "S r G M P d N",
    westernNotes: ["C", "Db", "E", "F", "G", "Ab", "B"],
    mode: "Double Harmonic Major (No diatonic mode)",
    description: "Uses Komal Re and Dha. Striking semitone steps evoke a deeply prayerful, dawn atmosphere.",
    aroha: "S r G M P d N S",
    avaroha: "S N d P M G r S",
    raga: "Raag Bhairav",
    intervals: [0, 1, 4, 5, 7, 8, 11]
  },
  {
    name: "Todi",
    swaras: "S r g m P d N",
    westernNotes: ["C", "Db", "Eb", "F#", "G", "Ab", "B"],
    mode: "Minor Gypsy / Lydian #2 (No diatonic mode)",
    description: "Komal Re, Ga, Dha and Teevra Ma. Heavily meditative morning mood with strong harmonic tension.",
    aroha: "S r g m d N S",
    avaroha: "S N d P m g r S",
    raga: "Miyan ki Todi",
    intervals: [0, 1, 3, 6, 7, 8, 11]
  },
  {
    name: "Poorvi",
    swaras: "S r G m P d N",
    westernNotes: ["C", "Db", "E", "F#", "G", "Ab", "B"],
    mode: "Double Harmonic Lydian (No diatonic mode)",
    description: "Komal Re, Dha, and Teevra Ma. Evokes a solemn sunset setting with rich internal resolutions.",
    aroha: "S r G m P d N S",
    avaroha: "S N d P m G r S",
    raga: "Raag Poorvi",
    intervals: [0, 1, 4, 6, 7, 8, 11]
  },
  {
    name: "Marwa",
    swaras: "S r G m P D N",
    westernNotes: ["C", "Db", "E", "F#", "G", "A", "B"],
    mode: "Lydian b2 (No diatonic mode)",
    description: "Uses Komal Re and Teevra Ma. Eponymous Raag Marwa omits Pa, but parent Thaat includes it.",
    aroha: "S r G m D N S",
    avaroha: "S N D m G r S",
    raga: "Raag Marwa (omits Pa)",
    intervals: [0, 1, 4, 6, 7, 9, 11]
  }
];

// Western Scales equivalent array
const WESTERN_SCALES = [
  { name: "Major (Ionian)", intervals: [0, 2, 4, 5, 7, 9, 11], equivalent: "Bilawal" },
  { name: "Lydian", intervals: [0, 2, 4, 6, 7, 9, 11], equivalent: "Kalyan" },
  { name: "Mixolydian", intervals: [0, 2, 4, 5, 7, 9, 10], equivalent: "Khamaj" },
  { name: "Dorian", intervals: [0, 2, 3, 5, 7, 9, 10], equivalent: "Kafi" },
  { name: "Natural Minor (Aeolian)", intervals: [0, 2, 3, 5, 7, 8, 10], equivalent: "Asavari" },
  { name: "Phrygian", intervals: [0, 1, 3, 5, 7, 8, 10], equivalent: "Bhairavi" },
  { name: "Double Harmonic Major", intervals: [0, 1, 4, 5, 7, 8, 11], equivalent: "Bhairav" },
  { name: "Gypsy Minor (Todi)", intervals: [0, 1, 3, 6, 7, 8, 11], equivalent: "Todi" },
  { name: "Double Harmonic Lydian", intervals: [0, 1, 4, 6, 7, 8, 11], equivalent: "Poorvi" },
  { name: "Lydian b2", intervals: [0, 1, 4, 6, 7, 9, 11], equivalent: "Marwa" }
];

// 6-String Guitar base MIDI values (E2, A2, D3, G3, B3, E4)
const STRING_BASE_MIDIS = [40, 45, 50, 55, 59, 64];

// Inline Guitar Fretboard Component
const GuitarFretboard = ({ scaleNotes, rootNote }: { scaleNotes: string[]; rootNote: string }) => {
  const strings = ["E", "A", "D", "G", "B", "E"];

  return (
    <div className="relative bg-[#050505] p-5 md:p-6 rounded-2xl border border-white/5 shadow-inner w-full overflow-x-auto select-none custom-scrollbar">
      <div className="relative h-[155px] w-full min-w-[480px]">
        {/* Strings */}
        {strings.map((_, sIdx) => (
          <div key={sIdx} className="absolute w-full h-[1px] bg-white/[0.06]" style={{ top: `${sIdx * 26}px` }} />
        ))}
        {/* Frets */}
        {Array.from({ length: 13 }, (_, fIdx) => (
          <div
            key={fIdx}
            className={cn("absolute h-[130px] w-[1px]", fIdx === 0 ? "bg-white/30" : "bg-white/[0.08]")}
            style={{ left: `${fIdx * (100 / 12)}%` }}
          >
            {[3, 5, 7, 9, 12].includes(fIdx) && (
              <div className="absolute left-1/2 -translate-x-1/2 -bottom-6 flex flex-col items-center opacity-30">
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                <span className="text-[8px] font-mono mt-0.5 font-bold text-zinc-400">{fIdx}</span>
              </div>
            )}
          </div>
        ))}
        {/* Notes */}
        {strings.map((startNote, sIdx) => {
          const openIdx = NOTES.indexOf(startNote);
          return Array.from({ length: 13 }, (_, fIdx) => {
            const note = NOTES[(openIdx + fIdx) % 12];
            const isHighlighted = scaleNotes.includes(note);
            if (!isHighlighted) return null;
            const isRoot = note === rootNote;
            const midiNumber = STRING_BASE_MIDIS[5 - sIdx] + fIdx; // reverse index so Low E is at bottom

            return (
              <button
                key={fIdx}
                onClick={() => {
                  const freq = 440 * Math.pow(2, (midiNumber - 69) / 12);
                  playNote(freq, 1.0, 0.35, "guitar");
                }}
                className="absolute group cursor-pointer transition-all duration-300 z-10 w-6.5 h-6.5 -translate-x-1/2 -translate-y-1/2 hover:scale-125 focus:outline-none"
                style={{
                  left: `${fIdx * (100 / 12)}%`,
                  top: `${sIdx * 26}px`,
                }}
                title={`${note} (Fret ${fIdx})`}
              >
                <div className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center border text-[8px] font-bold tracking-tighter transition-all",
                  isRoot
                    ? "bg-emerald-400 border-emerald-300 text-black shadow-[0_0_12px_rgba(52,211,153,0.5)]"
                    : "bg-zinc-950 border-white/10 text-zinc-300 hover:border-white/30"
                )}>
                  {note}
                </div>
              </button>
            );
          });
        })}
      </div>
    </div>
  );
};

export const RagaTheoryPage = () => {
  const [rootKey, setRootKey] = useState("C");
  const [activeThaatName, setActiveThaatName] = useState("Bilawal");
  const [converterMode, setConverterMode] = useState<"thaat" | "western">("thaat");
  const [activeWesternName, setActiveWesternName] = useState("Major (Ionian)");

  usePageMetadata({
    title: "Indian Ragas & Western Scales: The Music Theory Bridge | Guitariz",
    description: "Bridge Hindustani Classical Music Thaats and Western modes. Explore notes, swaras, and equivalents with our interactive comparative guide.",
    keywords: "raga theory, music theory bridge, thaat system, indian ragas guitar, bhairav thaat, kalyan thaat, mixolydian mix, raga equivalents in western music, hindustani scales, music scales mapping",
    canonicalUrl: "https://guitariz.studio/raga-theory",
    ogImage: "https://guitariz.studio/logo2.png",
    ogType: "website"
  });

  // Calculate matching scales based on states
  const activeThaat = useMemo(() => {
    if (converterMode === "thaat") {
      return THAATS.find(t => t.name === activeThaatName) || THAATS[0];
    } else {
      const west = WESTERN_SCALES.find(w => w.name === activeWesternName) || WESTERN_SCALES[0];
      return THAATS.find(t => t.name === west.equivalent) || THAATS[0];
    }
  }, [converterMode, activeThaatName, activeWesternName]);

  const activeWestern = useMemo(() => {
    if (converterMode === "western") {
      return WESTERN_SCALES.find(w => w.name === activeWesternName) || WESTERN_SCALES[0];
    } else {
      const thaat = THAATS.find(t => t.name === activeThaatName) || THAATS[0];
      return WESTERN_SCALES.find(w => w.equivalent === thaat.name) || WESTERN_SCALES[0];
    }
  }, [converterMode, activeThaatName, activeWesternName]);

  const scaleNotes = useMemo(() => {
    const rootIdx = NOTES.indexOf(rootKey);
    return activeThaat.intervals.map(offset => NOTES[(rootIdx + offset) % 12]);
  }, [rootKey, activeThaat]);

  // Swara array display
  const swaraList = useMemo(() => {
    return activeThaat.swaras.split(" ");
  }, [activeThaat]);

  const handleThaatSelect = (name: string) => {
    setConverterMode("thaat");
    setActiveThaatName(name);
    // Smooth scroll to converter widget
    document.getElementById("theory-converter-widget")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#020202] text-foreground font-sans relative overflow-hidden select-none pb-16">
      <main className="container mx-auto px-4 md:px-6 pt-2 md:pt-4 relative z-10 space-y-8">
        
        <Breadcrumb items={[
          { name: "Home", url: "https://guitariz.studio/" },
          { name: "Raga Theory", url: "https://guitariz.studio/raga-theory" }
        ]} />

        {/* Hero Header */}
        <div className="space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-xs font-medium tracking-wider uppercase">
            <GitCompare className="w-3.5 h-3.5" />
            <span>Cross-Cultural Synthesis</span>
          </div>

          <header className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-light tracking-tighter text-foreground font-display leading-tight">
              Hindustani Thaat System & Western Modes: <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 font-thin italic">A Comparative Guide</span>
            </h1>
            <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed font-light">
              Bridge the gap between North Indian classical scale classification (Thaats) and Western music modes. Explore note structures, map them onto visual instruments, and understand their unique characters.
            </p>
          </header>
        </div>

        {/* 1. Comparison Dashboard Table */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">The 10 Parent Thaats (Bhatkhande System)</h2>
          </div>
          <p className="text-xs text-zinc-500 max-w-2xl leading-relaxed">
            Formalized by Pandit V.N. Bhatkhande, Hindustani classical music classifies ragas into 10 parent scales (Thaats). Click any row below to load it into the interactive converter.
          </p>

          <div className="border border-white/5 rounded-2xl overflow-hidden bg-zinc-950/40 backdrop-blur-sm overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-zinc-900 text-[10px] uppercase tracking-wider text-zinc-500 font-bold bg-white/[0.01]">
                  <th className="py-4 px-5">Thaat</th>
                  <th className="py-4 px-4">Swaras</th>
                  <th className="py-4 px-4">Western Notes (in C)</th>
                  <th className="py-4 px-4">Closest Western Mode</th>
                  <th className="py-4 px-4">Key Raga Example</th>
                  <th className="py-4 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/60 font-medium">
                {THAATS.map((thaat) => {
                  const isMatch = activeThaat.name === thaat.name;
                  const isCleanMode = !thaat.mode.includes("No diatonic");
                  return (
                    <tr 
                      key={thaat.name}
                      onClick={() => handleThaatSelect(thaat.name)}
                      className={cn(
                        "hover:bg-white/[0.02] cursor-pointer transition-colors group",
                        isMatch ? "bg-emerald-500/[0.03]" : ""
                      )}
                    >
                      <td className="py-4 px-5 font-bold text-white text-sm">
                        {thaat.name}
                      </td>
                      <td className="py-4 px-4 font-mono text-zinc-300">
                        {thaat.swaras}
                      </td>
                      <td className="py-4 px-4 font-mono text-zinc-400">
                        {thaat.westernNotes.join(" ")}
                      </td>
                      <td className="py-4 px-4">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px]",
                          isCleanMode ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10" : "bg-zinc-900 text-zinc-400 border border-zinc-800"
                        )}>
                          {thaat.mode}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-zinc-400 italic font-normal">
                        {thaat.raga}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button className="text-zinc-500 group-hover:text-emerald-400 transition-colors flex items-center justify-center mx-auto gap-1">
                          <span className="text-[10px] font-semibold">Explore</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* 2. Interactive Converter Widget */}
        <section id="theory-converter-widget" className="space-y-6 pt-4 border-t border-zinc-900">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-semibold text-white">Interactive Scale Converter</h2>
              </div>
              <p className="text-xs text-zinc-500">
                Pick a root key and select scales to translate bidirectionally. Play the notes on both guitar and piano.
              </p>
            </div>

            {/* Toggle Modes */}
            <div className="flex items-center bg-zinc-950 border border-white/5 p-1 rounded-xl shrink-0 self-start md:self-auto">
              <button
                onClick={() => setConverterMode("thaat")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                  converterMode === "thaat" ? "bg-white text-black shadow-md" : "text-zinc-400 hover:text-white"
                )}
              >
                Hindustani Thaat Primary
              </button>
              <button
                onClick={() => setConverterMode("western")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                  converterMode === "western" ? "bg-white text-black shadow-md" : "text-zinc-400 hover:text-white"
                )}
              >
                Western Mode Primary
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Controls Card */}
            <div className="lg:col-span-4 bg-zinc-950/40 border border-white/5 rounded-2xl p-5 md:p-6 space-y-5">
              {/* Root Key Selector */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-zinc-550 font-bold">Root Tonic (Sa)</label>
                <div className="grid grid-cols-6 gap-1.5">
                  {NOTES.map((note) => (
                    <button
                      key={note}
                      onClick={() => setRootKey(note)}
                      className={cn(
                        "h-8 rounded-lg border text-xs font-semibold transition-all",
                        rootKey === note
                          ? "bg-emerald-400 border-emerald-300 text-black font-bold shadow-[0_0_8px_rgba(52,211,153,0.3)]"
                          : "border-white/5 bg-white/[0.01] text-zinc-400 hover:border-white/10 hover:text-zinc-200"
                      )}
                    >
                      {note}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Scale Selector */}
              {converterMode === "thaat" ? (
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-zinc-550 font-bold">Select Hindustani Thaat</label>
                  <select
                    value={activeThaatName}
                    onChange={(e) => setActiveThaatName(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/5 focus:border-white/20 rounded-xl p-3 text-xs text-white focus:outline-none transition-all font-medium"
                  >
                    {THAATS.map((t) => (
                      <option key={t.name} value={t.name}>{t.name} Thaat</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-zinc-550 font-bold">Select Western Scale / Mode</label>
                  <select
                    value={activeWesternName}
                    onChange={(e) => setActiveWesternName(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/5 focus:border-white/20 rounded-xl p-3 text-xs text-white focus:outline-none transition-all font-medium"
                  >
                    {WESTERN_SCALES.map((w) => (
                      <option key={w.name} value={w.name}>{w.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Translation Outcome Info */}
              <div className="pt-4 border-t border-zinc-900 space-y-4">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">Active Translation</span>
                  <div className="flex items-center gap-2 text-sm text-zinc-200 font-semibold">
                    <span className="text-white font-bold">{activeThaat.name} Thaat</span>
                    <span className="text-zinc-500 font-normal">maps to</span>
                    <span className="text-emerald-400 font-bold">{activeWestern.name}</span>
                  </div>
                </div>

                <div className="bg-white/[0.01] border border-white/5 p-3 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Musical Quality</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed font-light">
                    {activeThaat.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Display Card */}
            <div className="lg:col-span-8 bg-zinc-950/40 border border-white/5 rounded-2xl p-5 md:p-6 space-y-6">
              {/* Note / Swara Readout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white/[0.01] border border-white/5 p-3.5 rounded-xl space-y-1">
                  <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">Indian Swaras</span>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {swaraList.map((swara, index) => (
                      <div 
                        key={index} 
                        className="group relative px-2.5 py-1 rounded bg-zinc-900 border border-white/5 text-xs text-white font-mono"
                        title={SWARA_EXPLANATIONS[swara]}
                      >
                        {swara}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white/[0.01] border border-white/5 p-3.5 rounded-xl space-y-1">
                  <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">Western Note Names</span>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {scaleNotes.map((note, index) => (
                      <span key={index} className="px-2.5 py-1 rounded bg-zinc-900 border border-white/5 text-xs text-zinc-200 font-mono">
                        {note}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Fretboard Visualizer */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-550 font-bold">Interactive Guitar Fretboard</span>
                  <span className="text-[9px] text-zinc-600 font-mono">Tonic: {rootKey}</span>
                </div>
                <GuitarFretboard scaleNotes={scaleNotes} rootNote={rootKey} />
              </div>

              {/* Piano Keyboard Visualizer */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-550 font-bold">Interactive Piano Keyboard</span>
                  <span className="text-[9px] text-zinc-600 font-mono">2-Octave View</span>
                </div>
                <div className="border border-white/5 p-2 rounded-2xl bg-zinc-950 overflow-x-auto custom-scrollbar">
                  <PianoKeyboard
                    rootNote={rootKey}
                    scaleNotes={scaleNotes}
                    intervals={activeThaat.intervals}
                    showLabels
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Deep-Dive Guide Content */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-zinc-900">
          <div className="bg-zinc-950/20 border border-white/5 rounded-2xl p-6 space-y-4">
            <h3 className="text-md font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              What is a Thaat vs. a Raga?
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-light space-y-2">
              In Hindustani theory, a **Thaat** is a purely mathematical classification framework. It consists of exactly 7 notes in ascending order, defines no specific performance rules, and has no associated emotions or times of day. 
              <br /><br />
              A **Raga**, on the other hand, is a performable aesthetic entity. It has rules for which notes to emphasize (*Vadi* & *Samvadi*), specific note orders for ascending (*Arohana*) and descending (*Avarohana*), signature phrases (*Pakad*), emotional states (*Rasa*), and a designated time of day or season for performance.
            </p>
          </div>

          <div className="bg-zinc-950/20 border border-white/5 rounded-2xl p-6 space-y-4">
            <h3 className="text-md font-bold text-white flex items-center gap-2">
              <Music className="w-4 h-4 text-emerald-400" />
              The Note Names & Tonic Bridge
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-light space-y-2">
              In Indian Classical theory, the notes (Svara names) are: **Sa, Re, Ga, Ma, Pa, Dha, Ni**. 
              <br /><br />
              Unlike Western classical music where notes are fixed in absolute pitch (e.g. C is always ~261.63Hz), the note **Sa (Shadaj)** is a movable tonic. You can tune your root "Sa" to any key (C, D#, F#, etc.) to match your voice or instrument. All other intervals adjust relative to that chosen root pitch.
            </p>
          </div>
        </section>

        {/* 4. FAQs Accordion & Schema */}
        <SEOContent
          pageName="raga-theory"
          faqs={[
            {
              question: "What is the equivalent to the Major Scale in Indian classical music?",
              answer: "The equivalent to the Western Major Scale (or Ionian mode) is the Bilawal Thaat. It consists of all Shuddha (natural) notes: Sa, Re, Ga, Ma, Pa, Dha, Ni."
            },
            {
              question: "Does the Dorian mode map to a Thaat?",
              answer: "Yes, the Dorian mode maps exactly to the Kafi Thaat. Both scales feature a flat 3rd (Komal Gandhar) and a flat 7th (Komal Nishad) relative to the major scale structure."
            },
            {
              question: "Are all Western modes represented in the Hindustani Thaat system?",
              answer: "Six of the ten Hindustani Thaats map cleanly to Western modes: Bilawal (Ionian), Kalyan (Lydian), Khamaj (Mixolydian), Kafi (Dorian), Asavari (Aeolian), and Bhairavi (Phrygian). The remaining four Thaats (Bhairav, Todi, Poorvi, Marwa) have no diatonic equivalents in Western mode theory."
            },
            {
              question: "What is the difference between a Thaat and a Raga?",
              answer: "A Thaat is a static, 7-note parent scale framework used for classification. A Raga is a performable, expressive melodic structure defined by melodic movements (Aroha/Avaroha), note emphasis, emotional characteristics, and time associations."
            },
            {
              question: "Why is there no Locrian mode equivalent in Indian Thaats?",
              answer: "The Locrian mode features a diminished 5th (flat 5th). In Hindustani classical theory, all parent Thaats must contain a perfect 5th (Pancham / Pa) or an absolute tonic, making the Locrian structure invalid for Thaat classification."
            }
          ]}
        />

        <RelatedTools currentPath="/raga-theory" />
      </main>
    </div>
  );
};

export default RagaTheoryPage;
