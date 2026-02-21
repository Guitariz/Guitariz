
import ScaleExplorer from "@/components/ScaleExplorer";
import { Disc, Music, Bot, Layers } from "lucide-react";
import { usePageMetadata } from "@/hooks/usePageMetadata";
import { SEOContent, Breadcrumb } from "@/components/SEOContent";

const ScalesPage = () => {
  usePageMetadata({
    title: "Guitar Scale Explorer - Interactive Scale Patterns & Modes | Guitariz",
    description: "Explore guitar scales and modes visually. Interactive patterns for major, minor, pentatonic, and exotic scales. Master improvisation and soloing.",
    keywords: "guitar scales, music modes, scale explorer, pentatonic scale, blues scale, major scale, minor scale, modal relationships",
    canonicalUrl: "https://guitariz.studio/scales",
    ogImage: "https://guitariz.studio/logo2.png",
    ogType: "website",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Guitariz Scale Explorer",
      "applicationCategory": "MusicApplication",
      "operatingSystem": "Web",
      "description": "Mathematical approach to musical scales and modal synthesis.",
      "url": "https://guitariz.studio/scales",
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "bestRating": "5",
        "worstRating": "1",
        "reviewCount": "192"
      }
    }
  });

  return (
    <div className="min-h-screen bg-[#030303] relative overflow-hidden selection:bg-white/10">



      <main className="container mx-auto px-4 md:px-6 pt-2 md:pt-4 pb-12 relative z-10">
        {/* Breadcrumb */}
        <Breadcrumb items={[
          { name: "Home", url: "https://guitariz.studio/" },
          { name: "Scale Explorer", url: "https://guitariz.studio/scales" }
        ]} />

        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
          <div className="space-y-4">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-medium tracking-wider uppercase">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span>Modal Synthesis</span>
            </div>

            <header className="space-y-1">
              <h1 className="text-2xl md:text-3xl font-light tracking-tighter text-white font-display">
                Scale <span className="text-muted-foreground font-thin italic">Explorer</span>
              </h1>
              <p className="text-sm text-muted-foreground max-w-xl leading-relaxed font-light">
                A mathematical approach to melody. Visualize intervals across the circle of fifths or map them <span className="text-white/80">directly to the fretboard</span>.
              </p>
            </header>
          </div>
        </div>

        <div className="relative z-10">
          <ScaleExplorer />
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 group hover:bg-white/[0.04] transition-all">
            <Disc className="w-5 h-5 text-muted-foreground mb-3 group-hover:text-primary transition-colors" />
            <h3 className="text-white font-medium mb-1">Circle Of Fifths</h3>
            <p className="text-xs text-muted-foreground">Understand key relationships and secondary dominants visually.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 group hover:bg-white/[0.04] transition-all">
            <Music className="w-5 h-5 text-muted-foreground mb-3 group-hover:text-secondary transition-colors" />
            <h3 className="text-white font-medium mb-1">Intervalic Logic</h3>
            <p className="text-xs text-muted-foreground">Hear the unique tension and resolution of every mode.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 group hover:bg-white/[0.04] transition-all">
            <Layers className="w-5 h-5 text-muted-foreground mb-3 group-hover:text-accent transition-colors" />
            <h3 className="text-white font-medium mb-1">Global Modes</h3>
            <p className="text-xs text-muted-foreground">From Western Major to Eastern Ragas and beyond.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 group hover:bg-white/[0.04] transition-all">
            <Bot className="w-5 h-5 text-muted-foreground mb-3 group-hover:text-white transition-colors" />
            <h3 className="text-white font-medium mb-1">Fretboard Sync</h3>
            <p className="text-xs text-muted-foreground">Map any selected scale directly to the guitar neck.</p>
          </div>
        </div>

        {/* SEO FAQ Section */}
        <SEOContent
          pageName="scales"
          faqs={[
            {
              question: "What is the Scale Explorer and how can it improve my playing?",
              answer: "The Scale Explorer is an interactive visualization tool that maps over 100 musical scales and modes onto a virtual guitar fretboard. By seeing the patterns of major, minor, pentatonic, and exotic scales, you can improve your fretboard knowledge, speed up your learning of solos, and master improvisation in any key."
            },
            {
              question: "How do I see patterns on the guitar neck?",
              answer: "Simply select a scale and a root key from the menu. The notes will instantly populate onto the interactive fretboard. You can customize the view to show intervals (like 1, b3, 5) or note names (C, Eb, G) to help you understand the scale's internal logic."
            },
            {
              question: "Can I use the Scale Explorer for piano or other instruments?",
              answer: "Yes! While it features a guitar-centric fretboard, the tool also visualizes scale degrees and modal relationships that apply to all melodic instruments. It's a powerful reference for composers and keyboardists as well."
            },
            {
              question: "What are 'Modal Synthesis' and 'Functional Harmony'?",
              answer: "Modal Synthesis refers to the relationship between parent scales (like Major) and their modes (Dorian, Phrygian, etc.). Functional Harmony is the study of how chords and scales interact within a key. Our tool allows you to map these complex relationships directly onto the Circle of Fifths."
            }
          ]}
        />
      </main>
    </div>
  );
};

export default ScalesPage;
