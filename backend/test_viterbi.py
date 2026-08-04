"""
backend/test_viterbi.py

Unit tests for the HMM Viterbi smoothing layer.
"""
from __future__ import annotations

import numpy as np
import pytest

from ml.chord_vocab import LABEL_TO_IDX, LABELS
from ml.viterbi import smooth_chord_sequence


def test_viterbi_simple_progression():
    """Verify that Viterbi correctly decodes a clear sequence of high probabilities."""
    n_frames = 20
    n_classes = len(LABELS)
    frame_rate = 10.0  # 10 fps -> 100ms per frame
    
    # Initialize uniform background noise
    frame_probs = np.full((n_frames, n_classes), 0.001, dtype=np.float32)
    
    c_maj_idx = LABEL_TO_IDX["C:maj"]
    a_min_idx = LABEL_TO_IDX["A:min"]
    
    # Frames 0-9: C:maj is active
    frame_probs[0:10, c_maj_idx] = 0.90
    # Frames 10-19: A:min is active
    frame_probs[10:20, a_min_idx] = 0.90
    
    # Normalize probabilities
    frame_probs /= frame_probs.sum(axis=-1, keepdims=True)
    
    segments = smooth_chord_sequence(frame_probs, frame_rate, min_duration_ms=300)
    
    assert len(segments) == 2
    
    assert segments[0].chord == "C:maj"
    assert pytest.approx(segments[0].start) == 0.0
    assert pytest.approx(segments[0].end) == 1.0
    assert segments[0].confidence > 0.85
    
    assert segments[1].chord == "A:min"
    assert pytest.approx(segments[1].start) == 1.0
    assert pytest.approx(segments[1].end) == 2.0
    assert segments[1].confidence > 0.85


def test_viterbi_min_duration_merge():
    """Verify that short flicker segments are successfully merged into neighbors."""
    n_frames = 20
    n_classes = len(LABELS)
    frame_rate = 10.0  # 10 fps -> 100ms per frame
    
    frame_probs = np.full((n_frames, n_classes), 0.001, dtype=np.float32)
    
    c_maj_idx = LABEL_TO_IDX["C:maj"]
    g_maj_idx = LABEL_TO_IDX["G:maj"]
    
    # C:maj dominates except for a 1-frame (100ms) flicker of G:maj at frame 10
    frame_probs[:, c_maj_idx] = 0.85
    frame_probs[10, c_maj_idx] = 0.01
    frame_probs[10, g_maj_idx] = 0.90
    
    frame_probs /= frame_probs.sum(axis=-1, keepdims=True)
    
    # If min_duration is 300ms (3 frames), the 100ms G:maj segment should get merged
    segments = smooth_chord_sequence(frame_probs, frame_rate, min_duration_ms=300)
    
    assert len(segments) == 1
    assert segments[0].chord == "C:maj"
    assert pytest.approx(segments[0].start) == 0.0
    assert pytest.approx(segments[0].end) == 2.0


def test_viterbi_transition_resistance():
    """Verify that a 1-frame noisy spike with lower confidence does not trigger a transition."""
    n_frames = 10
    n_classes = len(LABELS)
    frame_rate = 10.0
    
    frame_probs = np.full((n_frames, n_classes), 0.001, dtype=np.float32)
    c_maj_idx = LABEL_TO_IDX["C:maj"]
    d_min_idx = LABEL_TO_IDX["D:min"]
    
    # C:maj is the main chord
    frame_probs[:, c_maj_idx] = 0.70
    # Noisy spike of D:min at frame 5 with moderate probability (e.g. 0.40)
    # which is not high enough to overcome self-transition threshold
    frame_probs[5, c_maj_idx] = 0.20
    frame_probs[5, d_min_idx] = 0.45
    
    frame_probs /= frame_probs.sum(axis=-1, keepdims=True)
    
    segments = smooth_chord_sequence(frame_probs, frame_rate, min_duration_ms=100)
    
    assert len(segments) == 1
    assert segments[0].chord == "C:maj"
