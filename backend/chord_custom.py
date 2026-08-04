"""
backend/chord_custom.py

Drop-in replacement for the old chord detection backend. Zero
licensing risk: no non-commercial imports anywhere in this file.

Exposes exactly the three functions main.py should call:
    detect_chords_custom(file_path, mode) -> List[Tuple[float, float, str, float]]
    detect_key_custom(file_path)          -> str
    detect_tempo_custom(file_path)        -> float
"""
from __future__ import annotations

import os
from pathlib import Path

import numpy as np

from ml.chord_vocab import LABEL_TO_IDX, NUM_CLASSES, build_templates
from ml.dsp_tempo_key import detect_key_dsp, detect_tempo_dsp

# Feature extraction, vocabulary, and post-processing dependencies
from ml.features import (
    HOP_LENGTH,
    extract_cnn_input,
    extract_cqt_chroma,
    load_audio,
)
from ml.viterbi import smooth_chord_sequence

CHORD_MODEL_PATH = Path(os.environ.get("CHORD_MODEL_PATH", Path(__file__).parent / "chord_model.onnx"))
QUANT_MODEL_PATH = Path(os.environ.get("QUANT_MODEL_PATH", Path(__file__).parent / "chord_model.quant.onnx"))

# A/B test flag - defaults to True if quant model exists, otherwise False
USE_QUANTIZED_MODEL = os.environ.get("USE_QUANTIZED_MODEL", "true").lower() == "true"

_onnx_session = None
_onnx_load_attempted = False


def _filter_low_confidence_segments(
    res_segments: list[tuple[float, float, str, float]],
    threshold: float = 0.65
) -> list[tuple[float, float, str, float]]:
    """Maps low-confidence chord segments to 'N.C.' and merges consecutive duplicates."""
    cleaned = []
    for start, end, chord, conf in res_segments:
        if chord != "N.C." and conf < threshold:
            cleaned.append((start, end, "N.C.", conf))
        else:
            cleaned.append((start, end, chord, conf))
            
    merged = []
    for start, end, chord, conf in cleaned:
        if merged and merged[-1][2] == chord:
            prev_start, prev_end, _, prev_conf = merged[-1]
            prev_dur = prev_end - prev_start
            curr_dur = end - start
            new_conf = (prev_conf * prev_dur + conf * curr_dur) / (prev_dur + curr_dur)
            merged[-1] = (prev_start, end, chord, float(new_conf))
        else:
            merged.append((start, end, chord, conf))
    return merged



def _get_onnx_session():
    """Lazily load the ONNX model once per process. Cached after first call."""
    global _onnx_session, _onnx_load_attempted
    if _onnx_load_attempted:
        return _onnx_session
    _onnx_load_attempted = True

    model_to_load = QUANT_MODEL_PATH if (USE_QUANTIZED_MODEL and QUANT_MODEL_PATH.exists()) else CHORD_MODEL_PATH

    if not model_to_load.exists():
        # Try fallback to standard model if quantized wasn't found
        if model_to_load == QUANT_MODEL_PATH and CHORD_MODEL_PATH.exists():
            print(f"[chord_custom] Quantized model not found at {QUANT_MODEL_PATH}. Falling back to float32 model.")
            model_to_load = CHORD_MODEL_PATH
        else:
            print(f"[chord_custom] No trained ONNX model found at {model_to_load}. Using DSP template-matching.")
            return None

    try:
        import onnxruntime as ort
        _onnx_session = ort.InferenceSession(str(model_to_load), providers=["CPUExecutionProvider"])
        print(f"[chord_custom] Loaded trained chord model from {model_to_load}")
    except Exception as e:
        print(f"[chord_custom] Failed to load ONNX model ({e}); falling back to DSP.")
        _onnx_session = None
    return _onnx_session


def _detect_chords_onnx(file_path: Path) -> list[tuple[float, float, str, float]]:
    sess = _get_onnx_session()
    y, sr = load_audio(str(file_path))
    log_cqt = extract_cnn_input(y, sr)
    _, n_frames = log_cqt.shape
    frame_rate = sr / HOP_LENGTH

    # Batched full-track ONNX inference (no more chunk loop!)
    # Avoid memory issues for extremely long files (>10 minutes) by falling back to chunked
    max_duration_sec = 600.0  # 10 minutes
    duration = n_frames * HOP_LENGTH / sr
    
    if duration > max_duration_sec:
        # Chunked fallback
        chunk_frames = 200
        all_logits = np.zeros((n_frames, NUM_CLASSES), dtype=np.float32)
        for start in range(0, n_frames, chunk_frames):
            end = min(start + chunk_frames, n_frames)
            chunk = log_cqt[:, start:end][None, None, :, :]
            out = sess.run(None, {"log_cqt": chunk.astype(np.float32)})[0]
            all_logits[start:end] = out[0]
    else:
        # Batch full-track CQT into a single ONNX Runtime inference call
        chunk = log_cqt[None, None, :, :]  # Shape: (1, 1, n_bins, n_frames)
        out = sess.run(None, {"log_cqt": chunk.astype(np.float32)})[0]  # Shape: (1, n_frames, 109)
        all_logits = out[0]

    # Convert logits to probabilities
    e = np.exp(all_logits - all_logits.max(axis=-1, keepdims=True))
    probs = e / e.sum(axis=-1, keepdims=True)

    # Apply HMM Viterbi smoothing layer (self-transition prob = 0.95, min_duration = 300ms)
    smoothed_segments = smooth_chord_sequence(
        probs,
        frame_rate=frame_rate,
        min_duration_ms=300.0,
        self_transition_prob=0.95
    )

    # Format output
    res_segments = []
    for seg in smoothed_segments:
        res_segments.append((seg.start, seg.end, seg.chord, seg.confidence))
        
    return _filter_low_confidence_segments(res_segments, threshold=0.35)


def detect_chords_custom(file_path: Path, mode: str = "fast") -> list[tuple[float, float, str, float]]:
    """
    Time-aligned chord segments: (start_sec, end_sec, chord_label, confidence).
    
    Modes:
      - "fast": Uses the batched dynamic INT8 ONNX model with HMM Viterbi smoothing.
      - "accurate": Uses classical chroma-template matching with HPSS, cosine correlation,
                     and HMM Viterbi smoothing.
    """
    if mode == "fast":
        sess = _get_onnx_session()
        if sess is not None:
            try:
                return _detect_chords_onnx(file_path)
            except Exception as e:
                print(f"[chord_custom] ONNX inference failed ({e}); falling back to DSP.")
        # Fallback if session is None or failed
        mode = "accurate"

    # ACCURATE MODE: classical template matching with HPSS + CQT + Viterbi smoothing
    import librosa
    
    y, sr = load_audio(str(file_path))
    # HPSS (harmonic isolation using librosa.effects.harmonic)
    y_harmonic = librosa.effects.harmonic(y)
    chroma = extract_cqt_chroma(y_harmonic, sr)  # shape: (n_frames, 12)
    n_frames = len(chroma)
    frame_rate = sr / HOP_LENGTH
    
    templates = build_templates()  # shape: (109, 12)
    sims = np.zeros((n_frames, NUM_CLASSES), dtype=np.float32)
    nc_idx = LABEL_TO_IDX["N.C."]
    
    for t in range(n_frames):
        vec = chroma[t]
        norm = np.linalg.norm(vec)
        if norm < 0.15:
            # Silence/noise -> N.C.
            sims[t, nc_idx] = 1.0
        else:
            v = vec / (norm + 1e-8)
            sims[t] = templates @ v
            # Suppress N.C. template score
            sims[t, nc_idx] = -1.0
            
    # Convert similarity scores to probabilities via softmax with temperature scaling (tau=0.20)
    tau = 0.20
    e = np.exp(sims / tau)
    probs = e / e.sum(axis=-1, keepdims=True)
    
    # Smooth via identical HMM Viterbi smoothing layer
    smoothed_segments = smooth_chord_sequence(
        probs,
        frame_rate=frame_rate,
        min_duration_ms=300.0,
        self_transition_prob=0.95
    )
    
    # Format and compute confidence as the mean template cosine similarity scaled to [0,1]
    res_segments = []
    for seg in smoothed_segments:
        seg_idx = LABEL_TO_IDX.get(seg.chord, LABEL_TO_IDX["N.C."])
        
        t_start_idx = int(round(seg.start * frame_rate))
        t_end_idx = int(round(seg.end * frame_rate))
        t_end_idx = max(t_start_idx + 1, min(t_end_idx, n_frames))
        
        if seg.chord == "N.C.":
            confs = []
            for t in range(t_start_idx, t_end_idx):
                confs.append(1.0 - np.linalg.norm(chroma[t]))
            mean_conf = float(np.mean(confs)) if confs else 0.0
        else:
            # Map sims from [-1, 1] to [0, 1] for confidence representation
            confs = (sims[t_start_idx:t_end_idx, seg_idx] + 1.0) / 2.0
            mean_conf = float(np.mean(confs))
            
        res_segments.append((seg.start, seg.end, seg.chord, float(np.clip(mean_conf, 0.0, 1.0))))
        
    return _filter_low_confidence_segments(res_segments, threshold=0.35)


def detect_key_custom(file_path: Path) -> str:
    """Returns e.g. 'C major' or 'A minor'."""
    return detect_key_dsp(str(file_path))


def detect_tempo_custom(file_path: Path) -> float:
    """Returns BPM as a float, e.g. 120.0."""
    return detect_tempo_dsp(str(file_path))
