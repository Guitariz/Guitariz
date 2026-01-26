"""
Enhanced chord detection using deep learning models.
This module provides more accurate chord recognition compared to template matching.
"""

import numpy as np
from typing import List, Dict


def detect_chords_ml(y: np.ndarray, sr: int) -> List[Dict]:
    """
    Use madmom's deep learning chord recognition for better accuracy.
    Falls back to basic detection if madmom is not available.
    """
    try:
        from madmom.audio.chroma import DeepChromaProcessor
        from madmom.features.chords import DeepChromaChordRecognitionProcessor
        
        # Process audio with deep learning models
        dcp = DeepChromaProcessor()
        decode = DeepChromaChordRecognitionProcessor()
        
        # madmom expects mono audio
        chords = decode(dcp(y))
        
        # Convert madmom output format to our format
        result = []
        for i in range(len(chords)):
            start_time = float(chords[i][0])
            chord_label = str(chords[i][1])
            
            # Get end time (next chord's start or end of audio)
            if i < len(chords) - 1:
                end_time = float(chords[i + 1][0])
            else:
                end_time = float(len(y) / sr)
            
            result.append({
                "start": start_time,
                "end": end_time,
                "chord": chord_label,
                "confidence": 0.8  # madmom doesn't provide confidence, use fixed value
            })
        
        return result
        
    except ImportError:
        print("⚠️  madmom not available, falling back to basic detection")
        return None
    except Exception as e:
        print(f"⚠️  ML chord detection failed: {e}, falling back to basic detection")
        return None


def simplify_chord_label(chord: str) -> str:
    """Simplify complex chord labels to basic forms."""
    if chord in ["N", "N.C.", "X"]:
        return "N.C."
    
    # madmom uses format like "C:maj", "D:min", "G:maj7"
    if ":" in chord:
        parts = chord.split(":")
        root = parts[0]
        quality = parts[1] if len(parts) > 1 else "maj"
        
        # Simplify qualities
        if quality in ["maj", "major"]:
            return root
        elif quality in ["min", "minor"]:
            return f"{root}min"
        elif quality in ["dim", "diminished"]:
            return f"{root}dim"
        elif quality in ["aug", "augmented"]:
            return f"{root}aug"
        elif "7" in quality:
            if "maj7" in quality or "M7" in quality:
                return f"{root}maj7"
            elif "min7" in quality or "m7" in quality:
                return f"{root}min7"
            else:
                return f"{root}7"
        elif "sus" in quality:
            if "sus2" in quality:
                return f"{root}sus2"
            elif "sus4" in quality:
                return f"{root}sus4"
        
        return f"{root}{quality}"
    
    return chord
