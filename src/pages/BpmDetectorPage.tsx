import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Activity, Music, Gauge, Play, Pause, RefreshCw, Wand2, ArrowRight, FileAudio } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { usePageMetadata } from "@/hooks/usePageMetadata";
import { SEOContent, Breadcrumb } from "@/components/SEOContent";
import RelatedTools from "@/components/RelatedTools";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useChordAnalysis } from "@/hooks/useChordAnalysis";
import { Link } from "react-router-dom";

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
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "bestRating": "5",
            "worstRating": "1",
            "reviewCount": "112"
          }
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
  const { toast } = useToast();

  const { loadFile, play, pause, audioBuffer, duration, isPlaying, fileInfo } = useAudioPlayer();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { result, loading: analysisLoading } = useChordAnalysis(
    audioBuffer,
    selectedFile,
    true,
    false
  );

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

  const detectedBpm = result?.tempo ? Math.round(result.tempo) : null;

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
              <span>Free Online Audio Tool</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-foreground">
              BPM Detector <span className="text-muted-foreground font-thin italic">& Tap Tempo</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed font-light">
              Detect the exact beats per minute (BPM) of any song or MP3 file online in seconds, or tap along manually to measure tempo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Audio BPM Detector Card */}
            <div className="glass-card rounded-[2rem] border border-border bg-card/95 p-8 flex flex-col justify-between shadow-2xl space-y-6">
              <div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">
                  <Activity className="w-4 h-4 text-primary" />
                  <span>Audio File BPM Analyzer</span>
                </div>

                <div className="text-center py-6">
                  {analysisLoading ? (
                    <div className="space-y-3">
                      <RefreshCw className="w-10 h-10 text-primary animate-spin mx-auto" />
                      <p className="text-sm font-bold text-muted-foreground">Analyzing audio beats...</p>
                    </div>
                  ) : detectedBpm ? (
                    <div className="space-y-2 animate-in zoom-in-95 duration-500">
                      <div className="text-7xl font-black tracking-tighter text-foreground tabular-nums">
                        {detectedBpm}
                      </div>
                      <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                        Beats Per Minute (BPM)
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-5xl font-black tracking-tighter text-muted-foreground/30">
                        ---
                      </div>
                      <p className="text-xs text-muted-foreground">Upload audio file to analyze BPM</p>
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
                className="w-full h-16 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-base font-black tracking-wider uppercase shadow-xl active:scale-95 transition-all"
              >
                TAP HERE FOR TEMPO
              </Button>
            </div>
          </div>

          <SEOContent
            pageName="bpm-detector"
            faqs={[
              {
                question: "How accurate is the online BPM detector?",
                answer: "Our BPM detector analyzes beat onset timestamps in your audio file to calculate tempo (Beats Per Minute) with high precision."
              },
              {
                question: "How does the Tap Tempo tool work?",
                answer: "Tap the button repeatedly along with the beat of any song. The tool calculates intervals between taps to estimate your tempo in real-time."
              },
              {
                question: "What audio formats are supported?",
                answer: "We support MP3, WAV, FLAC, AAC, OGG, and M4A audio files."
              }
            ]}
          />

          <RelatedTools currentPath="/bpm-detector" />
        </div>
      </main>
    </div>
  );
};

export default BpmDetectorPage;
