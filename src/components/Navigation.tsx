import { Guitar, Layers, Disc, BookOpen, Music, Bot } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Navigation = () => {
  const navItems = [
    { icon: Guitar, label: "Fretboard", path: "/fretboard" },
    { icon: Layers, label: "Chords", path: "/chords" },
    { icon: Disc, label: "Scales", path: "/scales" },
    { icon: Music, label: "Metronome", path: "/metronome" },
    { icon: Bot, label: "Chord AI", path: "/chord-ai" },
    { icon: BookOpen, label: "Theory", path: "/theory" },
  ];

  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4 md:px-6 pt-4">
        <div className="relative rounded-2xl border border-border/50 bg-card/70 backdrop-blur-xl shadow-lg px-4 md:px-6 py-3 flex items-center justify-between gap-4">
          <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ backgroundImage: "linear-gradient(120deg, hsla(16,92%,64%,0.12), hsla(192,86%,55%,0.08), hsla(313,78%,63%,0.12))" }} />

          {/* Logo */}
          <Link
            to="/"
            className="relative flex items-center gap-3 hover:opacity-90 transition-opacity"
          >
            <img src="/logo.svg" alt="Guitariz Logo" className="w-10 h-10 rounded-xl" />
            <div className="flex flex-col text-left">
              <h1 className="font-bold text-lg">Guitariz</h1>
              <p className="text-xs text-muted-foreground">Playful theory studio</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1 relative">
            {navItems.map((item) => (
              <Button
                key={item.path}
                variant="ghost"
                size="sm"
                asChild
                className={`gap-2 rounded-full transition-colors ${
                  location.pathname.startsWith(item.path)
                    ? "text-foreground bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-primary/10"
                }`}
              >
                <Link to={item.path}>
                  <item.icon className="w-4 h-4" />
                  <span className="text-sm">{item.label}</span>
                </Link>
              </Button>
            ))}
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden relative">
            <Button variant="ghost" size="sm" className="text-muted-foreground rounded-full" asChild>
              <Link to="/fretboard">
                <Music className="w-5 h-5" />
              </Link>
            </Button>
          </div>

          <div className="hidden md:block relative">
            <Button
              size="sm"
              className="gap-2 rounded-full px-4 bg-gradient-to-r from-primary via-secondary to-accent text-background shadow-md hover:shadow-lg"
              asChild
            >
              <Link to="/fretboard">
                Jam now
                <Music className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
