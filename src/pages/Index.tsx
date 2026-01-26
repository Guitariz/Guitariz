import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, Music2, Layers, Disc, Music, BookOpen, Bot, Wand2 } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect } from "react";
import Footer from "@/components/Footer";


const toolCards = [
  { title: "Fretboard", desc: "Interactive neck with adaptive note labeling.", icon: Music2, to: "/fretboard" },
  { title: "Chord Library", desc: "1,000+ voicings with interactive diagrams.", icon: Layers, to: "/chords" },
  { title: "Scale Explorer", desc: "Visualize modes and exotic scales instantly.", icon: Disc, to: "/scales" },
  { title: "Metronome", desc: "High-precision timing with visual pulse.", icon: Music, to: "/metronome" },
  { title: "Vocal Splitter", desc: "AI-powered vocal and instrumental separation.", icon: Wand2, to: "/vocal-splitter" },
  { title: "Chord AI", desc: "Neural audio chord detection and harmonic transcription.", icon: Bot, to: "/chord-ai" },
  { title: "Theory Wheel", desc: "Interactive Circle of Fifths and key logic.", icon: BookOpen, to: "/theory" },
];

const Index = () => {
  useEffect(() => {
    document.title = "Chord AI Free & Music Theory Studio | Guitariz";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", "The best Chord AI Free: Extract chords, tempo, and scales from any song. Guitariz is your high-fidelity technical suite for the modern guitarist.");
    }
  }, []);

  return (
    <div className="min-h-screen relative bg-transparent overflow-x-hidden selection:bg-white/10">

      <Navigation />

      <main className="pt-32 pb-24 relative z-10">
        <section className="px-6">
          <div className="container mx-auto max-w-5xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-10 text-center py-20"
            >
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-white/5 bg-white/[0.02] text-muted-foreground text-[10px] font-bold tracking-[0.3em] uppercase">
                <span>Modern Music Laboratory</span>
              </div>

              <div className="space-y-6">
                <h1 className="text-7xl md:text-9xl font-light tracking-tighter text-white font-display">
                  Design <span className="text-muted-foreground font-thin italic">Sound.</span>
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-light">
                  A high-fidelity technical suite for the modern guitarist. Neural audio analysis meets <span className="text-white/80">architectural music theory</span>.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-10">
                <Button size="lg" className="h-16 px-10 rounded-2xl bg-white text-black hover:bg-white/90 text-lg font-semibold group" asChild>
                  <Link to="/fretboard">
                    Get Started
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="h-16 px-10 rounded-2xl border-white/10 bg-white/[0.02] text-white hover:bg-white/[0.05] text-lg font-medium" asChild>
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
                    staggerChildren: 0.15,
                    delayChildren: 0.4
                  }
                }
              }}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-20"
            >
              {toolCards.map((tool) => (
                <motion.div
                  key={tool.title}
                  variants={{
                    hidden: { opacity: 0, y: 30 },
                    show: {
                      opacity: 1,
                      y: 0,
                      transition: {
                        type: "spring",
                        stiffness: 50,
                        damping: 15
                      }
                    }
                  }}
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    e.currentTarget.style.setProperty("--x", `${e.clientX - rect.left}px`);
                    e.currentTarget.style.setProperty("--y", `${e.clientY - rect.top}px`);
                  }}
                  className="spotlight-card group"
                >
                  <Link
                    to={tool.to}
                    className="block p-8 rounded-[2rem] glass-card transition-all duration-500 relative"
                  >
                    <div className="spotlight-glow" />
                    <div className="relative z-10 space-y-4">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:bg-white/10 group-hover:border-white/20 transition-all duration-500">
                        <tool.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-medium text-white font-display">{tool.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {tool.desc}
                        </p>
                      </div>
                    </div>
                    <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-10 transition-opacity">
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

