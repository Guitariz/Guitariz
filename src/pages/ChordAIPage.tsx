import { useEffect, useMemo, useRef, useState } from "react";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import WaveformViewer from "@/components/chord-ai/WaveformViewer";
import ChordTimeline from "@/components/chord-ai/ChordTimeline";
import AnalysisSummary from "@/components/chord-ai/AnalysisSummary";
import { useToast } from "@/components/ui/use-toast";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useChordAnalysis } from "@/hooks/useChordAnalysis";
import { ChordSegment } from "@/types/chordAI";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bot, Upload, Pause, Play, Activity, Settings2, Sparkles, Wand2 } from "lucide-react";
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
  const { result, loading: analysisLoading } = useChordAnalysis(audioBuffer, selectedFile, true);
  const [dragActive, setDragActive] = useState(false);

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
                  Decode the architecture of any song. Our neural engine extracts harmonic progressions, tempo clusters, and scale maps from raw audio.
                </p>
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
                        setSelectedFile(files[0]);
                        loadFile(files[0]);
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
                          setSelectedFile(file);
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
                          <div className="text-base font-medium text-white tracking-tight">{fileInfo?.name}</div>
                          <div className="text-xs text-muted-foreground font-mono tracking-wider">
                            {formatTime(currentTime)} <span className="opacity-30">/</span> {formatTime(duration)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 px-4 py-2 rounded-2xl bg-white/[0.03] border border-white/5">
                        <Label htmlFor="mode-switch" className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold cursor-pointer">
                          Complex
                        </Label>
                        <Switch
                          id="mode-switch"
                          checked={!showSimple}
                          onCheckedChange={(checked) => setShowSimple(!checked)}
                        />
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
                          <span className="text-xs text-muted-foreground uppercase tracking-widest animate-pulse">Neural Decoding...</span>
                        </div>
                      ) : result && (
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
                      )}
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

