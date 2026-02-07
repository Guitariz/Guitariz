/**
 * Live Chord Indicator
 * Displays real-time chord detection with confidence meter and animation
 */

import { motion, AnimatePresence } from "framer-motion";
import { Activity, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface LiveChordIndicatorProps {
    chord: string | null;
    confidence: number;
    isConnected: boolean;
    isActive: boolean;
}

export const LiveChordIndicator = ({
    chord,
    confidence,
    isConnected,
    isActive,
}: LiveChordIndicatorProps) => {
    const getConfidenceColor = (conf: number) => {
        if (conf >= 0.8) return "from-emerald-500 to-emerald-400";
        if (conf >= 0.6) return "from-yellow-500 to-amber-400";
        if (conf >= 0.4) return "from-orange-500 to-orange-400";
        return "from-red-500 to-red-400";
    };

    const getConfidenceLabel = (conf: number) => {
        if (conf >= 0.8) return "High";
        if (conf >= 0.6) return "Good";
        if (conf >= 0.4) return "Low";
        return "Uncertain";
    };

    return (
        <div className="relative">
            {/* Main indicator */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                    "relative flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-sm transition-all duration-300",
                    isActive && isConnected
                        ? "bg-gradient-to-br from-white/10 to-white/5 border-white/20"
                        : "bg-white/5 border-white/10"
                )}
            >
                {/* Connection status indicator */}
                <div className="flex items-center gap-2">
                    {isConnected ? (
                        <Wifi className="w-4 h-4 text-emerald-400" />
                    ) : (
                        <WifiOff className="w-4 h-4 text-red-400" />
                    )}
                </div>

                {/* Live indicator dot */}
                {isActive && isConnected && (
                    <div className="relative">
                        <motion.div
                            animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="w-2 h-2 rounded-full bg-red-500"
                        />
                        <div className="absolute inset-0 w-2 h-2 rounded-full bg-red-500/50 animate-ping" />
                    </div>
                )}

                {/* Chord display */}
                <div className="flex-1 min-w-[80px]">
                    <AnimatePresence mode="wait">
                        {isActive && chord && chord !== "N.C." ? (
                            <motion.div
                                key={chord}
                                initial={{ y: -10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 10, opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className="flex items-center gap-2"
                            >
                                <span className="text-xl font-bold text-white">{chord}</span>
                                <span className={cn(
                                    "text-[10px] uppercase font-medium px-1.5 py-0.5 rounded",
                                    confidence >= 0.6 ? "bg-emerald-500/20 text-emerald-400" : "bg-yellow-500/20 text-yellow-400"
                                )}>
                                    {getConfidenceLabel(confidence)}
                                </span>
                            </motion.div>
                        ) : isActive ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center gap-2 text-white/40"
                            >
                                <Activity className="w-4 h-4" />
                                <span className="text-sm">Listening...</span>
                            </motion.div>
                        ) : (
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-sm text-white/40"
                            >
                                Play to detect
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>

                {/* Confidence bar */}
                {isActive && chord && chord !== "N.C." && (
                    <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${confidence * 100}%` }}
                            transition={{ duration: 0.2 }}
                            className={cn("h-full rounded-full bg-gradient-to-r", getConfidenceColor(confidence))}
                        />
                    </div>
                )}

                {/* Label */}
                <span className="text-[10px] uppercase tracking-wider text-white/30 font-medium">
                    Live
                </span>
            </motion.div>
        </div>
    );
};

export default LiveChordIndicator;
