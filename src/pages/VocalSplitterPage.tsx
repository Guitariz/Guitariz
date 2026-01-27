import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import WaveformViewer from "@/components/chord-ai/WaveformViewer";
import { Wand2, Upload, Mic, Music2, Download, Loader2, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { usePageMetadata } from "@/hooks/usePageMetadata";

const VocalSplitterPage = () => {
  usePageMetadata({
    title: "AI Vocal Splitter | Guitariz - Stem Separation",
    description: "Separate vocals from any song using advanced AI. High-quality stem extraction for karaoke, remixing, and practice.",
    canonicalUrl: "https://guitariz.studio/vocal-splitter",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Guitariz Vocal Splitter",
      "applicationCategory": "MultimediaApplication",
      "operatingSystem": "Web",
      "description": "High-quality AI stem extraction for karaoke and remixing.",
      "url": "https://guitariz.studio/vocal-splitter",
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
    }
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [separated, setSeparated] = useState(false);
  const [vocalsUrl, setVocalsUrl] = useState<string | null>(null);
  const [instrumentalUrl, setInstrumentalUrl] = useState<string | null>(null);
  
  const [vocalsVolume, setVocalsVolume] = useState(100);
  const [instrumentalVolume, setInstrumentalVolume] = useState(100);
  
  const [vocalsAudio, setVocalsAudio] = useState<AudioBuffer | null>(null);
  const [instrumentalAudio, setInstrumentalAudio] = useState<AudioBuffer | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const vocalsSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const instrumentalSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const vocalsGainRef = useRef<GainNode | null>(null);
  const instrumentalGainRef = useRef<GainNode | null>(null);

  const startTimeRef = useRef<number>(0);
  const offsetRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const [downloading, setDownloading] = useState<{ vocals: boolean; instrumental: boolean }>({
    vocals: false,
    instrumental: false,
  });

  // Track the stem output format so downloads use the correct extension.
  const [stemFormat, setStemFormat] = useState<"wav" | "mp3">("wav");

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
    if (!vocalsAudio && !instrumentalAudio) return 0;
    return Math.max(vocalsAudio?.duration ?? 0, instrumentalAudio?.duration ?? 0);
  }, [instrumentalAudio, vocalsAudio]);

  const vocalsPeaks = useMemo(() => (vocalsAudio ? computePeaks(vocalsAudio) : []), [vocalsAudio]);
  const instrumentalPeaks = useMemo(() => (instrumentalAudio ? computePeaks(instrumentalAudio) : []), [instrumentalAudio]);

  const stopRaf = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const updateClock = useCallback(() => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const now = offsetRef.current + (isPlaying ? ctx.currentTime - startTimeRef.current : 0);
    setCurrentTime(clamp(now, 0, duration));
    rafRef.current = requestAnimationFrame(updateClock);
  }, [duration, isPlaying]);

  const teardownSources = useCallback(() => {
    if (vocalsSourceRef.current) {
      try { vocalsSourceRef.current.stop(0); } catch (e) { /* ignore */ }
      vocalsSourceRef.current.disconnect();
      vocalsSourceRef.current = null;
    }
    if (instrumentalSourceRef.current) {
      try { instrumentalSourceRef.current.stop(0); } catch (e) { /* ignore */ }
      instrumentalSourceRef.current.disconnect();
      instrumentalSourceRef.current = null;
    }
  }, []);

  const pause = useCallback(() => {
    if (!isPlaying) return;
    const ctx = audioContextRef.current;
    if (!ctx) return;

    const elapsed = ctx.currentTime - startTimeRef.current;
    offsetRef.current = clamp(offsetRef.current + elapsed, 0, duration);
    setCurrentTime(offsetRef.current);
    teardownSources();
    setIsPlaying(false);
  }, [duration, isPlaying, teardownSources]);

  const play = useCallback(async () => {
    if (!vocalsAudio || !instrumentalAudio) return;
    
    const ctx = audioContextRef.current || new AudioContext();
    audioContextRef.current = ctx;

    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    // If we're at the end, reset to beginning
    if (offsetRef.current >= duration - 0.1) {
      offsetRef.current = 0;
    }

    teardownSources();

    const vSource = ctx.createBufferSource();
    const iSource = ctx.createBufferSource();
    vSource.buffer = vocalsAudio;
    iSource.buffer = instrumentalAudio;

    const vGain = vocalsGainRef.current || ctx.createGain();
    const iGain = instrumentalGainRef.current || ctx.createGain();
    vocalsGainRef.current = vGain;
    instrumentalGainRef.current = iGain;
    
    vGain.gain.value = vocalsVolume / 100;
    iGain.gain.value = instrumentalVolume / 100;

    vSource.connect(vGain).connect(ctx.destination);
    iSource.connect(iGain).connect(ctx.destination);

    startTimeRef.current = ctx.currentTime;
    vSource.start(0, offsetRef.current);
    iSource.start(0, offsetRef.current);
    
    vocalsSourceRef.current = vSource;
    instrumentalSourceRef.current = iSource;
    setIsPlaying(true);

    vSource.onended = () => {
      // Only mark as ended if we actually played to the end (not stopped manually)
      if (offsetRef.current + (ctx.currentTime - startTimeRef.current) >= duration - 0.1) {
        setIsPlaying(false);
        offsetRef.current = duration;
        setCurrentTime(duration);
      }
    };
  }, [vocalsAudio, instrumentalAudio, duration, vocalsVolume, instrumentalVolume, teardownSources]);

  const seek = useCallback((time: number) => {
    const clamped = clamp(time, 0, duration);
    offsetRef.current = clamped;
    setCurrentTime(clamped);
    
    if (isPlaying) {
      play();
    }
  }, [duration, isPlaying, play]);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setSeparated(false);
    setVocalsAudio(null);
    setInstrumentalAudio(null);
    setVocalsUrl(null);
    setInstrumentalUrl(null);
  };

  const notifyDone = async () => {
    // Always show the in-app toast via the normal flow.
    // Try an OS/browser notification for background-tab friendliness.
    if (!("Notification" in window)) return;

    try {
      if (Notification.permission === "granted") {
        new Notification("Vocal Splitter", {
          body: "Your vocals + instrumental stems are ready.",
        });
        return;
      }

      if (Notification.permission === "default") {
        const perm = await Notification.requestPermission();
        if (perm === "granted") {
          new Notification("Vocal Splitter", {
            body: "Your vocals + instrumental stems are ready.",
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
    
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("format", "mp3");
      
      const apiUrl = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
      const endpoint = `${apiUrl}/api/separate`;

      const result = await new Promise<{ vocalsUrl: string; instrumentalUrl: string; format?: string }>((resolve, reject) => {
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
            } catch (e) {
              reject(new Error("Invalid response from server"));
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              reject(new Error(errorData.detail || `Separation failed (HTTP ${xhr.status})`));
            } catch (e) {
              reject(new Error(`Separation failed (HTTP ${xhr.status})`));
            }
          }
        };

        xhr.onerror = () => reject(new Error("Network error: Could not connect to backend."));
        xhr.send(formData);
      });

      // Build absolute URLs robustly
      const vocalsAbs = new URL(result.vocalsUrl, apiUrl + "/").toString();
      const instrumentalAbs = new URL(result.instrumentalUrl, apiUrl + "/").toString();

      setVocalsUrl(vocalsAbs);
      setInstrumentalUrl(instrumentalAbs);
      setStemFormat((result.format || "wav") === "mp3" ? "mp3" : "wav");
      setSeparated(true);
      setUploadProgress(null);
      offsetRef.current = 0;
      setCurrentTime(0);

      toast({
        title: "Separation complete",
        description: "Stems are ready. Preview may take a bit to load.",
      });

      void notifyDone();

      const ctx = new AudioContext();
      audioContextRef.current = ctx;

      try {
        const vocalsResponse = await fetch(vocalsAbs);
        const vocalsArrayBuffer = await vocalsResponse.arrayBuffer();
        const vocalsBuffer = await ctx.decodeAudioData(vocalsArrayBuffer);
        setVocalsAudio(vocalsBuffer);

        const instrumentalResponse = await fetch(instrumentalAbs);
        const instrumentalArrayBuffer = await instrumentalResponse.arrayBuffer();
        const instrumentalBuffer = await ctx.decodeAudioData(instrumentalArrayBuffer);
        setInstrumentalAudio(instrumentalBuffer);
      } catch (e) {
        toast({
          title: "Preview unavailable",
          description: "Stems are ready to download, but the preview could not be prepared.",
        });
      }
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

  const updateVocalsVolume = (value: number[]) => {
    setVocalsVolume(value[0]);
    if (vocalsGainRef.current) {
      vocalsGainRef.current.gain.value = value[0] / 100;
    }
  };

  const updateInstrumentalVolume = (value: number[]) => {
    setInstrumentalVolume(value[0]);
    if (instrumentalGainRef.current) {
      instrumentalGainRef.current.gain.value = value[0] / 100;
    }
  };

  const downloadAudio = async (type: "vocals" | "instrumental") => {
    const url = type === "vocals" ? vocalsUrl : instrumentalUrl;
    if (!url) {
      toast({
        title: "Download failed",
        description: "Separated audio not found. Please process the file first.",
        variant: "destructive",
      });
      return;
    }

    // Prevent multi-click duplicate downloads
    if (downloading[type]) return;

    const label = type === "vocals" ? "Vocals" : "Instrumental";

    setDownloading((d) => ({ ...d, [type]: true }));

    // Be honest about what’s happening: the browser may show "Pending" until the server starts sending bytes.
    toast({
      title: "Requesting file…",
      description: `${label} is being prepared on the server. You may see “Pending” for a bit.`,
    });

    const slowToastTimer = window.setTimeout(() => {
      toast({
        title: "Still preparing…",
        description: `${label} is taking longer than usual to start. Please wait — avoid clicking multiple times.`,
      });
    }, 12000);

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Download failed");

      // Once headers/body start arriving, we’re no longer in "pending".
      toast({
        title: "Download starting…",
        description: `${label} should begin downloading shortly.`,
      });

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `${selectedFile?.name.split(".")[0] || "audio"}_${type}.${stemFormat}`;
      a.click();
      URL.revokeObjectURL(downloadUrl);

      toast({
        title: "Download triggered",
        description: `${label} download has been sent to your browser.`,
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Could not download the audio file.",
        variant: "destructive",
      });
    } finally {
      window.clearTimeout(slowToastTimer);
      setDownloading((d) => ({ ...d, [type]: false }));
    }
  };

  useEffect(() => {
    if (isPlaying) {
      updateClock();
    } else {
      stopRaf();
    }
    return () => stopRaf();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, duration]);

  useEffect(() => {
    const base = "Vocal Splitter";
    if (processing) {
      document.title = "Splitting… | " + base;
    } else if (separated) {
      document.title = "Split ready | " + base;
    } else {
      document.title = base;
    }
  }, [processing, separated]);

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
    <div className="min-h-screen bg-background relative overflow-hidden selection:bg-white/10">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
      
      <Navigation />

      <main className="container mx-auto px-4 md:px-6 pt-24 md:pt-32 pb-16 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-16 text-center space-y-6">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-white/5 bg-white/[0.02] text-muted-foreground text-[10px] font-bold tracking-[0.2em] uppercase">
              <Wand2 className="w-3 h-3" />
              <span>AI-Powered Source Separation</span>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-light tracking-tighter text-white">
                Vocal <span className="text-muted-foreground font-thin">Splitter</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-light">
                Separate vocals and instrumentals with precision. Adjust levels independently and export clean stems for remixing or karaoke.
              </p>
              <div className="mt-4 px-4 py-2 rounded-lg bg-white/[0.02] border border-white/5 max-w-2xl mx-auto">
                <p className="text-xs text-muted-foreground">
                  <strong className="text-white">Note:</strong> This feature requires the backend server to be running. For local testing, start the backend with <code className="px-1 py-0.5 rounded bg-white/5 text-white">python backend/main.py</code>
                </p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="glass-card rounded-[2.5rem] border border-white/5 bg-white/[0.015] backdrop-blur-3xl shadow-[0_30px_100px_rgba(0,0,0,0.5)] overflow-hidden min-h-[600px] flex flex-col p-10">
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
                  Drag and drop or click to select an audio file to split into vocals and instrumentals.
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* File Info */}
                <div className="flex items-center justify-between p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div>
                    <p className="text-sm text-muted-foreground uppercase tracking-widest font-bold mb-1">Selected File</p>
                    <h3 className="text-xl font-medium text-white">{selectedFile.name}</h3>
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
                    className="w-full h-16 rounded-2xl bg-white text-black hover:bg-white/90 text-lg font-semibold"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        {uploadProgress !== null && uploadProgress < 100 
                          ? `Uploading… ${uploadProgress}%` 
                          : "Separating Audio… (this may take a few minutes)"}
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-5 h-5 mr-2" />
                        Separate Vocals & Instrumentals
                      </>
                    )}
                  </Button>
                )}

                {/* Upload Progress Bar */}
                {processing && uploadProgress !== null && uploadProgress < 100 && (
                  <div className="w-full space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-300 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Uploading to Server</span>
                      <span className="text-[10px] text-blue-400 font-mono">{uploadProgress}%</span>
                    </div>
                  </div>
                )}

                {/* Controls */}
                {separated && (
                  <div className="space-y-8">
                    {/* Preview + Seek */}
                    <div className="space-y-4">
                      <Button
                        onClick={isPlaying ? pause : play}
                        className="w-full h-16 rounded-2xl bg-white text-black hover:bg-white/90 text-lg font-semibold"
                      >
                        {isPlaying ? "⏸ Pause Preview" : "▶ Play Preview"}
                      </Button>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em]">
                            <Activity className="w-3 h-3" />
                            Vocals Waveform
                          </div>
                          <div className="bg-white/[0.02] rounded-3xl border border-white/5 p-2 overflow-hidden">
                            <WaveformViewer
                              peaks={vocalsPeaks}
                              duration={duration}
                              currentTime={currentTime}
                              chordSegments={[]}
                              onSeek={seek}
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em]">
                            <Activity className="w-3 h-3" />
                            Instrumental Waveform
                          </div>
                          <div className="bg-white/[0.02] rounded-3xl border border-white/5 p-2 overflow-hidden">
                            <WaveformViewer
                              peaks={instrumentalPeaks}
                              duration={duration}
                              currentTime={currentTime}
                              chordSegments={[]}
                              onSeek={seek}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        Click anywhere on a waveform to jump to that moment.
                      </div>
                    </div>

                    {/* Volume Controls */}
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Vocals */}
                      <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                            <Mic className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <Label className="text-sm font-bold text-white">Vocals</Label>
                            <p className="text-xs text-muted-foreground">Volume: {vocalsVolume}%</p>
                          </div>
                        </div>
                        <Slider
                          value={[vocalsVolume]}
                          onValueChange={updateVocalsVolume}
                          max={100}
                          step={1}
                          className="w-full"
                        />
                        <Button
                          onClick={() => downloadAudio("vocals")}
                          disabled={downloading.vocals}
                          variant="outline"
                          className="w-full rounded-lg"
                        >
                          {downloading.vocals ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Waiting for server…
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4 mr-2" />
                              Download Vocals
                            </>
                          )}
                        </Button>
                      </div>

                      {/* Instrumental */}
                      <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                            <Music2 className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <Label className="text-sm font-bold text-white">Instrumental</Label>
                            <p className="text-xs text-muted-foreground">Volume: {instrumentalVolume}%</p>
                          </div>
                        </div>
                        <Slider
                          value={[instrumentalVolume]}
                          onValueChange={updateInstrumentalVolume}
                          max={100}
                          step={1}
                          className="w-full"
                        />
                        <Button
                          onClick={() => downloadAudio("instrumental")}
                          disabled={downloading.instrumental}
                          variant="outline"
                          className="w-full rounded-lg"
                        >
                          {downloading.instrumental ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Waiting for server…
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4 mr-2" />
                              Download Instrumental
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default VocalSplitterPage;
