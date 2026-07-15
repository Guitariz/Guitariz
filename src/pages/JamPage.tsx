import ChordProgressionPlayer from "@/components/ChordProgressionPlayer";
import { usePageMetadata } from "@/hooks/usePageMetadata";
import { Breadcrumb, SEOContent } from "@/components/SEOContent";
import RelatedTools from "@/components/RelatedTools";
import { Disc } from "lucide-react";

const JamPage = () => {
    usePageMetadata({
        title: "Jam Studio - Chord Progression Player | Guitariz",
        description: "Practice soloing over looping chord progressions. Pick chords, set BPM, and improvise with scale suggestions. Free online backing track generator for guitar and piano.",
        canonicalUrl: "https://guitariz.studio/jam",
        ogImage: "https://guitariz.studio/logo.png",
        ogType: "website",
        jsonLd: {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Guitariz Jam Studio",
            applicationCategory: "MusicApplication",
            operatingSystem: "Web",
            description: "Free chord progression player and backing track generator for improvisation practice.",
            url: "https://guitariz.studio/jam",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        },
    });

    return (
        <div className="min-h-screen bg-background relative overflow-hidden selection:bg-white/10">
            <main className="container mx-auto px-4 md:px-6 pt-8 md:pt-12 pb-16 relative z-10">
                <Breadcrumb
                    items={[
                        { name: "Home", url: "https://guitariz.studio/" },
                        { name: "Jam Studio", url: "https://guitariz.studio/jam" },
                    ]}
                />

                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                    <div className="space-y-4">
                        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-medium tracking-wider uppercase">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                            </span>
                            <span>Practice Mode</span>
                        </div>

                        <header className="space-y-2">
                            <h1 className="text-4xl md:text-5xl font-light tracking-tighter text-foreground font-display">
                                Jam{" "}
                                <span className="text-muted-foreground font-thin italic">
                                    Studio
                                </span>
                            </h1>
                            <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed font-light">
                                Build a chord progression, hit play, and{" "}
                                <span className="text-foreground/80">solo over the loop</span>.
                                Scale hints show you what to play.
                            </p>
                        </header>
                    </div>
                </div>

                <div className="glass-card rounded-[2rem] border border-border bg-card/80 shadow-2xl overflow-visible p-4 md:p-8">
                    <ChordProgressionPlayer />
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-6 rounded-2xl bg-card/30 border border-border group hover:bg-card/50 transition-all">
                        <Disc className="w-5 h-5 text-muted-foreground mb-3 group-hover:text-primary transition-colors" />
                        <h3 className="text-foreground font-medium mb-1">Instant Backing</h3>
                        <p className="text-xs text-muted-foreground">Pick 4 chords and loop them at any tempo for practice.</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-card/30 border border-border group hover:bg-card/50 transition-all">
                        <Disc className="w-5 h-5 text-muted-foreground mb-3 group-hover:text-secondary transition-colors" />
                        <h3 className="text-foreground font-medium mb-1">8 Genre Presets</h3>
                        <p className="text-xs text-muted-foreground">Pop, Blues, Jazz, Rock, Lofi, Folk, and more — one click to load.</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-card/30 border border-border group hover:bg-card/50 transition-all">
                        <Disc className="w-5 h-5 text-muted-foreground mb-3 group-hover:text-accent transition-colors" />
                        <h3 className="text-foreground font-medium mb-1">Scale Hints</h3>
                        <p className="text-xs text-muted-foreground">Shows compatible scales so you always know what notes to play.</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-card/30 border border-border group hover:bg-card/50 transition-all">
                        <Disc className="w-5 h-5 text-muted-foreground mb-3 group-hover:text-foreground transition-colors" />
                        <h3 className="text-foreground font-medium mb-1">Piano & Pad</h3>
                        <p className="text-xs text-muted-foreground">Switch between warm piano and ambient pad sounds instantly.</p>
                    </div>
                </div>

                <SEOContent
                    pageName="jam"
                    faqs={[
                        {
                            question: "How do I use the Jam Studio?",
                            answer: "Click any chord slot to select a root note and chord quality, or click a preset progression to load one instantly. Set your BPM, then hit Play to start the looping backing track."
                        },
                        {
                            question: "Can I change the tempo while playing?",
                            answer: "Yes! Drag the BPM slider while the progression is playing and it will restart at the new tempo automatically."
                        },
                        {
                            question: "What are the scale hints?",
                            answer: "Scale hints analyze the chord roots in your progression and suggest scales that contain all those notes."
                        },
                    ]}
                />
                <RelatedTools currentPath="/jam" />
            </main>
        </div>
    );
};

export default JamPage;