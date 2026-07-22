export interface CircleKeyData {
  note: string;
  position: number; // 0 to 11 (C = 0, G = 1, D = 2 ... F = 11)
  sharps: number;
  flats: number;
  relativeMinor: string;
  keySignature: string[];
  keySigExplanation: string;
  majorScale: string[];
  minorScale: string[];
  diatonicChords: string[];
  parallelKey: string;
  dominantKey: string;
  subdominantKey: string;
  tritoneKey: string;
  summary: string;
  popUsage: string;
}

export const CIRCLE_KEYS: CircleKeyData[] = [
  {
    note: "C",
    position: 0,
    sharps: 0,
    flats: 0,
    relativeMinor: "Am",
    keySignature: [],
    keySigExplanation: "No sharps or flats. All natural notes (C-D-E-F-G-A-B). The baseline key in Western music theory.",
    majorScale: ["C", "D", "E", "F", "G", "A", "B"],
    minorScale: ["A", "B", "C", "D", "E", "F", "G"],
    diatonicChords: ["C", "Dm", "Em", "F", "G", "Am", "Bdim"],
    parallelKey: "Cm",
    dominantKey: "G",
    subdominantKey: "F",
    tritoneKey: "F#",
    summary: "Pure and open sounding with zero accidentals.",
    popUsage: "Used in countless classic hits like 'Let It Be' (The Beatles) and 'Someone Like You' (Adele)."
  },
  {
    note: "G",
    position: 1,
    sharps: 1,
    flats: 0,
    relativeMinor: "Em",
    keySignature: ["F#"],
    keySigExplanation: "1 Sharp (F#). Why? Moving one step clockwise (+5th from C) raises F to F# to maintain the Major scale formula (W-W-H-W-W-W-H).",
    majorScale: ["G", "A", "B", "C", "D", "E", "F#"],
    minorScale: ["E", "F#", "G", "A", "B", "C", "D"],
    diatonicChords: ["G", "Am", "Bm", "C", "D", "Em", "F#dim"],
    parallelKey: "Gm",
    dominantKey: "D",
    subdominantKey: "C",
    tritoneKey: "Db",
    summary: "Bright, optimistic, and guitar-friendly.",
    popUsage: "Extremely popular on guitar (e.g. 'Sweet Home Alabama', 'Good Riddance')."
  },
  {
    note: "D",
    position: 2,
    sharps: 2,
    flats: 0,
    relativeMinor: "Bm",
    keySignature: ["F#", "C#"],
    keySigExplanation: "2 Sharps (F#, C#). Moving two steps clockwise (+5th from G) adds C# as the 7th scale degree leading tone.",
    majorScale: ["D", "E", "F#", "G", "A", "B", "C#"],
    minorScale: ["B", "C#", "D", "E", "F#", "G", "A"],
    diatonicChords: ["D", "Em", "F#m", "G", "A", "Bm", "C#dim"],
    parallelKey: "Dm",
    dominantKey: "A",
    subdominantKey: "G",
    tritoneKey: "Ab",
    summary: "Resonant and triumphant key.",
    popUsage: "A staple in rock, acoustic ballads, and orchestral music (e.g. 'Hotel California', 'Canon in D')."
  },
  {
    note: "A",
    position: 3,
    sharps: 3,
    flats: 0,
    relativeMinor: "F#m",
    keySignature: ["F#", "C#", "G#"],
    keySigExplanation: "3 Sharps (F#, C#, G#). Adds G# to complete the A major scale harmony.",
    majorScale: ["A", "B", "C#", "D", "E", "F#", "G#"],
    minorScale: ["F#", "G#", "A", "B", "C#", "D", "E"],
    diatonicChords: ["A", "Bm", "C#m", "D", "E", "F#m", "G#dim"],
    parallelKey: "Am",
    dominantKey: "E",
    subdominantKey: "D",
    tritoneKey: "Eb",
    summary: "Energetic and crisp; perfect for electric guitar riffs.",
    popUsage: "Classic rock favorite (e.g. 'Wonderwall', 'Back In Black')."
  },
  {
    note: "E",
    position: 4,
    sharps: 4,
    flats: 0,
    relativeMinor: "C#m",
    keySignature: ["F#", "C#", "G#", "D#"],
    keySigExplanation: "4 Sharps (F#, C#, G#, D#). Adds D# as the major 7th.",
    majorScale: ["E", "F#", "G#", "A", "B", "C#", "D#"],
    minorScale: ["C#", "D#", "E", "F#", "G#", "A", "B"],
    diatonicChords: ["E", "F#m", "G#m", "A", "B", "C#m", "D#dim"],
    parallelKey: "Em",
    dominantKey: "B",
    subdominantKey: "A",
    tritoneKey: "Bb",
    summary: "Warm, powerful open key on guitar.",
    popUsage: "Used heavily in blues and rock ('Pride and Joy', 'Slow Dancing in a Burning Room')."
  },
  {
    note: "B",
    position: 5,
    sharps: 5,
    flats: 0,
    relativeMinor: "G#m",
    keySignature: ["F#", "C#", "G#", "D#", "A#"],
    keySigExplanation: "5 Sharps (F#, C#, G#, D#, A#). Adds A#.",
    majorScale: ["B", "C#", "D#", "E", "F#", "G#", "A#"],
    minorScale: ["G#", "A#", "B", "C#", "D#", "E", "F#"],
    diatonicChords: ["B", "C#m", "D#m", "E", "F#", "G#m", "A#dim"],
    parallelKey: "Bm",
    dominantKey: "F#",
    subdominantKey: "E",
    tritoneKey: "F",
    summary: "Luminous and vivid key.",
    popUsage: "Common in pop ballads and piano compositions."
  },
  {
    note: "F#",
    position: 6,
    sharps: 6,
    flats: 0,
    relativeMinor: "D#m",
    keySignature: ["F#", "C#", "G#", "D#", "A#", "E#"],
    keySigExplanation: "6 Sharps (or 6 Flats as Gb). Sits at the bottom exact midpoint of the circle.",
    majorScale: ["F#", "G#", "A#", "B", "C#", "D#", "E#"],
    minorScale: ["D#", "E#", "F#", "G#", "A#", "B", "C#"],
    diatonicChords: ["F#", "G#m", "A#m", "B", "C#", "D#m", "E#dim"],
    parallelKey: "F#m",
    dominantKey: "C#",
    subdominantKey: "B",
    tritoneKey: "C",
    summary: "Enharmonic pivot key (F# / Gb).",
    popUsage: "Rich, velvety key often used in R&B and soul."
  },
  {
    note: "Db",
    position: 7,
    sharps: 0,
    flats: 5,
    relativeMinor: "Bbm",
    keySignature: ["Bb", "Eb", "Ab", "Db", "Gb"],
    keySigExplanation: "5 Flats (Bb, Eb, Ab, Db, Gb). Moving counter-clockwise (+4th from Ab) adds Gb.",
    majorScale: ["Db", "Eb", "F", "Gb", "Ab", "Bb", "C"],
    minorScale: ["Bb", "C", "Db", "Eb", "F", "Gb", "Ab"],
    diatonicChords: ["Db", "Ebm", "Fm", "Gb", "Ab", "Bbm", "Cdim"],
    parallelKey: "Dbm",
    dominantKey: "Ab",
    subdominantKey: "Gb",
    tritoneKey: "G",
    summary: "Lush, romantic piano key.",
    popUsage: "Favored by pianists for smooth black-key fingerings ('Clair de Lune')."
  },
  {
    note: "Ab",
    position: 8,
    sharps: 0,
    flats: 4,
    relativeMinor: "Fm",
    keySignature: ["Bb", "Eb", "Ab", "Db"],
    keySigExplanation: "4 Flats (Bb, Eb, Ab, Db). Adds Db to lower the 4th degree.",
    majorScale: ["Ab", "Bb", "C", "Db", "Eb", "F", "G"],
    minorScale: ["F", "G", "Ab", "Bb", "C", "Db", "Eb"],
    diatonicChords: ["Ab", "Bbm", "Cm", "Db", "Eb", "Fm", "Gdim"],
    parallelKey: "Abm",
    dominantKey: "Eb",
    subdominantKey: "Db",
    tritoneKey: "D",
    summary: "Warm, mellow, and soulful.",
    popUsage: "Widely used in jazz horns and gospel ballads."
  },
  {
    note: "Eb",
    position: 9,
    sharps: 0,
    flats: 3,
    relativeMinor: "Cm",
    keySignature: ["Bb", "Eb", "Ab"],
    keySigExplanation: "3 Flats (Bb, Eb, Ab). Adds Ab to complete Eb Major.",
    majorScale: ["Eb", "F", "G", "Ab", "Bb", "C", "D"],
    minorScale: ["C", "D", "Eb", "F", "G", "Ab", "Bb"],
    diatonicChords: ["Eb", "Fm", "Gm", "Ab", "Bb", "Cm", "Ddim"],
    parallelKey: "Ebm",
    dominantKey: "Bb",
    subdominantKey: "Ab",
    tritoneKey: "A",
    summary: "Heroic, brassy sound.",
    popUsage: "Famous key for brass instruments and orchestral anthems."
  },
  {
    note: "Bb",
    position: 10,
    sharps: 0,
    flats: 2,
    relativeMinor: "Gm",
    keySignature: ["Bb", "Eb"],
    keySigExplanation: "2 Flats (Bb, Eb). Moving two steps counter-clockwise (+4th from F) adds Eb.",
    majorScale: ["Bb", "C", "D", "Eb", "F", "G", "A"],
    minorScale: ["G", "A", "Bb", "C", "D", "Eb", "F"],
    diatonicChords: ["Bb", "Cm", "Dm", "Eb", "F", "Gm", "Adim"],
    parallelKey: "Bbm",
    dominantKey: "F",
    subdominantKey: "Eb",
    tritoneKey: "E",
    summary: "Smooth, balanced horn key.",
    popUsage: "Standard key in jazz jam sessions and trumpet repertoire."
  },
  {
    note: "F",
    position: 11,
    sharps: 0,
    flats: 1,
    relativeMinor: "Dm",
    keySignature: ["Bb"],
    keySigExplanation: "1 Flat (Bb). Why? Moving counter-clockwise (+4th from C) flattens B to Bb to preserve the 4th interval.",
    majorScale: ["F", "G", "A", "Bb", "C", "D", "E"],
    minorScale: ["D", "E", "F", "G", "A", "Bb", "C"],
    diatonicChords: ["F", "Gm", "Am", "Bb", "C", "Dm", "Edim"],
    parallelKey: "Fm",
    dominantKey: "C",
    subdominantKey: "Bb",
    tritoneKey: "B",
    summary: "Warmer, slightly darker than C Major.",
    popUsage: "Used everywhere from folk to pop ('Hey Jude')."
  }
];

export interface LessonStep {
  id: number;
  title: string;
  subtitle: string;
  task: string;
  targetKey: string | null;
  expectedAction: "click_C" | "click_G" | "click_F" | "click_Am" | "explore";
  explanation: string;
  completedBadge: string;
}

export const LESSONS: LessonStep[] = [
  {
    id: 1,
    title: "Lesson 1: The Root & Baseline",
    subtitle: "Understanding C Major",
    task: "Click [ C ] on the circle wheel to select the root key.",
    targetKey: "C",
    expectedAction: "click_C",
    explanation: "C Major has 0 sharps and 0 flats. It sits at the top 12 o'clock position as the starting point of the Circle of Fifths.",
    completedBadge: "✔ Fifths Baseline"
  },
  {
    id: 2,
    title: "Lesson 2: Clockwise Motion (Fifths & Sharps)",
    subtitle: "Adding Sharps with Brighter Tone",
    task: "Click [ G ] (1 step clockwise from C).",
    targetKey: "G",
    expectedAction: "click_G",
    explanation: "Moving clockwise advances by a perfect 5th (7 semitones) and adds 1 sharp (F#). Notice how G feels brighter!",
    completedBadge: "✔ Clockwise Fifths (+1 Sharp)"
  },
  {
    id: 3,
    title: "Lesson 3: Counter-Clockwise Motion (Fourths & Flats)",
    subtitle: "Adding Flats with Warmer Tone",
    task: "Click [ F ] (1 step counter-clockwise from C).",
    targetKey: "F",
    expectedAction: "click_F",
    explanation: "Moving counter-clockwise advances by a perfect 4th (5 semitones) and adds 1 flat (Bb). Notice how F feels warmer!",
    completedBadge: "✔ Counter-Clockwise Fourths (+1 Flat)"
  },
  {
    id: 4,
    title: "Lesson 4: The Relative Minor",
    subtitle: "Shared Key Signatures",
    task: "Select C again, then check out its Relative Minor [ Am ].",
    targetKey: "Am",
    expectedAction: "click_Am",
    explanation: "Every major key shares its exact key signature with a relative minor (located 3 semitones down). Am shares all notes with C Major!",
    completedBadge: "✔ Relative Minor Relationships"
  },
  {
    id: 5,
    title: "Lesson 5: Diatonic Chords & Songwriting",
    subtitle: "Building Progressions",
    task: "Explore any key and inspect its Primary Chords (I, IV, V).",
    targetKey: null,
    expectedAction: "explore",
    explanation: "Neighboring keys on the circle share 6 out of 7 notes. This is why staying near neighboring keys makes songwriting seamless!",
    completedBadge: "✔ Diatonic Harmony Mastered"
  }
];

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question: "What is the dominant (+5th) of D Major?",
    options: ["G Major", "A Major", "Bm", "C# Major"],
    correctIndex: 1,
    explanation: "Moving 1 step clockwise from D (+5th) brings you to A Major."
  },
  {
    question: "Which key shares the exact same key signature as C Major?",
    options: ["Am", "Em", "Dm", "Cm"],
    correctIndex: 0,
    explanation: "A Minor (Am) is the relative minor of C Major; both have 0 sharps and 0 flats."
  },
  {
    question: "How many sharps are in G Major?",
    options: ["0 Sharps", "1 Sharp (F#)", "2 Sharps (F#, C#)", "3 Sharps"],
    correctIndex: 1,
    explanation: "G Major is 1 step clockwise from C, so it has 1 sharp: F#."
  },
  {
    question: "What happens when you move counter-clockwise on the Circle of Fifths?",
    options: ["Adds 1 Sharp", "Adds 1 Flat", "Changes key to minor", "Increases volume"],
    correctIndex: 1,
    explanation: "Counter-clockwise motion adds flats (or removes sharps) and ascends in intervals of 4ths."
  }
];

export const GLOSSARY_ITEMS = [
  { term: "Circle of Fifths", desc: "A circular arrangement of the 12 chromatic pitches showing their key signatures and harmonic relationships." },
  { term: "Perfect Fifth (+5th)", desc: "An interval of 7 semitones (e.g. C to G). Moving clockwise on the circle." },
  { term: "Perfect Fourth (+4th)", desc: "An interval of 5 semitones (e.g. C to F). Moving counter-clockwise on the circle." },
  { term: "Relative Minor", desc: "The minor key that shares the exact same key signature as a given major key (e.g. C Major and A Minor)." },
  { term: "Key Signature", desc: "The collection of sharps (♯) or flats (♭) indicated at the start of a piece of music." },
  { term: "Secondary Dominant", desc: "A non-diatonic dominant 7th chord used to resolve temporarily to a target chord in the key." },
  { term: "Modal Interchange", desc: "Borrowing chords from a parallel mode (e.g. borrowing iv or bVII from C minor into C major)." }
];

export const FLOATING_TIPS = [
  "💡 Tip: Most pop songs stay within neighboring keys on the circle. Try switching between C, G, F, and Am!",
  "💡 Tip: The relative minor sits 3 semitones down from the major root, sharing 100% of its scale notes.",
  "💡 Tip: Want a bluesy rock cadence? Borrow the bVII chord from the Mixolydian mode!",
  "💡 Tip: Moving clockwise adds 1 sharp. Moving counter-clockwise adds 1 flat."
];
