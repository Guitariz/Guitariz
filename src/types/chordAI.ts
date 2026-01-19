export type ChordSegment = {
  start: number;
  end: number;
  chord: string;
  confidence: number; // 0-1 confidence estimate
};

export type AnalysisResult = {
  tempo: number;
  key: string;
  scale: string;
  chords: ChordSegment[];
};
