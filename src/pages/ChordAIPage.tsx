import { useEffect, useMemo, useRef, useState } from "react";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import WaveformViewer from "@/components/chord-ai/WaveformViewer";
import ChordTimeline from "@/components/chord-ai/ChordTimeline";
import AnalysisSummary from "@/components/chord-ai/AnalysisSummary";
import { useToast } from "@/components/ui/use-toast";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useChordAnalysis } from "@/hooks/useChordAnalysis";
import { ChordSegment, AnalysisResult } from "@/types/chordAI";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bot, Upload, Pause, Play, Activity, Settings2, Sparkles, Wand2, Download } from "lucide-react";
import { cn } from "@/lib/utils";

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

const ChordAIPage = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();

  const { loadFile, play, pause, seek, audioBuffer, peaks, duration, currentTime, isPlaying, fileInfo } =
    useAudioPlayer();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showSimple, setShowSimple] = useState(false);
  const [separateVocals, setSeparateVocals] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [loadedInstrumentalUrl, setLoadedInstrumentalUrl] = useState<string | null>(null);
  const [isInstrumentalLoaded, setIsInstrumentalLoaded] = useState(false);
  const [isLoadingInstrumental, setIsLoadingInstrumental] = useState(false);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [wasVocalFilterOn, setWasVocalFilterOn] = useState(false);
  
  // Cache for analysis results to avoid re-analyzing when toggling
  const [cachedResults, setCachedResults] = useState<{
    withVocalFilter?: { result: AnalysisResult; instrumentalUrl?: string };
    withoutVocalFilter?: { result: AnalysisResult };
  }>({});
  const [currentFileId, setCurrentFileId] = useState<string | null>(null);

  const cacheKey = currentFileId ? `${currentFileId}-${separateVocals}` : undefined;
  const cachedResult = currentFileId 
    ? (separateVocals ? cachedResults.withVocalFilter : cachedResults.withoutVocalFilter)
    : undefined;

  const { result, loading: analysisLoading, instrumentalUrl, error: analysisError } = useChordAnalysis(
    audioBuffer, 
    selectedFile, 
    true, 
    separateVocals,
    cacheKey,
    cachedResult
  );

  // Notify when using cached results
  useEffect(() => {
    if (cachedResult && cacheKey && result && !analysisLoading) {
      const previousKey = separateVocals ? 'withVocalFilter' : 'withoutVocalFilter';
      const hasCached = cachedResults[previousKey]?.result === result;
      
      if (hasCached) {
        toast({
          title: "Using cached analysis",
          description: "Loaded previous results instantly - no re-analysis needed.",
        });
      }
    }
  }, [cachedResult, cacheKey, result, analysisLoading, separateVocals, cachedResults, toast]);

  // Notify when analysis starts
  useEffect(() => {
    if (analysisLoading && !cachedResult) {
      toast({
        title: separateVocals ? "Separating vocals & analyzing" : "Analyzing audio",
        description: separateVocals 
          ? "This can take 1-3 minutes. You can keep this tab in the background."
          : "This should only take a few seconds.",
      });
    }
  }, [analysisLoading, separateVocals, cachedResult, toast]);

  // Notify on errors
  useEffect(() => {
    if (analysisError) {
      toast({
        title: "Analysis failed",
        description: analysisError,
        variant: "destructive",
      });
    }
  }, [analysisError, toast]);

  // Cache results when analysis completes
  useEffect(() => {
    if (result && !analysisLoading) {
      const key = separateVocals ? 'withVocalFilter' : 'withoutVocalFilter';
      setCachedResults(prev => ({
        ...prev,
        [key]: { result, instrumentalUrl }
      }));
      
      // Notify user of completion
      toast({
        title: "Analysis complete",
        description: separateVocals 
          ? "Vocals separated and chords analyzed successfully."
          : "Chords analyzed successfully.",
      });
    }
  }, [result, analysisLoading, separateVocals, instrumentalUrl, toast]);

  // Load instrumental audio when available
  useEffect(() => {
    // Only load if we have a new instrumental URL that hasn't been loaded yet
    if (instrumentalUrl && separateVocals && instrumentalUrl !== loadedInstrumentalUrl) {
      console.log("Loading instrumental from:", instrumentalUrl);
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
          setWasVocalFilterOn(true); // Mark that vocal filter was ON when this loaded
          toast({
            title: "Playing instrumental track",
            description: "Chords detected from instrumental-only audio",
          });
        })
        .catch(err => {
          console.error("Failed to load instrumental audio:", err);
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

  // Switch back to original audio when vocal filter is turned OFF (only if it was ON before)
  useEffect(() => {
    if (!separateVocals && originalFile && isInstrumentalLoaded && wasVocalFilterOn) {
      console.log("Switching back to original audio");
      loadFile(originalFile);
      setIsInstrumentalLoaded(false);
      setLoadedInstrumentalUrl(null);
      setWasVocalFilterOn(false);
      toast({
        title: "Playing original audio",
        description: "Switched back to full mix",
      });
    }
  }, [separateVocals, originalFile, isInstrumentalLoaded, wasVocalFilterOn, loadFile, toast]);

  useEffect(() => {
    if (fileInfo) {
      toast({
        title: "File analysis initiated",
        description: `Processing ${fileInfo.name}...`,
      });
    }
  }, [fileInfo, toast]);

  useEffect(() => {
    if (result) {
      toast({ 
        title: "Harmonic map ready", 
        description: `Detected ${result.key} ${result.scale || ""} at ${Math.round(result.tempo || 0)} BPM` 
      });
    }
  }, [result, toast]);

  const currentChords = useMemo(() => {
    if (!result) return [];
    const base = showSimple && result.simpleChords ? result.simpleChords : result.chords;
    return base || [];
  }, [result, showSimple]);

  const currentChord = useMemo<ChordSegment | undefined>(() => {
    if (!currentChords.length) return undefined;
    return currentChords.find((seg) => currentTime >= seg.start && currentTime <= (seg.end || seg.start + 0.1));
  }, [currentTime, currentChords]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden selection:bg-white/10">
      {/* Structural Grain */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
      
      <Navigation />

      <main className="container mx-auto px-4 md:px-6 pt-24 md:pt-32 pb-16 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
            <div className="space-y-6">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-white/5 bg-white/[0.02] text-muted-foreground text-[10px] font-bold tracking-[0.2em] uppercase">
                <Bot className="w-3 h-3" />
                <span>Neural Audio Transcription</span>
              </div>
              
              <div className="space-y-4">
                <h1 className="text-5xl md:text-7xl font-light tracking-tighter text-white">
                  Chord <span className="text-muted-foreground font-thin">AI</span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed font-light">
                  Decode the architecture of any song. Our neural engine extracts harmonic progressions, tempo clusters, and scale maps from raw audio. <span className="text-white/40">Enable "Vocal Filter" for better chord accuracy on songs with vocals.</span>
                </p>
                <div className="mt-4 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 max-w-2xl">
                  <p className="text-xs text-amber-200/90">
                    <strong className="text-amber-100">Beta Feature:</strong> Chord detection is approximate and works best with simple acoustic songs. <strong className="text-amber-100">Vocal Filter</strong> separates instrumentals for better accuracy (takes 3-5 minutes). You can download the instrumental track after analysis.
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
              <div className="flex items-center justify-end gap-3">
                <div className={cn(
                  "flex items-center gap-4 px-4 py-2 rounded-2xl bg-white/[0.03] border border-white/5 transition-opacity",
                  analysisLoading && "opacity-50 pointer-events-none"
                )}>
                  <Label htmlFor="mode-switch-top" className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold cursor-pointer">
                    Complex
                  </Label>
                  <Switch
                    id="mode-switch-top"
                    checked={!showSimple}
                    onCheckedChange={(checked) => setShowSimple(!checked)}
                    disabled={analysisLoading}
                  />
                </div>
                
                <div className={cn(
                  "flex items-center gap-4 px-4 py-2 rounded-2xl bg-white/[0.03] border border-white/5 transition-opacity",
                  analysisLoading && "opacity-50 pointer-events-none"
                )}>
                  <Label htmlFor="vocal-switch-top" className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold cursor-pointer">
                    Vocal Filter
                  </Label>
                  <Switch
                    id="vocal-switch-top"
                    checked={separateVocals}
                    onCheckedChange={setSeparateVocals}
                    disabled={analysisLoading}
                  />
                </div>
              </div>
              
              <div className="glass-card rounded-[2.5rem] border border-white/5 bg-white/[0.015] backdrop-blur-3xl shadow-[0_30px_100px_rgba(0,0,0,0.5)] overflow-hidden min-h-[500px] flex flex-col transition-all">
                {!audioBuffer ? (
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
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="audio/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
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
                    />
                    <div className="w-24 h-24 bg-white/[0.03] rounded-full flex items-center justify-center mb-8 border border-white/5">
                      <Wand2 className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-2xl font-light text-white mb-3">Initialize Analysis</h3>
                    <p className="text-muted-foreground max-w-sm font-light">
                      Drag and drop your project file or select from disk. Support for stem analysis and full mix transcription.
                    </p>
                  </div>
                ) : (
                  <div className="p-10 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    {/* Controls Interface */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <Button
                          size="icon"
                          className="w-16 h-16 rounded-3xl bg-white text-black hover:scale-105 active:scale-95 transition-all"
                          onClick={isPlaying ? pause : play}
                        >
                          {isPlaying ? <Pause className="fill-current w-6 h-6" /> : <Play className="fill-current w-6 h-6 ml-1" />}
                        </Button>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <div className="text-base font-medium text-white tracking-tight">{fileInfo?.name}</div>
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
                            {formatTime(currentTime)} <span className="opacity-30">/</span> {formatTime(duration)}
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

                    {/* Technical Visualizations */}
                    <div className="space-y-10">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em]">
                          <Activity className="w-3 h-3" />
                          Spectral Waveform
                        </div>
                        <div className="bg-white/[0.02] rounded-3xl border border-white/5 p-2 overflow-hidden">
                          <WaveformViewer
                            peaks={peaks || []}
                            duration={duration}
                            currentTime={currentTime}
                            chordSegments={currentChords}
                            onSeek={seek}
                          />
                        </div>
                      </div>

                      {analysisLoading ? (
                        <div className="py-20 flex flex-col items-center justify-center space-y-4">
                          <div className="w-12 h-12 rounded-full border-t-2 border-white animate-spin opacity-20" />
                          <span className="text-xs text-muted-foreground uppercase tracking-widest animate-pulse">
                            {separateVocals ? "Separating Vocals & Analyzing..." : "Neural Decoding..."}
                          </span>
                          {separateVocals && (
                            <p className="text-[10px] text-muted-foreground/60 max-w-xs text-center">
                              This may take 3-5 minutes for vocal separation
                            </p>
                          )}                          <p className="text-[10px] text-amber-200/80 max-w-xs text-center">
                            Settings are locked during analysis
                          </p>                        </div>
                      ) : result ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em]">
                            <Settings2 className="w-3 h-3" />
                            Harmonic Progression
                          </div>
                          <ChordTimeline
                            segments={currentChords}
                            currentTime={currentTime}
                            onSeek={seek}
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar Data */}
            <div className="lg:col-span-4 space-y-6">
              <div className="glass-card rounded-[2rem] border border-white/5 bg-white/[0.015] p-8 space-y-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-widest">Global Analysis</h2>
                </div>
                
                <AnalysisSummary
                  tempo={result?.tempo}
                  keySignature={result ? `${result.key} ${result.scale || ""}` : null}
                  confidence={0.96}
                />

                <div className="pt-6 border-t border-white/5 space-y-4">
                   <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Active Segment</div>
                   <div className="text-7xl font-light tracking-tighter text-white tabular-nums min-h-[1.2em]">
                     {currentChord ? currentChord.chord : (isPlaying ? "--" : "...")}
                   </div>
                </div>
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
      </main>
    </div>
  );
};

export default ChordAIPage;

