import Navigation from "@/components/Navigation";
import ScaleExplorer from "@/components/ScaleExplorer";
import { Disc, Music, Bot, Layers } from "lucide-react";
import { useEffect } from "react";

const ScalesPage = () => {
  useEffect(() => {
    document.title = "Scale Explorer | Guitariz - Musical Modes & Intervals";
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute("href", "https://guitariz.studio/scales");
    }
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", "Visualize musical scales and modal relationships. Map intervals to the circle of fifths or directly to the interactive fretboard.");
    }
  }, []);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background grain effect */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

      <Navigation />

      <main className="container mx-auto px-4 md:px-6 pt-24 md:pt-32 pb-16 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div className="space-y-4">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-medium tracking-wider uppercase">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span>Modal Synthesis</span>
            </div>

            <header className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
                Scale <span className="text-muted-foreground">Explorer</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed text-pretty">
                A mathematical approach to melody. Visualize intervals across the circle of fifths or map them directly to the fretboard.
              </p>
            </header>
          </div>
        </div>

        <div className="glass-card rounded-[2rem] border border-white/5 bg-[#0a0a0a]/40 backdrop-blur-xl shadow-2xl overflow-hidden p-1">
          <ScaleExplorer />
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
