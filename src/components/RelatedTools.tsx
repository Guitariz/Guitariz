import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

interface Tool {
  name: string;
  path: string;
  description: string;
}

const ALL_TOOLS: Tool[] = [
  { name: "Chord AI", path: "/chord-ai", description: "Extract chords, key & tempo from any song with AI." },
  { name: "BPM Detector", path: "/bpm-detector", description: "Detect beats per minute and tap tempo for any audio file." },
  { name: "Key Detector", path: "/key-detector", description: "Find key signatures and scales from MP3 or audio tracks." },
  { name: "Vocal Remover", path: "/vocal-remover", description: "Isolate vocals and create karaoke backing tracks with AI." },
  { name: "Chord Generator", path: "/chord-progression-generator", description: "Generate progressions with sound preview and MIDI export." },
  { name: "Vocal Splitter", path: "/vocal-splitter", description: "Isolate vocals and instrumentals from any track." },
  { name: "Stem Separator", path: "/stem-separator", description: "Split songs into 6 stems: vocals, drums, bass, guitar, piano & more." },
  { name: "Fretboard", path: "/fretboard", description: "Interactive guitar fretboard with scales, chords & sound." },
  { name: "Chord Library", path: "/chords", description: "Browse 1000+ chord diagrams with voicings and finger positions." },
  { name: "Scale Explorer", path: "/scales", description: "Visualize scales and modes across the guitar neck." },
  { name: "Jam Studio", path: "/jam", description: "Loop chord progressions with AI piano and pad accompaniment." },
  { name: "Music Theory", path: "/theory", description: "Interactive Circle of Fifths and harmonic analysis tools." },
  { name: "Metronome", path: "/metronome", description: "High-precision online metronome with adjustable tempo." },
  { name: "Tuner", path: "/tuner", description: "Chromatic tuner with cent-level accuracy for any instrument." },
  { name: "Ear Training", path: "/ear-training", description: "Gamified ear training for intervals, chords & pitch." },
];

interface RelatedToolsProps {
  /** The path of the current page (e.g. "/chord-ai") so it is excluded from the list. */
  currentPath: string;
  /** Maximum number of tools to show. Defaults to 4. */
  maxItems?: number;
}

const RelatedTools = ({ currentPath, maxItems = 4 }: RelatedToolsProps) => {
  const tools = ALL_TOOLS.filter((t) => t.path !== currentPath).slice(0, maxItems);

  return (
    <section className="mt-16 mb-8">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.25em] mb-6">
          Explore More Tools
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {tools.map((tool) => (
            <Link
              key={tool.path}
              to={tool.path}
              className="group p-5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300"
            >
              <h3 className="text-sm font-semibold text-white mb-1.5 flex items-center gap-2">
                {tool.name}
                <ArrowRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {tool.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RelatedTools;
