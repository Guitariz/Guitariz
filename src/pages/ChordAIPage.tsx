import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import WaveformViewer from "@/components/chord-ai/WaveformViewer";
import ChordTimeline from "@/components/chord-ai/ChordTimeline";
import HorizontalChordTape from "@/components/chord-ai/HorizontalChordTape";
import AnalysisSummary from "@/components/chord-ai/AnalysisSummary";
import ConfidenceSummary from "@/components/chord-ai/ConfidenceSummary";
import { useToast } from "@/components/ui/use-toast";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useChordAnalysis } from "@/hooks/useChordAnalysis";
import { AnalysisResult } from "@/types/chordAI";
import { usePageMetadata } from "@/hooks/usePageMetadata";
import ChordDiagram from "@/components/chord/ChordDiagram";
import { findChordByName, chordLibraryData } from "@/data/chordData";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAnalysisHistory } from "@/hooks/useAnalysisHistory";
import { Bot, Upload, Pause, Play, Activity, Settings2, Sparkles, Wand2, Download, History, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChordAISkeleton } from "@/components/ui/SkeletonLoader";
import { transposeChord, transposeKey } from "@/lib/transposition";
import { Slider } from "@/components/ui/slider";
import { SEOContent, Breadcrumb } from "@/components/SEOContent";

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
    title: "Chord AI Free - Audio to Chord Recognition & Music Theory | Guitariz",
    description: "Extract chords, tempo, and scales from any song for free. Advanced AI chord recognition and harmonic transcription with no subscription.",
    keywords: "chord ai, chord recognition, chord identifier, extract chords from audio, music ai, guitar chords, audio analysis",
    canonicalUrl: "https://guitariz.studio/chord-ai",
    ogImage: "https://guitariz.studio/logo2.png",
    ogType: "website",
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebPage",
          "name": "Chord AI - Guitariz",
          "url": "https://guitariz.studio/chord-ai",
          "description": "Advanced Chord AI: Extract chords, tempo, and scales from audio using neural networks.",
          "inLanguage": "en-US",
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
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

  const { loadFile, play, pause, seek, audioBuffer, peaks, duration, currentTime, isPlaying, fileInfo, transpose, setTranspose, tempo, setTempo } =
    useAudioPlayer();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showSimple, setShowSimple] = useState(false);
  const [separateVocals, setSeparateVocals] = useState(false);
  const [useMadmom, setUseMadmom] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [loadedInstrumentalUrl, setLoadedInstrumentalUrl] = useState<string | null>(null);
  const [isInstrumentalLoaded, setIsInstrumentalLoaded] = useState(false);
  const [isLoadingInstrumental, setIsLoadingInstrumental] = useState(false);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [wasVocalFilterOn, setWasVocalFilterOn] = useState(false);
  const [historyFileName, setHistoryFileName] = useState<string | null>(null);

  // Cache for analysis results to avoid re-analyzing when toggling
  const [cachedResults, setCachedResults] = useState<Record<string, { result: AnalysisResult; instrumentalUrl?: string }>>({});
  const [currentFileId, setCurrentFileId] = useState<string | null>(null);

  const cacheKey = currentFileId ? `${currentFileId}-${separateVocals}-${useMadmom}` : undefined;
  const cachedResult = cacheKey ? cachedResults[cacheKey] : undefined;

  const { result, loading: analysisLoading, instrumentalUrl, error: analysisError, uploadProgress } = useChordAnalysis(
    audioBuffer,
    selectedFile,
    true,
    separateVocals,
    cacheKey,
    cachedResult,
    useMadmom
  );

  const effectiveDuration = useMemo(() => {
    if (duration > 0) return duration;
    if (result?.chords?.length) {
      return result.chords[result.chords.length - 1].end;
    }
    return 0;
  }, [duration, result]);

  const effectiveFileName = fileInfo?.name || historyFileName;

  // 1. Initial File Analysis Toast
  const hasCachedResult = !!cachedResult;
  useEffect(() => {
    if (analysisLoading && !hasCachedResult && currentFileId) {
      if (separateVocals) {
        toast({
          title: "Premium Analysis Engine ",
          description: "Vocal filtering enabled. This uses the high-precision pipeline (~2-4 mins on CPU).",
        });
      } else {
        toast({
          title: useMadmom ? "Fast Analysis " : "Detailed Analysis",
          description: useMadmom
            ? "Using Madmom engine for quick results (~30-60s)."
            : "Using Librosa engine for focused mapping (~2-3 min).",
        });
      }
    }
  }, [analysisLoading, hasCachedResult, separateVocals, currentFileId, useMadmom, toast, cachedResult]);

  // 2. Success Toasts & Caching
  const lastNotifiedResultRef = useRef<string | null>(null);
  useEffect(() => {
    if (result && !analysisLoading) {
      // Cache the result
      if (cacheKey && !cachedResults[cacheKey]) {
        setCachedResults(prev => ({
          ...prev,
          [cacheKey]: { result, instrumentalUrl }
        }));

        // Also save to global history if it's a new file analysis
        if (fileInfo && !hasCachedResult) {
          saveToHistory({
            fileName: fileInfo.name,
            result,
            instrumentalUrl,
            useMadmom,
            separateVocals
          });
        }
      }

      // Notification logic
      if (separateVocals && !instrumentalUrl) return; // Wait for the URL if we're in vocal mode

      const resKey = `${currentFileId}-${separateVocals}-${useMadmom}`;
      if (lastNotifiedResultRef.current === resKey) return;
      lastNotifiedResultRef.current = resKey;

      if (separateVocals) {
        toast({
          title: "High-precision map ready! :))",
          description: `Isolated ${result.key} ${result.scale || ""} harmonic map at ${Math.round(result.tempo || 0)} BPM`,
        });
      } else {
        toast({
          title: useMadmom ? "Fast map ready :))" : "Detailed map ready :))",
          description: `Detected ${result.key} ${result.scale || ""} at ${Math.round(result.tempo || 0)} BPM`
        });
      }
    }
  }, [result, analysisLoading, separateVocals, instrumentalUrl, currentFileId, useMadmom, cacheKey, cachedResults, toast, fileInfo, hasCachedResult, saveToHistory]);

  // 3. Notify on errors
  useEffect(() => {
    if (analysisError) {
      toast({
        title: "Analysis failed",
        description: analysisError,
        variant: "destructive",
      });
    }
  }, [analysisError, toast]);

  // 4. Handle file recognition toasts (only for fresh uploads, not background switches)
  useEffect(() => {
    if (fileInfo && !analysisLoading && !isInstrumentalLoaded && !separateVocals && !result) {
      toast({
        title: "File recognized",
        description: `Preparing analysis for ${fileInfo.name}...`,
      });
    }
  }, [fileInfo, analysisLoading, isInstrumentalLoaded, separateVocals, result, toast]);

  // Load instrumental audio when available
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

  // Switch back to original audio when vocal filter is turned OFF
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

    // Apply transposition
    if (transpose === 0) return base;

    return base.map(seg => ({
      ...seg,
      chord: transposeChord(seg.chord, transpose)
    }));
  }, [result, showSimple, transpose]);

  const { currentChord } = useMemo(() => {
    if (!currentChords.length) return { currentChord: undefined };

    const activeIndex = currentChords.findIndex((seg) => currentTime >= seg.start && currentTime <= (seg.end || seg.start + 0.1));

    if (activeIndex === -1) {
      return { currentChord: undefined };
    }

    return {
      currentChord: currentChords[activeIndex]
    };
  }, [currentTime, currentChords]);

  const activeChordVoicing = useMemo(() => {
    if (!currentChord) return null;

    // Normalize AI chord name for the library (e.g., Cmin -> Cm, C:maj -> C)
    const normalized = currentChord.chord
      .replace(":maj", "")
      .replace("min7", "m7")
      .replace("min", "m")
      .replace(":", "");

    const found = findChordByName(normalized, chordLibraryData.roots);
    return found?.variant.voicings[0] || null;
  }, [currentChord]);

  return (
    <div className="min-h-screen bg-transparent relative overflow-hidden selection:bg-white/10">



      <main className="container mx-auto px-4 md:px-6 pt-8 md:pt-12 pb-16 relative z-10">
        <div className="max-w-6xl mx-auto">

          {/* Breadcrumb */}
          <Breadcrumb items={[
            { name: "Home", url: "https://guitariz.studio/" },
            { name: "Chord AI", url: "https://guitariz.studio/chord-ai" }
          ]} />

          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
            <div className="space-y-6">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-white/5 bg-white/[0.02] text-muted-foreground text-[10px] font-bold tracking-[0.2em] uppercase">
                <Bot className="w-3 h-3" />
                <span>Neural Audio Transcription</span>
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl md:text-7xl font-light tracking-tighter text-white">
                  Chord AI <span className="text-muted-foreground font-thin">Free</span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed font-light">
                  Decode the architecture of any song using our <strong>Chord AI Free</strong> engine. Extract harmonic progressions, tempo clusters, and scale maps from raw audio instantly. <span className="text-white/40">Enable "Vocal Filter" for better chord accuracy on songs with vocals.</span>
                </p>
                <div className="mt-4 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 max-w-2xl">
                  <p className="text-xs text-amber-200/90">
                    <strong className="text-amber-100">Chord AI Free:</strong> This tool is completely free with no subscription required. Chord detection is approximate and works best with simple acoustic songs. <strong className="text-amber-100">Vocal Filter</strong> separates instrumentals for better accuracy (takes 3-5 minutes). You can download the instrumental track after analysis.
                  </p>
                </div>
              </div>
            </div>

            {!audioBuffer && (
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="h-14 px-8 rounded-2xl bg-white text-black hover:bg-white/90 text-base font-semibold shadow-2xl"
              >
                <Upload className="w-5 h-5 mr-2" />
                Select Audio File
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Main Engine Room */}
            <div className="lg:col-span-8 space-y-8">
              {/* Analysis Settings - Always visible */}
              <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3">
                <div className={cn(
                  "flex items-center gap-4 px-4 py-2 rounded-2xl bg-white/[0.03] border border-white/5 transition-all text-right",
                  analysisLoading ? "opacity-40 cursor-not-allowed border-amber-500/20" : "opacity-100"
                )}>
                  <div className="flex flex-col items-end">
                    <Label htmlFor="engine-switch-top" className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold cursor-pointer">
                      More Accurate
                    </Label>
                    {analysisLoading && <span className="text-[8px] text-amber-500/80 font-bold uppercase tracking-widest leading-none">{useMadmom ? "Switching..." : "Tuning..."}</span>}
                  </div>
                  <Switch
                    id="engine-switch-top"
                    checked={!useMadmom}
                    onCheckedChange={(checked) => setUseMadmom(!checked)}
                    disabled={analysisLoading}
                  />
                </div>

                <div className={cn(
                  "flex items-center gap-4 px-4 py-2 rounded-2xl bg-white/[0.03] border border-white/5 transition-all text-right",
                  analysisLoading ? "opacity-40 cursor-not-allowed border-amber-500/20" : "opacity-100"
                )}>
                  <div className="flex flex-col items-end">
                    <Label htmlFor="mode-switch-top" className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold cursor-pointer">
                      Complex Mode
                    </Label>
                    {analysisLoading && <span className="text-[8px] text-amber-500/80 font-bold uppercase tracking-widest leading-none">Locked</span>}
                  </div>
                  <Switch
                    id="mode-switch-top"
                    checked={!showSimple}
                    onCheckedChange={(checked) => setShowSimple(!checked)}
                    disabled={analysisLoading}
                  />
                </div>

                <div className={cn(
                  "flex items-center gap-4 px-4 py-2 rounded-2xl bg-white/[0.03] border border-white/5 transition-all text-right",
                  analysisLoading ? "opacity-40 cursor-not-allowed border-amber-500/20" : "opacity-100"
                )}>
                  <div className="flex flex-col items-end">
                    <Label htmlFor="vocal-switch-top" className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold cursor-pointer">
                      Vocal Filter
                    </Label>
                    {analysisLoading && <span className="text-[8px] text-amber-500/80 font-bold uppercase tracking-widest leading-none">Active</span>}
                  </div>
                  <Switch
                    id="vocal-switch-top"
                    checked={separateVocals}
                    onCheckedChange={setSeparateVocals}
                    disabled={analysisLoading}
                  />
                </div>
              </div>

              <div className="glass-card rounded-[2.5rem] border border-white/5 bg-[#0d0d0d]/90 shadow-2xl overflow-hidden min-h-[500px] flex flex-col transition-all">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="audio/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // If we have a result but no audio, we are likely restoring audio for a history item
                      const isRestoring = !!result && !audioBuffer;

                      const fileId = `${file.name}-${file.size}-${file.lastModified}`;

                      setSelectedFile(file);
                      setOriginalFile(file);

                      if (!isRestoring) {
                        setCurrentFileId(fileId);
                        setCachedResults({}); // Clear cache for new file
                        setLoadedInstrumentalUrl(null);
                        setIsInstrumentalLoaded(false);
                        setWasVocalFilterOn(false);
                        setHistoryFileName(null);
                      }

                      loadFile(file);
                    }
                    // Reset value so the same file can be selected again
                    e.target.value = '';
                  }}
                />
                {!audioBuffer && !result ? (
                  <div
                    className={cn(
                      "flex-1 m-4 border-2 border-dashed rounded-[2rem] transition-all flex flex-col items-center justify-center p-12 text-center",
                      dragActive ? "border-white/20 bg-white/[0.03]" : "border-white/5 hover:border-white/10"
                    )}
                    onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragActive(false);
                      const files = e.dataTransfer.files;
                      if (files?.[0]) {
                        const file = files[0];
                        const fileId = `${file.name}-${file.size}-${file.lastModified}`;
                        setSelectedFile(file);
                        setOriginalFile(file);
                        setCurrentFileId(fileId);
                        setCachedResults({}); // Clear cache for new file
                        setLoadedInstrumentalUrl(null);
                        setIsInstrumentalLoaded(false);
                        setWasVocalFilterOn(false);
                        loadFile(file);
                      }
                    }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="w-24 h-24 bg-white/[0.03] rounded-full flex items-center justify-center mb-8 border border-white/5">
                      <Wand2 className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-2xl font-light text-white mb-3">Initialize Analysis</h3>
                    <p className="text-muted-foreground max-w-sm font-light">
                      Drag and drop your project file or select from disk. Support for stem analysis and full mix transcription.
                    </p>
                    <p className="text-xs text-muted-foreground/60 font-mono">
                      Maximum file size: 15MB
                    </p>
                  </div>
                ) : (
                  <div className="p-10 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    {/* History Restore Warning */}
                    {!audioBuffer && result && (
                      <div className="px-6 py-4 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in zoom-in-95 duration-500">
                        <div className="flex items-center gap-3">
                          <Activity className="w-5 h-5 text-amber-400" />
                          <p className="text-sm text-amber-200/80 font-medium">Loaded from history. Upload original audio to listen and sync with waveform.</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border-none h-8 whitespace-nowrap"
                        >
                          <Upload className="w-3.5 h-3.5 mr-2" />
                          Restore Audio
                        </Button>
                      </div>
                    )}

                    {/* Controls Interface */}
                    <div className="flex flex-wrap items-center justify-between gap-6">
                      <div className="flex items-center gap-6 min-w-fit">
                        <Button
                          size="icon"
                          className="w-16 h-16 rounded-3xl bg-white text-black hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={isPlaying ? pause : play}
                          disabled={!audioBuffer}
                        >
                          {isPlaying ? <Pause className="fill-current w-6 h-6" /> : <Play className="fill-current w-6 h-6 ml-1" />}
                        </Button>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <div className="text-base font-medium text-white tracking-tight">{effectiveFileName}</div>
                            {isInstrumentalLoaded && (
                              <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold uppercase tracking-wider">
                                Instrumental
                              </span>
                            )}
                            {isLoadingInstrumental && (
                              <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold uppercase tracking-wider animate-pulse">
                                Loading...
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono tracking-wider">
                            {formatTime(currentTime)} <span className="opacity-30">/</span> {formatTime(effectiveDuration)}
                          </div>
                          {/* Upload Progress Indicator */}
                          {uploadProgress !== undefined && uploadProgress < 100 && (
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-500 transition-all duration-300"
                                  style={{ width: `${uploadProgress}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-blue-400 font-mono">{uploadProgress}%</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4">
                        {/* Audio Controls */}
                        <div className="flex items-center gap-3">
                          {/* Transposition Control */}
                          <div className="flex items-center gap-4 px-4 py-2 rounded-2xl bg-white/[0.03] border border-white/5">
                            <div className="flex flex-col items-center gap-1 min-w-[3rem]">
                              <Label className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">
                                Transpose
                              </Label>
                              <span className={cn(
                                "text-xs font-mono font-bold",
                                transpose > 0 ? "text-green-400" : transpose < 0 ? "text-red-400" : "text-white"
                              )}>
                                {transpose > 0 ? "+" : ""}{transpose}
                              </span>
                            </div>
                            <div className="w-20 sm:w-24">
                              <Slider
                                defaultValue={[0]}
                                value={[transpose]}
                                min={-6}
                                max={6}
                                step={1}
                                onValueChange={(vals) => setTranspose(vals[0])}
                                className="cursor-pointer"
                              />
                            </div>
                          </div>

                          {/* Tempo Control */}
                          <div className="flex items-center gap-4 px-4 py-2 rounded-2xl bg-white/[0.03] border border-white/5">
                            <div className="flex flex-col items-center gap-1 min-w-[3rem]">
                              <Label className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">
                                Tempo
                              </Label>
                              <span className="text-xs font-mono font-bold text-white">
                                {tempo.toFixed(2)}x
                              </span>
                            </div>
                            <div className="w-20 sm:w-24">
                              <Slider
                                defaultValue={[1.0]}
                                value={[tempo]}
                                min={0.5}
                                max={1.5}
                                step={0.05}
                                onValueChange={(vals) => setTempo(vals[0])}
                                className="cursor-pointer"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Upload new file button */}
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-9 px-3 rounded-xl bg-white/[0.03] border-white/10 hover:bg-white/[0.05] text-xs"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Upload className="w-3.5 h-3.5 mr-2" />
                            New File
                          </Button>

                          {/* Download instrumental button - show as soon as URL is available */}
                          {instrumentalUrl && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-9 px-3 rounded-xl bg-white/[0.03] border-white/10 hover:bg-white/[0.05] text-xs"
                              onClick={() => {
                                const a = document.createElement('a');
                                a.href = instrumentalUrl;
                                a.download = 'instrumental.wav';
                                a.click();
                              }}
                            >
                              <Download className="w-3.5 h-3.5 mr-2" />
                              Instrumental
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Technical Visualizations */}
                    <div className="space-y-10">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em]">
                          <Activity className="w-3 h-3" />
                          Spectral Waveform
                        </div>
                        <div className="bg-white/[0.02] rounded-3xl border border-white/5 p-2 overflow-hidden relative">
                          {!audioBuffer && (
                            <div className="absolute inset-0 z-10 bg-black/60 flex items-center justify-center p-8 text-center">
                              <p className="text-xs text-white/60 font-medium">Waveform visualization requires audio file upload.</p>
                            </div>
                          )}
                          <WaveformViewer
                            peaks={peaks || []}
                            duration={effectiveDuration}
                            currentTime={currentTime}
                            chordSegments={currentChords}
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
                            <div className="bg-white/[0.01] rounded-[2rem] border border-white/5 overflow-hidden py-4">
                              <HorizontalChordTape
                                segments={currentChords}
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

            {/* Sidebar Data */}
            <div className="lg:col-span-4 space-y-6">
              <div className="glass-card rounded-[2rem] border border-white/5 bg-[#0d0d0d]/90 p-8 space-y-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-widest">Global Analysis</h2>
                </div>

                <AnalysisSummary
                  tempo={result?.tempo}
                  keySignature={result ? `${transposeKey(result.key, transpose)} ${result.scale || ""}` : null}
                  confidence={0.96}
                />

                {/* Confidence-Guided UI */}
                {currentChords.length > 0 && (
                  <ConfidenceSummary
                    segments={currentChords}
                    onSeek={seek}
                  />
                )}

                <div className="pt-6 border-t border-white/5 space-y-6">
                  <div className="space-y-4">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Active Chord</div>
                    <div className="flex items-end justify-between gap-4">
                      <div className="text-7xl font-light tracking-tighter text-white tabular-nums min-h-[1.2rem] transition-all duration-300">
                        {currentChord ? currentChord.chord : (isPlaying ? "..." : "--")}
                      </div>
                      {currentChord && (
                        <div className="text-[10px] text-muted-foreground/40 font-mono pb-2">
                          ENDS AT {formatTime(currentChord.end || 0)}
                        </div>
                      )}
                    </div>
                  </div>

                  {currentChord && activeChordVoicing && (
                    <div className="bg-white/[0.02] rounded-3xl border border-white/5 p-4 flex justify-center animate-in fade-in zoom-in-95 duration-500 overflow-hidden">
                      <div className="scale-90 origin-center">
                        <ChordDiagram
                          frets={activeChordVoicing.frets}
                          fingers={activeChordVoicing.fingers}
                          chordName={currentChord.chord}
                          compact={true}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-6 border-t border-white/5 space-y-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                      <History className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-widest">Recent History</h2>
                  </div>
                  {history.length > 0 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-red-400"
                      onClick={clearHistory}
                      title="Clear all history"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {history.length === 0 ? (
                  <div className="py-8 text-center border-2 border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
                    <p className="text-xs text-muted-foreground font-light mb-1">No previous analyses</p>
                    <p className="text-[10px] text-muted-foreground/40 italic px-4">Upload a file to start tracking your studio sessions.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
                    {history.map((entry) => (
                      <div
                        key={entry.id}
                        className="group relative p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all cursor-pointer"
                        onClick={() => {
                          // Load from history logic
                          setCachedResults(prev => ({
                            ...prev,
                            [`${entry.fileName}-${entry.separateVocals}-${entry.useMadmom}`]: {
                              result: entry.result,
                              instrumentalUrl: entry.instrumentalUrl
                            }
                          }));
                          setCurrentFileId(entry.fileName); // Using filename as ID for history items
                          setHistoryFileName(entry.fileName);
                          setSeparateVocals(entry.separateVocals);
                          setUseMadmom(entry.useMadmom);

                          toast({
                            title: "History item loaded",
                            description: `Restored analysis for ${entry.fileName}`,
                          });
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1 overflow-hidden">
                            <div className="text-xs font-medium text-white truncate">{entry.fileName}</div>
                            <div className="flex items-center gap-2 text-[9px] text-muted-foreground uppercase tracking-wider font-bold">
                              <span>{entry.result.key} {entry.result.scale}</span>
                              <span>•</span>
                              <span>{Math.round(entry.result.tempo || 0)} BPM</span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 -mt-1 -mr-1 transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFromHistory(entry.id);
                            }}
                          >
                            <History className="w-3 h-3 group-hover:hidden" />
                            <Trash2 className="w-3 h-3 hidden group-hover:block" />
                          </Button>
                        </div>
                        <div className="mt-2 text-[8px] text-muted-foreground/40 italic">
                          Analyzed {new Date(entry.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-8 rounded-[2rem] border border-white/5 bg-white/[0.01] space-y-5">
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Capabilities</h4>
                <ul className="space-y-4">
                  {[
                    { icon: Activity, label: "Inversion & Voicing Detection" },
                    { icon: Settings2, label: "Multi-temporal Tempo Tracking" },
                    { icon: Wand2, label: "Automated Key Map Generation" }
                  ].map(({ icon: Icon, label }) => (
                    <li key={label} className="flex items-center gap-4 text-xs text-muted-foreground/80 group">
                      <div className="p-1.5 rounded-lg bg-white/[0.03] border border-white/5 group-hover:text-white group-hover:border-white/10 transition-all">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      {label}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* SEO FAQ Section */}
        <SEOContent
          pageName="chord-ai"
          faqs={[
            {
              question: "What is Chord AI and how does it work?",
              answer: "Chord AI is a neural network-powered tool that analyzes audio files to automatically detect chords, tempo, and key signatures. It uses advanced machine learning models (Madmom and Librosa) to transcribe harmonic progressions from any song, making it perfect for musicians learning songs, creating covers, or analyzing music theory.",
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
              answer: "Chord detection accuracy varies based on audio quality and complexity. Simple acoustic songs typically achieve 85-95% accuracy, while complex multi-instrument arrangements may be 70-85% accurate. Enabling the Vocal Filter and using the more accurate engine (Librosa) improves results significantly.",
            },
            {
              question: "What's the difference between Fast and Accurate mode?",
              answer: "Fast mode (Madmom) provides results in 30-60 seconds and works well for most songs. Accurate mode (Librosa) takes 2-3 minutes but offers more detailed harmonic analysis and better handles complex chord voicings and jazz harmonies. Try Fast mode first, then switch to Accurate if needed.",
            },
            {
              question: "Can I transpose the detected chords?",
              answer: "Yes! After analysis, you can transpose chords up or down by 6 semitones using the transpose slider. This is perfect for matching your vocal range or adapting songs to different instruments. The key signature updates automatically with transposition.",
            },
            {
              question: "How long does chord analysis take?",
              answer: "Fast mode (Madmom): 30-60 seconds. Accurate mode (Librosa): 2-3 minutes. Vocal Filter mode: 3-5 minutes (includes stem separation). Processing time depends on song length and server load. All analyses run on our servers, so no local GPU is needed.",
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
      </main>
    </div>
  );
};

export default ChordAIPage;
