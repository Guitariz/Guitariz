/**
 * Unit tests for advanced DSP Tempo & BPM Detection Engine.
 */

import { describe, it, expect } from "vitest";
import { estimateTempo, AudioDataLike } from "../lib/tempoDetection";

/**
 * Creates a synthetic metronome pulse train AudioDataLike object.
 */
function createSyntheticRhythmAudio(
  targetBpm: number,
  durationSeconds: number = 10,
  sampleRate: number = 44100
): AudioDataLike {
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const data = new Float32Array(numSamples);
  const beatIntervalSeconds = 60 / targetBpm;
  const beatIntervalSamples = Math.floor(sampleRate * beatIntervalSeconds);

  // Generate percussive transient at each beat interval (kick/snare pulse)
  for (let sample = 0; sample < numSamples; sample += beatIntervalSamples) {
    const pulseLen = Math.min(Math.floor(sampleRate * 0.08), numSamples - sample); // 80ms pulse
    for (let i = 0; i < pulseLen; i++) {
      const t = i / sampleRate;
      // Low-frequency kick decaying sine (65 Hz -> 40 Hz) + high transient click
      const freq = 65 * Math.exp(-t * 30);
      const envelope = Math.exp(-t * 40);
      const val = Math.sin(2 * Math.PI * freq * t) * envelope;
      data[sample + i] += val * 0.8;
    }
  }

  return {
    getChannelData: () => data,
    sampleRate,
    duration: durationSeconds,
  };
}

/**
 * Creates a synthetic acoustic rock song (e.g. Hotel California style: 75 BPM with 8th note acoustic strumming)
 */
function createAcousticRockGrooveAudio(
  targetBpm: number = 75,
  durationSeconds: number = 12,
  sampleRate: number = 44100
): AudioDataLike {
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const data = new Float32Array(numSamples);
  const beatInterval = (60 / targetBpm) * sampleRate;
  const eighthInterval = beatInterval / 2;

  // 1. Eighth note acoustic guitar strums
  for (let sample = 0; sample < numSamples; sample += eighthInterval) {
    const pulseLen = Math.min(Math.floor(sampleRate * 0.05), numSamples - sample);
    for (let i = 0; i < pulseLen; i++) {
      const t = i / sampleRate;
      const noise = (Math.random() * 2 - 1) * Math.exp(-t * 50);
      data[Math.floor(sample) + i] += noise * 0.3;
    }
  }

  // 2. Heavy kick on beats 1 & 3, snare on 2 & 4
  let beatIndex = 0;
  for (let sample = 0; sample < numSamples; sample += beatInterval) {
    const pulseLen = Math.min(Math.floor(sampleRate * 0.1), numSamples - sample);
    const isKick = beatIndex % 2 === 0;
    for (let i = 0; i < pulseLen; i++) {
      const t = i / sampleRate;
      if (isKick) {
        const freq = 75 * Math.exp(-t * 20);
        data[Math.floor(sample) + i] += Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 25) * 0.9;
      } else {
        // Snare
        data[Math.floor(sample) + i] += (Math.random() * 2 - 1) * Math.exp(-t * 35) * 0.7;
      }
    }
    beatIndex++;
  }

  return {
    getChannelData: () => data,
    sampleRate,
    duration: durationSeconds,
  };
}

/**
 * Creates a synthetic Neo-Soul fingerpicked acoustic groove like "Best Part" (75.5 BPM)
 * Features syncopated off-beat chord plucks and thumb slaps on beats 2 & 4.
 */
function createNeoSoulBestPartAudio(
  targetBpm: number = 75.5,
  durationSeconds: number = 14,
  sampleRate: number = 44100
): AudioDataLike {
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const data = new Float32Array(numSamples);
  const beatInterval = (60 / targetBpm) * sampleRate;
  const barInterval = beatInterval * 4;

  for (let bar = 0; bar < numSamples; bar += barInterval) {
    // Beat 1: Bass note pluck (Root D/G)
    const b1 = Math.floor(bar);
    if (b1 < numSamples) {
      for (let i = 0; i < Math.min(4000, numSamples - b1); i++) {
        const t = i / sampleRate;
        data[b1 + i] += Math.sin(2 * Math.PI * 98 * t) * Math.exp(-t * 15) * 0.7;
      }
    }

    // Syncopated chord hit on "and" of 1 (1.5 beats)
    const b1_and = Math.floor(bar + beatInterval * 0.5);
    if (b1_and < numSamples) {
      for (let i = 0; i < Math.min(3000, numSamples - b1_and); i++) {
        const t = i / sampleRate;
        data[b1_and + i] += Math.sin(2 * Math.PI * 294 * t) * Math.exp(-t * 20) * 0.5;
      }
    }

    // Beat 2: Thumb slap percussive click
    const b2 = Math.floor(bar + beatInterval);
    if (b2 < numSamples) {
      for (let i = 0; i < Math.min(2000, numSamples - b2); i++) {
        const t = i / sampleRate;
        data[b2 + i] += (Math.random() * 2 - 1) * Math.exp(-t * 80) * 0.8;
      }
    }

    // Beat 3: Bass note pluck
    const b3 = Math.floor(bar + beatInterval * 2);
    if (b3 < numSamples) {
      for (let i = 0; i < Math.min(4000, numSamples - b3); i++) {
        const t = i / sampleRate;
        data[b3 + i] += Math.sin(2 * Math.PI * 110 * t) * Math.exp(-t * 15) * 0.7;
      }
    }

    // Beat 4: Thumb slap percussive click
    const b4 = Math.floor(bar + beatInterval * 3);
    if (b4 < numSamples) {
      for (let i = 0; i < Math.min(2000, numSamples - b4); i++) {
        const t = i / sampleRate;
        data[b4 + i] += (Math.random() * 2 - 1) * Math.exp(-t * 80) * 0.8;
      }
    }
  }

  return {
    getChannelData: () => data,
    sampleRate,
    duration: durationSeconds,
  };
}

describe("Advanced Tempo & BPM Detection Engine", () => {
  it("accurately detects a slow 70 BPM track without octave doubling", () => {
    const audio = createSyntheticRhythmAudio(70, 12);
    const bpm = estimateTempo(audio);
    expect(bpm).toBeGreaterThanOrEqual(68);
    expect(bpm).toBeLessThanOrEqual(72);
  });

  it("accurately detects Hotel California style acoustic rock groove at 75 BPM", () => {
    const audio = createAcousticRockGrooveAudio(75, 15);
    const bpm = estimateTempo(audio);
    expect(bpm).toBeGreaterThanOrEqual(73);
    expect(bpm).toBeLessThanOrEqual(77);
  });

  it("accurately detects Best Part by Daniel Caesar (neo-soul syncopated fingerpicking) at 75-76 BPM", () => {
    const audio = createNeoSoulBestPartAudio(75.5, 14);
    const bpm = estimateTempo(audio);
    // Must be 75-76 BPM, NEVER 98 BPM or 150 BPM!
    expect(bpm).toBeGreaterThanOrEqual(74);
    expect(bpm).toBeLessThanOrEqual(77);
  });

  it("accurately detects a standard 120 BPM track", () => {
    const audio = createSyntheticRhythmAudio(120, 10);
    const bpm = estimateTempo(audio);
    expect(bpm).toBeGreaterThanOrEqual(118);
    expect(bpm).toBeLessThanOrEqual(122);
  });

  it("accurately detects an 85 BPM track", () => {
    const audio = createSyntheticRhythmAudio(85, 12);
    const bpm = estimateTempo(audio);
    expect(bpm).toBeGreaterThanOrEqual(83);
    expect(bpm).toBeLessThanOrEqual(87);
  });

  it("handles short audio buffers gracefully with fallback", () => {
    const shortAudio: AudioDataLike = {
      getChannelData: () => new Float32Array(100),
      sampleRate: 44100,
      duration: 0.002,
    };
    const bpm = estimateTempo(shortAudio);
    expect(bpm).toBe(100);
  });
});
