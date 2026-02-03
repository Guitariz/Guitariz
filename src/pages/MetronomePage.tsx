
import Metronome from "@/components/Metronome";
import { Timer, Zap } from "lucide-react";
import { usePageMetadata } from "@/hooks/usePageMetadata";
import { SEOContent, Breadcrumb } from "@/components/SEOContent";

const MetronomePage = () => {
  usePageMetadata({
    title: "Free Precision Metronome | Guitariz - Pro Rhythm Tools",
    description: "Professional grade metronome with sample-accurate playback. Pro rhythm tools for free: poly-meters, tap-tempo, and visual pulse feedback.",
    canonicalUrl: "https://guitariz.studio/metronome",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Guitariz Metronome",
      "applicationCategory": "MusicApplication",
      "operatingSystem": "Web",
      "description": "Sample-accurate metronome with poly-meter support and visual feedback.",
      "url": "https://guitariz.studio/metronome",
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
    }
  });

  return (
    <div className="min-h-screen bg-transparent relative overflow-hidden selection:bg-white/10">



      <main className="container mx-auto px-4 md:px-6 pt-8 md:pt-12 pb-16 relative z-10">
        {/* Breadcrumb */}
        <Breadcrumb items={[
          { name: "Home", url: "https://guitariz.studio/" },
          { name: "Metronome", url: "https://guitariz.studio/metronome" }
        ]} />

        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div className="space-y-4">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-secondary/20 bg-secondary/5 text-secondary text-xs font-medium tracking-wider uppercase">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
              </span>
              <span>Temporal Precision</span>
            </div>

            <header className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-light tracking-tighter text-white font-display">
                Pulse <span className="text-muted-foreground font-thin italic">Engine</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed font-light">
                Master your timing with <span className="text-white/80">sample-accurate</span> playback. Support for complex poly-meters and tap-tempo.
              </p>
            </header>
          </div>
        </div>

        <div className="glass-card rounded-[2rem] border border-white/5 bg-[#0a0a0a]/90 shadow-2xl overflow-hidden p-8 flex items-center justify-center min-h-[400px]">
          <Metronome />
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 group hover:bg-white/[0.04] transition-all">
            <Timer className="w-5 h-5 text-muted-foreground mb-3 group-hover:text-primary transition-colors" />
            <h3 className="text-white font-medium mb-1">Visual Cues</h3>
            <p className="text-xs text-muted-foreground">High-contrast flash helps maintain time in loud environments.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 group hover:bg-white/[0.04] transition-all">
            <Zap className="w-5 h-5 text-muted-foreground mb-3 group-hover:text-secondary transition-colors" />
            <h3 className="text-white font-medium mb-1">Low Latency</h3>
            <p className="text-xs text-muted-foreground">Built on Web Audio API for professional-grade stability.</p>
          </div>
        </div>

        {/* SEO FAQ Section */}
        <SEOContent
          pageName="metronome"
          faqs={[
            {
              question: "Why is a metronome essential for music practice?",
              answer: "A metronome provides a steady beat, which is crucial for developing 'inner clock' and technical precision. It helps you stay in time, identify sections where you are rushing or dragging, and allows you to gradually increase speed while maintaining control."
            },
            {
              question: "What does 'sample-accurate' mean?",
              answer: "While many browser-based metronomes suffer from 'drift' (the beat slows down or speeds up slightly due to CPU load), our metronome uses the Web Audio API's scheduling system. This ensures the clicks are perfectly timed regardless of other processes running on your computer."
            },
            {
              question: "How do I use tap-tempo?",
              answer: "Simply click the 'TAP' button or press your spacebar in time with a song you are listening to. Our engine will calculate the average BPM based on your inputs, allowing you to quickly find the right tempo for any track."
            },
            {
              question: "Can I use different time signatures?",
              answer: "Yes! You can adjust the beats per measure to practice in 4/4, 3/4, 6/8, and more. Our visual indicator provides a distinct accent on the 'one' to help you keep track of the bar."
            }
          ]}
        />
      </main>
    </div>
  );
};

export default MetronomePage;
