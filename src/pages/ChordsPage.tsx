import Navigation from "@/components/Navigation";
import RootChordLibrary from "@/components/RootChordLibrary";
import { BookOpen, Music, Layers, Bot } from "lucide-react";

const ChordsPage = () => {
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
              <span>Harmonic Database</span>
            </div>
            
            <header className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
                Chord <span className="text-muted-foreground">Library</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed text-pretty">
                A definitive collection of voicings and intervals. Filter by root, quality, or complexity to find the perfect color for your sound.
              </p>
            </header>
          </div>
        </div>

        <div className="glass-card rounded-[2rem] border border-white/5 bg-[#0a0a0a]/40 backdrop-blur-xl shadow-2xl overflow-hidden p-1">
          <RootChordLibrary />
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 group hover:bg-white/[0.04] transition-all">
            <BookOpen className="w-5 h-5 text-muted-foreground mb-3 group-hover:text-primary transition-colors" />
            <h3 className="text-white font-medium mb-1">Interval Mapping</h3>
            <p className="text-xs text-muted-foreground">See how every note functions relative to the root.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 group hover:bg-white/[0.04] transition-all">
            <Music className="w-5 h-5 text-muted-foreground mb-3 group-hover:text-secondary transition-colors" />
            <h3 className="text-white font-medium mb-1">Quick Audition</h3>
            <p className="text-xs text-muted-foreground">Click any diagram to hear the voicing played on a piano.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 group hover:bg-white/[0.04] transition-all">
             <Layers className="w-5 h-5 text-muted-foreground mb-3 group-hover:text-accent transition-colors" />
            <h3 className="text-white font-medium mb-1">Smart Sorting</h3>
            <p className="text-xs text-muted-foreground">Group by families or find specific extensions instantly.</p>
          </div>
           <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 group hover:bg-white/[0.04] transition-all">
             <Bot className="w-5 h-5 text-muted-foreground mb-3 group-hover:text-white transition-colors" />
            <h3 className="text-white font-medium mb-1">Studio Ready</h3>
            <p className="text-xs text-muted-foreground">Clean, distraction-free environment for songwriting.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ChordsPage;
