"""
ml/export_onnx.py

Export the trained ChordCRNN PyTorch model to ONNX format.

The exported model accepts dynamic-length audio (variable n_frames on the
time axis) and produces per-frame chord logits.

Usage:
    python -m ml.export_onnx --checkpoint ml/checkpoints/best_chord_crnn.pt --output backend/chord_model.onnx
"""
from __future__ import annotations

import argparse
from pathlib import Path

import torch

from .model import ChordCRNN
from .chord_vocab import NUM_CLASSES


def export_onnx(
    checkpoint_path: str = "ml/checkpoints/best_chord_crnn.pt",
    output_path: str = "backend/chord_model.onnx",
    opset_version: int = 17,
):
    """Export trained ChordCRNN to ONNX with dynamic axes."""

    # Load model
    model = ChordCRNN(num_classes=NUM_CLASSES)
    ckpt = torch.load(checkpoint_path, map_location="cpu", weights_only=True)
    model.load_state_dict(ckpt["model_state_dict"])
    model.eval()
    print(f"[Export] Loaded checkpoint from {checkpoint_path} (val_acc={ckpt.get('val_acc', 'N/A')})")

    # Create dummy input: (batch=1, channels=1, n_bins=216, n_frames=100)
    dummy = torch.randn(1, 1, 216, 100)

    # Export with dynamic axes for batch size and time dimension
    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)

    export_kwargs = {
        "export_params": True,
        "opset_version": 14,
        "do_constant_folding": True,
        "input_names": ["log_cqt"],
        "output_names": ["logits"],
        "dynamic_axes": {
            "log_cqt": {0: "batch", 3: "n_frames"},
            "logits": {0: "batch", 1: "n_frames"},
        },
    }

    try:
        # Explicitly use stable TorchScript exporter (bypasses dynamo LSTM shape check)
        torch.onnx.export(model, dummy, str(output), dynamo=False, **export_kwargs)
    except TypeError:
        # Older PyTorch versions that don't have the dynamo argument
        torch.onnx.export(model, dummy, str(output), **export_kwargs)

    size_mb = output.stat().st_size / (1024 * 1024)
    print(f"[Export] ONNX model saved to {output} ({size_mb:.1f} MB)")

    # Verify
    import onnxruntime as ort
    sess = ort.InferenceSession(str(output), providers=["CPUExecutionProvider"])
    import numpy as np
    test_input = np.random.randn(1, 1, 216, 150).astype(np.float32)
    result = sess.run(None, {"log_cqt": test_input})[0]
    print(f"[Export] Verification: input (1,1,216,150) → output {result.shape}")
    assert result.shape == (1, 150, NUM_CLASSES), f"Unexpected shape: {result.shape}"
    print("[Export] ✓ ONNX export verified successfully")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Export ChordCRNN to ONNX")
    parser.add_argument("--checkpoint", type=str, default="ml/checkpoints/best_chord_crnn.pt")
    parser.add_argument("--output", type=str, default="backend/chord_model.onnx")
    args = parser.parse_args()
    export_onnx(checkpoint_path=args.checkpoint, output_path=args.output)
