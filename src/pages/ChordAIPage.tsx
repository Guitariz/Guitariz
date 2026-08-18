import { useEffect, useMemo, useRef, useState } from "react";

import WaveformViewer from "@/components/chord-ai/WaveformViewer";
import ChordTimeline from "@/components/chord-ai/ChordTimeline";
import HorizontalChordTape from "@/components/chord-ai/HorizontalChordTape";
import AnalysisSummary from "@/components/chord-ai/AnalysisSummary";
import ConfidenceSummary from "@/components/chord-ai/ConfidenceSummary";
import { LiveChordIndicator } from "@/components/chord-ai/LiveChordIndicator";
import { useToast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { openFeedbackModal } from "@/components/FeedbackModal";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useChordAnalysis } from "@/hooks/useChordAnalysis";
import { useChordWebSocket } from "@/hooks/useChordWebSocket";
import { AnalysisResult } from "@/types/chordAI";
import { usePageMetadata } from "@/hooks/usePageMetadata";
import ChordDiagram from "@/components/chord/ChordDiagram";
import UkuleleDiagram from "@/components/chord/UkuleleDiagram";
import PianoChordDiagram from "@/components/chord/PianoChordDiagram";
import { getUkuleleFrets } from "@/lib/chordTones";
import { findChordByName, chordLibraryData } from "@/data/chordData";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAnalysisHistory } from "@/hooks/useAnalysisHistory";
import { useChordAIStore } from "@/stores/chordAIStore";
import { Link } from "react-router-dom";
import { Bot, Upload, Pause, Play, Activity, Settings2, Sparkles, Wand2, Download, History, Trash2, Share2, Youtube, ArrowRight, FileAudio, AlertTriangle, ArrowUpDown, RotateCcw } from "lucide-react";
import YouTubePlayer from "@/components/chord-ai/YouTubePlayer";
import { cn } from "@/lib/utils";
import { ChordAISkeleton } from "@/components/ui/SkeletonLoader";
import { transposeChord, transposeKey } from "@/lib/transposition";
import { Slider } from "@/components/ui/slider";
import { SEOContent, Breadcrumb } from "@/components/SEOContent";
import RelatedTools from "@/components/RelatedTools";
import { generateShareUrl, copyToClipboard, getShareParamFromUrl, decodeShareableState, clearShareParamFromUrl } from "@/lib/shareUtils";
import { exportChordsToMidi } from "@/lib/midiExport";
import { clearAllAnalysisCache } from "@/lib/analysisCache";
import { clearAllAudioCache } from "@/lib/audioCache";
import staticContent from "@/data/staticContent.json";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

const ChordAIPage = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();
  const { history, saveToHistory, clearHistory, removeFromHistory } = useAnalysisHistory();

  usePageMetadata({
    title: staticContent.chordAi.title,
    description: staticContent.chordAi.description,
    keywords: "chord ai, chord ai free, audio to chords, chord recognition, chord identifier, extract chords from audio, music ai, guitar chords, audio analysis",
    canonicalUrl: "https://guitariz.studio/chord-ai",
    ogImage: "https://guitariz.studio/logo2.png",
    ogType: "website",
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "SoftwareApplication",
          "name": "Chord AI - Guitariz",
          "url": "https://guitariz.studio/chord-ai",
          "description": "Advanced Chord AI: Extract chords, tempo, and scales from audio using neural networks.",
          "applicationCategory": "MusicApplication",
          "operatingSystem": "Web",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "bestRating": "5",
            "worstRating": "1",
            "reviewCount": "84"
          }
        },
        {
          "@type": "HowTo",
          "name": "How to extract chords from any song using Guitariz Chord AI",
          "step": [
            {
              "@type": "HowToStep",
              "text": "Upload your audio file (MP3, WAV, FLAC) to the Chord AI engine."
            },
            {
              "@type": "HowToStep",
              "text": "Enable 'Vocal Filter' if the song has prominent vocals for better accuracy."
            },
            {
              "@type": "HowToStep",
              "text": "Wait for the AI to analyze the harmonic structure and generate the chord map."
            },
            {
              "@type": "HowToStep",
              "text": "Use the interactive player to play along with the extracted chords in real-time."
            }
          ]
        }
      ]
    }
  });

  const { loadFile, play, pause, seek, audioBuffer, peaks, duration, currentTime, isPlaying, fileInfo, transpose, setTranspose, tempo, setTempo, getAudioChunk } =
    useAudioPlayer();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { showSimple, setShowSimple, separateVocals, setSeparateVocals, analysisMode, setAnalysisMode, liveChordEnabled, setLiveChordEnabled } = useChordAIStore();
  const [dragActive, setDragActive] = useState(false);
  const validateAudioFile = (file: File): boolean => {
    const name = file.name.toLowerCase();
    if (name.endsWith(".mid") || name.endsWith(".midi") || name.endsWith(".kar")) {
      toast({
        title: "Invalid File Format",
        description: "MIDI files (.mid, .midi) do not contain actual audio recordings. Please export your MIDI file to a .wav or .mp3 audio file from your DAW before uploading.",
        variant: "destructive",
      });
      return false;
    }

    const allowedExtensions = [".mp3", ".wav", ".m4a", ".flac", ".ogg", ".aac", ".mp4", ".mov", ".wma", ".webm"];
    const hasAllowedExt = allowedExtensions.some(ext => name.endsWith(ext));

    if (!file.type.startsWith("audio/") && !file.type.startsWith("video/") && !hasAllowedExt) {
      toast({
        title: "Unsupported File Format",
        description: "Please upload a valid audio or video file (e.g., .mp3, .wav, .m4a, .flac).",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };
  const [loadedInstrumentalUrl, setLoadedInstrumentalUrl] = useState<string | null>(null);
  const [isInstrumentalLoaded, setIsInstrumentalLoaded] = useState(false);
  const [isLoadingInstrumental, setIsLoadingInstrumental] = useState(false);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [wasVocalFilterOn, setWasVocalFilterOn] = useState(false);
  const [historyFileName, setHistoryFileName] = useState<string | null>(null);
  const [isSharedView, setIsSharedView] = useState(false);
  const [isMidiDialogOpen, setIsMidiDialogOpen] = useState(false);
  const [horizontalDiagram, setHorizontalDiagram] = useState(() => {
    try { return JSON.parse(localStorage.getItem('chord-diagram-horizontal') ?? 'false'); } catch (_e) { return false; }
  });
  const [flipDiagram, setFlipDiagram] = useState(() => {
    try { return JSON.parse(localStorage.getItem('fretboard-flip-strings') ?? 'false'); } catch (_e) { return false; }
  });
  const [instrument, setInstrument] = useState<'guitar' | 'ukulele' | 'piano'>(() => {
    const saved = localStorage.getItem('chord-ai-instrument');
    return (saved === 'ukulele' || saved === 'piano' || saved === 'guitar') ? saved : 'guitar';
  });

  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isYoutubeMode] = useState(false);
  const [youtubeVideoInfo] = useState<{
    videoId: string;
    title: string;
    duration: number;
    thumbnail: string;
    channel: string;
  } | null>(null);
  const [audioOnlyMode] = useState(false);

  const [cachedResults, setCachedResults] = useState<Record<string, { result: AnalysisResult; instrumentalUrl?: string }>>({});
  const [currentFileId, setCurrentFileId] = useState<string | null>(null);

  const { connected: isConnected, currentChord: liveChord, connect, disconnect } = useChordWebSocket();
  const streamingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const cacheKey = currentFileId ? `${currentFileId}-${separateVocals}-${analysisMode}` : undefined;
  const cachedResult = cacheKey ? cachedResults[cacheKey] : undefined;

  useEffect(() => {
    if (liveChordEnabled && isPlaying && audioBuffer) {
      if (!isConnected) {
        connect();
      }

      streamingIntervalRef.current = setInterval(() => {
        const chunk = getAudioChunk();
        if (chunk) {
          // Live chord chunks handled internally by the WebSocket hook
        }
      }, 100);

      return () => {
        if (streamingIntervalRef.current) {
          clearInterval(streamingIntervalRef.current);
          streamingIntervalRef.current = null;
        }
      };
    } else {
      if (streamingIntervalRef.current) {
        clearInterval(streamingIntervalRef.current);
        streamingIntervalRef.current = null;
      }
    }
  }, [liveChordEnabled, isPlaying, audioBuffer, isConnected, connect, getAudioChunk, currentTime]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  const { result, loading: analysisLoading, instrumentalUrl, error: analysisError, uploadProgress, progressMessage, isFromCache, reanalyze } = useChordAnalysis(
    audioBuffer,
    selectedFile,
    true,
    separateVocals,
    cacheKey,
    cachedResult,
    analysisMode
  );

  const effectiveDuration = useMemo(() => {
    if (duration > 0) return duration;
    if (result?.chords?.length) {
      return result.chords[result.chords.length - 1].end;
    }
    return 0;
  }, [duration, result]);

  const effectiveFileName = fileInfo?.name || historyFileName;

  const hasCachedResult = !!cachedResult;
  useEffect(() => {
    if (analysisLoading && !hasCachedResult && currentFileId) {
      if (analysisMode === "precise") {
        toast({
          title: "Precise Engine Active",
          description: "Running deep 5-stage isolation and transcription (~1-2 mins).",
        });
      } else if (separateVocals) {
        toast({
          title: "Premium Analysis Engine",
          description: "Vocal filtering enabled. This uses the high-precision pipeline (~2-3 mins).",
        });
      } else {
        toast({
          title: analysisMode === "fast" ? "Fast Neural Analysis" : "Balanced DSP Analysis",
          description: analysisMode === "fast"
            ? "Using custom ONNX model for rapid harmonic transcription (~5-10s)."
            : "Using Librosa engine for focused mapping (~1 min).",
        });
      }
    }
  }, [analysisLoading, hasCachedResult, separateVocals, currentFileId, analysisMode, toast, cachedResult]);

  const lastNotifiedResultRef = useRef<string | null>(null);
  useEffect(() => {
    if (result && !analysisLoading) {
      if (cacheKey && !cachedResults[cacheKey]) {
        setCachedResults(prev => ({
          ...prev,
          [cacheKey]: { result, instrumentalUrl }
        }));

        if (fileInfo && !hasCachedResult) {
          saveToHistory(
            fileInfo.name,
            result,
            instrumentalUrl,
            separateVocals,
            analysisMode
          );
        }
      }

      if (separateVocals && !instrumentalUrl) return;

      const resKey = `${currentFileId}-${separateVocals}-${analysisMode}-${isFromCache}`;
      if (lastNotifiedResultRef.current === resKey) return;
      lastNotifiedResultRef.current = resKey;

      if (isFromCache) {
        toast({
          title: "Loaded from Cache ⚡",
          description: "Showing previous chords. We've upgraded our AI & DSP model — want to re-analyze for higher accuracy?",
          action: (
            <ToastAction altText="Re-analyze" onClick={handleClearCacheAndReanalyze}>
              Re-analyze
            </ToastAction>
          ),
          duration: 9000,
        });
      } else if (analysisMode === "precise") {
        toast({
          title: "Precise map ready! :))",
          description: `Isolated ${result.key} ${result.scale || ""} harmonic map at ${Math.round(result.tempo || 0)} BPM`,
        });
      } else if (separateVocals) {
        toast({
          title: "High-precision map ready! :))",
          description: `Isolated ${result.key} ${result.scale || ""} harmonic map at ${Math.round(result.tempo || 0)} BPM`,
        });
      } else {
        toast({
          title: analysisMode === "fast" ? "Fast map ready :))" : "Balanced map ready :))",
          description: `Detected ${result.key} ${result.scale || ""} at ${Math.round(result.tempo || 0)} BPM`
        });
      }

      // Track session analysis count & nudge for feedback on 2nd analysis
      try {
        const sessionCount = parseInt(sessionStorage.getItem("guitariz_analysis_count") || "0", 10) + 1;
        sessionStorage.setItem("guitariz_analysis_count", sessionCount.toString());

        if (sessionCount >= 2 && !sessionStorage.getItem("guitariz_feedback_prompted")) {
          sessionStorage.setItem("guitariz_feedback_prompted", "true");
          setTimeout(() => {
            toast({
              title: "Enjoying Guitariz Studio?",
              description: "We're building new features based on musician suggestions. Share your thoughts with us :)",
              action: (
                <ToastAction altText="Share Feedback" onClick={() => openFeedbackModal("idea")}>
                  Share Feedback
                </ToastAction>
              ),
              duration: 8000,
            });
          }, 3500);
        }
      } catch (err) {
        console.warn("sessionStorage unavailable", err);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, analysisLoading, separateVocals, instrumentalUrl, currentFileId, analysisMode, cacheKey, cachedResults, toast, fileInfo, hasCachedResult, saveToHistory, isFromCache]);

  useEffect(() => {
    if (analysisError) {
      toast({
        title: "Analysis failed",
        description: analysisError,
        variant: "destructive",
      });
    }
  }, [analysisError, toast]);

  const handleClearCacheAndReanalyze = async () => {
    try {
      setCachedResults({});
      lastNotifiedResultRef.current = null;

      toast({
        title: "Cache Cleared ⚡",
        description: "Re-analyzing audio with the latest engine...",
      });

      await reanalyze();
    } catch (err) {
      console.warn("Failed to clear cache:", err);
    }
  };

  const handleClearAllCaches = async () => {
    try {
      await clearAllAnalysisCache();
      await clearAllAudioCache();
      await clearHistory();
      setCachedResults({});
      lastNotifiedResultRef.current = null;
      toast({
        title: "Cache Reset",
        description: "All stored analyses and audio caches have been cleared.",
      });
    } catch (err) {
      console.warn("Failed to clear all cache:", err);
    }
  };

  useEffect(() => {
    if (fileInfo && !analysisLoading && !isInstrumentalLoaded && !separateVocals && !result) {
      toast({
        title: "File recognized",
        description: `Preparing analysis for ${fileInfo.name}...`,
      });
    }
  }, [fileInfo, analysisLoading, isInstrumentalLoaded, separateVocals, result, toast]);

  useEffect(() => {
    const shareParam = getShareParamFromUrl();
    if (shareParam) {
      const decoded = decodeShareableState(shareParam);
      if (decoded) {
        setIsSharedView(true);
        setHistoryFileName(decoded.fileName);

        const sharedCacheKey = `shared-${decoded.fileName}`;
        setCurrentFileId(`shared-${decoded.fileName}`);
        setCachedResults(prev => ({
          ...prev,
          [sharedCacheKey + `-false-true`]: { result: decoded.result }
        }));

        clearShareParamFromUrl();

        toast({
          title: "Shared analysis loaded",
          description: `Viewing chord chart for "${decoded.fileName}"`,
        });
      } else {
        toast({
          title: "Invalid share link",
          description: "Could not decode the shared analysis data.",
          variant: "destructive",
        });
        clearShareParamFromUrl();
      }
    }
  }, [toast]);

  useEffect(() => {
    if (instrumentalUrl && separateVocals && instrumentalUrl !== loadedInstrumentalUrl) {
      setLoadedInstrumentalUrl(instrumentalUrl);
      setIsLoadingInstrumental(true);
      setIsInstrumentalLoaded(false);

      fetch(instrumentalUrl)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.arrayBuffer();
        })
        .then(arrayBuffer => {
          const audioContext = new AudioContext();
          return audioContext.decodeAudioData(arrayBuffer);
        })
        .then(instrumentalBuffer => {
          loadFile(null, instrumentalBuffer);
          setIsInstrumentalLoaded(true);
          setIsLoadingInstrumental(false);
          setWasVocalFilterOn(true);
        })
        .catch(_err => {
          setLoadedInstrumentalUrl(null);
          setIsInstrumentalLoaded(false);
          setIsLoadingInstrumental(false);
          toast({
            title: "Could not load instrumental",
            description: "Using original audio. Chord detection may be less accurate.",
            variant: "destructive",
          });
        });
    }
  }, [instrumentalUrl, separateVocals, loadedInstrumentalUrl, loadFile, toast]);

  useEffect(() => {
    if (!separateVocals && originalFile && isInstrumentalLoaded && wasVocalFilterOn) {
      loadFile(originalFile);
      setIsInstrumentalLoaded(false);
      setLoadedInstrumentalUrl(null);
      setWasVocalFilterOn(false);
    }
  }, [separateVocals, originalFile, isInstrumentalLoaded, wasVocalFilterOn, loadFile]);

  const currentChords = useMemo(() => {
    if (!result) return [];
    const base = showSimple && result.simpleChords ? result.simpleChords : result.chords;
    if (!base) return [];

    return base.map(seg => {
      // Map N.C. to -
      let chordName = seg.chord === "N.C." ? "-" : seg.chord;
      
      // Transpose if needed
      if (transpose !== 0 && chordName !== "-") {
        chordName = transposeChord(chordName, transpose);
      }
      
      return {
        ...seg,
        chord: chordName
      };
    });
  }, [result, showSimple, transpose]);

  const highConfidenceChords = useMemo(() => {
    if (!currentChords.length) return [];
    
    const temp = currentChords.map(seg => {
      if (seg.chord !== "-" && seg.confidence < 0.72) {
        return { ...seg, chord: "-" };
      }
      return seg;
    });
    
    const merged: typeof currentChords = [];
    temp.forEach(seg => {
      const last = merged[merged.length - 1];
      if (last && last.chord === seg.chord) {
        last.end = seg.end;
        last.confidence = Math.max(last.confidence, seg.confidence);
      } else {
        merged.push({ ...seg });
      }
    });
    return merged;
  }, [currentChords]);

  const { currentChord } = useMemo(() => {
    if (!highConfidenceChords.length) return { currentChord: undefined };

    const activeIndex = highConfidenceChords.findIndex((seg) => currentTime >= seg.start && currentTime <= (seg.end || seg.start + 0.1));

    if (activeIndex === -1) {
      return { currentChord: undefined };
    }

    return {
      currentChord: highConfidenceChords[activeIndex]
    };
  }, [currentTime, highConfidenceChords]);

  const activeChordVoicing = useMemo(() => {
    if (!currentChord) return null;

    const normalized = currentChord.chord
      .replace(":maj", "")
      .replace("min7", "m7")
      .replace("min", "m")
      .replace(":", "");

    const found = findChordByName(normalized, chordLibraryData.roots);
    return found?.variant.voicings[0] || null;
  }, [currentChord]);

  const activeUkuleleVoicing = useMemo(() => {
    if (!currentChord) return null;
    return getUkuleleFrets(currentChord.chord);
  }, [currentChord]);

  const onYoutubeTimeUpdate = (time: number) => {
    seek(time);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden selection:bg-white/10">
      <main className="container mx-auto px-4 md:px-6 pt-8 md:pt-12 pb-16 relative z-10">
        <div className="max-w-6xl mx-auto">

          <Breadcrumb items={[
            { name: "Home", url: "https://guitariz.studio/" },
            { name: "Chord AI", url: "https://guitariz.studio/chord-ai" }
          ]} />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-6">
            <div className="space-y-4">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-border bg-card/50 text-muted-foreground text-[10px] font-bold tracking-[0.2em] uppercase">
                <Bot className="w-3 h-3" />
                <span>Neural Audio Transcription</span>
              </div>

              <div className="space-y-2">
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-foreground">
                  Chord AI <span className="text-muted-foreground font-thin italic">Free</span>
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed font-light">
                  Decode harmonic progressions and scales from raw audio using our production-grade engine.
                </p>
                <div className="mt-4 p-5 rounded-2xl bg-card/60 border border-border/60 max-w-3xl">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-primary mb-1">What is Guitariz Chord AI?</h2>
                  <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                    Guitariz Chord AI is a 100% free online chord recognition tool that automatically extracts guitar chords, key signatures, and tempo (BPM) from any MP3, WAV, or YouTube audio track without subscription paywalls or login requirements.
                  </p>
                </div>
              </div>
            </div>

            {!audioBuffer && (
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="h-12 px-6 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-bold shadow-xl transition-all active:scale-95"
              >
                <Upload className="w-4 h-4 mr-2" />
                Select Audio File
              </Button>
            )}
          </div>

          <div className="mb-12 px-4 py-3 rounded-xl bg-amber-500/5 border border-amber-500/10 max-w-2xl">
            <p className="text-[11px] text-amber-600 dark:text-amber-200/70 leading-relaxed">
              <strong className="text-amber-700 dark:text-amber-100">Pro Tip:</strong> Enabling the <strong className="text-amber-700 dark:text-amber-100 italic">Vocal Filter</strong> significantly increases accuracy for songs with singing by isolating instrumentals.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-6">
              <div className="glass-card rounded-[2rem] border border-border bg-card/95 shadow-2xl overflow-hidden min-h-[500px] flex flex-col transition-all">
                <div className="p-4 border-b border-border bg-card/30 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Studio Engine</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="vocal-switch" className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">
                        {analysisMode === "precise" ? "Vocal Filter (Auto-Isolating)" : "Vocal Filter"}
                      </Label>
                      <Switch 
                        id="vocal-switch" 
                        checked={analysisMode === "precise" ? true : separateVocals} 
                        onCheckedChange={setSeparateVocals} 
                        disabled={analysisLoading || analysisMode === "precise"} 
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">Engine</Label>
                      <div className="flex items-center bg-muted/65 p-0.5 rounded-lg border border-border/40">
                        {(["fast", "balanced", "precise"] as const).map((mode) => (
                          <button
                            key={mode}
                            disabled={analysisLoading}
                            onClick={() => {
                              if (mode === "fast") {
                                toast({
                                  title: "Fast Engine (In Development)",
                                  description: "The custom ONNX Fast Engine is currently under active development and will be here soon! Reverting to Balanced Mode.",
                                });
                                setAnalysisMode("balanced");
                                return;
                              } else if (mode === "precise") {
                                toast({
                                  title: "Precise Engine Selected",
                                  description: "Warning: High memory Demucs stem isolation and multi-chroma templates will run (~1-2 mins).",
                                });
                              }
                              setAnalysisMode(mode);
                            }}
                            className={cn(
                              "px-2.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-tight transition-all duration-200",
                              analysisMode === mode
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {mode}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="mode-switch" className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">Complex</Label>
                      <Switch id="mode-switch" checked={!showSimple} onCheckedChange={(c) => setShowSimple(!c)} disabled={analysisLoading} />
                    </div>
                  </div>
                </div>

                {(analysisLoading || (uploadProgress !== undefined && uploadProgress < 100)) && (
                  <div className="px-4 py-2 bg-blue-500/5 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="w-3 h-3 text-blue-400 animate-pulse" />
                      <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                        {progressMessage ? progressMessage : (uploadProgress !== undefined && uploadProgress < 100 ? "Uploading Audio" : "Analyzing Engine State...")}
                      </span>
                    </div>
                    {uploadProgress !== undefined && uploadProgress > 0 && (
                      <div className="flex items-center gap-3 w-32">
                        <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                        </div>
                        <span className="text-[9px] font-mono text-blue-400">{uploadProgress}%</span>
                      </div>
                    )}
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="audio/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (!validateAudioFile(file)) {
                        e.target.value = '';
                        return;
                      }
                      const isRestoring = !!result && !audioBuffer;
                      const fileId = `${file.name}-${file.size}-${file.lastModified}`;

                      setSelectedFile(file);
                      setOriginalFile(file);

                      if (!isRestoring) {
                        setCurrentFileId(fileId);
                        setCachedResults({});
                        setLoadedInstrumentalUrl(null);
                        setIsInstrumentalLoaded(false);
                        setWasVocalFilterOn(false);
                        setHistoryFileName(null);
                      }

                      loadFile(file);
                    }
                    e.target.value = '';
                  }}
                />
                {!audioBuffer && !result && !isYoutubeMode ? (
                  <div className="flex-1 m-4 flex flex-col gap-6">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        className={cn(
                          "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                          !youtubeUrl ? "bg-primary text-primary-foreground" : "bg-card text-foreground/70 hover:bg-card/80"
                        )}
                        onClick={() => setYoutubeUrl("")}
                      >
                        <Upload className="w-4 h-4 inline mr-2" />
                        Upload File
                      </button>
                      <button
                        className={cn(
                          "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                          youtubeUrl ? "bg-red-500 text-white" : "bg-card text-foreground/70 hover:bg-card/80"
                        )}
                        onClick={() => setYoutubeUrl("https://")}
                      >
                        <Youtube className="w-4 h-4 inline mr-2" />
                        YouTube URL
                      </button>
                    </div>

                    {!youtubeUrl && (
                      <div
                        className={cn(
                          "flex-1 border-2 border-dashed rounded-[2rem] transition-all flex flex-col items-center justify-center p-12 text-center cursor-pointer",
                          dragActive ? "border-border bg-card/30" : "border-border bg-card/20"
                        )}
                        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                        onDragLeave={() => setDragActive(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragActive(false);
                          const files = e.dataTransfer.files;
                          if (files?.[0]) {
                            const file = files[0];
                            if (!validateAudioFile(file)) return;
                            const fileId = `${file.name}-${file.size}-${file.lastModified}`;
                            setSelectedFile(file);
                            setOriginalFile(file);
                            setCurrentFileId(fileId);
                            setCachedResults({});
                            setLoadedInstrumentalUrl(null);
                            setIsInstrumentalLoaded(false);
                            setWasVocalFilterOn(false);
                            loadFile(file);
                          }
                        }}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <div className="w-24 h-24 bg-card/50 rounded-full flex items-center justify-center mb-8 border border-border">
                          <Wand2 className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-2xl font-light text-foreground mb-3">Initialize Analysis</h3>
                        <p className="text-muted-foreground max-w-sm font-light">
                          Drag and drop your project file or select from disk. Support for stem analysis and full mix transcription.
                        </p>
                        <p className="text-xs text-muted-foreground/60 font-mono">
                          Maximum file size: 15MB
                        </p>
                      </div>
                    )}

                    {youtubeUrl !== "" && (
                      <div className="flex-1 border border-border rounded-[2rem] p-8 flex flex-col items-center justify-center gap-6 bg-gradient-to-b from-red-500/5 to-transparent">
                        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center border border-red-500/30">
                          <Youtube className="w-10 h-10 text-red-400" />
                        </div>

                        <h3 className="text-2xl font-light text-foreground">YouTube Integration Update</h3>

                        <div className="w-full max-w-md space-y-4 text-center">
                          <div className="p-6 rounded-2xl bg-card/30 border border-border">
                            <div className="flex flex-col items-center gap-3">
                              <Activity className="w-8 h-8 text-amber-400 animate-pulse" />
                              <h4 className="text-lg font-medium text-foreground">Work in Progress</h4>
                              <p className="text-sm text-muted-foreground">
                                We are currently upgrading our YouTube analysis engine to be faster and more reliable. This feature will be available soon!
                              </p>
                            </div>
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground/60 text-center max-w-sm">
                          Please use the <strong>Upload File</strong> option to analyze your local audio files in the meantime.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-10 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    {!audioBuffer && result && (
                      <div className={cn(
                        "px-6 py-4 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in zoom-in-95 duration-500",
                        isSharedView
                          ? "bg-blue-500/10 border border-blue-500/20"
                          : "bg-amber-500/10 border border-amber-500/20"
                      )}>
                        <div className="flex items-center gap-3">
                          {isSharedView ? (
                            <>
                              <Share2 className="w-5 h-5 text-blue-400" />
                              <p className="text-sm text-blue-600 dark:text-blue-200/80 font-medium">
                                Viewing shared chord chart. Upload audio to sync playback with chords.
                              </p>
                            </>
                          ) : (
                            <>
                              <Activity className="w-5 h-5 text-amber-400" />
                              <p className="text-sm text-amber-600 dark:text-amber-200/80 font-medium">
                                Loaded from history. Upload original audio to listen and sync with waveform.
                              </p>
                            </>
                          )}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className={cn(
                            "border-none h-8 whitespace-nowrap",
                            isSharedView
                              ? "bg-blue-500/20 hover:bg-blue-500/30 text-blue-600 dark:text-blue-200"
                              : "bg-amber-500/20 hover:bg-amber-500/30 text-amber-600 dark:text-amber-200"
                          )}
                        >
                          <Upload className="w-3.5 h-3.5 mr-2" />
                          {isSharedView ? "Add Audio" : "Restore Audio"}
                        </Button>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-center">
                      <div className="flex items-center gap-5">
                        {(!isYoutubeMode || audioOnlyMode) && (
                          <Button
                            size="icon"
                            className="w-14 h-14 shrink-0 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                            onClick={isPlaying ? pause : play}
                            disabled={!audioBuffer}
                          >
                            {isPlaying ? <Pause className="fill-current w-5 h-5" /> : <Play className="fill-current w-5 h-5 ml-1" />}
                          </Button>
                        )}
                        <div className="space-y-1 overflow-hidden">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-bold text-foreground truncate max-w-[150px]">{effectiveFileName}</div>
                            {(isInstrumentalLoaded || isLoadingInstrumental) && (
                              <div className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                isLoadingInstrumental ? "bg-amber-500 animate-pulse" : "bg-blue-500"
                              )} />
                            )}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-mono tabular-nums">
                            {formatTime(currentTime)} <span className="opacity-20">/</span> {formatTime(effectiveDuration)}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-center">
                        <div className="flex items-center gap-2 bg-card/30 p-1 rounded-xl border border-border">
                          <button
                            onClick={() => setLiveChordEnabled(!liveChordEnabled)}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                              liveChordEnabled ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                            )}
                            disabled={!audioBuffer}
                          >
                            Live Map
                          </button>
                          {liveChordEnabled && (
                            <div className="px-3">
                              <LiveChordIndicator
                                chord={liveChord?.chord ?? null}
                                confidence={liveChord?.confidence ?? 0}
                                isConnected={isConnected}
                                isActive={isPlaying}
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-3">
                        <div className="flex flex-col gap-3 w-full sm:w-auto">
                          <div className="flex items-center gap-4 bg-card/30 px-3 py-2 rounded-xl border border-border">
                            <span className="text-[10px] font-bold text-muted-foreground/60 w-8">Pitch</span>
                            <Slider
                              value={[transpose]}
                              min={-6}
                              max={6}
                              step={1}
                              onValueChange={(v) => setTranspose(v[0])}
                              className="w-24"
                            />
                            <span className="text-[10px] font-mono text-foreground w-4 text-right">{transpose > 0 ? "+" : ""}{transpose}</span>
                          </div>
                          <div className="flex items-center gap-4 bg-card/30 px-3 py-2 rounded-xl border border-border">
                            <span className="text-[10px] font-bold text-muted-foreground/60 w-8">Speed</span>
                            <Slider
                              value={[tempo]}
                              min={0.5}
                              max={1.5}
                              step={0.05}
                              onValueChange={(v) => setTempo(v[0])}
                              className="w-24"
                            />
                            <span className="text-[10px] font-mono text-foreground w-8 text-right">{tempo.toFixed(1)}x</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2 pt-4 border-t border-border">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-[10px] font-bold uppercase tracking-widest h-8 px-3 rounded-lg hover:bg-card/50"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="w-3 h-3 mr-2 text-muted-foreground" />
                        Replace Audio
                      </Button>
                      {instrumentalUrl && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-[10px] font-bold uppercase tracking-widest h-8 px-3 rounded-lg hover:bg-card/50 text-blue-400"
                          onClick={() => {
                            const a = document.createElement('a');
                            a.href = instrumentalUrl;
                            a.download = 'instrumental.wav';
                            a.click();
                          }}
                        >
                          <Download className="w-3 h-3 mr-2" />
                          Download Stems
                        </Button>
                      )}
                      {result && (
                        <Dialog open={isMidiDialogOpen} onOpenChange={setIsMidiDialogOpen}>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-[10px] font-bold uppercase tracking-widest h-8 px-3 rounded-lg hover:bg-card/50 text-purple-400"
                            >
                              <FileAudio className="w-3 h-3 mr-2" />
                              Export MIDI
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md bg-card/95 border border-border backdrop-blur-xl rounded-3xl p-6">
                            <DialogHeader className="space-y-2">
                              <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                                <FileAudio className="w-5 h-5 text-purple-400" />
                                Export MIDI Progression
                              </DialogTitle>
                              <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                                Generate a Standard MIDI File (<code className="font-mono text-purple-400">.mid</code>) to drop directly into Ableton, FL Studio, Logic, or Cubase.
                              </DialogDescription>
                            </DialogHeader>

                            <div className="my-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1.5">
                              <p className="font-bold text-amber-600 dark:text-amber-300 flex items-center gap-2 text-[11px]">
                                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" /> AI Transcription Notice
                              </p>
                              <p className="text-amber-700/80 dark:text-amber-200/80 text-[11px] leading-relaxed">
                                AI chord detection is experimental and results may not be 100% exact. Audio mix density, syncopation, or complex voicings can affect accuracy. Please double-check and fine-tune notes in your DAW.
                              </p>
                            </div>

                            <DialogFooter className="gap-2 sm:gap-0 pt-2">
                              <DialogClose asChild>
                                <Button variant="ghost" size="sm" className="text-xs rounded-xl">
                                  Cancel
                                </Button>
                              </DialogClose>
                              <Button
                                size="sm"
                                className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
                                onClick={() => {
                                  setIsMidiDialogOpen(false);
                                  try {
                                    const { filename } = exportChordsToMidi(result, effectiveFileName || "progression", {
                                      transpose,
                                      showSimple
                                    });
                                    toast({
                                      title: "MIDI Exported Successfully",
                                      description: `Saved "${filename}". Have suggestions for new export options?`,
                                      action: (
                                        <ToastAction altText="Feedback" onClick={() => openFeedbackModal("idea")}>
                                          Feedback
                                        </ToastAction>
                                      ),
                                    });
                                  } catch (err: unknown) {
                                    const message = err instanceof Error ? err.message : "Could not export MIDI file.";
                                    toast({
                                      title: "Export failed",
                                      description: message,
                                      variant: "destructive",
                                    });
                                  }
                                }}
                              >
                                Download MIDI
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                      {result && effectiveFileName && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-[10px] font-bold uppercase tracking-widest h-8 px-3 rounded-lg hover:bg-card/50 text-amber-400"
                            onClick={handleClearCacheAndReanalyze}
                            title="Clear cached results and re-run fresh analysis"
                          >
                            <RotateCcw className="w-3 h-3 mr-2" />
                            Re-analyze
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-[10px] font-bold uppercase tracking-widest h-8 px-3 rounded-lg hover:bg-card/50 text-emerald-400"
                            onClick={async () => {
                              const shareUrl = generateShareUrl(effectiveFileName, result);
                              const success = await copyToClipboard(shareUrl);
                              if (success) toast({ title: "Link copied!" });
                            }}
                          >
                            <Share2 className="w-3 h-3 mr-2" />
                            Share Link
                          </Button>
                        </>
                      )}
                    </div>

                    <div className="space-y-10">
                      {isYoutubeMode && youtubeVideoInfo && !audioOnlyMode && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
                          <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em]">
                            <Youtube className="w-3 h-3" />
                            Video Playback
                          </div>
                          <div className="rounded-[2rem] overflow-hidden border border-border shadow-2xl bg-black relative z-20">
                            <YouTubePlayer
                              videoId={youtubeVideoInfo.videoId}
                              onTimeUpdate={onYoutubeTimeUpdate}
                              className="w-full aspect-video"
                              initialPiP={false}
                            />
                          </div>
                        </div>
                      )}

                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em]">
                          <Activity className="w-3 h-3" />
                          Spectral Waveform
                        </div>
                        <div className="bg-card/20 rounded-3xl border border-border p-2 overflow-hidden relative">
                          {!audioBuffer && (
                            <div className="absolute inset-0 z-10 bg-background/60 flex items-center justify-center p-8 text-center">
                              <p className="text-xs text-muted-foreground font-medium">Waveform visualization requires audio file upload.</p>
                            </div>
                          )}
                          <WaveformViewer
                            peaks={peaks || []}
                            duration={effectiveDuration}
                            currentTime={currentTime}
                            chordSegments={highConfidenceChords}
                            onSeek={seek}
                          />
                        </div>
                      </div>

                      {analysisLoading ? (
                        <ChordAISkeleton />
                      ) : result ? (
                        <div className="space-y-12">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em]">
                                <Sparkles className="w-3 h-3" />
                                Interactive Progression
                              </div>
                              <div className="text-[10px] text-muted-foreground/40 italic">
                                Scroll horizontally to explore
                              </div>
                            </div>
                            <div className="bg-card/20 rounded-[2rem] border border-border overflow-hidden py-4">
                              <HorizontalChordTape
                                segments={highConfidenceChords}
                                currentTime={currentTime}
                                onSeek={seek}
                              />
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em]">
                              <Settings2 className="w-3 h-3" />
                              Detailed History
                            </div>
                            <ChordTimeline
                              segments={currentChords}
                              currentTime={currentTime}
                              onSeek={seek}
                            />
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-4 space-y-6">
              <div className="glass-card rounded-[2rem] border border-border bg-card/90 p-8 space-y-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-xl bg-card/50 border border-border">
                    <Sparkles className="w-4 h-4 text-foreground" />
                  </div>
                  <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">Global Analysis</h2>
                </div>

                <AnalysisSummary
                  tempo={result?.tempo}
                  keySignature={result?.key ? `${transposeKey(result.key, transpose)} ${result.scale || ""}` : null}
                />

                <div className="pt-2 space-y-6">
                  <div className="space-y-4">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Active Chord</div>
                    <div className="flex items-end justify-between gap-4">
                      <div className="text-7xl font-light tracking-tighter text-foreground tabular-nums min-h-[1.2rem] transition-all duration-300 notranslate" translate="no">
                        {currentChord ? currentChord.chord : (isPlaying ? "..." : "--")}
                      </div>
                      {currentChord && (
                        <div className="text-[10px] text-muted-foreground/40 font-mono pb-2">
                          ENDS AT {formatTime(currentChord.end || 0)}
                        </div>
                      )}
                    </div>
                  </div>

                  {currentChord && (activeChordVoicing || instrument === 'piano' || instrument === 'ukulele') && (
                    <div className="bg-card/30 rounded-3xl border border-border p-4 flex flex-col items-center gap-3 animate-in fade-in zoom-in-95 duration-500 overflow-hidden">
                      {/* Instrument tabs */}
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground/50">Chord Shape</span>
                        <div className="flex items-center gap-0.5 p-0.5 bg-black/40 rounded-lg border border-white/5">
                          {(['guitar', 'ukulele', 'piano'] as const).map((inst) => (
                            <button
                              key={inst}
                              onClick={() => {
                                setInstrument(inst);
                                try { localStorage.setItem('chord-ai-instrument', inst); } catch (_e) { /* ignore */ }
                              }}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                                instrument === inst
                                  ? 'bg-primary/20 text-primary'
                                  : 'text-white/40 hover:text-white/70'
                              }`}
                            >
                              <span className="capitalize">{inst}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* View controls — only for guitar & ukulele */}
                      {instrument !== 'piano' && (
                        <div className="flex items-center gap-1.5 self-end">
                          {!horizontalDiagram && (
                            <button
                              onClick={() => {
                                const next = !flipDiagram;
                                setFlipDiagram(next);
                                try { localStorage.setItem('fretboard-flip-strings', JSON.stringify(next)); } catch (_e) { /* ignore */ }
                              }}
                              title={flipDiagram ? "Low E on left (standard)" : "High e on left (flipped)"}
                              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                                flipDiagram
                                  ? 'bg-primary/20 border-primary/30 text-primary'
                                  : 'bg-white/5 border-white/10 text-muted-foreground hover:text-white'
                              }`}
                            >
                              <ArrowUpDown className="w-3 h-3" />
                              Flip
                            </button>
                          )}
                          <button
                            onClick={() => {
                              const next = !horizontalDiagram;
                              setHorizontalDiagram(next);
                              try { localStorage.setItem('chord-diagram-horizontal', JSON.stringify(next)); } catch (_e) { /* ignore */ }
                            }}
                            title={horizontalDiagram ? 'Switch to chord box view' : 'Switch to neck view (face-to-face)'}
                            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                              horizontalDiagram
                                ? 'bg-primary/20 border-primary/30 text-primary'
                                : 'bg-white/5 border-white/10 text-muted-foreground hover:text-white'
                            }`}
                          >
                            <ArrowUpDown className="w-3 h-3 rotate-90" />
                            {horizontalDiagram ? 'Box' : 'Neck'}
                          </button>
                        </div>
                      )}

                      {/* Diagram */}
                      <div className="scale-90 origin-center">
                        {instrument === 'guitar' && activeChordVoicing && (
                          <ChordDiagram
                            frets={activeChordVoicing.frets}
                            fingers={activeChordVoicing.fingers}
                            chordName={currentChord.chord}
                            compact={true}
                            horizontal={horizontalDiagram}
                            flipped={!horizontalDiagram && flipDiagram}
                          />
                        )}
                        {instrument === 'ukulele' && activeUkuleleVoicing && (
                          <UkuleleDiagram
                            frets={activeUkuleleVoicing.frets}
                            fingers={activeUkuleleVoicing.fingers}
                            chordName={currentChord.chord}
                            compact={true}
                            horizontal={horizontalDiagram}
                            flipped={!horizontalDiagram && flipDiagram}
                          />
                        )}
                        {instrument === 'piano' && (
                          <PianoChordDiagram
                            chordName={currentChord.chord}
                            compact={true}
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {currentChords.length > 0 && analysisMode !== "fast" && (
                  <div className="pt-6 border-t border-border space-y-4">
                    <ConfidenceSummary
                      segments={currentChords}
                      onSeek={seek}
                    />

                    <div className="flex items-center justify-between p-3 rounded-2xl border border-white/5 bg-white/[0.02] text-xs">
                      <span className="text-[11px] text-muted-foreground font-medium">How accurate was this result?</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            toast({
                              title: "Thanks for rating!",
                              description: "Glad the harmonic map was helpful.",
                            });
                          }}
                          className="px-2.5 py-1 rounded-lg border border-white/10 hover:border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400 text-[10px] font-bold transition-all"
                        >
                          Accurate
                        </button>
                        <button
                          onClick={() => openFeedbackModal("bug")}
                          className="px-2.5 py-1 rounded-lg border border-white/10 hover:border-amber-500/30 hover:bg-amber-500/10 text-amber-400 text-[10px] font-bold transition-all"
                        >
                          Needs Work
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-border space-y-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-card/50 border border-border">
                      <History className="w-4 h-4 text-foreground" />
                    </div>
                    <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">Recent History</h2>
                  </div>
                  {history.length > 0 && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-red-400"
                          title="Clear all history"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>

                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Clear History & Cache</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to clear your local analysis history and cached audio files? This will reset all saved sessions and force fresh analyses.
                          </DialogDescription>
                        </DialogHeader>

                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                          </DialogClose>

                          <DialogClose asChild>
                            <Button
                              variant="destructive"
                              onClick={handleClearAllCaches}
                            >
                              Clear All
                            </Button>
                          </DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>

                {history.length === 0 ? (
                  <div className="py-8 text-center border-2 border-dashed border-border rounded-2xl bg-card/20">
                    <p className="text-xs text-muted-foreground font-light mb-1">No previous analyses</p>
                    <p className="text-[10px] text-muted-foreground/40 italic px-4">Upload a file to start tracking your studio sessions.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-border">
                    {history.map((entry) => (
                      <div
                        key={entry.id}
                        className="group relative p-4 rounded-2xl bg-card/30 border border-border hover:bg-card/50 hover:border-border/80 transition-all cursor-pointer"
                        onClick={() => {
                          if (!entry || !entry.result) return;
                          setCachedResults(prev => ({
                            ...prev,
                            [`${entry.fileName}-${entry.separateVocals || false}-${entry.analysisMode || "balanced"}`]: {
                              result: entry.result,
                              instrumentalUrl: entry.instrumentalUrl
                            }
                          }));
                          setCurrentFileId(entry.fileName);
                          setHistoryFileName(entry.fileName);
                          if (typeof entry.separateVocals === "boolean") setSeparateVocals(entry.separateVocals);
                          if (entry.analysisMode) setAnalysisMode(entry.analysisMode);

                          toast({
                            title: "History item loaded",
                            description: `Restored analysis for ${entry.fileName}`,
                          });
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1 overflow-hidden">
                            <div className="text-xs font-medium text-foreground truncate">{entry.fileName}</div>
                            <div className="flex items-center gap-2 text-[9px] text-muted-foreground uppercase tracking-wider font-bold">
                              <span>{entry.result?.key || "C"} {entry.result?.scale || ""}</span>
                              <span>•</span>
                              <span>{Math.round(entry.result?.tempo || 0)} BPM</span>
                            </div>
                          </div>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 -mt-1 -mr-1 transition-all"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <History className="w-3 h-3 group-hover:hidden" />
                                <Trash2 className="w-3 h-3 hidden group-hover:block" />
                              </Button>
                            </DialogTrigger>

                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Delete History Item</DialogTitle>
                                <DialogDescription>
                                  Are you sure you want to delete this history item? This cannot be undone.
                                </DialogDescription>
                              </DialogHeader>

                              <DialogFooter>
                                <DialogClose asChild>
                                  <Button variant="outline">Cancel</Button>
                                </DialogClose>

                                <DialogClose asChild>
                                  <Button
                                    variant="destructive"
                                    onClick={() => removeFromHistory(entry.id)}
                                  >
                                    Delete
                                  </Button>
                                </DialogClose>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                        <div className="mt-2 text-[8px] text-muted-foreground/40 italic">
                          Analyzed {new Date(entry.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-8 rounded-[2rem] border border-border bg-card/20 space-y-5">
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Capabilities</h4>
                <ul className="space-y-4">
                  {[
                    { icon: Activity, label: "Inversion & Voicing Detection" },
                    { icon: Settings2, label: "Multi-temporal Tempo Tracking" },
                    { icon: Wand2, label: "Automated Key Map Generation" }
                  ].map(({ icon: Icon, label }) => (
                    <li key={label} className="flex items-center gap-4 text-xs text-muted-foreground/80 group">
                      <div className="p-1.5 rounded-lg bg-card/30 border border-border group-hover:text-foreground group-hover:border-border/80 transition-all">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      {label}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-8 rounded-[2rem] border border-rose-500/20 bg-rose-500/5 space-y-3 relative overflow-hidden group hover:border-rose-500/30 transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
                <h4 className="text-[10px] font-bold text-rose-450 uppercase tracking-[0.2em] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                  <span>Ear Training Tips</span>
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed font-light">
                  Struggling to translate what you hear onto the fretboard?
                </p>
                <Link
                  to="/blog/how-to-identify-chords-by-ear"
                  className="inline-flex items-center gap-1.5 text-xs text-white hover:text-rose-400 transition-colors font-medium pt-1"
                >
                  Read our Ear Training Guide <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Unique prose copy for SEO and AdSense */}
        <div className="mt-24 max-w-4xl mx-auto space-y-12">
          <div className="space-y-4">
            <h2 className="text-3xl md:text-5xl font-light tracking-tighter text-white font-display">
              Technical Details & <span className="text-muted-foreground font-thin italic">Operation</span>
            </h2>
            <div className="h-[1px] w-full bg-gradient-to-r from-emerald-500/20 via-border to-transparent" />
          </div>
          <div 
            className="prose prose-invert max-w-none text-sm md:text-base text-zinc-300 leading-relaxed space-y-6 [&>h2]:text-xl [&>h2]:font-semibold [&>h2]:text-white [&>h2]:mt-8 [&>h2]:mb-4 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:space-y-2 [&>ul]:text-zinc-400 [&>p]:leading-relaxed [&_a]:text-emerald-400 [&_a]:hover:underline"
            dangerouslySetInnerHTML={{ __html: staticContent.chordAi.html }}
          />
        </div>

        <SEOContent
          pageName="chord-ai"
          faqs={[
            {
              question: "What is Chord AI and how does it work?",
              answer: "Chord AI is an advanced analysis tool that processes audio files to automatically detect chords, tempo, and key signatures. It uses digital signal processing (DSP) built on Librosa and chroma template matching to transcribe harmonic progressions from any song, making it perfect for musicians learning songs, creating covers, or analyzing music theory.",
            },
            {
              question: "Is Guitariz Chord AI really free?",
              answer: "Yes! Guitariz Chord AI is completely free with no subscription required. Unlike other chord detection services, we provide unlimited analyses with no paywall or credits system. You can analyze as many songs as you want without any cost.",
            },
            {
              question: "What does the Vocal Filter feature do?",
              answer: "The Vocal Filter uses AI-powered stem separation to isolate instrumental tracks from vocal tracks. This significantly improves chord detection accuracy on songs with vocals, as the algorithm can focus purely on the instrumental elements. The separated instrumental track can also be downloaded for practice or remixing.",
            },
            {
              question: "Which audio formats are supported?",
              answer: "Chord AI supports all common audio formats including MP3, WAV, FLAC, M4A, OGG, and more. Files up to 15MB are supported for optimal processing speed. For best results, use high-quality audio files with minimal compression.",
            },
            {
              question: "How accurate is the chord detection?",
              answer: "Chord detection accuracy varies based on audio quality and complexity. Simple acoustic songs typically achieve 85-95% accuracy, while complex multi-instrument arrangements may be 70-85% accurate. Enabling the Vocal Filter and using the Detailed analysis engine improves results significantly.",
            },
            {
              question: "What's the difference between Fast and Detailed mode?",
              answer: "Fast mode provides quick results in 30-60 seconds and works well for most contemporary songs. Detailed mode takes slightly longer and offers more detailed harmonic analysis, better handling complex chord voicings and jazz harmonies. Try Fast mode first, then switch to Detailed if needed.",
            },
            {
              question: "Can I transpose the detected chords?",
              answer: "Yes! After analysis, you can transpose chords up or down by 6 semitones using the transpose slider. This is perfect for matching your vocal range or adapting songs to different instruments. The key signature updates automatically with transposition.",
            },
            {
              question: "How long does chord analysis take?",
              answer: "Fast mode: 30-60 seconds. Detailed mode: 20-30 seconds. Vocal Filter mode: 1-2 minutes (includes stem separation). Processing time depends on song length and server load. All analyses run on our servers, so no local GPU is needed.",
            },
            {
              question: "Can I download the chord progressions?",
              answer: "While direct chord export isn't available yet, you can use the detailed chord timeline to manually transcribe progressions. If you enable Vocal Filter, you can download the separated instrumental track as a WAV file for practice or further production.",
            },
            {
              question: "Does Chord AI work on mobile devices?",
              answer: "Yes! Guitariz Chord AI works on all modern browsers including mobile Safari, Chrome, and Firefox. The interface is fully responsive and touch-optimized. However, for the best experience with large waveform visualizations, we recommend desktop browsers.",
            },
          ]}
        />
        <RelatedTools currentPath="/chord-ai" />
      </main>
    </div>
  );
};

export default ChordAIPage;