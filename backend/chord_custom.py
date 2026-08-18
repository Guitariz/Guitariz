"""
backend/chord_custom.py

Drop-in chord detection engine. Zero licensing risk — no non-commercial
imports anywhere in this file.

Exposes exactly three functions that main.py calls:
    detect_chords_custom(file_path, mode) → List[Tuple[float, float, str, float]]
    detect_key_custom(file_path)          → str
    detect_tempo_custom(file_path)        → float

Modes:
  - "fast":     Batched ONNX CRNN inference + HMM Viterbi smoothing (~3-5s)
  - "accurate": HPSS + CQT chroma template matching + HMM Viterbi (~5-8s)
"""
from __future__ import annotations

import os
from pathlib import Path

import numpy as np

from ml.chord_vocab import LABEL_TO_IDX, NUM_CLASSES, build_templates
from ml.dsp_tempo_key import detect_key_dsp, detect_tempo_dsp
from ml.features import HOP_LENGTH, extract_cnn_input, extract_cqt_chroma, load_audio
from ml.viterbi import smooth_chord_sequence

# ── ONNX model paths ───────────────────────────────────────────────────────
CHORD_MODEL_PATH = Path(
    os.environ.get("CHORD_MODEL_PATH", Path(__file__).parent / "chord_model.onnx")
)
QUANT_MODEL_PATH = Path(
    os.environ.get("QUANT_MODEL_PATH", Path(__file__).parent / "chord_model.quant.onnx")
)

# A/B test flag — prefer quantized model (smaller, faster) if it exists
USE_QUANTIZED_MODEL = os.environ.get("USE_QUANTIZED_MODEL", "true").lower() == "true"

# Lazy-loaded ONNX session (cached per-process)
_onnx_session = None
_onnx_load_attempted = False


# ── Low-confidence filtering ───────────────────────────────────────────────

def _filter_low_confidence_segments(
    segments: list[tuple[float, float, str, float]],
    threshold: float = 0.65,
) -> list[tuple[float, float, str, float]]:
    """Map low-confidence chord segments to 'N.C.' and merge consecutive duplicates."""
    # Step 1: Remap below threshold to N.C.
    cleaned = []
    for start, end, chord, conf in segments:
        if chord != "N.C." and conf < threshold:
            cleaned.append((start, end, "N.C.", conf))
        else:
            cleaned.append((start, end, chord, conf))

    # Step 2: Merge consecutive identical labels
    merged: list[tuple[float, float, str, float]] = []
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


# ── ONNX session management ───────────────────────────────────────────────

def _get_onnx_session():
    """Lazily load the ONNX model once per process. Cached after first call."""
    global _onnx_session, _onnx_load_attempted
    if _onnx_load_attempted:
        return _onnx_session
    _onnx_load_attempted = True

    # Prefer quantized model if available and enabled
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


# ── ONNX-based chord detection ─────────────────────────────────────────────

def _detect_chords_onnx(file_path: Path) -> list[tuple[float, float, str, float]]:
    """Run batched ONNX CRNN inference with Viterbi smoothing."""
    sess = _get_onnx_session()
    y, sr = load_audio(str(file_path))
    log_cqt = extract_cnn_input(y, sr)  # (n_bins, n_frames)
    _, n_frames = log_cqt.shape
    frame_rate = sr / HOP_LENGTH

    # For very long files (>10 minutes), use chunked inference to avoid OOM
    duration = n_frames * HOP_LENGTH / sr
    max_duration_sec = 600.0

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
        # Batch full-track CQT into a single ONNX inference call
        chunk = log_cqt[None, None, :, :]  # (1, 1, n_bins, n_frames)
        out = sess.run(None, {"log_cqt": chunk.astype(np.float32)})[0]  # (1, n_frames, 109)
        all_logits = out[0]

    # Convert logits to probabilities via softmax
    e = np.exp(all_logits - all_logits.max(axis=-1, keepdims=True))
    probs = e / e.sum(axis=-1, keepdims=True)

    # Apply HMM Viterbi smoothing
    smoothed_segments = smooth_chord_sequence(
        probs,
        frame_rate=frame_rate,
        min_duration_ms=300.0,
        self_transition_prob=0.95,
    )

    # Format output
    results = [(seg.start, seg.end, seg.chord, seg.confidence) for seg in smoothed_segments]
    return _filter_low_confidence_segments(results, threshold=0.35)


# ── Public API ──────────────────────────────────────────────────────────────

def detect_chords_custom(
    file_path: Path,
    mode: str = "fast",
) -> list[tuple[float, float, str, float]]:
    """
    Detect time-aligned chord segments.

    Returns: list of (start_sec, end_sec, chord_label, confidence) tuples.

    Modes:
      - "fast": Batched ONNX CRNN with HMM Viterbi smoothing.
      - "accurate": HPSS + CQT chroma template matching + HMM Viterbi.
    """
    if mode == "fast":
        sess = _get_onnx_session()
        if sess is not None:
            try:
                return _detect_chords_onnx(file_path)
            except Exception as e:
                print(f"[chord_custom] ONNX inference failed ({e}); falling back to DSP.")
        # Fallback to DSP if ONNX unavailable or failed
        mode = "accurate"

    # ACCURATE MODE: classical template matching with HPSS + CQT + Viterbi
    import librosa

    y, sr = load_audio(str(file_path))
    y_harmonic = librosa.effects.harmonic(y)  # HPSS harmonic isolation
    chroma = extract_cqt_chroma(y_harmonic, sr)  # (n_frames, 12)
    n_frames = len(chroma)
    frame_rate = sr / HOP_LENGTH

    templates = build_templates()  # (109, 12)
    nc_idx = LABEL_TO_IDX["N.C."]

    # Cosine similarity per frame
    sims = np.zeros((n_frames, NUM_CLASSES), dtype=np.float32)
    for t in range(n_frames):
        vec = chroma[t]
        norm = np.linalg.norm(vec)
        if norm < 0.15:
            sims[t, nc_idx] = 1.0
        else:
            v = vec / (norm + 1e-8)
            sims[t] = templates @ v
            sims[t, nc_idx] = -1.0

    # Softmax with temperature scaling
    tau = 0.20
    e = np.exp(sims / tau)
    probs = e / e.sum(axis=-1, keepdims=True)

    # Viterbi smoothing
    smoothed_segments = smooth_chord_sequence(
        probs,
        frame_rate=frame_rate,
        min_duration_ms=300.0,
        self_transition_prob=0.95,
    )

    # Compute confidence from raw similarity scores
    results: list[tuple[float, float, str, float]] = []
    for seg in smoothed_segments:
        seg_idx = LABEL_TO_IDX.get(seg.chord, nc_idx)
        t_start_idx = int(round(seg.start * frame_rate))
        t_end_idx = int(round(seg.end * frame_rate))
        t_end_idx = max(t_start_idx + 1, min(t_end_idx, n_frames))

        if seg.chord == "N.C.":
            confs = [1.0 - np.linalg.norm(chroma[t]) for t in range(t_start_idx, t_end_idx)]
            mean_conf = float(np.mean(confs)) if confs else 0.0
        else:
            confs = (sims[t_start_idx:t_end_idx, seg_idx] + 1.0) / 2.0
            mean_conf = float(np.mean(confs))

        results.append((seg.start, seg.end, seg.chord, float(np.clip(mean_conf, 0.0, 1.0))))

    return _filter_low_confidence_segments(results, threshold=0.35)


def detect_key_custom(file_path: Path) -> str:
    """Returns e.g. 'C major' or 'A minor'."""
    return detect_key_dsp(str(file_path))


def detect_tempo_custom(file_path: Path) -> float:
    """Returns BPM as a float, e.g. 120.0."""
    return detect_tempo_dsp(str(file_path))
