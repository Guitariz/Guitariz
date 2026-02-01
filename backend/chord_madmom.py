"""
Fast chord, key, and tempo detection using madmom library.
Much faster than librosa-based approach, runs in ~5-10 seconds.
Gracefully falls back if madmom is not installed (e.g., on Windows).
"""
import hashlib
import json
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import numpy as np

# Try to import madmom, but don't fail if it's not available
try:
    import madmom
    import madmom.features.chords
    import madmom.features.key
    import madmom.features.tempo
    MADMOM_AVAILABLE = True
    print("[madmom] Successfully loaded - fast analysis available")
except ImportError as e:
    MADMOM_AVAILABLE = False
    print(f"[madmom] Import failed: {e}")
    print("[madmom] Not available - using librosa fallback")
except Exception as e:
    MADMOM_AVAILABLE = False
    print(f"[madmom] Unexpected error: {e}")
    print("[madmom] Not available - using librosa fallback")


# Cache directory for storing analysis results
CACHE_DIR = Path("cache")
CHORD_CACHE_DIR = CACHE_DIR / "chords"
KEY_CACHE_DIR = CACHE_DIR / "keys"
TEMPO_CACHE_DIR = CACHE_DIR / "tempo"

# Create cache directories
for cache_dir in [CHORD_CACHE_DIR, KEY_CACHE_DIR, TEMPO_CACHE_DIR]:
    cache_dir.mkdir(parents=True, exist_ok=True)


def _get_file_hash(file_path: Path) -> str:
    """Generate MD5 hash based on file content and size for robust caching."""
    hasher = hashlib.md5()
    try:
        # Include file size in the hash
        stats = file_path.stat()
        hasher.update(str(stats.st_size).encode())
        
        # Hash the first 1MB of the file
        with open(file_path, 'rb') as f:
            chunk = f.read(1024 * 1024)
            hasher.update(chunk)
            
            # If file is larger than 2MB, also hash the last chunk
            if stats.st_size > 2 * 1024 * 1024:
                f.seek(-1024 * 1024, 2)
                chunk = f.read(1024 * 1024)
                hasher.update(chunk)
                
        return hasher.hexdigest()
    except Exception as e:
        print(f"[madmom] Hashing failed: {e}")
        # Fallback to name-based if content reading fails
        return hashlib.md5(str(file_path.name).encode()).hexdigest()


def _load_from_cache(cache_file: Path) -> Optional[any]:
    """Load cached result if it exists."""
    if cache_file.exists():
        try:
            with open(cache_file, 'r') as f:
                return json.load(f)
        except Exception:
            return None
    return None


def _save_to_cache(cache_file: Path, data: any) -> None:
    """Save result to cache."""
    try:
        with open(cache_file, 'w') as f:
            json.dump(data, f)
    except Exception:
        pass


def detect_chords_madmom(file_path: Path) -> List[Tuple[float, float, str, float]]:
    """
    Detect chords using madmom's CNN + CRF approach.
    Returns: List of (start_time, end_time, chord_label, confidence) tuples
    """
    if not MADMOM_AVAILABLE:
        raise ImportError("madmom is not installed")
    
    # Check cache first
    file_hash = _get_file_hash(file_path)
    cache_file = CHORD_CACHE_DIR / f"{file_hash}.json"
    cached = _load_from_cache(cache_file)
    
    if cached is not None:
        return [(c[0], c[1], c[2], c[3]) for c in cached]
    
    # Process with madmom
    print(f"[madmom] Detecting chords for {file_path.name}...")
    feat_processor = madmom.features.chords.CNNChordFeatureProcessor()
    recog_processor = madmom.features.chords.CRFChordRecognitionProcessor()
    
    feats = feat_processor(str(file_path))
    chords = recog_processor(feats)
    
    # Compute confidence from feature strength
    # feats is a 2D array: [time, chord_classes]
    fps = 10  # madmom's default frames per second
    
    # Format chords: convert :maj to empty, :min to m, and add confidence
    formatted_chords = []
    for idx, (start_time, end_time, chord_label) in enumerate(chords):
        # Calculate confidence from feature activations in this time segment
        start_frame = int(start_time * fps)
        end_frame = int(end_time * fps)
        
        confidence = 0.75  # Default confidence
        
        if start_frame < len(feats) and end_frame <= len(feats) and end_frame > start_frame:
            segment_feats = feats[start_frame:end_frame]
            if len(segment_feats) > 0:
                # Max activation in the segment indicates confidence
                max_activation = float(np.max(segment_feats))
                # Mean of top 20% activations for robustness
                flat = segment_feats.flatten()
                top_k = max(1, len(flat) // 5)  # Top 20%
                mean_top = float(np.mean(np.partition(flat, -top_k)[-top_k:]))
                
                # Combine both for confidence (0.65-0.95 range for better spread)
                confidence = 0.65 + (max_activation * 0.15) + (mean_top * 0.15)
                confidence = float(np.clip(confidence, 0.65, 0.95))
        
        # Lower confidence for N.C. (no chord) segments
        if chord_label == "N" or "X" in chord_label:
            confidence = min(confidence * 0.6, 0.55)
        
        if ":maj" in chord_label:
            chord_label = chord_label.replace(":maj", "")
        elif ":min" in chord_label:
            chord_label = chord_label.replace(":min", "m")
        
        formatted_chords.append((float(start_time), float(end_time), chord_label, float(confidence)))
    
    # Save to cache
    _save_to_cache(cache_file, formatted_chords)
    
    print(f"[madmom] Found {len(formatted_chords)} chord segments")
    return formatted_chords


def detect_key_madmom(file_path: Path) -> str:
    """
    Detect musical key using madmom's CNN approach.
    Returns: Key string like "C major" or "Am"
    """
    if not MADMOM_AVAILABLE:
        raise ImportError("madmom is not installed")
    
    # Check cache first
    file_hash = _get_file_hash(file_path)
    cache_file = KEY_CACHE_DIR / f"{file_hash}.txt"
    
    if cache_file.exists():
        return cache_file.read_text().strip()
    
    # Process with madmom
    print(f"[madmom] Detecting key for {file_path.name}...")
    try:
        key_processor = madmom.features.key.CNNKeyRecognitionProcessor()
        key_prediction = key_processor(str(file_path))
        key = madmom.features.key.key_prediction_to_label(key_prediction)
        
        # Save to cache
        cache_file.write_text(key)
        
        print(f"[madmom] Detected key: {key}")
        return key
    except Exception as e:
        print(f"[madmom] Key detection failed: {e}")
        return "C major"


def detect_tempo_madmom(file_path: Path) -> float:
    """
    Detect tempo (BPM) using madmom's RNN beat tracking.
    Returns: Tempo in BPM
    """
    if not MADMOM_AVAILABLE:
        raise ImportError("madmom is not installed")
    
    # Check cache first
    file_hash = _get_file_hash(file_path)
    cache_file = TEMPO_CACHE_DIR / f"{file_hash}.txt"
    
    if cache_file.exists():
        try:
            return float(cache_file.read_text().strip())
        except Exception:
            pass
    
    # Process with madmom
    print(f"[madmom] Detecting tempo for {file_path.name}...")
    try:
        beat_processor = madmom.features.beats.RNNBeatProcessor()
        beats = beat_processor(str(file_path))
        
        tempo_processor = madmom.features.tempo.TempoEstimationProcessor(fps=200)
        tempos = tempo_processor(beats)
        
        if len(tempos) > 0:
            tempo = float(tempos[0][0])
            
            # Adjust tempo to reasonable range (like DeChord does)
            while tempo < 70:
                tempo *= 2
            while tempo > 190:
                tempo /= 2
            
            tempo = round(tempo)
            
            # Save to cache
            cache_file.write_text(str(tempo))
            
            print(f"[madmom] Detected tempo: {tempo} BPM")
            return tempo
        else:
            return 120.0
    except Exception as e:
        print(f"[madmom] Tempo detection failed: {e}")
        return 120.0


def analyze_file_madmom(file_path: Path) -> Dict:
    """
    Full analysis using madmom: chords, key, and tempo.
    Much faster than librosa approach (~5-10 seconds vs minutes).
    
    Args:
        file_path: Path to audio file
        
    Returns:
        Dict with tempo, key, scale, meter, chords, and simpleChords
        
    Raises:
        ImportError: If madmom is not installed
    """
    if not MADMOM_AVAILABLE:
        raise ImportError("madmom is not installed - please use librosa engine instead")
    
    print(f"[madmom] Starting fast analysis for {file_path.name}")
    
    # Run all detections (uses caching internally)
    chords = detect_chords_madmom(file_path)
    key_str = detect_key_madmom(file_path)
    tempo = detect_tempo_madmom(file_path)
    
    # Parse key string (e.g., "C major" or "Am")
    if " " in key_str:
        key, scale = key_str.split(" ", 1)
    elif key_str.endswith("m"):
        key = key_str[:-1]
        scale = "minor"
    else:
        key = key_str
        scale = "major"
    
    # Convert chords to the format expected by frontend
    formatted_chords = []
    simple_chords = []
    
    for start, end, chord_label, confidence in chords:
        # Full chord
        formatted_chords.append({
            "start": start,
            "end": end,
            "chord": chord_label,
            "confidence": confidence
        })
        
        # Simple chord (strip extensions)
        simple_label = _simplify_chord(chord_label)
        simple_chords.append({
            "start": start,
            "end": end,
            "chord": simple_label,
            "confidence": confidence
        })
    
    # Merge consecutive identical chords
    formatted_chords = _merge_consecutive(formatted_chords)
    simple_chords = _merge_consecutive(simple_chords)
    
    result = {
        "tempo": tempo,
        "meter": 4,  # madmom doesn't detect meter, default to 4/4
        "key": key,
        "scale": scale,
        "chords": formatted_chords,
        "simpleChords": simple_chords,
    }
    
    print(f"[madmom] Analysis complete: {len(formatted_chords)} chords, {key} {scale}, {tempo} BPM")
    return result


def _simplify_chord(chord_label: str) -> str:
    """Simplify chord to just root + quality (maj/min/dim/aug)."""
    if chord_label == "N" or chord_label == "N.C.":
        return "N.C."
    
    # Extract root (handle sharps/flats)
    if len(chord_label) > 1 and chord_label[1] in ['#', 'b']:
        root = chord_label[:2]
        suffix = chord_label[2:]
    else:
        root = chord_label[0]
        suffix = chord_label[1:]
    
    # Determine quality
    if "dim" in suffix:
        return f"{root}dim"
    elif "aug" in suffix:
        return f"{root}aug"
    elif "m" in suffix and "maj" not in suffix:
        return f"{root}m"
    else:
        return root  # Major


def _merge_consecutive(chords: List[Dict]) -> List[Dict]:
    """Merge consecutive identical chords."""
    if not chords:
        return []
    
    merged = []
    current = chords[0].copy()
    current_group = [chords[0]]
    
    for i in range(1, len(chords)):
        if chords[i]["chord"] == current["chord"]:
            # Extend current chord
            current["end"] = chords[i]["end"]
            current_group.append(chords[i])
            # Use weighted average confidence based on duration
            total_duration = sum(c["end"] - c["start"] for c in current_group)
            if total_duration > 0:
                current["confidence"] = sum(
                    c["confidence"] * (c["end"] - c["start"]) / total_duration 
                    for c in current_group
                )
            else:
                current["confidence"] = max(c["confidence"] for c in current_group)
        else:
            # Save current and start new
            merged.append(current)
            current = chords[i].copy()
            current_group = [chords[i]]
    
    merged.append(current)
    return merged
