// Utility to convert chord roots and variants to SEO-friendly slugs and back

const ROOT_SLUG_MAP: Record<string, string> = {
  "C": "c",
  "C#/Db": "c-sharp",
  "C#": "c-sharp",
  "Db": "c-sharp",
  "D": "d",
  "D#/Eb": "d-sharp",
  "D#": "d-sharp",
  "Eb": "d-sharp",
  "E": "e",
  "F": "f",
  "F#/Gb": "f-sharp",
  "F#": "f-sharp",
  "Gb": "f-sharp",
  "G": "g",
  "G#/Ab": "g-sharp",
  "G#": "g-sharp",
  "Ab": "g-sharp",
  "A": "a",
  "A#/Bb": "a-sharp",
  "A#": "a-sharp",
  "Bb": "a-sharp",
  "B": "b",
};

const SLUG_TO_ROOT_MAP: Record<string, string> = {
  "c": "C",
  "c-sharp": "C#",
  "csharp": "C#",
  "c sharp": "C#",
  "db": "C#",
  "d-flat": "C#",
  "dflat": "C#",
  "d flat": "C#",
  "c#": "C#",
  "c#/db": "C#",

  "d": "D",
  "d-sharp": "D#",
  "dsharp": "D#",
  "d sharp": "D#",
  "eb": "D#",
  "e-flat": "D#",
  "eflat": "D#",
  "e flat": "D#",
  "d#": "D#",
  "d#/eb": "D#",

  "e": "E",
  "f": "F",
  "f-sharp": "F#",
  "fsharp": "F#",
  "f sharp": "F#",
  "gb": "F#",
  "g-flat": "F#",
  "gflat": "F#",
  "g flat": "F#",
  "f#": "F#",
  "f#/gb": "F#",

  "g": "G",
  "g-sharp": "G#",
  "gsharp": "G#",
  "g sharp": "G#",
  "ab": "G#",
  "a-flat": "G#",
  "aflat": "G#",
  "a flat": "G#",
  "g#": "G#",
  "g#/ab": "G#",

  "a": "A",
  "a-sharp": "A#",
  "asharp": "A#",
  "a sharp": "A#",
  "bb": "A#",
  "b-flat": "A#",
  "bflat": "A#",
  "b flat": "A#",
  "a#": "A#",
  "a#/bb": "A#",

  "b": "B",
};

const VARIANT_SLUG_MAP: Record<string, string> = {
  "Major": "major",
  "Minor": "minor",
  "7": "7",
  "maj7": "maj7",
  "m7": "m7",
  "sus4": "sus4",
  "sus2": "sus2",
  "add9": "add9",
  "dim": "dim",
  "aug": "aug",
  "6": "6",
  "m6": "m6",
};

const SLUG_TO_VARIANT_MAP: Record<string, string> = {
  "major": "Major",
  "minor": "Minor",
  "m": "Minor",
  "7": "7",
  "dom7": "7",
  "maj7": "maj7",
  "major7": "maj7",
  "m7": "m7",
  "minor7": "m7",
  "sus4": "sus4",
  "sus2": "sus2",
  "add9": "add9",
  "dim": "dim",
  "diminished": "dim",
  "aug": "aug",
  "augmented": "aug",
  "6": "6",
  "m6": "m6",
};

export function rootToSlug(root: string): string {
  const normalized = root.trim();
  return ROOT_SLUG_MAP[normalized] || normalized.toLowerCase().replace(/#/g, "-sharp").replace(/\//g, "-");
}

export function slugToRoot(slug: string): string | null {
  const decoded = decodeURIComponent(slug).toLowerCase().trim();
  const hyphenated = decoded.replace(/\s+/g, "-");
  return SLUG_TO_ROOT_MAP[hyphenated] || SLUG_TO_ROOT_MAP[decoded] || null;
}

export function variantToSlug(variant: string): string {
  const normalized = variant.trim();
  return VARIANT_SLUG_MAP[normalized] || normalized.toLowerCase();
}

export function slugToVariant(slug: string): string | null {
  const normalized = decodeURIComponent(slug).toLowerCase().trim();
  return SLUG_TO_VARIANT_MAP[normalized] || null;
}

export function getChordUrl(root: string, variant: string): string {
  return `/chords/${rootToSlug(root)}/${variantToSlug(variant)}`;
}

export function formatChordDisplayName(root: string, variant: string): string {
  const displayRoot = root.includes("/") ? root.split("/")[0] : root;
  const displaySuffix = variant === "Major" ? "" : variant === "Minor" ? "m" : variant;
  return `${displayRoot}${displaySuffix}`;
}

export function formatChordFullName(root: string, variant: string): string {
  const displayRoot = root.includes("/") ? `${root.split("/")[0]} / ${root.split("/")[1]}` : root;
  return `${displayRoot} ${variant}`;
}
