"""
ml/export_onnx.py

Loads a trained ChordCRNN checkpoint (.pt, from ml/train.py) and exports it
to ONNX for lightweight CPU inference via onnxruntime (no torch dependency
needed in the FastAPI backend at all).

Usage:
    python -m ml.export_onnx --ckpt ckpt.pt --out chord_model.onnx

Notes on export correctness:
  - We export with a FIXED time dimension of `chunk_frames` (default 200,
    matching training) using dynamic_axes so variable-length songs still work
    at inference (the backend chunks + stitches long songs; see
    backend/chord_custom.py).
  - LSTMs export to ONNX fine under opset >= 14 as long as batch_first=True
    and there's no data-dependent control flow -- verified below by actually
    running the exported graph through onnxruntime and diffing against the
    original PyTorch output.
"""
from __future__ import annotations

import argparse

import numpy as np
import torch

from .model import ChordCRNN


def export(ckpt_path: str, out_path: str, chunk_frames: int = 200, n_bins: int = 216):
    model = ChordCRNN()
    ckpt = torch.load(ckpt_path, map_location="cpu")
    state = ckpt["model_state"] if "model_state" in ckpt else ckpt
    model.load_state_dict(state)
    model.eval()

    dummy = torch.randn(1, 1, n_bins, chunk_frames)

    # NOTE: torch's newer dynamo-based exporter (the default in torch>=2.x when
    # onnxscript is installed) has been observed to bake the dummy input's
    # sequence length in as a static constant in the LSTM->Linear reshape,
    # silently breaking dynamic_axes for variable-length songs. We force the
    # legacy TorchScript-tracing exporter (dynamo=False) instead, which handles
    # this LSTM+reshape pattern correctly -- verified below against a second,
    # differently-shaped input.
    torch.onnx.export(
        model,
        dummy,
        out_path,
        input_names=["log_cqt"],
        output_names=["chord_logits"],
        dynamic_axes={
            "log_cqt": {0: "batch", 3: "n_frames"},
            "chord_logits": {0: "batch", 1: "n_frames"},
        },
        opset_version=17,
        dynamo=False,
    )
    print(f"Exported ONNX model to {out_path}")

    # immediately verify against the PyTorch model
    verify(model, out_path, dummy)


def verify(torch_model, onnx_path: str, dummy_input: torch.Tensor):
    import onnxruntime as ort

    with torch.no_grad():
        torch_out = torch_model(dummy_input).numpy()

    sess = ort.InferenceSession(onnx_path, providers=["CPUExecutionProvider"])
    onnx_out = sess.run(None, {"log_cqt": dummy_input.numpy()})[0]

    max_diff = np.abs(torch_out - onnx_out).max()
    print(f"Max abs diff between PyTorch and ONNX output: {max_diff:.6f}")
    assert max_diff < 1e-3, "ONNX export mismatch exceeds tolerance!"
    print("ONNX export verified: outputs match PyTorch within tolerance.")

    # also test with a different sequence length to confirm dynamic_axes works
    dummy2 = torch.randn(1, 1, dummy_input.shape[2], 350)
    with torch.no_grad():
        torch_out2 = torch_model(dummy2).numpy()
    onnx_out2 = sess.run(None, {"log_cqt": dummy2.numpy()})[0]
    max_diff2 = np.abs(torch_out2 - onnx_out2).max()
    print(f"Max abs diff at a different sequence length (350 frames): {max_diff2:.6f}")
    assert max_diff2 < 1e-3, "ONNX export fails to generalize to other sequence lengths!"
    print("Confirmed: exported model handles variable-length input correctly.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--ckpt", type=str, required=False, default=None)
    parser.add_argument("--out", type=str, default="chord_model.onnx")
    parser.add_argument("--smoke_test", action="store_true")
    args = parser.parse_args()

    if args.smoke_test or args.ckpt is None:
        # export a randomly-initialized model just to prove the export path works
        print("No checkpoint given -- running export smoke test with random weights.")
        model = ChordCRNN()
        model.eval()
        torch.save({"model_state": model.state_dict()}, "smoke_ckpt.pt")
        export("smoke_ckpt.pt", "smoke_model.onnx")
    else:
        export(args.ckpt, args.out)
