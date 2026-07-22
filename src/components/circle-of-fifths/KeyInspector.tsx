import { useState } from "react";
import { Link } from "react-router-dom";
import { CircleKeyData } from "./theoryData";
import { playNote, playScale } from "./audioSynth";
import { Volume2, BookOpen, Layers, Wand2, Info, Sparkles, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface KeyInspectorProps {
  selectedKeyData: CircleKeyData | undefined;
  onSelectKeyNote: (note: string) => void;
}

export const KeyInspector = ({ selectedKeyData, onSelectKeyNote }: KeyInspectorProps) => {
  const [activeScaleTab, setActiveScaleTab] = useState<"major" | "minor">("major");

  if (!selectedKeyData) {
    return (
      <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-white/10 rounded-3xl bg-card/10">
        <Sparkles className="w-10 h-10 text-primary/40 mb-3 animate-pulse" />
        <h3 className="text-lg font-light text-foreground mb-1">Object Inspector</h3>
        <p className="text-xs text-muted-foreground max-w-xs mb-4">
          Select any key on the wheel to inspect its harmonic scale, diatonic chords, and relative minor.
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          <Link
            to="/scales"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-primary/40 text-xs text-muted-foreground hover:text-foreground transition-all"
          >
            <Layers className="w-3.5 h-3.5 text-primary" />
            <span>Open Scale Explorer</span>
          </Link>
        </div>
      </div>
    );
  }

  const diatonicRoles = [
    { degree: "I", role: "Tonic", color: "border-primary/40 bg-primary/10 text-primary" },
    { degree: "ii", role: "Predominant", color: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" },
    { degree: "iii", role: "Tonic Sub", color: "border-primary/20 bg-primary/5 text-muted-foreground" },
    { degree: "IV", role: "Subdominant", color: "border-amber-500/30 bg-amber-500/10 text-amber-300" },
    { degree: "V", role: "Dominant", color: "border-blue-500/40 bg-blue-500/10 text-blue-300" },
    { degree: "vi", role: "Relative Minor", color: "border-purple-500/40 bg-purple-500/10 text-purple-300" },
    { degree: "vii°", role: "Leading Tone", color: "border-red-500/30 bg-red-500/10 text-red-300" },
  ];

  const currentScaleName = activeScaleTab === "major" ? "Major (Ionian)" : "Natural Minor (Aeolian)";
  const currentRoot = activeScaleTab === "major" ? selectedKeyData.note : selectedKeyData.relativeMinor.replace("m", "");

  return (
    <div className="space-y-5 w-full text-foreground">
      {/* 1. Selected Key Title Card & Audio Playback */}
      <div className="p-6 rounded-3xl bg-card/60 border border-white/10 shadow-xl backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
          <BookOpen className="w-24 h-24 text-primary" />
        </div>

        <div className="flex items-center justify-between gap-4 mb-2">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-primary">
              Key Inspector
            </div>
            <h2 className="text-3xl font-light tracking-tight text-foreground flex items-center gap-3 mt-1">
              <span>{selectedKeyData.note} Major</span>
              <span className="text-sm font-normal text-muted-foreground">({selectedKeyData.relativeMinor})</span>
            </h2>
          </div>

          <button
            onClick={() => playScale(selectedKeyData.majorScale)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-lg active:scale-95 text-xs font-semibold shrink-0"
            title="Listen to Scale"
          >
            <Volume2 className="w-4 h-4 animate-bounce" />
            <span>Play Scale</span>
          </button>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed mb-4">
          {selectedKeyData.summary} {selectedKeyData.popUsage}
        </p>

        {/* SEO Internal Link CTA to Scale Explorer ONLY */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
          <Link
            to={`/scales?root=${currentRoot}&scale=${encodeURIComponent(currentScaleName)}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/30 hover:bg-primary/20 text-primary text-xs font-medium transition-all"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Explore {currentRoot} {activeScaleTab === "major" ? "Major" : "Minor"} in Scale Explorer</span>
            <ExternalLink className="w-3 h-3 opacity-70" />
          </Link>
        </div>
      </div>

      {/* 2. Scale Notes */}
      <div className="p-5 rounded-2xl bg-card/30 border border-white/5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-primary" />
            Scale Degrees
          </div>
          <div className="flex bg-white/5 p-0.5 rounded-lg border border-white/10 text-[10px]">
            <button
              onClick={() => setActiveScaleTab("major")}
              className={cn(
                "px-2.5 py-1 rounded-md transition-all",
                activeScaleTab === "major" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Major Scale
            </button>
            <button
              onClick={() => setActiveScaleTab("minor")}
              className={cn(
                "px-2.5 py-1 rounded-md transition-all",
                activeScaleTab === "minor" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Natural Minor ({selectedKeyData.relativeMinor})
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {(activeScaleTab === "major" ? selectedKeyData.majorScale : selectedKeyData.minorScale).map((note, idx) => (
            <button
              key={idx}
              onClick={() => playNote(note)}
              className="group flex flex-col items-center justify-center w-11 h-12 rounded-xl bg-card border border-white/10 hover:border-primary/50 hover:bg-primary/10 transition-all active:scale-95"
            >
              <span className="text-xs font-mono font-bold text-foreground group-hover:text-primary">{note}</span>
              <span className="text-[9px] text-muted-foreground">{idx + 1}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Primary Diatonic Chords */}
      <div className="p-5 rounded-2xl bg-card/30 border border-white/5 space-y-3">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Wand2 className="w-3.5 h-3.5 text-primary" />
          Diatonic Chords (Chords in this key)
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {selectedKeyData.diatonicChords.map((chord, i) => {
            const role = diatonicRoles[i] || { degree: "", role: "", color: "" };
            return (
              <button
                key={i}
                onClick={() => playNote(chord)}
                className="p-3 rounded-xl bg-card border border-white/5 hover:border-primary/40 transition-all text-left flex flex-col justify-between group active:scale-98"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-foreground group-hover:text-primary">{chord}</span>
                  <span className="text-[10px] font-mono text-muted-foreground">{role.degree}</span>
                </div>
                <span className={cn("text-[9px] px-1.5 py-0.5 rounded border text-center font-medium", role.color)}>
                  {role.role}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Relative Minor & Key Signature with "Why?" Live Explanation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="p-4 rounded-2xl bg-card/30 border border-white/5 space-y-1">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Relative Minor
          </div>
          <button
            onClick={() => onSelectKeyNote(selectedKeyData.relativeMinor.replace("m", ""))}
            className="text-xl font-light text-primary hover:underline"
          >
            {selectedKeyData.relativeMinor}
          </button>
          <p className="text-[11px] text-muted-foreground">Shares 100% of scale notes and accidentals.</p>
        </div>

        <div className="p-4 rounded-2xl bg-card/30 border border-white/5 space-y-1">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Key Signature
          </div>
          <div className="text-xl font-light text-foreground">
            {selectedKeyData.sharps > 0 && `${selectedKeyData.sharps} Sharp${selectedKeyData.sharps > 1 ? "s" : ""} (${selectedKeyData.keySignature.join(", ")})`}
            {selectedKeyData.flats > 0 && `${selectedKeyData.flats} Flat${selectedKeyData.flats > 1 ? "s" : ""} (${selectedKeyData.keySignature.join(", ")})`}
            {selectedKeyData.sharps === 0 && selectedKeyData.flats === 0 && "Natural (0 Accidentals)"}
          </div>
          <div className="text-[10px] text-emerald-400 font-mono mt-1 flex items-start gap-1">
            <Info className="w-3 h-3 shrink-0 mt-0.5" />
            <span>{selectedKeyData.keySigExplanation}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
