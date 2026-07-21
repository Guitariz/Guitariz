"""
Wrapper for backend/chord_custom.py to maintain drop-in compatibility with main.py.
Translates the custom ML/ONNX output vocabulary into standard chord labels
and formats expected by the React frontend.
"""

from pathlib import Path
from typing import Dict, List

# Standard drop-in variables for main.py
FAST_ENGINE_AVAILABLE = False
FAST_ENGINE_ERROR = None

try:
    from backend.chord_custom import detect_chords_custom, detect_key_custom, detect_tempo_custom
except (ImportError, ModuleNotFoundError):
    from chord_custom import detect_chords_custom, detect_key_custom, detect_tempo_custom

def _clean_label(label: str) -> str:
    """Converts colon-based vocab labels (e.g. 'C:maj7', 'C:min') to standard frontend format ('Cmaj7', 'Cmin')."""
    if label == "N.C." or not label:
        return "N.C."
    
    if ":" not in label:
        return label
        
    root, quality = label.split(":", 1)
    
    # Map colon quality to standard frontend quality string
    if quality == "maj":
        return root
    elif quality == "min":
        return f"{root}min"
    else:
        # e.g., C:7 -> C7, C:maj7 -> Cmaj7, C:min7 -> Cmin7
        return f"{root}{quality}"

def _simplify_label(label: str) -> str:
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
        return f"{root}m"
    else:
        return root  # Default to major root (e.g., C)

def analyze_file_fast(file_path: Path) -> Dict:
    """
    Production-ready replacement for Chord AI analysis endpoint.
    Exposes the identical interface that backend/main.py expects.
    """
    print(f"[Custom Audio API] Running fast hybrid analysis for {file_path.name}...")
    
    # 1. Run Claude's custom ML/ONNX and DSP pipeline
    chords = detect_chords_custom(file_path)
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
            "chord": _simplify_label(cleaned),
            "confidence": float(confidence)
        })
        
    result = {
        "tempo": float(tempo),
        "meter": 4,  # default meter
        "key": key,
        "scale": scale,
        "chords": formatted_chords,
        "simpleChords": simple_chords
    }
    
    print(f"[Custom Audio API] Analysis complete | Key: {key} {scale} | Tempo: {tempo} BPM | Chords: {len(formatted_chords)}")
    return result
