import { usePageMetadata } from "@/hooks/usePageMetadata";
import { Info, Users, Cpu, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { Breadcrumb } from "@/components/SEOContent";

const AboutPage = () => {
  usePageMetadata({
    title: "About Us | Guitariz Studio",
    description: "Learn more about Guitariz Studio, our mission to build free open-source music tools, and the advanced DSP & AI technology behind them.",
    keywords: "about guitariz, music theory tools, open source guitar tools, audio analysis, Abhinav Vaidya",
    canonicalUrl: "https://guitariz.studio/about",
    ogImage: "https://guitariz.studio/logo2.png",
    ogType: "website",
  });

  return (
    <div className="min-h-screen bg-background relative overflow-hidden selection:bg-white/10">
      <main className="container mx-auto px-4 md:px-6 pt-24 pb-16 relative z-10 max-w-4xl">
        
        <Breadcrumb items={[
          { name: "Home", url: "https://guitariz.studio/" },
          { name: "About Us", url: "https://guitariz.studio/about" }
        ]} />

        {/* Header Section */}
        <div className="space-y-4 mb-10 mt-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-medium tracking-wider uppercase">
            <Info className="w-4 h-4" />
            <span>Our Journey</span>
          </div>

          <header className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-light tracking-tighter text-foreground font-display">
              About <span className="text-muted-foreground font-thin italic">Guitariz Studio</span>
            </h1>
            <p className="text-sm text-zinc-400">Making professional-grade music tools accessible to everyone.</p>
          </header>
        </div>

        {/* Main Content Card */}
        <div className="glass-card rounded-3xl border border-border bg-card/90 shadow-2xl p-6 md:p-10 space-y-12 text-sm md:text-base text-zinc-300 leading-relaxed">
          
          {/* Mission Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-450 shrink-0">
                <Star className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-semibold text-white">Our Mission</h2>
            </div>
            <p>
              Guitariz Studio was created to democratize high-performance audio analysis and music theory learning. We believe that tools for transcribing chords, isolating vocals, and exploring scale relationships should not be locked behind expensive subscriptions or restricted by monthly usage caps.
            </p>
            <p>
              Whether you are a bedroom guitarist learning your first scale, a songwriter transcribing a chord progression, a music teacher explaining modes, or a producer needing clean stems, Guitariz Studio offers a comprehensive, 100% free music sandbox running directly in your browser.
            </p>
          </section>

          {/* Technology Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-450 shrink-0">
                <Cpu className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-semibold text-white">The Technology</h2>
            </div>
            <p>
              To maintain high speeds and absolute user privacy, we structure our features using a hybrid processing architecture:
            </p>
            <ul className="list-disc pl-5 space-y-3 text-zinc-400">
              <li>
                <strong className="text-white">Client-Side Processing:</strong> Interactive tools like the virtual Fretboard, Scale Explorer, Chromatic Tuner, Metronome, and Jam Studio run fully locally in your web browser. No audio or keyboard interaction is sent to a server.
              </li>
              <li>
                <strong className="text-white">DSP Chord Detection:</strong> Our live chord recognition engine utilizes a custom Digital Signal Processing (DSP) pipeline built on <strong className="text-white">Librosa</strong>. The audio signal undergoes Harmonic-Percussive Source Separation (HPSS) to isolate tonal features from percussive transients. We then extract chroma representations and run Viterbi-based Hidden Markov Model (HMM) smoothing in log-space to ensure musically logical chord transitions.
              </li>
              <li>
                <strong className="text-white">AI Source Separation:</strong> Our Stem Separator runs on Meta AI's state-of-the-art open-source <strong className="text-white">Demucs</strong> neural network model, isolating vocal tracks, basslines, drums, piano, guitar, and miscellaneous instruments from mixed masters.
              </li>
              <li>
                <strong className="text-white">In Development:</strong> An advanced, neural network-based chord recognition model (Convolutional Recurrent Neural Network - CRNN) is currently in development. It is designed to run efficiently in-browser and server-side using ONNX Runtime to deliver near-perfect transcriptions of complex chord voicings and dense mixes.
              </li>
            </ul>
          </section>

          {/* Founder Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-450 shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-semibold text-white">The Founder</h2>
            </div>
            <p>
              Guitariz Studio was founded by <strong className="text-white">Abhinav Vaidya</strong> as an open-source project. What began as a personal tool to transcribe chord progressions and learn Indian Classical Raga shapes on guitar has grown into a collaborative web application used by musicians globally.
            </p>
            <p>
              The code is hosted publicly on GitHub. We encourage developers, musicians, and educators to contribute, file issues, or suggest new features to keep the studio expanding.
            </p>
          </section>

          {/* Call to Action */}
          <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-zinc-500">
              Want to see the code or support the project?
            </p>
            <div className="flex gap-4">
              <a 
                href="https://github.com/Guitariz/Guitariz" 
                target="_blank" 
                rel="noreferrer" 
                className="text-primary hover:underline text-sm font-semibold"
              >
                GitHub Repository ➔
              </a>
              <Link to="/contact" className="text-emerald-400 hover:underline text-sm font-semibold">
                Get In Touch ➔
              </Link>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default AboutPage;
