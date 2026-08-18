"""
ml/test_onnx_inference.py

Quick sanity test for the exported ONNX chord model.
"""
from __future__ import annotations

from pathlib import Path

import numpy as np


def test_onnx_model(model_path: str = "backend/chord_model.onnx"):
    """Test that the ONNX model loads and produces correct output shapes."""
    import onnxruntime as ort

    from .chord_vocab import NUM_CLASSES

    path = Path(model_path)
    if not path.exists():
        print(f"[Test] Model not found at {path}, skipping ONNX test")
        return

    sess = ort.InferenceSession(str(path), providers=["CPUExecutionProvider"])

    # Test with various frame lengths (dynamic axis)
    for n_frames in [50, 100, 200, 500]:
        inp = np.random.randn(1, 1, 216, n_frames).astype(np.float32)
        out = sess.run(None, {"log_cqt": inp})[0]
        assert out.shape == (1, n_frames, NUM_CLASSES), \
            f"Expected (1, {n_frames}, {NUM_CLASSES}), got {out.shape}"

    print(f"[Test] ✓ ONNX model at {path} passed all shape tests")


if __name__ == "__main__":
    test_onnx_model()
