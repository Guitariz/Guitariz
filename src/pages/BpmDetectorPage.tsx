import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Upload, Activity, Music, Gauge, RefreshCw, FileAudio, BookOpen, ArrowRight } from "lucide-react";
import { usePageMetadata } from "@/hooks/usePageMetadata";
import { Breadcrumb } from "@/components/SEOContent";
import RelatedTools from "@/components/RelatedTools";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { estimateTempo } from "@/lib/tempoDetection";

function getTempoCategory(bpm: number): string {
  if (bpm < 60) return "Largo / Very Slow";
  if (bpm < 76) return "Adagio / Slow Groove";
  if (bpm < 108) return "Andante / Walking Pace";
  if (bpm < 120) return "Moderato / Medium";
  if (bpm < 156) return "Allegro / Fast";
  if (bpm < 176) return "Vivace / Lively & Fast";
  return "Presto / Very Fast";
}

const BpmDetectorPage = () => {
  usePageMetadata({
    title: "Free Online BPM Detector & Tap Tempo Finder | Guitariz",
    description: "Detect the exact BPM (tempo) of any MP3 or audio file online for free. Features real-time AI audio tap tempo finder, metronome sync, and analysis.",
    keywords: "bpm detector, free online bpm detector, audio bpm finder, song tempo detector, tap tempo, detect bpm from mp3, music tempo analyzer",
    canonicalUrl: "https://guitariz.studio/bpm-detector",
    ogImage: "https://guitariz.studio/logo2.png",
    ogType: "website",
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "SoftwareApplication",
          "name": "Guitariz Online BPM Detector",
          "applicationCategory": "MusicApplication",
          "operatingSystem": "Web",
          "url": "https://guitariz.studio/bpm-detector",
          "description": "Free online BPM detector and tap tempo finder for songs and audio files.",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
        },
        {
          "@type": "HowTo",
          "name": "How to detect BPM of any song online",
          "step": [
            {
              "@type": "HowToStep",
              "text": "Upload your MP3 or audio file into the BPM Detector tool."
            },
            {
              "@type": "HowToStep",
              "text": "Wait a few seconds for the audio engine to calculate beats per minute."
            },
            {
              "@type": "HowToStep",
              "text": "Or use the interactive Tap Tempo button to manually tap along with any song."
            }
          ]
        }
      ]
    }
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { loadFile, audioBuffer } = useAudioPlayer();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [detectedBpm, setDetectedBpm] = useState<number | null>(null);
  const [analyzing, setAnalyzing] = useState<boolean>(false);

  // Pure Client-Side Local DSP Tempo Detection (Zero Backend Delay, Instant & Accurate)
  useEffect(() => {
    if (!audioBuffer) {
      setDetectedBpm(null);
      setAnalyzing(false);
      return;
    }

    setAnalyzing(true);
    const timer = setTimeout(() => {
      try {
        const bpm = estimateTempo(audioBuffer);
        setDetectedBpm(bpm);
      } catch (err) {
        console.error("Local tempo estimation failed", err);
      } finally {
        setAnalyzing(false);
      }
    }, 40);

    return () => clearTimeout(timer);
  }, [audioBuffer]);

  // Tap Tempo State
  const [tapTimes, setTapTimes] = useState<number[]>([]);
  const [tappedBpm, setTappedBpm] = useState<number | null>(null);

  const handleTap = useCallback(() => {
    const now = performance.now();
    setTapTimes((prev) => {
      // Filter out taps older than 3 seconds
      const recent = [...prev, now].filter((t) => now - t <= 3000);
      if (recent.length > 1) {
        const intervals: number[] = [];
        for (let i = 1; i < recent.length; i++) {
          intervals.push(recent[i] - recent[i - 1]);
        }
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const bpm = Math.round(60000 / avgInterval);
        if (bpm >= 30 && bpm <= 260) {
          setTappedBpm(bpm);
        }
      }
      return recent;
    });
  }, []);

  const resetTap = () => {
    setTapTimes([]);
    setTappedBpm(null);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden selection:bg-white/10">
      <main className="container mx-auto px-4 md:px-6 pt-8 md:pt-12 pb-16 relative z-10">
        <div className="max-w-4xl mx-auto">
          <Breadcrumb
            items={[
              { name: "Home", url: "https://guitariz.studio/" },
              { name: "BPM Detector", url: "https://guitariz.studio/bpm-detector" }
            ]}
          />

          <div className="space-y-4 mb-10 text-center md:text-left">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-border bg-card/50 text-muted-foreground text-[10px] font-bold tracking-[0.2em] uppercase">
              <Gauge className="w-3.5 h-3.5 text-emerald-400" />
              <span>Instant Local Web Audio Tool</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-foreground">
              BPM Detector <span className="text-muted-foreground font-thin italic">& Tap Tempo</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed font-light">
              Detect the exact beats per minute (BPM) of any song or MP3 file online in seconds, or tap along manually to measure tempo. 100% private, client-side, and instant.
            </p>
            <div className="mt-4 p-5 rounded-2xl bg-card/60 border border-border/60 max-w-3xl">
              <h2 className="text-xs font-bold uppercase tracking-widest text-primary mb-1">How to find the BPM of a song online free?</h2>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                Guitariz Online BPM Detector measures the exact beats per minute (tempo) of any song or MP3 file automatically using multi-band spectral flux beat-tracking algorithms. Runs directly in your browser with zero file upload wait times.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Audio BPM Detector Card */}
            <div className="glass-card rounded-[2rem] border border-border bg-card/95 p-8 flex flex-col justify-between shadow-2xl space-y-6">
              <div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">
                  <Activity className="w-4 h-4 text-primary" />
                  <span>Instant Audio File BPM Analyzer</span>
                </div>

                <div className="text-center py-6">
                  {analyzing ? (
                    <div className="space-y-3">
                      <RefreshCw className="w-10 h-10 text-primary animate-spin mx-auto" />
                      <p className="text-sm font-bold text-muted-foreground">Calculating tempo from audio beats...</p>
                    </div>
                  ) : detectedBpm ? (
                    <div className="space-y-2 animate-in zoom-in-95 duration-500">
                      <div className="text-7xl font-black tracking-tighter text-foreground tabular-nums">
                        {detectedBpm}
                      </div>
                      <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                        Beats Per Minute (BPM)
                      </p>
                      <div className="pt-2">
                        <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          {getTempoCategory(detectedBpm)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-5xl font-black tracking-tighter text-muted-foreground/30">
                        ---
                      </div>
                      <p className="text-xs text-muted-foreground">Upload audio file for instant BPM analysis</p>
                    </div>
                  )}
                </div>
              </div>

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
                  e.target.value = "";
                }}
              />

              {selectedFile ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-white/10 bg-black/40 backdrop-blur-md">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                        <FileAudio className="w-4 h-4" />
                      </div>
                      <div className="truncate text-left">
                        <p className="text-xs font-bold text-white truncate max-w-[220px]" title={selectedFile.name}>
                          {selectedFile.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="w-full h-11 rounded-xl border-white/10 hover:bg-white/5 text-xs font-bold transition-all"
                  >
                    <Upload className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                    Replace Audio File
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-bold shadow-xl transition-all"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload MP3 / Audio File
                </Button>
              )}
            </div>

            {/* Tap Tempo Card */}
            <div className="glass-card rounded-[2rem] border border-border bg-card/95 p-8 flex flex-col justify-between shadow-2xl space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    <Music className="w-4 h-4 text-purple-400" />
                    <span>Interactive Tap Tempo</span>
                  </div>
                  {tappedBpm && (
                    <button onClick={resetTap} className="text-[10px] text-muted-foreground hover:text-foreground font-mono">
                      Reset
                    </button>
                  )}
                </div>

                <div className="text-center py-6">
                  {tappedBpm ? (
                    <div className="space-y-2 animate-in zoom-in-95 duration-300">
                      <div className="text-7xl font-black tracking-tighter text-foreground tabular-nums">
                        {tappedBpm}
                      </div>
                      <p className="text-xs font-bold text-purple-400 uppercase tracking-widest">
                        Tapped Tempo (BPM)
                      </p>
                      <div className="pt-2">
                        <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                          {getTempoCategory(tappedBpm)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-5xl font-black tracking-tighter text-muted-foreground/30">
                        TAP
                      </div>
                      <p className="text-xs text-muted-foreground">Tap the button repeatedly in rhythm</p>
                    </div>
                  )}
                </div>
              </div>

              <Button
                onClick={handleTap}
                className="w-full h-14 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-black uppercase tracking-widest shadow-xl transition-all active:scale-[0.98]"
              >
                TAP HERE FOR TEMPO
              </Button>
            </div>
          </div>

          {/* Educational Guide Callout */}
          <div className="mt-16 p-6 sm:p-8 rounded-[2rem] border border-border bg-card/60 backdrop-blur-xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-primary" />
                  <span>Rhythm & Tempo Guide</span>
                </h4>
                <h3 className="text-xl font-light text-white tracking-tight">
                  Want to learn more about audio tempo detection?
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed font-light max-w-2xl">
                  Read our in-depth tutorial on how BPM detection algorithms analyze rhythmic transients, onset envelopes, and time-stretching.
                </p>
              </div>
              <Link 
                to="/blog/how-to-detect-bpm-of-any-song" 
                className="inline-flex items-center gap-1.5 text-xs text-white bg-primary/20 hover:bg-primary/30 border border-primary/30 transition-all font-medium py-3 px-6 rounded-2xl shrink-0"
              >
                Read BPM Guide <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <RelatedTools currentPath="/bpm-detector" />
        </div>
      </main>
    </div>
  );
};

export default BpmDetectorPage;
