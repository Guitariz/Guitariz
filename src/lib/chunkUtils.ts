/**
 * src/lib/chunkUtils.ts
 *
 * Math and parsing utilities for progressive streaming and chunked audio analysis.
 */

import { ChordSegment } from '@/types/chordAI';

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

export interface ChunkRange {
  index: number;
  startSec: number;
  endSec: number;
  usableStart: number;
  usableEnd: number;
}

/**
 * Calculate boundary ranges with overlap for chunked audio processing.
 */
export function getChunkRanges(duration: number, chunkSize = 30, overlap = 2): ChunkRange[] {
  if (duration <= 0) return [];

  const chunks: ChunkRange[] = [];
  let chunkIndex = 0;
  let currentStart = 0;

  while (currentStart < duration) {
    const usableStart = currentStart;
    const usableEnd = Math.min(currentStart + chunkSize, duration);

    // Apply overlap margin
    const startSec = Math.max(0, usableStart - (chunkIndex > 0 ? overlap : 0));
    const endSec = Math.min(duration, usableEnd + (usableEnd < duration ? overlap : 0));

    chunks.push({
      index: chunkIndex,
      startSec,
      endSec,
      usableStart,
      usableEnd,
    });

    currentStart += chunkSize;
    chunkIndex++;
  }

  return chunks;
}

/**
 * Filter and adjust chords from chunk-relative time to absolute timeline with boundary clamping.
 */
export function filterAndAdjustChords(
  chords: ChordSegment[],
  startSec: number,
  usableStart: number,
  usableEnd: number
): ChordSegment[] {
  const result: ChordSegment[] = [];

  for (const c of chords) {
    const absStart = startSec + c.start;
    const absEnd = startSec + c.end;

    // Check if segment overlaps with usable window
    if (absEnd <= usableStart || absStart >= usableEnd) {
      continue;
    }

    // Clamp boundaries to usable window
    const clampedStart = Math.max(usableStart, absStart);
    const clampedEnd = Math.min(usableEnd, absEnd);

    if (clampedEnd > clampedStart) {
      result.push({
        ...c,
        start: clampedStart,
        end: clampedEnd,
        isFallback: c.isFallback ?? false,
      });
    }
  }

  return result;
}

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
      if (parsed && typeof parsed === "object") {
        items.push(parsed as NdjsonItem);
      }
    } catch {
      // Skip malformed lines
    }
  }

  return { items, remaining };
}
