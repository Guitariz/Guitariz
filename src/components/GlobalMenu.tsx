import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import {
    Menu,
    X,
    Home,
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
    Github,
    Coffee,
    MessageSquarePlus,
    Compass,
    Sliders,
    Flame,
    Headphones,
    Radio,
    Sparkles,
    Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { InstallGuide } from "@/components/InstallGuide";
import { openFeedbackModal } from "@/components/FeedbackModal";

interface MenuItem {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    href: string;
    description: string;
    badge?: string;
}

interface MenuCategory {
    title: string;
    description?: string;
    items: MenuItem[];
}

const MENU_CATEGORIES: MenuCategory[] = [
    {
        title: "AI Audio Tools",
        description: "Next-generation neural audio engines & smart processing",
        items: [
            {
                label: "Chord AI",
                icon: Mic,
                href: "/chord-ai",
                description: "Neural audio chord detection & sync",
                badge: "AI",
            },
            {
                label: "Stem Separator",
                icon: Split,
                href: "/stem-separator",
                description: "Isolate vocals, drums, bass & stems",
                badge: "AI",
            },
            {
                label: "Vocal Splitter",
                icon: Headphones,
                href: "/vocal-splitter",
                description: "Fast 2-stem vocal & instrumental isolation",
            },
            {
                label: "BPM Detector",
                icon: Clock,
                href: "/bpm-detector",
                description: "Audio tempo & tap tempo engine",
                badge: "NEW",
            },
            {
                label: "Key Detector",
                icon: Radio,
                href: "/key-detector",
                description: "Find musical key & scale signatures",
                badge: "NEW",
            },
        ],
    },
    {
        title: "Instruments & Theory",
        description: "Interactive fretboards, voicings & harmonic theory",
        items: [
            {
                label: "Interactive Fretboard",
                icon: Guitar,
                href: "/fretboard",
                description: "Virtual neck with scales & chord mapping",
            },
            {
                label: "Chord Library",
                icon: Layers,
                href: "/chords",
                description: "1,000+ voicings, fingerings & audio engine",
            },
            {
                label: "Scale Explorer",
                icon: Music,
                href: "/scales",
                description: "Western modes & 10 Indian Thaats",
            },
            {
                label: "Circle of Fifths",
                icon: Compass,
                href: "/theory",
                description: "Interactive harmonic key lab",
            },
            {
                label: "Jam Studio",
                icon: Sliders,
                href: "/jam",
                description: "Loop chord progressions & practice",
            },
        ],
    },
    {
        title: "Studio Essentials",
        description: "Everyday precision utilities for musicians",
        items: [
            {
                label: "Chromatic Tuner",
                icon: Guitar,
                href: "/tuner",
                description: "Accurate pitch detector with mic input",
            },
            {
                label: "Pro Metronome",
                icon: Clock,
                href: "/metronome",
                description: "Polyrhythms & subdivision trainer",
            },
            {
                label: "Ear Training",
                icon: Trophy,
                href: "/ear-training",
                description: "Interval, chord & pitch challenges",
            },
            {
                label: "Theory Blog",
                icon: BookOpen,
                href: "/blog",
                description: "Music theory & production guides",
            },
            {
                label: "Recommended Gear",
                icon: Flame,
                href: "/gear",
                description: "Curated guitar tools & accessories",
            },
        ],
    },
];

export const GlobalMenu = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [showInstallGuide, setShowInstallGuide] = useState(false);
    const [isDesktop, setIsDesktop] = useState(false);
    const desktopScrollRef = useRef<HTMLElement | null>(null);
    const location = useLocation();
    const { isInstalled, isInstallable, promptInstall } = usePWAInstall();

    // Dark mode enforcement
    useEffect(() => {
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
        localStorage.setItem("theme", "dark");
    }, []);

    // Screen breakpoint listener (>= 1024px is desktop command center takeover)
    useEffect(() => {
        const checkDesktop = () => {
            setIsDesktop(window.innerWidth >= 1024);
        };
        checkDesktop();
        window.addEventListener("resize", checkDesktop);
        return () => window.removeEventListener("resize", checkDesktop);
    }, []);

    const close = useCallback(() => {
        setIsOpen(false);
    }, []);

    // Escape key listener
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                close();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, close]);

    // Prevent body scroll and pause global smooth-scroll (Lenis) when menu is open
    useEffect(() => {
        const lenis = (window as unknown as { lenis?: { stop: () => void; start: () => void } }).lenis;

        if (isOpen) {
            document.body.style.overflow = "hidden";
            lenis?.stop();
        } else {
            document.body.style.overflow = "";
            lenis?.start();
        }
        return () => {
            document.body.style.overflow = "";
            lenis?.start();
        };
    }, [isOpen]);

    return (
        <>
            {/* Minimalist Floating Hamburger Button */}
            <div className="fixed top-5 right-5 z-[90] pointer-events-auto">
                <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setIsOpen(true)}
                    className="w-11 h-11 bg-[#121214]/90 hover:bg-[#18181b] backdrop-blur-xl border border-white/[0.08] hover:border-white/20 rounded-xl flex items-center justify-center transition-all duration-200 shadow-[0_8px_24px_rgba(0,0,0,0.6)] group"
                    aria-label="Open Studio Menu"
                >
                    <Menu className="w-4 h-4 text-zinc-300 group-hover:text-white transition-colors duration-150" />
                </motion.button>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* ========================================================================= */}
                        {/* DESKTOP (≥1024px): Full-Screen Command Center Takeover */}
                        {/* ========================================================================= */}
                        {isDesktop ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.18, ease: "easeOut" }}
                                className="fixed inset-0 z-[100] bg-[#09090b] text-zinc-100 flex flex-col h-screen max-h-screen overflow-hidden"
                                id="global-menu-desktop-takeover"
                                data-lenis-prevent="true"
                            >
                                {/* Desktop Header (Clean, intentional, no glow/bloom effects) */}
                                <header className="relative z-10 shrink-0 border-b border-white/[0.08] bg-[#0c0c0e]">
                                    <div className="max-w-7xl mx-auto w-full px-8 py-4 flex items-center justify-between">
                                        {/* Logo & Command Center Title */}
                                        <div className="flex items-center gap-3">
                                            <img src="/logo-nobg.png" alt="Guitariz Logo" className="w-8 h-8 object-contain shrink-0" />
                                            <div>
                                                <div className="flex items-center gap-2.5">
                                                    <span className="text-base font-extrabold text-white tracking-tight">Guitariz</span>
                                                    <span className="text-[10px] font-black tracking-widest uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                        <Activity className="w-2.5 h-2.5" />
                                                        COMMAND CENTER
                                                    </span>
                                                </div>
                                                <span className="text-xs text-zinc-400 font-medium">
                                                    AI-Powered Audio & Theory Studio Suite
                                                </span>
                                            </div>
                                        </div>

                                        {/* Actions (Home, ESC Hint, Close) */}
                                        <div className="flex items-center gap-2.5">
                                            {/* Home Shortcut Button */}
                                            <Link
                                                to="/"
                                                onClick={close}
                                                className={cn(
                                                    "w-9 h-9 rounded-xl border flex items-center justify-center transition-all duration-150",
                                                    location.pathname === "/"
                                                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                                        : "bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.1] text-zinc-400 hover:text-white"
                                                )}
                                                title="Home Overview"
                                                aria-label="Home Overview"
                                            >
                                                <Home className="w-4 h-4" />
                                            </Link>

                                            <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-[11px] font-mono font-medium text-zinc-400 bg-white/[0.04] border border-white/[0.08] rounded-md shadow-sm">
                                                ESC
                                            </kbd>
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={close}
                                                className="w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white transition-all duration-150"
                                                aria-label="Close command center"
                                            >
                                                <X className="w-4 h-4" />
                                            </motion.button>
                                        </div>
                                    </div>
                                </header>
                                {/* Desktop Scrollable Content Grid (Native wheel scrolling with data-lenis-prevent) */}
                                <main
                                    ref={desktopScrollRef}
                                    data-lenis-prevent="true"
                                    onWheel={(e) => e.stopPropagation()}
                                    className="relative z-10 flex-1 min-h-0 overflow-y-auto overscroll-contain [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.12)_transparent] hover:[scrollbar-color:rgba(255,255,255,0.25)_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 hover:[&::-webkit-scrollbar-thumb]:bg-white/25 [&::-webkit-scrollbar-thumb]:rounded-full"
                                >
                                    <div className="max-w-7xl mx-auto w-full px-8 py-8 space-y-9 pb-4">
                                        
                                        {/* 1. TOP SECTION: AI Audio Tools (Spacious High-Tech Card Grid) */}
                                        <section className="space-y-3.5">
                                            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
                                                <div>
                                                    <h2 className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400 flex items-center gap-2">
                                                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                                                        {MENU_CATEGORIES[0].title}
                                                    </h2>
                                                    <p className="text-xs text-zinc-500 mt-0.5">
                                                        {MENU_CATEGORIES[0].description}
                                                    </p>
                                                </div>
                                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                                                    Neural Engine
                                                </span>
                                            </div>

                                            {/* AI Cards Grid */}
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
                                                {MENU_CATEGORIES[0].items.map((item) => {
                                                    const isActive = location.pathname.startsWith(item.href);

                                                    return (
                                                        <div key={item.href}>
                                                            <Link
                                                                to={item.href}
                                                                onClick={close}
                                                                className={cn(
                                                                    "relative group flex flex-col justify-between p-4 rounded-2xl border transition-all duration-200 h-full min-h-[140px]",
                                                                    isActive
                                                                        ? "bg-emerald-500/[0.06] border-emerald-500/40 shadow-sm"
                                                                        : "bg-zinc-900/50 hover:bg-zinc-900/90 border-white/[0.06] hover:border-white/20"
                                                                )}
                                                            >
                                                                {/* Spotify signature left-edge accent bar */}
                                                                <div
                                                                    className={cn(
                                                                        "absolute left-0 top-3 bottom-3 w-1 rounded-r-full transition-all duration-200",
                                                                        isActive
                                                                            ? "bg-emerald-400 opacity-100"
                                                                            : "bg-emerald-400/0 opacity-0 group-hover:bg-emerald-400/70 group-hover:opacity-100"
                                                                    )}
                                                                />

                                                                <div className="flex items-start justify-between gap-2">
                                                                    <div
                                                                        className={cn(
                                                                            "w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-200",
                                                                            isActive
                                                                                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-sm"
                                                                                : "bg-zinc-800/80 border-white/[0.08] text-zinc-400 group-hover:text-emerald-400 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/20"
                                                                        )}
                                                                    >
                                                                        <item.icon className="w-5 h-5" />
                                                                    </div>

                                                                    {item.badge && (
                                                                        <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                                                            {item.badge}
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                <div className="mt-3">
                                                                    <div
                                                                        className={cn(
                                                                            "text-sm font-bold tracking-tight transition-colors duration-150",
                                                                            isActive
                                                                                ? "text-emerald-400"
                                                                                : "text-zinc-100 group-hover:text-white"
                                                                        )}
                                                                    >
                                                                        {item.label}
                                                                    </div>
                                                                    <div className="text-[11px] text-zinc-400 group-hover:text-zinc-300 mt-1 line-clamp-2 leading-relaxed">
                                                                        {item.description}
                                                                    </div>
                                                                </div>
                                                            </Link>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </section>

                                        {/* 2. TWO-COLUMN SPLIT: Instruments & Theory + Studio Essentials */}
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-2">
                                            
                                            {/* Column 1: Instruments & Theory */}
                                            <section className="space-y-3.5">
                                                <div className="border-b border-white/[0.06] pb-2.5">
                                                    <h2 className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400 flex items-center gap-2">
                                                        <Guitar className="w-3.5 h-3.5 text-zinc-400" />
                                                        {MENU_CATEGORIES[1].title}
                                                    </h2>
                                                    <p className="text-xs text-zinc-500 mt-0.5">
                                                        {MENU_CATEGORIES[1].description}
                                                    </p>
                                                </div>

                                                <div className="space-y-1.5">
                                                    {MENU_CATEGORIES[1].items.map((item) => {
                                                        const isActive = location.pathname.startsWith(item.href);

                                                        return (
                                                            <div key={item.href}>
                                                                <Link
                                                                    to={item.href}
                                                                    onClick={close}
                                                                    className={cn(
                                                                        "relative flex items-center gap-3.5 p-3 rounded-xl border transition-all duration-150 group",
                                                                        isActive
                                                                            ? "bg-white/[0.08] border-white/[0.12] text-white shadow-sm"
                                                                            : "bg-zinc-900/30 border-white/[0.04] hover:bg-zinc-900/80 hover:border-white/10 text-zinc-300"
                                                                    )}
                                                                >
                                                                    {/* Left accent bar */}
                                                                    <div
                                                                        className={cn(
                                                                            "absolute left-0 top-2 bottom-2 w-1 rounded-r-full transition-all duration-200",
                                                                            isActive
                                                                                ? "bg-emerald-400 opacity-100"
                                                                                : "bg-emerald-400/0 opacity-0 group-hover:bg-white/30 group-hover:opacity-100"
                                                                        )}
                                                                    />

                                                                    <div
                                                                        className={cn(
                                                                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-150",
                                                                            isActive
                                                                                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 shadow-sm"
                                                                                : "bg-zinc-800/60 border-white/[0.06] text-zinc-400 group-hover:text-zinc-100 group-hover:bg-zinc-800"
                                                                        )}
                                                                    >
                                                                        <item.icon className="w-5 h-5" />
                                                                    </div>

                                                                    <div className="flex-1 min-w-0">
                                                                        <div
                                                                            className={cn(
                                                                                "text-sm font-semibold tracking-tight transition-colors duration-150",
                                                                                isActive ? "text-emerald-400 font-bold" : "text-zinc-100 group-hover:text-white"
                                                                            )}
                                                                        >
                                                                            {item.label}
                                                                        </div>
                                                                        <div className="text-xs text-zinc-500 group-hover:text-zinc-400 truncate mt-0.5">
                                                                            {item.description}
                                                                        </div>
                                                                    </div>
                                                                </Link>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </section>

                                            {/* Column 2: Studio Essentials */}
                                            <section className="space-y-3.5">
                                                <div className="border-b border-white/[0.06] pb-2.5">
                                                    <h2 className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400 flex items-center gap-2">
                                                        <Sliders className="w-3.5 h-3.5 text-zinc-400" />
                                                        {MENU_CATEGORIES[2].title}
                                                    </h2>
                                                    <p className="text-xs text-zinc-500 mt-0.5">
                                                        {MENU_CATEGORIES[2].description}
                                                    </p>
                                                </div>

                                                <div className="space-y-1.5">
                                                    {MENU_CATEGORIES[2].items.map((item) => {
                                                        const isActive = location.pathname.startsWith(item.href);

                                                        return (
                                                            <div key={item.href}>
                                                                <Link
                                                                    to={item.href}
                                                                    onClick={close}
                                                                    className={cn(
                                                                        "relative flex items-center gap-3.5 p-3 rounded-xl border transition-all duration-150 group",
                                                                        isActive
                                                                            ? "bg-white/[0.08] border-white/[0.12] text-white shadow-sm"
                                                                            : "bg-zinc-900/30 border-white/[0.04] hover:bg-zinc-900/80 hover:border-white/10 text-zinc-300"
                                                                    )}
                                                                >
                                                                    {/* Left accent bar */}
                                                                    <div
                                                                        className={cn(
                                                                            "absolute left-0 top-2 bottom-2 w-1 rounded-r-full transition-all duration-200",
                                                                            isActive
                                                                                ? "bg-emerald-400 opacity-100"
                                                                                : "bg-emerald-400/0 opacity-0 group-hover:bg-white/30 group-hover:opacity-100"
                                                                        )}
                                                                    />

                                                                    <div
                                                                        className={cn(
                                                                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-150",
                                                                            isActive
                                                                                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 shadow-sm"
                                                                                : "bg-zinc-800/60 border-white/[0.06] text-zinc-400 group-hover:text-zinc-100 group-hover:bg-zinc-800"
                                                                        )}
                                                                    >
                                                                        <item.icon className="w-5 h-5" />
                                                                    </div>

                                                                    <div className="flex-1 min-w-0">
                                                                        <div
                                                                            className={cn(
                                                                                "text-sm font-semibold tracking-tight transition-colors duration-150",
                                                                                isActive ? "text-emerald-400 font-bold" : "text-zinc-100 group-hover:text-white"
                                                                            )}
                                                                        >
                                                                            {item.label}
                                                                        </div>
                                                                        <div className="text-xs text-zinc-500 group-hover:text-zinc-400 truncate mt-0.5">
                                                                            {item.description}
                                                                        </div>
                                                                    </div>
                                                                </Link>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </section>
                                        </div>

                                    </div>
                                </main>

                                {/* Desktop Sticky Bottom Action Bar */}
                                <footer className="relative z-10 shrink-0 border-t border-white/[0.08] bg-[#0c0c0e] py-4">
                                    <div className="max-w-7xl mx-auto w-full px-8 flex flex-wrap items-center justify-between gap-4">
                                        
                                        {/* Action Buttons Spread Horizontally */}
                                        <div className="flex items-center gap-3">
                                            {/* Send Feedback */}
                                            <button
                                                onClick={() => {
                                                    close();
                                                    openFeedbackModal("idea");
                                                }}
                                                className="flex items-center gap-2 h-9 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 text-xs font-semibold transition-all duration-150 active:scale-[0.98]"
                                            >
                                                <MessageSquarePlus className="w-4 h-4" />
                                                <span>Send Feedback / Ideas</span>
                                            </button>

                                            {/* Support / Buy Me a Coffee */}
                                            <a
                                                href="https://ko-fi.com/abhi9vaidya"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 h-9 px-4 rounded-xl bg-zinc-900/80 border border-white/[0.08] hover:bg-zinc-800 hover:border-white/20 text-zinc-300 hover:text-white text-xs font-semibold transition-all duration-150 active:scale-[0.98]"
                                            >
                                                <Coffee className="w-4 h-4 text-amber-400" />
                                                <span>Support: Buy me a coffee</span>
                                            </a>

                                            {/* Install App PWA */}
                                            {!isInstalled ? (
                                                <button
                                                    onClick={async () => {
                                                        if (isInstallable) {
                                                            await promptInstall();
                                                        } else {
                                                            setShowInstallGuide(true);
                                                        }
                                                    }}
                                                    className="flex items-center gap-2 h-9 px-4 rounded-xl bg-zinc-900/80 border border-white/[0.08] hover:bg-zinc-800 hover:border-white/20 text-zinc-300 hover:text-white text-xs font-semibold transition-all duration-150 active:scale-[0.98]"
                                                >
                                                    <Download className="w-4 h-4 text-emerald-400" />
                                                    <span>Install Web App (PWA)</span>
                                                </button>
                                            ) : (
                                                <div className="flex items-center gap-2 h-9 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                                                    <Check className="w-4 h-4" />
                                                    <span>PWA Installed & Ready</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Right Meta Info */}
                                        <div className="flex items-center gap-4 text-xs text-zinc-500">
                                            <a
                                                href="https://github.com/Guitariz/Guitariz"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 transition-colors font-medium"
                                            >
                                                <Github className="w-4 h-4" />
                                                <span>Open Source on GitHub</span>
                                            </a>
                                            <span className="text-zinc-700">•</span>
                                            <span className="font-mono text-zinc-500">v2.1.1</span>
                                        </div>
                                    </div>
                                </footer>
                            </motion.div>
                        ) : (
                            /* ========================================================================= */
                            /* MOBILE & TABLET (<1024px): Compact Spotify-Style Slide-Over Drawer */
                            /* ========================================================================= */
                            <>
                                {/* Dim Backdrop */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    onClick={close}
                                    className="fixed inset-0 z-[99] bg-black/75 backdrop-blur-sm"
                                />

                                {/* Drawer Panel */}
                                <motion.div
                                    initial={{ x: "100%" }}
                                    animate={{ x: 0 }}
                                    exit={{ x: "100%" }}
                                    transition={{ type: "spring", damping: 30, stiffness: 320 }}
                                    className="fixed top-0 right-0 h-full z-[100] w-full sm:w-[380px] bg-[#0c0c0e] border-l border-white/[0.08] flex flex-col shadow-[0_0_60px_rgba(0,0,0,0.9)] overflow-hidden"
                                    id="global-menu-mobile-panel"
                                    data-lenis-prevent="true"
                                >
                                    {/* Spotify-style Header Area */}
                                    <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] bg-[#0c0c0e]/95 backdrop-blur-md shrink-0">
                                        <div className="flex items-center gap-2.5">
                                            <img src="/logo-nobg.png" alt="Guitariz Logo" className="w-7 h-7 object-contain shrink-0" />
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-white tracking-tight">Guitariz</span>
                                                    <span className="text-[9px] font-extrabold tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                                                        STUDIO
                                                    </span>
                                                </div>
                                                <span className="text-[10px] text-zinc-500 font-medium">Musician's Suite</span>
                                            </div>
                                        </div>

                                        <motion.button
                                            whileHover={{ scale: 1.06 }}
                                            whileTap={{ scale: 0.94 }}
                                            onClick={close}
                                            className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.06] flex items-center justify-center text-zinc-400 hover:text-white transition-all duration-150"
                                            aria-label="Close menu"
                                        >
                                            <X className="w-4 h-4" />
                                        </motion.button>
                                    </div>

                                    {/* Independently Scrollable Library Tool List */}
                                    <div
                                        data-lenis-prevent="true"
                                        onWheel={(e) => e.stopPropagation()}
                                        className="flex-1 overflow-y-auto overscroll-contain px-3 py-3 space-y-5 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.12)_transparent] hover:[scrollbar-color:rgba(255,255,255,0.25)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 hover:[&::-webkit-scrollbar-thumb]:bg-white/25 [&::-webkit-scrollbar-thumb]:rounded-full"
                                    >
                                        
                                        {/* Top Primary Row (Home Dashboard item) */}
                                        <div className="px-1 pt-1">
                                            {(() => {
                                                const isHome = location.pathname === "/";
                                                return (
                                                    <Link
                                                        to="/"
                                                        onClick={close}
                                                        className={cn(
                                                            "relative flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all duration-150 group",
                                                            isHome
                                                                ? "bg-white/[0.08] border-white/[0.12] text-white shadow-sm"
                                                                : "bg-transparent border-transparent hover:bg-white/[0.05] text-zinc-300"
                                                        )}
                                                    >
                                                        {/* Left-edge Spotify accent indicator */}
                                                        <div
                                                            className={cn(
                                                                "absolute left-0 top-2 bottom-2 w-1 rounded-r-full transition-all duration-200",
                                                                isHome ? "bg-emerald-400 opacity-100" : "bg-emerald-400/0 opacity-0 group-hover:bg-white/30 group-hover:opacity-100"
                                                            )}
                                                        />

                                                        {/* Icon Avatar Slot */}
                                                        <div
                                                            className={cn(
                                                                "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border transition-all duration-150",
                                                                isHome
                                                                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                                                                    : "bg-zinc-900 border-white/[0.06] text-zinc-400 group-hover:text-white group-hover:bg-zinc-800"
                                                            )}
                                                        >
                                                            <Home className="w-4 h-4" />
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <div
                                                                className={cn(
                                                                    "text-[13px] font-semibold tracking-tight transition-colors duration-150",
                                                                    isHome ? "text-emerald-400" : "text-zinc-100 group-hover:text-white"
                                                                )}
                                                            >
                                                                Home Dashboard
                                                            </div>
                                                            <div className="text-[11px] text-zinc-500 group-hover:text-zinc-400 truncate mt-0.5 font-normal">
                                                                Studio overview & quick launcher
                                                            </div>
                                                        </div>
                                                    </Link>
                                                );
                                            })()}
                                        </div>

                                        {/* Section Groups (Spotify Playlist/Library style) */}
                                        {MENU_CATEGORIES.map((category) => (
                                            <div key={category.title} className="space-y-1">
                                                {/* Section Header */}
                                                <div className="flex items-center justify-between px-3 pt-2 pb-1">
                                                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
                                                        {category.title}
                                                    </span>
                                                    {category.title.includes("AI") && (
                                                        <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-400/80 uppercase tracking-wider">
                                                            <Sparkles className="w-2.5 h-2.5" />
                                                            Engine
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Row Items */}
                                                <div className="space-y-0.5">
                                                    {category.items.map((item) => {
                                                        const isActive = location.pathname.startsWith(item.href);

                                                        return (
                                                            <Link
                                                                key={item.href}
                                                                to={item.href}
                                                                onClick={close}
                                                                className={cn(
                                                                    "relative flex items-center gap-3 px-3 py-2 rounded-lg border transition-all duration-150 group",
                                                                    isActive
                                                                        ? "bg-white/[0.08] border-white/[0.12] text-white shadow-sm"
                                                                        : "bg-transparent border-transparent hover:bg-white/[0.05] text-zinc-300"
                                                                )}
                                                            >
                                                                {/* Left-edge Spotify accent indicator bar */}
                                                                <div
                                                                    className={cn(
                                                                        "absolute left-0 top-2 bottom-2 w-1 rounded-r-full transition-all duration-200",
                                                                        isActive
                                                                            ? "bg-emerald-400 opacity-100"
                                                                            : "bg-emerald-400/0 opacity-0 group-hover:bg-white/20 group-hover:opacity-100"
                                                                    )}
                                                                />

                                                                {/* Rounded square avatar slot */}
                                                                <div
                                                                    className={cn(
                                                                        "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border transition-all duration-150",
                                                                        isActive
                                                                            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 shadow-sm"
                                                                            : "bg-zinc-900 border-white/[0.06] text-zinc-400 group-hover:text-zinc-100 group-hover:bg-zinc-800"
                                                                    )}
                                                                >
                                                                    <item.icon className="w-4 h-4" />
                                                                </div>

                                                                {/* Stacked title + subtitle */}
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center justify-between gap-1.5">
                                                                        <span
                                                                            className={cn(
                                                                                "text-[13px] font-semibold tracking-tight transition-colors duration-150 truncate",
                                                                                isActive
                                                                                    ? "text-emerald-400 font-bold"
                                                                                    : "text-zinc-200 group-hover:text-white"
                                                                            )}
                                                                        >
                                                                            {item.label}
                                                                        </span>

                                                                        {item.badge && (
                                                                            <span className="px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                                                                                {item.badge}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-[11px] text-zinc-500 group-hover:text-zinc-400 truncate mt-0.5 font-normal">
                                                                        {item.description}
                                                                    </p>
                                                                </div>
                                                            </Link>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Bottom-Pinned Spotify Player-Bar Style Action Area */}
                                    <div className="p-4 border-t border-white/[0.08] bg-[#0c0c0e]/95 backdrop-blur-md shrink-0 flex flex-col gap-2 shadow-[0_-10px_25px_rgba(0,0,0,0.5)]">
                                        
                                        {/* Quick Action Buttons Grid */}
                                        <div className="grid grid-cols-2 gap-2">
                                            {/* Send Feedback */}
                                            <button
                                                onClick={() => {
                                                    close();
                                                    openFeedbackModal("idea");
                                                }}
                                                className="flex items-center justify-center gap-2 h-9 px-3 rounded-lg bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 text-xs font-semibold transition-all duration-150 active:scale-[0.98]"
                                            >
                                                <MessageSquarePlus className="w-3.5 h-3.5 shrink-0" />
                                                <span className="truncate">Feedback</span>
                                            </button>

                                            {/* Support / Buy Me a Coffee */}
                                            <a
                                                href="https://ko-fi.com/abhi9vaidya"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-center gap-2 h-9 px-3 rounded-lg bg-zinc-900/80 border border-white/[0.08] hover:bg-zinc-800 hover:border-white/20 text-zinc-300 hover:text-white text-xs font-semibold transition-all duration-150 active:scale-[0.98]"
                                            >
                                                <Coffee className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                                <span className="truncate">Support</span>
                                            </a>
                                        </div>

                                        {/* Install PWA Button / Status */}
                                        {!isInstalled ? (
                                            <button
                                                onClick={async () => {
                                                    if (isInstallable) {
                                                        await promptInstall();
                                                    } else {
                                                        setShowInstallGuide(true);
                                                    }
                                                }}
                                                className="flex items-center justify-center gap-2 h-9 px-3 rounded-lg bg-zinc-900/80 border border-white/[0.08] hover:bg-zinc-800 hover:border-white/20 text-zinc-300 hover:text-white text-xs font-semibold transition-all duration-150 active:scale-[0.98]"
                                            >
                                                <Download className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                                <span>Install App (PWA)</span>
                                            </button>
                                        ) : (
                                            <div className="flex items-center justify-center gap-2 h-8 px-3 rounded-lg bg-emerald-500/5 border border-emerald-500/15 text-emerald-400 text-[11px] font-semibold">
                                                <Check className="w-3.5 h-3.5 shrink-0" />
                                                <span>PWA Installed & Ready</span>
                                            </div>
                                        )}

                                        {/* Sticky Footer Meta / GitHub Row */}
                                        <div className="flex items-center justify-between pt-2 px-1 text-[11px] text-zinc-500 border-t border-white/[0.04]">
                                            <a
                                                href="https://github.com/Guitariz/Guitariz"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 transition-colors duration-150 font-medium"
                                            >
                                                <Github className="w-3.5 h-3.5" />
                                                <span>GitHub</span>
                                            </a>
                                            <span className="font-medium text-zinc-600">v2.1.1</span>
                                        </div>
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </>
                )}
            </AnimatePresence>

            <InstallGuide isOpen={showInstallGuide} onClose={() => setShowInstallGuide(false)} />
        </>
    );
};

export default GlobalMenu;