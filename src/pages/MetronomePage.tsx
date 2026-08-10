import Metronome from "@/components/Metronome";
import { Timer, Zap } from "lucide-react";
import { usePageMetadata } from "@/hooks/usePageMetadata";
import { SEOContent, Breadcrumb } from "@/components/SEOContent";
import RelatedTools from "@/components/RelatedTools";

const MetronomePage = () => {
  usePageMetadata({
    title: "Free Precision Metronome | Guitariz - Pro Rhythm Tools",
    description: "Professional grade metronome with sample-accurate playback. Pro rhythm tools for free: poly-meters, tap-tempo, and visual pulse feedback.",
    canonicalUrl: "https://guitariz.studio/metronome",
    ogImage: "https://guitariz.studio/logo2.png",
    ogType: "website",
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
    <div className="min-h-screen bg-background relative overflow-hidden selection:bg-white/10">
      <main className="container mx-auto px-4 md:px-6 pt-8 md:pt-12 pb-16 relative z-10">
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
              <h1 className="text-4xl md:text-5xl font-light tracking-tighter text-foreground font-display">
                Pulse <span className="text-muted-foreground font-thin italic">Engine</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed font-light">
                Master your timing with <span className="text-foreground/80">sample-accurate</span> playback. Support for complex poly-meters and tap-tempo.
              </p>
            </header>
          </div>
        </div>

        <div className="glass-card rounded-[2rem] border border-border bg-card/90 shadow-2xl overflow-hidden p-8 flex items-center justify-center min-h-[400px]">
          <Metronome />
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-6 rounded-2xl bg-card/30 border border-border group hover:bg-card/50 transition-all">
            <Timer className="w-5 h-5 text-muted-foreground mb-3 group-hover:text-primary transition-colors" />
            <h3 className="text-foreground font-medium mb-1">Visual Cues</h3>
            <p className="text-xs text-muted-foreground">High-contrast flash helps maintain time in loud environments.</p>
          </div>
          <div className="p-6 rounded-2xl bg-card/30 border border-border group hover:bg-card/50 transition-all">
            <Zap className="w-5 h-5 text-muted-foreground mb-3 group-hover:text-secondary transition-colors" />
            <h3 className="text-foreground font-medium mb-1">Low Latency</h3>
            <p className="text-xs text-muted-foreground">Built on Web Audio API for professional-grade stability.</p>
          </div>
        </div>

        <SEOContent
          pageName="metronome"
          faqs={[
            {
              question: "Why is a metronome essential for music practice?",
              answer: "A metronome provides a perfectly steady, unwavering beat reference that your internal sense of time (your 'inner clock') can calibrate against. Research in music education consistently shows that musicians who practice with a metronome develop significantly more even rhythmic precision than those who practice free-time. Even 15 minutes of daily metronome practice accelerates the development of rhythmic consistency. Importantly, practice with a metronome at a slow tempo where you play every note perfectly — then gradually increase the tempo by 4-5 BPM — is far more effective than practicing at full speed with errors."
            },
            {
              question: "What does 'sample-accurate' metronome mean?",
              answer: "A 'sample-accurate' metronome uses the Web Audio API's built-in clock scheduling system to queue clicks at the exact audio sample level — typically at 44,100 or 48,000 samples per second. This is different from using JavaScript's standard setTimeout() or setInterval() functions, which can drift by tens of milliseconds due to the browser's JavaScript event loop. Millisecond-level drift is noticeable to trained musicians and can cause confusion during practice. The Guitariz Metronome's sample-accurate scheduling ensures clicks land at precisely the correct moment, regardless of other browser or system activity."
            },
            {
              question: "How do I use the Tap Tempo feature?",
              answer: "Click the 'TAP' button (or press your spacebar) repeatedly in time with the beat of any song you are listening to. The metronome calculates the average interval between your taps and converts it to BPM (Beats Per Minute). After 3-4 taps, the tempo reading stabilizes. Tap Tempo is ideal for learning the BPM of a song before practicing along to it, or for quickly setting a tempo that feels comfortable for a new song you are working on."
            },
            {
              question: "What time signatures does this metronome support?",
              answer: "The Guitariz Metronome supports all standard time signatures. You can adjust the beats per measure to practice in: 4/4 (the most common, four beats per bar), 3/4 (waltz time, three beats per bar), 6/8 (compound duple, commonly used in Celtic and folk music), 5/4 (complex meter, used in progressive rock and jazz), 7/8 (Balkan and Middle Eastern rhythmic patterns), and more. The first beat of each measure is accented with a different click sound to help you feel the downbeat."
            },
            {
              question: "What BPM ranges are common for different music genres?",
              answer: "BPM (Beats Per Minute) varies widely across genres: Ballads and slow songs: 60-80 BPM. Pop and R&B: 90-110 BPM. Rock and pop: 110-140 BPM. Dance and EDM: 120-135 BPM. Drum and bass: 160-180 BPM. Bluegrass and fast country: 140-180 BPM. Technical metal: 180-220 BPM. Classical tempo markings: Largo = ~50 BPM, Adagio = ~70 BPM, Andante = ~80 BPM, Moderato = ~96 BPM, Allegro = ~130 BPM, Presto = ~180 BPM."
            },
            {
              question: "How do I practice with a metronome effectively?",
              answer: "The most effective metronome practice method is to start at a tempo where you can play your chosen piece perfectly with zero errors (often 40-60% of target speed). Play it correctly 3-5 times in a row. Then increase the tempo by 4 BPM and repeat. If you make an error, drop back down 4-8 BPM and rebuild accuracy before increasing again. This gradual increment method trains muscle memory cleanly and produces faster long-term results than immediately attempting target speed."
            }
          ]}
        />
        <RelatedTools currentPath="/metronome" />
      </main>
    </div>
  );
};

export default MetronomePage;