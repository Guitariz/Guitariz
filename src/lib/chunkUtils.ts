/**
 * src/lib/chunkUtils.ts
 *
 * NDJSON streaming parser for progressive chord loading.
 *
 * The backend streams analysis results as newline-delimited JSON:
 *   {"type": "progress", "message": "...", "percent": 50}
 *   {"type": "metadata", "tempo": 120, "key": "C", ...}
 *   {"type": "chords", "start": 0, "end": 30, "chords": [...], "simpleChords": [...]}
 *   {"type": "chords", "start": 30, "end": 60, ...}
 *   {"type": "error", "detail": "..."}
 */

export interface NdjsonProgress {
  type: "progress";
  message: string;
  percent: number;
  stage?: string;
}

export interface NdjsonMetadata {
  type: "metadata";
  tempo?: number;
  meter?: number;
  key?: string;
  scale?: string;
  instrumentalUrl?: string;
}

export interface NdjsonChords {
  type: "chords";
  start: number;
  end: number;
  chords: Array<{ start: number; end: number; chord: string; confidence: number }>;
  simpleChords: Array<{ start: number; end: number; chord: string; confidence: number }>;
}

export interface NdjsonError {
  type: "error";
  detail: string;
}

export type NdjsonItem = NdjsonProgress | NdjsonMetadata | NdjsonChords | NdjsonError;

/**
 * Parse a buffer of NDJSON text into structured items.
 *
 * Returns parsed items and any remaining unparsed text (incomplete line).
 */
export function parseNdjsonLines(buffer: string): {
  items: NdjsonItem[];
  remaining: string;
} {
  const items: NdjsonItem[] = [];
  const lines = buffer.split("\n");

  // Last element might be an incomplete line
  const remaining = lines.pop() ?? "";

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed.type === "string") {
        items.push(parsed as NdjsonItem);
      }
    } catch {
      // Skip malformed lines
      console.warn("[NDJSON] Skipping malformed line:", trimmed.slice(0, 100));
    }
  }

  return { items, remaining };
}
