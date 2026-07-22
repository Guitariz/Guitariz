import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Check, X, ArrowRight, Wand2, ShieldCheck, Layers, Download, Cpu } from "lucide-react";
import { usePageMetadata } from "@/hooks/usePageMetadata";
import { SEOContent, Breadcrumb } from "@/components/SEOContent";
import RelatedTools from "@/components/RelatedTools";

const MoisesAlternativePage = () => {
  usePageMetadata({
    title: "Best Free Moises AI Alternative (Unlimited 6 Stems) | Guitariz",
    description: "Looking for a free Moises AI alternative? Guitariz provides unlimited 6-stem AI audio separation, zero song duration limits, and free WAV downloads.",
    keywords: "free moises alternative, moises ai alternative, free stem splitter online, extract vocals drums bass guitar free, demucs online free, stem separation no limits",
    canonicalUrl: "https://guitariz.studio/moises-alternative",
    ogImage: "https://guitariz.studio/logo2.png",
    ogType: "website",
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebPage",
          "@id": "https://guitariz.studio/moises-alternative#webpage",
          "url": "https://guitariz.studio/moises-alternative",
          "name": "Best Free Moises AI Alternative - Guitariz Studio",
          "description": "Comprehensive comparison between Guitariz Studio and Moises AI for stem separation."
        },
        {
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "Why is Guitariz Studio the best free alternative to Moises AI?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Guitariz Studio offers unlimited 6-stem AI separation (vocals, drums, bass, guitar, piano, other) using Meta's Demucs model without monthly track caps, 5-minute song length restrictions, or subscription fees."
              }
            },
            {
              "@type": "Question",
              "name": "Can I separate songs longer than 5 minutes for free?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes! Unlike Moises AI's free tier which cuts off processing at 5 minutes, Guitariz Studio allows full-length audio tracks to be processed and split without duration limits."
              }
            },
            {
              "@type": "Question",
              "name": "Can I download isolated stems in WAV format?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes. Guitariz Studio lets you download high-quality uncompressed WAV or MP3 stem files directly to your device for production, mixing, or practice."
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
            { name: "Moises Alternative", url: "https://guitariz.studio/moises-alternative" }
          ]} />

          {/* Header */}
          <div className="text-center space-y-6">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full border border-purple-500/20 bg-purple-500/10 text-purple-400 text-[10px] font-bold tracking-[0.2em] uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Free Neural Stem Isolation</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-light tracking-tighter text-white">
                The Best <span className="text-purple-400 font-normal">Free Moises AI Alternative</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-light">
                Separate songs into 6 distinct stems — vocals, drums, bass, electric guitar, piano, and backing tracks — with zero song length caps or monthly quotas.
              </p>
            </div>

            {/* Answer-First GEO Block */}
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 max-w-3xl mx-auto text-left space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-widest text-purple-400">Why Musicians Switch from Moises AI to Guitariz Studio</h2>
              <p className="text-sm text-muted-foreground leading-relaxed font-light">
                Guitariz Studio is a 100% free, open-source alternative to Moises AI. While Moises restricts free users to 5 songs per month, caps song duration at 5 minutes, and restricts 6-stem separation to paid subscriptions, Guitariz offers unlimited 6-stem extraction powered by Meta's Demucs neural model completely free.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/stem-separator">
                <Button className="h-14 px-8 rounded-2xl bg-white text-black hover:bg-white/90 text-base font-semibold shadow-xl flex items-center gap-2">
                  <Wand2 className="w-5 h-5" />
                  Try 6-Stem Separator Free <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/vocal-splitter">
                <Button variant="outline" className="h-14 px-8 rounded-2xl border-white/10 text-white hover:bg-white/5 text-base font-semibold">
                  1-Click Vocal Remover
                </Button>
              </Link>
            </div>
          </div>

          {/* Comparison Table Section */}
          <div className="glass-card rounded-[2rem] border border-white/10 bg-[#0a0a0a]/90 p-6 md:p-10 shadow-2xl space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl md:text-3xl font-light tracking-tight">Feature-by-Feature Comparison</h2>
              <p className="text-sm text-muted-foreground">See how Guitariz Studio compares to Moises AI</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    <th className="py-4 px-4">Feature</th>
                    <th className="py-4 px-4 text-purple-400 bg-purple-500/5 rounded-t-xl">Guitariz Studio</th>
                    <th className="py-4 px-4">Moises AI (Free)</th>
                    <th className="py-4 px-4">Moises AI (Pro)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-light">
                  <tr>
                    <td className="py-4 px-4 font-medium text-white flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-purple-400 shrink-0" /> Price & Subscription
                    </td>
                    <td className="py-4 px-4 text-emerald-400 font-semibold bg-purple-500/5">100% Free Forever</td>
                    <td className="py-4 px-4 text-muted-foreground">$0 (Capped)</td>
                    <td className="py-4 px-4 text-muted-foreground">$3.99 / month</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 font-medium text-white">Monthly Song Separations</td>
                    <td className="py-4 px-4 text-emerald-400 font-semibold bg-purple-500/5">Unlimited Tracks</td>
                    <td className="py-4 px-4 text-rose-400">5 Songs / month</td>
                    <td className="py-4 px-4 text-muted-foreground">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 font-medium text-white">Song Duration Limit</td>
                    <td className="py-4 px-4 text-emerald-400 font-semibold bg-purple-500/5">No Limit (Full Song)</td>
                    <td className="py-4 px-4 text-rose-400">5 Minutes max</td>
                    <td className="py-4 px-4 text-muted-foreground">20 Minutes max</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 font-medium text-white">6-Stem Isolation (Guitar & Piano)</td>
                    <td className="py-4 px-4 text-emerald-400 font-semibold bg-purple-500/5"><Check className="w-5 h-5 text-emerald-400" /></td>
                    <td className="py-4 px-4 text-rose-400">2-4 Stems basic</td>
                    <td className="py-4 px-4 text-emerald-400"><Check className="w-5 h-5 text-emerald-400" /></td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 font-medium text-white">High-Quality WAV Download</td>
                    <td className="py-4 px-4 text-emerald-400 font-semibold bg-purple-500/5"><Check className="w-5 h-5 text-emerald-400" /></td>
                    <td className="py-4 px-4 text-rose-400"><X className="w-5 h-5 text-rose-500" /></td>
                    <td className="py-4 px-4 text-emerald-400"><Check className="w-5 h-5 text-emerald-400" /></td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 font-medium text-white">No Account / Registration Needed</td>
                    <td className="py-4 px-4 text-emerald-400 font-semibold bg-purple-500/5"><Check className="w-5 h-5 text-emerald-400" /></td>
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
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-medium">Meta Demucs AI Engine</h3>
              <p className="text-xs text-muted-foreground leading-relaxed font-light">
                Powered by state-of-the-art Meta Demucs deep neural networks for pristine isolation with minimal phase artifacts.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Download className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-medium">Uncompressed WAV Export</h3>
              <p className="text-xs text-muted-foreground leading-relaxed font-light">
                Download pristine 16-bit 44.1kHz WAV stems directly to your computer or phone for immediate production use.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-medium">No Account or Credit Card</h3>
              <p className="text-xs text-muted-foreground leading-relaxed font-light">
                Drop your file and process stems instantly. No email verification, password creation, or credit card forms.
              </p>
            </div>
          </div>

          {/* SEO Content Section */}
          <SEOContent
            pageName="moises-alternative"
            faqs={[
              {
                question: "Is Guitariz Studio really a completely free alternative to Moises AI?",
                answer: "Yes! Guitariz Studio provides 100% free stem separation for vocals, drums, bass, guitar, piano, and other instruments without monthly credits or duration caps."
              },
              {
                question: "What audio formats can I upload for stem separation?",
                answer: "You can upload MP3, WAV, FLAC, M4A, OGG, and AAC files up to 15MB. Output files can be previewed in your browser and downloaded as WAV or MP3 files."
              },
              {
                question: "How long does stem separation take?",
                answer: "Vocal/Instrumental 2-stem separation takes 1-2 minutes. Full 6-stem separation takes 2-3 minutes depending on song length."
              }
            ]}
          />

          <RelatedTools currentPath="/moises-alternative" />
        </div>
      </main>
    </div>
  );
};

export default MoisesAlternativePage;
