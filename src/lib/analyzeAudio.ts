/**
 * src/lib/analyzeAudio.ts
 *
 * Local/client-side fallback audio analysis — runs entirely in the browser.
 *
 * Used when the backend is unavailable (sleeping, offline, or errored).
 * Provides ~60-65% chord accuracy via FFT + template matching — lower than
 * the ONNX model but good enough for an instant offline fallback.
 *
 * Pipeline:
 *   1. Autocorrelation-based tempo detection with harmonic weighting
 *   2. FFT-based pitch class extraction with Hann windowing
 *   3. Cosine similarity template matching (96 templates: 12 roots × 8 qualities)
 *   4. Krumhansl-Schmuckler key finding
 *   5. Segment merging and glitch removal
 */

import FFT from "fft.js";
import { AnalysisResult, ChordSegment } from "@/types/chordAI";

// ── Constants ──────────────────────────────────────────────────────────────

const PITCH_CLASS_NAMES = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
];

// Krumhansl-Schmuckler key profiles (public domain cognitive science profiles)
const MAJOR_PROFILE = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR_PROFILE = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

// Build chord templates: 12 roots × 8 qualities = 96 templates
const CHORD_TEMPLATES: { name: string; vec: number[] }[] = [];
for (let root = 0; root < 12; root++) {
  const types: Record<string, number[]> = {
    "": [0, 4, 7],       // major
    "m": [0, 3, 7],      // minor
    "7": [0, 4, 7, 10],  // dominant 7
    "maj7": [0, 4, 7, 11], // major 7
    "m7": [0, 3, 7, 10], // minor 7
    "dim": [0, 3, 6],    // diminished
    "sus2": [0, 2, 7],   // sus2
    "sus4": [0, 5, 7],   // sus4
  };
  for (const [suffix, intervals] of Object.entries(types)) {
    const vec = new Array(12).fill(0);
    intervals.forEach((iv, i) => {
      // Weight root and quality defining third higher
      vec[(root + iv) % 12] = (i === 0) ? 1.0 : (iv === 3 || iv === 4) ? 0.95 : 0.85;
    });
    // Negative penalty for direct minor/major third confusion
    if (suffix === "" || suffix === "7" || suffix === "maj7") {
      vec[(root + 3) % 12] = -0.35; // Penalize minor 3rd in major chord
    } else if (suffix === "m" || suffix === "m7") {
      vec[(root + 4) % 12] = -0.35; // Penalize major 3rd in minor chord
    }
    const norm = Math.sqrt(vec.reduce((a, b) => a + b * b, 0));
    CHORD_TEMPLATES.push({
      name: PITCH_CLASS_NAMES[root] + suffix,
      vec: vec.map(v => v / (norm + 1e-9)),
    });
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

export type AnalyzeTrackResult = AnalysisResult;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function frequencyToPitchClass(freq: number): number {
  if (freq <= 0) return 0;
  const midi = 69 + 12 * Math.log2(freq / 440);
  return ((Math.round(midi) % 12) + 12) % 12;
}

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

function computeEnergyEnvelope(audioBuffer: AudioBuffer, hopSeconds = 0.01): number[] {
  const channel = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  const frameSize = Math.max(64, Math.floor(sampleRate * hopSeconds));
  const frames: number[] = [];
  for (let i = 0; i < channel.length; i += frameSize) {
    let sum = 0;
    const end = Math.min(i + frameSize, channel.length);
    for (let j = i; j < end; j++) {
      sum += channel[j] * channel[j];
    }
    frames.push(Math.sqrt(sum / (end - i)));
  }
  return frames;
}

function estimateTempo(audioBuffer: AudioBuffer): number {
  const HOP_SECONDS = 0.01;
  const envelope = computeEnergyEnvelope(audioBuffer, HOP_SECONDS);
  const n = envelope.length;

  if (n < 2) return 0;

  const maxEnv = Math.max(...envelope);
  if (maxEnv < 1e-5) return 0;

  // First-order positive difference (onset strength signal)
  const odf: number[] = new Array(n).fill(0);
  for (let i = 1; i < n; i++) {
    odf[i] = Math.max(0, envelope[i] - envelope[i - 1]);
  }

  // Autocorrelation over BPM range [55, 215]
  const minBpm = 55;
  const maxBpm = 215;
  const minLag = Math.floor(60 / (maxBpm * HOP_SECONDS));
  const maxLag = Math.ceil(60 / (minBpm * HOP_SECONDS));

  const maxFrames = Math.min(n, Math.round(90 / HOP_SECONDS));

  const acf: number[] = new Array(maxLag + 1).fill(0);
  const energy = odf.slice(0, maxFrames).reduce((s, v) => s + v * v, 0);
  if (energy < 1e-12) return 0;

  for (let lag = minLag; lag <= maxLag; lag++) {
    let sum = 0;
    for (let i = 0; i < maxFrames - lag; i++) {
      sum += odf[i] * odf[i + lag];
    }
    acf[lag] = sum / energy;
  }

  // Harmonic weighting (helps choose correct tempo octave)
  const weighted: number[] = [...acf];
  for (let lag = minLag; lag <= maxLag; lag++) {
    const halfLag = Math.round(lag / 2);
    const doubleLag = lag * 2;
    if (halfLag >= minLag) weighted[lag] += 0.5 * acf[halfLag];
    if (doubleLag <= maxLag) weighted[lag] += 0.25 * acf[doubleLag];
  }

  let bestLag = minLag;
  let bestScore = -Infinity;
  for (let lag = minLag; lag <= maxLag; lag++) {
    if (weighted[lag] > bestScore) {
      bestScore = weighted[lag];
      bestLag = lag;
    }
  }

  const rawBpm = 60 / (bestLag * HOP_SECONDS);

  // Octave correction: prefer [75, 165] range
  let bpm = rawBpm;
  if (bpm < 75 && bpm * 2 <= 165) bpm *= 2;
  else if (bpm > 165 && bpm / 2 >= 75) bpm /= 2;

  return clamp(Math.round(bpm), 55, 215);
}

// ── Pitch & chord detection ────────────────────────────────────────────────

function nextPowerOfTwo(n: number): number {
  return 2 ** Math.ceil(Math.log2(Math.max(2, n)));
}

function detectPitchClasses(audioBuffer: AudioBuffer, windowSeconds = 0.75): { histogram: number[]; segments: ChordSegment[] } {
  const channel = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  const windowSize = nextPowerOfTwo(Math.max(2048, Math.floor(sampleRate * windowSeconds)));
  const hopSize = Math.floor(windowSize / 2);
  const fft = new FFT(windowSize);
  const histogram = new Array(12).fill(0);
  const segments: ChordSegment[] = [];

  for (let start = 0; start < channel.length; start += hopSize) {
    const window = new Array(windowSize).fill(0);
    for (let i = 0; i < windowSize && start + i < channel.length; i += 1) {
      window[i] = channel[start + i];
    }

    // Apply Hann window to reduce spectral leakage
    for (let i = 0; i < windowSize; i += 1) {
      const w = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (windowSize - 1)));
      window[i] *= w;
    }

    const out = fft.createComplexArray();
    const input = fft.createComplexArray();
    for (let i = 0; i < windowSize; i += 1) {
      input[2 * i] = window[i];
      input[2 * i + 1] = 0;
    }
    fft.transform(out, input);

    const magnitudes: number[] = [];
    for (let i = 0; i < windowSize / 2; i += 1) {
      const re = out[2 * i];
      const im = out[2 * i + 1];
      magnitudes.push(Math.sqrt(re * re + im * im));
    }

    // Pick top peaks
    const peakCount = 6;
    const peaks: { bin: number; mag: number }[] = [];
    for (let bin = 1; bin < magnitudes.length - 1; bin += 1) {
      const m = magnitudes[bin];
      if (m > magnitudes[bin - 1] && m > magnitudes[bin + 1]) {
        peaks.push({ bin, mag: m });
      }
    }
    peaks.sort((a, b) => b.mag - a.mag);
    const selected = peaks.slice(0, peakCount);

    const pitchClassesArr = new Array(12).fill(0);
    selected.forEach(({ bin, mag }) => {
      const freq = (bin * sampleRate) / windowSize;
      const pc = frequencyToPitchClass(freq);
      pitchClassesArr[pc] += mag;
      histogram[pc] += mag;
    });

    // Template matching
    let bestChord = "N.C.";
    let maxScore = -1;

    const pcSum = pitchClassesArr.reduce((a: number, b: number) => a + b, 0);
    if (pcSum > 0.05) {
      const pcNorm = pitchClassesArr.map((v: number) => v / pcSum);
      CHORD_TEMPLATES.forEach(tpl => {
        const score = tpl.vec.reduce((acc, v, i) => acc + v * pcNorm[i], 0);
        if (score > maxScore) {
          maxScore = score;
          bestChord = tpl.name;
        }
      });
    }

    const confidence = clamp(maxScore, 0, 1);
    const startSec = start / sampleRate;
    const endSec = Math.min(channel.length / sampleRate, startSec + windowSize / sampleRate);

    segments.push({ start: startSec, end: endSec, chord: bestChord, confidence });
  }

  return { histogram, segments };
}

// ── Main analysis function ─────────────────────────────────────────────────

export async function analyzeTrack(audioBuffer: AudioBuffer): Promise<AnalyzeTrackResult> {
  try {
    const tempo = estimateTempo(audioBuffer);
    const { histogram, segments } = detectPitchClasses(audioBuffer, 0.75);

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

    // Remove very short "glitch" chords (<0.2s)
    const smoothed: ChordSegment[] = [];
    for (let i = 0; i < merged.length; i++) {
      const curr = merged[i];
      if ((curr.end - curr.start) < 0.2 && smoothed.length > 0) {
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
