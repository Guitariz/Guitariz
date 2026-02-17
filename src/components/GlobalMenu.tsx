import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import {
    Menu,
    X,
    Home,
    Headphones,
    Grid3X3,
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
            { label: "Fretboard", icon: Grid3X3, href: "/fretboard", description: "Interactive guitar neck & piano" },
            { label: "Tuner", icon: Guitar, href: "/tuner", description: "Chromatic tuner with cent precision" },
            { label: "Metronome", icon: Clock, href: "/metronome", description: "High-precision timing engine" },
        ],
    },
    {
        title: "Theory & Training",
        items: [
            { label: "Chord Library", icon: Music, href: "/chords", description: "1,000+ voicings & diagrams" },
            { label: "Scale Explorer", icon: Layers, href: "/scales", description: "Visualize modes & exotic scales" },
            { label: "Theory Lab", icon: BookOpen, href: "/theory", description: "Circle of Fifths & harmony" },
            { label: "Ear Training", icon: Trophy, href: "/ear-training", description: "Interval recognition drills" },
        ],
    },
];

const allItems = menuCategories.flatMap(c => c.items);

// Flat item index for keyboard navigation
const flatItems = [{ label: "Home", icon: Home, href: "/", description: "Dashboard" }, ...allItems];

export const GlobalMenu = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [showInstallGuide, setShowInstallGuide] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const location = useLocation();
    const { isInstalled, isInstallable, promptInstall } = usePWAInstall();

    const close = useCallback(() => {
        setIsOpen(false);
        setFocusedIndex(-1);
    }, []);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Prevent opening while typing in an input
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
                    // Trigger navigation via programmatic click on the focused link
                    const link = document.querySelector(`[data-menu-index="${focusedIndex}"]`) as HTMLAnchorElement;
                    link?.click();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, focusedIndex, close]);

    // Prevent page scroll (including Lenis) when menu is open
    useEffect(() => {
        if (!isOpen) return;

        document.body.style.overflow = "hidden";

        // Stop wheel/touch from reaching Lenis
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
            {/* Floating Menu Button */}
            <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => setIsOpen(true)}
                className="fixed top-5 right-5 z-[90] w-12 h-12 bg-[#111]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl flex items-center justify-center hover:bg-white/[0.08] transition-all shadow-[0_8px_32px_rgba(0,0,0,0.4)] group"
                aria-label="Open navigation menu"
            >
                <Menu className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
            </motion.button>

            {/* Full-Screen Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop with blur */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100]"
                            onClick={close}
                        />

                        {/* Menu Panel - Slide from right */}
                        <motion.div
                            initial={{ x: "100%", opacity: 0.5 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: "100%", opacity: 0 }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            className="fixed top-0 right-0 h-full w-[420px] max-w-[92vw] z-[101] flex flex-col overscroll-contain"
                            id="global-menu-panel"
                        >
                            {/* Glass panel background */}
                            <div className="absolute inset-0 bg-[#070707]/95 backdrop-blur-2xl border-l border-white/[0.06]" />
                            {/* Subtle top gradient accent */}
                            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                            {/* Ambient glow */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/[0.03] rounded-full blur-[100px] pointer-events-none" />
                            <div className="absolute bottom-0 right-0 w-48 h-48 bg-blue-500/[0.03] rounded-full blur-[80px] pointer-events-none" />

                            {/* Content */}
                            <div className="relative z-10 flex flex-col h-full min-h-0">
                                {/* Header */}
                                <div className="flex items-center justify-between px-6 py-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-white/10 to-white/[0.03] border border-white/[0.08] flex items-center justify-center overflow-hidden">
                                            <img
                                                src="/logo.png"
                                                alt="Guitariz"
                                                className="w-6 h-6 rounded-md"
                                            />
                                        </div>
                                        <div>
                                            <span className="text-sm font-semibold text-white tracking-tight">Guitariz</span>
                                            <span className="text-[10px] text-white/30 ml-1.5 font-medium">Studio</span>
                                        </div>
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.1, rotate: 90 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={close}
                                        className="w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition-colors border border-white/[0.06]"
                                        aria-label="Close menu"
                                    >
                                        <X className="w-4 h-4 text-white/60" />
                                    </motion.button>
                                </div>

                                {/* Divider */}
                                <div className="mx-6 h-[1px] bg-gradient-to-r from-white/[0.06] via-white/[0.04] to-transparent" />

                                {/* Scrollable Nav */}
                                <nav className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-4 py-4" aria-label="Main navigation">
                                    {/* Home Link */}
                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.05, duration: 0.3 }}
                                    >
                                        <Link
                                            to="/"
                                            onClick={close}
                                            data-menu-index={0}
                                            className={cn(
                                                "flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all group relative",
                                                focusedIndex === 0 && "ring-1 ring-white/20",
                                                location.pathname === "/"
                                                    ? "bg-white/[0.06] text-white"
                                                    : "text-white/50 hover:text-white hover:bg-white/[0.04]"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-9 h-9 rounded-lg flex items-center justify-center transition-all shrink-0",
                                                location.pathname === "/"
                                                    ? "bg-white/10 border border-white/10"
                                                    : "bg-white/[0.03] border border-white/[0.05] group-hover:bg-white/[0.06] group-hover:border-white/[0.1]"
                                            )}>
                                                <Home className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className="text-sm font-medium">Home</span>
                                                <p className="text-[11px] text-white/30 truncate">Dashboard & overview</p>
                                            </div>
                                            {location.pathname === "/" && (
                                                <motion.div
                                                    layoutId="menu-active-indicator"
                                                    className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"
                                                />
                                            )}
                                        </Link>
                                    </motion.div>

                                    {/* Categories */}
                                    {menuCategories.map((category, catIdx) => (
                                        <div key={category.title} className="mt-5">
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 0.1 + catIdx * 0.05 }}
                                                className="flex items-center gap-2 px-4 mb-2"
                                            >
                                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/25">
                                                    {category.title}
                                                </span>
                                                <div className="flex-1 h-[1px] bg-white/[0.04]" />
                                            </motion.div>

                                            <div className="space-y-0.5">
                                                {category.items.map((item, itemIdx) => {
                                                    const currentFlatIndex = ++flatIndex;
                                                    const isActive = location.pathname === item.href;
                                                    const isFocused = focusedIndex === currentFlatIndex;
                                                    const globalDelay = 0.08 + (catIdx * 0.04) + (itemIdx * 0.03);

                                                    return (
                                                        <motion.div
                                                            key={item.label}
                                                            initial={{ opacity: 0, x: 20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: globalDelay, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                                                        >
                                                            <Link
                                                                to={item.href}
                                                                onClick={close}
                                                                data-menu-index={currentFlatIndex}
                                                                className={cn(
                                                                    "flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all group relative",
                                                                    isFocused && "ring-1 ring-white/20",
                                                                    isActive
                                                                        ? "bg-white/[0.06] text-white"
                                                                        : "text-white/50 hover:text-white hover:bg-white/[0.04]"
                                                                )}
                                                            >
                                                                <div className={cn(
                                                                    "w-9 h-9 rounded-lg flex items-center justify-center transition-all shrink-0",
                                                                    isActive
                                                                        ? "bg-emerald-500/15 border border-emerald-500/20 text-emerald-400"
                                                                        : "bg-white/[0.03] border border-white/[0.05] group-hover:bg-white/[0.06] group-hover:border-white/[0.1]"
                                                                )}>
                                                                    <item.icon className="w-4 h-4" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-sm font-medium">{item.label}</span>
                                                                        {item.badge && (
                                                                            <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md bg-gradient-to-r from-violet-500/20 to-blue-500/20 text-violet-300 border border-violet-500/20">
                                                                                {item.badge}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-[11px] text-white/30 truncate">{item.description}</p>
                                                                </div>
                                                                {isActive && (
                                                                    <motion.div
                                                                        layoutId="menu-active-indicator"
                                                                        className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"
                                                                    />
                                                                )}
                                                            </Link>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </nav>

                                {/* Footer */}
                                <div className="relative px-6 py-5 space-y-3 border-t border-white/[0.04]">
                                    {/* Subtle glow at bottom */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-white/[0.01] to-transparent pointer-events-none" />

                                    {/* Install / Installed */}
                                    {!isInstalled && (
                                        <motion.button
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.99 }}
                                            onClick={async () => {
                                                if (isInstallable) {
                                                    await promptInstall();
                                                } else {
                                                    setShowInstallGuide(true);
                                                }
                                            }}
                                            className="relative w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl transition-all overflow-hidden group"
                                        >
                                            {/* Button gradient background */}
                                            <div className="absolute inset-0 bg-gradient-to-r from-white/[0.08] to-white/[0.04] border border-white/[0.1] rounded-xl group-hover:from-white/[0.12] group-hover:to-white/[0.06] transition-all" />
                                            <Download className={cn("w-4 h-4 text-white/80 relative z-10", isInstallable && "animate-bounce")} />
                                            <span className="text-sm font-semibold text-white/90 relative z-10">Install App</span>
                                        </motion.button>
                                    )}

                                    {isInstalled && (
                                        <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/[0.15]">
                                            <Check className="w-4 h-4 text-emerald-400" />
                                            <span className="text-sm font-medium text-emerald-400/90">App Installed</span>
                                        </div>
                                    )}

                                    {/* Bottom bar: version + links */}
                                    <div className="flex items-center justify-between relative z-10">
                                        <div className="flex items-center gap-1.5">
                                            <Sparkles className="w-3 h-3 text-white/15" />
                                            <span className="text-[10px] text-white/20 font-medium">v1.7 • Open Source</span>
                                        </div>
                                        <a
                                            href="https://github.com/abhi9vaidya/Guitariz"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 text-[10px] text-white/20 hover:text-white/50 transition-colors"
                                        >
                                            <Github className="w-3 h-3" />
                                            <span>GitHub</span>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Install Guide Dialog */}
            <InstallGuide isOpen={showInstallGuide} onClose={() => setShowInstallGuide(false)} />
        </>
    );
};
