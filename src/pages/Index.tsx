import Navigation from "@/components/Navigation";
import Fretboard from "@/components/Fretboard";
import RootChordLibrary from "@/components/RootChordLibrary";
import ScaleExplorer from "@/components/ScaleExplorer";
import Metronome from "@/components/Metronome";
import CircleOfFifths from "@/components/CircleOfFifths";
import { Music2, Sparkles, Zap, Globe, Star } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-accent/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-ocean/5 rounded-full blur-3xl" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-neon/3 rounded-full blur-2xl animate-pulse"></div>
      </div>

      <Navigation />

      {/* Enhanced Hero Section */}
      <section className="pt-32 pb-24 px-6 relative">
        <div className="container mx-auto text-center max-w-5xl">
          <div className="mb-8 flex justify-center">
              <div className="w-24 h-24 rounded-3xl bg-gradient-accent flex items-center justify-center animate-float glow-accent hover-lift transition-all duration-500 overflow-hidden">
              <img src="/logo.png" alt="Guitariz Logo" className="w-12 h-12 object-contain" />
            </div>
          </div>

          <h1 className="text-5xl md:text-8xl font-bold mb-8 animate-fade-in leading-tight">
            Welcome to <span className="text-gradient animate-gradient-x bg-clip-text">Guitariz</span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground mb-12 animate-fade-in max-w-3xl mx-auto leading-relaxed">
            Your complete toolkit for music theory, chords, and guitar learning.
            <span className="text-primary font-medium"> Visualize, learn, and master music like never before.</span>
          </p>

          {/* Feature highlights */}
          <div className="flex flex-wrap justify-center gap-6 mb-12 animate-fade-in">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full glass-card border-primary/20 hover-lift transition-all duration-300">
              <Zap className="w-4 h-4 text-accent animate-pulse" />
              <span className="text-sm font-medium">Interactive Tools</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full glass-card border-primary/20 hover-lift transition-all duration-300">
              <Globe className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-sm font-medium">Cross-Cultural Theory</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full glass-card border-primary/20 hover-lift transition-all duration-300">
              <Star className="w-4 h-4 text-accent animate-pulse" />
              <span className="text-sm font-medium">Professional Quality</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Sections */}
      <div className="container mx-auto px-6 space-y-32 pb-32 relative">
        <section id="fretboard" className="animate-fade-in">
          <Fretboard />
        </section>

        <section id="chords" className="animate-fade-in">
          <RootChordLibrary />
        </section>

        <section id="scales" className="animate-fade-in">
          <ScaleExplorer />
        </section>

        <section id="metronome" className="animate-fade-in">
          <Metronome />
        </section>

        <section id="theory" className="animate-fade-in">
          <CircleOfFifths />
        </section>
      </div>

      {/* Enhanced Footer */}
      <footer className="border-t border-border/50 py-12 px-6 bg-card relative overflow-hidden">
        <div className="container mx-auto text-center relative z-10">
            <div className="flex items-center justify-center gap-2 mb-4">
            {/* <div className="w-8 h-8 rounded-lg bg-gradient-accent flex items-center justify-center">
              <Music2 className="w-4 h-4 text-primary-foreground" />
            </div> */}
            <span className="text-sm font-medium text-gradient">Guitariz :))</span>
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            Built with ❤️ for musicians and guitarists worldwide
          </p>
          <p className="text-xs text-muted-foreground">
            Guitariz © 2025 - Your complete music companion
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
