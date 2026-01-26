import { AnalysisResult, ChordSegment } from "@/types/chordAI";

const defaultBase = import.meta.env.VITE_API_URL || "";
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
  useMadmom: boolean = true,
  onUploadProgress?: (percent: number) => void,
  onXhrCreated?: (xhr: XMLHttpRequest) => void
): Promise<AnalysisResult> {
  // If we're in production and using a relative path (empty apiUrl), it will likely fail on Vercel
  if (import.meta.env.PROD && !import.meta.env.VITE_API_URL && endpoint.startsWith("/api")) {
    // Just silent check
  }

  // File size limit: 15MB (reasonable for audio files)
  const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB in bytes
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 15MB.`);
  }

  const form = new FormData();
  form.append("file", file);
  form.append("separate_vocals", separateVocals.toString());
  form.append("use_madmom", useMadmom.toString());

  // Use XMLHttpRequest to track upload progress
  if (onUploadProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Notify parent about XHR creation so it can be cancelled if needed
      if (onXhrCreated) {
        onXhrCreated(xhr);
      }

      // Timeout: 5 minutes - Hugging Face can be slow, especially on free tier
      const timeoutMs = 300000; // 5 minutes
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
              tempo,
              key,
              scale,
              meter,
              chords,
              simpleChords,
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

  // Include instrumentalUrl if present (when vocal separation was used)
  if (json.instrumentalUrl) {
    result.instrumentalUrl = json.instrumentalUrl;
  }

  return result;
}

export default analyzeRemote;
