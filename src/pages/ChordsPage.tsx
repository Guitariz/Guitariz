import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import RootChordLibrary from "@/components/RootChordLibrary";
import { BookOpen, Music, Layers, Bot } from "lucide-react";
import { usePageMetadata } from "@/hooks/usePageMetadata";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { SEOContent, Breadcrumb } from "@/components/SEOContent";
import RelatedTools from "@/components/RelatedTools";

interface SelectedChord {
  root: string;
  variantName: string;
  displayName: string;
  intervals: string;
  voicingFrets: number[];
  voicingIndex: number;
}

const ChordsPage = () => {
  usePageMetadata({
    title: "Chord Library & Voicings | Guitariz - Free Chord Identifier",
    description: "Explore a definitive collection of 1,000+ chord voicings. The best free chord library for guitar and piano with interactive diagrams and interval mapping.",
    canonicalUrl: "https://guitariz.studio/chords",
    ogImage: "https://guitariz.studio/logo2.png",
    ogType: "website",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Guitariz Chord Library",
      "applicationCategory": "MusicApplication",
      "operatingSystem": "Web",
      "description": "Definitive collection of 1,000+ chord voicings and intervals with piano previews.",
      "url": "https://guitariz.studio/chords",
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
    }
  });

  const [selectedChord, setSelectedChord] = useState<SelectedChord | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (selectedChord) {
      const handleClick = () => {
        const encodedRoot = encodeURIComponent(selectedChord.root);
        const encodedVariant = encodeURIComponent(selectedChord.variantName);
        navigate(`/fretboard/${encodedRoot}/${encodedVariant}/${selectedChord.voicingIndex}`);
      };

      toast({
        title: `${selectedChord.displayName} selected`,
        description: `Click "Open on Fretboard" to view this chord on the fretboard.`,
        action: (
          <Button
            onClick={handleClick}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Open on Fretboard
          </Button>
        ),
      });
    }
  }, [selectedChord, navigate, toast]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden selection:bg-white/10">
      <main className="container mx-auto px-4 md:px-6 pt-8 md:pt-12 pb-16 relative z-10">
        <Breadcrumb items={[
          { name: "Home", url: "https://guitariz.studio/" },
          { name: "Chord Library", url: "https://guitariz.studio/chords" }
        ]} />

        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div className="space-y-4">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-medium tracking-wider uppercase">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span>Harmonic Database</span>
            </div>

            <header className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-light tracking-tighter text-foreground font-display">
                Chord <span className="text-muted-foreground font-thin italic">Library</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed font-light">
                A definitive collection of voicings and intervals. Filter by root, quality, or complexity to find the <span className="text-foreground/80">perfect color</span> for your sound.
              </p>
            </header>
          </div>
        </div>

        <div className="glass-card rounded-[2rem] border border-border bg-card/80 shadow-2xl overflow-hidden p-1">
          <RootChordLibrary
            onChordSelect={(chord) => setSelectedChord(chord)}
          />
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-6 rounded-2xl bg-card/30 border border-border group hover:bg-card/50 transition-all">
            <BookOpen className="w-5 h-5 text-muted-foreground mb-3 group-hover:text-primary transition-colors" />
            <h3 className="text-foreground font-medium mb-1">Interval Mapping</h3>
            <p className="text-xs text-muted-foreground">See how every note functions relative to the root.</p>
          </div>
          <div className="p-6 rounded-2xl bg-card/30 border border-border group hover:bg-card/50 transition-all">
            <Music className="w-5 h-5 text-muted-foreground mb-3 group-hover:text-secondary transition-colors" />
            <h3 className="text-foreground font-medium mb-1">Quick Audition</h3>
            <p className="text-xs text-muted-foreground">Click any diagram to hear the voicing played on a piano.</p>
          </div>
          <div className="p-6 rounded-2xl bg-card/30 border border-border group hover:bg-card/50 transition-all">
            <Layers className="w-5 h-5 text-muted-foreground mb-3 group-hover:text-accent transition-colors" />
            <h3 className="text-foreground font-medium mb-1">Smart Sorting</h3>
            <p className="text-xs text-muted-foreground">Group by families or find specific extensions instantly.</p>
          </div>
          <div className="p-6 rounded-2xl bg-card/30 border border-border group hover:bg-card/50 transition-all">
            <Bot className="w-5 h-5 text-muted-foreground mb-3 group-hover:text-foreground transition-colors" />
            <h3 className="text-foreground font-medium mb-1">Studio Ready</h3>
            <p className="text-xs text-muted-foreground">Clean, distraction-free environment for songwriting.</p>
          </div>
        </div>

        <SEOContent
          pageName="chords"
          faqs={[
            {
              question: "How do I find a chord in the library?",
              answer: "You can use the root note selector to pick your key (e.g., C, G, Bb) and then browse through categories like Major, Minor, 7ths, and Altered chords."
            },
            {
              question: "What are 'intervals' and why are they shown?",
              answer: "Intervals show how each note in a chord relates to the root (e.g., 3rd, 5th, 7th). Understanding intervals is the foundation of music theory."
            },
            {
              question: "Can I hear these chords played?",
              answer: "Yes! Click on any chord diagram to hear high-fidelity piano samples of that specific voicing."
            },
            {
              question: "How do I see these chords on the interactive guitar fretboard?",
              answer: "When you select a chord, a toast notification will appear with an 'Open on Fretboard' button. Clicking this will take you to our Fretboard simulator with that specific voicing loaded."
            }
          ]}
        />
        <RelatedTools currentPath="/chords" />
      </main>
    </div>
  );
};

export default ChordsPage;