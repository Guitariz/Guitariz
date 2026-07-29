import { ChordSegment } from "@/types/chordAI";

export interface ChunkRange {
  index: number;
  startSec: number;
  endSec: number;
  usableStart: number;
  usableEnd: number;
}

/**
 * Calculates chunk ranges with overlap for segmenting audio files.
 * Ensures the final chunk does not trim its actual end predictions.
 * 
 * @param duration Total duration of the audio file in seconds.
 * @param chunkDuration Target duration of each chunk (default 30s).
 * @param overlap Trailing and leading overlap duration (default 2s).
 */
export function getChunkRanges(duration: number, chunkDuration = 30, overlap = 2): ChunkRange[] {
  if (duration <= 0) return [];
  const numChunks = Math.ceil(duration / chunkDuration);
  const chunks: ChunkRange[] = [];

  for (let i = 0; i < numChunks; i++) {
    const startSec = Math.max(0, i * chunkDuration - overlap);
    const endSec = Math.min(duration, (i + 1) * chunkDuration + overlap);
    
    const usableStart = i === 0 ? 0 : i * chunkDuration;
    // Trim trailing overlap ONLY if there is a next chunk to cover the remaining audio.
    const usableEnd = (i + 1) * chunkDuration + overlap < duration 
      ? (i + 1) * chunkDuration 
      : duration;

    chunks.push({
      index: i,
      startSec,
      endSec,
      usableStart,
      usableEnd,
    });
  }

  return chunks;
}

/**
 * Filters chord segments to keep only predictions in the usable range,
 * adjusts timestamps relative to the original song timeline, and tags fallbacks.
 */
export function filterAndAdjustChords(
  chords: ChordSegment[],
  startSec: number,
  usableStart: number,
  usableEnd: number,
  isFallback = false
): ChordSegment[] {
  const result: ChordSegment[] = [];

  for (const chord of chords) {
    const startOrig = chord.start + startSec;
    const endOrig = chord.end + startSec;

    // Clamp boundary chords to the usable range limits
    const newStart = Math.max(usableStart, startOrig);
    const newEnd = Math.min(usableEnd, endOrig);

    if (newEnd > newStart) {
      result.push({
        ...chord,
        start: newStart,
        end: newEnd,
        isFallback: chord.isFallback || isFallback,
      });
    }
  }

  return result;
}

/**
 * Parses newline-delimited JSON (NDJSON) string lines from a buffer.
 * Returns parsed items and the remaining incomplete line buffer.
 */
export function parseNdjsonLines(buffer: string): { items: any[]; remaining: string } {
  const lines = buffer.split("\n");
  const remaining = lines.pop() || "";
  const items: any[] = [];
  for (const line of lines) {
    if (line.trim()) {
      try {
        items.push(JSON.parse(line));
      } catch (err) {
        console.warn("[parseNdjsonLines] Failed to parse NDJSON line:", err);
      }
    }
  }
  return { items, remaining };
}
