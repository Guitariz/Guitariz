import subprocess
import tempfile
import os
from pathlib import Path
from typing import List, Tuple, Optional

import librosa
import numpy as np
import soundfile as sf

PITCH_CLASS_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
MAJOR_PROFILE = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
MINOR_PROFILE = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])

CHORD_TEMPLATES: List[Tuple[str, np.ndarray]] = []
for root in range(12):
    for name, intervals in {
        "maj": [0, 4, 7],
        "min": [0, 3, 7],
        "7": [0, 4, 7, 10],
        "maj7": [0, 4, 7, 11],
        "min7": [0, 3, 7, 10],
        "dim": [0, 3, 6],
        "aug": [0, 4, 8],
        "sus2": [0, 2, 7],
        "sus4": [0, 5, 7],
        "6": [0, 4, 7, 9],
        "m6": [0, 3, 7, 9],
    }.items():
        v = np.zeros(12)
        for iv in intervals:
            v[(root + iv) % 12] = 1.0
            # Add harmonic overtones (octave and fifth)
            v[(root + iv + 12) % 12] += 0.1
            v[(root + iv + 7) % 12] += 0.05
        # Add slight weight to root
        v[root] += 0.2
        norm = np.linalg.norm(v)
        chord_name = f"{PITCH_CLASS_NAMES[root]}"
        if name != "maj":
            chord_name += f"{name}"
        CHORD_TEMPLATES.append((chord_name, v / (norm + 1e-9)))


def _ffmpeg_to_wav(src: Path, dst: Path):
    subprocess.run(
        ["ffmpeg", "-y", "-i", str(src), "-ac", "1", "-ar", "44100", str(dst)],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def _separate_vocals(audio_path: Path) -> Optional[Path]:
    """Separate vocals from music using Demucs. Returns path to instrumental track."""
    try:
        from demucs.pretrained import get_model
        from demucs.apply import apply_model
        import torch
        import gc
        
        # Load pre-trained Demucs model
        # Using htdemucs_ft for better quality if memory allows
        model = get_model("htdemucs")
        model.cpu() 
        model.eval()
        
        # Load audio
        wav, sr = librosa.load(audio_path, sr=44100, mono=False)
        if wav.ndim == 1:
            wav = np.stack([wav, wav])
        
        wav_tensor = torch.from_numpy(wav).float().unsqueeze(0)
        
        with torch.no_grad():
            sources = apply_model(model, wav_tensor, device="cpu", shifts=1, split=True)
        
        stems = sources[0]
        instrumental = stems[0] + stems[1] + stems[2]
        
        output_path = audio_path.parent / f"{audio_path.stem}_instrumental.wav"
        sf.write(output_path, instrumental.cpu().numpy().T, sr)
        
        # Free memory immediately
        del model
        del sources
        del stems
        del instrumental
        gc.collect()
        
        return output_path
        
    except Exception as e:
        print(f"Vocal separation failed: {e}")
        return None


def separate_audio_full(audio_path: Path) -> Optional[dict]:
    """Separate audio into vocals and instrumental tracks. Returns paths to both."""
    try:
        from demucs.pretrained import get_model
        from demucs.apply import apply_model
        import torch
        
        # Load pre-trained Demucs model
        model = get_model("htdemucs")
        model.cpu()
        model.eval()
        
        # Load audio
        wav, sr = librosa.load(audio_path, sr=44100, mono=False)
        if wav.ndim == 1:
            wav = np.stack([wav, wav])
        
        # Convert to torch tensor
        wav_tensor = torch.from_numpy(wav).float().unsqueeze(0)
        
        # Apply separation
        with torch.no_grad():
            sources = apply_model(model, wav_tensor, device="cpu", shifts=1, split=True)
        
        # Extract stems: [drums, bass, other, vocals]
        stems = sources[0]
        vocals = stems[3]
        instrumental = stems[0] + stems[1] + stems[2]
        
        # Save both tracks
        vocals_path = audio_path.parent / f"{audio_path.stem}_vocals.wav"
        instrumental_path = audio_path.parent / f"{audio_path.stem}_instrumental.wav"
        
        sf.write(vocals_path, vocals.cpu().numpy().T, sr)
        sf.write(instrumental_path, instrumental.cpu().numpy().T, sr)
        
        return {
            "vocals": vocals_path,
            "instrumental": instrumental_path,
        }
        
    except Exception as e:
        print(f"Full audio separation failed: {e}")
        import traceback
        traceback.print_exc()
        return None


def _estimate_key(chroma: np.ndarray) -> Tuple[str, str]:
    # Compute mean chroma across time
    chroma_mean = chroma.mean(axis=1)
    if chroma_mean.sum() == 0:
        return "C", "major"
    
    # Krumhansl-Schmuckler profiles (shifted)
    best_score = -1e9
    best = ("C", "major")
    
    for tonic in range(12):
        # Rotate profiles to match tonic
        # Shift profiles to tonic
        maj_profile_shifted = np.roll(MAJOR_PROFILE, tonic)
        min_profile_shifted = np.roll(MINOR_PROFILE, tonic)
        
        # Pearson correlation would be better but simple dot is okay on normalized chroma
        maj_score = np.dot(chroma_mean, maj_profile_shifted)
        if maj_score > best_score:
            best_score = maj_score
            best = (PITCH_CLASS_NAMES[tonic], "major")
            
        min_score = np.dot(chroma_mean, min_profile_shifted)
        if min_score > best_score:
            best_score = min_score
            best = (PITCH_CLASS_NAMES[tonic], "minor")
            
    return best


def _segment_chords(
    chroma: np.ndarray,
    sr: int,
    beats: np.ndarray,
    hop_length: int,
    beats_per_bar: int = 4,
) -> List[dict]:
    # Smooth chroma with a median filter to remove noise/transients
    chroma = librosa.util.median_filter(chroma, size=7, axis=1)

    # If we lack reliable beats, fall back to ~0.5s windows
    if beats is None or len(beats) < 2:
        step = max(1, librosa.time_to_frames(0.5, sr=sr, hop_length=hop_length))
        beats = np.arange(0, chroma.shape[1], step)

    segments: List[dict] = []
    prev_chord_idx = -1
    
    for i in range(0, len(beats) - 1):
        s_frame = int(beats[i])
        e_frame = int(beats[i+1])
        if e_frame <= s_frame:
            continue

        cseg = chroma[:, s_frame:e_frame]
        vec = cseg.mean(axis=1)
        norm = np.linalg.norm(vec)
        
        if norm < 0.05: # Threshold for silence/noise
            chord = "N.C."
            conf = 0.0
            best_idx = -1
        else:
            vec = vec / (norm + 1e-9)
            scores = [float(np.dot(vec, tpl[1])) for tpl in CHORD_TEMPLATES]
            
            # Apply persistence bias: if previous chord is still decent, keep it
            if prev_chord_idx != -1:
                scores[prev_chord_idx] *= 1.2 # 20% bias to stay
                
            best_idx = int(np.argmax(scores))
            chord, conf = CHORD_TEMPLATES[best_idx]
            # Get actual dot product for confidence
            conf = float(np.dot(vec, CHORD_TEMPLATES[best_idx][1]))

        segments.append(
            {
                "start": float(librosa.frames_to_time(s_frame, sr=sr, hop_length=hop_length)),
                "end": float(librosa.frames_to_time(e_frame, sr=sr, hop_length=hop_length)),
                "chord": chord,
                "confidence": float(min(1.0, conf)),
            }
        )
        prev_chord_idx = best_idx

    return segments


def _simplify_chord(chord_name: str) -> str:
    if chord_name == "N.C.":
        return "N.C."
    
    # Extract root (handle #)
    if len(chord_name) > 1 and chord_name[1] == "#":
        root = chord_name[:2]
        suffix = chord_name[2:]
    else:
        root = chord_name[0]
        suffix = chord_name[1:]
    
    if suffix.startswith("min") or (suffix.startswith("m") and not suffix.startswith("maj")):
        return f"{root}min"
    if suffix.startswith("dim"):
        return f"{root}dim"
    if suffix.startswith("aug"):
        return f"{root}aug"
    # Treat sus2, sus4, 7, maj7, 6 etc as major for "simple" view
    return root


def _smooth_chords(chords: List[dict], min_duration: float = 0.5) -> List[dict]:
    if not chords:
        return []
    
    # Initial merge of identical consecutive chords
    merged = []
    current = chords[0].copy()
    for i in range(1, len(chords)):
        if chords[i]["chord"] == current["chord"]:
            current["end"] = chords[i]["end"]
            current["confidence"] = max(current["confidence"], chords[i]["confidence"])
        else:
            merged.append(current)
            current = chords[i].copy()
    merged.append(current)
    
    # Filter out very short chords by merging them into neighbors
    if len(merged) < 2:
        return merged
        
    final = []
    i = 0
    while i < len(merged):
        curr = merged[i]
        dur = curr["end"] - curr["start"]
        
        if dur < min_duration:
            # Try to merge with neighbor
            if i > 0 and i < len(merged) - 1:
                # Merge with the one that has higher confidence or is longer?
                # For simplicity, merge with previous if it exists
                final[-1]["end"] = curr["end"]
                # Skip this one
            elif i == 0:
                # Merge into next
                merged[i+1]["start"] = curr["start"]
            elif i == len(merged) - 1:
                # Merge into previous
                final[-1]["end"] = curr["end"]
        else:
            final.append(curr)
        i += 1
        
    return final


def _estimate_meter(y: np.ndarray, sr: int, tempo: float) -> int:
    """Estimate if song is 4/4 or 3/4."""
    if tempo <= 0:
        return 4
    
    try:
        # Get onset envelope
        onset_env = librosa.onset.onset_strength(y=y, sr=sr)
        # Check autocorrelation at lags corresponding to 3 and 4 beats
        # One beat in frames:
        hop_length = 512
        beat_gap = (60.0 / tempo) * sr / hop_length
        
        # We check lag for 3 beats and 4 beats
        lags = [int(beat_gap * 3), int(beat_gap * 4)]
        ac = librosa.autocorrelate(onset_env, max_size=max(lags) + 2)
        
        score3 = ac[lags[0]] if lags[0] < len(ac) else 0
        score4 = ac[lags[1]] if lags[1] < len(ac) else 0
        
        if score3 > score4 * 1.1: # Significant bias to 3
            return 3
        return 4
    except:
        return 4


def _merge_chords_to_bars(chords: List[dict], tempo: float, duration: float, beats_per_bar: int = 4) -> List[dict]:
    # Quantize chords so each bar has one representative chord, picked by overlap.
    if duration <= 0:
        return chords

    bar_len = (beats_per_bar * 60.0 / tempo) if tempo and tempo > 0 else 2.0
    bar_len = float(np.clip(bar_len, 0.5, 12.0))

    merged: List[dict] = []
    t = 0.0
    chords_sorted = sorted(chords, key=lambda c: c.get("start", 0.0))

    while t < duration - 1e-6:
        window_end = min(duration, t + bar_len)
        best = None
        best_overlap = 0.0
        for ch in chords_sorted:
            overlap = max(0.0, min(window_end, ch.get("end", 0.0)) - max(t, ch.get("start", 0.0)))
            if overlap > best_overlap:
                best_overlap = overlap
                best = ch

        if best is None:
            best = {
                "chord": "N.C.",
                "confidence": 0.0,
            }

        merged.append(
            {
                "start": float(t),
                "end": float(window_end),
                "chord": best.get("chord", "N.C."),
                "confidence": float(best.get("confidence", 0.0)),
            }
        )
        t += bar_len

    return merged


def analyze_file(file_path: Path, separate_vocals: bool = False) -> dict:
    """Analyze audio file for chords, tempo, and key.
    
    Args:
        file_path: Path to audio file
        separate_vocals: If True, separate vocals from music before analysis (more accurate)
    """
    actual_path = file_path
    
    # If vocal separation is requested, process the file first
    if separate_vocals:
        print("Separating vocals from instrumental...")
        separated_path = _separate_vocals(file_path)
        if separated_path:
            actual_path = separated_path
            print(f"Using separated instrumental track: {actual_path}")
        else:
            print("Vocal separation failed, using original audio")
    
    # Try loading directly first (librosa + soundfile/audioread can handle many formats)
    try:
        y, sr = librosa.load(str(actual_path), sr=22050, mono=True)
    except Exception:
        # Fallback to ffmpeg only if direct load fails
        try:
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=True) as tmp_wav:
                _ffmpeg_to_wav(actual_path, Path(tmp_wav.name))
                y, sr = librosa.load(tmp_wav.name, sr=22050, mono=True)
        except Exception as e:
            raise RuntimeError(f"Could not load audio file. Please ensure it is a valid audio format. (Error: {e})")
    finally:
        # Cleanup separated file if it was created
        if separate_vocals and actual_path != file_path:
            try:
                actual_path.unlink(missing_ok=True)
            except Exception:
                pass

    if y.size == 0:
        return {"tempo": 0, "key": "C", "scale": "major", "chords": []}

    # Separate harmonic and percussive
    y_harmonic = librosa.effects.hpss(y)[0]

    hop_length = 512
    tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr, hop_length=hop_length)
    
    # Use Chroma CQT on harmonic signal
    chroma = librosa.feature.chroma_cqt(y=y_harmonic, sr=sr, hop_length=hop_length)
    
    # Smooth chroma across time to reduce noise
    chroma = librosa.util.normalize(chroma, axis=0) # Normalize each frame
    chroma = librosa.decompose.nnls(chroma, np.eye(12))[0] # Optional: reduce transients
    
    # Re-normalize after processing
    chroma = librosa.util.normalize(chroma, axis=0)

    key, scale = _estimate_key(chroma)
    meter = _estimate_meter(y, sr, tempo)
    
    # If beat tracking returned nothing, create artificial beats
    if beat_frames is None or len(beat_frames) < 2:
        # Roughly 2 segments per second
        beat_frames = np.arange(0, chroma.shape[1], 22050 // (2 * hop_length))

    # Precise chords (smaller windows)
    chords = _segment_chords(chroma, sr, beat_frames, hop_length=hop_length, beats_per_bar=2)
    
    # Simple chords (larger windows or smoothed)
    simple_chords_raw = []
    for c in chords:
        simple_chords_raw.append({
            **c,
            "chord": _simplify_chord(c["chord"])
        })
    
    # Merge consecutive identical chords and smooth
    merged_precise = _smooth_chords(chords, min_duration=0.2)
    merged_simple = _smooth_chords(simple_chords_raw, min_duration=0.8) # More aggressive smoothing for simple

    return {
        "tempo": float(round(float(tempo), 2)),
        "meter": meter,
        "key": key,
        "scale": scale,
        "chords": merged_precise,
        "simpleChords": merged_simple,
    }
