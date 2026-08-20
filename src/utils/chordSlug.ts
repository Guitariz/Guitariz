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
  "c-sharp": "C#/Db",
  "csharp": "C#/Db",
  "db": "C#/Db",
  "d-flat": "C#/Db",
  "c#": "C#/Db",
  "d": "D",
  "d-sharp": "D#/Eb",
  "dsharp": "D#/Eb",
  "eb": "D#/Eb",
  "d#": "D#/Eb",
  "e": "E",
  "f": "F",
  "f-sharp": "F#/Gb",
  "fsharp": "F#/Gb",
  "gb": "F#/Gb",
  "f#": "F#/Gb",
  "g": "G",
  "g-sharp": "G#/Ab",
  "gsharp": "G#/Ab",
  "ab": "G#/Ab",
  "g#": "G#/Ab",
  "a": "A",
  "a-sharp": "A#/Bb",
  "asharp": "A#/Bb",
  "bb": "A#/Bb",
  "a#": "A#/Bb",
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
  const normalized = decodeURIComponent(slug).toLowerCase().trim();
  return SLUG_TO_ROOT_MAP[normalized] || null;
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
