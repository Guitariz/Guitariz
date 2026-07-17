import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import {
    Menu,
    X,
    Home,
    Headphones,
    Music,
    Layers,
    Clock,
    Mic,
    BookOpen,
    Trophy,
    Guitar,
    Download,
    Check,
    Split,
    Sparkles,
    Github,
    Coffee,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { InstallGuide } from "@/components/InstallGuide";

interface MenuItem {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    href: string;
    description: string;
    badge?: string;
}

interface MenuCategory {
    title: string;
    items: MenuItem[];
}

const menuCategories: MenuCategory[] = [
    {
        title: "AI Tools",
        items: [
            { label: "Chord AI", icon: Mic, href: "/chord-ai", description: "Neural audio chord detection", badge: "AI" },
            { label: "Vocal Splitter", icon: Headphones, href: "/vocal-splitter", description: "Isolate vocals & instrumentals", badge: "AI" },
            { label: "Stem Separator", icon: Split, href: "/stem-separator", description: "6-stem track separation", badge: "AI" },
        ],
    },
    {
        title: "Instruments",
        items: [
            { label: "Fretboard", icon: Guitar, href: "/fretboard", description: "Interactive guitar neck & piano" },
            { label: "Tuner", icon: Guitar, href: "/tuner", description: "Chromatic tuner with cent precision" },
            { label: "Metronome", icon: Clock, href: "/metronome", description: "High-precision timing engine" },
            { label: "Jam Studio", icon: Music, href: "/jam", description: "Loop chord progressions & solo" },
        ],
    },
    {
        title: "Theory & Training",
        items: [
            { label: "Chord Library", icon: Music, href: "/chords", description: "1,000+ voicings & diagrams" },
            { label: "Scale Explorer", icon: Layers, href: "/scales", description: "Visualize modes & exotic scales" },
            { label: "Theory Lab", icon: BookOpen, href: "/theory", description: "Circle of Fifths & harmony" },
            { label: "Ear Training", icon: Trophy, href: "/ear-training", description: "Interval recognition drills" },
            { label: "Blog", icon: BookOpen, href: "/blog", description: "Music theory & AI guides" },
        ],
    },
];

const allItems = menuCategories.flatMap(c => c.items);
const flatItems = [{ label: "Home", icon: Home, href: "/", description: "Dashboard" }, ...allItems];

export const GlobalMenu = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [showInstallGuide, setShowInstallGuide] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const location = useLocation();
    const { isInstalled, isInstallable, promptInstall } = usePWAInstall();

    // Force Dark Mode on Mount
    useEffect(() => {
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
        localStorage.setItem("theme", "dark");
    }, []);

    const close = useCallback(() => {
        setIsOpen(false);
        setFocusedIndex(-1);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            if (e.key === "Escape" && isOpen) {
                close();
                return;
            }

            if (isOpen) {
                if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setFocusedIndex(prev => (prev + 1) % flatItems.length);
                } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setFocusedIndex(prev => (prev - 1 + flatItems.length) % flatItems.length);
                } else if (e.key === "Enter" && focusedIndex >= 0) {
                    e.preventDefault();
                    const link = document.querySelector(`[data-menu-index="${focusedIndex}"]`) as HTMLAnchorElement;
                    link?.click();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, focusedIndex, close]);

    useEffect(() => {
        if (!isOpen) return;

        document.body.style.overflow = "hidden";

        const stopPropagation = (e: Event) => {
            e.stopPropagation();
        };
        const menuEl = document.getElementById("global-menu-panel");
        if (menuEl) {
            menuEl.addEventListener("wheel", stopPropagation, true);
            menuEl.addEventListener("touchmove", stopPropagation, true);
        }

        return () => {
            document.body.style.overflow = "";
            if (menuEl) {
                menuEl.removeEventListener("wheel", stopPropagation, true);
                menuEl.removeEventListener("touchmove", stopPropagation, true);
            }
        };
    }, [isOpen]);

    let flatIndex = 0;

    return (
        <>
            {/* Floating Hamburger Menu Button */}
            <div className="fixed top-5 right-5 z-[90]">
                <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsOpen(true)}
                    className="w-12 h-12 bg-zinc-950 border border-white/[0.08] hover:border-white/20 rounded-2xl flex items-center justify-center hover:bg-zinc-900 transition-all shadow-xl group"
                    aria-label="Open navigation menu"
                >
                    <Menu className="w-5 h-5 text-zinc-400 group-hover:text-zinc-100 transition-colors" />
                </motion.button>
            </div>

            {/* Sidebar Drawer Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={close}
                            className="fixed inset-0 z-[99] bg-black/60"
                        />

                        {/* Sidebar Drawer */}
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 320 }}
                            className="fixed top-0 right-0 h-full z-[100] w-full sm:w-[420px] bg-zinc-950 border-l border-zinc-900 flex flex-col shadow-2xl"
                            id="global-menu-panel"
                        >
                            {/* Top Header */}
                            <div className="flex items-center justify-between p-6 border-b border-zinc-900">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-white/[0.08] flex items-center justify-center overflow-hidden">
                                        <img src="/logo.png" alt="Guitariz" className="w-6 h-6 rounded-md" />
                                    </div>
                                    <div>
                                        <span className="text-sm font-semibold text-zinc-100 tracking-tight">Guitariz</span>
                                        <span className="text-[10px] text-zinc-400 ml-1.5 font-bold tracking-wider uppercase bg-zinc-900 px-1.5 py-0.5 rounded border border-white/5">STUDIO</span>
                                    </div>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.05, rotate: 90 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={close}
                                    className="w-9 h-9 rounded-xl bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center transition-colors border border-white/[0.06]"
                                    aria-label="Close menu"
                                >
                                    <X className="w-4 h-4 text-zinc-400 hover:text-white" />
                                </motion.button>
                            </div>

                            {/* Scrollable Menu Items */}
                            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 custom-scrollbar">
                                {/* Home / Dashboard Link */}
                                <div className="space-y-2">
                                    <Link
                                        to="/"
                                        onClick={close}
                                        data-menu-index={0}
                                        className={cn(
                                            "flex items-center gap-3.5 p-3.5 rounded-xl border transition-all group relative overflow-hidden",
                                            focusedIndex === 0 
                                                ? "border-emerald-500/30 bg-emerald-500/[0.03]" 
                                                : "border-white/[0.04] bg-white/[0.01] hover:border-emerald-500/20 hover:bg-white/[0.02]",
                                            location.pathname === "/" && "border-emerald-500/30 bg-emerald-500/[0.02]"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-9 h-9 rounded-lg flex items-center justify-center transition-all shrink-0",
                                            location.pathname === "/"
                                                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                                                : "bg-zinc-900 border border-white/[0.05] text-zinc-400 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/25 group-hover:text-emerald-400"
                                        )}>
                                            <Home className="w-4.5 h-4.5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className={cn(
                                                "text-sm font-medium transition-colors",
                                                location.pathname === "/" ? "text-zinc-100 font-semibold" : "text-zinc-300 group-hover:text-zinc-100"
                                            )}>
                                                Home Dashboard
                                            </span>
                                            <p className="text-[11px] text-zinc-550 group-hover:text-zinc-400 transition-colors mt-0.5 truncate">Access all tools & utilities</p>
                                        </div>
                                    </Link>
                                </div>

                                {/* Dynamic Category Links */}
                                {menuCategories.map((category) => (
                                    <div key={category.title} className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-550">
                                                {category.title}
                                            </span>
                                            <div className="h-[1px] flex-1 ml-4 bg-zinc-900" />
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            {category.items.map((item) => {
                                                const currentFlatIndex = ++flatIndex;
                                                const isActive = location.pathname === item.href;
                                                const isFocused = focusedIndex === currentFlatIndex;

                                                return (
                                                    <Link
                                                        key={item.label}
                                                        to={item.href}
                                                        onClick={close}
                                                        data-menu-index={currentFlatIndex}
                                                        className={cn(
                                                            "flex items-center gap-3.5 p-3.5 rounded-xl border transition-all group relative overflow-hidden",
                                                            isFocused 
                                                                ? "border-emerald-500/30 bg-emerald-500/[0.03]" 
                                                                : "border-white/[0.04] bg-white/[0.01] hover:border-emerald-500/20 hover:bg-white/[0.02]",
                                                            isActive && "border-emerald-500/30 bg-emerald-500/[0.03]"
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "w-9 h-9 rounded-lg flex items-center justify-center transition-all shrink-0",
                                                            isActive
                                                                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                                                                : "bg-zinc-900 border border-white/[0.05] text-zinc-400 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/25 group-hover:text-emerald-400"
                                                        )}>
                                                            <item.icon className="w-4 h-4" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className={cn(
                                                                    "text-sm font-medium transition-colors",
                                                                    isActive ? "text-zinc-100 font-semibold" : "text-zinc-300 group-hover:text-zinc-100"
                                                                )}>
                                                                    {item.label}
                                                                </span>
                                                                {item.badge && (
                                                                    <span className="px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                                        {item.badge}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-[11px] text-zinc-550 group-hover:text-zinc-400 transition-colors mt-0.5 truncate">{item.description}</p>
                                                        </div>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pinned Sticky Footer - Always Visible */}
                            <div className="p-6 border-t border-zinc-900 bg-zinc-950 flex flex-col gap-3">
                                {/* Buy me a coffee */}
                                <a
                                    href="https://ko-fi.com/abhi9vaidya"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2.5 h-11 px-4 rounded-xl bg-amber-500/[0.02] border border-amber-500/[0.15] hover:bg-amber-500/[0.08] hover:border-amber-500/30 text-amber-500 text-xs font-semibold transition-all"
                                >
                                    <Coffee className="w-4 h-4" />
                                    <span>Support: Buy me a coffee</span>
                                </a>

                                {/* Install PWA */}
                                {!isInstalled ? (
                                    <button
                                        onClick={async () => {
                                            if (isInstallable) {
                                                await promptInstall();
                                            } else {
                                                setShowInstallGuide(true);
                                            }
                                        }}
                                        className="flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-white/[0.02] border border-white/[0.08] hover:bg-white/[0.05] hover:border-white/20 text-zinc-300 text-xs font-semibold transition-all"
                                    >
                                        <Download className="w-4 h-4 text-emerald-400" />
                                        <span>Install App PWA</span>
                                    </button>
                                ) : (
                                    <div className="flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 text-xs font-semibold">
                                        <Check className="w-4 h-4" />
                                        <span>PWA Installed</span>
                                    </div>
                                )}

                                {/* GitHub & Version Link */}
                                <div className="flex items-center justify-between mt-2 pt-2 text-[10px] text-zinc-550 border-t border-zinc-900/50">
                                    <a
                                        href="https://github.com/Guitariz/Guitariz"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 hover:text-zinc-300 transition-colors font-medium"
                                    >
                                        <Github className="w-3.5 h-3.5" />
                                        <span>Open Source GitHub</span>
                                    </a>
                                    <span className="flex items-center gap-1.5 font-semibold">
                                        <Sparkles className="w-3 h-3 text-zinc-700 animate-pulse" />
                                        v1.7.0
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <InstallGuide isOpen={showInstallGuide} onClose={() => setShowInstallGuide(false)} />
        </>
    );
};