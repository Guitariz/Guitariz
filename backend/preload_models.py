"""
backend/preload_models.py

Pre-download and cache models at Docker build time so the first request
doesn't trigger a slow download on the HuggingFace free tier.
"""

def preload():
    """Pre-load Demucs model weights (htdemucs) at build time."""
    try:
        from demucs.pretrained import get_model
        print("[Preload] Downloading htdemucs model...")
        model = get_model("htdemucs")
        print(f"[Preload] ✓ htdemucs loaded ({sum(p.numel() for p in model.parameters()):,} params)")
    except Exception as e:
        print(f"[Preload] ⚠ Failed to preload htdemucs: {e}")

    try:
        from demucs.pretrained import get_model
        print("[Preload] Downloading htdemucs_6s model...")
        model = get_model("htdemucs_6s")
        print(f"[Preload] ✓ htdemucs_6s loaded ({sum(p.numel() for p in model.parameters()):,} params)")
    except Exception as e:
        print(f"[Preload] ⚠ Failed to preload htdemucs_6s: {e}")


if __name__ == "__main__":
    preload()
