import { useEffect, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
    Play, Pause, RotateCcw, ChevronDown, Plus, X, Piano, Waves,
    Zap, Music2, Shuffle, Volume2, Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { scheduleChord, scheduleClick, getAudioTime } from "@/lib/jamAudio";
import { chordLibraryData } from "@/data/chordData";
import { motion, AnimatePresence } from "framer-motion";
import ChordDiagram from "@/components/chord/ChordDiagram";
import { ChordSlot, PresetProgression, useJamStore, getChordLabel } from "@/stores/jamStore";

// Removed duplicate PresetProgression interface

// ─── Constants ────────────────────────────────────────────────────────────
const ROOTS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const COMMON_VARIANTS = ["Major", "Minor", "7", "maj7", "m7", "sus4", "sus2", "dim", "aug"];

const BEATS_PER_CHORD_OPTIONS = [1, 2, 4, 8];

// ─── Preset Progressions ─────────────────────────────────────────────────
const PRESETS: PresetProgression[] = [
    {
        name: "Pop Anthem",
        genre: "Pop",
        description: "I – V – vi – IV",
        slots: [
            { root: "C", variant: "Major" },
            { root: "G", variant: "Major" },
            { root: "A", variant: "Minor" },
            { root: "F", variant: "Major" },
        ],
        color: "from-blue-500/30 to-purple-500/30",
    },
    {
        name: "Sad Pop",
        genre: "Pop",
        description: "vi – IV – I – V",
        slots: [
            { root: "A", variant: "Minor" },
            { root: "F", variant: "Major" },
            { root: "C", variant: "Major" },
            { root: "G", variant: "Major" },
        ],
        color: "from-indigo-500/30 to-cyan-500/30",
    },
    {
        name: "Blues Shuffle",
        genre: "Blues",
        description: "I – IV – I – V",
        slots: [
            { root: "A", variant: "7" },
            { root: "D", variant: "7" },
            { root: "A", variant: "7" },
            { root: "E", variant: "7" },
        ],
        color: "from-amber-500/30 to-orange-500/30",
    },
    {
        name: "Jazz ii–V–I",
        genre: "Jazz",
        description: "ii⁷ – V⁷ – Imaj⁷",
        slots: [
            { root: "D", variant: "m7" },
            { root: "G", variant: "7" },
            { root: "C", variant: "maj7" },
            { root: "C", variant: "maj7" },
        ],
        color: "from-emerald-500/30 to-teal-500/30",
    },
    {
        name: "Rock Power",
        genre: "Rock",
        description: "I – IV – V – IV",
        slots: [
            { root: "E", variant: "Major" },
            { root: "A", variant: "Major" },
            { root: "B", variant: "Major" },
            { root: "A", variant: "Major" },
        ],
        color: "from-red-500/30 to-orange-500/30",
    },
    {
        name: "Chill Lofi",
        genre: "Lofi",
        description: "Imaj⁷ – vi⁷ – ii⁷ – V⁷",
        slots: [
            { root: "F", variant: "maj7" },
            { root: "D", variant: "m7" },
            { root: "G", variant: "m7" },
            { root: "C", variant: "7" },
        ],
        color: "from-violet-500/30 to-pink-500/30",
    },
    {
        name: "Folk Campfire",
        genre: "Folk",
        description: "I – IV – V – I",
        slots: [
            { root: "G", variant: "Major" },
            { root: "C", variant: "Major" },
            { root: "D", variant: "Major" },
            { root: "G", variant: "Major" },
        ],
        color: "from-yellow-500/30 to-amber-500/30",
    },
    {
        name: "R&B Smooth",
        genre: "R&B",
        description: "I – vi – IV – V",
        slots: [
            { root: "D", variant: "maj7" },
            { root: "B", variant: "Minor" },
            { root: "G", variant: "Major" },
            { root: "A", variant: "7" },
        ],
        color: "from-pink-500/30 to-rose-500/30",
    },
];

// ─── Helpers ──────────────────────────────────────────────────────────────
// Simple scale detection based on chord roots
function suggestScales(slots: ChordSlot[]): string[] {
    const nonEmpty = slots.filter((s) => s.root);
    if (nonEmpty.length === 0) return [];

    const noteSet = new Set(nonEmpty.map((s) => ROOTS.indexOf(s.root)));

    // Major scale intervals: [0, 2, 4, 5, 7, 9, 11]
    const MAJOR_INTERVALS = [0, 2, 4, 5, 7, 9, 11];
    const suggestions: string[] = [];

    for (let rootIdx = 0; rootIdx < 12; rootIdx++) {
        const scaleNotes = new Set(MAJOR_INTERVALS.map((i) => (rootIdx + i) % 12));
        const allFit = [...noteSet].every((n) => scaleNotes.has(n));
        if (allFit) {
            suggestions.push(`${ROOTS[rootIdx]} Major / ${ROOTS[(rootIdx + 9) % 12]} Minor`);
        }
    }
    return suggestions.length > 0 ? suggestions.slice(0, 3) : ["Chromatic — mix of keys"];
}

// ─── Component ────────────────────────────────────────────────────────────
const ChordProgressionPlayer = () => {
    const {
        slots, bpm, beatsPerChord, isPlaying, currentSlotIndex, currentBeat,
        instrument, volume, editingSlot, showPresets, metronomeEnabled,
        setBpm, setBeatsPerChord, setInstrument, setVolume, setEditingSlot,
        setShowPresets, setMetronomeEnabled, setChordInSlot, clearSlot,
        loadPreset, clearAll, stopPlayback
    } = useJamStore();

    // Refs for the scheduler loop
    const timerRef = useRef<number | null>(null);
    const metronomeRef = useRef(metronomeEnabled);
    metronomeRef.current = metronomeEnabled;

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) cancelAnimationFrame(timerRef.current);
        };
    }, []);

    // ─── Playback Engine (Web Audio Lookahead Scheduler) ──────────────────
    useEffect(() => {
        return () => {
            if (timerRef.current) cancelAnimationFrame(timerRef.current);
            useJamStore.getState().stopPlayback();
        };
    }, []);

    const startPlayback = useCallback(() => {
        const state = useJamStore.getState();
        // Collect non-empty slots
        const nonEmpty = state.slots
            .map((s, i) => (s.root ? i : -1))
            .filter((i) => i >= 0);
        if (nonEmpty.length === 0) return;

        state.setIsPlaying(true);
        state.setCurrentBeat(0);
        state.setEditingSlot(null);

        const LOOKAHEAD = 0.15; // schedule 150ms ahead

        // Track the audio-time of the most recently scheduled beat
        let nextBeatTime = getAudioTime() + 0.05;
        let scheduledBeat = 0;
        let chordIdx = 0;

        // Track the last beat/slot we showed in the UI so we advance at the right moment
        let displayBeat = 0;
        let displaySlot = nonEmpty[0];
        // Record time→beat mapping for display
        const beatEvents: { time: number; beat: number; slot: number }[] = [];

        // Schedule the very first chord
        const firstSlot = state.slots[nonEmpty[0]];
        const currentBeatDuration = 60 / state.bpm;
        const currentChordDuration = currentBeatDuration * state.beatsPerChord;

        scheduleChord(firstSlot.root, firstSlot.variant, nextBeatTime, currentChordDuration - 0.05, state.volume, state.instrument);
        if (metronomeRef.current) scheduleClick(nextBeatTime, true);
        beatEvents.push({ time: nextBeatTime, beat: 0, slot: nonEmpty[0] });
        state.setCurrentSlotIndex(nonEmpty[0]);

        const tick = () => {
            const now = getAudioTime();
            const tickState = useJamStore.getState();
            if (!tickState.isPlaying) return;
            const bDuration = 60 / tickState.bpm;
            const cDuration = bDuration * tickState.beatsPerChord;

            // Schedule future beats within the lookahead window
            while (nextBeatTime + bDuration < now + LOOKAHEAD) {
                nextBeatTime += bDuration;
                scheduledBeat++;

                if (scheduledBeat >= tickState.beatsPerChord) {
                    scheduledBeat = 0;
                    chordIdx = (chordIdx + 1) % nonEmpty.length;
                    const slot = tickState.slots[nonEmpty[chordIdx]];
                    scheduleChord(slot.root, slot.variant, nextBeatTime, cDuration - 0.05, tickState.volume, tickState.instrument);
                    if (metronomeRef.current) scheduleClick(nextBeatTime, true);
                } else {
                    if (metronomeRef.current) scheduleClick(nextBeatTime, false);
                }

                beatEvents.push({ time: nextBeatTime, beat: scheduledBeat, slot: nonEmpty[chordIdx] });

                // Keep only recent events (last 16 beats) to avoid memory leak
                if (beatEvents.length > 16) beatEvents.shift();
            }

            // Update UI: find the most recent beat event that has actually played
            for (let i = beatEvents.length - 1; i >= 0; i--) {
                if (beatEvents[i].time <= now + 0.02) { // small tolerance
                    if (beatEvents[i].beat !== displayBeat || beatEvents[i].slot !== displaySlot) {
                        displayBeat = beatEvents[i].beat;
                        displaySlot = beatEvents[i].slot;
                        const s = useJamStore.getState();
                        s.setCurrentBeat(displayBeat);
                        s.setCurrentSlotIndex(displaySlot);
                    }
                    break;
                }
            }

            timerRef.current = requestAnimationFrame(tick);
        };

        timerRef.current = requestAnimationFrame(tick);
    }, []);

    // Restart when params change while playing
    useEffect(() => {
        // Now the loop reads fresh state directly, so we don't strictly need to restart
        // but if we want instant tempo changes, it helps. Or the loop handles it! 
        // Wait, since we are using fresh bpm directly inside tick, we actually DON'T need to restart the audio context timeline on tempo change! 
        // The lookahead will seamlessly schedule the next beat at the new tempo.
    }, [bpm, beatsPerChord, instrument, volume]);

    const togglePlay = () => {
        if (isPlaying) {
            stopPlayback();
        } else {
            startPlayback();
        }
    };

    const shufflePreset = useCallback(() => {
        const preset = PRESETS[Math.floor(Math.random() * PRESETS.length)];
        loadPreset(preset);
    }, [loadPreset]);

    // Scale suggestions
    const scaleHints = useMemo(() => suggestScales(slots), [slots]);

    // Available variants for a given root
    const getAvailableVariants = (root: string): string[] => {
        const rootData = chordLibraryData.roots.find((r) => r.root === root);
        if (!rootData) return COMMON_VARIANTS;
        return rootData.variants.map((v) => v.name);
    };

    const hasAnyChords = slots.some((s) => s.root);

    return (
        <div className="w-full max-w-5xl mx-auto space-y-8">
            {/* ─── Chord Slots ──────────────────────────────────────────────── */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold">
                        Progression Slots
                    </h3>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={shufflePreset}
                            className="h-8 px-3 text-xs text-muted-foreground hover:text-white"
                        >
                            <Shuffle className="w-3 h-3 mr-1.5" />
                            Random
                        </Button>
                        {hasAnyChords && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearAll}
                                className="h-8 px-3 text-xs text-muted-foreground hover:text-white"
                            >
                                <RotateCcw className="w-3 h-3 mr-1.5" />
                                Clear
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {slots.map((slot, i) => (
                        <div key={i} className="relative">
                            <motion.div
                                animate={{
                                    scale: isPlaying && currentSlotIndex === i ? 1.02 : 1,
                                    borderColor: isPlaying && currentSlotIndex === i ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.05)",
                                }}
                                transition={{ duration: 0.15 }}
                                className={cn(
                                    "relative rounded-2xl border overflow-hidden transition-all cursor-pointer",
                                    isPlaying && currentSlotIndex === i
                                        ? "bg-white/[0.08] shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                                        : slot.root
                                            ? "bg-white/[0.03] hover:bg-white/[0.05]"
                                            : "bg-white/[0.01] hover:bg-white/[0.03] border-dashed border-white/10"
                                )}
                                onClick={() => {
                                    if (!isPlaying) setEditingSlot(editingSlot === i ? null : i);
                                }}
                            >
                                {/* Beat progress bar */}
                                {isPlaying && currentSlotIndex === i && (
                                    <motion.div
                                        className="absolute top-0 left-0 h-0.5 bg-white/60"
                                        initial={{ width: "0%" }}
                                        animate={{ width: `${((currentBeat + 1) / beatsPerChord) * 100}%` }}
                                        transition={{ duration: 60 / bpm, ease: "linear" }}
                                    />
                                )}

                                <div className="p-4 min-h-[140px] flex flex-col items-center justify-center">
                                    {slot.root ? (
                                        <>
                                            <span className="text-3xl font-bold text-white tracking-tight">
                                                {slot.label}
                                            </span>
                                            {slot.frets.length > 0 && (
                                                <div className="mt-2 opacity-60 scale-[0.55] origin-center -mb-6">
                                                    <ChordDiagram
                                                        frets={slot.frets}
                                                        fingers={slot.fingers}
                                                        chordName=""
                                                    />
                                                </div>
                                            )}
                                            {!isPlaying && (
                                                <button
                                                    className="absolute top-2 right-2 p-1 rounded-lg bg-white/5 hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        clearSlot(i);
                                                    }}
                                                >
                                                    <X className="w-3 h-3 text-muted-foreground" />
                                                </button>
                                            )}
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-muted-foreground/50">
                                            <Plus className="w-6 h-6" />
                                            <span className="text-[10px] uppercase tracking-widest font-semibold">Add Chord</span>
                                        </div>
                                    )}
                                </div>

                                {/* Slot number */}
                                <div className="absolute bottom-2 left-2 text-[9px] font-mono text-muted-foreground/30">
                                    {i + 1}
                                </div>
                            </motion.div>

                            {/* Chord Picker Dropdown */}
                            <AnimatePresence>
                                {editingSlot === i && !isPlaying && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute z-50 top-full left-0 right-0 mt-2 rounded-2xl bg-[#0e0e0e] border border-white/10 shadow-2xl overflow-hidden"
                                    >
                                        {/* Root selection */}
                                        <div className="p-3 border-b border-white/5">
                                            <span className="text-[9px] uppercase tracking-widest text-muted-foreground/60 font-bold block mb-2">Root Note</span>
                                            <div className="grid grid-cols-6 gap-1">
                                                {ROOTS.map((root) => (
                                                    <button
                                                        key={root}
                                                        onClick={() => {
                                                            // If variant already chosen, set immediately
                                                            if (slot.variant) {
                                                                setChordInSlot(i, root, slot.variant);
                                                            } else {
                                                                // Set root, default to Major
                                                                setChordInSlot(i, root, "Major");
                                                            }
                                                        }}
                                                        className={cn(
                                                            "py-1.5 rounded-lg text-[11px] font-bold transition-all",
                                                            slot.root === root
                                                                ? "bg-white text-black"
                                                                : "bg-white/5 text-white/70 hover:bg-white/10"
                                                        )}
                                                    >
                                                        {root}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Variant selection */}
                                        {slot.root && (
                                            <div className="p-3">
                                                <span className="text-[9px] uppercase tracking-widest text-muted-foreground/60 font-bold block mb-2">Quality</span>
                                                <div className="grid grid-cols-3 gap-1">
                                                    {getAvailableVariants(slot.root).map((variant) => (
                                                        <button
                                                            key={variant}
                                                            onClick={() => setChordInSlot(i, slot.root, variant)}
                                                            className={cn(
                                                                "py-1.5 px-2 rounded-lg text-[10px] font-medium transition-all truncate",
                                                                slot.variant === variant
                                                                    ? "bg-white text-black"
                                                                    : "bg-white/5 text-white/70 hover:bg-white/10"
                                                            )}
                                                        >
                                                            {getChordLabel(slot.root, variant)}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </div>

            {/* ─── Transport Controls ───────────────────────────────────────── */}
            <div className="glass-card rounded-2xl p-6 border border-white/5">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left: Play + BPM */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="flex items-center gap-4">
                            <Button
                                size="lg"
                                onClick={togglePlay}
                                disabled={!hasAnyChords}
                                className={cn(
                                    "h-14 px-8 rounded-2xl text-base font-semibold transition-all duration-300",
                                    isPlaying
                                        ? "bg-white text-black hover:bg-white/90 shadow-[0_0_30px_rgba(255,255,255,0.15)]"
                                        : hasAnyChords
                                            ? "bg-white/[0.06] border border-white/10 text-white hover:bg-white/[0.1]"
                                            : "bg-white/[0.03] border border-white/5 text-muted-foreground cursor-not-allowed"
                                )}
                            >
                                {isPlaying ? (
                                    <Pause className="w-5 h-5 mr-2 fill-current" />
                                ) : (
                                    <Play className="w-5 h-5 mr-2 fill-current" />
                                )}
                                {isPlaying ? "Stop" : "Play"}
                            </Button>

                            <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground font-medium">Tempo</span>
                                    <span className="text-sm font-mono text-white tabular-nums">{bpm} BPM</span>
                                </div>
                                <Slider
                                    value={[bpm]}
                                    onValueChange={(v) => setBpm(v[0])}
                                    min={40}
                                    max={200}
                                    step={1}
                                />
                            </div>
                        </div>

                        {/* Beat dots */}
                        {isPlaying && (
                            <div className="flex items-center justify-center gap-2">
                                {Array.from({ length: beatsPerChord }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "w-2.5 h-2.5 rounded-full transition-all duration-100",
                                            i === currentBeat
                                                ? i === 0
                                                    ? "bg-white scale-125 shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                                                    : "bg-white/80 scale-110"
                                                : "bg-white/10"
                                        )}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Config */}
                    <div className="lg:col-span-5 space-y-5 lg:pl-8 lg:border-l border-white/5">
                        {/* Beats per chord */}
                        <div className="space-y-2">
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-bold">
                                Beats / Chord
                            </span>
                            <div className="flex gap-2">
                                {BEATS_PER_CHORD_OPTIONS.map((b) => (
                                    <Button
                                        key={b}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setBeatsPerChord(b)}
                                        className={cn(
                                            "flex-1 h-9 rounded-xl border-white/5 bg-white/[0.02] hover:bg-white/[0.05] text-xs font-bold",
                                            beatsPerChord === b && "border-white/20 bg-white/[0.08] text-white"
                                        )}
                                    >
                                        {b}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Instrument */}
                        <div className="space-y-2">
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-bold">
                                Instrument
                            </span>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setInstrument("piano")}
                                    className={cn(
                                        "flex-1 h-9 rounded-xl border-white/5 bg-white/[0.02] hover:bg-white/[0.05] text-xs",
                                        instrument === "piano" && "border-white/20 bg-white/[0.08] text-white"
                                    )}
                                >
                                    <Piano className="w-3.5 h-3.5 mr-1.5" />
                                    Piano
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setInstrument("pad")}
                                    className={cn(
                                        "flex-1 h-9 rounded-xl border-white/5 bg-white/[0.02] hover:bg-white/[0.05] text-xs",
                                        instrument === "pad" && "border-white/20 bg-white/[0.08] text-white"
                                    )}
                                >
                                    <Waves className="w-3.5 h-3.5 mr-1.5" />
                                    Pad
                                </Button>
                            </div>
                        </div>

                        {/* Volume */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-bold flex items-center gap-1.5">
                                    <Volume2 className="w-3 h-3" />
                                    Volume
                                </span>
                                <span className="text-[10px] font-mono text-muted-foreground/50">
                                    {Math.round(volume * 100)}%
                                </span>
                            </div>
                            <Slider
                                value={[volume]}
                                onValueChange={(v) => setVolume(v[0])}
                                min={0.05}
                                max={0.6}
                                step={0.01}
                            />
                        </div>

                        {/* Metronome Toggle */}
                        <div className="space-y-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setMetronomeEnabled(!metronomeEnabled)}
                                className={cn(
                                    "w-full h-9 rounded-xl border-white/5 bg-white/[0.02] hover:bg-white/[0.05] text-xs font-medium",
                                    metronomeEnabled && "border-white/20 bg-white/[0.08] text-white"
                                )}
                            >
                                <Clock className="w-3.5 h-3.5 mr-1.5" />
                                Metronome {metronomeEnabled ? "On" : "Off"}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Scale Hints ──────────────────────────────────────────────── */}
            {hasAnyChords && scaleHints.length > 0 && (
                <div className="glass-card rounded-2xl p-5 border border-white/5">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                            <Zap className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                        <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                            Scales to Improvise Over
                        </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {scaleHints.map((hint, i) => (
                            <span
                                key={i}
                                className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/5 text-xs text-white/80 font-medium"
                            >
                                {hint}
                            </span>
                        ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground/50 mt-3">
                        These scales contain all the chord roots in your progression — solo freely using any of them.
                    </p>
                </div>
            )}

            {/* ─── Preset Progressions ──────────────────────────────────────── */}
            <div className="space-y-4">
                <button
                    onClick={() => setShowPresets(!showPresets)}
                    className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold hover:text-white transition-colors"
                >
                    <Music2 className="w-3.5 h-3.5" />
                    Preset Progressions
                    <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", showPresets && "rotate-180")} />
                </button>

                <AnimatePresence>
                    {showPresets && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                {PRESETS.map((preset) => (
                                    <button
                                        key={preset.name}
                                        onClick={() => loadPreset(preset)}
                                        className="group p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/15 hover:bg-white/[0.04] transition-all text-left relative overflow-hidden"
                                    >
                                        <div className={`absolute inset-0 bg-gradient-to-br ${preset.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                                        <div className="relative z-10">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-semibold text-white">{preset.name}</span>
                                                <span className="text-[9px] uppercase tracking-widest text-muted-foreground/50 font-bold">
                                                    {preset.genre}
                                                </span>
                                            </div>
                                            <span className="text-xs text-muted-foreground font-mono">{preset.description}</span>
                                            <div className="flex gap-1.5 mt-2">
                                                {preset.slots.map((s, i) => (
                                                    <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/60 font-medium">
                                                        {getChordLabel(s.root, s.variant)}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ChordProgressionPlayer;
