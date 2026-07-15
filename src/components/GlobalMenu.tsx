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

    // Framer motion variants for the fullscreen layout
    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.04,
                delayChildren: 0.1
            }
        },
        exit: {
            opacity: 0,
            transition: {
                staggerChildren: 0.02,
                staggerDirection: -1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { 
            opacity: 1, 
            y: 0, 
            transition: { 
                type: "spring", 
                stiffness: 260, 
                damping: 25 
            } 
        },
        exit: { opacity: 0, y: -10, transition: { duration: 0.15 } }
    };

    let flatIndex = 0;

    return (
        <>
            {/* Elegant Floating Hamburger Menu Button */}
            <div className="fixed top-5 right-5 z-[90]">
                <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsOpen(true)}
                    className="w-12 h-12 bg-zinc-950/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl flex items-center justify-center hover:bg-zinc-900 transition-all shadow-[0_8px_32px_rgba(0,0,0,0.5)] group"
                    aria-label="Open navigation menu"
                >
                    <Menu className="w-5 h-5 text-zinc-400 group-hover:text-zinc-100 transition-colors" />
                </motion.button>
            </div>

            {/* Premium Full-Screen Overlay Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                        exit="exit"
                        className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-3xl overflow-y-auto px-6 py-6 sm:px-12 sm:py-8 flex flex-col justify-between"
                        id="global-menu-panel"
                    >
                        {/* Ambient decorative glowing backgrounds */}
                        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-rose-500/[0.02] rounded-full blur-[120px] pointer-events-none" />
                        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-blue-500/[0.02] rounded-full blur-[100px] pointer-events-none" />

                        {/* Top Header */}
                        <motion.div variants={itemVariants} className="max-w-6xl mx-auto w-full flex items-center justify-between z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/10 to-white/[0.03] border border-white/[0.08] flex items-center justify-center overflow-hidden">
                                    <img src="/logo.png" alt="Guitariz" className="w-7 h-7 rounded-md" />
                                </div>
                                <div>
                                    <span className="text-base font-semibold text-zinc-100 tracking-tight">Guitariz</span>
                                    <span className="text-xs text-rose-500 ml-1.5 font-medium tracking-wider">STUDIO</span>
                                </div>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.05, rotate: 90 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={close}
                                className="w-10 h-10 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition-colors border border-white/[0.06]"
                                aria-label="Close menu"
                            >
                                <X className="w-5 h-5 text-zinc-400" />
                            </motion.button>
                        </motion.div>

                        {/* Main Grid Content */}
                        <div className="max-w-6xl mx-auto w-full py-12 md:py-16 my-auto z-10 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
                            {/* Dashboard / Home Link Span */}
                            <motion.div variants={itemVariants} className="md:col-span-12">
                                <Link
                                    to="/"
                                    onClick={close}
                                    data-menu-index={0}
                                    className={cn(
                                        "flex items-center gap-4 p-4 rounded-2xl transition-all border group relative overflow-hidden",
                                        focusedIndex === 0 ? "border-rose-500/30 bg-rose-500/[0.03]" : "border-white/[0.04] bg-white/[0.01] hover:border-white/[0.08] hover:bg-white/[0.03]",
                                        location.pathname === "/" && "border-rose-500/20 bg-rose-500/[0.02]"
                                    )}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-rose-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                                        <Home className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <span className="text-sm font-semibold text-zinc-200 group-hover:text-zinc-100 transition-colors">Home Studio Dashboard</span>
                                        <p className="text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors mt-0.5">Access all professional audio analysis and music theory tools</p>
                                    </div>
                                </Link>
                            </motion.div>

                            {/* Dynamic Category Columns */}
                            {menuCategories.map((category, catIdx) => (
                                <div key={category.title} className="md:col-span-4 flex flex-col gap-6">
                                    <motion.div variants={itemVariants} className="flex items-center gap-3">
                                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                                            {category.title}
                                        </span>
                                        <div className="flex-1 h-[1px] bg-white/[0.06]" />
                                    </motion.div>

                                    <div className="flex flex-col gap-3">
                                        {category.items.map((item, itemIdx) => {
                                            const currentFlatIndex = ++flatIndex;
                                            const isActive = location.pathname === item.href;
                                            const isFocused = focusedIndex === currentFlatIndex;

                                            return (
                                                <motion.div key={item.label} variants={itemVariants}>
                                                    <Link
                                                        to={item.href}
                                                        onClick={close}
                                                        data-menu-index={currentFlatIndex}
                                                        className={cn(
                                                            "flex items-center gap-3.5 p-3.5 rounded-2xl border transition-all group relative overflow-hidden",
                                                            isFocused ? "border-rose-500/30 bg-rose-500/[0.03]" : "border-white/[0.04] bg-white/[0.01] hover:border-rose-500/20 hover:bg-white/[0.03]",
                                                            isActive && "border-rose-500/30 bg-rose-500/[0.03]"
                                                        )}
                                                    >
                                                        <div className="absolute inset-0 bg-gradient-to-r from-rose-500/[0.01] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        <div className={cn(
                                                            "w-9 h-9 rounded-lg flex items-center justify-center transition-all shrink-0",
                                                            isActive
                                                                ? "bg-rose-500/15 border border-rose-500/25 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.1)]"
                                                                : "bg-white/[0.03] border border-white/[0.05] text-zinc-400 group-hover:bg-rose-500/10 group-hover:border-rose-500/20 group-hover:text-rose-400"
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
                                                                    <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                                                        {item.badge}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-[11px] text-zinc-500 group-hover:text-zinc-400 transition-colors mt-0.5 truncate">{item.description}</p>
                                                        </div>
                                                    </Link>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Bottom Footer Actions */}
                        <motion.div variants={itemVariants} className="max-w-6xl mx-auto w-full pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-6 z-10 text-xs text-zinc-500">
                            {/* Coffee link */}
                            <a
                                href="https://ko-fi.com/abhi9vaidya"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-amber-500/[0.04] border border-amber-500/[0.15] hover:bg-amber-500/[0.08] hover:border-amber-500/30 text-amber-500 transition-all font-semibold"
                            >
                                <Coffee className="w-4 h-4" />
                                <span>Support: Buy me a coffee</span>
                            </a>

                            {/* PWA Install Button */}
                            {!isInstalled ? (
                                <button
                                    onClick={async () => {
                                        if (isInstallable) {
                                            await promptInstall();
                                        } else {
                                            setShowInstallGuide(true);
                                        }
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/20 text-zinc-300 transition-all"
                                >
                                    <Download className="w-4 h-4 text-rose-500" />
                                    <span>Install App PWA</span>
                                </button>
                            ) : (
                                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-emerald-400">
                                    <Check className="w-4 h-4" />
                                    <span>PWA Installed</span>
                                </div>
                            )}

                            {/* GitHub Info */}
                            <div className="flex items-center gap-4">
                                <a
                                    href="https://github.com/Guitariz/Guitariz"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-zinc-500 hover:text-zinc-350 transition-colors"
                                >
                                    <Github className="w-4 h-4" />
                                    <span>Open Source GitHub</span>
                                </a>
                                <span className="flex items-center gap-1.5 text-zinc-600 font-medium">
                                    <Sparkles className="w-3 h-3 text-zinc-700" />
                                    v1.7.0
                                </span>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <InstallGuide isOpen={showInstallGuide} onClose={() => setShowInstallGuide(false)} />
        </>
    );
};