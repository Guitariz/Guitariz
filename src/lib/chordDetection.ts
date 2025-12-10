/**
 * Advanced chord detection algorithm
 * Analyzes pitch classes and matches against comprehensive chord dictionary
 */

import {
  ChordCandidate,
  ChordDetectionSettings,
  CHORD_PATTERNS,
  NOTE_NAMES,
} from '@/types/chordDetectionTypes';

/**
 * Convert MIDI note number to pitch class (0-11)
 */
export const midiToPitchClass = (midiNote: number): number => {
  return midiNote % 12;
};

/**
 * Convert pitch class to note name
 */
export const pitchClassToNote = (pitchClass: number): string => {
  return NOTE_NAMES[pitchClass];
};

/**
 * Normalize intervals to be within one octave and sorted
 */
const normalizeIntervals = (intervals: number[]): number[] => {
  return [...new Set(intervals.map(i => i % 12))].sort((a, b) => a - b);
};

/**
 * Calculate similarity score between two interval sets
 * Returns 0-100 score
 */
const calculateSimilarityScore = (
  noteIntervals: number[],
  patternIntervals: number[],
  strictness: 'lenient' | 'strict'
): number => {
  const noteSet = new Set(noteIntervals);
  const patternSet = new Set(patternIntervals);
  
  // Check how many pattern intervals are present
  const matchingIntervals = patternIntervals.filter(i => noteSet.has(i)).length;
  const patternCoverage = matchingIntervals / patternIntervals.length;
  
  // Check for extra notes (penalize in strict mode)
  const extraNotes = noteIntervals.filter(i => !patternSet.has(i)).length;
  const extraNotePenalty = strictness === 'strict' ? extraNotes * 0.15 : extraNotes * 0.05;
  
  // Base score on pattern coverage
  let score = patternCoverage * 100;
  
  // Apply penalties
  score -= extraNotePenalty * 100;
  
  // Perfect match bonus
  if (matchingIntervals === patternIntervals.length && extraNotes === 0) {
    score = 100;
  }
  
  return Math.max(0, Math.min(100, score));
};

/**
 * Detect inversion from bass note
 */
const detectInversion = (intervals: number[], bassInterval: number): number => {
  const sortedIntervals = [...intervals].sort((a, b) => a - b);
  return sortedIntervals.indexOf(bassInterval);
};

/**
 * Main chord detection function
 * Analyzes pitch classes and returns ranked candidates
 */
export const detectChords = (
  midiNotes: number[],
  settings: ChordDetectionSettings = {
    strictness: 'lenient',
    maxCandidates: 3,
    allowInversions: true,
    minNotes: 2,
  }
): ChordCandidate[] => {
  if (midiNotes.length < settings.minNotes) {
    return [];
  }

  // Convert to pitch classes
  const pitchClasses = midiNotes.map(midiToPitchClass);
  const uniquePitchClasses = [...new Set(pitchClasses)];
  
  if (uniquePitchClasses.length < settings.minNotes) {
    return [];
  }

  // Determine bass note (lowest MIDI note)
  const bassMidiNote = Math.min(...midiNotes);
  const bassPitchClass = midiToPitchClass(bassMidiNote);

  const candidates: ChordCandidate[] = [];

  // Try each unique pitch class as potential root
  for (const rootPitchClass of uniquePitchClasses) {
    // Calculate intervals from this root
    const intervals = uniquePitchClasses.map(pc => 
      (pc - rootPitchClass + 12) % 12
    );
    const normalizedIntervals = normalizeIntervals(intervals);

    // Match against all patterns
    for (const pattern of CHORD_PATTERNS) {
      const score = calculateSimilarityScore(
        normalizedIntervals,
        normalizeIntervals(pattern.intervals),
        settings.strictness
      );

      // Only include if score meets threshold
      const threshold = settings.strictness === 'strict' ? 80 : 60;
      if (score >= threshold) {
        const root = pitchClassToNote(rootPitchClass);
        const bassNote = pitchClassToNote(bassPitchClass);
        const bassInterval = (bassPitchClass - rootPitchClass + 12) % 12;
        const inversion = detectInversion(normalizedIntervals, bassInterval);

        // Format chord name with inversion if applicable
        let chordName = `${root}${pattern.name}`;
        if (settings.allowInversions && inversion > 0 && bassNote !== root) {
          chordName += `/${bassNote}`;
        }

        candidates.push({
          name: chordName,
          root,
          intervals: normalizedIntervals,
          inversion,
          score: score + pattern.priority * 0.1, // Boost by priority
          bassNote,
          alternateNames: pattern.alternateNames?.map(alt => `${root}${alt}`),
        });
      }
    }
  }

  // Sort by score (highest first) and return top candidates
  return candidates
    .sort((a, b) => b.score - a.score)
    .slice(0, settings.maxCandidates);
};

/**
 * Get selected notes as MIDI numbers from fretboard positions
 */
export const fretboardNotesToMidi = (positions: Array<{ string: number; fret: number }>): number[] => {
  // Standard guitar tuning (E2, A2, D3, G3, B3, E4) in MIDI
  const stringTuning = [40, 45, 50, 55, 59, 64]; // Low E to high E
  
  return positions.map(pos => stringTuning[pos.string] + pos.fret);
};

/**
 * Get human-readable chord information
 */
export const getChordInfo = (candidate: ChordCandidate): string => {
  const inversionText = candidate.inversion > 0 
    ? ` (${candidate.inversion === 1 ? '1st' : candidate.inversion === 2 ? '2nd' : '3rd'} inversion)`
    : '';
  
  const confidenceText = candidate.score >= 90 
    ? 'Very High' 
    : candidate.score >= 75 
    ? 'High' 
    : candidate.score >= 60 
    ? 'Medium' 
    : 'Low';

  return `${candidate.name}${inversionText} - Confidence: ${confidenceText} (${Math.round(candidate.score)}%)`;
};
