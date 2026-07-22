import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Check, X, ArrowRight, Wand2, ShieldCheck, Zap, Download, Layers } from "lucide-react";
import { usePageMetadata } from "@/hooks/usePageMetadata";
import { SEOContent, Breadcrumb } from "@/components/SEOContent";
import RelatedTools from "@/components/RelatedTools";

const ChordifyAlternativePage = () => {
  usePageMetadata({
    title: "Best Free Chordify Alternative (100% Free, No Sign-Up) | Guitariz",
    description: "Looking for a free Chordify alternative? Guitariz offers unlimited AI chord recognition, audio uploads, interactive fretboard sync, and MIDI export 100% free.",
    keywords: "free chordify alternative, chordify alternative, chordify free alternative 2026, free chord recognition app, extract chords from youtube free, ai chord identifier",
    canonicalUrl: "https://guitariz.studio/chordify-alternative",
    ogImage: "https://guitariz.studio/logo2.png",
    ogType: "website",
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebPage",
          "@id": "https://guitariz.studio/chordify-alternative#webpage",
          "url": "https://guitariz.studio/chordify-alternative",
          "name": "Best Free Chordify Alternative - Guitariz Studio",
          "description": "Comprehensive comparison between Guitariz Studio and Chordify for AI chord recognition."
        },
        {
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "Why is Guitariz Studio the best free alternative to Chordify?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Guitariz Studio offers unlimited AI chord recognition for MP3, WAV, and YouTube tracks with no monthly song limits, no paywalls, no ads, and no registration required. Features include interactive 2D/3D fretboard sync, audio stem separation, and MIDI export."
              }
            },
            {
              "@type": "Question",
              "name": "Is Guitariz Studio completely free?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes! All features on Guitariz Studio including Chord AI, Stem Separator, Fretboard Explorer, and MIDI exporter are 100% free forever under open-source software."
              }
            },
            {
              "@type": "Question",
              "name": "Can I upload my own MP3 or audio files for chord detection?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes. Unlike Chordify's free tier which restricts audio uploads, Guitariz allows unlimited MP3, WAV, FLAC, and M4A audio uploads directly in your browser."
              }
            }
          ]
        }
      ]
    }
  });

  return (
    <div className="min-h-screen bg-[#030303] relative overflow-hidden selection:bg-white/10 text-white">
      <main className="container mx-auto px-4 md:px-6 pt-8 md:pt-12 pb-16 relative z-10">
        <div className="max-w-5xl mx-auto space-y-12">

          {/* Breadcrumb */}
          <Breadcrumb items={[
            { name: "Home", url: "https://guitariz.studio/" },
            { name: "Chordify Alternative", url: "https://guitariz.studio/chordify-alternative" }
          ]} />

          {/* Header */}
          <div className="text-center space-y-6">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-400 text-[10px] font-bold tracking-[0.2em] uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>100% Free Open-Source Music Studio</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-light tracking-tighter text-white">
                The Best <span className="text-blue-400 font-normal">Free Chordify Alternative</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-light">
                Get unlimited AI chord recognition, custom MP3 uploads, interactive fretboard synchronization, and stem separation — completely free with no paywalls or account sign-up.
              </p>
            </div>

            {/* Answer-First GEO Block */}
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 max-w-3xl mx-auto text-left space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-widest text-blue-400">Why Musicians Switch from Chordify to Guitariz Studio</h2>
              <p className="text-sm text-muted-foreground leading-relaxed font-light">
                Guitariz Studio is an open-source, subscription-free alternative to Chordify. While Chordify limits free users to a few songs per month and locks audio uploading, transpose controls, stem separation, and MIDI exporting behind a $6.99/mo paywall, Guitariz provides full access to all AI transcription and music theory tools 100% free.
              </p>
            </div>

            {/* CTA Button */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/chord-ai">
                <Button className="h-14 px-8 rounded-2xl bg-white text-black hover:bg-white/90 text-base font-semibold shadow-xl flex items-center gap-2">
                  <Wand2 className="w-5 h-5" />
                  Try Chord AI Free Now <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Comparison Table Section */}
          <div className="glass-card rounded-[2rem] border border-white/10 bg-[#0a0a0a]/90 p-6 md:p-10 shadow-2xl space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl md:text-3xl font-light tracking-tight">Feature-by-Feature Comparison</h2>
              <p className="text-sm text-muted-foreground">See how Guitariz Studio stacks up against Chordify</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    <th className="py-4 px-4">Feature</th>
                    <th className="py-4 px-4 text-blue-400 bg-blue-500/5 rounded-t-xl">Guitariz Studio</th>
                    <th className="py-4 px-4">Chordify (Free)</th>
                    <th className="py-4 px-4">Chordify (Premium)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-light">
                  <tr>
                    <td className="py-4 px-4 font-medium text-white flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400 shrink-0" /> Price & Subscription
                    </td>
                    <td className="py-4 px-4 text-emerald-400 font-semibold bg-blue-500/5">100% Free Forever</td>
                    <td className="py-4 px-4 text-muted-foreground">$0 (Strict limits)</td>
                    <td className="py-4 px-4 text-muted-foreground">$6.99 / month</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 font-medium text-white">Monthly Song Recognition Limit</td>
                    <td className="py-4 px-4 text-emerald-400 font-semibold bg-blue-500/5">Unlimited Songs</td>
                    <td className="py-4 px-4 text-rose-400">3 Songs / month</td>
                    <td className="py-4 px-4 text-muted-foreground">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 font-medium text-white">Custom MP3 / WAV Audio Upload</td>
                    <td className="py-4 px-4 text-emerald-400 font-semibold bg-blue-500/5"><Check className="w-5 h-5 text-emerald-400" /></td>
                    <td className="py-4 px-4 text-rose-400"><X className="w-5 h-5 text-rose-500" /></td>
                    <td className="py-4 px-4 text-emerald-400"><Check className="w-5 h-5 text-emerald-400" /></td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 font-medium text-white">Interactive 2D & 3D Fretboard Sync</td>
                    <td className="py-4 px-4 text-emerald-400 font-semibold bg-blue-500/5"><Check className="w-5 h-5 text-emerald-400" /></td>
                    <td className="py-4 px-4 text-muted-foreground">Basic 2D diagram</td>
                    <td className="py-4 px-4 text-muted-foreground">Basic 2D diagram</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 font-medium text-white">Export Progression to MIDI</td>
                    <td className="py-4 px-4 text-emerald-400 font-semibold bg-blue-500/5"><Check className="w-5 h-5 text-emerald-400" /></td>
                    <td className="py-4 px-4 text-rose-400"><X className="w-5 h-5 text-rose-500" /></td>
                    <td className="py-4 px-4 text-emerald-400"><Check className="w-5 h-5 text-emerald-400" /></td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 font-medium text-white">AI Vocal & 6-Stem Separation</td>
                    <td className="py-4 px-4 text-emerald-400 font-semibold bg-blue-500/5"><Check className="w-5 h-5 text-emerald-400" /></td>
                    <td className="py-4 px-4 text-rose-400"><X className="w-5 h-5 text-rose-500" /></td>
                    <td className="py-4 px-4 text-rose-400"><X className="w-5 h-5 text-rose-500" /></td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 font-medium text-white">No Account / Registration Needed</td>
                    <td className="py-4 px-4 text-emerald-400 font-semibold bg-blue-500/5"><Check className="w-5 h-5 text-emerald-400" /></td>
                    <td className="py-4 px-4 text-rose-400"><X className="w-5 h-5 text-rose-500" /></td>
                    <td className="py-4 px-4 text-rose-400"><X className="w-5 h-5 text-rose-500" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Key Advantages Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-medium">100% Free & Open Source</h3>
              <p className="text-xs text-muted-foreground leading-relaxed font-light">
                No credit cards, hidden trials, or premium tier pop-ups. Guitariz Studio is built transparently for musicians and developers.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-medium">Integrated Stem Separator</h3>
              <p className="text-xs text-muted-foreground leading-relaxed font-light">
                Extract vocals, drums, bass, and piano directly alongside chord transcription using Meta's Demucs neural model.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Download className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-medium">MIDI Export for DAWs</h3>
              <p className="text-xs text-muted-foreground leading-relaxed font-light">
                Download extracted chord maps as standard MIDI files to drag and drop into Ableton, FL Studio, Logic Pro, or Reaper.
              </p>
            </div>
          </div>

          {/* SEO Content Section */}
          <SEOContent
            pageName="chordify-alternative"
            faqs={[
              {
                question: "What makes Guitariz Studio the best free alternative to Chordify?",
                answer: "Guitariz Studio provides unlimited chord recognition for audio files and YouTube videos without requiring an account or subscription. It includes advanced features like 2D/3D fretboard visualization, audio stem separation, and MIDI export that are locked behind paywalls on other platforms."
              },
              {
                question: "Can I use Guitariz Studio on mobile devices?",
                answer: "Yes! Guitariz Studio is built as a Progressive Web App (PWA) that runs smoothly on iOS, Android, macOS, Windows, and Linux browsers without installing an app store download."
              },
              {
                question: "How accurate is the chord recognition compared to Chordify?",
                answer: "Guitariz uses state-of-the-art CQT (Constant-Q Transform) pitch profiles combined with deep neural beat tracking, offering 85-95% accuracy for pop, rock, acoustic, and electronic music."
              }
            ]}
          />

          <RelatedTools currentPath="/chordify-alternative" />
        </div>
      </main>
    </div>
  );
};

export default ChordifyAlternativePage;
