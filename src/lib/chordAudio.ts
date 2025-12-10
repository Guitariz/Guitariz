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

let audioContext: AudioContext | null = null;

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

// Standard guitar tuning frequencies (Hz)
// Strings ordered from 1st (high E) to 6th (low E)
const GUITAR_TUNING = [329.63, 246.94, 196.00, 146.83, 110.00, 82.41];

export const playChord = (frets: number[], volume: number = 0.3): void => {
  const ctx = initAudioContext();

  const now = ctx.currentTime;
  const attackTime = 0.008;  // Slightly longer attack for realism
  const decayTime = 0.15;    // More decay for natural guitar sound
  const releaseTime = 2.5;   // Longer sustain

  frets.forEach((fret, stringIndex) => {
    if (fret === -1) return; // Muted string

    const stringFreq = GUITAR_TUNING[stringIndex];
    const noteFreq = stringFreq * Math.pow(2, fret / 12);

    // Create more realistic guitar tone with multiple harmonics
    const fundamental = ctx.createOscillator();
    const harmonic2 = ctx.createOscillator();
    const harmonic3 = ctx.createOscillator();
    const harmonic4 = ctx.createOscillator();
    
    const masterGain = ctx.createGain();
    const fundamentalGain = ctx.createGain();
    const harmonic2Gain = ctx.createGain();
    const harmonic3Gain = ctx.createGain();
    const harmonic4Gain = ctx.createGain();
    
    // Multiple filters for warm, clear tone
    const filter1 = ctx.createBiquadFilter();
    filter1.type = 'lowpass';
    filter1.frequency.setValueAtTime(6000, now);
    filter1.Q.setValueAtTime(0.7, now);
    
    const filter2 = ctx.createBiquadFilter();
    filter2.type = 'highpass';
    filter2.frequency.setValueAtTime(80, now);
    filter2.Q.setValueAtTime(0.7, now);
    
    // Peaking EQ to boost mid frequencies for clarity
    const eqFilter = ctx.createBiquadFilter();
    eqFilter.type = 'peaking';
    eqFilter.frequency.setValueAtTime(1200, now);
    eqFilter.gain.setValueAtTime(3, now);
    eqFilter.Q.setValueAtTime(2, now);

    // Fundamental frequency - warm sine wave
    fundamental.type = 'sine';
    fundamental.frequency.setValueAtTime(noteFreq, now);
    fundamentalGain.gain.setValueAtTime(0.45, now);
    
    // Second harmonic (octave up) - adds presence
    harmonic2.type = 'sine';
    harmonic2.frequency.setValueAtTime(noteFreq * 2, now);
    harmonic2Gain.gain.setValueAtTime(0.25, now);
    
    // Third harmonic (perfect fifth up) - adds color
    harmonic3.type = 'sine';
    harmonic3.frequency.setValueAtTime(noteFreq * 3, now);
    harmonic3Gain.gain.setValueAtTime(0.15, now);

    // Fourth harmonic (2 octaves up) - subtle brightness
    harmonic4.type = 'sine';
    harmonic4.frequency.setValueAtTime(noteFreq * 4, now);
    harmonic4Gain.gain.setValueAtTime(0.08, now);

    // ADSR envelope with realistic guitar decay curve
    masterGain.gain.setValueAtTime(0, now);
    // Attack phase
    masterGain.gain.linearRampToValueAtTime(volume, now + attackTime);
    // Decay phase - drop to sustain level
    masterGain.gain.exponentialRampToValueAtTime(volume * 0.7, now + attackTime + decayTime);
    // Release phase - fade out with natural string decay
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + releaseTime);

    // Connect oscillators to gain nodes
    fundamental.connect(fundamentalGain);
    harmonic2.connect(harmonic2Gain);
    harmonic3.connect(harmonic3Gain);
    harmonic4.connect(harmonic4Gain);
    
    // Connect gains to filters
    fundamentalGain.connect(filter1);
    harmonic2Gain.connect(filter1);
    harmonic3Gain.connect(filter1);
    harmonic4Gain.connect(filter1);
    
    filter1.connect(filter2);
    filter2.connect(eqFilter);
    eqFilter.connect(masterGain);
    masterGain.connect(ctx.destination);

    // Stagger string starts for natural chord spread (2-3ms per string)
    const startTime = now + stringIndex * 0.025;
    fundamental.start(startTime);
    harmonic2.start(startTime);
    harmonic3.start(startTime);
    harmonic4.start(startTime);
    
    fundamental.stop(startTime + releaseTime);
    harmonic2.stop(startTime + releaseTime);
    harmonic3.stop(startTime + releaseTime);
    harmonic4.stop(startTime + releaseTime);
  });
};

export const playNote = (frequency: number, duration: number = 1.5, volume: number = 0.3): void => {
  const ctx = initAudioContext();

  const now = ctx.currentTime;
  const attackTime = 0.008;
  const decayTime = 0.15;
  
  // Create realistic guitar tone with harmonics
  const fundamental = ctx.createOscillator();
  const harmonic2 = ctx.createOscillator();
  const harmonic3 = ctx.createOscillator();
  const harmonic4 = ctx.createOscillator();
  
  const masterGain = ctx.createGain();
  const fundamentalGain = ctx.createGain();
  const harmonic2Gain = ctx.createGain();
  const harmonic3Gain = ctx.createGain();
  const harmonic4Gain = ctx.createGain();
  
  // Multiple filters for warm, clear tone
    const filter1 = ctx.createBiquadFilter();
    filter1.type = 'lowpass';
    filter1.frequency.setValueAtTime(6000, now);
    filter1.Q.setValueAtTime(0.7, now);

    const filter2 = ctx.createBiquadFilter();
    filter2.type = 'highpass';
    filter2.frequency.setValueAtTime(80, now);
    filter2.Q.setValueAtTime(0.7, now);
    
    // Peaking EQ to boost mid frequencies for clarity
    const eqFilter = ctx.createBiquadFilter();
    eqFilter.type = 'peaking';
    eqFilter.frequency.setValueAtTime(1200, now);
    eqFilter.gain.setValueAtTime(3, now);
    eqFilter.Q.setValueAtTime(2, now);

  // Set up oscillators with harmonics - warm and clear
  fundamental.type = 'sine';
  fundamental.frequency.setValueAtTime(frequency, now);
  fundamentalGain.gain.setValueAtTime(0.45, now);
  
  harmonic2.type = 'sine';
  harmonic2.frequency.setValueAtTime(frequency * 2, now);
  harmonic2Gain.gain.setValueAtTime(0.25, now);
  
  harmonic3.type = 'sine';
  harmonic3.frequency.setValueAtTime(frequency * 3, now);
  harmonic3Gain.gain.setValueAtTime(0.15, now);

  harmonic4.type = 'sine';
  harmonic4.frequency.setValueAtTime(frequency * 4, now);
  harmonic4Gain.gain.setValueAtTime(0.08, now);

  // ADSR envelope with natural decay
  masterGain.gain.setValueAtTime(0, now);
  masterGain.gain.linearRampToValueAtTime(volume, now + attackTime);
  masterGain.gain.exponentialRampToValueAtTime(volume * 0.7, now + attackTime + decayTime);
  masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  // Connect the audio graph
  fundamental.connect(fundamentalGain);
  harmonic2.connect(harmonic2Gain);
  harmonic3.connect(harmonic3Gain);
  harmonic4.connect(harmonic4Gain);
  
  fundamentalGain.connect(filter1);
  harmonic2Gain.connect(filter1);
  harmonic3Gain.connect(filter1);
  harmonic4Gain.connect(filter1);
  
  filter1.connect(filter2);
  filter2.connect(eqFilter);
  eqFilter.connect(masterGain);
  masterGain.connect(ctx.destination);

  fundamental.start(now);
  harmonic2.start(now);
  harmonic3.start(now);
  harmonic4.start(now);
  
  fundamental.stop(now + duration);
  harmonic2.stop(now + duration);
  harmonic3.stop(now + duration);
  harmonic4.stop(now + duration);
};
