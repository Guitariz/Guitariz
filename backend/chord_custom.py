"""
backend/chord_custom.py

Drop-in replacement for the old chord detection backend. Zero
licensing risk: no non-commercial imports anywhere in this file.

Exposes exactly the three functions main.py should call:
    detect_chords_custom(file_path) -> List[Tuple[float, float, str, float]]
    detect_key_custom(file_path)    -> str
    detect_tempo_custom(file_path)  -> float

Behavior:
  - Tempo and key ALWAYS use the DSP algorithms in ml/dsp_tempo_key.py
    (librosa onset/beat-tracking + Krumhansl-Schmuckler key profiles).
    These need no trained model, are already fast (<2s/song), and there's
    little accuracy to gain from a neural model here relative to the
    complexity cost -- so no ONNX path for these two.

  - Chords: if a trained ONNX model is present at CHORD_MODEL_PATH, it is
    used (better accuracy, especially on inversions/7ths/sus chords).
    Otherwise this transparently falls back to the zero-training chroma
    template-matching baseline in ml/chord_templates.py, so the site keeps
    working correctly even before you've trained + exported a model.

Configure the ONNX model path via the CHORD_MODEL_PATH env var, or just
drop chord_model.onnx next to this file (default lookup path below).
"""
from __future__ import annotations

import os
from pathlib import Path
from typing import List, Tuple

import numpy as np

# --- import from the ml/ package (feature extraction is shared to guarantee
# train/inference parity between the ONNX model and this backend code)
from ml.features import extract_cnn_input, frame_times, load_audio, HOP_LENGTH
from ml.chord_vocab import IDX_TO_LABEL, NUM_CLASSES
from ml.chord_templates import detect_chords_dsp
from ml.dsp_tempo_key import detect_tempo_dsp, detect_key_dsp

CHORD_MODEL_PATH = Path(os.environ.get("CHORD_MODEL_PATH", Path(__file__).parent / "chord_model.onnx"))

_onnx_session = None
_onnx_load_attempted = False


def _get_onnx_session():
    """Lazily load the ONNX model once per process, if it exists. Cached after first call."""
    global _onnx_session, _onnx_load_attempted
    if _onnx_load_attempted:
        return _onnx_session
    _onnx_load_attempted = True

    if not CHORD_MODEL_PATH.exists():
        print(f"[chord_custom] No trained ONNX model found at {CHORD_MODEL_PATH}. "
              f"Using DSP template-matching baseline for chord detection.")
        return None

    try:
        import onnxruntime as ort
        _onnx_session = ort.InferenceSession(str(CHORD_MODEL_PATH), providers=["CPUExecutionProvider"])
        print(f"[chord_custom] Loaded trained chord model from {CHORD_MODEL_PATH}")
    except Exception as e:
        print(f"[chord_custom] Failed to load ONNX model ({e}); falling back to DSP baseline.")
        _onnx_session = None
    return _onnx_session


def _detect_chords_onnx(file_path: Path, chunk_frames: int = 200) -> List[Tuple[float, float, str, float]]:
    sess = _get_onnx_session()
    y, sr = load_audio(str(file_path))
    log_cqt = extract_cnn_input(y, sr)
    n_bins, n_frames = log_cqt.shape
    times = frame_times(n_frames, sr=sr, hop_length=HOP_LENGTH)

    all_logits = np.zeros((n_frames, NUM_CLASSES), dtype=np.float32)
    for start in range(0, n_frames, chunk_frames):
        end = min(start + chunk_frames, n_frames)
        chunk = log_cqt[:, start:end][None, None, :, :]
        out = sess.run(None, {"log_cqt": chunk.astype(np.float32)})[0]
        all_logits[start:end] = out[0]

    e = np.exp(all_logits - all_logits.max(axis=-1, keepdims=True))
    probs = e / e.sum(axis=-1, keepdims=True)
    preds = probs.argmax(axis=-1)
    confidences = probs.max(axis=-1)

    segments: List[Tuple[float, float, str, float]] = []
    seg_start = times[0]
    seg_label = preds[0]
    seg_confs = [confidences[0]]
    for i in range(1, len(preds)):
        if preds[i] != seg_label:
            segments.append((float(seg_start), float(times[i]), IDX_TO_LABEL[int(seg_label)], float(np.mean(seg_confs))))
            seg_start = times[i]
            seg_label = preds[i]
            seg_confs = []
        seg_confs.append(confidences[i])
    total_dur = float(times[-1] + HOP_LENGTH / sr)
    segments.append((float(seg_start), total_dur, IDX_TO_LABEL[int(seg_label)], float(np.mean(seg_confs))))
    return segments


def detect_chords_custom(file_path: Path) -> List[Tuple[float, float, str, float]]:
    """
    Time-aligned chord segments: (start_sec, end_sec, chord_label, confidence).
    Uses the trained ONNX model if available at CHORD_MODEL_PATH, otherwise
    falls back to the zero-training DSP template-matching baseline.
    """
    sess = _get_onnx_session()
    if sess is not None:
        try:
            return _detect_chords_onnx(file_path)
        except Exception as e:
            print(f"[chord_custom] ONNX inference failed ({e}); falling back to DSP baseline for this request.")
    return detect_chords_dsp(str(file_path))


def detect_key_custom(file_path: Path) -> str:
    """Returns e.g. 'C major' or 'A minor'."""
    return detect_key_dsp(str(file_path))


def detect_tempo_custom(file_path: Path) -> float:
    """Returns BPM as a float, e.g. 120.0."""
    return detect_tempo_dsp(str(file_path))
