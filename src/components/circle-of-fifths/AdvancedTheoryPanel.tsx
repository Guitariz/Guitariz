import { useState } from "react";
import { Link } from "react-router-dom";
import { CircleKeyData } from "./theoryData";
import { playNote, playScale } from "./audioSynth";
import { Sparkles, Wand2, Compass, Layers, Volume2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdvancedTheoryPanelProps {
  selectedKeyData: CircleKeyData | undefined;
  onSelectKeyNote: (note: string) => void;
}

export const AdvancedTheoryPanel = ({
  selectedKeyData,
  onSelectKeyNote,
}: AdvancedTheoryPanelProps) => {
  const [activeModeIdx, setActiveModeIdx] = useState(0);

  if (!selectedKeyData) {
    return (
      <div className="w-full mt-10 p-8 rounded-3xl bg-card/20 border-2 border-dashed border-white/10 text-center space-y-2">
        <Sparkles className="w-8 h-8 text-primary/40 mx-auto animate-pulse" />
        <h3 className="text-base font-semibold text-foreground">Advanced Theory Lab</h3>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">
          Select any root key on the wheel above to unlock Modal Interchange (Borrowed Chords), Secondary Dominant setup moves, Key Modulations, and 7 Diatonic Modes.
        </p>
      </div>
    );
  }

  const majorScale = selectedKeyData.majorScale;
  const minorScale = selectedKeyData.minorScale;

  // Compute 7 diatonic modes for selected key
  const modes = [
    { name: "Ionian", degree: "1st", mood: "Bright, triumphant (Major)", formula: "W-W-H-W-W-W-H", scaleName: "Major (Ionian)", scale: majorScale },
    { name: "Dorian", degree: "2nd", mood: "Jazzy minor with bright 6th", formula: "W-H-W-W-W-H-W", scaleName: "Dorian", scale: [majorScale[1], majorScale[2], majorScale[3], majorScale[4], majorScale[5], majorScale[6], majorScale[0]] },
    { name: "Phrygian", degree: "3rd", mood: "Dark, Spanish/Flamenco flavor (b2)", formula: "H-W-W-W-H-W-W", scaleName: "Phrygian", scale: [majorScale[2], majorScale[3], majorScale[4], majorScale[5], majorScale[6], majorScale[0], majorScale[1]] },
    { name: "Lydian", degree: "4th", mood: "Dreamy, mystical raised 4th (#4)", formula: "W-W-W-H-W-W-H", scaleName: "Lydian", scale: [majorScale[3], majorScale[4], majorScale[5], majorScale[6], majorScale[0], majorScale[1], majorScale[2]] },
    { name: "Mixolydian", degree: "5th", mood: "Bluesy rock, dominant flat 7th (b7)", formula: "W-W-H-W-W-H-W", scaleName: "Mixolydian", scale: [majorScale[4], majorScale[5], majorScale[6], majorScale[0], majorScale[1], majorScale[2], majorScale[3]] },
    { name: "Aeolian", degree: "6th", mood: "Emotional, melancholic (Natural Minor)", formula: "W-H-W-W-H-W-W", scaleName: "Natural Minor (Aeolian)", scale: minorScale },
    { name: "Locrian", degree: "7th", mood: "Tense, diminished 5th (b5)", formula: "H-W-W-H-W-W-W", scaleName: "Locrian", scale: [majorScale[6], majorScale[0], majorScale[1], majorScale[2], majorScale[3], majorScale[4], majorScale[5]] },
  ];

  const currentMode = modes[activeModeIdx];

  const borrowedChords = [
    { name: `iv (${minorScale[3]}m)`, role: "Minor Subdominant", use: "Borrow from parallel minor for sad, dramatic resolution to I.", example: `I – iv – V – I (${selectedKeyData.note} – ${minorScale[3]}m – ${selectedKeyData.diatonicChords[4]} – ${selectedKeyData.note})` },
    { name: `bVII (${minorScale[6]})`, role: "Backdoor Flat VII", use: "Classic rock & pop cadence chord (Mixolydian flavor).", example: `I – bVII – IV – I (${selectedKeyData.note} – ${minorScale[6]} – ${selectedKeyData.diatonicChords[3]} – ${selectedKeyData.note})` },
    { name: `bVI (${minorScale[5]})`, role: "Flat VI Lift", use: "Cinematic lift; pairs brilliantly with bVII and V.", example: `I – bVI – bVII – I` },
    { name: `ii° (${minorScale[1]}dim)`, role: "Diminished Predominant", use: "Dark pre-dominant leading into the dominant V chord.", example: `ii° – V – I` },
  ];

  const secondaryDominants = [
    { name: "V / ii", target: selectedKeyData.diatonicChords[1], hint: "Setup chord to intensify motion towards ii." },
    { name: "V / iii", target: selectedKeyData.diatonicChords[2], hint: "Leads smoothly into iii chord." },
    { name: "V / IV", target: selectedKeyData.diatonicChords[3], hint: "Creates strong movement to the subdominant IV." },
    { name: "V / V", target: selectedKeyData.diatonicChords[4], hint: "Dominant of the dominant (very common in pop/jazz)." },
    { name: "V / vi", target: selectedKeyData.diatonicChords[5], hint: "Leads directly into relative minor vi." },
  ];

  return (
    <div className="w-full mt-10 space-y-6 pt-8 border-t border-white/10">
      {/* Section Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Harmonic Intelligence</span>
          </div>
          <h2 className="text-2xl font-light tracking-tight text-foreground mt-1">
            Advanced Theory Lab: <span className="text-primary font-medium">{selectedKeyData.note} Major</span>
          </h2>
        </div>
        <div className="text-xs text-muted-foreground">
          Modal Interchange • Secondary Dominants • Pivot Modulations
        </div>
      </div>

      {/* 3-Column Studio Dashboard Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column 1: Borrowed Chords (Modal Interchange) */}
        <div className="p-5 rounded-3xl bg-card/50 border border-white/10 shadow-lg space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
            <Wand2 className="w-4 h-4" />
            <span>Modal Interchange (Borrowed Chords)</span>
          </div>

          <div className="space-y-3">
            {borrowedChords.map((b, idx) => (
              <div key={idx} className="p-3 rounded-2xl bg-card border border-white/5 space-y-1 text-xs hover:border-primary/40 transition-all">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">{b.name}</span>
                  <span className="text-[10px] text-primary/80 font-medium px-2 py-0.5 rounded bg-primary/10 border border-primary/20">{b.role}</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{b.use}</p>
                <div className="text-[10px] font-mono text-foreground/90 bg-white/5 px-2 py-1 rounded border border-white/10 mt-1">
                  {b.example}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: Secondary Dominants (Setup Moves) */}
        <div className="p-5 rounded-3xl bg-card/50 border border-white/10 shadow-lg space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-400">
            <Compass className="w-4 h-4" />
            <span>Secondary Dominants (Setup Moves)</span>
          </div>

          <div className="space-y-2.5">
            {secondaryDominants.map((s, idx) => (
              <div key={idx} className="p-3 rounded-2xl bg-card border border-white/5 flex items-center justify-between text-xs hover:border-emerald-500/40 transition-all">
                <div>
                  <div className="font-bold text-foreground">{s.name}</div>
                  <div className="text-[10px] text-muted-foreground">{s.hint}</div>
                </div>
                <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-xl text-emerald-300 font-mono font-bold">
                  <span>→</span>
                  <span>{s.target}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: Pivot Modulations (Changing Keys) */}
        <div className="p-5 rounded-3xl bg-card/50 border border-white/10 shadow-lg space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400">
            <Layers className="w-4 h-4" />
            <span>Key Modulations (Pivot Paths)</span>
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded-2xl bg-card border border-white/5 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">Clockwise (+5th): {selectedKeyData.dominantKey}</span>
                <button
                  onClick={() => onSelectKeyNote(selectedKeyData.dominantKey)}
                  className="text-[10px] px-2 py-0.5 rounded bg-primary/20 text-primary font-semibold hover:bg-primary/30"
                >
                  Jump →
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">Shares 6 out of 7 notes. Easiest modulation path.</p>
            </div>

            <div className="p-3 rounded-2xl bg-card border border-white/5 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">Counter (+4th): {selectedKeyData.subdominantKey}</span>
                <button
                  onClick={() => onSelectKeyNote(selectedKeyData.subdominantKey)}
                  className="text-[10px] px-2 py-0.5 rounded bg-primary/20 text-primary font-semibold hover:bg-primary/30"
                >
                  Jump →
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">Warmer modulation, common in pop song choruses.</p>
            </div>

            <div className="p-3 rounded-2xl bg-card border border-white/5 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">Relative Minor: {selectedKeyData.relativeMinor}</span>
                <button
                  onClick={() => onSelectKeyNote(selectedKeyData.relativeMinor.replace("m", ""))}
                  className="text-[10px] px-2 py-0.5 rounded bg-primary/20 text-primary font-semibold hover:bg-primary/30"
                >
                  Jump →
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">Same key signature, shifts tonal center to emotional minor.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Full Horizontal 7 Modes Interactive Dashboard */}
      <div className="p-6 rounded-3xl bg-card/60 border border-white/10 shadow-xl backdrop-blur-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>7 Diatonic Modes of {selectedKeyData.note} Major</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Every mode uses the exact notes of {selectedKeyData.note} Major but starts on a different scale degree.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => playScale(currentMode.scale)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow shrink-0"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Play Audio</span>
            </button>

            <Link
              to={`/scales?root=${selectedKeyData.note}&scale=${encodeURIComponent(currentMode.scaleName)}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-foreground text-xs font-medium hover:bg-white/20 transition-all"
            >
              <Layers className="w-3.5 h-3.5 text-primary" />
              <span>Explore {selectedKeyData.note} {currentMode.name} in Scale Explorer</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </Link>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {modes.map((m, idx) => (
            <button
              key={idx}
              onClick={() => setActiveModeIdx(idx)}
              className={cn(
                "p-3 rounded-2xl border text-left transition-all flex flex-col justify-between",
                activeModeIdx === idx
                  ? "bg-primary text-primary-foreground border-primary shadow-lg scale-102"
                  : "bg-card border-white/5 text-foreground hover:border-primary/40 hover:bg-card/80"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">{m.name}</span>
                <span className="text-[9px] opacity-70">{m.degree}</span>
              </div>
              <div className="text-[10px] opacity-80 mt-1 truncate">{m.mood}</div>
            </button>
          ))}
        </div>

        {/* Selected Mode Detail Banner */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-primary flex items-center gap-2">
              <span>{selectedKeyData.note} {currentMode.name} ({currentMode.degree} Mode)</span>
              <span className="text-[10px] text-muted-foreground font-mono">[{currentMode.formula}]</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{currentMode.mood}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {currentMode.scale.map((note, i) => (
              <button
                key={i}
                onClick={() => playNote(note)}
                className="w-9 h-9 rounded-xl bg-card border border-white/10 text-xs font-mono font-bold text-foreground flex items-center justify-center hover:border-primary hover:text-primary transition-all active:scale-95"
              >
                {note}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
