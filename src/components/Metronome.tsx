import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, RotateCcw, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

const Metronome = () => {
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [timeSignature, setTimeSignature] = useState({ num: 4, den: 4 });
  const intervalRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const tapTimesRef = useRef<number[]>([]);
  const tappedBpmTimeoutRef = useRef<number | null>(null);
  const [tappedBpm, setTappedBpm] = useState<number | null>(null);

  const PRESETS = [
    { label: 'Largo', bpm: 60 },
    { label: 'Andante', bpm: 84 },
    { label: 'Moderato', bpm: 108 },
    { label: 'Allegro', bpm: 132 },
    { label: 'Presto', bpm: 168 },
  ];

  useEffect(() => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioContextRef.current = new AudioContextClass();
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (tappedBpmTimeoutRef.current) {
        window.clearTimeout(tappedBpmTimeoutRef.current);
        tappedBpmTimeoutRef.current = null;
      }
    };
  }, []);

  const playClick = useCallback((isAccent: boolean) => {
    if (!audioContextRef.current) return;

    const ctx = audioContextRef.current;
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = isAccent ? 1200 : 800;
    gainNode.gain.value = isAccent ? 0.2 : 0.1;

    oscillator.start(ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    oscillator.stop(ctx.currentTime + 0.05);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      const interval = (60 / bpm) * (4 / timeSignature.den) * 1000;
      intervalRef.current = window.setInterval(() => {
        setCurrentBeat((prev) => {
          const nextBeat = (prev + 1) % timeSignature.num;
          playClick(nextBeat === 0);
          return nextBeat;
        });
      }, interval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setCurrentBeat(0);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, bpm, timeSignature, playClick]);

  const togglePlay = () => {
    if (!isPlaying && audioContextRef.current?.state === "suspended") {
      audioContextRef.current.resume();
    }
    setIsPlaying(!isPlaying);
  };

  const reset = () => {
    setIsPlaying(false);
    setCurrentBeat(0);
    setBpm(120);
    setTimeSignature({ num: 4, den: 4 });
  };

  const handleTapTempo = useCallback(() => {
    const now = performance.now();
    const times = tapTimesRef.current;

    if (times.length === 0) {
      times.push(now);
      return;
    }

    const last = times[times.length - 1];
    // If it's been a while since last tap, start over
    if (now - last > 2000) {
      tapTimesRef.current = [now];
      return;
    }

    times.push(now);
    // keep only the last 8 taps
    if (times.length > 8) tapTimesRef.current = times.slice(times.length - 8);

    const diffs: number[] = [];
    for (let i = 1; i < tapTimesRef.current.length; i++) {
      const d = tapTimesRef.current[i] - tapTimesRef.current[i - 1];
      if (d > 60 && d < 2000) diffs.push(d);
    }

    if (diffs.length === 0) return;

    // average interval in ms
    const avg = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    const detected = Math.round(60000 / avg);
    const clamped = Math.max(40, Math.min(280, detected));

    setBpm(clamped);
    setTappedBpm(clamped);

    if (tappedBpmTimeoutRef.current) {
      window.clearTimeout(tappedBpmTimeoutRef.current);
    }
    tappedBpmTimeoutRef.current = window.setTimeout(() => {
      setTappedBpm(null);
      tappedBpmTimeoutRef.current = null;
    }, 2500);
  }, []);

  // allow tapping with spacebar (or 'T'), ignoring when typing in inputs
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return;
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        handleTapTempo();
      }
      if (e.key && e.key.toLowerCase() === 't') {
        handleTapTempo();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleTapTempo]);

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Main Control Section */}
        <div className="lg:col-span-7 space-y-12">
          {/* Large Tempo Display */}
          <div className="relative group">
            <div className="absolute -inset-8 bg-white/[0.02] rounded-[3rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative text-center">
              <span className="text-[120px] font-light tracking-tighter text-white leading-none tabular-nums">
                {bpm}
              </span>
              <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground mt-4 font-medium">
                Beats Per Minute
              </div>
              {tappedBpm !== null && (
                <div className="mt-3 text-sm text-white/90 font-medium">
                  Tapped: {tappedBpm} BPM
                </div>
              )}
              <div className="mt-4 text-xs text-muted-foreground/60 flex items-center justify-center gap-2">
                <span>Press</span>
                <kbd className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/70 font-mono text-[10px]">Space</kbd>
                <span>or</span>
                <kbd className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/70 font-mono text-[10px]">T</kbd>
                <span>to tap tempo</span>
              </div>
            </div>
          </div>

          {/* Visual Beat Indicator */}
          <div className="flex justify-center items-center gap-3">
            {Array.from({ length: timeSignature.num }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 transition-all duration-150 rounded-full",
                  i === 0 ? "w-8" : "w-4",
                  i === currentBeat && isPlaying
                    ? "bg-white shadow-[0_0_15px_rgba(255,255,255,0.4)] scale-y-125"
                    : i === 0
                      ? "bg-white/20"
                      : "bg-white/5"
                )}
              />
            ))}
          </div>

          {/* Core Controls */}
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex w-full md:w-auto gap-4">
                <Button
                  size="icon"
                  variant="outline"
                  className="w-14 h-14 md:w-16 md:h-16 rounded-2xl border-white/5 bg-white/[0.02] hover:bg-white/[0.05] shrink-0"
                  onClick={() => setBpm(b => Math.max(40, b - 1))}
                >
                  <span className="text-xl">−</span>
                </Button>

                <Slider
                  value={[bpm]}
                  onValueChange={(v) => setBpm(v[0])}
                  min={40}
                  max={280}
                  step={1}
                  className="flex-1 md:hidden"
                />

                <Button
                  size="icon"
                  variant="outline"
                  className="w-14 h-14 md:w-16 md:h-16 rounded-2xl border-white/5 bg-white/[0.02] hover:bg-white/[0.05] shrink-0"
                  onClick={() => setBpm(b => Math.min(280, b + 1))}
                >
                  <span className="text-xl">+</span>
                </Button>
              </div>

              <Slider
                value={[bpm]}
                onValueChange={(v) => setBpm(v[0])}
                min={40}
                max={280}
                step={1}
                className="hidden md:flex flex-1"
              />
            </div>

            <div className="flex gap-4">
              <Button
                size="lg"
                onClick={togglePlay}
                className={cn(
                  "flex-1 h-16 rounded-2xl text-lg font-medium transition-all duration-300",
                  isPlaying
                    ? "bg-white text-black hover:bg-white/90"
                    : "bg-white/[0.05] border border-white/10 text-white hover:bg-white/[0.08]"
                )}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 mr-3 fill-current" />
                ) : (
                  <Play className="w-5 h-5 mr-3 fill-current" />
                )}
                {isPlaying ? "Stop" : "Start"}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleTapTempo}
                className="w-16 h-16 rounded-2xl border-white/5 bg-white/[0.02] text-muted-foreground hover:text-white"
              >
                <Activity className="w-5 h-5" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={reset}
                className="w-16 h-16 rounded-2xl border-white/5 bg-white/[0.02] text-muted-foreground hover:text-white"
              >
                <RotateCcw className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Sidebar Configuration */}
        <div className="lg:col-span-5 space-y-8 lg:pl-12 lg:border-l border-white/5">
          <div className="space-y-6">
            <h3 className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold">
              Time Signature
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {[
                { num: 3, den: 4 },
                { num: 4, den: 4 },
                { num: 5, den: 4 },
                { num: 6, den: 4 },
                { num: 7, den: 4 },
                { num: 12, den: 8 },
              ].map((sig) => (
                <Button
                  key={`${sig.num}/${sig.den}`}
                  variant="outline"
                  onClick={() => setTimeSignature(sig)}
                  className={cn(
                    "h-12 rounded-xl border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all",
                    timeSignature.num === sig.num && "border-white/20 bg-white/[0.06] text-white"
                  )}
                >
                  <span className="font-semibold">{sig.num}</span>
                  <span className="text-[10px] opacity-40 mx-1">/</span>
                  <span className="text-xs opacity-60">{sig.den}</span>
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-6 pt-4">
            <h3 className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold">
              Presets
            </h3>
            <div className="space-y-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => setBpm(preset.bpm)}
                  className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-white/[0.03] transition-colors group"
                >
                  <span className="text-sm text-muted-foreground group-hover:text-white transition-colors">{preset.label}</span>
                  <span className="text-sm font-mono text-muted-foreground/60 group-hover:text-white/60">{preset.bpm}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Metronome;
