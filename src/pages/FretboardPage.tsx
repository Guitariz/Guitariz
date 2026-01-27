import Navigation from "@/components/Navigation";
import Fretboard from "@/components/Fretboard";
import { usePageMetadata } from "@/hooks/usePageMetadata";

const FretboardPage = () => {
  usePageMetadata({
    title: "Free Virtual Fretboard & Piano | Guitariz - Instrument Simulator",
    description: "Interactive high-fidelity instrument sandbox. Explore chord patterns and scales on a free virtual guitar fretboard and piano.",
    canonicalUrl: "https://guitariz.studio/fretboard",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Guitariz Virtual Fretboard",
      "applicationCategory": "MusicApplication",
      "operatingSystem": "Web",
      "description": "Interactive instrument sandbox for guitar and piano with real-time feedback.",
      "url": "https://guitariz.studio/fretboard",
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
    }
  });

  return (
    <div className="min-h-screen bg-transparent relative overflow-hidden selection:bg-white/10">

      <Navigation />

      <main className="container mx-auto px-4 md:px-6 pt-24 md:pt-32 pb-16 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div className="space-y-4">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-medium tracking-wider uppercase">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span>Interactive Simulator</span>
            </div>

            <header className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-light tracking-tighter text-white font-display">
                Fretboard <span className="text-muted-foreground font-thin italic">&</span> Piano
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed font-light">
                A high-fidelity instrument sandbox. Explore chord voicings, scale patterns, and <span className="text-white/80">interval relationships</span> in real-time.
              </p>
            </header>
          </div>
        </div>

        <div className="glass-card rounded-[2rem] border border-white/5 bg-[#0a0a0a]/40 backdrop-blur-xl shadow-2xl overflow-hidden min-h-[600px]">
          <Fretboard />
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
            <h3 className="text-white font-medium mb-1">Low Latency</h3>
            <p className="text-sm text-muted-foreground text-pretty">Optimized audio engine for immediate feedback as you play or explore.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
            <h3 className="text-white font-medium mb-1">Flexible Input</h3>
            <p className="text-sm text-muted-foreground text-pretty">Supports QWERTY/AZERTY keyboard input, touch, and mouse interactions.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
            <h3 className="text-white font-medium mb-1">Visual Learning</h3>
            <p className="text-sm text-muted-foreground text-pretty">Real-time chord detection and interval labeling for every note played.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FretboardPage;
