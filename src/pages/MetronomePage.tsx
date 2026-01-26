import Navigation from "@/components/Navigation";
import Metronome from "@/components/Metronome";
import { Timer, Zap } from "lucide-react";
import { useEffect } from "react";

const MetronomePage = () => {
  useEffect(() => {
    document.title = "Precision Metronome | Guitariz - Pro Rhythm Tools";
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute("href", "https://guitariz.studio/metronome");
    }
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", "Professional grade metronome with sample-accurate playback. Support for poly-meters, tap-tempo, and visual pulse feedback.");
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
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-secondary/20 bg-secondary/5 text-secondary text-xs font-medium tracking-wider uppercase">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
              </span>
              <span>Temporal Precision</span>
            </div>

            <header className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
                Pulse <span className="text-muted-foreground">Engine</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed text-pretty">
                Master your timing with sample-accurate playback. Support for complex poly-meters and tap-tempo.
              </p>
            </header>
          </div>
        </div>

        <div className="glass-card rounded-[2rem] border border-white/5 bg-[#0a0a0a]/40 backdrop-blur-xl shadow-2xl overflow-hidden p-8 flex items-center justify-center min-h-[400px]">
          <Metronome />
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 group hover:bg-white/[0.04] transition-all">
            <Timer className="w-5 h-5 text-muted-foreground mb-3 group-hover:text-primary transition-colors" />
            <h3 className="text-white font-medium mb-1">Visual Cues</h3>
            <p className="text-xs text-muted-foreground">High-contrast flash helps maintain time in loud environments.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 group hover:bg-white/[0.04] transition-all">
            <Zap className="w-5 h-5 text-muted-foreground mb-3 group-hover:text-secondary transition-colors" />
            <h3 className="text-white font-medium mb-1">Low Latency</h3>
            <p className="text-xs text-muted-foreground">Built on Web Audio API for professional-grade stability.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MetronomePage;
