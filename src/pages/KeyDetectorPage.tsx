import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Key, RefreshCw, ArrowRight, FileAudio } from "lucide-react";
import { usePageMetadata } from "@/hooks/usePageMetadata";
import { SEOContent, Breadcrumb } from "@/components/SEOContent";
import RelatedTools from "@/components/RelatedTools";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useChordAnalysis } from "@/hooks/useChordAnalysis";
import { Link } from "react-router-dom";

const KeyDetectorPage = () => {
  usePageMetadata({
    title: "Free Online Key Detector & Song Key Finder | Guitariz",
    description: "Detect the exact key signature and scale of any song or MP3 file online for free. AI musical key detector for producers, DJs, and musicians.",
    keywords: "key detector, audio key finder online, detect key of song, song key detector free, mp3 key finder, musical key recognition, scale finder audio",
    canonicalUrl: "https://guitariz.studio/key-detector",
    ogImage: "https://guitariz.studio/logo2.png",
    ogType: "website",
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "SoftwareApplication",
          "name": "Guitariz Online Key Detector",
          "applicationCategory": "MusicApplication",
          "operatingSystem": "Web",
          "url": "https://guitariz.studio/key-detector",
          "description": "Free online audio key finder and scale mode detector.",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "bestRating": "5",
            "worstRating": "1",
            "reviewCount": "98"
          }
        },
        {
          "@type": "HowTo",
          "name": "How to find the key of any song online",
          "step": [
            {
              "@type": "HowToStep",
              "text": "Upload your audio or MP3 track to the Key Detector."
            },
            {
              "@type": "HowToStep",
              "text": "The neural analysis engine extracts chromatic pitches to identify tonic root and mode."
            },
            {
              "@type": "HowToStep",
              "text": "View the detected key signature, scale, and compatible chord progressions."
            }
          ]
        }
      ]
    }
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { loadFile, audioBuffer } = useAudioPlayer();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { result, loading: analysisLoading } = useChordAnalysis(
    audioBuffer,
    selectedFile,
    true,
    false
  );

  const detectedKey = result?.key ? `${result.key} ${result.scale || ""}`.trim() : null;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden selection:bg-white/10">
      <main className="container mx-auto px-4 md:px-6 pt-8 md:pt-12 pb-16 relative z-10">
        <div className="max-w-4xl mx-auto">
          <Breadcrumb
            items={[
              { name: "Home", url: "https://guitariz.studio/" },
              { name: "Key Detector", url: "https://guitariz.studio/key-detector" }
            ]}
          />

          <div className="space-y-4 mb-10 text-center md:text-left">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-border bg-card/50 text-muted-foreground text-[10px] font-bold tracking-[0.2em] uppercase">
              <Key className="w-3.5 h-3.5 text-blue-400" />
              <span>AI Audio Key Recognition</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-foreground">
              Audio Key Detector <span className="text-muted-foreground font-thin italic">& Scale Finder</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed font-light">
              Instantly find the musical key signature and scale of any audio track or MP3 file for seamless DJ mixing, pitching, and song arrangement.
            </p>
          </div>

          <div className="glass-card rounded-[2rem] border border-border bg-card/95 p-10 shadow-2xl space-y-8 mb-12">
            <div className="text-center py-8 space-y-4">
              {analysisLoading ? (
                <div className="space-y-4">
                  <RefreshCw className="w-12 h-12 text-primary animate-spin mx-auto" />
                  <p className="text-sm font-bold text-muted-foreground">Extracting harmonic chromagram & pitch profiles...</p>
                </div>
              ) : detectedKey ? (
                <div className="space-y-4 animate-in zoom-in-95 duration-500">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em]">
                    Detected Key Signature
                  </span>
                  <div className="text-7xl font-black tracking-tighter text-foreground">
                    {detectedKey}
                  </div>
                  {result?.tempo && (
                    <p className="text-xs text-muted-foreground font-mono">
                      Tempo: {Math.round(result.tempo)} BPM
                    </p>
                  )}

                  <div className="pt-4 flex justify-center gap-4">
                    <Link
                      to="/scales"
                      className="inline-flex items-center px-4 py-2 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-xs font-bold transition-all border border-blue-500/20"
                    >
                      Explore {result?.key} Scale Diagrams <ArrowRight className="w-3 h-3 ml-2" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <Key className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                  <div className="text-4xl font-black text-muted-foreground/30 tracking-tighter">
                    KEY SIGNATURE
                  </div>
                  <p className="text-xs text-muted-foreground">Select an audio file below to identify its musical key</p>
                </div>
              )}
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
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
                      <FileAudio className="w-4 h-4" />
                    </div>
                    <div className="truncate text-left">
                      <p className="text-xs font-bold text-white truncate max-w-[260px]" title={selectedFile.name}>
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
                className="w-full h-14 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-bold shadow-xl transition-all"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Song / Audio Track
              </Button>
            )}
          </div>

          <SEOContent
            pageName="key-detector"
            faqs={[
              {
                question: "How does AI detect the key signature of a song?",
                answer: "Our key detector analyzes pitch chromagrams in your audio track to map note distribution to Major, Minor, and modal key signatures."
              },
              {
                question: "Why is key detection useful for DJs and producers?",
                answer: "Knowing the musical key enables harmonic DJ mixing (Camelot wheel), pitch matching, and creating remixes without key clashes."
              },
              {
                question: "Can it detect minor keys and modal scales?",
                answer: "Yes! The engine detects major keys, minor keys, and modal scale variations."
              }
            ]}
          />

          <RelatedTools currentPath="/key-detector" />
        </div>
      </main>
    </div>
  );
};

export default KeyDetectorPage;
