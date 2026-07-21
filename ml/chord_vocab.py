"""
ml/chord_vocab.py

Defines the chord label vocabulary and their chroma templates (interval patterns).
Shared by:
  - ml/chord_templates.py (DSP cosine-similarity baseline)
  - ml/model.py / ml/train.py (as the CRNN's output classes)

Covers: maj, min, 7, maj7, min7, dim, aug, sus2, sus4, N.C. (no chord) x 12 roots
= 9 * 12 + 1 = 109 classes.
"""
from __future__ import annotations

NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

# Semitone interval patterns relative to root (0-11)
QUALITY_INTERVALS = {
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
    labels = [NO_CHORD]
    for root in NOTE_NAMES:
        for quality in QUALITY_INTERVALS:
            labels.append(f"{root}:{quality}")
    return labels


LABELS = build_labels()
LABEL_TO_IDX = {lab: i for i, lab in enumerate(LABELS)}
IDX_TO_LABEL = {i: lab for i, lab in enumerate(LABELS)}
NUM_CLASSES = len(LABELS)  # 109


def build_templates():
    """
    Returns a (NUM_CLASSES, 12) numpy array of binary chroma templates,
    one row per chord label (root:quality), plus an all-zero row for N.C.
    """
    import numpy as np
    templates = np.zeros((NUM_CLASSES, 12), dtype=np.float32)
    for root_idx, root in enumerate(NOTE_NAMES):
        for quality, intervals in QUALITY_INTERVALS.items():
            label = f"{root}:{quality}"
            idx = LABEL_TO_IDX[label]
            for interval in intervals:
                pitch_class = (root_idx + interval) % 12
                templates[idx, pitch_class] = 1.0
    # normalize each template to unit norm (N.C. row stays all zero)
    norms = (templates ** 2).sum(axis=1, keepdims=True) ** 0.5
    norms[norms == 0] = 1.0
    templates = templates / norms
    return templates
