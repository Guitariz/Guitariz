import { Link } from "react-router-dom";
import CircleOfFifths from "@/components/CircleOfFifths";
import { Disc, Layers, BookOpen, Sparkles, ArrowRight } from "lucide-react";
import { SEOContent, Breadcrumb } from "@/components/SEOContent";
import RelatedTools from "@/components/RelatedTools";

import { usePageMetadata } from "@/hooks/usePageMetadata";

const TheoryPage = () => {
  usePageMetadata({
    title: "Interactive Circle of Fifths - Guided Music Theory Lab | Guitariz",
    description: "Master functional harmony with our interactive Circle of Fifths onboarding experience. Learn key signatures, modulations, and diatonic chord families.",
    keywords: "circle of fifths, music theory, guided learning, functional harmony, key modulation, chord families, music theory lab",
    canonicalUrl: "https://guitariz.studio/theory",
    ogImage: "https://guitariz.studio/logo2.png",
    ogType: "website",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Guitariz Theory Lab",
      "applicationCategory": "MusicApplication",
      "operatingSystem": "Web",
      "description": "Interactive music theory tools featuring the Circle of Fifths guided learning experience.",
      "url": "https://guitariz.studio/theory",
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
    }
  });

  return (
    <div className="min-h-screen bg-background relative overflow-hidden selection:bg-primary/20">
      <main className="container mx-auto px-4 md:px-6 pt-8 md:pt-12 pb-16 relative z-10 space-y-8">
        {/* Header Title Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-4">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold tracking-wider uppercase backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span>Guided Harmonic Lab</span>
            </div>

            <header className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-light tracking-tighter text-foreground font-display">
                Circle of <span className="text-muted-foreground font-thin italic">Fifths</span>
              </h1>
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed font-light">
                Learn functional harmony naturally. An interactive, guided onboarding experience for songwriters and musicians.
              </p>
            </header>
          </div>
        </div>

        {/* Interactive Breadcrumbs */}
        <Breadcrumb items={[
          { name: "Home", url: "https://guitariz.studio/" },
          { name: "Theory Lab", url: "https://guitariz.studio/theory" },
          { name: "Circle of Fifths", url: "https://guitariz.studio/theory" }
        ]} />

        {/* Main Application Container */}
        <div className="glass-card rounded-[2.5rem] border border-white/10 bg-card/90 shadow-2xl overflow-hidden p-4 sm:p-6 md:p-10 backdrop-blur-xl">
          <CircleOfFifths />
        </div>

        {/* Feature Cards below lab */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-6 rounded-3xl bg-card/30 border border-white/5 group hover:bg-card/50 transition-all">
            <Layers className="w-6 h-6 text-primary mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="text-foreground font-semibold text-sm mb-1">Key Modulation</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Visualize smooth key transitions using neighboring keys and pivot chords.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-card/30 border border-white/5 group hover:bg-card/50 transition-all">
            <Disc className="w-6 h-6 text-emerald-400 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="text-foreground font-semibold text-sm mb-1">Functional Harmony</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Understand Tonic, Subdominant, and Dominant relationships instantly.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-card/30 border border-white/5 group hover:bg-card/50 transition-all">
            <BookOpen className="w-6 h-6 text-amber-400 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="text-foreground font-semibold text-sm mb-1">Interactive Lessons</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Follow gamified step-by-step mini-lessons to master music theory concepts without reading dense textbooks.
            </p>
          </div>
        </div>

        {/* SEO Content Section */}
        <SEOContent
          pageName="theory"
          faqs={[
            {
              question: "What is the Circle of Fifths used for?",
              answer: "The Circle of Fifths is a fundamental visual tool in music theory used to understand key signatures, chord relationships, scale degrees, and modulations."
            },
            {
              question: "How do I use this interactive Circle of Fifths guided lab?",
              answer: "Use Learn Mode to follow step-by-step interactive lessons with coach marks, or switch to Explore Mode to inspect diatonic chords, modes, and audio scales."
            },
            {
              question: "What is a relative minor key?",
              answer: "A relative minor key shares the exact same key signature as its relative major key (located 3 semitones down, e.g. C Major and A Minor)."
            },
            {
              question: "How do I play scales and chords on this page?",
              answer: "Click the 'Play Scale' button or click individual note pills and chords to synthesize clean audio tones."
            }
          ]}
        />
        {/* Educational Guide Callout */}
        <div className="mt-16 p-6 sm:p-8 rounded-[2rem] border border-border bg-card/60 backdrop-blur-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-primary" />
                <span>Music Theory Guide</span>
              </h4>
              <h3 className="text-xl font-light text-white tracking-tight">
                Want a complete breakdown of the Circle of Fifths?
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed font-light max-w-2xl">
                Master key signatures, accidental formulas, relative minors, and harmonic songwriting with our in-depth Circle of Fifths tutorial.
              </p>
            </div>
            <Link 
              to="/blog/circle-of-fifths-explained" 
              className="inline-flex items-center gap-1.5 text-xs text-white bg-primary/20 hover:bg-primary/30 border border-primary/30 transition-all font-medium py-3 px-6 rounded-2xl shrink-0"
            >
              Read Theory Guide <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <RelatedTools currentPath="/theory" />
      </main>
    </div>
  );
};

export default TheoryPage;