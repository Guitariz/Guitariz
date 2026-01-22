export type ChordSegment = {
  start: number;
  end: number;
  chord: string;
  confidence: number; // 0-1 confidence estimate
};

export type AnalysisResult = {
  tempo: number;
  meter: number;
  key: string;
  scale: string;
  chords: ChordSegment[];
  simpleChords: ChordSegment[];
  duration?: number; // Duration of audio in seconds
  instrumentalUrl?: string; // URL to instrumental track when vocal filter is used
};
