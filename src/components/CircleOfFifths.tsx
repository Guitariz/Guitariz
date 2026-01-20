import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Info, Music, Music2, Scale, Sparkles, Wand2 } from "lucide-react";
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
  const [showRelativeMinor, setShowRelativeMinor] = useState(false);
  const [borrowedMode, setBorrowedMode] = useState<"minor" | "mixolydian">("minor");

  const selectedKeyData = useMemo(() => {
    return CIRCLE_KEYS.find((key) => key.note === selectedKey);
  }, [selectedKey]);

  const selectedPosition = selectedKeyData?.position ?? 0;

  const getKeyByPosition = useMemo(() => {
    return (pos: number) => {
      const wrapped = ((pos % 12) + 12) % 12;
      return CIRCLE_KEYS.find((k) => k.position === wrapped);
    };
  }, []);

  const neighbors = useMemo(() => {
    return {
      clockwise: getKeyByPosition(selectedPosition + 1),
      counterClockwise: getKeyByPosition(selectedPosition - 1),
      opposite: getKeyByPosition(selectedPosition + 6),
    };
  }, [getKeyByPosition, selectedPosition]);

  const diatonicFunctions = useMemo(() => {
    if (!selectedKeyData) return null;

    const roman = ["I", "ii", "iii", "IV", "V", "vi", "vii°"] as const;
    const funcs = [
      "Tonic",
      "Predominant",
      "Tonic",
      "Predominant",
      "Dominant",
      "Tonic",
      "Dominant",
    ] as const;

    return selectedKeyData.diatonicChords.map((ch, i) => ({
      degree: roman[i],
      chord: ch,
      func: funcs[i],
    }));
  }, [selectedKeyData]);

  const quickModulations = useMemo(() => {
    if (!selectedKeyData) return [];

    const tonic = selectedKeyData.diatonicChords[0];
    const ii = selectedKeyData.diatonicChords[1];
    const V = selectedKeyData.diatonicChords[4];

    const cw = neighbors.clockwise;
    const ccw = neighbors.counterClockwise;

    const toCard = (target: typeof CIRCLE_KEYS[number] | undefined, label: string) => {
      if (!target) return null;
      const pivotCandidates = new Set<string>([
        selectedKeyData.diatonicChords[0],
        selectedKeyData.diatonicChords[3],
        selectedKeyData.diatonicChords[5],
        target.diatonicChords[0],
        target.diatonicChords[3],
        target.diatonicChords[5],
      ]);

      const pivot = [...pivotCandidates].find((c) =>
        selectedKeyData.diatonicChords.includes(c) && target.diatonicChords.includes(c)
      );

      return {
        label,
        target: target.note,
        desc: "Closest key on the wheel (shares 6/7 notes)",
        pivot: pivot ?? "(no obvious pivot)",
        example: [tonic, ii, V, pivot ?? tonic, target.diatonicChords[4], target.diatonicChords[0]].filter(Boolean),
      };
    };

    return [
      toCard(cw, "Clockwise (+5th)"),
      toCard(ccw, "Counter-clockwise (+4th)"),
      {
        label: "Relative minor",
        target: selectedKeyData.relativeMinor.replace("m", ""),
        desc: "Same key signature, new tonal center",
        pivot: selectedKeyData.diatonicChords[5],
        example: [tonic, selectedKeyData.diatonicChords[5], selectedKeyData.diatonicChords[1], selectedKeyData.diatonicChords[4], tonic],
      },
    ].filter(Boolean) as Array<{
      label: string;
      target: string;
      desc: string;
      pivot: string;
      example: string[];
    }>;
  }, [neighbors.clockwise, neighbors.counterClockwise, selectedKeyData]);

  const appliedChords = useMemo(() => {
    if (!selectedKeyData) return [];

    const chordAt = (degreeIndex: number) => selectedKeyData.diatonicChords[degreeIndex];
    const degNames = ["I", "ii", "iii", "IV", "V", "vi"];

    // V/ii, V/iii, V/IV, V/V, V/vi are common in major.
    const targets = [1, 2, 3, 4, 5];

    return targets.map((idx) => ({
      name: `V/${degNames[idx]}`,
      resolvesTo: chordAt(idx),
      hint: "Use the dominant of the target chord to intensify motion.",
    }));
  }, [selectedKeyData]);

  const borrowedChords = useMemo(() => {
    if (!selectedKeyData) return [];

    // Keep this useful but not overly theoretical: common modal interchange in major.
    // We don’t attempt full enharmonic spelling; we present functional targets.
    if (borrowedMode === "minor") {
      return [
        { name: "iv", use: "Adds melancholy; great pre-dominant", example: "I – iv – V – I" },
        { name: "bVII", use: "Rock/folk color; backdoor dominant flavor", example: "I – bVII – IV – I" },
        { name: "bVI", use: "Cinematic lift; pairs well with bVII", example: "I – bVI – bVII – I" },
        { name: "ii° (or iiø7)", use: "Dark predominant to V", example: "ii° – V – I" },
      ];
    }

    // Mixolydian flavor: bVII is the classic move.
    return [
      { name: "bVII", use: "Mixolydian/rock cadence", example: "I – bVII – IV" },
      { name: "v", use: "Soft dominant without leading tone", example: "IV – v – I" },
      { name: "bIII", use: "Bright modal shift; common in pop", example: "I – bIII – IV" },
    ];
  }, [borrowedMode, selectedKeyData]);

  const commonProgressions = useMemo(() => {
    if (!selectedKeyData) return [];
    const chords = selectedKeyData.diatonicChords;
    return [
      { name: "I-IV-V-I", chords: [chords[0], chords[3], chords[4], chords[0]], desc: "Classical resolution", examples: "Rock, Pop, Blues" },
      { name: "ii-V-I", chords: [chords[1], chords[4], chords[0]], desc: "Jazz standard", examples: "Jazz, Bebop" },
      { name: "I-vi-IV-V", chords: [chords[0], chords[5], chords[3], chords[4]], desc: "Pop foundation", examples: "50s Pop, Doo-wop" },
      { name: "vi-IV-I-V", chords: [chords[5], chords[3], chords[0], chords[4]], desc: "Sentimental loop", examples: "Modern Pop" },
      { name: "I-V-vi-IV", chords: [chords[0], chords[4], chords[5], chords[3]], desc: "Axis progression", examples: "Let It Be, With Or Without You" }
    ];
  }, [selectedKeyData]);
  
  const getRelatedKeys = useMemo(() => {
    if (!selectedKeyData) return [];
    return {
      dominant: CIRCLE_KEYS.find((k) => k.note === selectedKeyData.dominantKey),
      subdominant: CIRCLE_KEYS.find((k) => k.note === selectedKeyData.subdominantKey),
      relative: CIRCLE_KEYS.find(
        (k) => k.relativeMinor === selectedKeyData.relativeMinor || k.note === selectedKeyData.relativeMinor
      ),
      parallel: CIRCLE_KEYS.find((k) => k.note === selectedKeyData.parallelKey),
    };
  }, [selectedKeyData]);

  return (
    <div className="w-full">
      <div className="grid lg:grid-cols-12 gap-12">
        {/* Circle Visualization */}
        <div className="lg:col-span-7 flex flex-col">
          {/* Toggle for showing relative minors */}
          <div className="mb-6 flex items-center justify-between">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Circle of Fifths
            </div>
            <button 
              onClick={() => setShowRelativeMinor(!showRelativeMinor)}
              className="text-xs text-muted-foreground hover:text-white transition-colors flex items-center gap-2"
            >
              <div className={cn(
                "w-8 h-4 rounded-full transition-colors relative",
                showRelativeMinor ? "bg-white/20" : "bg-white/5"
              )}>
                <div className={cn(
                  "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all",
                  showRelativeMinor ? "left-4" : "left-0.5"
                )} />
              </div>
              Show Minor Keys
            </button>
          </div>
          
          <div className="relative aspect-square max-w-[520px] mx-auto w-full group">
            {/* Architectural Grid with labels */}
            <div className="absolute inset-0 rounded-full border-2 border-white/10 pointer-events-none" />
            <div className="absolute inset-[20%] rounded-full border border-white/5 pointer-events-none" />
            
            {/* Circle labels */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground uppercase tracking-widest">
              Sharps →
            </div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground uppercase tracking-widest">
              ← Flats
            </div>
            
            {/* Center Display with key signature info */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div 
                className="w-36 h-36 rounded-full bg-white/[0.04] border-2 border-white/10 backdrop-blur-xl flex flex-col items-center justify-center transition-all cursor-pointer hover:bg-white/[0.08]"
                onClick={() => setSelectedKey(null)}
              >
                <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">Selected Key</div>
                <div className="text-4xl font-light text-white tracking-tighter tabular-nums mb-1">
                  {selectedKey || "—"}
                </div>
                {selectedKeyData && (
                  <div className="text-[9px] text-muted-foreground">
                    {selectedKeyData.sharps > 0 && `${selectedKeyData.sharps}♯`}
                    {selectedKeyData.flats > 0 && `${selectedKeyData.flats}♭`}
                    {selectedKeyData.sharps === 0 && selectedKeyData.flats === 0 && "Natural"}
                  </div>
                )}
              </div>
            </div>

            {/* Key Segments with relationships highlighted */}
            {CIRCLE_KEYS.map((k) => {
              const angle = (k.position * 30 - 90) * (Math.PI / 180);
              const radius = 42;
              const x = 50 + radius * Math.cos(angle);
              const y = 50 + radius * Math.sin(angle);
              const isActive = selectedKey === k.note;
              const isDominant = selectedKeyData?.dominantKey === k.note;
              const isSubdominant = selectedKeyData?.subdominantKey === k.note;
              const isRelated = isDominant || isSubdominant;

              return (
                <button
                  key={k.note}
                  className="absolute group/key"
                  style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
                  onClick={() => setSelectedKey(k.note)}
                >
                  <div className={cn(
                    "w-14 h-14 rounded-xl flex flex-col items-center justify-center transition-all duration-300 relative",
                    isActive 
                      ? "bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.3)] scale-125 z-10" 
                      : isRelated
                      ? "bg-blue-500/20 border-2 border-blue-400/40 text-white hover:border-blue-300 scale-105"
                      : "bg-white/[0.02] border border-white/5 text-muted-foreground hover:border-white/20 hover:text-white hover:scale-110"
                  )}>
                    <span className="text-base font-semibold">{k.note}</span>
                    {showRelativeMinor && (
                      <span className="text-[9px] opacity-70">{k.relativeMinor}</span>
                    )}
                    {!showRelativeMinor && (k.sharps > 0 || k.flats > 0) && (
                      <span className="text-[8px] opacity-60">
                        {k.sharps > 0 ? `${k.sharps}♯` : `${k.flats}♭`}
                      </span>
                    )}
                  </div>
                  {isActive && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] text-white bg-black/80 px-2 py-1 rounded opacity-0 group-hover/key:opacity-100 transition-opacity">
                      Click others to see relationships
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Guidelines */}
          <div className="mt-12 p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-6">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              <Info className="w-3 h-3" />
              Quick Guide
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-white"></div>
                  <span className="text-xs text-muted-foreground">Selected Key</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full border-2 border-blue-400/40 bg-blue-500/20"></div>
                  <span className="text-xs text-muted-foreground">Related Keys (Dom/Sub)</span>
                </div>
              </div>
              <div className="space-y-2 text-[11px] text-muted-foreground leading-relaxed">
                <p>• Move clockwise (+5th) to add sharps</p>
                <p>• Move counter-clockwise (+4th) to add flats</p>
                <p>• Adjacent keys share 6 out of 7 notes</p>
              </div>
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
                  { id: "harmony", icon: Wand2 },
                  { id: "progress", icon: Music2 },
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
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Relative Minor</div>
                    <div className="text-lg font-light text-white">{selectedKeyData.relativeMinor}</div>
                    <div className="text-[11px] text-muted-foreground mt-1">Same key signature</div>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Key Signature</div>
                    <div className="text-lg font-light text-white">
                      {selectedKeyData.sharps > 0 && `${selectedKeyData.sharps}♯`}
                      {selectedKeyData.flats > 0 && `${selectedKeyData.flats}♭`}
                      {selectedKeyData.sharps === 0 && selectedKeyData.flats === 0 && "Natural"}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1">
                      {selectedKeyData.keySignature.length ? selectedKeyData.keySignature.join(" ") : "No accidentals"}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[ 
                    { label: "Clockwise", value: neighbors.clockwise?.note ?? "—", hint: "+5th (adds sharps)" },
                    { label: "Counter", value: neighbors.counterClockwise?.note ?? "—", hint: "+4th (adds flats)" },
                    { label: "Opposite", value: neighbors.opposite?.note ?? "—", hint: "tritone away" },
                  ].map((x) => (
                    <div key={x.label} className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{x.label}</div>
                      <div className="text-lg font-light text-white">{x.value}</div>
                      <div className="text-[11px] text-muted-foreground mt-1">{x.hint}</div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1">Key Relationships</div>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { l: "Next key (brighter)", v: selectedKeyData.dominantKey },
                      { l: "Next key (warmer)", v: selectedKeyData.subdominantKey },
                      { l: "Same note, different mood", v: selectedKeyData.parallelKey },
                    ].map((item) => (
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

              <TabsContent value="harmony" className="mt-0 space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1">
                    Chords that "belong" in this key
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {(diatonicFunctions ?? []).map((row, index) => (
                      <div
                        key={index}
                        className="flex flex-col gap-2 p-3 rounded-lg bg-white/[0.02] border border-white/5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white tracking-widest uppercase">{row.degree}</span>
                          <span className="text-sm text-white font-medium">{row.chord}</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center justify-between">
                          <span>Role</span>
                          <span
                            className={cn(
                              "text-[10px] px-2 py-0.5 rounded-full border",
                              row.func === "Tonic"
                                ? "bg-white/5 border-white/10 text-white"
                                : row.func === "Dominant"
                                  ? "bg-blue-500/10 border-blue-400/20 text-blue-100"
                                  : "bg-emerald-500/10 border-emerald-400/20 text-emerald-100"
                            )}
                          >
                            {row.func}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1">
                    Make a chord change feel stronger
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {appliedChords.map((a) => (
                      <div key={a.name} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.01] border border-white/5">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-white/5 text-white border border-white/10">
                            {a.name.replace("V/", "Lead into ")}
                          </Badge>
                          <span className="text-xs text-muted-foreground">→</span>
                          <span className="text-sm text-white font-medium">{a.resolvesTo}</span>
                        </div>
                        <span className="text-[11px] text-muted-foreground hidden md:block">A quick “setup” chord before it.</span>
                      </div>
                    ))}
                  </div>

                  <div className="text-[11px] text-muted-foreground leading-relaxed px-1">
                    Tip: these are optional “setup” moves that make the next chord feel more intentional. If it sounds too jazzy, skip it.
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Add a different mood</div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setBorrowedMode("minor")}
                        className={cn(
                          "text-[10px] px-2 py-1 rounded-lg border transition-colors",
                          borrowedMode === "minor"
                            ? "bg-white/10 border-white/15 text-white"
                            : "bg-white/[0.02] border-white/5 text-muted-foreground hover:text-white"
                        )}
                      >
                        Darker
                      </button>
                      <button
                        onClick={() => setBorrowedMode("mixolydian")}
                        className={cn(
                          "text-[10px] px-2 py-1 rounded-lg border transition-colors",
                          borrowedMode === "mixolydian"
                            ? "bg-white/10 border-white/15 text-white"
                            : "bg-white/[0.02] border-white/5 text-muted-foreground hover:text-white"
                        )}
                      >
                        Rock / bluesy
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {borrowedChords.map((b) => (
                      <div key={b.name} className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-white font-medium tracking-tight">{b.name}</span>
                          <span className="text-[10px] text-muted-foreground">color option</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground leading-relaxed">{b.use}</div>
                        <div className="mt-3 text-[11px] text-white/90 font-mono bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                          {b.example}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1">
                    Easy ways to change key
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {quickModulations.map((m) => (
                      <div key={m.label} className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-white font-medium">{m.label}</div>
                          <button
                            onClick={() => setSelectedKey(m.target)}
                            className="text-[10px] px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-muted-foreground hover:text-white transition-colors"
                            title="Jump to target key"
                          >
                            Go → {m.target}
                          </button>
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-1">{m.desc}</div>
                        <div className="mt-3 flex flex-wrap gap-2 items-center">
                          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Common chord</span>
                          <span className="text-[11px] font-mono text-white bg-white/5 border border-white/10 rounded px-2 py-1">
                            {m.pivot}
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {m.example.slice(0, 6).map((c, i) => (
                            <span key={i} className="px-3 py-1 rounded bg-white/10 text-[11px] font-mono text-white">
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="progress" className="mt-0 space-y-4 animate-in fade-in slide-in-from-bottom-2">
                {commonProgressions.map((p, i) => (
                  <div
                    key={i}
                    className="p-5 rounded-xl border border-white/5 bg-white/[0.02] group hover:bg-white/[0.04] transition-all"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold text-white tracking-widest uppercase">{p.name}</span>
                      <span className="text-[10px] text-muted-foreground">{p.desc}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {p.chords.map((c, ci) => (
                        <div key={ci} className="px-3 py-1 rounded bg-white/10 text-[11px] font-mono text-white">
                          {c}
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 text-[11px] text-muted-foreground">Examples: {p.examples}</div>
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
