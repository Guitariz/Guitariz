
import ScaleExplorer from "@/components/ScaleExplorer";
import { Disc, Music, Bot, Layers } from "lucide-react";
import { usePageMetadata } from "@/hooks/usePageMetadata";

const ScalesPage = () => {
  usePageMetadata({
    title: "Interactive Scale Explorer | Guitariz - Music Modes & Intervals",
    description: "Visualize 100+ musical scales and modal relationships. Map intervals to the circle of fifths or directly to the virtual guitar fretboard for free.",
    canonicalUrl: "https://guitariz.studio/scales",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Guitariz Scale Explorer",
      "applicationCategory": "MusicApplication",
      "operatingSystem": "Web",
      "description": "Mathematical approach to musical scales and modal synthesis.",
      "url": "https://guitariz.studio/scales",
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
    }
  });

  return (
    <div className="min-h-screen bg-transparent relative overflow-hidden selection:bg-white/10">



      <main className="container mx-auto px-4 md:px-6 pt-2 md:pt-4 pb-12 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
          <div className="space-y-4">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-medium tracking-wider uppercase">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span>Modal Synthesis</span>
            </div>

            <header className="space-y-1">
              <h1 className="text-2xl md:text-3xl font-light tracking-tighter text-white font-display">
                Scale <span className="text-muted-foreground font-thin italic">Explorer</span>
              </h1>
              <p className="text-sm text-muted-foreground max-w-xl leading-relaxed font-light">
                A mathematical approach to melody. Visualize intervals across the circle of fifths or map them <span className="text-white/80">directly to the fretboard</span>.
              </p>
            </header>
          </div>
        </div>

        <div className="relative z-10">
          <ScaleExplorer />
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 group hover:bg-white/[0.04] transition-all">
            <Disc className="w-5 h-5 text-muted-foreground mb-3 group-hover:text-primary transition-colors" />
            <h3 className="text-white font-medium mb-1">Circle Of Fifths</h3>
            <p className="text-xs text-muted-foreground">Understand key relationships and secondary dominants visually.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 group hover:bg-white/[0.04] transition-all">
            <Music className="w-5 h-5 text-muted-foreground mb-3 group-hover:text-secondary transition-colors" />
            <h3 className="text-white font-medium mb-1">Intervalic Logic</h3>
            <p className="text-xs text-muted-foreground">Hear the unique tension and resolution of every mode.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 group hover:bg-white/[0.04] transition-all">
            <Layers className="w-5 h-5 text-muted-foreground mb-3 group-hover:text-accent transition-colors" />
            <h3 className="text-white font-medium mb-1">Global Modes</h3>
            <p className="text-xs text-muted-foreground">From Western Major to Eastern Ragas and beyond.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 group hover:bg-white/[0.04] transition-all">
            <Bot className="w-5 h-5 text-muted-foreground mb-3 group-hover:text-white transition-colors" />
            <h3 className="text-white font-medium mb-1">Fretboard Sync</h3>
            <p className="text-xs text-muted-foreground">Map any selected scale directly to the guitar neck.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ScalesPage;
