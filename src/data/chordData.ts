import { ChordLibraryData } from "@/types/chordTypes";

// Comprehensive chord library data with root → variants structure
export const chordLibraryData: ChordLibraryData = {
  version: "1.0.0",
  roots: [
    {
      root: "C",
      variants: [
        {
          name: "Major",
          fullName: "C Major",
          intervals: "1-3-5",
          voicings: [
            { frets: [-1, 3, 2, 0, 1, 0], fingers: ["x", "3", "2", "0", "1", "0"], position: 0, difficulty: "easy" },
            { frets: [-1, 3, 5, 5, 5, 3], fingers: ["x", "1", "3", "3", "3", "1"], position: 3, difficulty: "medium" },
            { frets: [8, 10, 10, 9, 8, 8], fingers: ["1", "3", "4", "2", "1", "1"], position: 8, difficulty: "hard" },
          ],
          theoryText: "The major chord consists of the root, major third, and perfect fifth. It has a bright, happy sound."
        },
        {
          name: "Minor",
          fullName: "C Minor",
          intervals: "1-♭3-5",
          voicings: [
            { frets: [-1, 3, 5, 5, 4, 3], fingers: ["x", "1", "3", "4", "2", "1"], position: 3, difficulty: "medium" },
          ],
          theoryText: "The minor chord replaces the major third with a minor third, creating a sad or melancholic sound."
        },
        {
          name: "7",
          fullName: "C7",
          intervals: "1-3-5-♭7",
          voicings: [
            { frets: [-1, 3, 2, 3, 1, 0], fingers: ["x", "3", "2", "4", "1", "0"], position: 0, difficulty: "easy" },
          ],
          theoryText: "The dominant 7th chord adds a minor seventh to the major triad. Common in blues and jazz."
        },
        {
          name: "maj7",
          fullName: "Cmaj7",
          intervals: "1-3-5-7",
          voicings: [
            { frets: [-1, 3, 2, 0, 0, 0], fingers: ["x", "3", "2", "0", "0", "0"], position: 0, difficulty: "easy" },
          ],
          theoryText: "The major 7th chord adds a major seventh to the major triad. Creates a dreamy, jazzy sound."
        },
        {
          name: "m7",
          fullName: "Cm7",
          intervals: "1-♭3-5-♭7",
          voicings: [
            { frets: [-1, 3, 1, 3, 1, 3], fingers: ["x", "3", "1", "4", "1", "1"], position: 3, difficulty: "medium" },
          ],
          theoryText: "The minor 7th chord adds a minor seventh to the minor triad. Common in jazz and R&B."
        },
        {
          name: "sus4",
          fullName: "Csus4",
          intervals: "1-4-5",
          voicings: [
            { frets: [-1, 3, 3, 0, 1, 1], fingers: ["x", "3", "4", "0", "1", "1"], position: 0, difficulty: "easy" },
          ],
          theoryText: "The sus4 chord replaces the third with a perfect fourth, creating tension that resolves to major."
        },
        {
          name: "sus2",
          fullName: "Csus2",
          intervals: "1-2-5",
          voicings: [
            { frets: [-1, 3, 0, 0, 3, 3], fingers: ["x", "2", "0", "0", "3", "4"], position: 0, difficulty: "easy" },
          ],
          theoryText: "The sus2 chord replaces the third with a major second, creating an open, airy sound."
        },
        {
          name: "add9",
          fullName: "Cadd9",
          intervals: "1-3-5-9",
          voicings: [
            { frets: [-1, 3, 2, 0, 3, 0], fingers: ["x", "3", "2", "0", "4", "0"], position: 0, difficulty: "medium" },
          ],
          theoryText: "The add9 chord adds a major ninth to the major triad without the seventh."
        },
        {
          name: "dim",
          fullName: "Cdim",
          intervals: "1-♭3-♭5",
          voicings: [
            { frets: [-1, 3, 4, 5, 4, -1], fingers: ["x", "1", "2", "4", "3", "x"], position: 3, difficulty: "hard" },
          ],
          theoryText: "The diminished chord has a minor third and diminished fifth, creating strong tension."
        },
        {
          name: "aug",
          fullName: "Caug",
          intervals: "1-3-♯5",
          voicings: [
            { frets: [-1, 3, 2, 1, 1, 0], fingers: ["x", "4", "3", "2", "1", "0"], position: 0, difficulty: "medium" },
          ],
          theoryText: "The augmented chord has a major third and augmented fifth, creating an unstable, mysterious sound."
        },
        {
          name: "6",
          fullName: "C6",
          intervals: "1-3-5-6",
          voicings: [
            { frets: [-1, 3, 2, 2, 1, 0], fingers: ["x", "4", "2", "3", "1", "0"], position: 0, difficulty: "medium" },
          ],
          theoryText: "The 6th chord adds a major sixth to the major triad. Popular in jazz and swing."
        },
      ]
    },
    {
      root: "C#",
      variants: [
        {
          name: "Major",
          fullName: "C# Major",
          intervals: "1-3-5",
          voicings: [
            { frets: [-1, 4, 6, 6, 6, 4], fingers: ["x", "1", "3", "3", "3", "1"], position: 4, difficulty: "medium" },
          ],
          theoryText: "The major chord consists of the root, major third, and perfect fifth. It has a bright, happy sound."
        },
        {
          name: "Minor",
          fullName: "C# Minor",
          intervals: "1-♭3-5",
          voicings: [
            { frets: [-1, 4, 6, 6, 5, 4], fingers: ["x", "1", "3", "4", "2", "1"], position: 4, difficulty: "medium" },
          ],
          theoryText: "The minor chord replaces the major third with a minor third, creating a sad or melancholic sound."
        },
        {
          name: "7",
          fullName: "C#7",
          intervals: "1-3-5-♭7",
          voicings: [
            { frets: [-1, 4, 3, 4, 2, 4], fingers: ["x", "3", "2", "4", "1", "5"], position: 4, difficulty: "hard" },
          ],
          theoryText: "The dominant 7th chord adds a minor seventh to the major triad. Common in blues and jazz."
        },
        {
          name: "maj7",
          fullName: "C#maj7",
          intervals: "1-3-5-7",
          voicings: [
            { frets: [-1, 4, 3, 1, 1, 1], fingers: ["x", "4", "3", "1", "1", "1"], position: 1, difficulty: "medium" },
          ],
          theoryText: "The major 7th chord adds a major seventh to the major triad. Creates a dreamy, jazzy sound."
        },
        {
          name: "m7",
          fullName: "C#m7",
          intervals: "1-♭3-5-♭7",
          voicings: [
            { frets: [-1, 4, 2, 4, 2, 4], fingers: ["x", "3", "1", "4", "1", "1"], position: 4, difficulty: "medium" },
          ],
          theoryText: "The minor 7th chord adds a minor seventh to the minor triad. Common in jazz and R&B."
        },
        {
          name: "sus4",
          fullName: "C#sus4",
          intervals: "1-4-5",
          voicings: [
            { frets: [-1, 4, 4, 1, 2, 2], fingers: ["x", "3", "4", "0", "1", "1"], position: 1, difficulty: "medium" },
          ],
          theoryText: "The sus4 chord replaces the third with a perfect fourth, creating tension that resolves to major."
        },
        {
          name: "sus2",
          fullName: "C#sus2",
          intervals: "1-2-5",
          voicings: [
            { frets: [-1, 4, 1, 1, 4, 4], fingers: ["x", "2", "0", "0", "3", "4"], position: 1, difficulty: "medium" },
          ],
          theoryText: "The sus2 chord replaces the third with a major second, creating an open, airy sound."
        },
        {
          name: "dim",
          fullName: "C#dim",
          intervals: "1-♭3-♭5",
          voicings: [
            { frets: [-1, 4, 5, 6, 5, -1], fingers: ["x", "1", "2", "4", "3", "x"], position: 4, difficulty: "hard" },
          ],
          theoryText: "The diminished chord has a minor third and diminished fifth, creating strong tension."
        },
        {
          name: "aug",
          fullName: "C#aug",
          intervals: "1-3-♯5",
          voicings: [
            { frets: [-1, 4, 3, 2, 2, 1], fingers: ["x", "4", "3", "2", "1", "0"], position: 1, difficulty: "hard" },
          ],
          theoryText: "The augmented chord has a major third and augmented fifth, creating an unstable, mysterious sound."
        },
      ]
    },
    {
      root: "G",
      variants: [
        {
          name: "Major",
          fullName: "G Major",
          intervals: "1-3-5",
          voicings: [
            { frets: [3, 2, 0, 0, 0, 3], fingers: ["3", "2", "0", "0", "0", "4"], position: 0, difficulty: "easy" },
            { frets: [3, 5, 5, 4, 3, 3], fingers: ["1", "3", "4", "2", "1", "1"], position: 3, difficulty: "medium" },
          ],
          theoryText: "The major chord consists of the root, major third, and perfect fifth."
        },
        {
          name: "Minor",
          fullName: "G Minor",
          intervals: "1-♭3-5",
          voicings: [
            { frets: [3, 5, 5, 3, 3, 3], fingers: ["1", "3", "4", "1", "1", "1"], position: 3, difficulty: "medium" },
          ],
          theoryText: "The minor chord replaces the major third with a minor third."
        },
        {
          name: "7",
          fullName: "G7",
          intervals: "1-3-5-♭7",
          voicings: [
            { frets: [3, 2, 0, 0, 0, 1], fingers: ["3", "2", "0", "0", "0", "1"], position: 0, difficulty: "easy" },
          ],
          theoryText: "The dominant 7th chord adds a minor seventh to the major triad."
        },
        {
          name: "maj7",
          fullName: "Gmaj7",
          intervals: "1-3-5-7",
          voicings: [
            { frets: [3, 2, 0, 0, 0, 2], fingers: ["3", "1", "0", "0", "0", "2"], position: 0, difficulty: "easy" },
          ],
          theoryText: "The major 7th chord adds a major seventh to the major triad. Creates a dreamy, jazzy sound."
        },
        {
          name: "m7",
          fullName: "Gm7",
          intervals: "1-♭3-5-♭7",
          voicings: [
            { frets: [3, 5, 3, 3, 3, 3], fingers: ["1", "3", "1", "1", "1", "1"], position: 3, difficulty: "medium" },
          ],
          theoryText: "The minor 7th chord adds a minor seventh to the minor triad. Common in jazz and R&B."
        },
        {
          name: "sus4",
          fullName: "Gsus4",
          intervals: "1-4-5",
          voicings: [
            { frets: [3, 3, 0, 0, 1, 3], fingers: ["3", "4", "0", "0", "1", "4"], position: 0, difficulty: "easy" },
          ],
          theoryText: "The sus4 chord replaces the third with a perfect fourth, creating tension that resolves to major."
        },
        {
          name: "sus2",
          fullName: "Gsus2",
          intervals: "1-2-5",
          voicings: [
            { frets: [3, 0, 0, 0, 3, 3], fingers: ["2", "0", "0", "0", "3", "4"], position: 0, difficulty: "easy" },
          ],
          theoryText: "The sus2 chord replaces the third with a major second, creating an open, airy sound."
        },
        {
          name: "dim",
          fullName: "Gdim",
          intervals: "1-♭3-♭5",
          voicings: [
            { frets: [3, 4, 5, 4, -1, -1], fingers: ["1", "2", "4", "3", "x", "x"], position: 3, difficulty: "hard" },
          ],
          theoryText: "The diminished chord has a minor third and diminished fifth, creating strong tension."
        },
        {
          name: "aug",
          fullName: "Gaug",
          intervals: "1-3-♯5",
          voicings: [
            { frets: [3, 2, 1, 0, 0, 3], fingers: ["4", "3", "2", "0", "0", "5"], position: 0, difficulty: "hard" },
          ],
          theoryText: "The augmented chord has a major third and augmented fifth, creating an unstable, mysterious sound."
        },
      ]
    },
    {
      root: "G#",
      variants: [
        {
          name: "Major",
          fullName: "G# Major",
          intervals: "1-3-5",
          voicings: [
            { frets: [4, 6, 6, 5, 4, 4], fingers: ["1", "3", "4", "2", "1", "1"], position: 4, difficulty: "medium" },
          ],
          theoryText: "The major chord consists of the root, major third, and perfect fifth."
        },
        {
          name: "Minor",
          fullName: "G# Minor",
          intervals: "1-♭3-5",
          voicings: [
            { frets: [4, 6, 6, 4, 4, 4], fingers: ["1", "3", "4", "1", "1", "1"], position: 4, difficulty: "medium" },
          ],
          theoryText: "The minor chord replaces the major third with a minor third."
        },
        {
          name: "7",
          fullName: "G#7",
          intervals: "1-3-5-♭7",
          voicings: [
            { frets: [4, 6, 4, 5, 4, 4], fingers: ["1", "4", "1", "3", "1", "1"], position: 4, difficulty: "hard" },
          ],
          theoryText: "The dominant 7th chord adds a minor seventh to the major triad."
        },
        {
          name: "maj7",
          fullName: "G#maj7",
          intervals: "1-3-5-7",
          voicings: [
            { frets: [4, 6, 5, 5, 4, 4], fingers: ["1", "4", "2", "3", "1", "1"], position: 4, difficulty: "medium" },
          ],
          theoryText: "The major 7th chord adds a major seventh to the major triad. Creates a dreamy, jazzy sound."
        },
        {
          name: "m7",
          fullName: "G#m7",
          intervals: "1-♭3-5-♭7",
          voicings: [
            { frets: [4, 6, 4, 4, 4, 4], fingers: ["1", "3", "1", "1", "1", "1"], position: 4, difficulty: "medium" },
          ],
          theoryText: "The minor 7th chord adds a minor seventh to the minor triad. Common in jazz and R&B."
        },
        {
          name: "sus4",
          fullName: "G#sus4",
          intervals: "1-4-5",
          voicings: [
            { frets: [4, 4, 1, 1, 2, 4], fingers: ["3", "4", "0", "0", "1", "4"], position: 1, difficulty: "medium" },
          ],
          theoryText: "The sus4 chord replaces the third with a perfect fourth, creating tension that resolves to major."
        },
        {
          name: "dim",
          fullName: "G#dim",
          intervals: "1-♭3-♭5",
          voicings: [
            { frets: [4, 5, 6, 5, -1, -1], fingers: ["1", "2", "4", "3", "x", "x"], position: 4, difficulty: "hard" },
          ],
          theoryText: "The diminished chord has a minor third and diminished fifth, creating strong tension."
        },
      ]
    },
    {
      root: "D",
      variants: [
        {
          name: "Major",
          fullName: "D Major",
          intervals: "1-3-5",
          voicings: [
            { frets: [-1, -1, 0, 2, 3, 2], fingers: ["x", "x", "0", "1", "3", "2"], position: 0, difficulty: "easy" },
            { frets: [-1, 5, 7, 7, 7, 5], fingers: ["x", "1", "3", "3", "3", "1"], position: 5, difficulty: "medium" },
          ],
          theoryText: "The major chord consists of the root, major third, and perfect fifth."
        },
        {
          name: "Minor",
          fullName: "D Minor",
          intervals: "1-♭3-5",
          voicings: [
            { frets: [-1, -1, 0, 2, 3, 1], fingers: ["x", "x", "0", "2", "3", "1"], position: 0, difficulty: "easy" },
            { frets: [-1, 5, 7, 7, 6, 5], fingers: ["x", "1", "3", "4", "2", "1"], position: 5, difficulty: "medium" },
          ],
          theoryText: "The minor chord replaces the major third with a minor third."
        },
        {
          name: "7",
          fullName: "D7",
          intervals: "1-3-5-♭7",
          voicings: [
            { frets: [-1, -1, 0, 2, 1, 2], fingers: ["x", "x", "0", "2", "1", "3"], position: 0, difficulty: "easy" },
          ],
          theoryText: "The dominant 7th chord adds a minor seventh to the major triad. Common in blues and jazz."
        },
        {
          name: "maj7",
          fullName: "Dmaj7",
          intervals: "1-3-5-7",
          voicings: [
            { frets: [-1, -1, 0, 2, 2, 2], fingers: ["x", "x", "0", "1", "1", "1"], position: 0, difficulty: "easy" },
          ],
          theoryText: "The major 7th chord adds a major seventh to the major triad. Creates a dreamy, jazzy sound."
        },
        {
          name: "m7",
          fullName: "Dm7",
          intervals: "1-♭3-5-♭7",
          voicings: [
            { frets: [-1, -1, 0, 2, 1, 1], fingers: ["x", "x", "0", "2", "1", "1"], position: 0, difficulty: "easy" },
          ],
          theoryText: "The minor 7th chord adds a minor seventh to the minor triad. Common in jazz and R&B."
        },
        {
          name: "sus4",
          fullName: "Dsus4",
          intervals: "1-4-5",
          voicings: [
            { frets: [-1, -1, 0, 2, 3, 3], fingers: ["x", "x", "0", "1", "2", "3"], position: 0, difficulty: "easy" },
          ],
          theoryText: "The sus4 chord replaces the third with a perfect fourth, creating tension that resolves to major."
        },
        {
          name: "sus2",
          fullName: "Dsus2",
          intervals: "1-2-5",
          voicings: [
            { frets: [-1, -1, 0, 2, 3, 0], fingers: ["x", "x", "0", "1", "2", "0"], position: 0, difficulty: "easy" },
          ],
          theoryText: "The sus2 chord replaces the third with a major second, creating an open, airy sound."
        },
        {
          name: "dim",
          fullName: "Ddim",
          intervals: "1-♭3-♭5",
          voicings: [
            { frets: [-1, -1, 0, 1, 0, 1], fingers: ["x", "x", "0", "1", "0", "2"], position: 0, difficulty: "easy" },
          ],
          theoryText: "The diminished chord has a minor third and diminished fifth, creating strong tension."
        },
        {
          name: "aug",
          fullName: "Daug",
          intervals: "1-3-♯5",
          voicings: [
            { frets: [-1, -1, 0, 3, 3, 2], fingers: ["x", "x", "0", "2", "3", "1"], position: 0, difficulty: "medium" },
          ],
          theoryText: "The augmented chord has a major third and augmented fifth, creating an unstable, mysterious sound."
        },
      ]
    },
    {
      root: "D#",
      variants: [
        {
          name: "Major",
          fullName: "D# Major",
          intervals: "1-3-5",
          voicings: [
            { frets: [-1, 6, 8, 8, 8, 6], fingers: ["x", "1", "3", "3", "3", "1"], position: 6, difficulty: "medium" },
          ],
          theoryText: "The major chord consists of the root, major third, and perfect fifth."
        },
        {
          name: "Minor",
          fullName: "D# Minor",
          intervals: "1-♭3-5",
          voicings: [
            { frets: [-1, 6, 8, 8, 7, 6], fingers: ["x", "1", "3", "4", "2", "1"], position: 6, difficulty: "medium" },
          ],
          theoryText: "The minor chord replaces the major third with a minor third."
        },
        {
          name: "7",
          fullName: "D#7",
          intervals: "1-3-5-♭7",
          voicings: [
            { frets: [-1, 6, 5, 6, 4, 6], fingers: ["x", "3", "2", "4", "1", "5"], position: 6, difficulty: "hard" },
          ],
          theoryText: "The dominant 7th chord adds a minor seventh to the major triad."
        },
        {
          name: "maj7",
          fullName: "D#maj7",
          intervals: "1-3-5-7",
          voicings: [
            { frets: [-1, 6, 5, 3, 3, 3], fingers: ["x", "4", "3", "1", "1", "1"], position: 3, difficulty: "medium" },
          ],
          theoryText: "The major 7th chord adds a major seventh to the major triad. Creates a dreamy, jazzy sound."
        },
        {
          name: "m7",
          fullName: "D#m7",
          intervals: "1-♭3-5-♭7",
          voicings: [
            { frets: [-1, 6, 4, 6, 4, 6], fingers: ["x", "3", "1", "4", "1", "1"], position: 6, difficulty: "medium" },
          ],
          theoryText: "The minor 7th chord adds a minor seventh to the minor triad. Common in jazz and R&B."
        },
        {
          name: "sus4",
          fullName: "D#sus4",
          intervals: "1-4-5",
          voicings: [
            { frets: [-1, 6, 6, 3, 4, 4], fingers: ["x", "3", "4", "0", "1", "1"], position: 3, difficulty: "medium" },
          ],
          theoryText: "The sus4 chord replaces the third with a perfect fourth, creating tension that resolves to major."
        },
        {
          name: "dim",
          fullName: "D#dim",
          intervals: "1-♭3-♭5",
          voicings: [
            { frets: [-1, 6, 7, 8, 7, -1], fingers: ["x", "1", "2", "4", "3", "x"], position: 6, difficulty: "hard" },
          ],
          theoryText: "The diminished chord has a minor third and diminished fifth, creating strong tension."
        },
      ]
    },
    {
      root: "A",
      variants: [
        {
          name: "Major",
          fullName: "A Major",
          intervals: "1-3-5",
          voicings: [
            { frets: [-1, 0, 2, 2, 2, 0], fingers: ["x", "0", "2", "2", "2", "0"], position: 0, difficulty: "easy" },
            { frets: [5, 7, 7, 6, 5, 5], fingers: ["1", "3", "4", "2", "1", "1"], position: 5, difficulty: "medium" },
          ],
          theoryText: "The major chord consists of the root, major third, and perfect fifth."
        },
        {
          name: "Minor",
          fullName: "A Minor",
          intervals: "1-♭3-5",
          voicings: [
            { frets: [-1, 0, 2, 2, 1, 0], fingers: ["x", "0", "2", "3", "1", "0"], position: 0, difficulty: "easy" },
            { frets: [5, 7, 7, 5, 5, 5], fingers: ["1", "3", "4", "1", "1", "1"], position: 5, difficulty: "medium" },
          ],
          theoryText: "The minor chord replaces the major third with a minor third."
        },
        {
          name: "7",
          fullName: "A7",
          intervals: "1-3-5-♭7",
          voicings: [
            { frets: [-1, 0, 2, 0, 2, 0], fingers: ["x", "0", "2", "0", "3", "0"], position: 0, difficulty: "easy" },
          ],
          theoryText: "The dominant 7th chord adds a minor seventh to the major triad. Common in blues and jazz."
        },
        {
          name: "maj7",
          fullName: "Amaj7",
          intervals: "1-3-5-7",
          voicings: [
            { frets: [-1, 0, 2, 1, 2, 0], fingers: ["x", "0", "2", "1", "3", "0"], position: 0, difficulty: "easy" },
          ],
          theoryText: "The major 7th chord adds a major seventh to the major triad. Creates a dreamy, jazzy sound."
        },
        {
          name: "m7",
          fullName: "Am7",
          intervals: "1-♭3-5-♭7",
          voicings: [
            { frets: [-1, 0, 2, 0, 1, 0], fingers: ["x", "0", "2", "0", "1", "0"], position: 0, difficulty: "easy" },
          ],
          theoryText: "The minor 7th chord adds a minor seventh to the minor triad. Common in jazz and R&B."
        },
        {
          name: "sus4",
          fullName: "Asus4",
          intervals: "1-4-5",
          voicings: [
            { frets: [-1, 0, 2, 2, 3, 0], fingers: ["x", "0", "1", "1", "2", "0"], position: 0, difficulty: "easy" },
          ],
          theoryText: "The sus4 chord replaces the third with a perfect fourth, creating tension that resolves to major."
        },
        {
          name: "sus2",
          fullName: "Asus2",
          intervals: "1-2-5",
          voicings: [
            { frets: [-1, 0, 2, 2, 0, 0], fingers: ["x", "0", "2", "3", "0", "0"], position: 0, difficulty: "easy" },
          ],
          theoryText: "The sus2 chord replaces the third with a major second, creating an open, airy sound."
        },
        {
          name: "dim",
          fullName: "Adim",
          intervals: "1-♭3-♭5",
          voicings: [
            { frets: [-1, 0, 1, 2, 1, -1], fingers: ["x", "0", "1", "3", "2", "x"], position: 0, difficulty: "medium" },
          ],
          theoryText: "The diminished chord has a minor third and diminished fifth, creating strong tension."
        },
        {
          name: "aug",
          fullName: "Aaug",
          intervals: "1-3-♯5",
          voicings: [
            { frets: [-1, 0, 3, 2, 2, 1], fingers: ["x", "0", "4", "2", "3", "1"], position: 0, difficulty: "medium" },
          ],
          theoryText: "The augmented chord has a major third and augmented fifth, creating an unstable, mysterious sound."
        },
      ]
    },
    {
      root: "A#",
      variants: [
        {
          name: "Major",
          fullName: "A# Major",
          intervals: "1-3-5",
          voicings: [
            { frets: [-1, 1, 3, 3, 3, 1], fingers: ["x", "1", "3", "3", "3", "1"], position: 1, difficulty: "medium" },
            { frets: [6, 8, 8, 7, 6, 6], fingers: ["1", "3", "4", "2", "1", "1"], position: 6, difficulty: "medium" },
          ],
          theoryText: "The major chord consists of the root, major third, and perfect fifth."
        },
        {
          name: "Minor",
          fullName: "A# Minor",
          intervals: "1-♭3-5",
          voicings: [
            { frets: [-1, 1, 3, 3, 2, 1], fingers: ["x", "1", "3", "4", "2", "1"], position: 1, difficulty: "medium" },
            { frets: [6, 8, 8, 6, 6, 6], fingers: ["1", "3", "4", "1", "1", "1"], position: 6, difficulty: "medium" },
          ],
          theoryText: "The minor chord replaces the major third with a minor third."
        },
        {
          name: "7",
          fullName: "A#7",
          intervals: "1-3-5-♭7",
          voicings: [
            { frets: [-1, 1, 3, 1, 3, 1], fingers: ["x", "1", "3", "1", "4", "1"], position: 1, difficulty: "hard" },
          ],
          theoryText: "The dominant 7th chord adds a minor seventh to the major triad."
        },
        {
          name: "maj7",
          fullName: "A#maj7",
          intervals: "1-3-5-7",
          voicings: [
            { frets: [-1, 1, 3, 2, 3, 1], fingers: ["x", "1", "3", "2", "4", "1"], position: 1, difficulty: "medium" },
          ],
          theoryText: "The major 7th chord adds a major seventh to the major triad. Creates a dreamy, jazzy sound."
        },
        {
          name: "m7",
          fullName: "A#m7",
          intervals: "1-♭3-5-♭7",
          voicings: [
            { frets: [-1, 1, 3, 1, 2, 1], fingers: ["x", "1", "3", "1", "2", "1"], position: 1, difficulty: "medium" },
          ],
          theoryText: "The minor 7th chord adds a minor seventh to the minor triad. Common in jazz and R&B."
        },
        {
          name: "sus4",
          fullName: "A#sus4",
          intervals: "1-4-5",
          voicings: [
            { frets: [-1, 1, 3, 3, 4, 1], fingers: ["x", "1", "2", "2", "3", "1"], position: 1, difficulty: "medium" },
          ],
          theoryText: "The sus4 chord replaces the third with a perfect fourth, creating tension that resolves to major."
        },
        {
          name: "dim",
          fullName: "A#dim",
          intervals: "1-♭3-♭5",
          voicings: [
            { frets: [-1, 1, 2, 3, 2, -1], fingers: ["x", "1", "2", "4", "3", "x"], position: 1, difficulty: "hard" },
          ],
          theoryText: "The diminished chord has a minor third and diminished fifth, creating strong tension."
        },
      ]
    },
    {
      root: "E",
      variants: [
        {
          name: "Major",
          fullName: "E Major",
          intervals: "1-3-5",
          voicings: [
            { frets: [0, 2, 2, 1, 0, 0], fingers: ["0", "2", "3", "1", "0", "0"], position: 0, difficulty: "easy" },
            { frets: [-1, 7, 9, 9, 9, 7], fingers: ["x", "1", "3", "3", "3", "1"], position: 7, difficulty: "medium" },
          ],
          theoryText: "The major chord consists of the root, major third, and perfect fifth."
        },
        {
          name: "Minor",
          fullName: "E Minor",
          intervals: "1-♭3-5",
          voicings: [
            { frets: [0, 2, 2, 0, 0, 0], fingers: ["0", "2", "3", "0", "0", "0"], position: 0, difficulty: "easy" },
            { frets: [-1, 7, 9, 9, 8, 7], fingers: ["x", "1", "3", "4", "2", "1"], position: 7, difficulty: "medium" },
          ],
          theoryText: "The minor chord replaces the major third with a minor third."
        },
        {
          name: "7",
          fullName: "E7",
          intervals: "1-3-5-♭7",
          voicings: [
            { frets: [0, 2, 0, 1, 0, 0], fingers: ["0", "2", "0", "1", "0", "0"], position: 0, difficulty: "easy" },
          ],
          theoryText: "The dominant 7th chord adds a minor seventh to the major triad. Common in blues and jazz."
        },
        {
          name: "maj7",
          fullName: "Emaj7",
          intervals: "1-3-5-7",
          voicings: [
            { frets: [0, 2, 1, 1, 0, 0], fingers: ["0", "2", "1", "1", "0", "0"], position: 0, difficulty: "easy" },
          ],
          theoryText: "The major 7th chord adds a major seventh to the major triad. Creates a dreamy, jazzy sound."
        },
        {
          name: "m7",
          fullName: "Em7",
          intervals: "1-♭3-5-♭7",
          voicings: [
            { frets: [0, 2, 0, 0, 0, 0], fingers: ["0", "1", "0", "0", "0", "0"], position: 0, difficulty: "easy" },
          ],
          theoryText: "The minor 7th chord adds a minor seventh to the minor triad. Common in jazz and R&B."
        },
        {
          name: "sus4",
          fullName: "Esus4",
          intervals: "1-4-5",
          voicings: [
            { frets: [0, 2, 2, 2, 0, 0], fingers: ["0", "2", "3", "4", "0", "0"], position: 0, difficulty: "easy" },
          ],
          theoryText: "The sus4 chord replaces the third with a perfect fourth, creating tension that resolves to major."
        },
        {
          name: "sus2",
          fullName: "Esus2",
          intervals: "1-2-5",
          voicings: [
            { frets: [0, 2, 4, 4, 0, 0], fingers: ["0", "1", "3", "4", "0", "0"], position: 0, difficulty: "easy" },
          ],
          theoryText: "The sus2 chord replaces the third with a major second, creating an open, airy sound."
        },
        {
          name: "dim",
          fullName: "Edim",
          intervals: "1-♭3-♭5",
          voicings: [
            { frets: [-1, -1, 2, 3, 2, 3], fingers: ["x", "x", "1", "3", "2", "4"], position: 2, difficulty: "medium" },
          ],
          theoryText: "The diminished chord has a minor third and diminished fifth, creating strong tension."
        },
        {
          name: "aug",
          fullName: "Eaug",
          intervals: "1-3-♯5",
          voicings: [
            { frets: [0, 3, 2, 1, 1, 0], fingers: ["0", "4", "3", "1", "2", "0"], position: 0, difficulty: "medium" },
          ],
          theoryText: "The augmented chord has a major third and augmented fifth, creating an unstable, mysterious sound."
        },
      ]
    },
    {
      root: "F",
      variants: [
        {
          name: "Major",
          fullName: "F Major",
          intervals: "1-3-5",
          voicings: [
            { frets: [1, 3, 3, 2, 1, 1], fingers: ["1", "3", "4", "2", "1", "1"], position: 1, difficulty: "medium" },
            { frets: [-1, 8, 10, 10, 10, 8], fingers: ["x", "1", "3", "3", "3", "1"], position: 8, difficulty: "medium" },
          ],
          theoryText: "The major chord consists of the root, major third, and perfect fifth."
        },
        {
          name: "Minor",
          fullName: "F Minor",
          intervals: "1-♭3-5",
          voicings: [
            { frets: [1, 3, 3, 1, 1, 1], fingers: ["1", "3", "4", "1", "1", "1"], position: 1, difficulty: "medium" },
            { frets: [-1, 8, 10, 10, 9, 8], fingers: ["x", "1", "3", "4", "2", "1"], position: 8, difficulty: "medium" },
          ],
          theoryText: "The minor chord replaces the major third with a minor third."
        },
        {
          name: "7",
          fullName: "F7",
          intervals: "1-3-5-♭7",
          voicings: [
            { frets: [1, 3, 1, 2, 1, 1], fingers: ["1", "3", "1", "2", "1", "1"], position: 1, difficulty: "hard" },
          ],
          theoryText: "The dominant 7th chord adds a minor seventh to the major triad. Common in blues and jazz."
        },
        {
          name: "maj7",
          fullName: "Fmaj7",
          intervals: "1-3-5-7",
          voicings: [
            { frets: [1, 3, 2, 2, 1, 1], fingers: ["1", "3", "2", "2", "1", "1"], position: 1, difficulty: "medium" },
          ],
          theoryText: "The major 7th chord adds a major seventh to the major triad. Creates a dreamy, jazzy sound."
        },
        {
          name: "m7",
          fullName: "Fm7",
          intervals: "1-♭3-5-♭7",
          voicings: [
            { frets: [1, 3, 1, 1, 1, 1], fingers: ["1", "3", "1", "1", "1", "1"], position: 1, difficulty: "medium" },
          ],
          theoryText: "The minor 7th chord adds a minor seventh to the minor triad. Common in jazz and R&B."
        },
        {
          name: "sus4",
          fullName: "Fsus4",
          intervals: "1-4-5",
          voicings: [
            { frets: [1, 3, 3, 3, 1, 1], fingers: ["1", "2", "3", "4", "1", "1"], position: 1, difficulty: "medium" },
          ],
          theoryText: "The sus4 chord replaces the third with a perfect fourth, creating tension that resolves to major."
        },
        {
          name: "sus2",
          fullName: "Fsus2",
          intervals: "1-2-5",
          voicings: [
            { frets: [1, 3, 3, 0, 1, 1], fingers: ["1", "3", "4", "0", "1", "1"], position: 1, difficulty: "medium" },
          ],
          theoryText: "The sus2 chord replaces the third with a major second, creating an open, airy sound."
        },
        {
          name: "dim",
          fullName: "Fdim",
          intervals: "1-♭3-♭5",
          voicings: [
            { frets: [1, 2, 3, 1, -1, -1], fingers: ["1", "2", "4", "1", "x", "x"], position: 1, difficulty: "hard" },
          ],
          theoryText: "The diminished chord has a minor third and diminished fifth, creating strong tension."
        },
        {
          name: "aug",
          fullName: "Faug",
          intervals: "1-3-♯5",
          voicings: [
            { frets: [1, 4, 3, 2, 2, 1], fingers: ["1", "4", "3", "2", "2", "1"], position: 1, difficulty: "hard" },
          ],
          theoryText: "The augmented chord has a major third and augmented fifth, creating an unstable, mysterious sound."
        },
      ]
    },
    {
      root: "F#",
      variants: [
        {
          name: "Major",
          fullName: "F# Major",
          intervals: "1-3-5",
          voicings: [
            { frets: [2, 4, 4, 3, 2, 2], fingers: ["1", "3", "4", "2", "1", "1"], position: 2, difficulty: "medium" },
          ],
          theoryText: "The major chord consists of the root, major third, and perfect fifth."
        },
        {
          name: "Minor",
          fullName: "F# Minor",
          intervals: "1-♭3-5",
          voicings: [
            { frets: [2, 4, 4, 2, 2, 2], fingers: ["1", "3", "4", "1", "1", "1"], position: 2, difficulty: "medium" },
          ],
          theoryText: "The minor chord replaces the major third with a minor third."
        },
        {
          name: "7",
          fullName: "F#7",
          intervals: "1-3-5-♭7",
          voicings: [
            { frets: [2, 4, 2, 3, 2, 2], fingers: ["1", "3", "1", "2", "1", "1"], position: 2, difficulty: "hard" },
          ],
          theoryText: "The dominant 7th chord adds a minor seventh to the major triad."
        },
        {
          name: "maj7",
          fullName: "F#maj7",
          intervals: "1-3-5-7",
          voicings: [
            { frets: [2, 4, 3, 3, 2, 2], fingers: ["1", "3", "2", "2", "1", "1"], position: 2, difficulty: "medium" },
          ],
          theoryText: "The major 7th chord adds a major seventh to the major triad. Creates a dreamy, jazzy sound."
        },
        {
          name: "m7",
          fullName: "F#m7",
          intervals: "1-♭3-5-♭7",
          voicings: [
            { frets: [2, 4, 2, 2, 2, 2], fingers: ["1", "3", "1", "1", "1", "1"], position: 2, difficulty: "medium" },
          ],
          theoryText: "The minor 7th chord adds a minor seventh to the minor triad. Common in jazz and R&B."
        },
        {
          name: "sus4",
          fullName: "F#sus4",
          intervals: "1-4-5",
          voicings: [
            { frets: [2, 4, 4, 4, 2, 2], fingers: ["1", "2", "3", "4", "1", "1"], position: 2, difficulty: "medium" },
          ],
          theoryText: "The sus4 chord replaces the third with a perfect fourth, creating tension that resolves to major."
        },
        {
          name: "dim",
          fullName: "F#dim",
          intervals: "1-♭3-♭5",
          voicings: [
            { frets: [2, 3, 4, 2, -1, -1], fingers: ["1", "2", "4", "1", "x", "x"], position: 2, difficulty: "hard" },
          ],
          theoryText: "The diminished chord has a minor third and diminished fifth, creating strong tension."
        },
      ]
    },
    {
      root: "B",
      variants: [
        {
          name: "Major",
          fullName: "B Major",
          intervals: "1-3-5",
          voicings: [
            { frets: [-1, 2, 4, 4, 4, 2], fingers: ["x", "1", "3", "3", "3", "1"], position: 2, difficulty: "medium" },
            { frets: [7, 9, 9, 8, 7, 7], fingers: ["1", "3", "4", "2", "1", "1"], position: 7, difficulty: "medium" },
          ],
          theoryText: "The major chord consists of the root, major third, and perfect fifth."
        },
        {
          name: "Minor",
          fullName: "B Minor",
          intervals: "1-♭3-5",
          voicings: [
            { frets: [-1, 2, 4, 4, 3, 2], fingers: ["x", "1", "3", "4", "2", "1"], position: 2, difficulty: "medium" },
            { frets: [7, 9, 9, 7, 7, 7], fingers: ["1", "3", "4", "1", "1", "1"], position: 7, difficulty: "medium" },
          ],
          theoryText: "The minor chord replaces the major third with a minor third."
        },
        {
          name: "7",
          fullName: "B7",
          intervals: "1-3-5-♭7",
          voicings: [
            { frets: [-1, 2, 1, 2, 0, 2], fingers: ["x", "2", "1", "3", "0", "4"], position: 0, difficulty: "medium" },
          ],
          theoryText: "The dominant 7th chord adds a minor seventh to the major triad. Common in blues and jazz."
        },
        {
          name: "maj7",
          fullName: "Bmaj7",
          intervals: "1-3-5-7",
          voicings: [
            { frets: [-1, 2, 4, 3, 4, 2], fingers: ["x", "1", "3", "2", "4", "1"], position: 2, difficulty: "medium" },
          ],
          theoryText: "The major 7th chord adds a major seventh to the major triad. Creates a dreamy, jazzy sound."
        },
        {
          name: "m7",
          fullName: "Bm7",
          intervals: "1-♭3-5-♭7",
          voicings: [
            { frets: [-1, 2, 0, 2, 0, 2], fingers: ["x", "2", "0", "3", "0", "4"], position: 0, difficulty: "easy" },
          ],
          theoryText: "The minor 7th chord adds a minor seventh to the minor triad. Common in jazz and R&B."
        },
        {
          name: "sus4",
          fullName: "Bsus4",
          intervals: "1-4-5",
          voicings: [
            { frets: [-1, 2, 4, 4, 5, 2], fingers: ["x", "1", "2", "2", "3", "1"], position: 2, difficulty: "medium" },
          ],
          theoryText: "The sus4 chord replaces the third with a perfect fourth, creating tension that resolves to major."
        },
        {
          name: "sus2",
          fullName: "Bsus2",
          intervals: "1-2-5",
          voicings: [
            { frets: [-1, 2, 4, 4, 2, 2], fingers: ["x", "1", "3", "4", "1", "1"], position: 2, difficulty: "medium" },
          ],
          theoryText: "The sus2 chord replaces the third with a major second, creating an open, airy sound."
        },
        {
          name: "dim",
          fullName: "Bdim",
          intervals: "1-♭3-♭5",
          voicings: [
            { frets: [-1, 2, 3, 4, 3, -1], fingers: ["x", "1", "2", "4", "3", "x"], position: 2, difficulty: "hard" },
          ],
          theoryText: "The diminished chord has a minor third and diminished fifth, creating strong tension."
        },
        {
          name: "aug",
          fullName: "Baug",
          intervals: "1-3-♯5",
          voicings: [
            { frets: [-1, 2, 1, 4, 0, 3], fingers: ["x", "2", "1", "4", "0", "3"], position: 0, difficulty: "hard" },
          ],
          theoryText: "The augmented chord has a major third and augmented fifth, creating an unstable, mysterious sound."
        },
      ]
    },
  ]
};
