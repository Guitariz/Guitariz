"""
ml/viterbi.py

Ergodic HMM Viterbi decoding layer for chord sequence smoothing.
Commercially clean: implemented from scratch using NumPy.
"""
from __future__ import annotations

from dataclasses import dataclass
import numpy as np

from ml.chord_vocab import LABELS


@dataclass
class ChordSegment:
    start: float
    end: float
    chord: str
    confidence: float


def smooth_chord_sequence(
    frame_probs: np.ndarray,
    frame_rate: float,
    min_duration_ms: float = 300.0,
    self_transition_prob: float = 0.95,
) -> list[ChordSegment]:
    """
    Applies Viterbi decoding over a simple ergodic HMM to produce a smoothed chord sequence,
    followed by a post-processing step to enforce a minimum chord duration.

    Args:
        frame_probs: numpy array of shape (n_frames, 109) containing class probabilities.
        frame_rate: frame rate in frames per second (fps).
        min_duration_ms: minimum duration for a chord segment in milliseconds.
        self_transition_prob: probability of staying in the same chord state.

    Returns:
        List of ChordSegment objects.
    """
    n_frames, n_classes = frame_probs.shape
    if n_frames == 0:
        return []

    # 1. Construct HMM parameters in log-space
    # Initial probabilities: uniform log probability
    log_init = np.full(n_classes, np.log(1.0 / n_classes))

    # Ergodic Transition Matrix:
    # - Diagonal contains self_transition_prob
    # - Off-diagonals distribute the remaining probability uniformly
    # NOTE LIMITATION: A uniform transition matrix does not capture musical priors
    # (e.g. V -> I transition is much more common than V -> bII). A future optimization
    # could learn this transition matrix from the bigram frequencies of training labels.
    trans = np.full((n_classes, n_classes), (1.0 - self_transition_prob) / (n_classes - 1))
    np.fill_diagonal(trans, self_transition_prob)
    log_trans = np.log(trans + 1e-12)

    # Observation probabilities
    log_probs = np.log(frame_probs + 1e-12)

    # 2. Run log-space Viterbi algorithm
    viterbi_matrix = np.zeros((n_frames, n_classes))
    backpointer = np.zeros((n_frames, n_classes), dtype=int)

    viterbi_matrix[0] = log_init + log_probs[0]

    for t in range(1, n_frames):
        # Broadcast viterbi_matrix[t-1] across columns and add transition probabilities
        # shape: (n_classes, n_classes) -> rows are prev state, cols are next state
        scores = viterbi_matrix[t - 1][:, None] + log_trans
        backpointer[t] = np.argmax(scores, axis=0)
        viterbi_matrix[t] = np.max(scores, axis=0) + log_probs[t]

    # Backtracking to find the optimal path
    best_path = np.zeros(n_frames, dtype=int)
    best_path[-1] = np.argmax(viterbi_matrix[-1])
    for t in range(n_frames - 2, -1, -1):
        best_path[t] = backpointer[t + 1, best_path[t + 1]]

    # 3. Collapse frame-level path into segments
    segments: list[ChordSegment] = []
    if n_frames > 0:
        seg_start_idx = 0
        seg_label_idx = best_path[0]
        
        for t in range(1, n_frames):
            if best_path[t] != seg_label_idx:
                # End of segment
                t_start = seg_start_idx / frame_rate
                t_end = t / frame_rate
                # Confidence: mean frame-level probability of the winning state
                seg_probs = frame_probs[seg_start_idx:t, seg_label_idx]
                confidence = float(np.mean(seg_probs))
                
                segments.append(ChordSegment(
                    start=t_start,
                    end=t_end,
                    chord=LABELS[seg_label_idx],
                    confidence=confidence
                ))
                
                seg_start_idx = t
                seg_label_idx = best_path[t]
                
        # Append the final segment
        t_start = seg_start_idx / frame_rate
        t_end = n_frames / frame_rate
        seg_probs = frame_probs[seg_start_idx:n_frames, seg_label_idx]
        confidence = float(np.mean(seg_probs))
        segments.append(ChordSegment(
            start=t_start,
            end=t_end,
            chord=LABELS[seg_label_idx],
            confidence=confidence
        ))

    # 4. Enforce minimum duration constraint by merging short segments
    min_dur = min_duration_ms / 1000.0
    if len(segments) <= 1:
        return segments

    final_segments: list[ChordSegment] = []
    i = 0
    while i < len(segments):
        curr = segments[i]
        dur = curr.end - curr.start
        
        if dur < min_dur:
            # We need to merge this short segment.
            # Determine which neighbor to merge into (left vs right)
            if i > 0 and i < len(segments) - 1:
                # Merge into the adjacent segment with higher confidence
                left = final_segments[-1]
                right = segments[i + 1]
                if left.confidence >= right.confidence:
                    # Merge left
                    # Weighted confidence by duration
                    left_dur = left.end - left.start
                    new_conf = (left.confidence * left_dur + curr.confidence * dur) / (left_dur + dur)
                    final_segments[-1] = ChordSegment(
                        start=left.start,
                        end=curr.end,
                        chord=left.chord,
                        confidence=float(new_conf)
                    )
                else:
                    # Merge right
                    right_dur = right.end - right.start
                    new_conf = (right.confidence * right_dur + curr.confidence * dur) / (right_dur + dur)
                    segments[i + 1] = ChordSegment(
                        start=curr.start,
                        end=right.end,
                        chord=right.chord,
                        confidence=float(new_conf)
                    )
            elif i > 0:
                # Merge left
                left = final_segments[-1]
                left_dur = left.end - left.start
                new_conf = (left.confidence * left_dur + curr.confidence * dur) / (left_dur + dur)
                final_segments[-1] = ChordSegment(
                    start=left.start,
                    end=curr.end,
                    chord=left.chord,
                    confidence=float(new_conf)
                )
            elif i < len(segments) - 1:
                # Merge right
                right = segments[i + 1]
                right_dur = right.end - right.start
                new_conf = (right.confidence * right_dur + curr.confidence * dur) / (right_dur + dur)
                segments[i + 1] = ChordSegment(
                    start=curr.start,
                    end=right.end,
                    chord=right.chord,
                    confidence=float(new_conf)
                )
            else:
                final_segments.append(curr)
        else:
            final_segments.append(curr)
        i += 1

    # Merge any adjacent segments that now have the same label after merging
    merged_segments: list[ChordSegment] = []
    for seg in final_segments:
        if merged_segments and merged_segments[-1].chord == seg.chord:
            prev = merged_segments[-1]
            prev_dur = prev.end - prev.start
            seg_dur = seg.end - seg.start
            new_conf = (prev.confidence * prev_dur + seg.confidence * seg_dur) / (prev_dur + seg_dur)
            merged_segments[-1] = ChordSegment(
                start=prev.start,
                end=seg.end,
                chord=prev.chord,
                confidence=float(new_conf)
            )
        else:
            merged_segments.append(seg)

    return merged_segments
