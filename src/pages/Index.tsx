import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Music2, Layers, Disc, Music, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const toolCards = [
  {
    title: "Fretboard",
    desc: "Hear and see every position with color-coded notes.",
    icon: Music2,
    to: "/fretboard",
  },
  {
    title: "Chord Library",
    desc: "Browse voicings and shapes without the clutter.",
    icon: Layers,
    to: "/chords",
  },
  {
    title: "Scale Explorer",
    desc: "Western modes and ragas with clear visuals.",
    icon: Disc,
    to: "/scales",
  },
  {
    title: "Metronome",
    desc: "Stay in time with a clean, glowing click.",
    icon: Music,
    to: "/metronome",
  },
  {
    title: "Circle of Fifths",
    desc: "See key relationships on their own canvas.",
    icon: BookOpen,
    to: "/theory",
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
    <div className="min-h-screen relative overflow-hidden home-aurora">
      <div className="home-noise" aria-hidden="true" />
      <div className="absolute inset-0 -z-10">
        <motion.div
          className="absolute inset-0 opacity-55"
          style={{
            backgroundImage:
              "radial-gradient(circle at 22% 20%, hsla(24,94%,60%,0.14), transparent 34%), radial-gradient(circle at 78% 12%, hsla(195,83%,52%,0.12), transparent 32%), radial-gradient(circle at 70% 78%, hsla(220,80%,66%,0.12), transparent 30%)",
          }}
          animate={{ opacity: [0.45, 0.62, 0.5] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05),transparent_45%)] blur-xl opacity-26" />
        <motion.div
          className="absolute -bottom-32 -left-10 w-80 h-80 bg-gradient-to-br from-primary/25 via-accent/18 to-secondary/20 rounded-full blur-xl"
          animate={{ x: [0, 12, -8, 0], y: [0, -14, 8, 0], rotate: [0, 4, -3, 0], opacity: [0.7, 0.9, 0.75, 0.7] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -top-24 right-10 w-96 h-96 bg-gradient-to-br from-secondary/22 via-primary/18 to-accent/18 rounded-full blur-xl"
          animate={{ x: [0, -10, 14, 0], y: [0, 10, -12, 0], rotate: [0, -5, 3, 0], opacity: [0.6, 0.85, 0.7, 0.6] }}
          transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
        />
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
              <motion.div className="space-y-4" variants={blurRise(0.12)}>
                <h1 className="text-5xl md:text-6xl leading-tight font-bold text-gradient">
                  Play, hear, and learn music.
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
                  Guitar and piano, chords and scales—everything stays musical. Jump between instruments, hear changes instantly, and keep the groove moving.
                </p>
              </motion.div>
              <motion.div className="flex flex-wrap items-center gap-4" variants={pop(0.16)}>
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
                    className="p-3 rounded-xl bg-card/60 border border-border/60 backdrop-blur-md text-sm text-muted-foreground card-lift sheen"
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
                  {toolCards.slice(0, 3).map(({ title, desc, icon: Icon, to }, idx) => (
                    <motion.div
                      key={title}
                      className="h-full"
                      variants={fadeFlat(0.16 + idx * 0.08)}
                      whileHover={{ y: -6, scale: 1.01 }}
                      transition={{ type: "spring", stiffness: 200, damping: 18 }}
                    >
                      <Link
                        to={to}
                        className="block h-full p-4 rounded-2xl border border-border/50 bg-card/70 backdrop-blur-md hover:border-primary/50 transition hover:-translate-y-1 hover:shadow-lg card-lift"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 grid place-items-center">
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold">{title}</p>
                            <p className="text-sm text-muted-foreground">{desc}</p>
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
          <motion.div className="container mx-auto grid md:grid-cols-3 gap-4" variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
            {["Speedy loads", "Stay musical", "No more heavy scroll"].map((text, idx) => (
              <motion.div
                key={text}
                className="p-5 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md card-lift"
                variants={fadeFlat(0.06 * idx)}
                whileHover={{ y: -4, scale: 1.01 }}
                transition={{ type: "spring", stiffness: 220, damping: 18 }}
              >
                <p className="font-semibold text-lg mb-1">{text}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {text === "Speedy loads"
                    ? "Each tool is code-split so you only load what you use."
                    : text === "Stay musical"
                    ? "Audio first: fretboard, piano, chords, and scales keep you hearing every change."
                    : "Shorter pages mean smoother scrolling and faster paints."}
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
              {toolCards.map(({ title, desc, icon: Icon, to }, idx) => (
                <motion.div
                  key={title}
                  className="h-full"
                  variants={fadeFlat(0.06 * idx)}
                  whileHover={{ y: -6, scale: 1.01, rotate: -0.3 }}
                  transition={{ type: "spring", stiffness: 210, damping: 20 }}
                >
                  <Link
                    to={to}
                    className="block h-full p-5 rounded-2xl border border-border/50 bg-card/70 hover:border-primary/50 hover:-translate-y-1 transition shadow-md card-lift"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 grid place-items-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <p className="font-semibold text-lg">{title}</p>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
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
                    href="https://www.linkedin.com/in/abhinav-vaidya"
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
