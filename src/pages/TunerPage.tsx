import { Tuner } from "@/components/Tuner";
import { SEOContent, Breadcrumb } from "@/components/SEOContent";
import RelatedTools from "@/components/RelatedTools";
import { GaugeCircle } from "lucide-react";
import { usePageMetadata } from "@/hooks/usePageMetadata";

const TunerPage = () => {
    usePageMetadata({
        title: "Online Guitar Tuner | Guitariz - Chromatic & Precision",
        description: "Free online chromatic tuner for guitar, bass, ukulele, and more. Precise real-time pitch detection using your microphone.",
        canonicalUrl: "https://guitariz.studio/tuner",
        ogImage: "https://guitariz.studio/logo2.png",
        ogType: "website",
        jsonLd: {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Guitariz Online Tuner",
            "applicationCategory": "MusicApplication",
            "operatingSystem": "Web",
            "description": "High-precision chromatic instrument tuner.",
            "url": "https://guitariz.studio/tuner",
            "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
        }
    });

    return (
        <div className="min-h-screen bg-background relative overflow-hidden selection:bg-white/10">
            <main className="container mx-auto px-4 md:px-6 pt-8 md:pt-12 pb-16 relative z-10">
                <div className="max-w-4xl mx-auto">
                    <Breadcrumb items={[
                        { name: "Home", url: "https://guitariz.studio/" },
                        { name: "Tuner", url: "https://guitariz.studio/tuner" }
                    ]} />

                    <div className="mb-12 text-center space-y-6">
                        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-border bg-card/50 text-emerald-400 text-[10px] font-bold tracking-[0.2em] uppercase shadow-[0_0_15px_rgba(52,211,153,0.1)]">
                            <GaugeCircle className="w-3 h-3" />
                            <span>Precision Chromatic Tuner</span>
                        </div>

                        <div className="space-y-4">
                            <h1 className="text-5xl md:text-7xl font-light tracking-tighter text-foreground">
                                Master Your <span className="text-emerald-400 font-normal">Pitch</span>
                            </h1>
                            <p className="text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed font-light">
                                Professional-grade chromatic tuner powered by advanced audio processing.
                                Works for Guitar, Bass, Ukulele, and Voice.
                            </p>
                        </div>
                    </div>

                    <Tuner />
                </div>

                <div className="mt-24 max-w-3xl mx-auto">
                    <SEOContent
                        pageName="tuner"
                        faqs={[
                            {
                                question: "How do I use this online tuner?",
                                answer: "Simply click the 'Start Tuner' button and allow microphone access when prompted. Play a string on your instrument, and the tuner will automatically detect the note and show you if you are sharp or flat."
                            },
                            {
                                question: "Is this tuner accurate?",
                                answer: "Yes, Guitariz Tuner uses advanced autocorrelation algorithms to detect pitch with high precision, often within 1 cent of accuracy."
                            },
                            {
                                question: "Does it work for bass guitar?",
                                answer: "Absolutely. The frequency detection range covers deep bass notes (E1 ~41Hz) up to high-pitched instruments."
                            },
                            {
                                question: "Why does it ask for microphone access?",
                                answer: "The tool needs to 'hear' your instrument to analyze the sound waves. The audio is processed entirely locally and never recorded or sent to any server."
                            },
                            {
                                question: "What is A4 = 440Hz?",
                                answer: "A4 = 440Hz is the international standard pitch reference. You can adjust this reference pitch using the slider below the tuner."
                            }
                        ]}
                    />
                </div>
                <RelatedTools currentPath="/tuner" />
            </main>
        </div>
    );
};

export default TunerPage;