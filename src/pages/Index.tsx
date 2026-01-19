import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles, Music2, Layers, Disc, Music, BookOpen, Bot } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const toolCards = [
  {
    title: "Fretboard",
    desc: "Interactive guitar neck with adaptive note labeling and tuning.",
    icon: Music2,
    to: "/fretboard",
    color: "from-orange-500/20 to-primary/20",
  },
  {
    title: "Chord Library",
    desc: "1,000+ voicings with interactive diagrams and audio.",
    icon: Layers,
    to: "/chords",
    color: "from-blue-500/20 to-accent/20",
  },
  {
    title: "Scale Explorer",
    desc: "Visualize modes, ragas, and exotic scales instantly.",
    icon: Disc,
    to: "/scales",
    color: "from-emerald-500/20 to-secondary/20",
  },
  {
    title: "Metronome",
    desc: "High-precision timing with visual pulse and sound.",
    icon: Music,
    to: "/metronome",
    color: "from-purple-500/20 to-primary/20",
  },
  {
    title: "Chord AI",
    desc: "Upload any audio to extract chords and key in seconds.",
    icon: Bot,
    to: "/chord-ai",
    color: "from-red-500/20 to-orange-500/20",
  },
  {
    title: "Circle of Fifths",
    desc: "Interactive wheel to master key relationships.",
    icon: BookOpen,
    to: "/theory",
    color: "from-cyan-500/20 to-blue-500/20",
  },
];

const fadeUp = (delay = 0) => ({
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut", delay } },
});

const pop = (delay = 0) => ({
  hidden: { opacity: 0, scale: 0.97, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.55, ease: "easeOut", delay } },
});

const fadeFlat = (delay = 0) => ({
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.55, ease: "easeOut", delay } },
});

const blurRise = (delay = 0) => ({
  hidden: { opacity: 0, y: 22, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.8, ease: "easeOut", delay },
  },
});

const tiltFade = (delay = 0) => ({
  hidden: { opacity: 0, y: 18, rotateX: 8, rotateY: -6, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    rotateY: 0,
    scale: 1,
    transition: { duration: 0.75, ease: "easeOut", delay },
  },
});

const staggered = (stagger = 0.1, delayChildren = 0) => ({
  visible: {
    transition: { staggerChildren: stagger, delayChildren },
  },
});

const Index = () => {
  return (
    <div className="min-h-screen relative bg-background overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(124,58,237,0.05),transparent_40%),radial-gradient(circle_at_70%_80%,rgba(249,115,22,0.03),transparent_40%)]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
      </div>

      <Navigation />

      <main className="pt-28 pb-20">
        <motion.section
          className="relative px-6 pt-16 md:pt-24"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          transition={{ staggerChildren: 0.08 }}
        >
          <motion.div
            className="container mx-auto grid lg:grid-cols-2 gap-12 items-center"
            variants={staggered(0.12, 0.04)}
          >
            <div className="space-y-6 relative">
              <motion.div
                className="inline-flex items-center gap-2 rounded-full bg-card/60 border border-border/60 px-3 py-2 text-xs text-muted-foreground"
                variants={blurRise(0.05)}
              >
                <Sparkles className="w-4 h-4" />
                <span>Playful. Focused. Fast.</span>
              </motion.div>
              <motion.div className="space-y-4" variants={tiltFade(0.12)}>
                <h1 className="text-6xl md:text-8xl leading-tight font-black tracking-tighter">
                  Master your <span className="text-gradient">Sound.</span>
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground/80 max-w-xl leading-relaxed font-medium">
                  The ultimate visual playground for guitarists and pianists. Explore chords, scales, and rhythm with zero friction.
                </p>
              </motion.div>
              <motion.div className="flex flex-wrap items-center gap-4" variants={tiltFade(0.18)}>
                <Button
                  size="lg"
                  className="gap-2 px-7 py-6 text-base font-semibold bg-gradient-to-r from-primary via-secondary to-accent text-background shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-transform"
                  asChild
                >
                  <Link to="/fretboard">
                    Open Fretboard
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 px-7 py-6 text-base font-semibold border-primary/50 text-foreground/90 hover:border-accent hover:bg-primary/10"
                  asChild
                >
                  <Link to="/scales">
                    Explore Scales
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
              </motion.div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4">
                {["Music-first flow", "Audio on tap", "Built for practice"].map((text, idx) => (
                  <motion.div
                    key={text}
                    className="p-3 rounded-xl bg-card/40 border border-white/5 backdrop-blur-sm text-sm text-muted-foreground transition-colors hover:border-primary/30"
                    variants={fadeFlat(0.2 + idx * 0.06)}
                  >
                    {text}
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.div className="relative lg:ml-6" variants={blurRise(0.14)}>
              <div className="absolute -left-10 -top-10 w-48 h-48 bg-gradient-to-br from-secondary/25 via-primary/20 to-accent/20 rounded-full blur-2xl opacity-70 float-soft" />
              <div className="absolute -right-6 bottom-4 w-36 h-36 bg-gradient-to-br from-primary/25 via-secondary/20 to-accent/20 rounded-full blur-2xl opacity-80 float-soft delay" />
              <div className="relative glass-card border border-glass-border/80 rounded-3xl shadow-2xl p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="uppercase text-xs tracking-[0.2em] text-muted-foreground">Tools</p>
                    <h3 className="text-2xl font-semibold">Pick your lane</h3>
                  </div>
                </div>
                <div className="grid gap-3 auto-rows-fr">
                  {toolCards.slice(0, 3).map(({ title, desc, icon: Icon, to, color }, idx) => (
                    <motion.div
                      key={title}
                      className="h-full"
                      variants={fadeFlat(0.16 + idx * 0.08)}
                      whileHover={{ y: -6, scale: 1.01 }}
                      transition={{ type: "spring", stiffness: 200, damping: 18 }}
                    >
                      <Link
                        to={to}
                        className="block h-full p-4 rounded-2xl border border-border/50 bg-card/70 backdrop-blur-md hover:border-primary/50 transition hover:-translate-y-1 hover:shadow-xl group"
                      >
                        <div className="flex items-center gap-3">
                          <motion.div
                            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} grid place-items-center border border-white/5`}
                            animate={{ y: [0, -4, 0] }}
                            transition={{ duration: 3 + idx * 0.2, repeat: Infinity, ease: "easeInOut" }}
                          >
                            <Icon className="w-6 h-6 text-foreground group-hover:text-primary transition-colors" />
                          </motion.div>
                          <div>
                            <p className="font-bold text-lg">{title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">{desc}</p>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.section>

        <motion.section
          className="px-6 mt-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          transition={{ staggerChildren: 0.08 }}
        >
          <div className="container mx-auto">
            <div className="bg-gradient-to-br from-card/40 to-background/40 border border-border/40 rounded-[3rem] p-8 md:p-16 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -mr-32 -mt-32 transition-transform duration-1000 group-hover:scale-110" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-[100px] -ml-32 -mb-32 transition-transform duration-1000 group-hover:scale-110" />
              
              <div className="relative grid md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 px-4 py-1.5 uppercase tracking-widest text-[10px] font-black">Philosophy</Badge>
                  <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
                    Tools that think like <span className="text-primary">Musicians.</span>
                  </h2>
                  <p className="text-muted-foreground text-lg leading-relaxed font-medium">
                    We believe music theory shouldn't be boring. Guitariz is built to be a canvas where you can experiment, hear every note, and see the geometry of music without getting lost in technicalities.
                  </p>
                  <div className="flex items-center gap-6 pt-4">
                    <div className="text-center">
                      <p className="text-3xl font-black text-primary">0</p>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Latency</p>
                    </div>
                    <div className="w-px h-10 bg-border/40" />
                    <div className="text-center">
                      <p className="text-3xl font-black text-secondary">∞</p>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Creativity</p>
                    </div>
                    <div className="w-px h-10 bg-border/40" />
                    <div className="text-center">
                      <p className="text-3xl font-black text-accent">100%</p>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Visual</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Neural Audio", color: "bg-orange-500/20" },
                    { label: "Adaptive UI", color: "bg-blue-500/20" },
                    { label: "Vector Theory", color: "bg-emerald-500/20" },
                    { label: "Real-time AI", color: "bg-purple-500/20" },
                  ].map((item) => (
                    <div key={item.label} className={`p-8 rounded-[2rem] ${item.color} backdrop-blur-md border border-white/5 flex items-center justify-center text-center group/item hover:scale-[1.05] transition-transform cursor-default`}>
                      <span className="font-bold tracking-tight group-hover/item:text-white transition-colors">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          className="px-6 mt-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          transition={{ staggerChildren: 0.08 }}
        >
          <motion.div className="container mx-auto grid md:grid-cols-3 gap-6" variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
            {["Lightning Fast", "Pure Audio", "Smart Layouts"].map((text, idx) => (
              <motion.div
                key={text}
                className="p-8 rounded-[2rem] border border-border/40 bg-card/60 backdrop-blur-md hover:border-primary/20 transition-all duration-300 group"
                variants={fadeFlat(0.06 * idx)}
                whileHover={{ y: -4 }}
              >
                <div className="w-10 h-1 text-primary bg-primary/20 rounded-full mb-4 group-hover:w-20 transition-all duration-500" />
                <p className="font-black text-xl mb-3 tracking-tight">{text}</p>
                <p className="text-sm text-muted-foreground leading-relaxed font-medium grayscale group-hover:grayscale-0 transition-all">
                  {text === "Lightning Fast"
                    ? "Each tool is optimized and code-split for immediate access to music gear."
                    : text === "Pure Audio"
                    ? "Synthesized in high-fidelity to ensure you stay in the musical mindset."
                    : "Focused interfaces that put the instrument front and center, always."}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </motion.section>

        <motion.section
          className="px-6 mt-20"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          transition={{ staggerChildren: 0.08 }}
        >
          <motion.div className="container mx-auto space-y-6" variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
            <motion.div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3" variants={fadeUp(0.05)}>
              <div>
                <p className="uppercase text-xs tracking-[0.18em] text-muted-foreground">Explore</p>
                <h2 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  Pick a tool
                </h2>
              </div>
            </motion.div>
            <motion.div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr" variants={{ visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } } }}>
              {toolCards.map(({ title, desc, icon: Icon, to, color }, idx) => (
                <motion.div
                  key={title}
                  className="h-full"
                  variants={fadeFlat(0.06 * idx)}
                  whileHover={{ y: -6, scale: 1.01, rotate: -0.3 }}
                  transition={{ type: "spring", stiffness: 210, damping: 20 }}
                >
                  <Link
                    to={to}
                    className="block h-full p-6 rounded-[2rem] border border-border/50 bg-card/40 backdrop-blur-xl hover:border-primary/50 hover:bg-card/60 transition shadow-lg group relative overflow-hidden"
                  >
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} grid place-items-center border border-white/5 group-hover:scale-110 transition-transform`}>
                        <Icon className="w-7 h-7 text-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div className="pt-1">
                        <p className="font-black text-2xl tracking-tight">{title}</p>
                        <div className="w-8 h-1 bg-primary/40 rounded-full mt-1 group-hover:w-16 transition-all duration-300" />
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed font-medium">{desc}</p>
                    
                    <div className="mt-6 flex items-center text-xs font-bold uppercase tracking-widest text-primary/0 group-hover:text-primary transition-all gap-2">
                       Explore Now <ArrowRight className="w-3 h-3" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </motion.section>
      </main>

      <footer className="border-t border-border/40 py-14 px-6 bg-gradient-to-b from-transparent via-background/60 to-background">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img src="/logo.svg" alt="Guitariz" className="w-10 h-10 rounded-xl" />
                <span className="font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Guitariz</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                A vivid playground for chords, scales, and rhythms—now faster with dedicated pages.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">Tools</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link className="hover:text-primary transition-colors" to="/fretboard">Fretboard</Link></li>
                <li><Link className="hover:text-primary transition-colors" to="/chords">Chord Library</Link></li>
                <li><Link className="hover:text-primary transition-colors" to="/scales">Scale Explorer</Link></li>
                <li><Link className="hover:text-primary transition-colors" to="/metronome">Metronome</Link></li>
                <li><Link className="hover:text-primary transition-colors" to="/theory">Circle of Fifths</Link></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">Explore</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a
                    href="https://github.com/abhi9vaidya/guitariz"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors"
                  >
                    GitHub
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.linkedin.com/in/abhinav-vaidya-718843211/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors"
                  >
                    LinkedIn
                  </a>
                </li>
              </ul>
              <div className="space-y-2 pt-2">
                <h4 className="font-semibold">Contact</h4>
                <p className="text-sm text-muted-foreground">abhinavvaidya2005@gmail.com</p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">Mood</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Stay playful, stay curious, and keep the load light.</p>
              <div className="sunset-divider" />
              <p className="text-xs text-muted-foreground">© 2025 Guitariz</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
