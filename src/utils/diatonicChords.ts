import { getChordUrl, formatChordDisplayName } from "./chordSlug";
import { chordLibraryData } from "@/data/chordData";

export const CHROMATIC_NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const ENHARMONIC_MAP: Record<string, string> = {
  "Db": "C#",
  "Eb": "D#",
  "Fb": "E",
  "Gb": "F#",
  "Ab": "G#",
  "Bb": "A#",
  "Cb": "B",
  "E#": "F",
  "B#": "C",
};

const MAJOR_SCALE_INTERVALS = [0, 2, 4, 5, 7, 9, 11];
const MINOR_SCALE_INTERVALS = [0, 2, 3, 5, 7, 8, 10];

const MAJOR_DEGREES = ["I", "ii", "iii", "IV", "V", "vi", "vii°"];
const MINOR_DEGREES = ["i", "ii°", "III", "iv", "v", "VI", "VII"];

const MAJOR_ROLES = [
  "Tonic",
  "Supertonic",
  "Mediant",
  "Subdominant",
  "Dominant",
  "Submediant",
  "Leading Tone",
];

const MINOR_ROLES = [
  "Tonic",
  "Supertonic",
  "Mediant",
  "Subdominant",
  "Dominant",
  "Submediant",
  "Subtonic",
];

// Diatonic quality of each scale degree (matching backend/analysis.py)
const MAJOR_QUALITIES = ["Major", "Minor", "Minor", "Major", "Major", "Minor", "dim"];
const MINOR_QUALITIES = ["Minor", "dim", "Major", "Minor", "Minor", "Major", "Major"];

export interface DiatonicChordInfo {
  degree: string;
  role: string;
  root: string;
  variant: string;
  displayName: string;
  url: string;
  isCurrent: boolean;
  exists: boolean;
}

/**
 * Checks whether a root & variant combination exists in the chord library database.
 */
function chordExistsInLibrary(root: string, variant: string): boolean {
  const cleanRoot = root.toLowerCase();
  const cleanVariant = variant.toLowerCase();

  const rData = chordLibraryData.roots.find((r) => {
    const rRoot = r.root.toLowerCase();
    const rParts = rRoot.split("/");
    return rRoot === cleanRoot || rParts.includes(cleanRoot);
  });

  if (!rData) return false;
  return rData.variants.some((v) => v.name.toLowerCase() === cleanVariant);
}

/**
 * Computes the 7 diatonic chords (and their 6 neighbors) for any given root chord and quality.
 */
export function getDiatonicNeighbors(rawRoot: string, variant: string): DiatonicChordInfo[] {
  const cleanRoot = rawRoot.includes("/") ? rawRoot.split("/")[0].trim() : rawRoot.trim();
  const normalizedRoot = ENHARMONIC_MAP[cleanRoot] || cleanRoot;
  const rootIdx = CHROMATIC_NOTES.indexOf(normalizedRoot);

  if (rootIdx === -1) return [];

  const v = variant.toLowerCase().trim();
  const isMinor = v.includes("minor") || (v.startsWith("m") && !v.startsWith("maj"));

  const intervals = isMinor ? MINOR_SCALE_INTERVALS : MAJOR_SCALE_INTERVALS;
  const degrees = isMinor ? MINOR_DEGREES : MAJOR_DEGREES;
  const roles = isMinor ? MINOR_ROLES : MAJOR_ROLES;
  const qualities = isMinor ? MINOR_QUALITIES : MAJOR_QUALITIES;

  return intervals.map((interval, i) => {
    const noteIdx = (rootIdx + interval) % 12;
    const note = CHROMATIC_NOTES[noteIdx];
    const chordVariant = qualities[i];
    const isCurrent = i === 0;
    const exists = chordExistsInLibrary(note, chordVariant);

    return {
      degree: degrees[i],
      role: roles[i],
      root: note,
      variant: chordVariant,
      displayName: formatChordDisplayName(note, chordVariant),
      url: getChordUrl(note, chordVariant),
      isCurrent,
      exists,
    };
  });
}
