"""
Preload Demucs models during container startup to avoid first-request delays.
This script downloads and caches the models before the API server starts.
"""
import sys

def preload_demucs():
    """Download and cache Demucs model at startup."""
    try:
        print("🔄 Preloading Demucs models...")
        from demucs.pretrained import get_model
        import torch
        
        # Download the htdemucs model (same one used in analysis.py)
        model = get_model("htdemucs")
        print("✅ Demucs htdemucs model loaded successfully")
        
        # Clean up to free memory
        del model
        torch.cuda.empty_cache() if torch.cuda.is_available() else None
        print("✅ Models cached and ready for inference")
        return True
        
    except Exception as e:
        print(f"⚠️  Model preload failed: {e}")
        print("Models will be downloaded on first request instead.")
        return False

if __name__ == "__main__":
    success = preload_demucs()
    sys.exit(0 if success else 1)
