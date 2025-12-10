import Navigation from "@/components/Navigation";
import Fretboard from "@/components/Fretboard";
import RootChordLibrary from "@/components/RootChordLibrary";
import ScaleExplorer from "@/components/ScaleExplorer";
import Metronome from "@/components/Metronome";
import CircleOfFifths from "@/components/CircleOfFifths";
import { Music2, Zap, Globe, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none"></div>

      <Navigation />

      {/* Hero Section - Clean & Modern */}
      <section className="pt-40 pb-32 px-6 relative">
        <div className="container mx-auto text-center max-w-4xl">
          {/* Main Title */}
          <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
            Learn Music Theory
            <br />
            <span className="text-primary">Hands-On</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Interactive fretboard, chord explorer, scales, and metronome. Master music theory visually and intuitively.
          </p>

          {/* CTA Button */}
          <Button size="lg" className="gap-2 mb-16 shadow-lg hover:shadow-xl transition-shadow">
            Start Exploring
            <ArrowRight className="w-4 h-4" />
          </Button>

          {/* Feature Pills */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
            <div className="flex items-center justify-center gap-3 p-4 rounded-xl border border-border/50 bg-card/30 backdrop-blur hover:border-primary/50 transition-colors">
              <Zap className="w-5 h-5 text-primary flex-shrink-0" />
              <span className="text-sm font-medium">Interactive Tools</span>
            </div>
            <div className="flex items-center justify-center gap-3 p-4 rounded-xl border border-border/50 bg-card/30 backdrop-blur hover:border-primary/50 transition-colors">
              <Globe className="w-5 h-5 text-primary flex-shrink-0" />
              <span className="text-sm font-medium">Global Music Theory</span>
            </div>
            <div className="flex items-center justify-center gap-3 p-4 rounded-xl border border-border/50 bg-card/30 backdrop-blur hover:border-primary/50 transition-colors">
              <Star className="w-5 h-5 text-primary flex-shrink-0" />
              <span className="text-sm font-medium">No Installation</span>
            </div>
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <div className="container mx-auto px-6 space-y-24 pb-32 relative">
        <section id="fretboard" className="scroll-mt-20">
          <Fretboard />
        </section>

        <section id="chords" className="scroll-mt-20">
          <RootChordLibrary />
        </section>

        <section id="scales" className="scroll-mt-20">
          <ScaleExplorer />
        </section>

        <section id="metronome" className="scroll-mt-20">
          <Metronome />
        </section>

        <section id="theory" className="scroll-mt-20">
          <CircleOfFifths />
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 py-16 px-6 bg-card/50 backdrop-blur">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Music2 className="w-5 h-5 text-primary" />
                <span className="font-bold text-lg">Guitariz</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Learn music theory interactively with hands-on tools.
              </p>
            </div>

            {/* Links */}
            <div>
              <h3 className="font-semibold mb-4 text-sm">Tools</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#fretboard" className="hover:text-primary transition-colors">Fretboard</a></li>
                <li><a href="#chords" className="hover:text-primary transition-colors">Chord Library</a></li>
                <li><a href="#scales" className="hover:text-primary transition-colors">Scale Explorer</a></li>
              </ul>
            </div>

            {/* More Links */}
            <div>
              <h3 className="font-semibold mb-4 text-sm">Info</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/" className="hover:text-primary transition-colors">Home</a></li>
                <li><a href="https://github.com/abhi9vaidya/guitariz" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">GitHub</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">License</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border/50 pt-8 text-center text-sm text-muted-foreground">
            <p>© 2025 Guitariz. Made for musicians.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
