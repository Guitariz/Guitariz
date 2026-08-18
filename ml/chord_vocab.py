"""
ml/chord_vocab.py

Defines the chord label vocabulary and their chroma templates.

Vocabulary: 109 classes = 12 roots × 9 qualities + N.C. (no chord)
  Roots: C, C#, D, D#, E, F, F#, G, G#, A, A#, B
  Qualities: maj, min, 7, maj7, min7, dim, aug, sus2, sus4

Shared by:
  - ml/chord_templates.py    (DSP cosine-similarity baseline)
  - ml/model.py / ml/train.py (as the CRNN's output classes)
  - ml/viterbi.py             (index ↔ label mapping)

Zero licensing risk: pure Python + NumPy, no external data or models.
"""
from __future__ import annotations

import numpy as np

NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

# Semitone interval patterns relative to root (0-indexed)
QUALITY_INTERVALS: dict[str, list[int]] = {
    "maj":  [0, 4, 7],
    "min":  [0, 3, 7],
    "7":    [0, 4, 7, 10],
    "maj7": [0, 4, 7, 11],
    "min7": [0, 3, 7, 10],
    "dim":  [0, 3, 6],
    "aug":  [0, 4, 8],
    "sus2": [0, 2, 7],
    "sus4": [0, 5, 7],
}

NO_CHORD = "N.C."


def build_labels() -> list[str]:
    """Build the ordered chord label list. N.C. is always index 0."""
    labels = [NO_CHORD]
    for root in NOTE_NAMES:
        for quality in QUALITY_INTERVALS:
            labels.append(f"{root}:{quality}")
    return labels


LABELS = build_labels()
LABEL_TO_IDX: dict[str, int] = {lab: i for i, lab in enumerate(LABELS)}
IDX_TO_LABEL: dict[int, str] = {i: lab for i, lab in enumerate(LABELS)}
NUM_CLASSES = len(LABELS)  # 109


def build_templates(with_penalties: bool = True) -> np.ndarray:
    """
    Returns a (NUM_CLASSES, 12) numpy array of normalized chroma templates.

    Uses harmonic weighting:
      - Root: 1.0
      - Thirds & Suspensions (3, 4, 2, 5 semitones): 0.95 (strong quality defining tone)
      - Fifths (6, 7, 8 semitones): 0.85
      - Sevenths & extensions: 0.80
      - Clashing Avoid-Notes (e.g. minor 3rd in major chord): -0.35 penalty

    This eliminates the common acoustic confusion between Major and Parallel Minor.
    """
    templates = np.zeros((NUM_CLASSES, 12), dtype=np.float32)
    for root_idx, root in enumerate(NOTE_NAMES):
        for quality, intervals in QUALITY_INTERVALS.items():
            label = f"{root}:{quality}"
            idx = LABEL_TO_IDX[label]
            for i, interval in enumerate(intervals):
                pitch_class = (root_idx + interval) % 12
                if i == 0:
                    weight = 1.0
                elif interval in (2, 3, 4, 5):
                    weight = 0.95
                elif interval in (6, 7, 8):
                    weight = 0.85
                else:
                    weight = 0.80
                templates[idx, pitch_class] = weight

            if with_penalties:
                # Major chords penalize the minor third
                if quality in ("maj", "7", "maj7"):
                    m3 = (root_idx + 3) % 12
                    templates[idx, m3] = -0.35
                # Minor chords penalize the major third
                elif quality in ("min", "min7"):
                    M3 = (root_idx + 4) % 12
                    templates[idx, M3] = -0.35

    # Normalize each template vector to unit L2 norm (N.C. row stays all-zero)
    norms = np.sqrt((templates ** 2).sum(axis=1, keepdims=True))
    norms[norms == 0] = 1.0
    return templates / norms
