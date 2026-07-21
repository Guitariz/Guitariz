import { Chord, Note } from "tonal";
import { AnalysisResult, ChordSegment } from "@/types/chordAI";

/**
 * Encodes an integer value as a MIDI Variable-Length Quantity (VLQ).
 */
export function encodeVLQ(value: number): number[] {
  let val = Math.max(0, Math.round(value));
  const bytes: number[] = [];
  bytes.push(val & 0x7f);
  val >>= 7;
  while (val > 0) {
    bytes.unshift((val & 0x7f) | 0x80);
    val >>= 7;
  }
  return bytes;
}

/**
 * Normalizes chord string and converts it into a list of MIDI note numbers.
 * Allocates bass note to octave 2-3 and chord tones to octave 4 for rich DAW voicings.
 */
export function parseChordToMidiNotes(chordName: string): number[] {
  if (!chordName || chordName === "N.C." || chordName === "N" || chordName.toLowerCase() === "silence") {
    return [];
  }

  let slashBass: string | null = null;
  let baseChord = chordName.trim();

  if (baseChord.includes("/")) {
    const parts = baseChord.split("/");
    baseChord = parts[0];
    slashBass = parts[1];
  }

  // Clean backend output notation (e.g. "C:maj" -> "C", "A:min" -> "Am")
  const normalized = baseChord
    .replace(":maj", "")
    .replace(":min", "m")
    .replace(":", "");

  const chordInfo = Chord.get(normalized);
  let noteClasses = chordInfo.notes;

  // Fallback if tonal didn't match chord info directly
  if (!noteClasses || noteClasses.length === 0) {
    const rootMatch = normalized.match(/^[A-G][#b]?/);
    if (!rootMatch) return [];
    const root = rootMatch[0];
    noteClasses = [root];
  }

  const resultMidiNotes: number[] = [];

  // Add slash bass note if specified
  if (slashBass) {
    const bassMidi = Note.midi(`${slashBass}2`) ?? Note.midi(`${slashBass}3`);
    if (bassMidi !== null) {
      resultMidiNotes.push(bassMidi);
    }
  }

  // Root note in octave 3 (MIDI 48-59)
  const rootName = noteClasses[0];
  const rootMidiOctave3 = Note.midi(`${rootName}3`);
  if (rootMidiOctave3 !== null) {
    resultMidiNotes.push(rootMidiOctave3);
  }

  // Upper chord tones in octave 4 (MIDI 60-71), or octave 5 if needed for smooth voicing
  for (let i = 1; i < noteClasses.length; i++) {
    const toneName = noteClasses[i];
    let toneMidi = Note.midi(`${toneName}4`);
    if (toneMidi !== null && rootMidiOctave3 !== null && toneMidi < rootMidiOctave3) {
      toneMidi += 12; // Shift up an octave if tone in octave 4 is below root in octave 3
    }
    if (toneMidi !== null) {
      resultMidiNotes.push(toneMidi);
    }
  }

  // Deduplicate and sort notes
  return Array.from(new Set(resultMidiNotes)).sort((a, b) => a - b);
}

/**
 * Builds a Standard MIDI File (SMF Format 0) binary Uint8Array from chord segments.
 */
export function buildMidiBuffer(
  segments: ChordSegment[],
  tempoBpm: number = 120
): Uint8Array {
  const safeTempo = Math.max(20, Math.min(300, tempoBpm || 120));
  const tpqn = 480; // Ticks per quarter note (standard resolution)
  const ticksPerSecond = (safeTempo / 60) * tpqn;

  // Collect all Note On and Note Off events
  type MidiEventInternal = {
    tick: number;
    type: "noteOn" | "noteOff";
    note: number;
  };

  const events: MidiEventInternal[] = [];

  for (const seg of segments) {
    if (!seg.chord) continue;
    const notes = parseChordToMidiNotes(seg.chord);
    if (notes.length === 0) continue;

    const startTick = Math.max(0, Math.round(seg.start * ticksPerSecond));
    const endTick = Math.max(startTick + 1, Math.round(seg.end * ticksPerSecond));

    for (const note of notes) {
      events.push({ tick: startTick, type: "noteOn", note });
      events.push({ tick: endTick, type: "noteOff", note });
    }
  }

  // Sort events chronologically. If ticks are equal, Note Off comes before Note On.
  events.sort((a, b) => {
    if (a.tick !== b.tick) return a.tick - b.tick;
    if (a.type !== b.type) return a.type === "noteOff" ? -1 : 1;
    return a.note - b.note;
  });

  const trackBytes: number[] = [];

  // Track Header: Tempo Meta Event (0xFF 0x51 0x03 [3-byte microseconds per qn])
  // Delta time = 0
  trackBytes.push(0x00);
  const mpqn = Math.round(60000000 / safeTempo);
  trackBytes.push(0xff, 0x51, 0x03);
  trackBytes.push((mpqn >> 16) & 0xff, (mpqn >> 8) & 0xff, mpqn & 0xff);

  // Time Signature Meta Event (4/4 time: 0xFF 0x58 0x04 0x04 0x02 0x18 0x08)
  trackBytes.push(0x00);
  trackBytes.push(0xff, 0x58, 0x04, 0x04, 0x02, 0x18, 0x08);

  // Track Name Meta Event (0xFF 0x03 len "Guitariz Chords")
  const trackName = "Guitariz Chords";
  trackBytes.push(0x00);
  trackBytes.push(0xff, 0x03, trackName.length);
  for (let i = 0; i < trackName.length; i++) {
    trackBytes.push(trackName.charCodeAt(i));
  }

  // Encode Note Events with delta times
  let lastTick = 0;
  for (const ev of events) {
    const deltaTime = Math.max(0, ev.tick - lastTick);
    const vlqDelta = encodeVLQ(deltaTime);
    trackBytes.push(...vlqDelta);

    if (ev.type === "noteOn") {
      trackBytes.push(0x90, ev.note & 0x7f, 85); // Channel 0, Note On, Velocity 85
    } else {
      trackBytes.push(0x80, ev.note & 0x7f, 0); // Channel 0, Note Off, Velocity 0
    }

    lastTick = ev.tick;
  }

  // End of Track Meta Event (0xFF 0x2F 0x00)
  trackBytes.push(0x00); // delta-time 0
  trackBytes.push(0xff, 0x2f, 0x00);

  // Construct Final Header + Track Chunk
  // Header Chunk (14 bytes)
  const headerBytes = [
    0x4d, 0x54, 0x68, 0x64, // "MThd"
    0x00, 0x00, 0x00, 0x06, // Header length = 6
    0x00, 0x00,             // Format 0 (single track)
    0x00, 0x01,             // Number of tracks = 1
    (tpqn >> 8) & 0xff, tpqn & 0xff // Ticks per quarter note = 480
  ];

  // Track Chunk Header: "MTrk" + 4-byte track length
  const trackLen = trackBytes.length;
  const trackHeader = [
    0x4d, 0x54, 0x72, 0x6b, // "MTrk"
    (trackLen >> 24) & 0xff,
    (trackLen >> 16) & 0xff,
    (trackLen >> 8) & 0xff,
    trackLen & 0xff
  ];

  return new Uint8Array([...headerBytes, ...trackHeader, ...trackBytes]);
}

/**
 * Triggers browser file download for exported MIDI file.
 */
export function exportChordsToMidi(
  result: AnalysisResult,
  fileName?: string,
  options?: { transpose?: number; showSimple?: boolean }
): { success: boolean; filename: string } {
  if (!result || !result.chords || result.chords.length === 0) {
    throw new Error("No chord data available to export.");
  }

  const transpose = options?.transpose ?? 0;
  const showSimple = options?.showSimple ?? false;

  const baseChords = showSimple && result.simpleChords ? result.simpleChords : result.chords;

  // Apply pitch transposition if set
  const exportSegments: ChordSegment[] = baseChords.map(seg => ({
    ...seg,
    chord: transpose !== 0 ? transposeChordName(seg.chord, transpose) : seg.chord
  }));

  const midiBuffer = buildMidiBuffer(exportSegments, result.tempo);

  const cleanName = (fileName || "progression")
    .replace(/\.[^/.]+$/, "") // strip extension
    .replace(/[^a-zA-Z0-9_-]/g, "_");
  
  const finalFilename = `${cleanName}_chords.mid`;

  const blob = new Blob([midiBuffer.buffer as ArrayBuffer], { type: "audio/midi" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = finalFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return { success: true, filename: finalFilename };
}

/**
 * Helper to transpose chord name by semitones.
 */
function transposeChordName(chordName: string, semitones: number): string {
  if (semitones === 0 || !chordName || chordName === "N.C.") return chordName;
  try {
    const chord = Chord.get(chordName);
    if (!chord.tonic) return chordName;
    const midi = Note.midi(chord.tonic + "4");
    if (midi === null) return chordName;
    const newMidi = midi + semitones;
    const newNote = Note.fromMidi(newMidi).replace(/\d+$/, "");
    return chordName.replace(chord.tonic, newNote);
  } catch (_e) {
    return chordName;
  }
}
