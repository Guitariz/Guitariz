import { AnalysisResult, ChordSegment } from "@/types/chordAI";

const defaultBase = import.meta.env.VITE_API_URL || "";
const defaultEndpoint = import.meta.env.VITE_CHORD_AI_API || `${defaultBase}/api/analyze`;

const normalizeChords = (chords: any[], durationHint?: number): ChordSegment[] => {
  if (!Array.isArray(chords)) return [];
  return chords
    .map((c) => ({
      start: typeof c.start === "number" ? c.start : 0,
      end: typeof c.end === "number" ? c.end : (durationHint ?? 1),
      chord: typeof c.chord === "string" ? c.chord : "N.C.",
      confidence: typeof c.confidence === "number" ? Math.max(0, Math.min(1, c.confidence)) : 0.5,
    }))
    .filter((c) => c.end > c.start);
};

export async function analyzeRemote(file: File, endpoint: string = defaultEndpoint, separateVocals: boolean = false): Promise<AnalysisResult> {
  // If we're in production and using a relative path (empty apiUrl), it will likely fail on Vercel
  if (import.meta.env.PROD && !import.meta.env.VITE_API_URL && endpoint.startsWith("/api")) {
    console.error("VITE_API_URL is missing in production. Remote analysis will likely fail.");
  }

  const form = new FormData();
  form.append("file", file);
  form.append("separate_vocals", separateVocals.toString());

  const res = await fetch(endpoint, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Remote analysis failed (${res.status}): ${text}`);
  }

  const json = await res.json();
  const tempo = typeof json.tempo === "number" ? json.tempo : 0;
  const key = typeof json.key === "string" ? json.key : "C";
  const scale = typeof json.scale === "string" ? json.scale : "major";
  const meter = typeof json.meter === "number" ? json.meter : 4;
  const chords = normalizeChords(json.chords, json.duration);
  const simpleChords = json.simpleChords ? normalizeChords(json.simpleChords, json.duration) : [];

  const result: AnalysisResult = { tempo, key, scale, meter, chords, simpleChords };
  
  // Include instrumentalUrl if present (when vocal separation was used)
  if (json.instrumentalUrl) {
    result.instrumentalUrl = json.instrumentalUrl;
  }

  return result;
}

export default analyzeRemote;
