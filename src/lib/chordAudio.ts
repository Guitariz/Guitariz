/**
 * WebAudio utility for playing chord sounds
 * Generates realistic guitar tones for chord playback
 * 
 * Guitar tuning (standard):
 * String 1 (High E): 329.63 Hz (E4)
 * String 2 (B):      246.94 Hz (B3)
 * String 3 (G):      196.00 Hz (G3)
 * String 4 (D):      146.83 Hz (D3)
 * String 5 (A):      110.00 Hz (A2)
 * String 6 (Low E):   82.41 Hz (E2)
 */

export type InstrumentType = 'guitar' | 'piano';

let audioContext: AudioContext | null = null;
let pianoSamplesReady = false;
let pianoSampleLoadStarted = false;
const pianoSampleBuffers: Map<number, AudioBuffer> = new Map();

// Expected sample set (drop files into public/samples/piano/)
// These are center-note anchors; playbackRate shifts in between
const LOCAL_PIANO_SAMPLE_SET = [
  { midi: 48, file: 'piano_C3.mp3' },
  { midi: 52, file: 'piano_E3.mp3' },
  { midi: 55, file: 'piano_G3.mp3' },
  { midi: 60, file: 'piano_C4.mp3' },
  { midi: 64, file: 'piano_E4.mp3' },
  { midi: 67, file: 'piano_G4.mp3' },
  { midi: 72, file: 'piano_C5.mp3' },
];

// Remote fallback (Use a reliable CDN for piano samples)
const REMOTE_PIANO_BASE = 'https://cdn.jsdelivr.net/gh/nbrosowsky/tonejs-instruments/samples/piano/';
const REMOTE_PIANO_SAMPLE_SET = [
  { midi: 36, file: 'C2.mp3' },
  { midi: 48, file: 'C3.mp3' },
  { midi: 52, file: 'E3.mp3' },
  { midi: 55, file: 'G3.mp3' },
  { midi: 60, file: 'C4.mp3' },
  { midi: 64, file: 'E4.mp3' },
  { midi: 67, file: 'G4.mp3' },
  { midi: 72, file: 'C5.mp3' },
  { midi: 84, file: 'C6.mp3' },
];

// Initialize audio context on first user interaction
const initAudioContext = (): AudioContext => {
  if (audioContext) return audioContext;
  
  if (typeof window === 'undefined') {
    throw new Error('Audio context requires browser environment');
  }

  audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  // Resume audio context if suspended (required by some browsers)
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  
  return audioContext;
};

const log2 = (value: number) => Math.log(value) / Math.log(2);

const midiFromFrequency = (frequency: number) => {
  return 69 + 12 * log2(frequency / 440);
};

const loadSampleSet = async (
  ctx: AudioContext,
  baseUrl: string,
  entries: { midi: number; file: string }[]
) => {
  await Promise.all(
    entries.map(async ({ midi, file }) => {
      if (pianoSampleBuffers.has(midi)) return;
      try {
        const response = await fetch(`${baseUrl}${file}`);
        if (!response.ok) return;
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        pianoSampleBuffers.set(midi, audioBuffer);
      } catch {
        // ignore failed fetches
      }
    })
  );
};

const ensurePianoSamples = async () => {
  if (pianoSamplesReady || pianoSampleLoadStarted) return;
  pianoSampleLoadStarted = true;

  try {
    const ctx = initAudioContext();

    // Prefer local assets
    await loadSampleSet(ctx, '/samples/piano/', LOCAL_PIANO_SAMPLE_SET);

    // If none loaded, try remote CC-BY set
    if (pianoSampleBuffers.size === 0) {
      await loadSampleSet(ctx, REMOTE_PIANO_BASE, REMOTE_PIANO_SAMPLE_SET);
    }

    pianoSamplesReady = pianoSampleBuffers.size > 0;
  } catch {
    pianoSamplesReady = false;
  }
};

// Standard guitar tuning frequencies (Hz) - Ordered from String 6 (Low E) to String 1 (High E)
// This matches standard chord data arrays where index 0 is the Low E string.
const GUITAR_TUNING = [82.41, 110.00, 146.83, 196.00, 246.94, 329.63];

const createPluckedString = (
  ctx: AudioContext,
  frequency: number,
  duration: number,
  volume: number,
  panPosition: number = 0,
  startTime: number = ctx.currentTime
) => {
  const now = startTime;
  
  // Pluck: use even shorter noise for cleaner transients
  const burstLength = 0.01; 
  const sampleRate = ctx.sampleRate;
  const burstBuffer = ctx.createBuffer(1, Math.floor(sampleRate * burstLength), sampleRate);
  const data = burstBuffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length); 
  }

  const noise = ctx.createBufferSource();
  noise.buffer = burstBuffer;

  const delay = ctx.createDelay();
  delay.delayTime.setValueAtTime(1 / frequency, now);

  const feedback = ctx.createGain();
  // Ensure feedback is never >= 1 to prevent unstable screeching
  const decayValue = Math.min(0.98, 0.95 + (20 / frequency) * 0.02);
  feedback.gain.setValueAtTime(decayValue, now);

  const damp = ctx.createBiquadFilter();
  damp.type = 'lowpass';
  // Lower cutoff for a warmer, less "sharp" sound
  damp.frequency.setValueAtTime(Math.min(8000, frequency * 6), now);
  damp.Q.setValueAtTime(0.5, now);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume * 0.5, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(volume * 0.2, now + 0.4);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  const panner = ctx.createStereoPanner();
  panner.pan.setValueAtTime(panPosition, now);

  noise.connect(delay);
  delay.connect(damp);
  damp.connect(feedback);
  feedback.connect(delay);
  
  damp.connect(gain);
  gain.connect(panner);
  panner.connect(ctx.destination);

  noise.start(now);
};

const createSaturator = (ctx: AudioContext, amount: number) => {
  const shaper = ctx.createWaveShaper();
  const curve = new Float32Array(44100);
  for (let i = 0; i < curve.length; i++) {
    const x = (i / (curve.length - 1)) * 2 - 1;
    curve[i] = Math.tanh(x * amount);
  }
  shaper.curve = curve;
  shaper.oversample = '4x';
  return shaper;
};

const createPianoTone = (
  ctx: AudioContext,
  frequency: number,
  duration: number,
  volume: number,
  panPosition: number = 0,
  startTime: number = ctx.currentTime
) => {
  const now = startTime;

  // Polyphonic piano tone uses a mix of sine and triangle for "bite"
  const partialMain = ctx.createOscillator();
  const partial2nd = ctx.createOscillator();
  const partial3rd = ctx.createOscillator();
  const partial4th = ctx.createOscillator();
  const partial5th = ctx.createOscillator();

  partialMain.type = 'sine';
  partialMain.frequency.setValueAtTime(frequency, now);

  partial2nd.type = 'sine';
  partial2nd.frequency.setValueAtTime(frequency * 2, now);
  partial2nd.detune.setValueAtTime(2, now);

  partial3rd.type = 'sine';
  partial3rd.frequency.setValueAtTime(frequency * 3, now);
  partial3rd.detune.setValueAtTime(-1, now);

  // Higher partials use triangle for a bit more harmonic complexity/percussion
  partial4th.type = 'triangle';
  partial4th.frequency.setValueAtTime(frequency * 4, now);
  partial4th.detune.setValueAtTime(4, now);

  partial5th.type = 'triangle';
  partial5th.frequency.setValueAtTime(frequency * 5, now);
  partial5th.detune.setValueAtTime(-3, now);

  const hammerNoise = ctx.createBufferSource();
  const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.04, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    // Sharp noise burst for the hammer hit
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.003));
  }
  hammerNoise.buffer = noiseBuffer;

  const lowpass = ctx.createBiquadFilter();
  lowpass.type = 'lowpass';
  // Dynamic filter: starts bright, darkens as note decays
  lowpass.frequency.setValueAtTime(Math.min(10000, frequency * 10), now);
  lowpass.frequency.exponentialRampToValueAtTime(Math.min(2000, frequency * 2), now + duration * 0.8);
  lowpass.Q.setValueAtTime(0.5, now);

  const highpass = ctx.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.setValueAtTime(60, now); // Remove sub-bass muck

  const gainMain = ctx.createGain();
  const gain2nd = ctx.createGain();
  const gain3rd = ctx.createGain();
  const gain4th = ctx.createGain();
  const gain5th = ctx.createGain();
  const gainNoise = ctx.createGain();
  const masterGain = ctx.createGain();

  gainMain.gain.setValueAtTime(volume * 0.8, now);
  gain2nd.gain.setValueAtTime(volume * 0.25, now);
  gain3rd.gain.setValueAtTime(volume * 0.12, now);
  gain4th.gain.setValueAtTime(volume * 0.06, now);
  gain5th.gain.setValueAtTime(volume * 0.03, now);
  gainNoise.gain.setValueAtTime(volume * 0.4, now);
  gainNoise.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

  // ADSR-like envelope
  masterGain.gain.setValueAtTime(0, now);
  masterGain.gain.linearRampToValueAtTime(volume, now + 0.015); 
  masterGain.gain.exponentialRampToValueAtTime(volume * 0.5, now + 0.3);
  masterGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  const panner = ctx.createStereoPanner();
  panner.pan.setValueAtTime(panPosition, now);

  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.setValueAtTime(-15, now);
  compressor.ratio.setValueAtTime(4, now);

  partialMain.connect(gainMain).connect(lowpass);
  partial2nd.connect(gain2nd).connect(lowpass);
  partial3rd.connect(gain3rd).connect(lowpass);
  partial4th.connect(gain4th).connect(lowpass);
  partial5th.connect(gain5th).connect(lowpass);
  hammerNoise.connect(gainNoise).connect(lowpass);

  lowpass.connect(highpass);
  highpass.connect(masterGain);
  masterGain.connect(panner);
  panner.connect(compressor);
  compressor.connect(ctx.destination);

  partialMain.start(now);
  partial2nd.start(now);
  partial3rd.start(now);
  partial4th.start(now);
  partial5th.start(now);
  hammerNoise.start(now);

  partialMain.stop(now + duration + 0.1);
  partial2nd.stop(now + duration + 0.1);
  partial3rd.stop(now + duration + 0.1);
  partial4th.stop(now + duration + 0.1);
  partial5th.stop(now + duration + 0.1);
};

const getNearestSample = (midi: number) => {
  if (!pianoSamplesReady || pianoSampleBuffers.size === 0) return null;
  let nearestMidi = -1;
  let smallestDiff = Number.MAX_VALUE;
  for (const key of pianoSampleBuffers.keys()) {
    const diff = Math.abs(key - midi);
    if (diff < smallestDiff) {
      smallestDiff = diff;
      nearestMidi = key;
    }
  }
  if (nearestMidi === -1) return null;
  return { midi: nearestMidi, buffer: pianoSampleBuffers.get(nearestMidi)! };
};

const playSampledPiano = (
  ctx: AudioContext,
  frequency: number,
  duration: number,
  volume: number,
  panPosition: number,
  startTime: number = ctx.currentTime
) => {
  const midi = midiFromFrequency(frequency);
  const sample = getNearestSample(midi);
  if (!sample) return false;

  const playbackRate = Math.pow(2, (midi - sample.midi) / 12);
  const now = startTime;

  const source = ctx.createBufferSource();
  source.buffer = sample.buffer;
  source.playbackRate.setValueAtTime(playbackRate, now);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(volume * 0.6, now + 0.35);
  gain.gain.exponentialRampToValueAtTime(0.0003, now + duration + 0.3);

  const highpass = ctx.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.setValueAtTime(80, now);

  const panner = ctx.createStereoPanner();
  panner.pan.setValueAtTime(panPosition, now);

  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.setValueAtTime(-12, now);
  compressor.ratio.setValueAtTime(3, now);

  source.connect(gain);
  gain.connect(highpass);
  highpass.connect(panner);
  panner.connect(compressor);
  compressor.connect(ctx.destination);

  source.start(now);
  source.stop(now + Math.max(duration + 0.5, sample.buffer.duration / playbackRate));

  return true;
};

export const playChord = (
  frets: number[], 
  volume: number = 0.3,
  instrument: InstrumentType = 'piano',
  direction: 'down' | 'up' = 'down'
): void => {
  const ctx = initAudioContext();
  const now = ctx.currentTime;
  const strumDelay = 0.035; // Slightly slower, more deliberate strum

  if (instrument === 'piano') {
    void ensurePianoSamples();
  }

  // Iterate strings (index 0 is Low E)
  frets.forEach((fret, stringIndex) => {
    if (fret === -1) return;

    const stringFreq = GUITAR_TUNING[stringIndex];
    const noteFreq = stringFreq * Math.pow(2, fret / 12);
    // Spread stereo slightly per string (-0.4 ... 0.4)
    const pan = (stringIndex / 5) * 0.8 - 0.4;
    
    // Low strings play first in a standard downstrum (index 0 first)
    // High strings play first in an upstrum (index 5 first)
    const timeOffset = direction === 'down' 
      ? stringIndex * strumDelay 
      : (5 - stringIndex) * strumDelay;

    const playTime = now + timeOffset;

    if (instrument === 'piano') {
      const clampedDuration = 2.8;
      // Scale volume: lower notes are louder naturally on piano, but we balance for polyphony
      const noteVolume = Math.min(volume * 0.75, 0.45); 
      
      const usedSample = playSampledPiano(
        ctx,
        noteFreq,
        clampedDuration,
        noteVolume,
        pan,
        playTime
      );

      if (!usedSample) {
        createPianoTone(ctx, noteFreq, clampedDuration, noteVolume, pan, playTime);
      }
    } else {
      createPluckedString(ctx, noteFreq, 2.6, volume, pan, playTime);
    }
  });
};

export const playNote = (
  frequency: number,
  duration: number = 1.5,
  volume: number = 0.3,
  instrument: InstrumentType = 'piano'
): void => {
  const ctx = initAudioContext();
  const now = ctx.currentTime;
  const panPosition = Math.random() * 0.2 - 0.1; // subtle width

  if (instrument === 'piano') {
    // Trigger async load of samples (non-blocking)
    void ensurePianoSamples();

    const clampedDuration = Math.min(Math.max(duration, 0.6), 3.5);

    const usedSample = playSampledPiano(
      ctx,
      frequency,
      clampedDuration,
      Math.min(volume, 0.7),
      panPosition,
      now
    );

    if (!usedSample) {
      createPianoTone(ctx, frequency, clampedDuration, Math.min(volume, 0.5), panPosition, now);
    }
    return;
  }

  createPluckedString(ctx, frequency, duration, volume, panPosition, now);
};
