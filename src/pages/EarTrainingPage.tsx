import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music, Activity, Grid3X3, Trophy, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { IntervalGame } from "@/components/ear-training/IntervalGame";
import { usePageMetadata } from "@/hooks/usePageMetadata";
import { SEOContent, Breadcrumb } from "@/components/SEOContent";
import RelatedTools from "@/components/RelatedTools";

type GameMode = "INTERVALS" | "CHORDS" | "FRETBOARD" | "PERFECT_PITCH" | null;

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
        <div className="relative h-full bg-card border border-border rounded-[2.5rem] p-8 overflow-hidden hover:border-border/80 transition-colors">
            <div className={cn("inline-flex p-4 rounded-2xl mb-6 bg-card/50", color.replace("bg-", "text-").replace("from-", "text-").split(" ")[0])}>
                <Icon className="w-8 h-8" />
            </div>
            <h3 className="text-3xl font-bold text-foreground mb-3 tracking-tight">{title}</h3>
            <p className="text-muted-foreground leading-relaxed">{description}</p>

            <div className="mt-8 flex items-center text-sm font-bold uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">
                <span>Play Now</span>
                <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
        </div>
    </motion.div>
);

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
        <div className="min-h-screen bg-background relative overflow-hidden selection:bg-emerald-500/30">
            <main className="container mx-auto px-4 md:px-6 pt-8 md:pt-12 pb-16 relative z-10">
                {activeGame === null && (
                    <Breadcrumb items={[
                        { name: "Home", url: "https://guitariz.studio/" },
                        { name: "Ear Training", url: "https://guitariz.studio/ear-training" }
                    ]} />
                )}

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
                                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-card/50 mb-6"
                            >
                                <Trophy className="w-3.5 h-3.5 text-yellow-500" />
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/80">Ear Training Arcade</span>
                            </motion.div>

                            <h1 className="text-5xl md:text-8xl font-black text-foreground tracking-tighter mb-6">
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-foreground via-foreground to-foreground/50">Level Up</span> <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Your Ears</span>
                            </h1>

                            <p className="text-xl text-muted-foreground max-w-2xl font-light leading-relaxed">
                                Master the language of music through gamified challenges. Train daily to unlock your true potential.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {activeGame === null && (
                    <div className="sticky top-6 z-40 flex justify-center mb-12">
                        <motion.div
                            layout
                            className="bg-card border border-border p-1.5 rounded-full shadow-2xl flex items-center gap-1"
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
                                            isActive ? "text-black" : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="nav-pill-game"
                                                className="absolute inset-0 bg-foreground rounded-full shadow-lg"
                                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                            />
                                        )}
                                        <tab.icon className={cn("w-4 h-4 relative z-10", isActive && "text-background")} />
                                        <span className="relative z-10">{tab.label}</span>
                                    </button>
                                );
                            })}
                        </motion.div>
                    </div>
                )}

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

                    {activeGame === "CHORDS" && (
                        <motion.div key="game-chords" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-20">
                            <h2 className="text-3xl text-foreground">Chord Crusher Coming Soon</h2>
                            <Button className="mt-4" onClick={handleExitGame}>Back to Hub</Button>
                        </motion.div>
                    )}

                    {activeGame === "FRETBOARD" && (
                        <motion.div key="game-fretboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-20">
                            <h2 className="text-3xl text-foreground">Fretboard Hunter Coming Soon</h2>
                            <Button className="mt-4" onClick={handleExitGame}>Back to Hub</Button>
                        </motion.div>
                    )}

                    {activeGame === "PERFECT_PITCH" && (
                        <motion.div key="game-pitch" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-20">
                            <h2 className="text-3xl text-foreground">Perfect Pitch Training Coming Soon</h2>
                            <Button className="mt-4" onClick={handleExitGame}>Back to Hub</Button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {activeGame === null && (
                    <SEOContent
                        pageName="ear-training"
                        faqs={[
                            {
                                question: "What is ear training and why is it important for musicians?",
                                answer: "Ear training is the process of connecting music theory concepts with actual sounds — teaching yourself to recognize intervals, chords, rhythms, and scales purely by listening. It allows musicians to 'hear' what they see on a written page and 'translate' what they hear back into notes on their instrument. A guitarist with a trained ear can learn a song from a recording in minutes, improvise freely in any key, and catch errors in their own playing by ear rather than relying on visual feedback. Ear training is the bridge between theoretical knowledge and musical fluency."
                            },
                            {
                                question: "How does the Ear Training Arcade help me learn?",
                                answer: "The Ear Training Arcade uses gamification principles to make structured practice more engaging. Rather than passively studying theory, you actively listen and identify sounds under time pressure, which accelerates learning through active recall. The game tracks your performance and identifies your specific weaknesses (e.g., you might consistently confuse minor 6ths and major 6ths). Short, daily sessions of 10-15 minutes in the Arcade are significantly more effective than long, infrequent marathon sessions — consistency is the most important factor in ear training progress."
                            },
                            {
                                question: "What is the difference between relative pitch and perfect pitch?",
                                answer: "Relative pitch is the ability to identify a note, interval, or chord quality when you have a reference note to compare against. For example, hearing a note and knowing it is a major 6th above the root is relative pitch. Perfect pitch (also called absolute pitch) is the ability to identify a note with no reference at all — hearing a sound and instantly knowing 'that is an F#' without any comparison. Relative pitch can be developed through training at any age and is the skill that professional musicians cultivate. Perfect pitch is largely innate and extremely rare (found in less than 1 in 10,000 people). For 99% of musicians, developing excellent relative pitch is the realistic and practical goal."
                            },
                            {
                                question: "Is this tool suitable for singing practice and vocal training?",
                                answer: "Yes, ear training directly improves singing accuracy. Training your ear to recognize intervals and chord qualities develops two critical vocal skills: intonation (pitch accuracy) and harmony. When you can clearly hear the difference between a major and minor third, you can more reliably produce the correct pitches when singing harmonies. When you can accurately identify intervals, you can reproduce melodic jumps more reliably. Many professional vocal coaches recommend regular interval ear training as one of the most effective practices for improving pitch consistency in singers."
                            },
                            {
                                question: "What are musical intervals and how do I recognize them?",
                                answer: "A musical interval is the distance in pitch between two notes. There are 12 unique intervals within one octave, each with a distinct sound character. Famous songs are often used as mnemonic references: Minor 2nd = 'Jaws' theme (threatening, tense). Major 2nd = 'Happy Birthday' (first two notes). Minor 3rd = 'Smoke on the Water' riff. Major 3rd = 'When the Saints Go Marching In'. Perfect 4th = 'Here Comes the Bride'. Tritone = 'The Simpsons' theme. Perfect 5th = 'Star Wars' theme. Minor 6th = 'The Entertainer'. Major 6th = 'My Way' (Frank Sinatra). Minor 7th = 'Somewhere' (West Side Story). Major 7th = 'Take On Me' (A-ha). Octave = 'Somewhere Over the Rainbow'. Learning to associate intervals with familiar songs dramatically accelerates recognition speed."
                            },
                            {
                                question: "How long does it take to develop a good musical ear?",
                                answer: "Most musicians notice significant improvement in interval recognition within 4-8 weeks of consistent daily practice (15 minutes per day). Basic chord quality recognition (major vs. minor) typically develops within 2-4 weeks. More complex skills like recognizing 7th chord types (major 7th vs. dominant 7th vs. minor 7th) typically take 3-6 months. Full chord progression identification by ear — recognizing I-IV-V patterns and common pop progressions without reference — usually develops over 6-18 months of dedicated practice. The timeline varies significantly by previous musical experience."
                            }
                        ]}
                    />
                )}
                <RelatedTools currentPath="/ear-training" />
            </main>
        </div>
    );
};

export default EarTrainingPage;