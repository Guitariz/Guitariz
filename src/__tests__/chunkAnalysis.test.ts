import { describe, it, expect } from 'vitest';
import { getChunkRanges, filterAndAdjustChords, parseNdjsonLines } from '../lib/chunkUtils';
import { ChordSegment } from '../types/chordAI';

describe('Chunk Analysis Math & Trimming Logic', () => {
  describe('getChunkRanges', () => {
    it('should return empty list for non-positive durations', () => {
      expect(getChunkRanges(0)).toEqual([]);
      expect(getChunkRanges(-50)).toEqual([]);
    });

    it('should calculate correct ranges for short files under 30s', () => {
      const duration = 25;
      const chunks = getChunkRanges(duration, 30, 2);
      
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toEqual({
        index: 0,
        startSec: 0,
        endSec: 25,
        usableStart: 0,
        usableEnd: 25
      });
    });

    it('should calculate correct boundaries and usable ranges for a 75s file (non-multiple of 30)', () => {
      const duration = 75;
      const chunks = getChunkRanges(duration, 30, 2);

      expect(chunks).toHaveLength(3);

      // Chunk 0 (0 to 30s + 2s overlap)
      expect(chunks[0]).toEqual({
        index: 0,
        startSec: 0,
        endSec: 32,
        usableStart: 0,
        usableEnd: 30
      });

      // Chunk 1 (30 to 60s + 2s overlap on both sides)
      expect(chunks[1]).toEqual({
        index: 1,
        startSec: 28,
        endSec: 62,
        usableStart: 30,
        usableEnd: 60
      });

      // Chunk 2 (60 to 75s, trailing overlap clamped to duration, no trim on usable end)
      expect(chunks[2]).toEqual({
        index: 2,
        startSec: 58,
        endSec: 75,
        usableStart: 60,
        usableEnd: 75
      });
    });

    it('should calculate correct boundaries for a clean multiple of 30s (e.g. 60s)', () => {
      const duration = 60;
      const chunks = getChunkRanges(duration, 30, 2);

      expect(chunks).toHaveLength(2);

      // Chunk 0
      expect(chunks[0]).toEqual({
        index: 0,
        startSec: 0,
        endSec: 32,
        usableStart: 0,
        usableEnd: 30
      });

      // Chunk 1
      expect(chunks[1]).toEqual({
        index: 1,
        startSec: 28,
        endSec: 60,
        usableStart: 30,
        usableEnd: 60
      });
    });
  });

  describe('filterAndAdjustChords', () => {
    it('should shift, clamp, and filter chords correctly', () => {
      const startSec = 28;
      const usableStart = 30;
      const usableEnd = 60;
      
      const chords: ChordSegment[] = [
        { start: 0, end: 1, chord: 'C', confidence: 0.9 },     // 28 to 29 (completely before usableStart)
        { start: 1, end: 4, chord: 'Dm', confidence: 0.8 },    // 29 to 32 (crosses usableStart)
        { start: 10, end: 20, chord: 'G', confidence: 0.75 },  // 38 to 48 (completely inside)
        { start: 30, end: 34, chord: 'C', confidence: 0.95 },  // 58 to 62 (crosses usableEnd)
        { start: 33, end: 35, chord: 'Am', confidence: 0.85 }  // 61 to 63 (completely after usableEnd)
      ];

      const processed = filterAndAdjustChords(chords, startSec, usableStart, usableEnd);

      expect(processed).toHaveLength(3);

      // Dm (clamped to start at 30, end at 32)
      expect(processed[0]).toEqual({
        start: 30,
        end: 32,
        chord: 'Dm',
        confidence: 0.8,
        isFallback: false
      });

      // G (shifted to 38, end 48)
      expect(processed[1]).toEqual({
        start: 38,
        end: 48,
        chord: 'G',
        confidence: 0.75,
        isFallback: false
      });

      // C (clamped to start at 58, end at 60)
      expect(processed[2]).toEqual({
        start: 58,
        end: 60,
        chord: 'C',
        confidence: 0.95,
        isFallback: false
      });
    });
  });

  describe('parseNdjsonLines', () => {
    it('should split multiple complete lines arriving in one read', () => {
      const buffer = '{"chord":"C","start":0,"end":5}\n{"chord":"G","start":5,"end":10}\n';
      const { items, remaining } = parseNdjsonLines(buffer);
      
      expect(items).toEqual([
        { chord: 'C', start: 0, end: 5 },
        { chord: 'G', start: 5, end: 10 }
      ]);
      expect(remaining).toBe('');
    });

    it('should handle a line split across multiple read calls', () => {
      // First read: partial line
      const read1 = '{"chord":"C","start":0';
      const res1 = parseNdjsonLines(read1);
      
      expect(res1.items).toEqual([]);
      expect(res1.remaining).toBe('{"chord":"C","start":0');

      // Second read: completes the line plus a new line
      const read2 = res1.remaining + ',"end":5}\n{"chord":"G"';
      const res2 = parseNdjsonLines(read2);

      expect(res2.items).toEqual([
        { chord: 'C', start: 0, end: 5 }
      ]);
      expect(res2.remaining).toBe('{"chord":"G"');
    });

    it('should handle final chunk with no trailing newline when manually processed', () => {
      const finalRemaining = '{"chord":"G","start":5,"end":10}';
      const res = parseNdjsonLines(finalRemaining);
      
      expect(res.items).toEqual([]);
      expect(res.remaining).toBe('{"chord":"G","start":5,"end":10}');

      const finalItems = [...res.items];
      if (res.remaining.trim()) {
        finalItems.push(JSON.parse(res.remaining));
      }
      expect(finalItems).toEqual([
        { chord: 'G', start: 5, end: 10 }
      ]);
    });
  });
});
