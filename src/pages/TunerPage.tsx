import { Tuner } from "@/components/Tuner";
import { SEOContent, Breadcrumb } from "@/components/SEOContent";
import RelatedTools from "@/components/RelatedTools";
import { GaugeCircle } from "lucide-react";
import { usePageMetadata } from "@/hooks/usePageMetadata";
import GearTip from "@/components/GearTip";

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

                    <div className="mt-6">
                        <GearTip
                            tip="Using a phone mic in a noisy room? For reliable tuning anywhere, we recommend a"
                            productName="Clip-on Chromatic Tuner"
                            amazonQuery="clip on guitar tuner chromatic"
                        />
                    </div>
                </div>

                <div className="mt-24 max-w-3xl mx-auto">
                    <SEOContent
                        pageName="tuner"
                        faqs={[
                            {
                                question: "How do I use this online guitar tuner?",
                                answer: "Click the 'Start Tuner' button and allow microphone access when prompted by your browser. Play a single open string on your guitar, bass, or ukulele. The tuner will automatically detect the nearest note name (E, A, D, G, B, E for standard guitar tuning) and display a needle or indicator showing whether you are sharp (too high), flat (too low), or in tune (centered). Tune the string using your tuning peg until the indicator is centered on the correct note. Repeat for each string."
                            },
                            {
                                question: "How accurate is this online chromatic tuner?",
                                answer: "The Guitariz Tuner uses an advanced autocorrelation pitch detection algorithm to measure pitch within approximately 1 cent (1/100th of a semitone) of accuracy — comparable to dedicated clip-on hardware tuners. For reference, the human ear typically cannot detect pitch differences below 5-10 cents, so this level of accuracy is more than sufficient for all practical tuning applications."
                            },
                            {
                                question: "Does this tuner work for bass guitar and ukulele?",
                                answer: "Yes. The chromatic pitch detection covers the full range of commonly played instruments. For bass guitar, it detects the low E string (E1, approximately 41Hz) through the G string (G2, approximately 98Hz). For ukulele, it covers the standard GCEA tuning. For standard 6-string guitar, it tunes E2-A2-D3-G3-B3-E4. You can also use it for violin, cello, mandolin, and any other acoustic instrument that your microphone can pick up."
                            },
                            {
                                question: "Why does the tuner ask for microphone access?",
                                answer: "The tuner needs to access your device's microphone to 'hear' your instrument and analyze the sound waves. All audio processing happens entirely in your browser using the Web Audio API — no audio is ever recorded, transmitted to a server, or stored. When you close the tuner or stop it, the microphone is released immediately. Your browser will always ask for explicit permission before allowing any web page to access your microphone."
                            },
                            {
                                question: "What is A4 = 440Hz and should I change it?",
                                answer: "A4 = 440Hz is the international standard concert pitch (ISO 16:1975). The note A above middle C vibrates at exactly 440 Hz. Most modern instruments and recordings use this standard. However, some ensembles use alternative tuning standards: A4 = 432Hz (sometimes preferred for acoustic reasons), A4 = 415Hz (Baroque music), or A4 = 442-443Hz (some European orchestras). The Guitariz tuner allows you to adjust the reference pitch to match any ensemble standard using the slider below the tuner display."
                            },
                            {
                                question: "What is standard guitar tuning (EADGBe)?",
                                answer: "Standard guitar tuning, from the thickest (lowest-pitched) string to the thinnest (highest-pitched), is: E2 - A2 - D3 - G3 - B3 - E4. The intervals between strings are all perfect fourths (5 semitones) except between the G3 and B3 strings, which is a major third (4 semitones). Common alternate tunings include Drop D (DADGBE), Open G (DGDGBD), Open E (EBEG#BE), and DADGAD (popular for fingerstyle and Celtic music)."
                            },
                            {
                                question: "How do I tune a guitar without a tuner?",
                                answer: "Without a dedicated tuner, the most common method is relative tuning using the 5th-fret method: First, tune the low E string to a reference (a piano, pitch pipe, or another correctly-tuned instrument). Then fret the low E at the 5th fret to produce the note A, and tune the open A string to match. Fret the A string at the 5th fret for D, and tune the open D string to match. Continue: D string 5th fret = G string, G string 4th fret (not 5th!) = B string, B string 5th fret = high E string. For the most accurate tuning, use the chromatic tuner above."
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