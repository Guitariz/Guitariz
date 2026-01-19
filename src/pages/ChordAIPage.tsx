import { useEffect, useMemo, useRef, useState } from "react";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import WaveformViewer from "@/components/chord-ai/WaveformViewer";
import ChordTimeline from "@/components/chord-ai/ChordTimeline";
import AnalysisSummary from "@/components/chord-ai/AnalysisSummary";
import { useToast } from "@/components/ui/use-toast";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useChordAnalysis } from "@/hooks/useChordAnalysis";
import { ChordSegment } from "@/types/chordAI";
import { Bot, Upload, Pause, Play, Music2, AlertTriangle, Activity } from "lucide-react";

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
};

const ChordAIPage = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();

  const { loadFile, play, pause, seek, audioBuffer, peaks, duration, currentTime, isPlaying, fileInfo, error: audioError } =
    useAudioPlayer();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // Enable remote analysis by default (falls back to local if remote fails).
  const { result, loading: analysisLoading, error: analysisError } = useChordAnalysis(audioBuffer, selectedFile, true);

  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (fileInfo) {
      toast({
        title: "File loaded",
        description: `${fileInfo.name} (${formatTime(fileInfo.duration)})`,
      });
    }
  }, [fileInfo, toast]);

  useEffect(() => {
    if (result) {
      toast({ title: "Analysis complete", description: `${result.key} ${result.scale} at ${result.tempo} BPM` });
    }
  }, [result, toast]);

  useEffect(() => {
    const err = audioError || analysisError;
    if (err) {
      toast({ title: "Something went wrong", description: err, variant: "destructive" });
    }
  }, [audioError, analysisError, toast]);

  const handleFiles = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setSelectedFile(file);
    await loadFile(file);
  };

  const onDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    await handleFiles(e.dataTransfer.files);
  };

  const currentChord = useMemo<ChordSegment | undefined>(() => {
    if (!result?.chords) return undefined;
    return result.chords.find((seg) => currentTime >= seg.start && currentTime <= seg.end);
  }, [currentTime, result]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/80 to-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-60" aria-hidden="true">
        <div className="absolute -left-10 top-10 w-72 h-72 rounded-full blur-3xl bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20" />
        <div className="absolute right-0 bottom-10 w-80 h-80 rounded-full blur-3xl bg-gradient-to-br from-secondary/18 via-primary/16 to-accent/18" />
      </div>

      <Navigation />

      <main className="pt-28 pb-16 px-6">
        <div className="container mx-auto max-w-6xl space-y-8">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/15 via-secondary/15 to-accent/15 border border-border/60">
              <Bot className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold">Chord AI</h1>
              <p className="text-muted-foreground mt-2 max-w-2xl">
                Drop any song to get chords, tempo, and scale in real time. Upload audio, hit play, and watch the progression unfold.
              </p>
            </div>
          </div>

          <Card
            className={`border-dashed ${dragActive ? "border-primary" : "border-border/70"} bg-card/70 backdrop-blur relative`}
            onDragEnter={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragActive(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragActive(false);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={onDrop}
          >
            <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Upload a track (.mp3, .wav, .m4a) to analyze chords, tempo, and key.</p>
                {fileInfo ? (
                  <div className="text-sm">Loaded: <span className="font-semibold">{fileInfo.name}</span> ({formatTime(fileInfo.duration)})</div>
                ) : (
                  <div className="text-sm">No file selected yet.</div>
                )}
                <p className="text-[11px] text-muted-foreground/80">Analysis calls backend at <span className="font-mono text-xs">{import.meta.env.VITE_CHORD_AI_API || "/api/analyze"}</span> and falls back to local if unreachable.</p>
              </div>
              <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/mp3,audio/mpeg,audio/wav,audio/x-wav,audio/m4a"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
              <Button variant="outline" size="lg" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-5 h-5 mr-2" />
                Select Audio File
              </Button>
            </div>
          </CardContent>
        </Card>

        {currentChord && (
          <div className="relative group perspective-1000">
            <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full scale-110 opacity-50 animate-pulse pointer-events-none" />
            <div className="relative flex flex-col items-center justify-center p-12 rounded-[2rem] bg-card/40 border border-primary/20 backdrop-blur-2xl shadow-2xl animate-in zoom-in-95 fade-in duration-700 overflow-hidden">
               {/* Animated Background decorative element */}
               <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
               <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-secondary/5 rounded-full blur-3xl" />
               
              <span className="text-sm font-black text-primary/40 uppercase tracking-[0.3em] mb-4">Live Analysis</span>
              
              <div className="flex items-baseline gap-4">
                <h2 className="text-[10rem] md:text-[14rem] leading-none font-black text-transparent bg-clip-text bg-gradient-to-b from-primary via-primary to-primary/60 drop-shadow-[0_10px_20px_rgba(var(--primary),0.2)] select-none">
                  {currentChord.chord}
                </h2>
              </div>
              
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-widest mb-1">Accuracy</span>
                  <Badge variant="outline" className="text-xl px-4 py-1 border-primary/20 text-primary font-mono bg-primary/5">
                    {Math.round(currentChord.confidence * 100)}%
                  </Badge>
                </div>
                <div className="w-px h-10 bg-border/40 mx-2" />
                <div className="flex flex-col items-center">
                   <span className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-widest mb-1">Time</span>
                   <Badge variant="secondary" className="text-xl px-4 py-1 font-mono">
                    {formatTime(currentTime)}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        {(audioError || analysisError) && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Heads up</AlertTitle>
              <AlertDescription>{audioError || analysisError}</AlertDescription>
            </Alert>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <Card className="border-border/70 bg-card/70 backdrop-blur shadow-xl overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-6">
                  <div>
                    <CardTitle className="text-2xl">Waveform Viewer</CardTitle>
                    <p className="text-sm text-muted-foreground">Detailed audio analysis and playback control</p>
                  </div>
                  {currentChord ? (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      <span className="text-sm font-bold text-primary tracking-widest uppercase">{currentChord.chord}</span>
                    </div>
                  ) : null}
                </CardHeader>
                <CardContent className="pt-8 space-y-8">
                  {audioBuffer ? (
                    <div className="relative group">
                      <WaveformViewer
                        peaks={peaks}
                        duration={duration || 1}
                        currentTime={currentTime}
                        chordSegments={result?.chords || []}
                        onSeek={seek}
                      />
                    </div>
                  ) : (
                    <div className="h-64 rounded-2xl border-2 border-dashed border-border/40 bg-card/40 grid place-items-center text-sm text-muted-foreground/60 transition-colors group-hover:border-primary/20">
                      <div className="text-center space-y-4">
                        <div className="p-4 rounded-full bg-muted w-16 h-16 mx-auto flex items-center justify-center">
                          <Music2 className="w-8 h-8 opacity-40" />
                        </div>
                        <p className="font-medium">Upload a track to begin neural analysis</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-6">
                    <Slider
                      value={[currentTime]}
                      max={duration || 1}
                      min={0}
                      step={0.01}
                      onValueChange={(val) => seek(val[0])}
                      disabled={!audioBuffer}
                      className="cursor-pointer"
                    />
                    
                    <div className="flex items-center justify-between py-2">
                       <div className="flex items-center gap-4">
                        <Button 
                          size="lg"
                          className="h-14 w-32 rounded-2xl shadow-lg shadow-primary/20"
                          onClick={isPlaying ? pause : play} 
                          disabled={!audioBuffer}
                        >
                          {isPlaying ? <Pause className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
                          {isPlaying ? "PAUSE" : "PLAY"}
                        </Button>
                        
                        <div className="hidden sm:flex flex-col">
                           <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Global Key</span>
                           <span className="text-xl font-bold">{result?.key ? `${result.key} ${result.scale}` : "--"}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-3xl font-black font-mono tracking-tight tabular-nums">
                          {formatTime(currentTime)}
                        </div>
                        <div className="text-xs font-bold text-muted-foreground/60 tracking-widest uppercase">
                          Total: {formatTime(duration)}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-card/70 backdrop-blur shadow-xl">
                <CardHeader>
                  <CardTitle>Session Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  {analysisLoading ? (
                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                      <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                      <p className="text-sm font-medium animate-pulse">Running Neural Harmonic Engine...</p>
                    </div>
                  ) : (
                    <AnalysisSummary tempo={result?.tempo} keySignature={result?.key} scale={result?.scale} />
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card className="border-border/70 bg-card/70 backdrop-blur shadow-xl h-full flex flex-col">
                <CardHeader className="border-b border-border/40 pb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">Timeline</CardTitle>
                      <p className="text-xs text-muted-foreground">Live progression tracking</p>
                    </div>
                    <Badge variant="secondary" className="font-mono">{result?.chords?.length || 0} SEGS</Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 pt-4">
                  {result?.chords?.length ? (
                    <ChordTimeline 
                      segments={result.chords} 
                      currentTime={currentTime} 
                      onSeek={seek}
                    />
                  ) : (
                    <div className="h-full min-h-[400px] grid place-items-center text-sm text-muted-foreground bg-card/40 rounded-xl border border-dashed border-border/60">
                      <div className="text-center space-y-2 opacity-40">
                        <Activity className="w-8 h-8 mx-auto" />
                        <p>No recording data</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ChordAIPage;
