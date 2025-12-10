import { Music, Guitar, Layers, Disc, BookOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const Navigation = () => {
  const navItems = [
    { icon: Guitar, label: "Fretboard", id: "fretboard" },
    { icon: Layers, label: "Chords", id: "chords" },
    { icon: Disc, label: "Scales", id: "scales" },
    { icon: Music, label: "Metronome", id: "metronome" },
    { icon: BookOpen, label: "Theory", id: "theory" },
  ];

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/50 backdrop-blur-xl">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-12 h-12 rounded-2xl bg-gradient-accent flex items-center justify-center hover-lift glow-accent transition-all duration-300 group-hover:scale-110 overflow-hidden">
              <img src="/logo.png" alt="Guitariz Logo" className="w-7 h-7 object-contain" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold text-gradient animate-gradient-x bg-clip-text">
                Guitariz
              </h1>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Sparkles className="w-3 h-3 text-accent animate-pulse" />
                <span>Professional Music Tools</span>
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item, index) => (
              <Button
                key={item.id}
                variant="ghost"
                size="sm"
                onClick={() => scrollToSection(item.id)}
                className="btn-professional gap-2 hover:bg-primary/10 hover:text-primary transition-colors duration-200"
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Button>
            ))}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              className="btn-professional hover:bg-primary/10 focus-professional"
            >
              <Music className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
