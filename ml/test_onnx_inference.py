"""
ml/test_onnx_inference.py

Standalone test: runs a full audio file through the exported ONNX chord model
and prints time-aligned chord segments, exactly mirroring what
backend/chord_custom.py does. Use this to sanity-check a freshly trained +
exported model before wiring it into the FastAPI backend.

Usage:
    python -m ml.test_onnx_inference --model chord_model.onnx --audio song.wav
"""
from __future__ import annotations

import argparse
import time

import numpy as np
import onnxruntime as ort

from .features import extract_cnn_input, frame_times, load_audio, SR, HOP_LENGTH
from .chord_vocab import IDX_TO_LABEL, NUM_CLASSES


def run_inference(model_path: str, audio_path: str, chunk_frames: int = 200):
    sess = ort.InferenceSession(model_path, providers=["CPUExecutionProvider"])

    y, sr = load_audio(audio_path)
    log_cqt = extract_cnn_input(y, sr)  # (n_bins, n_frames)
    n_bins, n_frames = log_cqt.shape
    times = frame_times(n_frames, sr=sr, hop_length=HOP_LENGTH)

    # chunked inference to bound memory on very long songs; overlap-free since
    # the exported model handles arbitrary sequence length per dynamic_axes.
    all_logits = np.zeros((n_frames, NUM_CLASSES), dtype=np.float32)
    for start in range(0, n_frames, chunk_frames):
        end = min(start + chunk_frames, n_frames)
        chunk = log_cqt[:, start:end][None, None, :, :]  # (1,1,n_bins,chunk_len)
        out = sess.run(None, {"log_cqt": chunk.astype(np.float32)})[0]  # (1, chunk_len, C)
        all_logits[start:end] = out[0]

    preds = all_logits.argmax(axis=-1)
    confidences = _softmax_max(all_logits)

    # collapse to segments
    segments = []
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


def _softmax_max(logits: np.ndarray) -> np.ndarray:
    e = np.exp(logits - logits.max(axis=-1, keepdims=True))
    probs = e / e.sum(axis=-1, keepdims=True)
    return probs.max(axis=-1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", type=str, required=True)
    parser.add_argument("--audio", type=str, required=True)
    args = parser.parse_args()

    t0 = time.time()
    segs = run_inference(args.model, args.audio)
    elapsed = time.time() - t0

    print(f"Inference took {elapsed:.2f}s")
    for s in segs:
        print(f"  {s[0]:7.2f}-{s[1]:7.2f}s  {s[2]:10s} conf={s[3]:.2f}")
