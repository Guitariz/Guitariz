import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, RotateCcw } from "lucide-react";

const Metronome = () => {
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [timeSignature, setTimeSignature] = useState({ num: 4, den: 4 });
  const intervalRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const playClick = (isAccent: boolean) => {
    if (!audioContextRef.current) return;
    
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = isAccent ? 1000 : 800;
    gainNode.gain.value = isAccent ? 0.3 : 0.2;

    oscillator.start(ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    oscillator.stop(ctx.currentTime + 0.1);
  };

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
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, bpm, timeSignature]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      setCurrentBeat(0);
    }
  };

  const reset = () => {
    setIsPlaying(false);
    setCurrentBeat(0);
    setBpm(120);
    setTimeSignature({ num: 4, den: 4 });
  };

  return (
    <div className="w-full relative">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-accent/10 via-primary/5 to-transparent rounded-full blur-3xl"></div>
      </div>

      <div className="mb-6 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-accent/20 to-primary/20 rounded-2xl glow-accent">
            <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gradient">Metronome</h2>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Keep perfect time while you practice
        </p>
      </div>

      <div className="max-w-2xl mx-auto glass-card rounded-3xl p-12 shadow-2xl border border-white/10 backdrop-blur-xl bg-gradient-to-br from-background/90 via-background/80 to-background/70 relative overflow-hidden">
        {/* Inner glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 rounded-3xl"></div>
        {/* BPM Display */}
        <div className="text-center mb-10 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-full blur-3xl opacity-50"></div>
          <div className="relative text-7xl font-black text-gradient mb-3 drop-shadow-lg">{bpm}</div>
          <div className="text-sm text-muted-foreground uppercase tracking-widest font-semibold">
            Beats Per Minute
          </div>
        </div>

        {/* Visual beats */}
        <div className="flex justify-center gap-8 mb-10 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-accent/10 via-primary/10 to-accent/10 rounded-full blur-2xl opacity-30"></div>
          {Array.from({ length: timeSignature.num }).map((_, i) => (
            <div
              key={i}
              className={`relative w-16 h-16 rounded-full transition-all duration-300 ease-in-out border-2 ${
                i === currentBeat && isPlaying
                  ? "bg-gradient-to-br from-primary via-accent to-primary scale-125 shadow-2xl shadow-primary/70 animate-pulse border-primary/50"
                  : i === 0
                  ? "bg-gradient-to-br from-secondary/60 to-secondary/40 border-secondary/60 hover:bg-secondary/70 hover:scale-110"
                  : "bg-gradient-to-br from-muted/50 to-muted/30 border-muted/40 hover:bg-muted/60 hover:scale-110"
              }`}
            />
          ))}
        </div>

        {/* BPM Slider */}
        <div className="mb-10 relative">
          <div className="flex justify-between mb-3">
            <span className="text-sm font-semibold text-foreground/80">Tempo Control</span>
            <span className="text-sm text-muted-foreground font-medium bg-muted/30 px-2 py-1 rounded-full">{bpm} BPM</span>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-full blur-sm"></div>
            <Slider
              value={[bpm]}
              onValueChange={(value) => setBpm(value[0])}
              min={40}
              max={240}
              step={1}
              className="w-full relative z-10"
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground font-medium">
            <span>40</span>
            <span>240</span>
          </div>
        </div>

        {/* Time Signature */}
        <div className="mb-10">
          <div className="text-center mb-4">
            <label className="text-sm font-semibold text-foreground/80 uppercase tracking-wider">
              Time Signature
            </label>
          </div>
          <div className="flex gap-3 flex-wrap justify-center">
            {[
              { num: 3, den: 4 },
              { num: 4, den: 4 },
              { num: 5, den: 4 },
              { num: 6, den: 4 },
              { num: 6, den: 8 },
              { num: 7, den: 4 },
            ].map((sig) => (
              <Button
                key={`${sig.num}/${sig.den}`}
                variant={timeSignature.num === sig.num && timeSignature.den === sig.den ? "default" : "outline"}
                onClick={() => setTimeSignature(sig)}
                className={`transition-all duration-300 px-6 py-3 rounded-xl font-semibold ${
                  timeSignature.num === sig.num && timeSignature.den === sig.den
                    ? "bg-gradient-to-r from-primary to-accent text-white scale-105 shadow-xl border-primary/50 ring-2 ring-primary/30"
                    : "border-white/20 hover:bg-gradient-to-r hover:from-white/10 hover:to-primary/5 hover:scale-105 hover:border-primary/40 hover:shadow-lg backdrop-blur-sm"
                }`}
              >
                <span className="text-lg font-black">{sig.num}</span>
                <span className="text-xs opacity-80">/{sig.den}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-6 flex-wrap mb-8">
          <Button
            size="lg"
            onClick={togglePlay}
            className={`transition-all duration-300 gap-3 px-10 py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl ${
              isPlaying
                ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white scale-105 ring-2 ring-red-400/50"
                : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white scale-105 ring-2 ring-green-400/50"
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-6 h-6" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-6 h-6" />
                Start
              </>
            )}
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={reset}
            className="border-white/30 hover:bg-gradient-to-r hover:from-white/10 hover:to-primary/5 hover:scale-105 transition-all duration-300 gap-3 px-8 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl backdrop-blur-sm"
          >
            <RotateCcw className="w-5 h-5" />
            Reset
          </Button>
        </div>

        {/* Preset tempos */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 rounded-2xl blur-xl opacity-50"></div>
          <div className="relative bg-gradient-to-br from-background/60 to-background/40 rounded-2xl p-8 border border-white/10 backdrop-blur-sm">
            <div className="text-center mb-6">
              <div className="text-sm font-bold text-foreground/80 uppercase tracking-widest mb-2">
                Quick Presets
              </div>
              <p className="text-xs text-muted-foreground">Tap to instantly set tempo</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Largo", bpm: 60, desc: "Very slow" },
                { label: "Andante", bpm: 90, desc: "Walking pace" },
                { label: "Moderato", bpm: 120, desc: "Moderate" },
                { label: "Allegro", bpm: 150, desc: "Fast" },
              ].map((preset) => (
                <Button
                  key={preset.label}
                  variant="ghost"
                  size="sm"
                  onClick={() => setBpm(preset.bpm)}
                  className="hover:bg-gradient-to-br hover:from-primary/20 hover:to-accent/20 hover:scale-105 transition-all duration-300 flex flex-col h-auto py-6 px-4 rounded-xl border border-white/10 hover:border-primary/30 shadow-lg hover:shadow-xl backdrop-blur-sm group"
                >
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium group-hover:text-primary/80 transition-colors">
                    {preset.label}
                  </div>
                  <div className="font-black text-2xl text-gradient mb-1">{preset.bpm}</div>
                  <div className="text-xs text-muted-foreground/60 font-medium">{preset.desc}</div>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Metronome;
