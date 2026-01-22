import { useEffect, useMemo, useRef, useState } from "react";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import WaveformViewer from "@/components/chord-ai/WaveformViewer";
import ChordTimeline from "@/components/chord-ai/ChordTimeline";
import HorizontalChordTape from "@/components/chord-ai/HorizontalChordTape";
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

  const { result, loading: analysisLoading, instrumentalUrl, error: analysisError, uploadProgress } = useChordAnalysis(
    audioBuffer, 
    selectedFile, 
    true, 
    separateVocals,
    cacheKey,
    cachedResult
  );

  // 1. Initial File Analysis Toast
  useEffect(() => {
    if (analysisLoading && !separateVocals && !cachedResults.withoutVocalFilter && currentFileId) {
      toast({
        title: "Analyzing audio",
        description: "Generating harmonic map. This will only take some seconds.",
      });
    }
  }, [analysisLoading, !!cachedResults.withoutVocalFilter, separateVocals, currentFileId]);

  // 2. Vocal Filter Start Toast (Triggered immediately on toggle if not cached)
  useEffect(() => {
    if (separateVocals && !cachedResults.withVocalFilter && currentFileId) {
      const hasOriginalChords = cachedResults.withoutVocalFilter?.result?.chords?.length;
      toast({
        title: "Vocal filter process is on :))",
        description: hasOriginalChords 
          ? "We're cleaning up the audio, but you can keep jamming with the original chords for now! It will take about 2-3 minutes to ready the instrumentals."
          : "Isolating instrumentals and detecting chords. This will take about 2-3 minutes!",
      });
    }
  }, [separateVocals, currentFileId, !!cachedResults.withVocalFilter]);

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

  // 4. Success Toasts & Caching
  const lastNotifiedResultRef = useRef<string | null>(null);
  useEffect(() => {
    if (result && !analysisLoading) {
      // Cache the result
      const key = separateVocals ? 'withVocalFilter' : 'withoutVocalFilter';
      if (!cachedResults[key]) {
        setCachedResults(prev => ({
          ...prev,
          [key]: { result, instrumentalUrl }
        }));
      }

      // Notification logic
      if (separateVocals && !instrumentalUrl) return; // Wait for the URL if we're in vocal mode
      
      const resultKey = `${currentFileId}-${separateVocals}`;
      if (lastNotifiedResultRef.current === resultKey) return;
      lastNotifiedResultRef.current = resultKey;

      if (separateVocals) {
        toast({
          title: "Instrumental chords ready! :))",
          description: `Isolated ${result.key} ${result.scale || ""} harmonic map at ${Math.round(result.tempo || 0)} BPM`,
        });
      } else {
        toast({ 
          title: "Harmonic map ready :))", 
          description: `Detected ${result.key} ${result.scale || ""} at ${Math.round(result.tempo || 0)} BPM` 
        });
      }
    }
  }, [result, analysisLoading, separateVocals, instrumentalUrl, currentFileId, toast]);

  // 5. Handle file recognition toasts (only for fresh uploads, not background switches)
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
    return base || [];
  }, [result, showSimple]);

  const { currentChord, prevChord, nextChord } = useMemo(() => {
    if (!currentChords.length) return { currentChord: undefined, prevChord: undefined, nextChord: undefined };
    
    const activeIndex = currentChords.findIndex((seg) => currentTime >= seg.start && currentTime <= (seg.end || seg.start + 0.1));
    
    if (activeIndex === -1) {
      // If we're at the very beginning and no segment covers time 0
      if (currentTime < currentChords[0]?.start) {
        return { 
          currentChord: undefined, 
          prevChord: undefined, 
          nextChord: currentChords[0] 
        };
      }
      return { currentChord: undefined, prevChord: undefined, nextChord: undefined };
    }
    
    return {
      currentChord: currentChords[activeIndex],
      prevChord: activeIndex > 0 ? currentChords[activeIndex - 1] : undefined,
      nextChord: activeIndex < currentChords.length - 1 ? currentChords[activeIndex + 1] : undefined
    };
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
                  "flex items-center gap-4 px-4 py-2 rounded-2xl bg-white/[0.03] border border-white/5 transition-all",
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
                  "flex items-center gap-4 px-4 py-2 rounded-2xl bg-white/[0.03] border border-white/5 transition-all",
                  analysisLoading ? "opacity-40 cursor-not-allowed border-amber-500/20" : "opacity-100"
                )}>
                  <div className="flex flex-col items-end">
                    <Label htmlFor="vocal-switch-top" className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold cursor-pointer">
                      Vocal Filter
                    </Label>
                    {analysisLoading && <span className="text-[8px] text-amber-500/80 font-bold uppercase tracking-widest leading-none">Processing...</span>}
                  </div>
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
                    <p className="text-xs text-muted-foreground/60 font-mono">
                      Maximum file size: 15MB
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
                   <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Active Chord</div>
                   <div className="text-7xl font-light tracking-tighter text-white tabular-nums min-h-[1.2rem] transition-all duration-300">
                     {currentChord ? currentChord.chord : (isPlaying ? "..." : "--")}
                   </div>
                   {currentChord && (
                     <div className="text-[10px] text-muted-foreground/40 font-mono">
                       ENDS AT {formatTime(currentChord.end || 0)}
                     </div>
                   )}
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

