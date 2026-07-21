"""
ml/dsp_tempo_key.py

Tempo and Key/Scale detection via classic, well-established DSP algorithms.
Neither of these needs a trained model at all:

- Tempo: librosa's onset-strength + autocorrelation/tempogram beat tracker
  (same family of algorithm used internally by standard tracking packages, but librosa's implementation
  is ISC-licensed and commercially unrestricted).

- Key: Krumhansl-Schmuckler / Temperley key-finding algorithm — correlate the
  song's aggregate chroma vector against the 24 major/minor key profiles
  (published, public-domain cognitive-science profiles, not a trained model).

Both are fast (<1s for a 4-minute song) and add zero licensing risk.
"""
from __future__ import annotations

import numpy as np
import librosa

from .features import SR, HOP_LENGTH, load_audio, extract_cqt_chroma

NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

# Krumhansl-Kessler key profiles (public domain, from cognitive psychology research,
# not a trained/licensed model artifact).
KK_MAJOR = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
KK_MINOR = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])


def detect_tempo_dsp(file_path: str) -> float:
    y, sr = load_audio(file_path)
    onset_env = librosa.onset.onset_strength(y=y, sr=sr, hop_length=HOP_LENGTH)
    tempo, _ = librosa.beat.beat_track(onset_envelope=onset_env, sr=sr, hop_length=HOP_LENGTH)
    bpm = float(np.atleast_1d(tempo)[0])
    return round(bpm, 2)


def detect_key_dsp(file_path: str) -> str:
    y, sr = load_audio(file_path)
    chroma = extract_cqt_chroma(y, sr)  # (n_frames, 12)
    agg = chroma.mean(axis=0)
    agg = agg / (agg.sum() + 1e-8)

    best_score = -np.inf
    best_label = "C major"
    for root_idx in range(12):
        major_profile = np.roll(KK_MAJOR, root_idx)
        minor_profile = np.roll(KK_MINOR, root_idx)

        major_score = np.corrcoef(agg, major_profile)[0, 1]
        minor_score = np.corrcoef(agg, minor_profile)[0, 1]

        if major_score > best_score:
            best_score = major_score
            best_label = f"{NOTE_NAMES[root_idx]} major"
        if minor_score > best_score:
            best_score = minor_score
            best_label = f"{NOTE_NAMES[root_idx]} minor"

    return best_label
