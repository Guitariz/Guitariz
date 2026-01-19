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
        <div className="relative rounded-2xl border border-white/10 bg-[#0a0a0a]/60 backdrop-blur-xl shadow-2xl px-4 md:px-6 py-2.5 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link
            to="/"
            className="relative flex items-center gap-3 hover:opacity-90 transition-opacity group"
          >
            <div className="w-9 h-9 flex items-center justify-center bg-white/5 rounded-xl border border-white/10 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all">
              <Guitar className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col text-left">
              <h1 className="font-bold text-base tracking-tight text-white leading-tight">Guitariz</h1>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Studio</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "text-white bg-white/10 shadow-inner border border-white/5"
                      : "text-muted-foreground hover:text-white hover:bg-white/5"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="hidden sm:flex gap-2 rounded-lg px-4 bg-white text-black hover:bg-white/90 font-semibold transition-all h-9"
              asChild
            >
              <Link to="/chord-ai">
                Chord AI
                <Bot className="w-4 h-4" />
              </Link>
            </Button>
            
            <div className="lg:hidden">
              <Button variant="ghost" size="icon" className="text-white bg-white/5 border border-white/10 rounded-lg">
                <Layers className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
