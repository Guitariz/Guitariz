import { Guitar, Layers, Disc, BookOpen, Music, Bot, Wand2, Download, Menu } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const Navigation = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<unknown>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    { icon: BookOpen, label: "Theory", path: "/theory" },
    { icon: Bot, label: "Chord AI", path: "/chord-ai" },
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
            <img
              src="/logo.svg"
              alt="Guitariz Logo"
              className="w-10 h-10 object-contain"
            />
            <div className="flex flex-col text-left">
              <h1 className="font-bold text-base tracking-tight text-white leading-tight">Guitariz</h1>
              <p className="text-[10px] uppercase tracking-widest text-white/60 font-medium">Studio</p>
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
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive
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
            {!isInstalled ? (
              <Button
                size="sm"
                onClick={handleInstall}
                className="hidden sm:flex gap-2 rounded-lg px-4 bg-white text-black hover:bg-white/90 font-semibold transition-all h-9 shadow-[0_0_15px_rgba(255,255,255,0.15)]"
              >
                <Download className={`w-4 h-4 ${isInstallable ? "animate-bounce" : ""}`} />
                <span>Install Studio</span>
              </Button>
            ) : (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/40 text-xs font-medium">
                <Music className="w-3 h-3" />
                <span>Studio Active</span>
              </div>
            )}

            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden text-white bg-white/5 border border-white/10 rounded-lg"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[300px] bg-[#0a0a0a]/95 backdrop-blur-xl border-white/10"
              >
                <SheetHeader className="pb-6 border-b border-white/10">
                  <SheetTitle className="flex items-center gap-3 text-white">
                    <img src="/logo.svg" alt="Guitariz" className="w-8 h-8" />
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
    </nav>
  );
};

export default Navigation;
