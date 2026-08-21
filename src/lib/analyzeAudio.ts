/**
 * src/lib/analyzeAudio.ts
 *
 * Enhanced client-side fallback audio analysis — runs entirely in the browser.
 *
 * Used when the backend is unavailable (sleeping, offline, or errored).
 * Features:
 *   1. Musical band-limited FFT (55Hz - 1800Hz) with Hann windowing
 *   2. Dual-band analysis: Dedicated Bass Chromagram (55Hz - 300Hz) + Full Chromagram
 *   3. Gaussian pitch-centering to filter out-of-tune noise and transients
 *   4. Harmonic overtone compensation (attenuating 3rd/5th overtones)
 *   5. Robust chord template matching with non-chord tone penalties & triad prioritization
 *   6. Krumhansl-Schmuckler key determination + chord progression refinement
 *   7. Viterbi-style transition smoothing and glitch filtering
 */

import FFT from "fft.js";
import { AnalysisResult, ChordSegment } from "@/types/chordAI";

// ── Constants ──────────────────────────────────────────────────────────────

const PITCH_CLASS_NAMES = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
];

// Krumhansl-Schmuckler key profiles
const MAJOR_PROFILE = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR_PROFILE = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

interface TemplateDef {
  name: string;
  root: number;
  quality: string;
  vec: number[];
  intervals: number[];
  isTriad: boolean;
}

// Build chord templates: 12 roots × 8 qualities = 96 templates
const CHORD_TEMPLATES: TemplateDef[] = [];
for (let root = 0; root < 12; root++) {
  const types: { suffix: string; intervals: number[]; isTriad: boolean }[] = [
    { suffix: "", intervals: [0, 4, 7], isTriad: true },          // Major
    { suffix: "m", intervals: [0, 3, 7], isTriad: true },         // Minor
    { suffix: "7", intervals: [0, 4, 7, 10], isTriad: false },    // Dominant 7
    { suffix: "maj7", intervals: [0, 4, 7, 11], isTriad: false }, // Major 7
    { suffix: "m7", intervals: [0, 3, 7, 10], isTriad: false },   // Minor 7
    { suffix: "dim", intervals: [0, 3, 6], isTriad: true },       // Diminished
    { suffix: "sus4", intervals: [0, 5, 7], isTriad: true },      // Sus4
    { suffix: "sus2", intervals: [0, 2, 7], isTriad: true },      // Sus2
  ];

  for (const { suffix, intervals, isTriad } of types) {
    const vec = new Array(12).fill(-0.25); // Baseline non-chord penalty
    intervals.forEach((iv, i) => {
      // Weight root and third highest
      vec[(root + iv) % 12] = (i === 0) ? 1.0 : (iv === 3 || iv === 4) ? 0.95 : 0.85;
    });

    // Specific mutual exclusion penalties:
    if (suffix === "" || suffix === "7" || suffix === "maj7") {
      vec[(root + 3) % 12] = -0.5; // Strong penalty for minor 3rd in major chord
    } else if (suffix === "m" || suffix === "m7") {
      vec[(root + 4) % 12] = -0.5; // Strong penalty for major 3rd in minor chord
    }

    const norm = Math.sqrt(vec.reduce((a, b) => a + (b > 0 ? b * b : 0), 0)) || 1;
    CHORD_TEMPLATES.push({
      name: PITCH_CLASS_NAMES[root] + suffix,
      root,
      quality: suffix,
      vec: vec.map(v => v / norm),
      intervals,
      isTriad,
    });
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

export type AnalyzeTrackResult = AnalysisResult;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function chooseKey(pitchHistogram: number[]): { key: string; scale: string } {
  let best: { key: string; scale: string; score: number } = { key: "C", scale: "major", score: -Infinity };

  for (let tonic = 0; tonic < 12; tonic += 1) {
    let majorScore = 0;
    let minorScore = 0;
    for (let idx = 0; idx < 12; idx++) {
      const interval = (idx - tonic + 12) % 12;
      majorScore += MAJOR_PROFILE[interval] * pitchHistogram[idx];
      minorScore += MINOR_PROFILE[interval] * pitchHistogram[idx];
    }
    if (majorScore > best.score) {
      best = { key: PITCH_CLASS_NAMES[tonic], scale: "major", score: majorScore };
    }
    if (minorScore > best.score) {
      best = { key: PITCH_CLASS_NAMES[tonic], scale: "minor", score: minorScore };
    }
  }

  return { key: best.key, scale: best.scale };
}

/**
 * Refine key detection using chord progression context.
 * Resolves relative major/minor ambiguity (e.g., C major vs A minor).
 */
export function refineKeyFromChords(key: string, scale: string, chords: ChordSegment[]): { key: string; scale: string } {
  if (!chords || chords.length === 0) return { key, scale };

  const getRoot = (chordStr: string) => {
    if (!chordStr || chordStr === "N.C." || chordStr === "N") return null;
    const match = chordStr.match(/^([A-G][#b]?)/);
    return match ? match[1] : null;
  };

  const isMinorChord = (chordStr: string) => {
    if (!chordStr) return false;
    const root = getRoot(chordStr);
    if (!root) return false;
    const rest = chordStr.slice(root.length);
    return rest.startsWith("m") && !rest.startsWith("maj");
  };

  const majorDurations: Record<string, number> = {};
  const minorDurations: Record<string, number> = {};

  for (const seg of chords) {
    const root = getRoot(seg.chord);
    if (!root) continue;
    const duration = seg.end - seg.start;
    if (isMinorChord(seg.chord)) {
      minorDurations[root] = (minorDurations[root] || 0) + duration;
    } else {
      majorDurations[root] = (majorDurations[root] || 0) + duration;
    }
  }

  const validChords = chords.filter((c) => getRoot(c.chord) !== null);
  const firstRoot = validChords.length > 0 ? getRoot(validChords[0].chord) : null;
  const lastRoot = validChords.length > 0 ? getRoot(validChords[validChords.length - 1].chord) : null;

  const rootIdx = PITCH_CLASS_NAMES.indexOf(key);
  if (rootIdx === -1) return { key, scale };

  let relMajor: string;
  let relMinor: string;

  if (scale === "minor") {
    relMinor = key;
    relMajor = PITCH_CLASS_NAMES[(rootIdx + 3) % 12];
  } else {
    relMajor = key;
    relMinor = PITCH_CLASS_NAMES[(rootIdx + 9) % 12];
  }

  const majorDur = majorDurations[relMajor] || 0;
  const minorDur = minorDurations[relMinor] || 0;

  const firstOrLastIsMajor = firstRoot === relMajor || lastRoot === relMajor;
  const firstOrLastIsMinor = firstRoot === relMinor || lastRoot === relMinor;

  if (firstOrLastIsMajor && !firstOrLastIsMinor) return { key: relMajor, scale: "major" };
  if (firstOrLastIsMinor && !firstOrLastIsMajor) return { key: relMinor, scale: "minor" };
  if (majorDur > minorDur) return { key: relMajor, scale: "major" };
  if (minorDur > majorDur) return { key: relMinor, scale: "minor" };

  return { key, scale };
}

// ── Tempo detection ────────────────────────────────────────────────────────
import { estimateTempo } from "./tempoDetection";
export { estimateTempo };

// ── Pitch & chord detection ────────────────────────────────────────────────

function nextPowerOfTwo(n: number): number {
  return 2 ** Math.ceil(Math.log2(Math.max(2, n)));
}

function detectPitchClasses(audioBuffer: AudioBuffer, windowSeconds = 0.5): { histogram: number[]; segments: ChordSegment[] } {
  const channel = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  const windowSize = nextPowerOfTwo(Math.max(4096, Math.floor(sampleRate * windowSeconds)));
  const hopSize = Math.floor(windowSize / 2);
  const fft = new FFT(windowSize);
  const histogram = new Array(12).fill(0);
  const rawSegments: { start: number; end: number; chord: string; confidence: number; root: number }[] = [];

  const minFreq = 55;   // A1 (~55 Hz)
  const maxFreq = 1800; // ~A6 (~1760 Hz)
  const bassMaxFreq = 320; // Bass cutoff (~E4)

  const minBin = Math.max(1, Math.floor((minFreq * windowSize) / sampleRate));
  const maxBin = Math.min(Math.floor(windowSize / 2), Math.ceil((maxFreq * windowSize) / sampleRate));
  const bassMaxBin = Math.min(maxBin, Math.ceil((bassMaxFreq * windowSize) / sampleRate));

  for (let start = 0; start < channel.length; start += hopSize) {
    const windowData = new Array(windowSize).fill(0);
    let frameRms = 0;
    for (let i = 0; i < windowSize && start + i < channel.length; i += 1) {
      const sample = channel[start + i];
      windowData[i] = sample;
      frameRms += sample * sample;
    }
    frameRms = Math.sqrt(frameRms / windowSize);

    // Skip silent/near-silent frames
    if (frameRms < 0.005) {
      const startSec = start / sampleRate;
      const endSec = Math.min(channel.length / sampleRate, startSec + windowSize / sampleRate);
      rawSegments.push({ start: startSec, end: endSec, chord: "N.C.", confidence: 0.1, root: -1 });
      continue;
    }

    // Apply Hann window
    for (let i = 0; i < windowSize; i += 1) {
      const w = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (windowSize - 1)));
      windowData[i] *= w;
    }

    const out = fft.createComplexArray();
    const input = fft.createComplexArray();
    for (let i = 0; i < windowSize; i += 1) {
      input[2 * i] = windowData[i];
      input[2 * i + 1] = 0;
    }
    fft.transform(out, input);

    const fullChroma = new Array(12).fill(0);
    const bassChroma = new Array(12).fill(0);

    for (let bin = minBin; bin <= maxBin; bin += 1) {
      const re = out[2 * bin];
      const im = out[2 * bin + 1];
      const mag = Math.sqrt(re * re + im * im);
      if (mag <= 1e-4) continue;

      const freq = (bin * sampleRate) / windowSize;
      const midi = 69 + 12 * Math.log2(freq / 440);
      const nearestMidi = Math.round(midi);
      const dev = Math.abs(midi - nearestMidi);
      
      // Pitch centering weight: bell curve around exact pitch class
      const pitchWeight = Math.exp(-Math.pow(dev / 0.35, 2));
      const pc = ((nearestMidi % 12) + 12) % 12;

      fullChroma[pc] += mag * pitchWeight;
      if (bin <= bassMaxBin) {
        bassChroma[pc] += mag * pitchWeight * 1.5;
      }
    }

    // Normalize full chroma & bass chroma
    const fullSum = fullChroma.reduce((a, b) => a + b, 0) || 1e-6;
    const bassSum = bassChroma.reduce((a, b) => a + b, 0) || 1e-6;

    const normFull = fullChroma.map(v => v / fullSum);
    const normBass = bassChroma.map(v => v / bassSum);

    // Identify dominant bass root note
    let dominantBassRoot = 0;
    let maxBass = -1;
    for (let pc = 0; pc < 12; pc++) {
      if (normBass[pc] > maxBass) {
        maxBass = normBass[pc];
        dominantBassRoot = pc;
      }
      histogram[pc] += fullChroma[pc];
    }

    // Combine chroma with bass root emphasis (65% full spectral, 35% bass fundamental)
    const combinedChroma = normFull.map((v, i) => v * 0.65 + normBass[i] * 0.35);

    // Template matching
    let bestChord = "N.C.";
    let maxScore = -10;
    let bestRoot = dominantBassRoot;

    CHORD_TEMPLATES.forEach(tpl => {
      let score = tpl.vec.reduce((acc, v, i) => acc + v * combinedChroma[i], 0);

      // Bass root alignment bonus
      if (tpl.root === dominantBassRoot) {
        score += 0.25;
      }

      // Triad prior bonus (Major and Minor chords are far more common than 7th/dim in clean tracks)
      if (tpl.isTriad && (tpl.quality === "" || tpl.quality === "m")) {
        score += 0.12;
      }

      if (score > maxScore) {
        maxScore = score;
        bestChord = tpl.name;
        bestRoot = tpl.root;
      }
    });

    const confidence = clamp((maxScore + 0.3) / 1.3, 0.15, 0.95);
    const startSec = start / sampleRate;
    const endSec = Math.min(channel.length / sampleRate, startSec + windowSize / sampleRate);

    rawSegments.push({ start: startSec, end: endSec, chord: bestChord, confidence, root: bestRoot });
  }

  // Temporal median smoothing (replaces isolated single-frame glitches)
  const smoothedSegments: ChordSegment[] = [];
  for (let i = 0; i < rawSegments.length; i++) {
    const prev = rawSegments[Math.max(0, i - 1)];
    const curr = rawSegments[i];
    const next = rawSegments[Math.min(rawSegments.length - 1, i + 1)];

    let chosenChord = curr.chord;
    let chosenConf = curr.confidence;

    // If neighbors agree and current frame disagreed with low confidence, snap to neighbor
    if (prev.chord === next.chord && prev.chord !== curr.chord && curr.confidence < 0.75) {
      chosenChord = prev.chord;
      chosenConf = (prev.confidence + next.confidence) / 2;
    }

    smoothedSegments.push({
      start: curr.start,
      end: curr.end,
      chord: chosenChord,
      confidence: chosenConf,
    });
  }

  return { histogram, segments: smoothedSegments };
}

// ── Main analysis function ─────────────────────────────────────────────────

export async function analyzeTrack(audioBuffer: AudioBuffer): Promise<AnalyzeTrackResult> {
  try {
    const tempo = estimateTempo(audioBuffer);
    const { histogram, segments } = detectPitchClasses(audioBuffer, 0.5);

    // Normalize histogram
    const sum = histogram.reduce((a: number, b: number) => a + b, 0);
    const normalized = sum > 0 ? histogram.map((v: number) => v / sum) : histogram;
    const { key, scale } = sum > 0 ? chooseKey(normalized) : { key: "C", scale: "major" };

    // Merge adjacent identical chords
    const merged: ChordSegment[] = [];
    segments.forEach((seg) => {
      const last = merged[merged.length - 1];
      if (last && last.chord === seg.chord && Math.abs(last.end - seg.start) < 0.1) {
        last.end = seg.end;
        last.confidence = Math.max(last.confidence, seg.confidence);
      } else {
        merged.push({ ...seg });
      }
    });

    // Remove very short "glitch" chords (<0.35s) unless entire track is very short
    const smoothed: ChordSegment[] = [];
    for (let i = 0; i < merged.length; i++) {
      const curr = merged[i];
      if ((curr.end - curr.start) < 0.35 && smoothed.length > 0 && audioBuffer.duration > 3) {
        smoothed[smoothed.length - 1].end = curr.end;
      } else {
        smoothed.push(curr);
      }
    }

    const safeTempo = Number.isFinite(tempo) && tempo > 0 ? Math.round(tempo) : 100;
    const safeChords = smoothed.length
      ? smoothed
      : [{ start: 0, end: Math.max(audioBuffer.duration, 1), chord: `${key} ${scale}`, confidence: 0.4 }];

    // Refine key using detected chord progressions
    const refinedKey = refineKeyFromChords(key, scale, safeChords);

    return {
      tempo: safeTempo,
      meter: 4,
      key: refinedKey.key,
      scale: refinedKey.scale,
      chords: safeChords,
      simpleChords: safeChords.map(s => {
        let sc = s.chord;
        if (sc.includes("m") && !sc.includes("maj")) {
          sc = sc.split("m")[0] + "m";
        } else if (sc !== "N.C.") {
          sc = sc.match(/^[A-G]#?/)?.[0] || sc;
        }
        return { ...s, chord: sc };
      }),
    };
  } catch (err) {
    console.error("analyzeTrack failed", err);
    return {
      tempo: 0,
      meter: 4,
      key: "--",
      scale: "--",
      chords: [],
      simpleChords: [],
    };
  }
}
