import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Music2, Layers, Disc, Music, BookOpen, Bot, Wand2, Headphones, Guitar, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Footer from "@/components/Footer";
import { usePageMetadata } from "@/hooks/usePageMetadata";


const toolCards = [
  { title: "Fretboard", desc: "Interactive neck with adaptive note labeling.", icon: Music2, to: "/fretboard", color: "from-emerald-500/20 to-teal-500/20" },
  { title: "Chord Library", desc: "1,000+ voicings with interactive diagrams.", icon: Layers, to: "/chords", color: "from-blue-500/20 to-indigo-500/20" },
  { title: "Scale Explorer", desc: "Visualize modes and exotic scales instantly.", icon: Disc, to: "/scales", color: "from-purple-500/20 to-pink-500/20" },
  { title: "Metronome", desc: "High-precision timing with visual pulse.", icon: Music, to: "/metronome", color: "from-orange-500/20 to-red-500/20" },
  { title: "Vocal Splitter", desc: "AI-powered vocal and instrumental separation.", icon: Wand2, to: "/vocal-splitter", color: "from-cyan-500/20 to-blue-500/20" },
  { title: "Chord AI", desc: "Neural audio chord detection and harmonic transcription.", icon: Bot, to: "/chord-ai", color: "from-violet-500/20 to-purple-500/20" },
  { title: "Theory Wheel", desc: "Interactive Circle of Fifths and key logic.", icon: BookOpen, to: "/theory", color: "from-amber-500/20 to-orange-500/20" },
  { title: "Ear Training", desc: "Gamified interval recognition and pitch training.", icon: Trophy, to: "/ear-training", color: "from-yellow-500/20 to-amber-500/20" },
  { title: "Tuner", desc: "Real-time chromatic tuner with cent precision.", icon: Guitar, to: "/tuner", color: "from-rose-500/20 to-pink-500/20" },
];

const Index = () => {
  const containerRef = useRef<HTMLDivElement>(null);


  usePageMetadata({
    title: "Chord AI Free & Music Theory Studio | Guitariz",
    description: "The best Chord AI Free: Extract chords, tempo, and scales from any song. Guitariz is your high-fidelity technical suite for the modern guitarist.",
    canonicalUrl: "https://guitariz.studio",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Guitariz Studio",
      "description": "Professional music theory and AI analysis tools for musicians.",
      "applicationCategory": "MultimediaApplication",
      "operatingSystem": "Any"
    }
  });



  const titleContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06,
        delayChildren: 0.5,
      }
    }
  };

  const charVariants = {
    hidden: {
      opacity: 0,
      y: 40,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 20,
        stiffness: 100
      }
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen relative bg-[#050505] overflow-x-hidden selection:bg-white/10">

      {/* Aesthetic Background - Clean & Optimized */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[#030303]" />
        {/* Subtle Vignette for depth without overhead */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)]" />
      </div>

      <main className="pt-12 pb-24 relative z-10">
        <section className="px-6">
          <div className="container mx-auto max-w-5xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-10 text-center py-20"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-sm text-muted-foreground text-[10px] font-bold tracking-[0.3em] uppercase"
              >
                <Headphones className="w-3 h-3" />
                <span>Modern Music Laboratory</span>
              </motion.div>

              <div className="space-y-6">
                <motion.h1
                  variants={titleContainerVariants}
                  initial="hidden"
                  animate="visible"
                  className="text-7xl md:text-9xl font-light tracking-tighter text-white font-display flex flex-wrap justify-center gap-x-[0.2em] relative"
                  style={{ perspective: "1000px" }}
                >
                  <span className="flex">
                    {Array.from("Design").map((char, i) => (
                      <motion.span
                        key={i}
                        variants={charVariants}
                        className="inline-block"
                      >
                        {char}
                      </motion.span>
                    ))}
                  </span>
                  <motion.span
                    variants={charVariants}
                    className="inline-block text-transparent bg-clip-text bg-gradient-to-tr from-emerald-400 via-cyan-300 to-indigo-500 font-thin italic drop-shadow-[0_0_15px_rgba(34,211,238,0.3)] pr-8"
                    style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                  >
                    Sound.
                  </motion.span>
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.5, duration: 1, ease: "easeOut" }}
                  className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-light"
                >
                  A high-fidelity technical suite for the modern guitarist. Neural audio analysis meets <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">architectural music theory</span>.
                </motion.p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-10">
                <Button size="lg" className="h-16 px-10 rounded-2xl bg-white text-black hover:bg-white/90 text-lg font-semibold group transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,255,255,0.2)]" asChild>
                  <Link to="/fretboard">
                    Get Started
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="h-16 px-10 rounded-2xl border-white/10 bg-white/[0.02] text-white hover:bg-white/[0.05] hover:border-white/20 text-lg font-medium transition-all duration-300" asChild>
                  <Link to="/theory">View Theory</Link>
                </Button>
              </div>
            </motion.div>

            {/* Feature Grid */}
            <motion.div
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.08,
                    delayChildren: 0.3
                  }
                }
              }}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-20"
            >
              {toolCards.map((tool) => (
                <motion.div
                  key={tool.title}
                  variants={{
                    hidden: { opacity: 0, y: 40 },
                    show: {
                      opacity: 1,
                      y: 0,
                      transition: {
                        type: "spring",
                        stiffness: 60,
                        damping: 18
                      }
                    }
                  }}
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    e.currentTarget.style.setProperty("--x", `${e.clientX - rect.left}px`);
                    e.currentTarget.style.setProperty("--y", `${e.clientY - rect.top}px`);
                  }}
                  className="spotlight-card group"
                >
                  <Link
                    to={tool.to}
                    className="block p-7 rounded-[1.75rem] glass-card transition-all duration-500 relative overflow-hidden"
                  >
                    {/* Gradient hover effect */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${tool.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                    <div className="spotlight-glow" />
                    <div className="relative z-10 space-y-4">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:bg-white/10 group-hover:border-white/20 transition-all duration-500">
                        <tool.icon className="w-6 h-6 text-white group-hover:scale-110 transition-transform duration-300" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-medium text-white font-display">{tool.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {tool.desc}
                        </p>
                      </div>
                    </div>
                    <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-20 transition-opacity duration-300">
                      <ArrowRight className="w-10 h-10 text-white" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
