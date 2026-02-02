import { useEffect, useRef, useState, useCallback } from "react";
import { Mic, MicOff, Guitar, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

// Musical constants
const SEMITONE = 69;
const NOTE_STRINGS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const GUITAR_STRINGS = [
    { note: "E", octave: 2, freq: 82.41, name: "E2 (Low)" },
    { note: "A", octave: 2, freq: 110.00, name: "A2" },
    { note: "D", octave: 3, freq: 146.83, name: "D3" },
    { note: "G", octave: 3, freq: 196.00, name: "G3" },
    { note: "B", octave: 3, freq: 246.94, name: "B3" },
    { note: "E", octave: 4, freq: 329.63, name: "E4 (High)" },
];

export const Tuner = () => {
    const [isListening, setIsListening] = useState(false);
    const [note, setNote] = useState<string>("--");
    const [cents, setCents] = useState<number>(0);
    const [frequency, setFrequency] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);
    const [referenceA4, setReferenceA4] = useState<number>(440);

    // Target String Logic
    const [targetStringIndex, setTargetStringIndex] = useState<number | null>(null);
    // We use a history buffer to smooth out the needle
    const centsHistory = useRef<number[]>([]);

    // Audio refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const rafRef = useRef<number | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const bufferRef = useRef<Float32Array | null>(null);

    // --- Core Pitch Detection (Auto-Correlation) ---

    const getNote = useCallback((freq: number) => {
        const rawNoteNum = 12 * (Math.log(freq / referenceA4) / Math.log(2)) + SEMITONE;
        const noteNum = Math.round(rawNoteNum);
        const difference = rawNoteNum - noteNum;
        const centsVal = Math.floor(difference * 100);
        const noteName = NOTE_STRINGS[noteNum % 12];
        const octaveVal = Math.floor(noteNum / 12) - 1;

        return { noteName, octaveVal, centsVal };
    }, [referenceA4]);

    const autoCorrelate = (buffer: Float32Array, sampleRate: number) => {
        // RMS Volume Check
        let rms = 0;
        for (let i = 0; i < buffer.length; i++) {
            rms += buffer[i] * buffer[i];
        }
        rms = Math.sqrt(rms / buffer.length);
        if (rms < 0.02) return -1; // Silence threshold

        // Find first dip and peak
        let r1 = 0, r2 = buffer.length - 1;
        const thres = 0.2;
        for (let i = 0; i < buffer.length / 2; i++) {
            if (Math.abs(buffer[i]) < thres) { r1 = i; break; }
        }
        for (let i = 1; i < buffer.length / 2; i++) {
            if (Math.abs(buffer[buffer.length - i]) < thres) { r2 = buffer.length - i; break; }
        }

        const buff = buffer.slice(r1, r2);
        const c = new Float32Array(buff.length);
        for (let i = 0; i < buff.length; i++) {
            let sum = 0;
            for (let j = 0; j < buff.length - i; j++) {
                sum += buff[j] * buff[j + i];
            }
            c[i] = sum;
        }

        let d = 0; while (c[d] > c[d + 1]) d++;
        let maxval = -1, maxpos = -1;
        for (let i = d; i < buff.length; i++) {
            if (c[i] > maxval) {
                maxval = c[i];
                maxpos = i;
            }
        }

        let T0 = maxpos;

        // Parabolic interpolation
        const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
        const a = (x1 + x3 - 2 * x2) / 2;
        const b = (x3 - x1) / 2;
        if (a) T0 = T0 - b / (2 * a);

        return sampleRate / T0;
    };

    const updatePitch = useCallback(() => {
        if (!analyserRef.current || !audioContextRef.current) return;

        const buffer = bufferRef.current;
        if (!buffer) return;

        analyserRef.current.getFloatTimeDomainData(buffer);
        const ac = autoCorrelate(buffer as unknown as Float32Array, audioContextRef.current.sampleRate);

        if (ac > -1 && ac > 50 && ac < 2000) {
            // Valid frequency found
            const { noteName, centsVal } = getNote(ac);

            // Rolling average for smoother UI
            centsHistory.current.push(centsVal);
            if (centsHistory.current.length > 5) centsHistory.current.shift();
            const avgCents = centsHistory.current.reduce((a, b) => a + b, 0) / centsHistory.current.length;

            setNote(noteName);
            setCents(avgCents);
            setFrequency(ac);

            // Find closest guitar string
            let minDiff = Infinity;
            let closestIdx = -1;

            GUITAR_STRINGS.forEach((s, idx) => {
                // Simple heuristic: which string freq is closest?
                const diff = Math.abs(ac - s.freq);
                if (diff < minDiff) {
                    minDiff = diff;
                    closestIdx = idx;
                }
            });

            // Only switch string focus if we are reasonably close (e.g., within 40Hz)
            if (closestIdx !== -1 && minDiff < 50) {
                setTargetStringIndex(closestIdx);
            }

        } else {
            // Keep visual state stable for brief moments of silence, or could reset here based on preference
        }

        rafRef.current = requestAnimationFrame(updatePitch);
    }, [getNote]);

    const startListening = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    autoGainControl: false,
                    noiseSuppression: false
                }
            });

            streamRef.current = stream;
            const audioContext = new AudioContext();
            audioContextRef.current = audioContext;
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 4096; // Higher resolution
            analyserRef.current = analyser;
            bufferRef.current = new Float32Array(analyser.fftSize);

            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);
            sourceRef.current = source;

            setIsListening(true);
            setError(null);
            updatePitch();
        } catch (err) {
            console.error(err);
            setError("Microphone access denied. Please check permissions.");
            setIsListening(false);
        }
    };

    const stopListening = () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        if (sourceRef.current) sourceRef.current.disconnect();
        if (analyserRef.current) analyserRef.current.disconnect();
        if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
        }

        setIsListening(false);
        setNote("--");
        setCents(0);
        setFrequency(0);
        setTargetStringIndex(null);
        centsHistory.current = [];
    };

    useEffect(() => {
        return () => stopListening();
    }, []);

    // --- Visuals ---

    const isInTune = Math.abs(cents) < 5 && isListening && note !== "--";
    const needleAngle = Math.max(-45, Math.min(45, cents)); // +/- 45 degrees

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-8">

            {/* 
        MAIN DISPLAY AREA:
        Combines the Headstock Visual and the Precision Meter
      */}
            <div className="relative w-full bg-[#080808] rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden">
                {/* Glossy Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none z-10" />

                {/* Top Section: Headstock */}
                <div className="relative w-full h-64 md:h-80 bg-[#0c0c0c] flex items-center justify-center p-6 border-b border-white/5">
                    {/* The Headstock "Wood" Graphic (Stylized Dark) */}
                    <div className="absolute inset-x-12 top-0 bottom-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />

                    <div className="relative w-full max-w-sm h-full flex justify-between px-4 z-0">
                        {/* Visual Strings */}
                        {GUITAR_STRINGS.map((s, idx) => {
                            const isActive = targetStringIndex === idx && isListening;
                            const isPerfect = isActive && isInTune;

                            return (
                                <div
                                    key={s.name}
                                    className="relative h-full flex flex-col items-center justify-center group transition-all duration-300"
                                    style={{ opacity: isListening && !isActive && targetStringIndex !== null ? 0.3 : 1 }}
                                >
                                    {/* Peg Circle */}
                                    <div className={cn(
                                        "w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-white/10 flex items-center justify-center bg-[#151515] transition-all duration-300 shadow-lg z-20 mb-4",
                                        isActive ? "border-white/40 scale-110 shadow-[0_0_30px_rgba(255,255,255,0.1)]" : "",
                                        isPerfect ? "border-green-500 bg-green-500/10 shadow-[0_0_30px_rgba(34,197,94,0.4)]" : ""
                                    )}>
                                        <span className={cn("text-xl font-bold font-mono", isPerfect ? "text-green-400" : "text-neutral-400")}>{s.note}</span>
                                    </div>

                                    {/* String Line */}
                                    <div className={cn(
                                        "w-0.5 md:w-1 flex-1 bg-white/10 rounded-full transition-all duration-200",
                                        isActive ? "bg-blue-400/50 w-1 md:w-1.5 shadow-[0_0_15px_rgba(96,165,250,0.5)]" : "",
                                        isPerfect ? "bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.8)]" : ""
                                    )} />
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Bottom Section: Precision Meter */}
                <div className="relative h-64 bg-[#050505] flex flex-col items-center justify-center p-8 overflow-hidden">

                    {/* Center Status Light */}
                    <div className={cn(
                        "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-[100px] transition-all duration-500",
                        isInTune ? "bg-green-500/30" : isListening && note !== "--" ? "bg-blue-500/10" : "bg-transparent"
                    )} />

                    {/* Note Big Display */}
                    <div className="relative z-20 flex flex-col items-center scale-125 mb-8">
                        {isListening && note !== "--" ? (
                            <>
                                <h1 className={cn(
                                    "text-8xl font-black tracking-tighter transition-all duration-200",
                                    isInTune ? "text-green-400 drop-shadow-[0_0_30px_rgba(34,197,94,0.6)]" : "text-white"
                                )}>
                                    {note}
                                </h1>
                                <div className={cn(
                                    "flex items-center gap-2 mt-2 px-3 py-1 rounded-full border bg-black/40 backdrop-blur-md",
                                    isInTune ? "border-green-500/30 text-green-400" : "border-white/10 text-neutral-400"
                                )}>
                                    {isInTune && <CheckCircle2 className="w-3 h-3" />}
                                    <span className="text-xs font-mono font-bold tracking-widest uppercase">
                                        {isInTune ? "Perfect" : Math.abs(cents) > 10 ? (cents > 0 ? "Too Sharp" : "Too Flat") : "Close..."}
                                    </span>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center gap-4 opacity-30">
                                <Guitar className="w-16 h-16" />
                                <span className="text-xl font-light uppercase tracking-widest">Ready to Tune</span>
                            </div>
                        )}
                    </div>

                    {/* Needle Arc */}
                    {isListening && note !== "--" && (
                        <div className="absolute bottom-0 w-full flex justify-center pb-8">
                            <div className="relative w-full max-w-sm h-12">
                                {/* Center Marker */}
                                <div className="absolute left-1/2 bottom-0 w-0.5 h-8 bg-green-500/50 -translate-x-1/2 z-10" />

                                {/* Needle */}
                                <div
                                    className={cn(
                                        "absolute bottom-0 left-1/2 w-1 h-12 origin-bottom rounded-full transition-all duration-100 ease-out -ml-0.5",
                                        isInTune ? "bg-green-400 shadow-[0_0_15px_rgba(34,197,94,0.8)]" : "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                                    )}
                                    style={{ transform: `rotate(${needleAngle}deg)` }}
                                >
                                    <div className="w-3 h-3 bg-white rounded-full absolute -top-1.5 -left-1 shadow-lg" />
                                </div>

                                {/* Ticks */}
                                <div className="absolute bottom-0 w-full h-full flex justify-between px-10 items-end opacity-20">
                                    <div className="w-0.5 h-4 bg-white" />
                                    <div className="w-0.5 h-6 bg-white" />
                                    <div className="w-0.5 h-4 bg-white" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Frequency Hz */}
                    {isListening && note !== "--" && (
                        <div className="absolute bottom-4 right-6 font-mono text-[10px] text-white/20">
                            {frequency.toFixed(1)} Hz
                        </div>
                    )}

                </div>
            </div>

            {/* Control Bar */}
            <div className="w-full flex items-center justify-between gap-4 p-4 bg-white/[0.03] border border-white/5 rounded-2xl backdrop-blur-sm">
                <Button
                    size="lg"
                    onClick={isListening ? stopListening : startListening}
                    className={cn(
                        "h-14 px-8 rounded-xl text-base font-bold shadow-lg transition-all min-w-[160px]",
                        isListening
                            ? "bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20 hover:border-red-500/40 border"
                            : "bg-white text-black hover:bg-white/90"
                    )}
                >
                    {isListening ? (
                        <>
                            <MicOff className="w-4 h-4 mr-2" />
                            Stop
                        </>
                    ) : (
                        <>
                            <Mic className="w-4 h-4 mr-2" />
                            Start Tuner
                        </>
                    )}
                </Button>

                <div className="h-8 w-px bg-white/10 mx-2" />

                <div className="flex items-center gap-4 flex-1">
                    <span className="text-xs text-neutral-500 font-bold uppercase tracking-wider whitespace-nowrap hidden md:block">Ref. Pitch</span>
                    <div className="flex items-center gap-3 flex-1 max-w-[200px]">
                        <span className="text-white font-mono text-sm">{referenceA4}Hz</span>
                        <Slider
                            value={[referenceA4]}
                            onValueChange={(v: number[]) => setReferenceA4(v[0])}
                            min={430}
                            max={450}
                            step={1}
                            className="flex-1"
                        />
                    </div>
                </div>
            </div>

            {error && (
                <div className="w-full p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center font-medium">
                    {error}
                </div>
            )}
        </div>
    );
};
