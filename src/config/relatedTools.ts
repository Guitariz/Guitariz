export interface ToolDefinition {
  id: string;
  name: string;
  path: string;
  description: string;
  relatedIds: string[];
}

export const TOOLS_CONFIG: Record<string, ToolDefinition> = {
  "chord-ai": {
    id: "chord-ai",
    name: "Chord AI",
    path: "/chord-ai",
    description: "Extract chords, key & tempo from any song with AI audio analysis.",
    relatedIds: ["key-detector", "stem-separator", "bpm-detector"],
  },
  "stem-separator": {
    id: "stem-separator",
    name: "Stem Separator",
    path: "/stem-separator",
    description: "Split songs into isolated vocal, drum, bass, and guitar stems.",
    relatedIds: ["chord-ai", "bpm-detector", "vocal-splitter"],
  },
  "bpm-detector": {
    id: "bpm-detector",
    name: "BPM Detector",
    path: "/bpm-detector",
    description: "Detect exact tempo, beats per minute, and tap tempo from audio.",
    relatedIds: ["metronome", "chord-ai", "key-detector"],
  },
  "key-detector": {
    id: "key-detector",
    name: "Key Detector",
    path: "/key-detector",
    description: "Find musical key signatures, modes, and scales from audio tracks.",
    relatedIds: ["scales", "chord-ai", "theory"],
  },
  "tuner": {
    id: "tuner",
    name: "Guitar Tuner",
    path: "/tuner",
    description: "High-precision chromatic tuner with cent-level microphone pitch detection.",
    relatedIds: ["metronome", "scales", "fretboard"],
  },
  "fretboard": {
    id: "fretboard",
    name: "Interactive Fretboard",
    path: "/fretboard",
    description: "Visualize intervals, scales, notes, and voicings across 24 frets.",
    relatedIds: ["chords", "scales", "ear-training"],
  },
  "scales": {
    id: "scales",
    name: "Scale Explorer",
    path: "/scales",
    description: "Explore 50+ Western & exotic scales, modes, and fretboard positions.",
    relatedIds: ["fretboard", "theory", "tuner"],
  },
  "metronome": {
    id: "metronome",
    name: "Pro Metronome",
    path: "/metronome",
    description: "Precise tempo control with customizable subdivisions and time signatures.",
    relatedIds: ["bpm-detector", "tuner", "jam"],
  },
  "ear-training": {
    id: "ear-training",
    name: "Ear Training",
    path: "/ear-training",
    description: "Gamified pitch, interval, and chord recognition training drills.",
    relatedIds: ["theory", "fretboard", "scales"],
  },
  "jam": {
    id: "jam",
    name: "Jam Studio",
    path: "/jam",
    description: "Loop chord progressions with backing instruments and custom tempos.",
    relatedIds: ["chord-progression-generator", "metronome", "chord-ai"],
  },
  "theory": {
    id: "theory",
    name: "Circle of Fifths & Theory",
    path: "/theory",
    description: "Master harmonic motion, key signatures, and chord progressions.",
    relatedIds: ["scales", "ear-training", "chords"],
  },
  "chords": {
    id: "chords",
    name: "Chord Library",
    path: "/chords",
    description: "Browse 1,000+ chord diagrams with fingering positions and audio preview.",
    relatedIds: ["fretboard", "chord-progression-generator", "theory"],
  },
  "chord-progression-generator": {
    id: "chord-progression-generator",
    name: "Chord Generator",
    path: "/chord-progression-generator",
    description: "Generate musical chord progressions with sound preview and MIDI export.",
    relatedIds: ["chord-ai", "jam", "theory"],
  },
  "vocal-splitter": {
    id: "vocal-splitter",
    name: "Vocal Splitter",
    path: "/vocal-splitter",
    description: "Isolate vocals and instrumental backing tracks in seconds.",
    relatedIds: ["stem-separator", "chord-ai", "bpm-detector"],
  },
  "raga-theory": {
    id: "raga-theory",
    name: "Raga Theory",
    path: "/raga-theory",
    description: "Explore Indian Classical Thaats, Ragas, and fretboard fingerings.",
    relatedIds: ["theory", "scales", "fretboard"],
  },
};

export function getRelatedTools(currentToolOrPath: string, maxItems: number = 3): ToolDefinition[] {
  const normalized = currentToolOrPath.trim().replace(/^\//, "").toLowerCase();
  
  // Find tool by ID or by path matching
  const toolEntry = Object.values(TOOLS_CONFIG).find(
    (t) => t.id === normalized || t.path.replace(/^\//, "").toLowerCase() === normalized
  );

  if (toolEntry && toolEntry.relatedIds.length > 0) {
    const matched = toolEntry.relatedIds
      .map((id) => TOOLS_CONFIG[id])
      .filter((t): t is ToolDefinition => Boolean(t));
    if (matched.length > 0) {
      return matched.slice(0, maxItems);
    }
  }

  // Fallback: return tools other than current
  return Object.values(TOOLS_CONFIG)
    .filter((t) => t.id !== normalized && t.path.replace(/^\//, "").toLowerCase() !== normalized)
    .slice(0, maxItems);
}
