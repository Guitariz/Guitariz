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

--- Adaptive mode (opt-in via `min_self_transition_prob`) --------------------
A single fixed self-transition probability makes a hard trade-off: sticky
enough to kill frame jitter, but that same stickiness also swallows genuine
fast harmonic rhythm (e.g. a riff that changes chord twice within one bar).
When `min_self_transition_prob` is provided, the HMM becomes time-varying:
self-transition probability is allowed to relax toward that floor exactly at
moments where the classifier's own frame-level output shows strong, sustained
evidence of a change (a novelty score computed from consecutive frame
probability vectors, median-smoothed to reject single-frame flicker). This is
implemented as an O(n_classes) per-frame recursion (vs. the naive O(n_classes^2)
full-matrix Viterbi) exploiting the fact that the transition matrix is always
of the form (p on diagonal, uniform q off-diagonal) — only p is now time-varying.

The minimum-duration merge step is similarly upgraded to be confidence-aware
when adaptive mode is on: a short segment is only force-merged into a neighbor
if it's below a hard floor (near-certainly a decoding artifact) OR its mean
confidence is below a threshold. A short but confident segment — i.e. exactly
the "real chord change that happened to be brief" case — is now preserved.

Both additions are fully backward compatible: if `min_self_transition_prob`
is left as None (the default), behavior is byte-for-byte identical to the
original static implementation.

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


def _row_cosine_distance(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    """Row-wise cosine distance between two (T, C) arrays. Returns shape (T,)."""
    num = np.sum(a * b, axis=1)
    denom = np.linalg.norm(a, axis=1) * np.linalg.norm(b, axis=1) + 1e-12
    cos_sim = np.clip(num / denom, -1.0, 1.0)
    return 1.0 - cos_sim


def _smooth_1d(x: np.ndarray, window: int = 3) -> np.ndarray:
    """Light moving-average smoothing to reject single-frame novelty spikes."""
    if x.size < window:
        return x
    kernel = np.ones(window, dtype=np.float64) / window
    return np.convolve(x, kernel, mode="same")


def smooth_chord_sequence(
    frame_probs: np.ndarray,
    frame_rate: float,
    min_duration_ms: float = 300.0,
    self_transition_prob: float = 0.95,
    *,
    min_self_transition_prob: float | None = None,
    change_sensitivity: float = 1.0,
    hard_min_duration_ms: float = 120.0,
    min_duration_confidence_threshold: float = 0.55,
    tempo_bpm: float | None = None,
    beat_subdivision: float = 1.0,
) -> list[ChordSegment]:
    """
    Applies Viterbi decoding over an ergodic HMM, then enforces a minimum
    chord duration by merging short segments.

    Args:
        frame_probs: (n_frames, n_classes) class probabilities.
        frame_rate: frames per second (fps).
        min_duration_ms: minimum chord segment duration in milliseconds.
        self_transition_prob: probability of staying in the same chord state.

        min_self_transition_prob: OPT-IN. If provided, enables adaptive
            smoothing: self-transition probability relaxes toward this floor
            at moments of strong sustained harmonic change, allowing
            genuine sub-bar chord changes to survive. Also switches the
            duration-merge step to confidence-aware (see hard_min_duration_ms /
            min_duration_confidence_threshold below). If None (default),
            behavior is identical to the original static implementation.
        change_sensitivity: >1 makes the adaptive mode trigger more readily
            on smaller novelty; <1 makes it more conservative. No effect if
            min_self_transition_prob is None.
        hard_min_duration_ms: only used when adaptive mode is on. Segments
            shorter than this are always merged (near-certain artifacts,
            shorter than any real chord at any reasonable tempo).
        min_duration_confidence_threshold: only used when adaptive mode is
            on. Segments between hard_min_duration_ms and min_duration_ms are
            merged only if their mean confidence falls below this value;
            confident short segments are kept.
        tempo_bpm: optional. If provided, min_duration_ms is scaled DOWN
            (never up) to min(min_duration_ms, beat_ms * beat_subdivision),
            so fast-tempo songs aren't held to a duration floor tuned for
            slower ones. No effect on songs where the floor doesn't bind.
        beat_subdivision: multiplier on the beat duration used for the
            tempo-based floor above (1.0 = one beat, 0.5 = half beat).

    Returns:
        List of ChordSegment objects, time-aligned and smoothed.
    """
    n_frames, n_classes = frame_probs.shape
    if n_frames == 0:
        return []

    adaptive = min_self_transition_prob is not None
    floor_prob = min_self_transition_prob if adaptive else self_transition_prob

    # Optional tempo-aware duration floor (only ever tightens the constraint,
    # never loosens it beyond what the caller asked for).
    if tempo_bpm is not None and tempo_bpm > 0:
        beat_ms = 60000.0 / tempo_bpm
        adaptive_floor_ms = max(beat_ms * beat_subdivision, hard_min_duration_ms)
        min_duration_ms = min(min_duration_ms, adaptive_floor_ms)

    # ── 1. Per-transition self-transition probability sequence ──────────────
    if adaptive and n_frames > 1:
        novelty = _row_cosine_distance(frame_probs[:-1], frame_probs[1:])  # len n_frames-1
        novelty = _smooth_1d(novelty, window=3)
        change_threshold = 0.35 / max(change_sensitivity, 1e-6)
        strength = np.clip(novelty / max(change_threshold, 1e-9), 0.0, 1.0)
        self_prob_seq = self_transition_prob - (self_transition_prob - floor_prob) * strength
    else:
        self_prob_seq = np.full(max(n_frames - 1, 0), self_transition_prob)

    # ── 2. Observation probabilities (log-space) ────────────────────────────
    log_probs = np.log(frame_probs + 1e-12)
    log_init = np.full(n_classes, np.log(1.0 / n_classes))

    # ── 3. O(n_classes) time-(in)homogeneous Viterbi ─────────────────────────
    viterbi_matrix = np.zeros((n_frames, n_classes))
    backpointer = np.zeros((n_frames, n_classes), dtype=int)
    viterbi_matrix[0] = log_init + log_probs[0]

    for t in range(1, n_frames):
        p = float(self_prob_seq[t - 1])
        p = min(max(p, 1e-6), 1.0 - 1e-6)
        q = (1.0 - p) / max(n_classes - 1, 1)
        log_p = np.log(p)
        log_q = np.log(q + 1e-12)

        prev = viterbi_matrix[t - 1]
        best_idx = int(np.argmax(prev))
        best_val = prev[best_idx]
        if n_classes > 1:
            prev_copy = prev.copy()
            prev_copy[best_idx] = -np.inf
            second_idx = int(np.argmax(prev_copy))
            second_val = prev_copy[second_idx]
        else:
            second_idx, second_val = best_idx, -np.inf

        other_val = np.full(n_classes, best_val + log_q)
        other_idx = np.full(n_classes, best_idx, dtype=int)
        other_val[best_idx] = second_val + log_q
        other_idx[best_idx] = second_idx

        self_val = prev + log_p  # candidate: stay in state j

        stay_better = self_val >= other_val
        viterbi_matrix[t] = np.where(stay_better, self_val, other_val) + log_probs[t]
        backpointer[t] = np.where(stay_better, np.arange(n_classes), other_idx)

    # Backtrace optimal path
    best_path = np.zeros(n_frames, dtype=int)
    best_path[-1] = np.argmax(viterbi_matrix[-1])
    for t in range(n_frames - 2, -1, -1):
        best_path[t] = backpointer[t + 1, best_path[t + 1]]

    # ── 4. Collapse frame-level path into segments ───────────────────────────
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

    # ── 5. Enforce minimum duration by merging short segments ───────────────
    min_dur = min_duration_ms / 1000.0
    hard_min_dur = min(hard_min_duration_ms, min_duration_ms) / 1000.0

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

            if adaptive:
                must_merge = dur < hard_min_dur
                may_merge = (
                    not must_merge
                    and dur < min_dur
                    and seg.confidence < min_duration_confidence_threshold
                )
                do_merge = (must_merge or may_merge) and len(curr_list) > 1
            else:
                # Original behavior: purely duration-based, unconditional.
                do_merge = dur < min_dur and len(curr_list) > 1

            if do_merge:
                changed = True
                if new_list and idx < len(curr_list) - 1:
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

        merged: list[ChordSegment] = []
        for s in new_list:
            if merged and merged[-1].chord == s.chord:
                p_seg = merged[-1]
                p_dur = p_seg.end - p_seg.start
                s_dur = s.end - s.start
                comb_conf = (p_seg.confidence * p_dur + s.confidence * s_dur) / (p_dur + s_dur)
                merged[-1] = ChordSegment(
                    start=p_seg.start,
                    end=s.end,
                    chord=p_seg.chord,
                    confidence=float(comb_conf),
                )
            else:
                merged.append(s)
        curr_list = merged

        if not changed:
            break

    return curr_list
