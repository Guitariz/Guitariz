import { useState } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
    { label: "Home", icon: Home, href: "/" },
    { label: "Fretboard", icon: Grid3X3, href: "/fretboard" },
    { label: "Chords", icon: Music, href: "/chords" },
    { label: "Scales", icon: Layers, href: "/scales" },
    { label: "Metronome", icon: Clock, href: "/metronome" },
    { label: "Chord AI", icon: Mic, href: "/chord-ai" },
    { label: "Vocal Splitter", icon: Headphones, href: "/vocal-splitter" },
    { label: "Theory", icon: BookOpen, href: "/theory" },
    { label: "Tuner", icon: Guitar, href: "/tuner" },
    { label: "Ear Training", icon: Trophy, href: "/ear-training" },
];

export const GlobalMenu = () => {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();

    return (
        <>
            {/* Floating Menu Button */}
            <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(true)}
                className="fixed top-5 right-5 z-[90] w-12 h-12 bg-white/10 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all shadow-2xl"
            >
                <Menu className="w-5 h-5 text-white" />
            </motion.button>

            {/* Backdrop */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100]"
                        onClick={() => setIsOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Menu Panel */}
            <motion.div
                initial={{ x: "100%" }}
                animate={{ x: isOpen ? 0 : "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-[#080808] border-l border-white/5 z-[101] flex flex-col shadow-2xl"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <img
                            src="/logo.svg"
                            alt="Guitariz Logo"
                            className="w-8 h-8 rounded-lg"
                        />
                        <span className="text-lg font-bold text-white tracking-tight">Guitariz</span>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsOpen(false)}
                        className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                    >
                        <X className="w-5 h-5 text-white" />
                    </motion.button>
                </div>

                {/* Nav Items */}
                <nav className="flex-1 p-3 overflow-y-auto">
                    <div className="space-y-1">
                        {menuItems.map((item, i) => {
                            const isActive = location.pathname === item.href;
                            return (
                                <motion.div
                                    key={item.label}
                                    initial={{ opacity: 0, x: 30 }}
                                    animate={{
                                        opacity: isOpen ? 1 : 0,
                                        x: isOpen ? 0 : 30
                                    }}
                                    transition={{ delay: isOpen ? i * 0.03 : 0, duration: 0.2 }}
                                >
                                    <Link
                                        to={item.href}
                                        onClick={() => setIsOpen(false)}
                                        className={cn(
                                            "flex items-center gap-4 px-4 py-3 rounded-xl transition-all group",
                                            isActive
                                                ? "bg-emerald-500/10 text-emerald-400"
                                                : "text-white/60 hover:text-white hover:bg-white/5"
                                        )}
                                    >
                                        <item.icon className={cn(
                                            "w-5 h-5 transition-colors",
                                            isActive ? "text-emerald-400" : "group-hover:text-emerald-400"
                                        )} />
                                        <span className="font-medium">{item.label}</span>
                                        {isActive && (
                                            <motion.div
                                                layoutId="menu-active"
                                                className="ml-auto w-2 h-2 rounded-full bg-emerald-400"
                                            />
                                        )}
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </div>
                </nav>

                {/* Footer */}
                <div className="p-5 border-t border-white/5">
                    <p className="text-[11px] text-neutral-600 text-center">
                        Guitariz Studio • v1.7
                    </p>
                </div>
            </motion.div>
        </>
    );
};
