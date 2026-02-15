import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music, Activity, Grid3X3, Trophy, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { IntervalGame } from "@/components/ear-training/IntervalGame";
import { usePageMetadata } from "@/hooks/usePageMetadata";
import { SEOContent, Breadcrumb } from "@/components/SEOContent";

// --- Types ---
type GameMode = "INTERVALS" | "CHORDS" | "FRETBOARD" | "PERFECT_PITCH" | null;

// --- Game Card Component ---
const GameCard = ({
    title,
    description,
    icon: Icon,
    color,
    onClick
}: {
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    onClick: () => void;
}) => (
    <motion.div
        whileHover={{ scale: 1.02, y: -5 }}
        whileTap={{ scale: 0.98 }}
        className="group relative cursor-pointer"
        onClick={onClick}
    >
        <div className={cn(
            "absolute inset-0 rounded-[2.5rem] bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl",
            color
        )} />
        <div className="relative h-full bg-[#0A0A0A] border border-white/5 rounded-[2.5rem] p-8 overflow-hidden hover:border-white/10 transition-colors">
            <div className={cn("inline-flex p-4 rounded-2xl mb-6 bg-white/5", color.replace("bg-", "text-").replace("from-", "text-").split(" ")[0])}>
                <Icon className="w-8 h-8" />
            </div>
            <h3 className="text-3xl font-bold text-white mb-3 tracking-tight">{title}</h3>
            <p className="text-muted-foreground leading-relaxed">{description}</p>

            <div className="mt-8 flex items-center text-sm font-bold uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">
                <span>Play Now</span>
                <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
        </div>
    </motion.div>
);

// --- Page Component ---

const EarTrainingPage = () => {
    const [activeGame, setActiveGame] = useState<GameMode>(null);

    usePageMetadata({
        title: "Interactive Ear Training Arcade - Relative & Perfect Pitch | Guitariz",
        description: "Elevate your musicality with our interactive ear training games. Master intervals, chord recognition, and perfect pitch through gamified challenges.",
        keywords: "ear training, musical intervals, pitch recognition, perfect pitch, relative pitch, music theory games, guitar ear training",
        canonicalUrl: "https://guitariz.studio/ear-training",
        ogImage: "https://guitariz.studio/logo.png",
        ogType: "website",
        jsonLd: {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Guitariz Ear Training Arcade",
            "applicationCategory": "EducationalApplication",
            "operatingSystem": "Web",
            "description": "Gamified ear training for musicians of all levels.",
            "url": "https://guitariz.studio/ear-training"
        }
    });

    const handleExitGame = () => {
        setActiveGame(null);
    };

    return (
        <div className="min-h-screen bg-[#030303] relative overflow-hidden selection:bg-emerald-500/30">


            <main className="container mx-auto px-4 md:px-6 pt-8 md:pt-12 pb-16 relative z-10">
                {/* Breadcrumb */}
                {activeGame === null && (
                    <Breadcrumb items={[
                        { name: "Home", url: "https://guitariz.studio/" },
                        { name: "Ear Training", url: "https://guitariz.studio/ear-training" }
                    ]} />
                )}

                {/* Header / Arcade Banner - Only show on Hub */}
                <AnimatePresence>
                    {activeGame === null && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="mb-16 flex flex-col items-center text-center"
                        >
                            <motion.div
                                initial={{ y: -20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-[#111] mb-6"
                            >
                                <Trophy className="w-3.5 h-3.5 text-yellow-500" />
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">Ear Training Arcade</span>
                            </motion.div>

                            <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter mb-6">
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/50">Level Up</span> <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Your Ears</span>
                            </h1>

                            <p className="text-xl text-neutral-400 max-w-2xl font-light leading-relaxed">
                                Master the language of music through gamified challenges. Train daily to unlock your true potential.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Game Hub Navigation Toggle - Only show on Hub */}
                {activeGame === null && (
                    <div className="sticky top-6 z-40 flex justify-center mb-12">
                        <motion.div
                            layout
                            className="bg-[#111] border border-white/10 p-1.5 rounded-full shadow-2xl flex items-center gap-1"
                        >
                            {[
                                { id: null, label: "Hub", icon: Grid3X3 },
                                { id: "INTERVALS", label: "Intervals", icon: Activity },
                                { id: "CHORDS", label: "Chord ID", icon: Music },
                            ].map((tab) => {
                                const isActive = activeGame === tab.id;

                                return (
                                    <button
                                        key={tab.label}
                                        onClick={() => setActiveGame(tab.id as GameMode)}
                                        className={cn(
                                            "relative px-6 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 transition-all",
                                            isActive ? "text-black" : "text-white/60 hover:text-white"
                                        )}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="nav-pill-game"
                                                className="absolute inset-0 bg-white rounded-full shadow-lg"
                                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                            />
                                        )}
                                        <tab.icon className={cn("w-4 h-4 relative z-10", isActive && "text-black")} />
                                        <span className="relative z-10">{tab.label}</span>
                                    </button>
                                );
                            })}
                        </motion.div>
                    </div>
                )}

                {/* Main Content Area */}
                <AnimatePresence mode="wait">
                    {activeGame === null && (
                        <motion.div
                            key="hub"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto"
                        >
                            <GameCard
                                title="Interval Master"
                                description="Develop relative pitch by identifying the distance between two notes. From Minor 2nds to Octaves."
                                icon={Activity}
                                color="bg-gradient-to-br from-emerald-500/20 to-teal-500/20"
                                onClick={() => setActiveGame("INTERVALS")}
                            />
                            <GameCard
                                title="Chord Crusher"
                                description="Can you tell a Major triad from a Minor 7th? Train your harmonic hearing in this rapid-fire challenge."
                                icon={Music}
                                color="bg-gradient-to-br from-purple-500/20 to-pink-500/20"
                                onClick={() => setActiveGame("CHORDS")}
                            />
                            <GameCard
                                title="Fretboard Hunter"
                                description="Race against the clock to locate notes on the virtual fretboard. Essential for guitar mastery."
                                icon={Grid3X3}
                                color="bg-gradient-to-br from-blue-500/20 to-indigo-500/20"
                                onClick={() => setActiveGame("FRETBOARD")}
                            />
                            <GameCard
                                title="Perfect Pitch"
                                description="The ultimate challenge. Identify notes without any reference tone. For the brave."
                                icon={Trophy}
                                color="bg-gradient-to-br from-orange-500/20 to-red-500/20"
                                onClick={() => setActiveGame("PERFECT_PITCH")}
                            />
                        </motion.div>
                    )}

                    {activeGame === "INTERVALS" && (
                        <IntervalGame key="game-intervals" onExit={handleExitGame} />
                    )}

                    {/* Placeholders for other games */}
                    {activeGame === "CHORDS" && (
                        <motion.div key="game-chords" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-20">
                            <h2 className="text-3xl text-white">Chord Crusher Coming Soon</h2>
                            <Button className="mt-4" onClick={handleExitGame}>Back to Hub</Button>
                        </motion.div>
                    )}

                    {activeGame === "FRETBOARD" && (
                        <motion.div key="game-fretboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-20">
                            <h2 className="text-3xl text-white">Fretboard Hunter Coming Soon</h2>
                            <Button className="mt-4" onClick={handleExitGame}>Back to Hub</Button>
                        </motion.div>
                    )}

                    {activeGame === "PERFECT_PITCH" && (
                        <motion.div key="game-pitch" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-20">
                            <h2 className="text-3xl text-white">Perfect Pitch Training Coming Soon</h2>
                            <Button className="mt-4" onClick={handleExitGame}>Back to Hub</Button>
                        </motion.div>
                    )}
                </AnimatePresence>


                {/* SEO FAQ Section */}
                {activeGame === null && (
                    <SEOContent
                        pageName="ear-training"
                        faqs={[
                            {
                                question: "What is ear training and why is it important for musicians?",
                                answer: "Ear training is the process of connecting music theory (intervals, chords, scales) with actual sounds. It allows musicians to 'hear' what they see on a page and 'translate' what they hear in their head into their instrument. It's the key to improvisation, transcribing songs by ear, and better communication within a band."
                            },
                            {
                                question: "How does the Ear Training Arcade help me learn?",
                                answer: "Our Arcade uses gamification to make practice engaging. By playing 'Interval Master' or 'Chord Crusher', you get instant feedback on your progress. Studies show that short, daily sessions of 10-15 minutes are much more effective than long, infrequent ones."
                            },
                            {
                                question: "What is the difference between relative pitch and perfect pitch?",
                                answer: "Relative pitch is the ability to identify a note relative to a known reference (like an interval). Perfect pitch (absolute pitch) is the ability to identify a note without any reference. Most successful musicians rely heavily on relative pitch, which is highly trainable."
                            },
                            {
                                question: "Is this tool suitable for singing practice?",
                                answer: "Yes! Training your ear to recognize intervals and chords directly improves your intonation and ability to harmonize when singing. It's a foundational skill for vocalists and instrumentalists alike."
                            }
                        ]}
                    />
                )}
            </main>
        </div>
    );
};

export default EarTrainingPage;
