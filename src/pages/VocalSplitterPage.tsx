import { useRef, useState } from "react";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Wand2, Upload, Mic, Music2, Download, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

const VocalSplitterPage = () => {
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
  
  const [isPlaying, setIsPlaying] = useState(false);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setSeparated(false);
    setVocalsAudio(null);
    setInstrumentalAudio(null);
    setVocalsUrl(null);
    setInstrumentalUrl(null);
  };

  const processSeparation = async () => {
    if (!selectedFile) return;
    
    setProcessing(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      
      const apiUrl = import.meta.env.VITE_API_URL || "";
      
      // If we're in production and VITE_API_URL is missing, warn the user
      if (import.meta.env.PROD && !apiUrl) {
        throw new Error("API URL is not configured. Please set VITE_API_URL in your environment variables.");
      }

      const endpoint = `${apiUrl}/api/separate`;
      
      // Call backend API for separation
      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        let errorText = "";
        try {
          const contentType = response.headers.get("content-type");
          if (contentType?.includes("application/json")) {
            const errorData = await response.json();
            errorText = errorData.detail || errorData.message || JSON.stringify(errorData);
          } else {
            errorText = await response.text();
          }
        } catch (e) {
          errorText = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorText || `Server returned ${response.status}`);
      }
      
      const data = await response.json();
      setVocalsUrl(`${apiUrl}${data.vocalsUrl}`);
      setInstrumentalUrl(`${apiUrl}${data.instrumentalUrl}`);
      
      // Load the separated audio files
      const ctx = new AudioContext();
      audioContextRef.current = ctx;
      
      // Fetch and decode vocals
      const vocalsResponse = await fetch(`${apiUrl}${data.vocalsUrl}`);
      if (!vocalsResponse.ok) throw new Error("Failed to fetch vocals");
      const vocalsArrayBuffer = await vocalsResponse.arrayBuffer();
      const vocalsBuffer = await ctx.decodeAudioData(vocalsArrayBuffer);
      setVocalsAudio(vocalsBuffer);
      
      // Fetch and decode instrumental
      const instrumentalResponse = await fetch(`${apiUrl}${data.instrumentalUrl}`);
      if (!instrumentalResponse.ok) throw new Error("Failed to fetch instrumental");
      const instrumentalArrayBuffer = await instrumentalResponse.arrayBuffer();
      const instrumentalBuffer = await ctx.decodeAudioData(instrumentalArrayBuffer);
      setInstrumentalAudio(instrumentalBuffer);
      
      setSeparated(true);
      toast({
        title: "Separation complete",
        description: "Vocals and instrumentals have been isolated successfully.",
      });
    } catch (error) {
      console.error("Separation error:", error);
      
      let errorMessage = "Could not separate audio. Please try again.";
      
      if (error instanceof TypeError && error.message.includes("fetch")) {
        errorMessage = "Backend server is not running. Please ensure the backend is deployed and accessible.";
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      // Log full error details to console for debugging
      console.error("Full error details:", {
        error,
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      toast({
        title: "Separation failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const playPreview = () => {
    if (!vocalsAudio || !instrumentalAudio || !audioContextRef.current) return;
    
    const ctx = audioContextRef.current;
    
    // Stop any existing playback
    if (isPlaying) {
      vocalsSourceRef.current?.stop();
      instrumentalSourceRef.current?.stop();
      setIsPlaying(false);
      return;
    }
    
    // Create sources
    const vocalsSource = ctx.createBufferSource();
    const instrumentalSource = ctx.createBufferSource();
    
    vocalsSource.buffer = vocalsAudio;
    instrumentalSource.buffer = instrumentalAudio;
    
    // Create gain nodes
    const vocalsGain = ctx.createGain();
    const instrumentalGain = ctx.createGain();
    
    vocalsGain.gain.value = vocalsVolume / 100;
    instrumentalGain.gain.value = instrumentalVolume / 100;
    
    // Connect
    vocalsSource.connect(vocalsGain).connect(ctx.destination);
    instrumentalSource.connect(instrumentalGain).connect(ctx.destination);
    
    vocalsSourceRef.current = vocalsSource;
    instrumentalSourceRef.current = instrumentalSource;
    vocalsGainRef.current = vocalsGain;
    instrumentalGainRef.current = instrumentalGain;
    
    // Play
    vocalsSource.start();
    instrumentalSource.start();
    setIsPlaying(true);
    
    // Handle end
    vocalsSource.onended = () => setIsPlaying(false);
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
    
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Download failed");
      
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `${selectedFile?.name.split(".")[0] || "audio"}_${type}.wav`;
      a.click();
      URL.revokeObjectURL(downloadUrl);
      
      toast({
        title: "Download started",
        description: `${type === "vocals" ? "Vocals" : "Instrumental"} track is downloading.`,
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Could not download the audio file.",
        variant: "destructive",
      });
    }
  };

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
                        Separating Audio...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-5 h-5 mr-2" />
                        Separate Vocals & Instrumentals
                      </>
                    )}
                  </Button>
                )}

                {/* Controls */}
                {separated && (
                  <div className="space-y-8">
                    {/* Preview Button */}
                    <Button
                      onClick={playPreview}
                      className="w-full h-16 rounded-2xl bg-white text-black hover:bg-white/90 text-lg font-semibold"
                    >
                      {isPlaying ? "⏸ Pause Preview" : "▶ Play Preview"}
                    </Button>

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
                          variant="outline"
                          className="w-full rounded-lg"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Vocals
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
                          variant="outline"
                          className="w-full rounded-lg"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Instrumental
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
