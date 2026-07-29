"""
ml/quantize_onnx.py

Dynamic INT8 Quantization and Performance Benchmarking script.
Quantizes chord_model.onnx to chord_model.quant.onnx and evaluates
FP32 ONNX vs Quantized INT8 ONNX vs DSP (Accurate Mode) on synthetic songs.
"""
from __future__ import annotations

import os
import time
import tempfile
from pathlib import Path
import numpy as np
import onnxruntime as ort
import soundfile as sf
import librosa
from onnxruntime.quantization import quantize_dynamic, QuantType

# Import feature and vocab components
from ml.features import extract_cnn_input, extract_cqt_chroma, frame_times, SR, HOP_LENGTH
from ml.chord_vocab import LABELS, LABEL_TO_IDX, build_templates, NUM_CLASSES
from ml.viterbi import smooth_chord_sequence
from ml.generate_synthetic_dataset import generate_song

CHORD_MODEL_PATH = Path("backend/chord_model.onnx")
QUANT_MODEL_PATH = Path("backend/chord_model.quant.onnx")


def run_onnx_inference(sess: ort.InferenceSession, log_cqt: np.ndarray) -> np.ndarray:
    """Runs batched ONNX inference on full log-CQT."""
    # log_cqt is (n_bins, n_frames). ONNX expects (batch=1, channel=1, n_bins, n_frames)
    inp = log_cqt[None, None, :, :].astype(np.float32)
    out = sess.run(None, {"log_cqt": inp})[0]  # shape: (1, n_frames, 109)
    # Apply softmax on logits to get probabilities
    logits = out[0]
    e = np.exp(logits - logits.max(axis=-1, keepdims=True))
    probs = e / e.sum(axis=-1, keepdims=True)
    return probs


def run_dsp_inference(y: np.ndarray, sr: int) -> np.ndarray:
    """Runs DSP template matching on HPSS-cleaned chroma."""
    # 1. Harmonic-percussive separation (harmonic only)
    y_harmonic = librosa.effects.harmonic(y)
    # 2. Extract CQT chroma
    chroma = extract_cqt_chroma(y_harmonic, sr)  # shape: (n_frames, 12)
    # 3. Match against templates
    templates = build_templates()  # shape: (109, 12)
    
    # Cosine similarities for each frame
    n_frames = len(chroma)
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
            # Dot product (templates are normalized, v is normalized -> cosine sim)
            sims[t] = templates @ v
            # Handled N.C. separately, so suppress its template match score
            sims[t, nc_idx] = -1.0
            
    # Convert similarity scores to probabilities via softmax with temperature scaling (tau=0.2)
    # (tau is kept soft so Viterbi can resolve context transitions)
    tau = 0.20
    e = np.exp(sims / tau)
    probs = e / e.sum(axis=-1, keepdims=True)
    return probs


def evaluate_frame_accuracy(preds: np.ndarray, ground_truth: np.ndarray) -> float:
    """Computes percentage of correctly classified frames."""
    return float(np.mean(preds == ground_truth) * 100.0)


def benchmark():
    # 1. Ensure dynamic quantization
    print(f"--- Quantizing ONNX model: {CHORD_MODEL_PATH} -> {QUANT_MODEL_PATH} ---")
    if not CHORD_MODEL_PATH.exists():
        print(f"Error: Base ONNX model not found at {CHORD_MODEL_PATH}")
        return
        
    quantize_dynamic(
        model_input=str(CHORD_MODEL_PATH),
        model_output=str(QUANT_MODEL_PATH),
        weight_type=QuantType.QInt8,
        op_types_to_quantize=["MatMul", "Gemm", "LSTM"]
    )
    print("Quantization complete!")

    # Load sessions
    sess_fp32 = ort.InferenceSession(str(CHORD_MODEL_PATH), providers=["CPUExecutionProvider"])
    sess_int8 = ort.InferenceSession(str(QUANT_MODEL_PATH), providers=["CPUExecutionProvider"])

    # 2. Generate synthetic songs for evaluation
    print("\n--- Generating synthetic evaluation tracks ---")
    num_tracks = 5
    tracks = []
    for idx in range(num_tracks):
        y, labs = generate_song(sr=SR, min_chords=5, max_chords=10)
        tracks.append((y, labs))
        print(f"  Track {idx+1}: {len(y)/SR:.1f}s, {len(labs)} chords")

    # 3. Evaluation loop
    fp32_latencies = []
    int8_latencies = []
    dsp_latencies = []
    
    fp32_accuracies = []
    int8_accuracies = []
    dsp_accuracies = []
    
    fp32_smoothed_acc = []
    int8_smoothed_acc = []
    dsp_smoothed_acc = []

    print("\n--- Running performance and accuracy benchmarks ---")
    for idx, (y, labs) in enumerate(tracks):
        # Ground truth frame alignment
        log_cqt = extract_cnn_input(y, SR)
        n_frames = log_cqt.shape[1]
        times = frame_times(n_frames, sr=SR, hop_length=HOP_LENGTH)
        frame_rate = SR / HOP_LENGTH
        
        # Build frame-level ground-truth labels
        gt_labels = np.full(n_frames, LABEL_TO_IDX["N.C."], dtype=int)
        for t_idx, time_sec in enumerate(times):
            for start, end, label in labs:
                # Strip flat/sharp mappings to vocab
                from ml.dataset import normalize_label
                norm_lbl = normalize_label(label)
                if start <= time_sec < end:
                    gt_labels[t_idx] = LABEL_TO_IDX.get(norm_lbl, LABEL_TO_IDX["N.C."])
                    break
        
        # A. FP32 ONNX
        t_start = time.perf_counter()
        probs_fp32 = run_onnx_inference(sess_fp32, log_cqt)
        fp32_latencies.append(time.perf_counter() - t_start)
        preds_fp32 = probs_fp32.argmax(axis=-1)
        fp32_accuracies.append(evaluate_frame_accuracy(preds_fp32, gt_labels))
        
        # Smooth and calculate accuracy
        segs_fp32 = smooth_chord_sequence(probs_fp32, frame_rate)
        smoothed_fp32 = np.full(n_frames, LABEL_TO_IDX["N.C."], dtype=int)
        for seg in segs_fp32:
            seg_idx = LABEL_TO_IDX.get(seg.chord, LABEL_TO_IDX["N.C."])
            smoothed_fp32[(times >= seg.start) & (times < seg.end)] = seg_idx
        fp32_smoothed_acc.append(evaluate_frame_accuracy(smoothed_fp32, gt_labels))

        # B. INT8 ONNX
        t_start = time.perf_counter()
        probs_int8 = run_onnx_inference(sess_int8, log_cqt)
        int8_latencies.append(time.perf_counter() - t_start)
        preds_int8 = probs_int8.argmax(axis=-1)
        int8_accuracies.append(evaluate_frame_accuracy(preds_int8, gt_labels))
        
        # Smooth and calculate accuracy
        segs_int8 = smooth_chord_sequence(probs_int8, frame_rate)
        smoothed_int8 = np.full(n_frames, LABEL_TO_IDX["N.C."], dtype=int)
        for seg in segs_int8:
            seg_idx = LABEL_TO_IDX.get(seg.chord, LABEL_TO_IDX["N.C."])
            smoothed_int8[(times >= seg.start) & (times < seg.end)] = seg_idx
        int8_smoothed_acc.append(evaluate_frame_accuracy(smoothed_int8, gt_labels))

        # C. DSP template matching (Accurate Mode)
        t_start = time.perf_counter()
        probs_dsp = run_dsp_inference(y, SR)
        dsp_latencies.append(time.perf_counter() - t_start)
        preds_dsp = probs_dsp.argmax(axis=-1)
        dsp_accuracies.append(evaluate_frame_accuracy(preds_dsp, gt_labels))
        
        # Smooth and calculate accuracy
        segs_dsp = smooth_chord_sequence(probs_dsp, frame_rate)
        smoothed_dsp = np.full(n_frames, LABEL_TO_IDX["N.C."], dtype=int)
        for seg in segs_dsp:
            seg_idx = LABEL_TO_IDX.get(seg.chord, LABEL_TO_IDX["N.C."])
            smoothed_dsp[(times >= seg.start) & (times < seg.end)] = seg_idx
        dsp_smoothed_acc.append(evaluate_frame_accuracy(smoothed_dsp, gt_labels))

    # Print Report
    mean_fp32_lat = np.mean(fp32_latencies) * 1000.0
    mean_int8_lat = np.mean(int8_latencies) * 1000.0
    mean_dsp_lat = np.mean(dsp_latencies) * 1000.0

    mean_fp32_acc = np.mean(fp32_accuracies)
    mean_int8_acc = np.mean(int8_accuracies)
    mean_dsp_acc = np.mean(dsp_accuracies)

    mean_fp32_sm = np.mean(fp32_smoothed_acc)
    mean_int8_sm = np.mean(int8_smoothed_acc)
    mean_dsp_sm = np.mean(dsp_smoothed_acc)

    abs_acc_drop = mean_fp32_acc - mean_int8_acc
    abs_sm_drop = mean_fp32_sm - mean_int8_sm

    print("\n" + "=" * 65)
    print("CHORD INFERENCE ENGINE BENCHMARK REPORT")
    print("=" * 65)
    print(f"{'Engine Mode':<30} | {'Latency':<12} | {'Raw Acc':<9} | {'Smoothed Acc':<12}")
    print("-" * 65)
    print(f"{'FP32 ONNX (Fast Mode - Base)':<30} | {mean_fp32_lat:7.1f} ms | {mean_fp32_acc:6.2f}% | {mean_fp32_sm:6.2f}%")
    print(f"{'INT8 ONNX (Fast Mode - Quant)':<30} | {mean_int8_lat:7.1f} ms | {mean_int8_acc:6.2f}% | {mean_int8_sm:6.2f}%")
    print(f"{'DSP Template (Accurate Mode)':<30} | {mean_dsp_lat:7.1f} ms | {mean_dsp_acc:6.2f}% | {mean_dsp_sm:6.2f}%")
    print("=" * 65)
    
    print("\nQuantization Delta (FP32 vs INT8):")
    print(f"  - Latency Speedup: {mean_fp32_lat / mean_int8_lat:.2f}x faster")
    print(f"  - Absolute Raw Accuracy Change: {abs_acc_drop:+.2f} percentage points")
    print(f"  - Absolute Smoothed Accuracy Change: {abs_sm_drop:+.2f} percentage points")
    
    # Check threshold logic
    print("\nQuantization Status Verification:")
    if abs_sm_drop <= 2.5:
        print("  [SUCCESS] Quantized INT8 smoothed accuracy drop <= 2.5 percentage points.")
        print("            Safe to enable USE_QUANTIZED_MODEL by default in production.")
    else:
        print("  [WARNING] Quantized INT8 smoothed accuracy drop exceeds 2.5 percentage points.")
        print("            Maintain USE_QUANTIZED_MODEL = False as the default mode.")


if __name__ == "__main__":
    benchmark()
