import { Guitar, Layers, Disc, BookOpen, Music, Bot, Wand2, Download, Menu, Activity, GaugeCircle, Trophy } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useBackendHealth } from "@/hooks/useBackendHealth";

const Navigation = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<unknown>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const healthStatus = useBackendHealth();

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches || (window.navigator as Navigator & { standalone?: boolean }).standalone) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as unknown);
      setIsInstallable(true);
    };

    const installedHandler = () => {

      setIsInstalled(true);
      setIsInstallable(false);
      toast("🎉 Welcome to the Studio!", {
        description: "Guitariz is now installed!",
      });
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installedHandler);

    // Shorter timeout - if no prompt after 2 seconds, assume not available
    const timer = setTimeout(() => {
      if (!deferredPrompt) {
        setIsInstallable(false);
      }
    }, 2000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
      clearTimeout(timer);
    };
  }, [deferredPrompt]);

  const handleInstall = async () => {
    // If already installed, just notify
    if (isInstalled) {
      toast("🎸 Already Jamming!", {
        description: "Guitariz Studio is already installed and ready to rock!",
      });
      return;
    }

    // Try to use deferredPrompt if available
    if (deferredPrompt) {
      try {

        (deferredPrompt as { prompt: () => Promise<void> }).prompt();
        const { outcome } = await (deferredPrompt as { userChoice: Promise<{ outcome: string }> }).userChoice;


        if (outcome === "accepted") {
          setDeferredPrompt(null);
          setIsInstallable(false);
          setIsInstalled(true);
          toast("🎉 Installing...", {
            description: "Guitariz Studio is being installed. Check your desktop or home screen!",
          });
        }
      } catch (error) {

        toast("⚠️ Install Issue", {
          description: "Something went wrong. Try using the browser's menu to install (⋮ → Install app).",
          duration: 5000,
        });
      }
      return;
    }

    // No prompt available - guide user to manual install

    toast("📍 Manual Install", {
      description: "Use your browser menu (three dots ⋮) and select 'Install Guitariz Studio' or look for an install icon in the address bar.",
      duration: 6000,
    });
  };

  const navItems = [
    { icon: Guitar, label: "Fretboard", path: "/fretboard" },
    { icon: Layers, label: "Chords", path: "/chords" },
    { icon: Disc, label: "Scales", path: "/scales" },
    { icon: Music, label: "Metronome", path: "/metronome" },
    { icon: Wand2, label: "Vocal Splitter", path: "/vocal-splitter" },
    { icon: Trophy, label: "Ear Training", path: "/ear-training" },
    { icon: GaugeCircle, label: "Tuner", path: "/tuner" },
    { icon: BookOpen, label: "Theory", path: "/theory" },
    { icon: Bot, label: "Chord AI", path: "/chord-ai" },
  ];

  const location = useLocation();

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 left-0 right-0 z-50 px-4 md:px-6 pt-3"
    >
      <div className="container mx-auto">
        <div className="relative rounded-2xl border border-white/10 bg-[#0a0a0a]/90 shadow-2xl px-4 md:px-6 py-1.5 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="relative flex items-center gap-3 hover:opacity-90 transition-opacity group"
              aria-label="Guitariz Studio Home"
            >
              <div className="relative">
                <img
                  src="/logo2.png"
                  alt="Guitariz Logo"
                  className="w-8 h-8 object-contain relative z-10"
                />
                <div className="absolute inset-0 bg-white/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="flex flex-col text-left">
                <h2 className="font-bold text-sm tracking-tight text-white leading-tight">Guitariz</h2>
                <p className="text-[8px] uppercase tracking-widest text-white/60 font-medium">Studio</p>
              </div>
            </Link>

            {/* Backend Health Badge */}
            <div className={cn(
              "hidden sm:flex items-center gap-2 px-2 py-1 rounded-md border text-[8px] font-bold uppercase tracking-widest transition-all",
              healthStatus === "online" ? "bg-green-500/10 border-green-500/20 text-green-400" :
                healthStatus === "offline" ? "bg-red-500/10 border-red-500/20 text-red-400" :
                  "bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse"
            )}>
              <Activity className={cn("w-2.5 h-2.5", healthStatus === "online" && "animate-pulse")} />
              <span>AI Engine {healthStatus}</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1.5 p-1 bg-black/60 rounded-xl border border-white/10">
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  aria-label={`Open ${item.label} tool`}
                  className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-bold transition-all duration-300 group whitespace-nowrap ${isActive ? "text-white" : "text-white/40 hover:text-white/70"
                    }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 bg-white/10 rounded-lg border border-white/10 shadow-inner"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <item.icon className={cn(
                    "w-3.5 h-3.5 relative z-10 transition-transform duration-300 group-hover:scale-110",
                    isActive ? "text-primary" : "text-current"
                  )} />
                  <span className="relative z-10">{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            {!isInstalled ? (
              <Button
                size="sm"
                onClick={handleInstall}
                className="hidden sm:flex items-center gap-2 rounded-lg px-3.5 bg-white text-black hover:bg-white/90 font-semibold transition-all h-8 shadow-[0_0_15px_rgba(255,255,255,0.1)] text-xs"
              >
                <Download className={`w-3.5 h-3.5 ${isInstallable ? "animate-bounce" : ""}`} />
                <span>Install Studio</span>
              </Button>
            ) : (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-white/40 text-[10px] uppercase font-bold tracking-wider">
                <Music className="w-2.5 h-2.5" />
                <span>Studio Active</span>
              </div>
            )}

            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden text-white bg-white/5 border border-white/10 rounded-lg w-8 h-8"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[300px] bg-[#0a0a0a] border-white/10"
              >
                <SheetHeader className="pb-6 border-b border-white/10">
                  <SheetTitle className="flex items-center gap-3 text-white">
                    <img src="/logo2.png" alt="Guitariz Logo" className="w-8 h-8" />
                    <span>Guitariz Studio</span>
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-2 pt-6">
                  {navItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive
                          ? "text-white bg-white/10 border border-white/10"
                          : "text-muted-foreground hover:text-white hover:bg-white/5"
                          }`}
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navigation;
