import Navigation from "@/components/Navigation";
import Fretboard from "@/components/Fretboard";
import RootChordLibrary from "@/components/RootChordLibrary";
import ScaleExplorer from "@/components/ScaleExplorer";
import Metronome from "@/components/Metronome";
import CircleOfFifths from "@/components/CircleOfFifths";
import { Music2, Zap, Globe, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const handleStartExploring = () => {
    const element = document.getElementById("fretboard");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/5 relative overflow-hidden">
      {/* Enhanced background gradient with better depth */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl opacity-20"></div>
      </div>

      <Navigation />

      {/* Hero Section - Premium Design */}
      <section className="pt-40 pb-32 px-6 relative">
        <div className="container mx-auto text-center max-w-4xl">
          {/* Main Title with Gradient */}
          <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight bg-gradient-to-br from-foreground via-foreground to-primary bg-clip-text text-transparent">
            Learn Music Theory
            <br />
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">Hands-On</span>
          </h1>

          {/* Subtitle with better contrast */}
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed font-medium">
            Interactive fretboard, chord explorer, scales, and metronome. Master music theory visually and intuitively.
          </p>

          {/* Premium CTA Button */}
          <Button size="lg" onClick={handleStartExploring} className="gap-2 mb-16 shadow-2xl hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-primary via-primary to-accent hover:from-primary/90 hover:via-primary/90 hover:to-accent/90 font-semibold text-base px-8 py-6 rounded-xl transform hover:scale-105">
            Start Exploring
            <ArrowRight className="w-5 h-5" />
          </Button>

          {/* Feature Pills - Enhanced Design */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
            <div className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-primary/20 bg-gradient-to-br from-card/60 to-card/30 backdrop-blur-lg hover:border-primary/40 hover:from-card/80 hover:to-card/50 transition-all duration-300 hover:shadow-lg">
              <Zap className="w-6 h-6 text-primary" />
              <span className="text-sm font-semibold">Interactive Tools</span>
            </div>
            <div className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-primary/20 bg-gradient-to-br from-card/60 to-card/30 backdrop-blur-lg hover:border-primary/40 hover:from-card/80 hover:to-card/50 transition-all duration-300 hover:shadow-lg">
              <Globe className="w-6 h-6 text-accent" />
              <span className="text-sm font-semibold">Global Music Theory</span>
            </div>
            <div className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-primary/20 bg-gradient-to-br from-card/60 to-card/30 backdrop-blur-lg hover:border-primary/40 hover:from-card/80 hover:to-card/50 transition-all duration-300 hover:shadow-lg">
              <Star className="w-6 h-6 text-secondary" />
              <span className="text-sm font-semibold">No Installation</span>
            </div>
          </div>
        </div>
      </section>

      {/* Content Sections with better spacing */}
      <div className="container mx-auto px-6 space-y-32 pb-32 relative">
        <section id="fretboard" className="scroll-mt-20 animate-fade-in">
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">Fretboard</h2>
              <p className="text-muted-foreground">Play and explore guitar notes interactively</p>
            </div>
            <Fretboard />
          </div>
        </section>

        <section id="chords" className="scroll-mt-20 animate-fade-in">
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">Chord Library</h2>
              <p className="text-muted-foreground">Explore chord voicings and fingerings</p>
            </div>
            <RootChordLibrary />
          </div>
        </section>

        <section id="scales" className="scroll-mt-20 animate-fade-in">
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">Scale Explorer</h2>
              <p className="text-muted-foreground">Discover scales from Western and global traditions</p>
            </div>
            <ScaleExplorer />
          </div>
        </section>

        <section id="metronome" className="scroll-mt-20 animate-fade-in">
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">Metronome</h2>
              <p className="text-muted-foreground">Practice with adjustable tempo and time signatures</p>
            </div>
            <Metronome />
          </div>
        </section>

        <section id="theory" className="scroll-mt-20 animate-fade-in">
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">Music Theory</h2>
              <p className="text-muted-foreground">Understand key relationships and progressions</p>
            </div>
            <CircleOfFifths />
          </div>
        </section>
      </div>

      {/* Premium Footer */}
      <footer className="border-t border-primary/20 py-20 px-6 bg-gradient-to-b from-background to-secondary/5 backdrop-blur">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 mb-12">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="Guitariz" className="w-8 h-8 rounded-lg" />
                <span className="font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Guitariz</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Interactive music theory learning for everyone. Master your instrument and understand music.
              </p>
            </div>

            {/* Tools Links */}
            <div className="space-y-4">
              <h3 className="font-bold text-foreground mb-4">Tools</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><a href="#fretboard" className="hover:text-primary transition-colors duration-200 font-medium">Fretboard</a></li>
                <li><a href="#chords" className="hover:text-primary transition-colors duration-200 font-medium">Chord Library</a></li>
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
