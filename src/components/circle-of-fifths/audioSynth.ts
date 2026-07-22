// Lightweight Web Audio API synthesizer for playing notes and smoothly ascending scales

const SEMITONE_MAP: Record<string, number> = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  "E#": 5,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
  "B#": 0,
};

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

// Convert MIDI pitch to frequency (Hz) using standard equal temperament formula
function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// Get clean note name semitone
function getNoteSemitone(noteName: string): number {
  const clean = noteName
    .replace("m", "")
    .replace("dim", "")
    .replace("°", "")
    .replace("maj", "")
    .replace("7", "")
    .trim();
  return SEMITONE_MAP[clean] ?? 0;
}

export function playMidiNote(midiPitch: number, duration = 0.5) {
  try {
    const ctx = getAudioContext();
    const freq = midiToFreq(midiPitch);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Use smooth triangle oscillator with exponential decay
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (err) {
    console.warn("Audio Context error:", err);
  }
}

export function playNote(noteName: string, duration = 0.5) {
  const semitone = getNoteSemitone(noteName);
  const midiPitch = 60 + semitone; // Base C4 octave
  playMidiNote(midiPitch, duration);
}

export function playScale(notes: string[]) {
  if (!notes || notes.length === 0) return;

  // Build a full 8-note scale by adding top root resolution if missing
  const fullNotes = [...notes];
  if (fullNotes.length === 7) {
    fullNotes.push(fullNotes[0]); // Append top octave root
  }

  // Calculate ascending MIDI pitch numbers for each note
  const midiPitches: number[] = [];
  let currentOctaveShift = 0;
  let prevSemitone = -1;

  // Start root note between MIDI 60 (C4) and 71 (B4)
  const rootSemitone = getNoteSemitone(fullNotes[0]);
  let rootMidi = 60 + rootSemitone;
  if (rootMidi > 67) {
    rootMidi -= 12; // Keep higher roots (Ab, A, Bb, B) in comfortable range 56-67
  }

  fullNotes.forEach((note, idx) => {
    const semitone = getNoteSemitone(note);

    if (idx > 0 && semitone <= prevSemitone) {
      currentOctaveShift += 12; // Crossed octave boundary, ascend octave
    }

    const noteMidi = rootMidi + (semitone - rootSemitone) + currentOctaveShift;
    midiPitches.push(noteMidi);
    prevSemitone = semitone;
  });

  // Play ascending scale smoothly
  midiPitches.forEach((midi, idx) => {
    setTimeout(() => {
      playMidiNote(midi, 0.45);
    }, idx * 220);
  });
}
