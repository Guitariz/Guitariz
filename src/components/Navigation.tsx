import { Guitar, Layers, Disc, BookOpen, Music } from "lucide-react";
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
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <button onClick={() => scrollToSection("fretboard")} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src="/logo.png" alt="Guitariz Logo" className="w-10 h-10 rounded-lg" />
            <div className="flex flex-col text-left">
              <h1 className="font-bold text-lg">Guitariz</h1>
              <p className="text-xs text-muted-foreground">Music Theory Tools</p>
            </div>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                size="sm"
                onClick={() => scrollToSection(item.id)}
                className="gap-2 text-muted-foreground hover:text-foreground hover:bg-transparent transition-colors"
              >
                <item.icon className="w-4 h-4" />
                <span className="text-sm">{item.label}</span>
              </Button>
            ))}
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <Music className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
