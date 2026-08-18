"""
ml/viterbi.py

Ergodic HMM Viterbi decoding layer for chord sequence smoothing.

Why Viterbi?  Frame-level chord classifiers (whether ONNX CRNN or DSP template
matching) produce noisy per-frame predictions. Chords in real music last at
least a few hundred milliseconds.  The Viterbi layer enforces temporal smoothness
by modelling chord transitions as a hidden Markov model:

    - Self-transition probability (0.95) → strong bias to stay in the same chord
    - Uniform off-diagonal transitions → any chord can follow any other
    - Observation probabilities → per-frame softmax from the classifier

After decoding, a minimum-duration constraint (300ms) merges any remaining
short segments into their most confident neighbor.

Commercially clean: implemented from scratch using NumPy (BSD).
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from .chord_vocab import LABELS


@dataclass
class ChordSegment:
    """A single time-aligned chord segment."""
    start: float       # seconds
    end: float         # seconds
    chord: str         # e.g. "C:maj" or "N.C."
    confidence: float  # 0–1, mean frame-level probability


def smooth_chord_sequence(
    frame_probs: np.ndarray,
    frame_rate: float,
    min_duration_ms: float = 300.0,
    self_transition_prob: float = 0.95,
) -> list[ChordSegment]:
    """
    Applies Viterbi decoding over a simple ergodic HMM, then enforces a
    minimum chord duration by merging short segments.

    Args:
        frame_probs: (n_frames, n_classes) class probabilities.
        frame_rate: frames per second (fps).
        min_duration_ms: minimum chord segment duration in milliseconds.
        self_transition_prob: probability of staying in the same chord state.

    Returns:
        List of ChordSegment objects, time-aligned and smoothed.
    """
    n_frames, n_classes = frame_probs.shape
    if n_frames == 0:
        return []

    # ── 1. HMM parameters (log-space for numerical stability) ───────────────

    # Uniform initial probability
    log_init = np.full(n_classes, np.log(1.0 / n_classes))

    # Ergodic transition matrix: high self-transition, uniform otherwise
    # NOTE: A uniform off-diagonal doesn't capture musical priors (e.g. V→I is
    # more common than V→bII).  A future improvement could learn a bigram
    # transition matrix from training label statistics.
    trans = np.full(
        (n_classes, n_classes),
        (1.0 - self_transition_prob) / (n_classes - 1),
    )
    np.fill_diagonal(trans, self_transition_prob)
    log_trans = np.log(trans + 1e-12)

    # Observation probabilities
    log_probs = np.log(frame_probs + 1e-12)

    # ── 2. Log-space Viterbi algorithm ──────────────────────────────────────

    viterbi_matrix = np.zeros((n_frames, n_classes))
    backpointer = np.zeros((n_frames, n_classes), dtype=int)

    viterbi_matrix[0] = log_init + log_probs[0]

    for t in range(1, n_frames):
        # scores[i, j] = viterbi[t-1, i] + log_trans[i, j]
        scores = viterbi_matrix[t - 1][:, None] + log_trans
        backpointer[t] = np.argmax(scores, axis=0)
        viterbi_matrix[t] = np.max(scores, axis=0) + log_probs[t]

    # Backtrace optimal path
    best_path = np.zeros(n_frames, dtype=int)
    best_path[-1] = np.argmax(viterbi_matrix[-1])
    for t in range(n_frames - 2, -1, -1):
        best_path[t] = backpointer[t + 1, best_path[t + 1]]

    # ── 3. Collapse frame-level path into segments ──────────────────────────

    segments: list[ChordSegment] = []
    seg_start_idx = 0
    seg_label_idx = best_path[0]

    for t in range(1, n_frames):
        if best_path[t] != seg_label_idx:
            t_start = seg_start_idx / frame_rate
            t_end = t / frame_rate
            seg_probs = frame_probs[seg_start_idx:t, seg_label_idx]
            confidence = float(np.mean(seg_probs))
            segments.append(ChordSegment(
                start=t_start,
                end=t_end,
                chord=LABELS[seg_label_idx],
                confidence=confidence,
            ))
            seg_start_idx = t
            seg_label_idx = best_path[t]

    # Final segment
    t_start = seg_start_idx / frame_rate
    t_end = n_frames / frame_rate
    seg_probs = frame_probs[seg_start_idx:n_frames, seg_label_idx]
    confidence = float(np.mean(seg_probs))
    segments.append(ChordSegment(
        start=t_start,
        end=t_end,
        chord=LABELS[seg_label_idx],
        confidence=confidence,
    ))

    # ── 4. Enforce minimum duration by merging short segments ───────────────
    min_dur = min_duration_ms / 1000.0
    if len(segments) <= 1:
        return segments

    curr_list = list(segments)
    max_passes = 6

    while max_passes > 0 and len(curr_list) > 1:
        max_passes -= 1
        changed = False
        new_list: list[ChordSegment] = []
        skip_next = False

        for idx in range(len(curr_list)):
            if skip_next:
                skip_next = False
                continue

            seg = curr_list[idx]
            dur = seg.end - seg.start

            if dur < min_dur and len(curr_list) > 1:
                changed = True
                if new_list and idx < len(curr_list) - 1:
                    # Both left and right neighbors exist
                    left = new_list[-1]
                    right = curr_list[idx + 1]
                    if left.confidence >= right.confidence:
                        l_dur = left.end - left.start
                        new_conf = (left.confidence * l_dur + seg.confidence * dur) / (l_dur + dur)
                        new_list[-1] = ChordSegment(
                            start=left.start,
                            end=seg.end,
                            chord=left.chord,
                            confidence=float(new_conf),
                        )
                    else:
                        r_dur = right.end - right.start
                        new_conf = (right.confidence * r_dur + seg.confidence * dur) / (r_dur + dur)
                        new_list.append(ChordSegment(
                            start=seg.start,
                            end=right.end,
                            chord=right.chord,
                            confidence=float(new_conf),
                        ))
                        skip_next = True
                elif new_list:
                    # Only left neighbor exists
                    left = new_list[-1]
                    l_dur = left.end - left.start
                    new_conf = (left.confidence * l_dur + seg.confidence * dur) / (l_dur + dur)
                    new_list[-1] = ChordSegment(
                        start=left.start,
                        end=seg.end,
                        chord=left.chord,
                        confidence=float(new_conf),
                    )
                elif idx < len(curr_list) - 1:
                    # Only right neighbor exists (at start of list)
                    right = curr_list[idx + 1]
                    r_dur = right.end - right.start
                    new_conf = (right.confidence * r_dur + seg.confidence * dur) / (r_dur + dur)
                    new_list.append(ChordSegment(
                        start=seg.start,
                        end=right.end,
                        chord=right.chord,
                        confidence=float(new_conf),
                    ))
                    skip_next = True
                else:
                    new_list.append(seg)
            else:
                new_list.append(seg)

        # Merge adjacent identical chords
        merged: list[ChordSegment] = []
        for s in new_list:
            if merged and merged[-1].chord == s.chord:
                p = merged[-1]
                p_dur = p.end - p.start
                s_dur = s.end - s.start
                comb_conf = (p.confidence * p_dur + s.confidence * s_dur) / (p_dur + s_dur)
                merged[-1] = ChordSegment(
                    start=p.start,
                    end=s.end,
                    chord=p.chord,
                    confidence=float(comb_conf),
                )
            else:
                merged.append(s)

        curr_list = merged
        if not changed:
            break

    return curr_list
