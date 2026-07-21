"""
ml/chord_templates.py

Zero-training chord recognizer using chroma-template cosine similarity
(the classic Fujishima/Sheh & Ellis approach). 100% MIT/Apache-safe: it's
pure DSP math, no pretrained weights, no NC-licensed model checkpoints.

This is meant as a clean, zero-training baseline for chord recognition. It won't
match a well-trained CRNN's accuracy on tricky voicings/inversions, but it's
a legitimate, commonly-used baseline (a smoothed, thresholded version of
what simpler decoders approximate too) and costs zero GPU time.

Once ml/train.py produces an ONNX model, backend/chord_custom.py will prefer
that model and fall back to this module automatically.
"""
from __future__ import annotations

import numpy as np
import librosa

from .chord_vocab import LABELS, NO_CHORD, build_templates
from .features import extract_cqt_chroma, frame_times, load_audio, SR, HOP_LENGTH

_TEMPLATES = build_templates()  # (NUM_CLASSES, 12)


def _classify_frame(chroma_vec: np.ndarray, nc_threshold: float = 0.15) -> tuple[int, float]:
    """Cosine similarity of one chroma frame against all chord templates."""
    norm = np.linalg.norm(chroma_vec)
    if norm < nc_threshold:
        return LABELS.index(NO_CHORD), 1.0 - norm  # near-silent frame -> N.C.
    v = chroma_vec / (norm + 1e-8)
    sims = _TEMPLATES @ v  # (NUM_CLASSES,)
    sims[LABELS.index(NO_CHORD)] = -1.0  # N.C. template is all-zero; handle separately above
    best_idx = int(np.argmax(sims))
    # softmax-like confidence: normalize top similarity into [0,1]
    confidence = float((sims[best_idx] + 1.0) / 2.0)
    return best_idx, confidence


def _median_smooth_labels(labels: list[int], win: int = 5) -> list[int]:
    """Median-filter the frame-level label sequence to suppress single-frame flicker."""
    if len(labels) < win:
        return labels
    arr = np.array(labels)
    half = win // 2
    smoothed = arr.copy()
    for i in range(len(arr)):
        lo, hi = max(0, i - half), min(len(arr), i + half + 1)
        window = arr[lo:hi]
        vals, counts = np.unique(window, return_counts=True)
        smoothed[i] = vals[np.argmax(counts)]
    return smoothed.tolist()


def detect_chords_dsp(file_path: str, min_segment_sec: float = 0.15) -> list[tuple[float, float, str, float]]:
    """
    Returns time-aligned chord segments: (start_sec, end_sec, label, confidence)
    """
    y, sr = load_audio(file_path)
    chroma = extract_cqt_chroma(y, sr)  # (n_frames, 12)
    times = frame_times(len(chroma), sr=sr, hop_length=HOP_LENGTH)

    frame_labels = []
    frame_confs = []
    for vec in chroma:
        idx, conf = _classify_frame(vec)
        frame_labels.append(idx)
        frame_confs.append(conf)

    frame_labels = _median_smooth_labels(frame_labels, win=5)

    # collapse consecutive identical labels into segments
    segments: list[tuple[float, float, str, float]] = []
    seg_start = times[0]
    seg_label = frame_labels[0]
    seg_confs = [frame_confs[0]]
    for i in range(1, len(frame_labels)):
        if frame_labels[i] != seg_label:
            seg_end = times[i]
            if seg_end - seg_start >= min_segment_sec:
                segments.append((float(seg_start), float(seg_end), LABELS[seg_label], float(np.mean(seg_confs))))
            seg_start = times[i]
            seg_label = frame_labels[i]
            seg_confs = []
        seg_confs.append(frame_confs[i])
    # final segment
    total_dur = float(librosa.get_duration(y=y, sr=sr))
    segments.append((float(seg_start), total_dur, LABELS[seg_label], float(np.mean(seg_confs)) if seg_confs else 0.0))

    # merge adjacent same-label segments that survived the min-duration filter split
    merged: list[tuple[float, float, str, float]] = []
    for seg in segments:
        if merged and merged[-1][2] == seg[2]:
            prev = merged[-1]
            merged[-1] = (prev[0], seg[1], prev[2], (prev[3] + seg[3]) / 2)
        else:
            merged.append(seg)

    return merged
