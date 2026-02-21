import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import WaveformViewer from "@/components/chord-ai/WaveformViewer";
import { Wand2, Upload, Mic, Music2, Download, Loader2, Drum, Guitar, Piano, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { usePageMetadata } from "@/hooks/usePageMetadata";
import { SEOContent, Breadcrumb } from "@/components/SEOContent";

// Stem configuration with icons and colors
const STEM_CONFIG = {
    vocals: { label: "Vocals", icon: Mic, color: "from-pink-500/20 to-pink-500/5", borderColor: "border-pink-500/20" },
    drums: { label: "Drums", icon: Drum, color: "from-orange-500/20 to-orange-500/5", borderColor: "border-orange-500/20" },
    bass: { label: "Bass", icon: Music2, color: "from-purple-500/20 to-purple-500/5", borderColor: "border-purple-500/20" },
    guitar: { label: "Guitar", icon: Guitar, color: "from-amber-500/20 to-amber-500/5", borderColor: "border-amber-500/20" },
    piano: { label: "Piano", icon: Piano, color: "from-blue-500/20 to-blue-500/5", borderColor: "border-blue-500/20" },
    other: { label: "Other", icon: Music2, color: "from-green-500/20 to-green-500/5", borderColor: "border-green-500/20" },
} as const;

type StemType = keyof typeof STEM_CONFIG;
const STEM_TYPES: StemType[] = ["vocals", "drums", "bass", "guitar", "piano", "other"];

interface StemData {
    url: string;
    audio: AudioBuffer | null;
    peaks: number[];
    volume: number;
    muted: boolean;
}

// Audio nodes managed via ref to avoid stale closure issues
interface AudioNodes {
    sourceNode: AudioBufferSourceNode | null;
    gainNode: GainNode | null;
}

const StemSeparatorPage = () => {
    usePageMetadata({
        title: "Stem Splitter AI - Extract Vocals, Drums, Bass, Guitar, Piano | Guitariz",
        description: "Separate any song into 6 stems with Stem Splitter AI: vocals, drums, bass, guitar, piano, and other. High-quality AI stem extraction for music production.",
        keywords: "stem splitter ai, stem separator, music splitter, extract drums, extract bass, extract guitar, extract piano, vocal remover, music ai, audio splitter",
        canonicalUrl: "https://guitariz.studio/stem-separator",
        ogImage: "https://guitariz.studio/logo2.png",
        ogType: "website",
        jsonLd: {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Guitariz Stem Separator",
            "applicationCategory": "MultimediaApplication",
            "operatingSystem": "Web",
            "description": "Separate songs into 6 stems: vocals, drums, bass, guitar, piano, and other.",
            "url": "https://guitariz.studio/stem-separator",
            "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "bestRating": "5",
                "worstRating": "1",
                "reviewCount": "72"
            }
        }
    });

    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const { toast } = useToast();

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [separated, setSeparated] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [stemFormat, setStemFormat] = useState<"wav" | "mp3">("mp3");

    // Stem state (without audio nodes - those are in refs)
    const [stems, setStems] = useState<Record<StemType, StemData>>(() => {
        const initial: Record<string, StemData> = {};
        STEM_TYPES.forEach(stem => {
            initial[stem] = { url: "", audio: null, peaks: [], volume: 100, muted: false };
        });
        return initial as Record<StemType, StemData>;
    });

    const [downloading, setDownloading] = useState<Record<StemType, boolean>>(() => {
        const initial: Record<string, boolean> = {};
        STEM_TYPES.forEach(stem => { initial[stem] = false; });
        return initial as Record<StemType, boolean>;
    });

    const audioContextRef = useRef<AudioContext | null>(null);
    const startTimeRef = useRef<number>(0);
    const offsetRef = useRef<number>(0);
    const rafRef = useRef<number | null>(null);

    // Store audio nodes in refs to avoid stale closures
    const audioNodesRef = useRef<Record<StemType, AudioNodes>>({
        vocals: { sourceNode: null, gainNode: null },
        drums: { sourceNode: null, gainNode: null },
        bass: { sourceNode: null, gainNode: null },
        guitar: { sourceNode: null, gainNode: null },
        piano: { sourceNode: null, gainNode: null },
        other: { sourceNode: null, gainNode: null },
    });

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);

    const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

    const computePeaks = (audioBuffer: AudioBuffer, buckets = 400): number[] => {
        const channelData = audioBuffer.getChannelData(0);
        const blockSize = Math.max(1, Math.floor(channelData.length / buckets));
        const peaks: number[] = [];
        for (let i = 0; i < buckets; i += 1) {
            const start = i * blockSize;
            const end = Math.min(start + blockSize, channelData.length);
            let max = 0;
            for (let j = start; j < end; j += 1) {
                max = Math.max(max, Math.abs(channelData[j]));
            }
            peaks.push(max);
        }
        return peaks;
    };

    const duration = useMemo(() => {
        const durations = STEM_TYPES.map(stem => stems[stem].audio?.duration ?? 0);
        return Math.max(...durations);
    }, [stems]);

    const stopRaf = () => {
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
    };

    const updateClock = useCallback(() => {
        if (!audioContextRef.current) return;
        const ctx = audioContextRef.current;
        const now = offsetRef.current + (ctx.currentTime - startTimeRef.current);
        setCurrentTime(clamp(now, 0, duration));
        rafRef.current = requestAnimationFrame(updateClock);
    }, [duration]);

    const teardownSources = useCallback(() => {
        STEM_TYPES.forEach(stem => {
            const nodes = audioNodesRef.current[stem];
            if (nodes.sourceNode) {
                try { nodes.sourceNode.stop(0); } catch { /* ignore */ }
                nodes.sourceNode.disconnect();
                nodes.sourceNode = null;
            }
            // Keep gain nodes - they can be reused
        });
    }, []);

    const pause = useCallback(() => {
        const ctx = audioContextRef.current;
        if (!ctx) return;

        const elapsed = ctx.currentTime - startTimeRef.current;
        offsetRef.current = clamp(offsetRef.current + elapsed, 0, duration);
        setCurrentTime(offsetRef.current);
        teardownSources();
        setIsPlaying(false);
    }, [duration, teardownSources]);

    const play = useCallback(async () => {
        const hasAudio = STEM_TYPES.some(stem => stems[stem].audio);
        if (!hasAudio) {
            return;
        }

        let ctx = audioContextRef.current;
        if (!ctx) {
            ctx = new AudioContext();
            audioContextRef.current = ctx;
        }

        if (ctx.state === 'suspended') {
            await ctx.resume();
        }

        if (offsetRef.current >= duration - 0.1) {
            offsetRef.current = 0;
        }

        // Stop any existing playback
        teardownSources();

        startTimeRef.current = ctx.currentTime;
        let firstSourceNode: AudioBufferSourceNode | null = null;

        STEM_TYPES.forEach(stem => {
            const stemData = stems[stem];
            if (!stemData.audio) return;

            const source = ctx!.createBufferSource();
            source.buffer = stemData.audio;

            // Create or reuse gain node
            let gain = audioNodesRef.current[stem].gainNode;
            if (!gain) {
                gain = ctx!.createGain();
                gain.connect(ctx!.destination);
                audioNodesRef.current[stem].gainNode = gain;
            }

            gain.gain.value = stemData.muted ? 0 : stemData.volume / 100;

            source.connect(gain);
            source.start(0, offsetRef.current);

            audioNodesRef.current[stem].sourceNode = source;

            if (!firstSourceNode) {
                firstSourceNode = source;
            }
        });

        setIsPlaying(true);

        // Handle end of playback
        if (firstSourceNode) {
            (firstSourceNode as AudioBufferSourceNode).onended = () => {
                const ctx = audioContextRef.current;
                if (!ctx) return;
                const elapsed = ctx.currentTime - startTimeRef.current;
                if (offsetRef.current + elapsed >= duration - 0.1) {
                    setIsPlaying(false);
                    offsetRef.current = duration;
                    setCurrentTime(duration);
                    teardownSources();
                }
            };
        }
    }, [stems, duration, teardownSources]);

    const seek = useCallback((time: number) => {
        const clamped = clamp(time, 0, duration);
        offsetRef.current = clamped;
        setCurrentTime(clamped);

        // If playing, restart playback from new position
        if (isPlaying) {
            teardownSources();
            // Small delay to ensure sources are torn down
            setTimeout(() => play(), 10);
        }
    }, [duration, isPlaying, play, teardownSources]);

    const handleFileSelect = (file: File) => {
        setSelectedFile(file);
        setSeparated(false);
        teardownSources();
        // Reset audio nodes
        STEM_TYPES.forEach(stem => {
            if (audioNodesRef.current[stem].gainNode) {
                audioNodesRef.current[stem].gainNode!.disconnect();
                audioNodesRef.current[stem].gainNode = null;
            }
        });
        setStems(prev => {
            const updated = { ...prev };
            STEM_TYPES.forEach(stem => {
                updated[stem] = { url: "", audio: null, peaks: [], volume: 100, muted: false };
            });
            return updated;
        });
    };

    const notifyDone = async () => {
        // Try an OS/browser notification for background-tab friendliness
        if (!("Notification" in window)) return;

        try {
            if (Notification.permission === "granted") {
                new Notification("Stem Separator", {
                    body: "Your 6 stems are ready for preview and download.",
                });
                return;
            }

            if (Notification.permission === "default") {
                const perm = await Notification.requestPermission();
                if (perm === "granted") {
                    new Notification("Stem Separator", {
                        body: "Your 6 stems are ready for preview and download.",
                    });
                }
            }
        } catch {
            // ignore if browser blocks/throws
        }
    };

    const processSeparation = async () => {
        if (!selectedFile) return;

        setProcessing(true);
        setUploadProgress(0);

        // Notify user immediately that processing has started
        toast({
            title: "Processing started",
            description: "Uploading your file. 6-stem separation takes 5-10 minutes on CPU.",
        });

        try {
            const formData = new FormData();
            formData.append("file", selectedFile);
            formData.append("format", "mp3");

            const apiUrl = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
            const endpoint = `${apiUrl}/api/separate-stems`;

            const result = await new Promise<Record<string, string>>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open("POST", endpoint);

                xhr.upload.addEventListener("progress", (e) => {
                    if (e.lengthComputable) {
                        setUploadProgress(Math.round((e.loaded * 100) / e.total));
                    }
                });

                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            resolve(JSON.parse(xhr.responseText));
                        } catch {
                            reject(new Error("Invalid response from server"));
                        }
                    } else {
                        try {
                            const errorData = JSON.parse(xhr.responseText);
                            reject(new Error(errorData.detail || `Separation failed (HTTP ${xhr.status})`));
                        } catch {
                            reject(new Error(`Separation failed (HTTP ${xhr.status})`));
                        }
                    }
                };

                xhr.onerror = () => reject(new Error("Network error: Could not connect to backend."));
                xhr.send(formData);
            });

            // Upload finished, separation complete on server
            toast({
                title: "Separation finished",
                description: "Loading stems for preview...",
            });

            // Build absolute URLs for each stem
            const newStems = { ...stems };
            const format = (result.format || "wav") as "wav" | "mp3";
            setStemFormat(format);

            const ctx = new AudioContext();
            audioContextRef.current = ctx;

            for (const stem of STEM_TYPES) {
                const urlKey = `${stem}Url`;
                if (result[urlKey]) {
                    const absUrl = new URL(result[urlKey], apiUrl + "/").toString();
                    newStems[stem] = { ...newStems[stem], url: absUrl };

                    try {
                        const response = await fetch(absUrl);
                        const arrayBuffer = await response.arrayBuffer();
                        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
                        newStems[stem] = {
                            ...newStems[stem],
                            audio: audioBuffer,
                            peaks: computePeaks(audioBuffer),
                        };
                    } catch (e) {
                        console.error(`Failed to load ${stem} audio:`, e);
                    }
                }
            }

            setStems(newStems);
            setSeparated(true);
            setUploadProgress(null);
            offsetRef.current = 0;
            setCurrentTime(0);

            toast({
                title: "Separation complete!",
                description: "All 6 stems are ready. Preview may take a moment to load.",
            });

            void notifyDone();

        } catch (error) {
            setUploadProgress(null);
            let errorMessage = "Could not separate audio. Please try again.";
            if (error instanceof Error) errorMessage = error.message;

            toast({
                title: "Separation failed",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setProcessing(false);
        }
    };

    const updateStemVolume = (stem: StemType, value: number[]) => {
        const newVolume = value[0];
        setStems(prev => {
            const updated = { ...prev };
            updated[stem] = { ...updated[stem], volume: newVolume };
            return updated;
        });
        // Update gain node in ref
        const gainNode = audioNodesRef.current[stem].gainNode;
        if (gainNode) {
            const stemData = stems[stem];
            gainNode.gain.value = stemData.muted ? 0 : newVolume / 100;
        }
    };

    const toggleMute = (stem: StemType) => {
        setStems(prev => {
            const updated = { ...prev };
            const newMuted = !updated[stem].muted;
            updated[stem] = { ...updated[stem], muted: newMuted };
            // Update gain node in ref
            const gainNode = audioNodesRef.current[stem].gainNode;
            if (gainNode) {
                gainNode.gain.value = newMuted ? 0 : updated[stem].volume / 100;
            }
            return updated;
        });
    };

    const downloadStem = async (stem: StemType) => {
        const url = stems[stem].url;
        if (!url) {
            toast({
                title: "Download failed",
                description: "Stem not found. Please process the file first.",
                variant: "destructive",
            });
            return;
        }

        if (downloading[stem]) return;

        setDownloading(d => ({ ...d, [stem]: true }));

        toast({
            title: "Requesting file…",
            description: `${STEM_CONFIG[stem].label} is being prepared.`,
        });

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error("Download failed");

            const blob = await response.blob();
            const downloadUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = downloadUrl;
            a.download = `${selectedFile?.name.split(".")[0] || "audio"}_${stem}.${stemFormat}`;
            a.click();
            URL.revokeObjectURL(downloadUrl);

            toast({
                title: "Download started",
                description: `${STEM_CONFIG[stem].label} download has begun.`,
            });
        } catch {
            toast({
                title: "Download failed",
                description: "Could not download the stem file.",
                variant: "destructive",
            });
        } finally {
            setDownloading(d => ({ ...d, [stem]: false }));
        }
    };

    useEffect(() => {
        if (isPlaying) {
            updateClock();
        } else {
            stopRaf();
        }
        return () => stopRaf();
    }, [isPlaying, duration, updateClock]);

    useEffect(() => {
        return () => {
            stopRaf();
            teardownSources();
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, [teardownSources]);

    return (
        <div className="min-h-screen bg-[#030303] relative overflow-hidden selection:bg-white/10">
            <main className="container mx-auto px-4 md:px-6 pt-8 md:pt-12 pb-16 relative z-10">
                <div className="max-w-6xl mx-auto">

                    <Breadcrumb items={[
                        { name: "Home", url: "https://guitariz.studio/" },
                        { name: "Stem Separator", url: "https://guitariz.studio/stem-separator" }
                    ]} />

                    {/* Header */}
                    <div className="mb-12 text-center space-y-6">
                        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-white/5 bg-white/[0.02] text-muted-foreground text-[10px] font-bold tracking-[0.2em] uppercase">
                            <Wand2 className="w-3 h-3" />
                            <span>AI-Powered 6-Stem Separation</span>
                        </div>

                        <div className="space-y-4">
                            <h1 className="text-5xl md:text-7xl font-light tracking-tighter text-white">
                                Stem <span className="text-muted-foreground font-thin">Separator</span>
                            </h1>
                            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-light">
                                Separate any song into vocals, drums, bass, guitar, piano, and other. Download individual stems for remixing, practice, or production.
                            </p>
                            <div className="mt-4 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 max-w-2xl mx-auto">
                                <p className="text-xs text-amber-200/80">
                                    <strong className="text-amber-300">⚠️ Note:</strong> 6-stem separation takes 5-10 minutes on CPU. Please be patient.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="glass-card rounded-[2.5rem] border border-white/5 bg-[#0a0a0a]/90 shadow-2xl overflow-hidden min-h-[500px] flex flex-col p-8">
                        {!selectedFile ? (
                            <div
                                className={cn(
                                    "flex-1 border-2 border-dashed rounded-[2rem] transition-all flex flex-col items-center justify-center p-12 text-center cursor-pointer",
                                    dragActive ? "border-white/20 bg-white/[0.03]" : "border-white/5 hover:border-white/10"
                                )}
                                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                                onDragLeave={() => setDragActive(false)}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    setDragActive(false);
                                    if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
                                }}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="audio/*"
                                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                                />
                                <div className="w-24 h-24 bg-white/[0.03] rounded-full flex items-center justify-center mb-8 border border-white/5">
                                    <Upload className="w-10 h-10 text-muted-foreground" />
                                </div>
                                <h3 className="text-2xl font-light text-white mb-3">Upload Audio File</h3>
                                <p className="text-muted-foreground max-w-sm font-light">
                                    Drag and drop or click to select an audio file to split into 6 stems.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* File Info */}
                                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-1">Selected File</p>
                                        <h3 className="text-lg font-medium text-white">{selectedFile.name}</h3>
                                    </div>
                                    <Button
                                        onClick={() => {
                                            setSelectedFile(null);
                                            setSeparated(false);
                                        }}
                                        variant="outline"
                                        className="rounded-lg"
                                    >
                                        Change File
                                    </Button>
                                </div>

                                {/* Process Button */}
                                {!separated && (
                                    <Button
                                        onClick={processSeparation}
                                        disabled={processing}
                                        className="w-full h-14 rounded-2xl bg-white text-black hover:bg-white/90 text-lg font-semibold"
                                    >
                                        {processing ? (
                                            <>
                                                <Loader2 className="w-5 h-5 mr-2" style={{ animation: 'spin 1s linear infinite' }} />
                                                {uploadProgress !== null && uploadProgress < 100
                                                    ? `Uploading… ${uploadProgress}%`
                                                    : "Separating into 6 stems… (5-10 min)"}
                                            </>
                                        ) : (
                                            <>
                                                <Wand2 className="w-5 h-5 mr-2" />
                                                Separate Into 6 Stems
                                            </>
                                        )}
                                    </Button>
                                )}

                                {/* Upload Progress */}
                                {processing && uploadProgress !== null && uploadProgress < 100 && (
                                    <div className="w-full space-y-2">
                                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-500 transition-all duration-300"
                                                style={{ width: `${uploadProgress}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between items-center px-1">
                                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Uploading</span>
                                            <span className="text-[10px] text-blue-400 font-mono">{uploadProgress}%</span>
                                        </div>
                                    </div>
                                )}

                                {/* Stem Controls Grid */}
                                {separated && (
                                    <div className="space-y-6">
                                        {/* Playback Controls */}
                                        <Button
                                            onClick={isPlaying ? pause : play}
                                            className="w-full h-14 rounded-2xl bg-white text-black hover:bg-white/90 text-lg font-semibold"
                                        >
                                            {isPlaying ? "⏸ Pause All Stems" : "▶ Play All Stems"}
                                        </Button>

                                        {/* 6-Stem Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {STEM_TYPES.map((stem) => {
                                                const config = STEM_CONFIG[stem];
                                                const stemData = stems[stem];
                                                const Icon = config.icon;

                                                return (
                                                    <div
                                                        key={stem}
                                                        className={cn(
                                                            "p-4 rounded-2xl border bg-gradient-to-b",
                                                            config.color,
                                                            config.borderColor,
                                                            stemData.muted && "opacity-50"
                                                        )}
                                                    >
                                                        {/* Header */}
                                                        <div className="flex items-center justify-between mb-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className="p-1.5 rounded-lg bg-white/5 border border-white/5">
                                                                    <Icon className="w-4 h-4 text-white" />
                                                                </div>
                                                                <Label className="text-sm font-bold text-white">{config.label}</Label>
                                                            </div>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-8 w-8 p-0"
                                                                onClick={() => toggleMute(stem)}
                                                            >
                                                                {stemData.muted ? (
                                                                    <VolumeX className="w-4 h-4 text-red-400" />
                                                                ) : (
                                                                    <Volume2 className="w-4 h-4 text-white" />
                                                                )}
                                                            </Button>
                                                        </div>

                                                        {/* Waveform */}
                                                        {stemData.peaks.length > 0 && (
                                                            <div className="bg-black/20 rounded-xl border border-white/5 p-1 mb-3 overflow-hidden">
                                                                <WaveformViewer
                                                                    peaks={stemData.peaks}
                                                                    duration={duration}
                                                                    currentTime={currentTime}
                                                                    chordSegments={[]}
                                                                    onSeek={seek}
                                                                />
                                                            </div>
                                                        )}

                                                        {/* Volume Slider */}
                                                        <div className="space-y-2">
                                                            <div className="flex justify-between text-xs text-muted-foreground">
                                                                <span>Volume</span>
                                                                <span>{stemData.volume}%</span>
                                                            </div>
                                                            <Slider
                                                                value={[stemData.volume]}
                                                                onValueChange={(v) => updateStemVolume(stem, v)}
                                                                max={100}
                                                                step={1}
                                                                className="w-full"
                                                                disabled={stemData.muted}
                                                            />
                                                        </div>

                                                        {/* Download Button */}
                                                        <Button
                                                            onClick={() => downloadStem(stem)}
                                                            disabled={downloading[stem] || !stemData.url}
                                                            variant="outline"
                                                            size="sm"
                                                            className="w-full mt-3 rounded-lg"
                                                        >
                                                            {downloading[stem] ? (
                                                                <>
                                                                    <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                                                                    Downloading…
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Download className="w-3 h-3 mr-2" />
                                                                    Download {config.label}
                                                                </>
                                                            )}
                                                        </Button>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <p className="text-xs text-muted-foreground text-center">
                                            Click on any waveform to seek. Use mute buttons to isolate stems.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* SEO FAQ */}
                <SEOContent
                    pageName="stem-separator"
                    faqs={[
                        {
                            question: "What is AI Stem Separator and how does it work?",
                            answer: "AI Stem Separator uses Demucs, a state-of-the-art neural network, to separate any song into 6 distinct stems: vocals, drums, bass, guitar, piano, and other instruments. It analyzes the audio and uses machine learning to isolate each component with high accuracy.",
                        },
                        {
                            question: "How long does 6-stem separation take?",
                            answer: "On CPU, 6-stem separation typically takes 5-10 minutes for a 3-minute song. This is more intensive than 2-stem (vocal/instrumental) separation because it extracts more detailed components. Please be patient during processing.",
                        },
                        {
                            question: "What can I do with the separated stems?",
                            answer: "You can remix songs, create custom backing tracks, practice guitar along with isolated instruments, produce covers, sample individual instruments, create karaoke versions, analyze arrangements, and much more.",
                        },
                        {
                            question: "Is the Stem Separator free?",
                            answer: "Yes! The Guitariz Stem Separator is completely free with no limits. You can separate as many songs as you want without any subscription or credits.",
                        },
                        {
                            question: "What audio formats are supported?",
                            answer: "The Stem Separator supports MP3, WAV, FLAC, M4A, OGG, and most common audio formats. For best results, use high-quality source files.",
                        },
                    ]}
                />
            </main>
        </div>
    );
};

export default StemSeparatorPage;
