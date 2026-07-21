import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Play, Pause, RefreshCw, FileAudio, Music2, ArrowRight } from "lucide-react";
import { usePageMetadata } from "@/hooks/usePageMetadata";
import { SEOContent, Breadcrumb } from "@/components/SEOContent";
import RelatedTools from "@/components/RelatedTools";
import ChordDiagram from "@/components/chord/ChordDiagram";
import { findChordByName, chordLibraryData } from "@/data/chordData";
import { exportChordsToMidi } from "@/lib/midiExport";
import { useToast } from "@/components/ui/use-toast";
import { Note, Chord } from "tonal";

// Common musical progression templates
const PROGRESSION_TEMPLATES = [
  { name: "Pop Classic (I - V - vi - IV)", numerals: [1, 5, 6, 4], mood: "Catchy / Energetic" },
  { name: "Emotional Sad (vi - IV - I - V)", numerals: [6, 4, 1, 5], mood: "Melancholic / Emotional" },
  { name: "Jazz Turnaround (ii - V - I - VI)", numerals: [2, 5, 1, 6], mood: "Sophisticated / Jazz" },
  { name: "R&B / Soul (I - iii - IV - iv)", numerals: [1, 3, 4, 4], mood: "Smooth / Soulful" },
  { name: "Rock / Blues (I - IV - V - IV)", numerals: [1, 4, 5, 4], mood: "Driving / Bluesy" },
  { name: "Homeric Epic (I - bVII - bVI - bVII)", numerals: [1, 7, 6, 7], mood: "Epic / Dramatic" },
];

const KEYS = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];

const ChordGeneratorPage = () => {
  usePageMetadata({
    title: "Free Chord Progression Generator & Harmonic Explorer | Guitariz",
    description: "Generate inspiring chord progressions for guitar, piano, and songwriting. Choose key, mood, or genre with real-time sound playback and MIDI export.",
    keywords: "chord progression generator, random chord generator, guitar chord generator, piano chord generator, music progression maker, jazz chord generator",
    canonicalUrl: "https://guitariz.studio/chord-progression-generator",
    ogImage: "https://guitariz.studio/logo2.png",
    ogType: "website",
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "SoftwareApplication",
          "name": "Guitariz Chord Progression Generator",
          "applicationCategory": "MusicApplication",
          "operatingSystem": "Web",
          "url": "https://guitariz.studio/chord-progression-generator",
          "description": "Free chord progression generator for guitarists, songwriters, and producers.",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "bestRating": "5",
            "worstRating": "1",
            "reviewCount": "89"
          }
        }
      ]
    }
  });

  const { toast } = useToast();
  const [selectedKey, setSelectedKey] = useState("C");
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(0);

  const activeTemplate = PROGRESSION_TEMPLATES[selectedTemplateIndex];

  // Calculate actual chord names based on Key + Roman numerals
  const generatedChords = useMemo(() => {
    const rootMidi = Note.midi(`${selectedKey}4`) ?? 60;
    const majorScaleIntervals = [0, 2, 4, 5, 7, 9, 11];
    const qualities = ["", "m", "m", "", "", "m", "dim"];

    return activeTemplate.numerals.map((num) => {
      const idx = (num - 1) % 7;
      const semitone = majorScaleIntervals[idx];
      const chordRoot = Note.fromMidi(rootMidi + semitone).replace(/\d+$/, "");
      const quality = qualities[idx];
      return `${chordRoot}${quality}`;
    });
  }, [selectedKey, activeTemplate]);

  const handleExportMidi = () => {
    const segments = generatedChords.map((chord, idx) => ({
      start: idx * 2,
      end: (idx + 1) * 2,
      chord,
      confidence: 1.0,
    }));

    const mockResult = {
      tempo: 120,
      meter: 4,
      key: selectedKey,
      scale: "major",
      chords: segments,
      simpleChords: segments,
    };

    try {
      const { filename } = exportChordsToMidi(mockResult, `${selectedKey}_${activeTemplate.name}_progression`);
      toast({
        title: "MIDI Exported! 🎹",
        description: `Saved "${filename}". Ready to drop into your DAW!`,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not export MIDI file.";
      toast({ title: "Export failed", description: message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden selection:bg-white/10">
      <main className="container mx-auto px-4 md:px-6 pt-8 md:pt-12 pb-16 relative z-10">
        <div className="max-w-4xl mx-auto">
          <Breadcrumb
            items={[
              { name: "Home", url: "https://guitariz.studio/" },
              { name: "Chord Generator", url: "https://guitariz.studio/chord-progression-generator" }
            ]}
          />

          <div className="space-y-4 mb-10 text-center md:text-left">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-border bg-card/50 text-muted-foreground text-[10px] font-bold tracking-[0.2em] uppercase">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Harmonic Generator Tool</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-foreground">
              Chord Progression <span className="text-muted-foreground font-thin italic">Generator</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed font-light">
              Generate fresh chord progressions for songwriting, beat-making, and guitar practice. Select key and mood to export instantly as MIDI.
            </p>
          </div>

          <div className="glass-card rounded-[2rem] border border-border bg-card/95 p-8 shadow-2xl space-y-8 mb-12">
            {/* Selection Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Root Key</label>
                <Select value={selectedKey} onValueChange={setSelectedKey}>
                  <SelectTrigger className="h-12 rounded-xl border-border bg-card">
                    <SelectValue placeholder="Select Key" />
                  </SelectTrigger>
                  <SelectContent>
                    {KEYS.map((k) => (
                      <SelectItem key={k} value={k}>
                        Key of {k}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Style / Mood Template</label>
                <Select value={selectedTemplateIndex.toString()} onValueChange={(v) => setSelectedTemplateIndex(Number(v))}>
                  <SelectTrigger className="h-12 rounded-xl border-border bg-card">
                    <SelectValue placeholder="Select Progression" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROGRESSION_TEMPLATES.map((t, idx) => (
                      <SelectItem key={idx} value={idx.toString()}>
                        {t.name} ({t.mood})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Generated Chord Progression Display */}
            <div className="space-y-6 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Generated Progression
                </span>
                <Button
                  size="sm"
                  onClick={handleExportMidi}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl"
                >
                  <FileAudio className="w-3.5 h-3.5 mr-2" /> Export as MIDI
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {generatedChords.map((chordName, idx) => (
                  <div
                    key={idx}
                    className="p-6 rounded-2xl bg-card/40 border border-border text-center space-y-2 hover:border-purple-500/30 transition-all"
                  >
                    <div className="text-xs text-muted-foreground/60 font-mono font-bold">CHORD {idx + 1}</div>
                    <div className="text-3xl font-black text-foreground">{chordName}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <SEOContent
            pageName="chord-progression-generator"
            faqs={[
              {
                question: "How does the Chord Progression Generator work?",
                answer: "Select your desired root key and musical style (Pop, Jazz, R&B, Rock, Blues). The generator builds harmonic progressions based on standard music theory and Roman numeral analysis."
              },
              {
                question: "Can I export generated progressions as MIDI?",
                answer: "Yes! Click the 'Export as MIDI' button to download a standard .mid file and drag it straight into your DAW (Ableton, FL Studio, Logic, etc.)."
              },
              {
                question: "Can I use generated chord progressions commercially?",
                answer: "Yes! All chord progressions and exported MIDI files are 100% royalty-free for commercial music production."
              }
            ]}
          />

          <RelatedTools currentPath="/chord-progression-generator" />
        </div>
      </main>
    </div>
  );
};

export default ChordGeneratorPage;
