/**
 * src/lib/tempoDetection.ts
 *
 * Advanced DSP Tempo & BPM Detection Engine for Web Audio.
 *
 * Pipeline:
 *  1. Multi-band onset detection (Sub-bass/Kick [30-220Hz] + Mid-band percussion/slaps [220-3500Hz])
 *  2. Logarithmic energy compression (Weber-Fechner psychoacoustic scaling)
 *  3. Autocorrelation & Multi-Harmonic Resonant Comb Filter
 *  4. Dynamic Programming Beat Grid Alignment (Ellis-style beat consistency verification)
 *  5. Octave & Metric Disambiguation (e.g. 75 BPM vs 150 BPM vs 50 BPM)
 */

export interface AudioDataLike {
  getChannelData(channel: number): Float32Array;
  sampleRate: number;
  duration: number;
}

interface TempoOptions {
  minBpm?: number;
  maxBpm?: number;
  targetDurationSeconds?: number;
}

/**
 * 2nd-order Direct Form II IIR Biquad filter implementation for raw Float32Array.
 */
function applyBiquadFilter(
  input: Float32Array,
  b0: number, b1: number, b2: number,
  a1: number, a2: number
): Float32Array {
  const output = new Float32Array(input.length);
  let v1 = 0;
  let v2 = 0;

  for (let i = 0; i < input.length; i++) {
    const x = input[i];
    const v0 = x - a1 * v1 - a2 * v2;
    output[i] = b0 * v0 + b1 * v1 + b2 * v2;
    v2 = v1;
    v1 = v0;
  }

  return output;
}

/**
 * Low-pass Butterworth filter coefficient generator.
 */
function createLowPassCoeffs(cutoffHz: number, sampleRate: number) {
  const w0 = (2 * Math.PI * cutoffHz) / sampleRate;
  const alpha = Math.sin(w0) / (2 * Math.SQRT2);
  const cosW0 = Math.cos(w0);

  const a0 = 1 + alpha;
  const a1 = (-2 * cosW0) / a0;
  const a2 = (1 - alpha) / a0;

  const b1 = (1 - cosW0) / a0;
  const b0 = b1 / 2;
  const b2 = b0;

  return { b0, b1, b2, a1, a2 };
}

/**
 * Band-pass Butterworth filter coefficient generator.
 */
function createBandPassCoeffs(fCenter: number, q: number, sampleRate: number) {
  const w0 = (2 * Math.PI * fCenter) / sampleRate;
  const alpha = Math.sin(w0) / (2 * q);
  const cosW0 = Math.cos(w0);

  const a0 = 1 + alpha;
  const a1 = (-2 * cosW0) / a0;
  const a2 = (1 - alpha) / a0;

  const b0 = alpha / a0;
  const b1 = 0;
  const b2 = -b0;

  return { b0, b1, b2, a1, a2 };
}

/**
 * Computes logarithmic energy onset detection function (ODF) with perceptual compression.
 */
function computeBandODF(
  signal: Float32Array,
  sampleRate: number,
  hopSeconds: number = 0.01
): Float32Array {
  const frameSize = Math.max(32, Math.floor(sampleRate * hopSeconds));
  const numFrames = Math.floor(signal.length / frameSize);
  const logEnvelope = new Float32Array(numFrames);

  // Compute short-term RMS energy with logarithmic perceptual compression
  for (let f = 0; f < numFrames; f++) {
    let sum = 0;
    const start = f * frameSize;
    const end = Math.min(start + frameSize, signal.length);
    for (let i = start; i < end; i++) {
      sum += signal[i] * signal[i];
    }
    const rms = Math.sqrt(sum / (end - start + 1e-9));
    logEnvelope[f] = Math.log1p(60 * rms);
  }

  // Half-wave rectified 1st-order forward difference (onset strength)
  const odf = new Float32Array(numFrames);
  for (let f = 1; f < numFrames; f++) {
    const diff = logEnvelope[f] - logEnvelope[f - 1];
    odf[f] = diff > 0 ? diff : 0;
  }

  // Local adaptive thresholding / moving average normalization
  const windowRadius = 15;
  const normalizedOdf = new Float32Array(numFrames);
  for (let f = 0; f < numFrames; f++) {
    const wStart = Math.max(0, f - windowRadius);
    const wEnd = Math.min(numFrames, f + windowRadius + 1);
    let mean = 0;
    for (let j = wStart; j < wEnd; j++) {
      mean += odf[j];
    }
    mean /= (wEnd - wStart);
    normalizedOdf[f] = Math.max(0, odf[f] - mean);
  }

  return normalizedOdf;
}

/**
 * Evaluates how consistently the actual onset pulses land on a regular beat grid of period `lag`.
 * Tests multiple phase offsets to find optimal downbeat alignment.
 */
function evaluateBeatAlignment(odf: Float32Array, lag: number): number {
  const numFrames = odf.length;
  if (numFrames < lag * 2) return 0.5;

  const numPhases = 8;
  let maxScore = 0;

  for (let p = 0; p < numPhases; p++) {
    const phase = Math.floor((p * lag) / numPhases);
    let sum = 0;
    let count = 0;

    let beatIdx = 0;
    while (true) {
      const f = Math.round(phase + beatIdx * lag);
      if (f >= numFrames) break;

      let localMax = odf[f];
      if (f > 0 && odf[f - 1] > localMax) localMax = odf[f - 1];
      if (f + 1 < numFrames && odf[f + 1] > localMax) localMax = odf[f + 1];
      if (f > 1 && odf[f - 2] > localMax) localMax = odf[f - 2];
      if (f + 2 < numFrames && odf[f + 2] > localMax) localMax = odf[f + 2];

      sum += localMax;
      count++;
      beatIdx++;
    }

    const score = count > 0 ? sum / count : 0;
    if (score > maxScore) maxScore = score;
  }

  return maxScore;
}

/**
 * Parabolic peak interpolation around index i.
 */
function parabolicInterpolation(array: number[] | Float32Array, i: number): { index: number; value: number } {
  if (i <= 0 || i >= array.length - 1) {
    return { index: i, value: array[i] };
  }
  const alpha = array[i - 1];
  const beta = array[i];
  const gamma = array[i + 1];

  const delta = (0.5 * (alpha - gamma)) / (alpha - 2 * beta + gamma + 1e-12);
  const peakVal = beta - 0.25 * (alpha - gamma) * delta;

  return {
    index: i + delta,
    value: peakVal,
  };
}

/**
 * Estimate Tempo (BPM) from an AudioBuffer or AudioDataLike object.
 */
export function estimateTempo(
  audioBuffer: AudioDataLike,
  options?: TempoOptions
): number {
  const minBpm = options?.minBpm ?? 52;
  const maxBpm = options?.maxBpm ?? 210;
  const targetDuration = options?.targetDurationSeconds ?? 90;

  const rawChannel = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;

  if (!rawChannel || rawChannel.length < sampleRate * 1.5) {
    return 100;
  }

  // Limit processing window to the target duration (first 90s for speed & high accuracy)
  const maxSamples = Math.min(rawChannel.length, Math.floor(sampleRate * targetDuration));
  const channel = rawChannel.subarray(0, maxSamples);

  // Band 1: Sub-bass & Bass pulse (Kick drum, 808s, Bass guitar: ~30Hz - 220Hz)
  const lp = createLowPassCoeffs(220, sampleRate);
  const bassFiltered = applyBiquadFilter(channel, lp.b0, lp.b1, lp.b2, lp.a1, lp.a2);

  // Band 2: Mid percussion (Snare, claps, hi-hat onsets, guitar slaps: ~250Hz - 3500Hz)
  const bp = createBandPassCoeffs(1200, 1.2, sampleRate);
  const midFiltered = applyBiquadFilter(channel, bp.b0, bp.b1, bp.b2, bp.a1, bp.a2);

  const HOP_SECONDS = 0.01; // 10ms frame resolution (100 fps)
  const odfBass = computeBandODF(bassFiltered, sampleRate, HOP_SECONDS);
  const odfMid = computeBandODF(midFiltered, sampleRate, HOP_SECONDS);

  const nFrames = Math.min(odfBass.length, odfMid.length);
  if (nFrames < 120) return 100;

  // Combined weighted multi-band onset curve (55% Bass pulse, 45% Mid onsets)
  const combinedOdf = new Float32Array(nFrames);
  let totalEnergy = 0;
  for (let i = 0; i < nFrames; i++) {
    const val = 0.55 * odfBass[i] + 0.45 * odfMid[i];
    combinedOdf[i] = val;
    totalEnergy += val * val;
  }

  if (totalEnergy < 1e-9) {
    return 100;
  }

  // Lag ranges for 1-beat period:
  const minLag = Math.floor(60 / (maxBpm * HOP_SECONDS)); // ~28 frames for 210 BPM
  const maxLag = Math.ceil(60 / (minBpm * HOP_SECONDS));  // ~115 frames for 52 BPM

  // Extended lag space for multi-harmonic comb filtering (up to 4 harmonics)
  const maxExtendedLag = Math.min(nFrames - 1, maxLag * 4 + 10);

  // Compute Autocorrelation over extended lag space
  const acf = new Float32Array(maxExtendedLag + 1);
  for (let lag = 1; lag <= maxExtendedLag; lag++) {
    let sum = 0;
    const len = nFrames - lag;
    for (let i = 0; i < len; i++) {
      sum += combinedOdf[i] * combinedOdf[i + lag];
    }
    acf[lag] = sum / (len + 1e-9);
  }

  // Normalize autocorrelation
  let maxAcf = 0;
  for (let lag = minLag; lag <= maxExtendedLag; lag++) {
    if (acf[lag] > maxAcf) maxAcf = acf[lag];
  }
  if (maxAcf > 0) {
    for (let lag = 1; lag <= maxExtendedLag; lag++) {
      acf[lag] /= maxAcf;
    }
  }

  // Multi-Harmonic Resonant Comb Filter:
  // C(lag) = R(lag) + 0.50 * R(2*lag) + 0.25 * R(3*lag) + 0.125 * R(4*lag)
  const combScores = new Float32Array(maxLag + 1);
  const harmonicWeights = [1.0, 0.50, 0.25, 0.125];

  for (let lag = minLag; lag <= maxLag; lag++) {
    let score = 0;
    for (let h = 0; h < harmonicWeights.length; h++) {
      const hLag = Math.round(lag * (h + 1));
      if (hLag <= maxExtendedLag) {
        score += harmonicWeights[h] * acf[hLag];
      }
    }
    combScores[lag] = score;
  }

  // Find candidate local peaks in the physical comb correlation curve
  interface Candidate {
    lag: number;
    interpolatedLag: number;
    score: number;
    bpm: number;
    beatAlignment: number;
    finalScore: number;
  }

  const candidates: Candidate[] = [];
  for (let lag = minLag + 1; lag < maxLag; lag++) {
    if (combScores[lag] > combScores[lag - 1] && combScores[lag] >= combScores[lag + 1]) {
      const { index: interpLag, value: score } = parabolicInterpolation(combScores, lag);
      const bpm = 60 / (interpLag * HOP_SECONDS);
      if (bpm >= minBpm && bpm <= maxBpm) {
        // Evaluate dynamic beat grid alignment
        const beatAlignment = evaluateBeatAlignment(combinedOdf, interpLag);

        // Rank candidate purely by comb harmonic resonance and dynamic beat grid alignment
        const finalScore = score * (0.25 + 0.75 * beatAlignment);

        candidates.push({
          lag,
          interpolatedLag: interpLag,
          score,
          bpm,
          beatAlignment,
          finalScore,
        });
      }
    }
  }

  if (candidates.length === 0) {
    let bestLag = minLag;
    let maxScore = -Infinity;
    for (let lag = minLag; lag <= maxLag; lag++) {
      if (combScores[lag] > maxScore) {
        maxScore = combScores[lag];
        bestLag = lag;
      }
    }
    return Math.round(60 / (bestLag * HOP_SECONDS));
  }

  // Sort candidates by finalScore descending
  candidates.sort((a, b) => b.finalScore - a.finalScore);

  const bestCandidate = candidates[0];

  // Metric & Tactus Disambiguation:
  // 1. If top candidate is very slow (<= 68 BPM), check if its octave double (e.g. 60 -> 120 BPM) or 1.5x (e.g. 50 -> 75 BPM) is present
  if (bestCandidate.bpm <= 68) {
    const target20 = bestCandidate.bpm * 2;
    const match20 = candidates.find(c => Math.abs(c.bpm - target20) < 3.5);
    if (match20 && match20.finalScore >= bestCandidate.finalScore * 0.65) {
      return Math.round(match20.bpm);
    }
    const target15 = bestCandidate.bpm * 1.5;
    const match15 = candidates.find(c => Math.abs(c.bpm - target15) < 3.5);
    if (match15 && match15.finalScore >= bestCandidate.finalScore * 0.65) {
      return Math.round(match15.bpm);
    }
  }

  // 2. If top candidate is double-time (>= 145 BPM, e.g. 150 BPM -> 75 BPM)
  const halfBpm = bestCandidate.bpm / 2;
  if (bestCandidate.bpm >= 145 && halfBpm >= minBpm) {
    const halfMatch = candidates.find(c => Math.abs(c.bpm - halfBpm) < 3.5);
    if (halfMatch && halfMatch.finalScore >= bestCandidate.finalScore * 0.55) {
      return Math.round(halfMatch.bpm);
    }
  }

  return Math.round(bestCandidate.bpm);
}
