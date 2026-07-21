"""
ml/features.py

Shared audio feature extraction for the Guitariz chord/key/tempo pipeline.
Everything here is built on librosa (ISC license, commercially safe) and numpy.
Used by BOTH:
  - the zero-training DSP baseline (ml/dsp_tempo_key.py, ml/chord_templates.py)
  - the trainable CRNN model (ml/model.py, ml/train.py)

Keeping feature extraction in one place guarantees train/inference parity,
which is the #1 source of silent bugs in audio ML pipelines.
"""
from __future__ import annotations

import numpy as np
import librosa

SR = 22050                 # standard analysis sample rate
HOP_LENGTH = 2048           # ~93ms per frame at 22050 Hz -> good tradeoff of speed vs chord resolution
N_CHROMA = 12
N_OCTAVES = 6
BINS_PER_OCTAVE = 36        # 3 bins/semitone for CQT -> better chroma than default 12
FMIN = librosa.note_to_hz("C1")


def load_audio(file_path: str, sr: int = SR, mono: bool = True, max_seconds: float | None = None) -> tuple[np.ndarray, int]:
    """Load audio, resampled to `sr`. Caps duration for speed if max_seconds is given."""
    y, orig_sr = librosa.load(file_path, sr=sr, mono=mono, duration=max_seconds)
    return y, sr


def extract_cqt_chroma(y: np.ndarray, sr: int = SR) -> np.ndarray:
    """
    CQT-based chroma (chroma_cqt), which is much more robust to non-piano timbres
    (distorted guitar, vocals, etc.) than STFT chroma. This is the feature both
    the DSP template matcher and the CRNN model consume.

    Returns: array of shape (n_frames, 12), values in [0, 1].
    """
    cqt = np.abs(
        librosa.cqt(
            y,
            sr=sr,
            hop_length=HOP_LENGTH,
            fmin=FMIN,
            n_bins=N_OCTAVES * BINS_PER_OCTAVE,
            bins_per_octave=BINS_PER_OCTAVE,
        )
    )
    chroma = librosa.feature.chroma_cqt(
        C=cqt,
        sr=sr,
        hop_length=HOP_LENGTH,
        bins_per_octave=BINS_PER_OCTAVE,
        n_chroma=N_CHROMA,
    )
    # Normalize each frame to unit max (robust to loudness changes)
    chroma = chroma / (chroma.max(axis=0, keepdims=True) + 1e-8)
    return chroma.T.astype(np.float32)  # (n_frames, 12)


def frame_times(n_frames: int, sr: int = SR, hop_length: int = HOP_LENGTH) -> np.ndarray:
    return librosa.frames_to_time(np.arange(n_frames), sr=sr, hop_length=hop_length)


def extract_cnn_input(y: np.ndarray, sr: int = SR) -> np.ndarray:
    """
    Log-magnitude CQT used as the CNN's spectral input (higher resolution than chroma,
    lets the model learn its own chroma-like projection + harmonics/overtone patterns).

    Returns: array of shape (n_bins=N_OCTAVES*BINS_PER_OCTAVE, n_frames), log-scaled.
    """
    cqt = np.abs(
        librosa.cqt(
            y,
            sr=sr,
            hop_length=HOP_LENGTH,
            fmin=FMIN,
            n_bins=N_OCTAVES * BINS_PER_OCTAVE,
            bins_per_octave=BINS_PER_OCTAVE,
        )
    )
    log_cqt = librosa.amplitude_to_db(cqt, ref=np.max)
    # scale to roughly [-1, 1]
    log_cqt = (log_cqt + 40.0) / 40.0
    return log_cqt.astype(np.float32)  # (n_bins, n_frames)
