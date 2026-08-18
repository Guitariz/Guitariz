import { AnalysisResult, ChordSegment } from "@/types/chordAI";

const chordsEndpoint = import.meta.env.VITE_CHORD_AI_API || "";
const defaultBase = chordsEndpoint
  ? new URL(chordsEndpoint).origin
  : (import.meta.env.VITE_API_URL || "");
const defaultEndpoint = import.meta.env.VITE_CHORD_AI_API || `${defaultBase}/api/analyze`;

const normalizeChords = (chords: Record<string, unknown>[], durationHint?: number): ChordSegment[] => {
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

export async function analyzeRemote(
  file: File, 
  endpoint: string = defaultEndpoint, 
  separateVocals: boolean = false, 
  analysisMode: 'fast' | 'balanced' | 'precise' = 'balanced',
  onUploadProgress?: (percent: number) => void,
  onXhrCreated?: (xhr: XMLHttpRequest) => void
): Promise<AnalysisResult> {
  // File size limit: 15MB
  const MAX_FILE_SIZE = 15 * 1024 * 1024;
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 15MB.`);
  }

  const form = new FormData();
  form.append("file", file);
  form.append("separate_vocals", separateVocals.toString());
  form.append("use_madmom", (analysisMode === "fast").toString());
  form.append("mode", analysisMode);

  // Use XMLHttpRequest for upload progress tracking
  if (onUploadProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      if (onXhrCreated) {
        onXhrCreated(xhr);
      }
      
      // 5 minute timeout for HuggingFace free tier
      const timeoutMs = 300000;
      xhr.timeout = timeoutMs;
      
      xhr.addEventListener('timeout', () => {
        reject(new Error(`Request timeout - analysis took longer than ${timeoutMs / 1000}s`));
      });
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          onUploadProgress(percentComplete);
        }
      });

      xhr.addEventListener('load', async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const json = JSON.parse(xhr.responseText);
            const tempo = typeof json.tempo === "number" ? json.tempo : 0;
            const key = typeof json.key === "string" ? json.key : "C";
            const scale = typeof json.scale === "string" ? json.scale : "major";
            const meter = typeof json.meter === "number" ? json.meter : 4;
            const chords = normalizeChords(json.chords, json.duration);
            const simpleChords = json.simpleChords ? normalizeChords(json.simpleChords, json.duration) : [];
            
            const result = {
              tempo, key, scale, meter, chords, simpleChords,
              duration: json.duration,
              instrumentalUrl: json.instrumentalUrl,
            };
            resolve(result);
          } catch (err) {
            reject(new Error(`Failed to parse response: ${err}`));
          }
        } else {
          reject(new Error(`Remote analysis failed (${xhr.status}): ${xhr.responseText}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload cancelled'));
      });

      xhr.open('POST', endpoint);
      xhr.send(form);
    });
  }

  // Fallback to fetch if no progress callback
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
  
  if (json.instrumentalUrl) {
    result.instrumentalUrl = json.instrumentalUrl;
  }

  return result;
}

export default analyzeRemote;
