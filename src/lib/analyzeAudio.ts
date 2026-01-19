import FFT from "fft.js";
import { AnalysisResult, ChordSegment } from "@/types/chordAI";

// Map pitch class index to note names used by tonal
const PITCH_CLASS_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

// Krumhansl-Schmuckler key profiles (normalized) for a quick key guess
const MAJOR_PROFILE = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR_PROFILE = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

const CHORD_TEMPLATES: { name: string; vec: number[] }[] = [];
for (let root = 0; root < 12; root++) {
  const types: Record<string, number[]> = {
    "": [0, 4, 7],
    "m": [0, 3, 7],
    "7": [0, 4, 7, 10],
    "maj7": [0, 4, 7, 11],
    "m7": [0, 3, 7, 10],
    "dim": [0, 3, 6],
    "sus2": [0, 2, 7],
    "sus4": [0, 5, 7],
  };
  for (const [suffix, intervals] of Object.entries(types)) {
    const vec = new Array(12).fill(0);
    intervals.forEach(iv => {
      vec[(root + iv) % 12] = 1.0;
      // Harmonics
      vec[(root + iv + 7) % 12] += 0.1;
    });
    // Bias root
    vec[root] += 0.2;
    // Normalize
    const norm = Math.sqrt(vec.reduce((a, b) => a + b * b, 0));
    CHORD_TEMPLATES.push({
      name: PITCH_CLASS_NAMES[root] + suffix,
      vec: vec.map(v => v / (norm + 1e-9)),
    });
  }
}

export type AnalyzeTrackResult = AnalysisResult;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function frequencyToPitchClass(freq: number): number {
  if (freq <= 0) return 0;
  const midi = 69 + 12 * Math.log2(freq / 440);
  return ((Math.round(midi) % 12) + 12) % 12;
}

function chooseKey(pitchHistogram: number[]): { key: string; scale: string } {
  const rotate = (arr: number[], n: number) => arr.slice(n).concat(arr.slice(0, n));
  let best: { key: string; scale: string; score: number } = { key: "C", scale: "major", score: -Infinity };

  for (let tonic = 0; tonic < 12; tonic += 1) {
    const majorScore = rotate(MAJOR_PROFILE, tonic).reduce((acc, v, idx) => acc + v * pitchHistogram[idx], 0);
    if (majorScore > best.score) {
      best = { key: PITCH_CLASS_NAMES[tonic], scale: "major", score: majorScore };
    }
    const minorScore = rotate(MINOR_PROFILE, tonic).reduce((acc, v, idx) => acc + v * pitchHistogram[idx], 0);
    if (minorScore > best.score) {
      best = { key: PITCH_CLASS_NAMES[tonic], scale: "minor", score: minorScore };
    }
  }

  return { key: best.key, scale: best.scale };
}

function computeEnergyEnvelope(audioBuffer: AudioBuffer, frameSeconds = 0.05): number[] {
  const channel = audioBuffer.getChannelData(0);
  const frameSize = Math.max(64, Math.floor(audioBuffer.sampleRate * frameSeconds));
  const frames: number[] = [];
  for (let i = 0; i < channel.length; i += frameSize) {
    let sum = 0;
    for (let j = 0; j < frameSize && i + j < channel.length; j += 1) {
      const v = channel[i + j];
      sum += v * v;
    }
    const rms = Math.sqrt(sum / frameSize);
    frames.push(rms);
  }
  return frames;
}

function estimateTempo(audioBuffer: AudioBuffer): number {
  // Lightweight onset-based tempo estimate with extra guards for quiet files.
  const envelope = computeEnergyEnvelope(audioBuffer, 0.05);
  const maxEnv = Math.max(...envelope, 0);
  if (maxEnv < 1e-4) return 0; // silence or near-silence

  const diff: number[] = [];
  for (let i = 1; i < envelope.length; i += 1) {
    diff.push(Math.max(0, envelope[i] - envelope[i - 1]));
  }

  const threshold = Math.max(0.01, 0.2 * Math.max(...diff, 0));
  const peaks: number[] = [];
  for (let i = 1; i < diff.length - 1; i += 1) {
    if (diff[i] > diff[i - 1] && diff[i] > diff[i + 1] && diff[i] >= threshold) {
      peaks.push(i);
    }
  }

  if (peaks.length < 2) return 0;

  const intervals: number[] = [];
  const hopSeconds = 0.05;
  for (let i = 1; i < peaks.length; i += 1) {
    intervals.push((peaks[i] - peaks[i - 1]) * hopSeconds);
  }

  if (!intervals.length) return 0;

  const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const bpm = 60 / clamp(avg, 0.2, 3); // clamp to a plausible range
  // Normalize to common BPM range (80-180) when reasonable
  if (bpm < 80) return bpm * 2;
  if (bpm > 180) return bpm / 2;
  return bpm;
}

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

  for (let start = 0, idx = 0; start < channel.length; start += hopSize, idx += 1) {
    const window = new Array(windowSize).fill(0);
    for (let i = 0; i < windowSize && start + i < channel.length; i += 1) {
      window[i] = channel[start + i];
    }

    // Apply a Hann window to reduce spectral leakage
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
      const mag = Math.sqrt(re * re + im * im);
      magnitudes.push(mag);
    }

    // Pick top peaks to infer pitch classes
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
    
    // Normalize window pitch classes
    const pcSum = pitchClassesArr.reduce((a, b) => a + b, 0);
    if (pcSum > 0.05) {
      const pcNorm = pitchClassesArr.map(v => v / pcSum);
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

    segments.push({
      start: startSec,
      end: endSec,
      chord: bestChord,
      confidence,
    });
  }

  return { histogram, segments };
}

export async function analyzeTrack(audioBuffer: AudioBuffer): Promise<AnalyzeTrackResult> {
  try {
    // Tempo
    const tempo = estimateTempo(audioBuffer);

    // Pitch classes and chords over time
    const { histogram, segments } = detectPitchClasses(audioBuffer, 0.75);

    // Normalize histogram and guard empty audio
    const sum = histogram.reduce((a, b) => a + b, 0);
    const normalized = sum > 0 ? histogram.map((v) => v / sum) : histogram;
    const { key, scale } = sum > 0 ? chooseKey(normalized) : { key: "C", scale: "major" };

    // Merge adjacent identical chords to simplify timeline
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

    // Remove very short "glitch" chords (less than 0.2s) by absorbing them into neighbors
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

    return {
      tempo: safeTempo,
      meter: 4,
      key,
      scale,
      chords: safeChords,
      simpleChords: safeChords.map(s => {
        let sc = s.chord;
        // Basic simplification logic: keep only root and minor flag
        if (sc.includes("m") && !sc.includes("maj")) {
          sc = sc.split("m")[0] + "m";
        } else if (sc !== "N.C.") {
          // Extract root (handle #)
          sc = sc.match(/^[A-G]#?/)?.[0] || sc;
        }
        return { ...s, chord: sc };
      }),
    };
  } catch (err) {
    console.error("analyzeTrack failed", err);
    // Return a safe fallback instead of throwing so UI can continue
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
