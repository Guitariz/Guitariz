"""
Wrapper for backend/chord_custom.py to maintain drop-in compatibility with main.py.
Translates the custom ML/ONNX output vocabulary into standard chord labels
and formats expected by the React frontend.
"""

import os
from pathlib import Path

# Standard drop-in variables for main.py
CHORD_MODEL_PATH = Path(os.environ.get("CHORD_MODEL_PATH", Path(__file__).parent / "chord_model.onnx"))

try:
    import onnxruntime as ort  # noqa: F401
    FAST_ENGINE_AVAILABLE = CHORD_MODEL_PATH.exists()
    FAST_ENGINE_ERROR = None if FAST_ENGINE_AVAILABLE else f"chord_model.onnx not found at resolved path: {CHORD_MODEL_PATH.absolute()}"
except Exception as e:
    FAST_ENGINE_AVAILABLE = False
    FAST_ENGINE_ERROR = f"onnxruntime import failed: {e}"

try:
    from backend.chord_custom import (
        detect_chords_custom,
        detect_key_custom,
        detect_tempo_custom,
    )
except (ImportError, ModuleNotFoundError):
    from chord_custom import (
        detect_chords_custom,
        detect_key_custom,
        detect_tempo_custom,
    )

try:
    from backend.analysis import _get_diatonic_quality
except (ImportError, ModuleNotFoundError):
    from analysis import _get_diatonic_quality

def _clean_label(label: str) -> str:
    """Converts colon-based vocab labels (e.g. 'C:maj7', 'C:min') to standard frontend format ('Cmaj7', 'Cmin')."""
    if label == "N.C." or not label:
        return "N.C."
    
    # Extract root (handle flat/sharp)
    if len(label) > 1 and label[1] in ["#", "b"]:
        root = label[:2]
        quality = label[2:]
    else:
        root = label[0]
        quality = label[1:]
        
    # Standardize
    if quality == ":min" or quality == "min":
        return f"{root}min"
    elif quality == ":maj" or quality == "maj" or quality == "":
        return root
    elif quality.startswith(":"):
        quality = quality[1:]
        
    if quality == "min":
        return f"{root}min"
    else:
        # e.g., C:7 -> C7, C:maj7 -> Cmaj7, C:min7 -> Cmin7
        return f"{root}{quality}"

def _simplify_label(label: str, key: str = "C", scale: str = "major") -> str:
    """Simplifies standard chord labels to base qualities (root, m, dim, aug) for simpleChords view."""
    if label == "N.C." or not label:
        return "N.C."
        
    # Handle flat/sharp roots
    if len(label) > 1 and label[1] in ["#", "b"]:
        root = label[:2]
        quality = label[2:]
    else:
        root = label[0]
        quality = label[1:]
        
    if "dim" in quality:
        return f"{root}dim"
    elif "aug" in quality:
        return f"{root}aug"
    elif "min" in quality or "m" in quality:
        return f"{root}min"
    elif "sus" in quality or quality == "" or quality.isdigit():
        # Ambiguous chord or plain root - check diatonic quality of root in this key!
        diatonic_q = _get_diatonic_quality(root, key, scale)
        if diatonic_q == "min":
            return f"{root}min"
        elif diatonic_q == "dim":
            return f"{root}dim"
        else:
            return root
    else:
        return root

def analyze_file_fast(file_path: Path, mode: str = "fast") -> dict:
    """
    Production-ready replacement for Chord AI analysis endpoint.
    Exposes the identical interface that backend/main.py expects.
    """
    print(f"[Custom Audio API] Running fast hybrid analysis for {file_path.name} | Mode: {mode}...")
    
    # 1. Run Claude's custom ML/ONNX and DSP pipeline
    chords = detect_chords_custom(file_path, mode=mode)
    key_str = detect_key_custom(file_path)
    tempo = detect_tempo_custom(file_path)
    
    # 2. Parse key (e.g., "C major" or "Am")
    if " " in key_str:
        key, scale = key_str.split(" ", 1)
    elif key_str.endswith("m"):
        key = key_str[:-1]
        scale = "minor"
    else:
        key = key_str
        scale = "major"
        
    # 3. Format chords and clean up colon labels for the React frontend
    formatted_chords = []
    simple_chords = []
    
    for start, end, label, confidence in chords:
        cleaned = _clean_label(label)
        
        formatted_chords.append({
            "start": float(start),
            "end": float(end),
            "chord": cleaned,
            "confidence": float(confidence)
        })
        
        simple_chords.append({
            "start": float(start),
            "end": float(end),
            "chord": _simplify_label(cleaned, key=key, scale=scale),
            "confidence": float(confidence)
        })
    
    # Merge consecutive identical simple chords (e.g., Cmaj7→C followed by C7→C)
    merged_simple = []
    for sc in simple_chords:
        if merged_simple and merged_simple[-1]["chord"] == sc["chord"]:
            merged_simple[-1]["end"] = sc["end"]
            merged_simple[-1]["confidence"] = max(merged_simple[-1]["confidence"], sc["confidence"])
        else:
            merged_simple.append(sc.copy())
    
    # Filter out short simple-chord segments (< 1.0s) by merging into neighbors
    final_simple = []
    for i, sc in enumerate(merged_simple):
        dur = sc["end"] - sc["start"]
        if dur < 1.0:
            if final_simple:
                final_simple[-1]["end"] = sc["end"]
            elif i < len(merged_simple) - 1:
                merged_simple[i + 1]["start"] = sc["start"]
            else:
                final_simple.append(sc)
        else:
            final_simple.append(sc)
        
    result = {
        "tempo": float(tempo),
        "meter": 4,  # default meter
        "key": key,
        "scale": scale,
        "chords": formatted_chords,
        "simpleChords": final_simple
    }
    
    print(f"[Custom Audio API] Analysis complete | Key: {key} {scale} | Tempo: {tempo} BPM | Chords: {len(formatted_chords)}")
    return result
