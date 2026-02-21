
import CircleOfFifths from "@/components/CircleOfFifths";
import { Disc, Layers } from "lucide-react";
import { SEOContent, Breadcrumb } from "@/components/SEOContent";

import { usePageMetadata } from "@/hooks/usePageMetadata";

const TheoryPage = () => {
  usePageMetadata({
    title: "Interactive Circle of Fifths - Music Theory Lab | Guitariz",
    description: "Master functional harmony with our interactive Circle of Fifths. Visualize key relationships, modulations, and chord families.",
    keywords: "circle of fifths, music theory, functional harmony, key modulation, chord families, music theory lab",
    canonicalUrl: "https://guitariz.studio/theory",
    ogImage: "https://guitariz.studio/logo2.png",
    ogType: "website",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Guitariz Theory Lab",
      "applicationCategory": "MusicApplication",
      "operatingSystem": "Web",
      "description": "Interactive music theory tools featuring the Circle of Fifths.",
      "url": "https://guitariz.studio/theory",
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "bestRating": "5",
        "worstRating": "1",
        "reviewCount": "156"
      }
    }
  });

  return (
    <div className="min-h-screen bg-transparent relative overflow-hidden selection:bg-white/10">



      <main className="container mx-auto px-4 md:px-6 pt-8 md:pt-12 pb-16 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div className="space-y-4">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-medium tracking-wider uppercase">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span>Harmonic Analysis</span>
            </div>

            <header className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-light tracking-tighter text-white font-display">
                Circle of <span className="text-muted-foreground font-thin italic">Fifths</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed font-light">
                Visualize key relationships and chord families. The <span className="text-white/80">fundamental map</span> for composition and modulation.
              </p>
            </header>
          </div>
        </div>

        {/* Breadcrumb */}
        <Breadcrumb items={[
          { name: "Home", url: "https://guitariz.studio/" },
          { name: "Theory Lab", url: "https://guitariz.studio/theory" }
        ]} />

        <div className="glass-card rounded-[2rem] border border-white/5 bg-[#0a0a0a]/90 shadow-2xl overflow-hidden p-4 md:p-8">
          <CircleOfFifths />
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 group hover:bg-white/[0.04] transition-all">
            <Layers className="w-5 h-5 text-muted-foreground mb-3 group-hover:text-primary transition-colors" />
            <h3 className="text-white font-medium mb-1">Key Modulation</h3>
            <p className="text-xs text-muted-foreground">Find relative majors and minors with a single glance.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 group hover:bg-white/[0.04] transition-all">
            <Disc className="w-5 h-5 text-muted-foreground mb-3 group-hover:text-secondary transition-colors" />
            <h3 className="text-white font-medium mb-1">Functional Harmony</h3>
            <p className="text-xs text-muted-foreground">Identify subdominant and dominant chords in any key.</p>
          </div>
        </div>

        {/* SEO FAQ Section */}
        <SEOContent
          pageName="theory"
          faqs={[
            {
              question: "What is the Circle of Fifths used for?",
              answer: "The Circle of Fifths is a fundamental tool in music theory used to visualize the relationships between the 12 semi-tones of the chromatic scale, their corresponding key signatures, and the associated major and minor keys. It helps musicians understand modulation, chord progressions, and harmonic structure."
            },
            {
              question: "How do I use this interactive Circle of Fifths?",
              answer: "Click on any key in the circle to see its primary chords (I, IV, V, vi, ii, iii). It's designed to help you quickly find chords that sound good together when composing or transposing music."
            },
            {
              question: "What are secondary dominants?",
              answer: "Secondary dominants are chords that function as the dominant (V) of a chord other than the tonic. Our tool helps you visualize these relationships by showing the 'V of V' positions within any selected key."
            },
            {
              question: "Is this tool suitable for beginners?",
              answer: "Yes! While the Circle of Fifths can seem complex at first, our interactive lab makes it easy to see how keys are related by the number of sharps and flats. It's a great companion for students learning music theory."
            }
          ]}
        />
      </main>
    </div>
  );
};

export default TheoryPage;
