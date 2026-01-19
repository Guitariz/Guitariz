import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Music, Scale, Hash, Music2, Activity, Info, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const CIRCLE_KEYS = [
  { note: "C", position: 0, sharps: 0, flats: 0, relativeMinor: "Am", keySignature: [], majorScale: ["C", "D", "E", "F", "G", "A", "B"], minorScale: ["A", "B", "C", "D", "E", "F", "G"], diatonicChords: ["C", "Dm", "Em", "F", "G", "Am", "Bdim"], parallelKey: "Cm", dominantKey: "G", subdominantKey: "F" },
  { note: "G", position: 1, sharps: 1, flats: 0, relativeMinor: "Em", keySignature: ["F#"], majorScale: ["G", "A", "B", "C", "D", "E", "F#"], minorScale: ["E", "F#", "G", "A", "B", "C", "D"], diatonicChords: ["G", "Am", "Bm", "C", "D", "Em", "F#dim"], parallelKey: "Gm", dominantKey: "D", subdominantKey: "C" },
  { note: "D", position: 2, sharps: 2, flats: 0, relativeMinor: "Bm", keySignature: ["F#", "C#"], majorScale: ["D", "E", "F#", "G", "A", "B", "C#"], minorScale: ["B", "C#", "D", "E", "F#", "G", "A"], diatonicChords: ["D", "Em", "F#m", "G", "A", "Bm", "C#dim"], parallelKey: "Dm", dominantKey: "A", subdominantKey: "G" },
  { note: "A", position: 3, sharps: 3, flats: 0, relativeMinor: "F#m", keySignature: ["F#", "C#", "G#"], majorScale: ["A", "B", "C#", "D", "E", "F#", "G#"], minorScale: ["F#", "G#", "A", "B", "C#", "D", "E"], diatonicChords: ["A", "Bm", "C#m", "D", "E", "F#m", "G#dim"], parallelKey: "Am", dominantKey: "E", subdominantKey: "D" },
  { note: "E", position: 4, sharps: 4, flats: 0, relativeMinor: "C#m", keySignature: ["F#", "C#", "G#", "D#"], majorScale: ["E", "F#", "G#", "A", "B", "C#", "D#"], minorScale: ["C#", "D#", "E", "F#", "G#", "A", "B"], diatonicChords: ["E", "F#m", "G#m", "A", "B", "C#m", "D#dim"], parallelKey: "Em", dominantKey: "B", subdominantKey: "A" },
  { note: "B", position: 5, sharps: 5, flats: 0, relativeMinor: "G#m", keySignature: ["F#", "C#", "G#", "D#", "A#"], majorScale: ["B", "C#", "D#", "E", "F#", "G#", "A#"], minorScale: ["G#", "A#", "B", "C#", "D#", "E", "F#"], diatonicChords: ["B", "C#m", "D#m", "E", "F#", "G#m", "A#dim"], parallelKey: "Bm", dominantKey: "F#/Gb", subdominantKey: "E" },
  { note: "F#", position: 6, sharps: 6, flats: 0, relativeMinor: "D#m", keySignature: ["F#", "C#", "G#", "D#", "A#", "E#"], majorScale: ["F#", "G#", "A#", "B", "C#", "D#", "E#"], minorScale: ["D#", "E#", "F#", "G#", "A#", "B", "C#"], diatonicChords: ["F#", "G#m", "A#m", "B", "C#", "D#m", "E#dim"], parallelKey: "F#m", dominantKey: "C#", subdominantKey: "B" },
  { note: "Db", position: 7, sharps: 0, flats: 5, relativeMinor: "Bbm", keySignature: ["Bb", "Eb", "Ab", "Db", "Gb"], majorScale: ["Db", "Eb", "F", "Gb", "Ab", "Bb", "C"], minorScale: ["Bb", "C", "Db", "Eb", "F", "Gb", "Ab"], diatonicChords: ["Db", "Ebm", "Fm", "Gb", "Ab", "Bbm", "Cdim"], parallelKey: "Dbm", dominantKey: "Ab", subdominantKey: "Gb" },
  { note: "Ab", position: 8, sharps: 0, flats: 4, relativeMinor: "Fm", keySignature: ["Bb", "Eb", "Ab", "Db"], majorScale: ["Ab", "Bb", "C", "Db", "Eb", "F", "G"], minorScale: ["F", "G", "Ab", "Bb", "C", "Db", "Eb"], diatonicChords: ["Ab", "Bbm", "Cm", "Db", "Eb", "Fm", "Gdim"], parallelKey: "Abm", dominantKey: "Eb", subdominantKey: "Db" },
  { note: "Eb", position: 9, sharps: 0, flats: 3, relativeMinor: "Cm", keySignature: ["Bb", "Eb", "Ab"], majorScale: ["Eb", "F", "G", "Ab", "Bb", "C", "D"], minorScale: ["C", "D", "Eb", "F", "G", "Ab", "Bb"], diatonicChords: ["Eb", "Fm", "Gm", "Ab", "Bb", "Cm", "Ddim"], parallelKey: "Ebm", dominantKey: "Bb", subdominantKey: "Ab" },
  { note: "Bb", position: 10, sharps: 0, flats: 2, relativeMinor: "Gm", keySignature: ["Bb", "Eb"], majorScale: ["Bb", "C", "D", "Eb", "F", "G", "A"], minorScale: ["G", "A", "Bb", "C", "D", "Eb", "F"], diatonicChords: ["Bb", "Cm", "Dm", "Eb", "F", "Gm", "Adim"], parallelKey: "Bbm", dominantKey: "F", subdominantKey: "Eb" },
  { note: "F", position: 11, sharps: 0, flats: 1, relativeMinor: "Dm", keySignature: ["Bb"], majorScale: ["F", "G", "A", "Bb", "C", "D", "E"], minorScale: ["D", "E", "F", "G", "A", "Bb", "C"], diatonicChords: ["F", "Gm", "Am", "Bb", "C", "Dm", "Edim"], parallelKey: "Fm", dominantKey: "C", subdominantKey: "Bb" },
];

const CircleOfFifths = () => {
  const [selectedKey, setSelectedKey] = useState<string | null>("C");
  const [activeTab, setActiveTab] = useState("overview");

  const selectedKeyData = useMemo(() => {
    return CIRCLE_KEYS.find(key => key.note === selectedKey);
  }, [selectedKey]);

  const commonProgressions = useMemo(() => {
    if (!selectedKeyData) return [];
    const chords = selectedKeyData.diatonicChords;
    return [
      { name: "I-IV-V-I", chords: [chords[0], chords[3], chords[4], chords[0]], desc: "Classical resolution" },
      { name: "ii-V-I", chords: [chords[1], chords[4], chords[0]], desc: "Jazz standard" },
      { name: "I-vi-IV-V", chords: [chords[0], chords[5], chords[3], chords[4]], desc: "Pop foundation" },
      { name: "vi-IV-I-V", chords: [chords[5], chords[3], chords[0], chords[4]], desc: "Sentimental loop" }
    ];
  }, [selectedKeyData]);

  return (
    <div className="w-full">
      <div className="grid lg:grid-cols-12 gap-12">
        {/* Circle Visualization */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="relative aspect-square max-w-[500px] mx-auto w-full group">
            {/* Architectural Grid */}
            <div className="absolute inset-0 rounded-full border border-white/5 pointer-events-none" />
            <div className="absolute inset-[15%] rounded-full border border-white/5 pointer-events-none" />
            
            {/* Center Display */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div 
                className="w-32 h-32 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-xl flex flex-col items-center justify-center transition-all cursor-pointer hover:bg-white/[0.08]"
                onClick={() => setSelectedKey(null)}
              >
                <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">Root</div>
                <div className="text-3xl font-light text-white tracking-tighter tabular-nums">
                  {selectedKey || "Select"}
                </div>
              </div>
            </div>

            {/* Key Segments */}
            {CIRCLE_KEYS.map((k) => {
              const angle = (k.position * 30 - 90) * (Math.PI / 180);
              const radius = 42;
              const x = 50 + radius * Math.cos(angle);
              const y = 50 + radius * Math.sin(angle);
              const isActive = selectedKey === k.note;

              return (
                <button
                  key={k.note}
                  className="absolute"
                  style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
                  onClick={() => setSelectedKey(k.note)}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex flex-col items-center justify-center transition-all duration-300",
                    isActive 
                      ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)] scale-110" 
                      : "bg-white/[0.02] border border-white/5 text-muted-foreground hover:border-white/20 hover:text-white"
                  )}>
                    <span className="text-sm font-medium">{k.note}</span>
                    {k.sharps > 0 && <span className="text-[8px] opacity-60">{k.sharps}</span>}
                    {k.flats > 0 && <span className="text-[8px] opacity-60">{k.flats}</span>}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Guidelines */}
          <div className="mt-12 p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              <Info className="w-3 h-3" />
              Harmonic Navigation
            </div>
            <div className="grid grid-cols-2 gap-4 text-[11px] text-muted-foreground leading-relaxed">
              <p> Clockwise rotation adds sharps, moving toward dominant keys.</p>
              <p> Counter-clockwise rotation adds flats, moving toward subdominant keys.</p>
            </div>
          </div>
        </div>

        {/* Detailed Information Sidebar */}
        <div className="lg:col-span-5 space-y-8">
          {selectedKeyData ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="flex bg-white/[0.02] border border-white/5 p-1 rounded-xl mb-6">
                {[
                  { id: "overview", icon: Music },
                  { id: "scales", icon: Scale },
                  { id: "chords", icon: Hash },
                  { id: "progress", icon: Music2 }
                ].map(({ id, icon: Icon }) => (
                  <TabsTrigger 
                    key={id} 
                    value={id} 
                    className="flex-1 py-2 rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white text-muted-foreground transition-all"
                  >
                    <Icon className="w-4 h-4" />
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="overview" className="mt-0 space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Parallel Minor</div>
                    <div className="text-lg font-light text-white">{selectedKeyData.relativeMinor}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Key Type</div>
                    <div className="text-lg font-light text-white">Major</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1">Functional Keys</div>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { l: "Dominant", v: selectedKeyData.dominantKey },
                      { l: "Subdominant", v: selectedKeyData.subdominantKey },
                      { l: "Parallel", v: selectedKeyData.parallelKey }
                    ].map(item => (
                      <div key={item.l} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.01] border border-white/5">
                        <span className="text-xs text-muted-foreground">{item.l}</span>
                        <span className="text-sm text-white font-medium">{item.v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="scales" className="mt-0 space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <div className="space-y-6">
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 px-1">Major Scale</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedKeyData.majorScale.map((n, i) => (
                        <div key={i} className="w-10 h-10 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-sm font-mono text-white">
                          {n}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 px-1">Natural Minor</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedKeyData.minorScale.map((n, i) => (
                        <div key={i} className="w-10 h-10 rounded-lg border border-white/5 bg-white/[0.02] flex items-center justify-center text-sm font-mono text-muted-foreground">
                          {n}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="chords" className="mt-0 animate-in fade-in slide-in-from-bottom-2">
                <div className="grid grid-cols-2 gap-3">
                  {selectedKeyData.diatonicChords.map((chord, index) => {
                    const deg = ["I", "ii", "iii", "IV", "V", "vi", "vii"];
                    return (
                      <div key={index} className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                        <span className="text-sm font-mono text-white">{chord}</span>
                        <span className="text-[10px] text-muted-foreground font-semibold">{deg[index]}</span>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="progress" className="mt-0 space-y-4 animate-in fade-in slide-in-from-bottom-2">
                {commonProgressions.map((p, i) => (
                  <div key={i} className="p-5 rounded-xl border border-white/5 bg-white/[0.02] group hover:bg-white/[0.04] transition-all">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold text-white tracking-widest uppercase">{p.name}</span>
                      <span className="text-[10px] text-muted-foreground">{p.desc}</span>
                    </div>
                    <div className="flex gap-2">
                      {p.chords.map((c, ci) => (
                        <div key={ci} className="px-3 py-1 rounded bg-white/10 text-[11px] font-mono text-white">
                          {c}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-white/5 rounded-[2rem]">
              <Sparkles className="w-8 h-8 text-muted-foreground mb-4 opacity-20" />
              <h4 className="text-white font-medium mb-1">Select a Key</h4>
              <p className="text-xs text-muted-foreground">Choose a root on the circle to explore its harmonic signature.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CircleOfFifths;
