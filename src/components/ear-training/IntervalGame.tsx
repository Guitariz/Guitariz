import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, ArrowLeft, AlertCircle, CheckCircle2, Play, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { audioEngine } from "@/lib/audio-engine";
import { Note } from "tonal";

// --- Constants ---
const INTERVALS = [
    { label: "Unison", semitones: 0 },
    { label: "Minor 2nd", semitones: 1 },
    { label: "Major 2nd", semitones: 2 },
    { label: "Minor 3rd", semitones: 3 },
    { label: "Major 3rd", semitones: 4 },
    { label: "Perfect 4th", semitones: 5 },
    { label: "Tritone", semitones: 6 },
    { label: "Perfect 5th", semitones: 7 },
    { label: "Minor 6th", semitones: 8 },
    { label: "Major 6th", semitones: 9 },
    { label: "Minor 7th", semitones: 10 },
    { label: "Major 7th", semitones: 11 },
    { label: "Octave", semitones: 12 },
];

// Difficulty progression - unlocks more intervals as you level up
const LEVEL_CONFIG: Record<number, { intervals: number[]; name: string; color: string }> = {
    1: { intervals: [4, 7, 12], name: "Beginner", color: "text-emerald-400" },
    2: { intervals: [2, 4, 5, 7, 12], name: "Easy", color: "text-blue-400" },
    3: { intervals: [1, 2, 3, 4, 5, 7, 12], name: "Medium", color: "text-amber-400" },
    4: { intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], name: "Master", color: "text-red-400" },
};

export const IntervalGame = ({ onExit }: { onExit: () => void }) => {
    // Game State
    const [hasStarted, setHasStarted] = useState(false);
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [roundCount, setRoundCount] = useState(0);

    // Current Round State
    const [targetInterval, setTargetInterval] = useState<{ label: string; semitones: number } | null>(null);
    const [rootNote, setRootNote] = useState<string>("C4");
    const [isPlaying, setIsPlaying] = useState(false);
    const [feedback, setFeedback] = useState<"CORRECT" | "WRONG" | null>(null);
    const [lastGuessed, setLastGuessed] = useState<string | null>(null);

    // --- Audio ---
    const playInterval = useCallback((root: string, semitones: number) => {
        setIsPlaying(true);
        const startFreq = Note.freq(root) || 440;
        const endFreq = startFreq * Math.pow(2, semitones / 12);

        audioEngine.playInterval(startFreq, endFreq);

        setTimeout(() => setIsPlaying(false), 2000);
    }, []);

    // --- Game Logic ---
    const generateRound = useCallback(() => {
        const currentLevel = Math.min(level, 4);
        const availableSemitones = LEVEL_CONFIG[currentLevel].intervals;

        // Pick random interval from available ones
        const semitones = availableSemitones[Math.floor(Math.random() * availableSemitones.length)];
        const intervalObj = INTERVALS.find(i => i.semitones === semitones);

        // Pick random root note (C3 to C5)
        const baseMidi = 48 + Math.floor(Math.random() * 24);
        const root = Note.fromMidi(baseMidi);

        if (intervalObj && root) {
            setTargetInterval(intervalObj);
            setRootNote(root);
            setFeedback(null);
            setLastGuessed(null);
            setRoundCount(r => r + 1);

            // Auto-play after short delay
            setTimeout(() => playInterval(root, intervalObj.semitones), 400);
        }
    }, [level, playInterval]);

    const handleGuess = (intervalLabel: string) => {
        if (feedback) return;

        setLastGuessed(intervalLabel);

        if (intervalLabel === targetInterval?.label) {
            // Correct!
            setFeedback("CORRECT");
            const points = 100 + (streak * 20);
            setScore(s => s + points);
            setStreak(s => s + 1);

            // Level up after 5 correct in a row
            if ((streak + 1) % 5 === 0 && level < 4) {
                setTimeout(() => setLevel(l => l + 1), 800);
            }

            // Next round
            setTimeout(generateRound, 1200);
        } else {
            // Wrong
            setFeedback("WRONG");
            setStreak(0);
        }
    };

    const startGame = () => {
        // Initialize audio context with user gesture
        audioEngine.init();
        setHasStarted(true);
        generateRound();
    };

    const currentLevelConfig = LEVEL_CONFIG[Math.min(level, 4)];

    // --- Render ---
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-4xl mx-auto"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <Button variant="ghost" className="text-muted-foreground hover:text-white" onClick={onExit}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </Button>

                {hasStarted && (
                    <div className="flex items-center gap-6 bg-white/5 px-6 py-2 rounded-full border border-white/5 backdrop-blur-md">
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Score</span>
                            <span className="text-xl font-mono font-bold text-white">{score}</span>
                        </div>

                        <div className="w-px h-8 bg-white/10" />

                        <div className="flex flex-col items-center">
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Streak</span>
                            <span className={cn("text-xl font-mono font-bold", streak > 2 ? "text-amber-400" : "text-white")}>
                                {streak} {streak > 2 && "🔥"}
                            </span>
                        </div>

                        <div className="w-px h-8 bg-white/10" />

                        <div className="flex flex-col items-center">
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Level</span>
                            <span className={cn("text-xl font-mono font-bold", currentLevelConfig.color)}>{level}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Start Screen */}
            {!hasStarted ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#0e0e0e] rounded-[3rem] border border-white/5 p-12 flex flex-col items-center justify-center min-h-[500px] relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent" />
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />

                    <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="w-24 h-24 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mb-8">
                            <Zap className="w-12 h-12 text-emerald-400" />
                        </div>

                        <h2 className="text-4xl font-bold text-white mb-4">Interval Training</h2>
                        <p className="text-neutral-400 mb-2 max-w-md leading-relaxed">
                            Train your ear to recognize the distance between two notes.
                        </p>
                        <p className="text-neutral-500 text-sm mb-8">
                            Choose your difficulty level and start training!
                        </p>

                        {/* Level Selection */}
                        <div className="grid grid-cols-2 gap-4 mb-8 w-full max-w-md">
                            {Object.entries(LEVEL_CONFIG).map(([lvl, config]) => {
                                const isSelected = level === Number(lvl);
                                return (
                                    <button
                                        key={lvl}
                                        onClick={() => setLevel(Number(lvl))}
                                        className={cn(
                                            "relative p-4 rounded-2xl border-2 transition-all text-left",
                                            isSelected
                                                ? "border-emerald-500 bg-emerald-500/10"
                                                : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                                        )}
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={cn("text-2xl font-mono font-bold", config.color)}>L{lvl}</span>
                                            <span className="text-white font-semibold">{config.name}</span>
                                        </div>
                                        <p className="text-neutral-500 text-sm">
                                            {config.intervals.length} intervals
                                        </p>
                                        {isSelected && (
                                            <motion.div
                                                layoutId="level-check"
                                                className="absolute top-3 right-3 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center"
                                            >
                                                <CheckCircle2 className="w-4 h-4 text-black" />
                                            </motion.div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        <Button
                            size="lg"
                            onClick={startGame}
                            className="h-16 px-12 text-lg rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold shadow-[0_0_40px_rgba(16,185,129,0.3)] transition-all hover:shadow-[0_0_60px_rgba(16,185,129,0.5)]"
                        >
                            <Play className="w-5 h-5 mr-2" />
                            Start Level {level}
                        </Button>
                    </div>
                </motion.div>
            ) : (
                /* Game Board */
                <div className="bg-[#0e0e0e] rounded-[3rem] border border-white/5 p-8 md:p-12 min-h-[500px] flex flex-col items-center relative overflow-hidden shadow-2xl">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />

                    {/* Feedback Flash */}
                    <AnimatePresence>
                        {feedback === "CORRECT" && (
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-emerald-500/10 z-0 pointer-events-none"
                            />
                        )}
                        {feedback === "WRONG" && (
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-red-500/10 z-0 pointer-events-none"
                            />
                        )}
                    </AnimatePresence>

                    {/* Round Counter */}
                    <div className="absolute top-6 left-6 text-neutral-600 text-sm font-mono">
                        Round {roundCount}
                    </div>

                    {/* Level Badge */}
                    <div className={cn("absolute top-6 right-6 text-sm font-bold uppercase tracking-widest", currentLevelConfig.color)}>
                        {currentLevelConfig.name}
                    </div>

                    {/* Play Button */}
                    <div className="relative z-10 flex flex-col items-center my-8">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => targetInterval && playInterval(rootNote, targetInterval.semitones)}
                            className={cn(
                                "w-36 h-36 rounded-full border-4 flex items-center justify-center transition-all shadow-[0_0_50px_rgba(0,0,0,0.5)] mb-6",
                                isPlaying
                                    ? "border-emerald-400/50 bg-emerald-400/10 scale-105"
                                    : "border-white/10 bg-[#151515] hover:border-white/30"
                            )}
                        >
                            <Volume2 className={cn("w-14 h-14 transition-all duration-300", isPlaying ? "text-emerald-400 animate-pulse" : "text-white/80")} />
                        </motion.button>

                        <div className="h-8 flex items-center justify-center">
                            {feedback === "CORRECT" ? (
                                <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-center text-emerald-400 gap-2 font-bold text-xl">
                                    <CheckCircle2 className="w-6 h-6" />
                                    <span>Correct! +{100 + ((streak - 1) * 20)}</span>
                                </motion.div>
                            ) : feedback === "WRONG" ? (
                                <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-center text-red-400 gap-2 font-bold text-xl">
                                    <AlertCircle className="w-6 h-6" />
                                    <span>It was: {targetInterval?.label}</span>
                                </motion.div>
                            ) : (
                                <span className="text-white/30 text-sm font-medium uppercase tracking-widest">Tap to replay</span>
                            )}
                        </div>
                    </div>

                    {/* Answer Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 w-full max-w-3xl relative z-10">
                        {INTERVALS.filter(i => currentLevelConfig.intervals.includes(i.semitones)).map((interval) => {
                            const isSelected = lastGuessed === interval.label;
                            const isTarget = targetInterval?.label === interval.label;

                            let variantClass = "border-white/10 bg-white/[0.03] hover:bg-white/10 hover:border-emerald-500/30 hover:text-white text-neutral-400";

                            if (feedback === "CORRECT" && isTarget) {
                                variantClass = "border-emerald-500 bg-emerald-500 text-black shadow-[0_0_30px_rgba(16,185,129,0.4)]";
                            } else if (feedback === "WRONG" && isSelected) {
                                variantClass = "border-red-500/50 bg-red-500/10 text-red-500";
                            } else if (feedback === "WRONG" && isTarget) {
                                variantClass = "border-emerald-500/50 bg-emerald-500/10 text-emerald-400";
                            }

                            return (
                                <Button
                                    key={interval.label}
                                    className={cn("h-14 md:h-16 text-sm md:text-base font-semibold rounded-2xl border transition-all duration-300", variantClass)}
                                    onClick={() => handleGuess(interval.label)}
                                    disabled={feedback !== null}
                                >
                                    {interval.label}
                                </Button>
                            );
                        })}
                    </div>

                    {/* Next Button (after wrong answer) */}
                    {feedback === "WRONG" && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-8 z-10"
                        >
                            <Button onClick={generateRound} className="px-8 rounded-full bg-white/10 hover:bg-white/20">
                                Next Round <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                            </Button>
                        </motion.div>
                    )}
                </div>
            )}
        </motion.div>
    );
};
