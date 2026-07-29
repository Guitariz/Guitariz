import subprocess
import tempfile
from pathlib import Path
from typing import List, Tuple, Optional

import librosa
import numpy as np
import soundfile as sf
import scipy.ndimage
import torch
import gc

# Configure torch for CPU efficiency
import multiprocessing
num_cores = min(multiprocessing.cpu_count(), 4)
torch.set_num_threads(num_cores)

# Global model cache to avoid reloading from disk on every request
_DEMUCS_WRAPPER = None
_DEMUCS_6STEM_WRAPPER = None

# Stem types for 6-stem separation (htdemucs_6s model)
STEM_TYPES = ["vocals", "drums", "bass", "guitar", "piano", "other"]

class DemucsSeparator:
    def __init__(self, model_name="htdemucs"):
        from demucs.pretrained import get_model
        print(f"[Demucs] Loading model {model_name} into memory...")
        self.model = get_model(model_name)
        self.model.cpu()
        self.model.eval()
        self.samplerate = self.model.samplerate

    def separate_audio_file(self, path):
        from demucs.apply import apply_model
        
        # Load with librosa to bypass torchaudio backend issues on Windows
        # We process in chunks to stay within memory limits on CPU
        print(f"[Demucs] Loading audio {Path(path).name}...")
        y, sr = librosa.load(str(path), sr=self.samplerate, mono=False, duration=300) # Max 5 mins for web CPU
        
        if len(y.shape) == 1:
            wav = torch.from_numpy(y).unsqueeze(0)
        else:
            wav = torch.from_numpy(y)

        if wav.shape[0] > self.model.audio_channels:
             wav = wav[:self.model.audio_channels]
        elif wav.shape[0] < self.model.audio_channels:
             wav = wav.repeat(self.model.audio_channels, 1)

        # Standard demucs normalization 
        ref = wav.mean(0)
        wav = (wav - ref.mean()) / (ref.std() + 1e-8)
        
        print(f"[Demucs] Running inference on {wav.shape[1]/sr:.1f}s of audio (CPU)...")
        with torch.no_grad():
            # Use overlap=0.0 and shifts=0 for maximum speed on CPU
            sources = apply_model(self.model, wav[None], shifts=0, overlap=0.0, progress=True)[0]
        
        sources = sources * ref.std() + ref.mean()
        return sr, dict(zip(self.model.sources, sources))

def _get_separator():
    global _DEMUCS_WRAPPER
    if _DEMUCS_WRAPPER is None:
        _DEMUCS_WRAPPER = DemucsSeparator()
    return _DEMUCS_WRAPPER


class DemucsSeparator6Stem:
    """6-stem separator using htdemucs_6s model.
    
    Separates audio into: vocals, drums, bass, guitar, piano, other.
    """
    def __init__(self, model_name="htdemucs_6s"):
        from demucs.pretrained import get_model
        print(f"[Demucs 6-Stem] Loading model {model_name} into memory...")
        self.model = get_model(model_name)
        self.model.cpu()
        self.model.eval()
        self.samplerate = self.model.samplerate

    def separate_audio_file(self, path, max_duration=300):
        from demucs.apply import apply_model
        
        # Load with librosa to bypass torchaudio backend issues on Windows
        print(f"[Demucs 6-Stem] Loading audio {Path(path).name}...")
        y, sr = librosa.load(str(path), sr=self.samplerate, mono=False, duration=max_duration)
        
        if len(y.shape) == 1:
            wav = torch.from_numpy(y).unsqueeze(0)
        else:
            wav = torch.from_numpy(y)

        if wav.shape[0] > self.model.audio_channels:
             wav = wav[:self.model.audio_channels]
        elif wav.shape[0] < self.model.audio_channels:
             wav = wav.repeat(self.model.audio_channels, 1)

        # Standard demucs normalization 
        ref = wav.mean(0)
        wav = (wav - ref.mean()) / (ref.std() + 1e-8)
        
        print(f"[Demucs 6-Stem] Running inference on {wav.shape[1]/sr:.1f}s of audio (CPU)... This may take 5-10 minutes.")
        with torch.no_grad():
            # Use overlap=0.0 and shifts=0 for maximum speed on CPU
            sources = apply_model(self.model, wav[None], shifts=0, overlap=0.0, progress=True)[0]
        
        sources = sources * ref.std() + ref.mean()
        return sr, dict(zip(self.model.sources, sources))


def _get_separator_6stem():
    """Get or create the 6-stem separator instance."""
    global _DEMUCS_6STEM_WRAPPER
    if _DEMUCS_6STEM_WRAPPER is None:
        _DEMUCS_6STEM_WRAPPER = DemucsSeparator6Stem()
    return _DEMUCS_6STEM_WRAPPER


STEM_TYPES = ["vocals", "drums", "bass", "guitar", "piano", "other"]

def separate_audio_stems(audio_path: Path) -> Optional[dict]:
    """Separate audio into 6 stems: vocals, drums, bass, guitar, piano, other.
    
    Returns dict with stem names as keys and file paths as values.
    Example: {"vocals": Path(...), "drums": Path(...), ...}
    """
    try:
        wrapper = _get_separator_6stem()
        sr, sources = wrapper.separate_audio_file(audio_path)
        
        stem_paths = {}
        for stem_name in STEM_TYPES:
            if stem_name in sources:
                stem_audio = sources[stem_name].cpu().numpy().T
                stem_path = audio_path.parent / f"{audio_path.stem}_{stem_name}.wav"
                sf.write(str(stem_path), stem_audio, sr)
                stem_paths[stem_name] = stem_path
                print(f"[Demucs 6-Stem] Saved {stem_name} stem")
        
        print("[Demucs 6-Stem] Done. All 6 stems saved.")
        gc.collect()
        
        return stem_paths
        
    except Exception as e:
        print(f"6-stem audio separation failed: {e}")
        import traceback
        traceback.print_exc()
        raise e

PITCH_CLASS_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
MAJOR_PROFILE = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
MINOR_PROFILE = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])

CHORD_TEMPLATES: List[Tuple[str, int, np.ndarray]] = []
for root in range(12):
    for name, intervals in {
        "maj": [0, 4, 7],
        "min": [0, 3, 7],
        "7": [0, 4, 7, 10],
        "maj7": [0, 4, 7, 11],
        "min7": [0, 3, 7, 10],
        "sus2": [0, 2, 7],
        "sus4": [0, 5, 7],
        "dim": [0, 3, 6],
        "aug": [0, 4, 8],
    }.items():
        v = np.zeros(12)
        for iv in intervals:
            v[(root + iv) % 12] = 1.0
        # Slight root emphasis for disambiguation
        v[root] += 0.3
        norm = np.linalg.norm(v)
        chord_name = f"{PITCH_CLASS_NAMES[root]}"
        if name != "maj":
            chord_name += f"{name}"
        CHORD_TEMPLATES.append((chord_name, root, v / (norm + 1e-9)))


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
        wrapper = _get_separator()
        sr, sources = wrapper.separate_audio_file(audio_path)
        
        # Instrumental = drum + bass + other
        instrumental = sources["drums"] + sources["bass"] + sources["other"]
        
        # Convert to numpy for soundfile
        instrumental_np = instrumental.cpu().numpy().T
        
        output_path = audio_path.parent / f"{audio_path.stem}_instrumental.wav"
        sf.write(str(output_path), instrumental_np, sr)
        
        print("[Demucs] Done. Saved instrumental.")
        gc.collect()
        return output_path
        
    except Exception as e:
        print(f"Vocal separation failed: {e}")
        import traceback
        traceback.print_exc()
        return None


def separate_audio_full(audio_path: Path) -> Optional[dict]:
    """Separate audio into vocals and instrumental tracks. Returns paths to both."""
    try:
        wrapper = _get_separator()
        sr, sources = wrapper.separate_audio_file(audio_path)
        
        vocals = sources["vocals"].cpu().numpy().T
        instrumental = (sources["drums"] + sources["bass"] + sources["other"]).cpu().numpy().T
        
        vocals_path = audio_path.parent / f"{audio_path.stem}_vocals.wav"
        instrumental_path = audio_path.parent / f"{audio_path.stem}_instrumental.wav"
        
        sf.write(str(vocals_path), vocals, sr)
        sf.write(str(instrumental_path), instrumental, sr)
        
        print("[Demucs] Done. Stems saved.")
        gc.collect()
        
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


# Map quality names to their offset in the CHORD_TEMPLATES list (9 per root)
_QUALITY_OFFSET = {"maj": 0, "min": 1, "7": 2, "maj7": 3, "min7": 4, "sus2": 5, "sus4": 6, "dim": 7, "aug": 8}

# Diatonic chord degrees: (semitone interval from tonic, quality)
_MAJOR_DIATONIC = [
    (0, "maj"),   # I
    (2, "min"),   # ii
    (4, "min"),   # iii
    (5, "maj"),   # IV
    (7, "maj"),   # V
    (7, "7"),     # V7
    (9, "min"),   # vi
    (11, "dim"),  # vii°
]
_MINOR_DIATONIC = [
    (0, "min"),   # i
    (2, "dim"),   # ii°
    (3, "maj"),   # III
    (3, "aug"),   # III+ (augmented III, common in minor)
    (5, "min"),   # iv
    (7, "min"),   # v (natural)
    (7, "maj"),   # V (harmonic minor)
    (7, "7"),     # V7 (harmonic minor)
    (8, "maj"),   # VI
    (10, "maj"),  # VII
]


def _get_diatonic_indices(key: str, scale: str) -> List[int]:
    """Return CHORD_TEMPLATES indices for diatonic chords of the given key."""
    key_idx = PITCH_CLASS_NAMES.index(key) if key in PITCH_CLASS_NAMES else 0
    degrees = _MINOR_DIATONIC if scale == "minor" else _MAJOR_DIATONIC
    
    n_qualities = len(_QUALITY_OFFSET)
    indices = []
    for interval, quality in degrees:
        root = (key_idx + interval) % 12
        if quality in _QUALITY_OFFSET:
            idx = root * n_qualities + _QUALITY_OFFSET[quality]
            if idx < len(CHORD_TEMPLATES):
                indices.append(idx)
    return indices


def _segment_chords(
    chroma: np.ndarray,
    chroma_bass: np.ndarray,
    sr: int,
    beats: np.ndarray,
    hop_length: int,
    key: str = "C",
    scale: str = "major",
) -> List[dict]:
    # Get diatonic chord indices for key-aware bias
    diatonic_indices = _get_diatonic_indices(key, scale)

    # If we lack reliable beats, fall back to ~0.5s windows
    if beats is None or len(beats) < 2:
        step = max(1, librosa.time_to_frames(0.5, sr=sr, hop_length=hop_length))
        beats = np.arange(0, chroma.shape[1], step)

    segments: List[dict] = []
    
    def _detect_chord_in_range(s_frame: int, e_frame: int) -> dict:
        """Detect the best matching chord for a chroma segment."""
        cseg = chroma[:, s_frame:e_frame]
        # Median aggregation: robust to transient spikes (drum hits, vocal onsets)
        vec = np.median(cseg, axis=1)
        norm = np.linalg.norm(vec)
        
        # Higher threshold filters out percussive-only sections (drums, clicks)
        # where chroma picks up weak harmonic content from cymbals/snare resonance
        if norm < 0.15:
            return {
                "start": float(librosa.frames_to_time(s_frame, sr=sr, hop_length=hop_length)),
                "end": float(librosa.frames_to_time(e_frame, sr=sr, hop_length=hop_length)),
                "chord": "N.C.",
                "confidence": 0.0,
            }
        
        vec = vec / (norm + 1e-9)
        
        # Segment-specific bass vector
        cseg_bass = chroma_bass[:, s_frame:e_frame]
        bass_vec = np.median(cseg_bass, axis=1)
        bass_norm = np.linalg.norm(bass_vec)
        if bass_norm > 1e-9:
            bass_vec = bass_vec / bass_norm
        else:
            bass_vec = np.zeros(12)
        
        # Match against templates with bass root bias
        scores = []
        for name, root, tpl_vec in CHORD_TEMPLATES:
            # Base dot product score
            score = float(np.dot(vec, tpl_vec))
            
            # Bass bias: if the bass chroma shows energy at the root of this chord,
            # boost the score! Give up to 35% boost for matching the bass root.
            bass_boost = 1.0 + 0.35 * float(bass_vec[root])
            score *= bass_boost
            
            scores.append(score)
        
        # Diatonic bias: boost chords that belong to the detected key
        for d_idx in diatonic_indices:
            scores[d_idx] *= 1.35  # 35% boost for in-key chords
        
        best_idx = int(np.argmax(scores))
        chord = CHORD_TEMPLATES[best_idx][0]
        # Calculate confidence using the base template (without artificial boosts)
        conf = float(np.dot(vec, CHORD_TEMPLATES[best_idx][2]))
        
        # If the best template match is still weak, this segment has no clear chord
        # (e.g. drums-only, noise, vocal melisma). Mark as N.C.
        if conf < 0.35:
            return {
                "start": float(librosa.frames_to_time(s_frame, sr=sr, hop_length=hop_length)),
                "end": float(librosa.frames_to_time(e_frame, sr=sr, hop_length=hop_length)),
                "chord": "N.C.",
                "confidence": float(min(1.0, conf)),
            }
        
        return {
            "start": float(librosa.frames_to_time(s_frame, sr=sr, hop_length=hop_length)),
            "end": float(librosa.frames_to_time(e_frame, sr=sr, hop_length=hop_length)),
            "chord": chord,
            "confidence": float(min(1.0, conf)),
        }
    
    # Main segmentation loop
    for i in range(0, len(beats) - 1):
        s_frame = int(beats[i])
        e_frame = int(beats[i+1])
        if e_frame <= s_frame:
            continue
        segments.append(_detect_chord_in_range(s_frame, e_frame))
    
    # Trailing segment: capture audio after the last boundary
    if len(beats) > 0:
        last_frame = int(beats[-1])
        total_frames = chroma.shape[1]
        min_gap = max(2, int(0.05 * sr / hop_length))
        if last_frame < total_frames - min_gap:
            segments.append(_detect_chord_in_range(last_frame, total_frames))

    return segments


PITCH_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

def _get_diatonic_quality(root_name: str, key: str, scale: str) -> str:
    """Returns 'maj', 'min', or 'dim' based on the root's diatonic role in the key."""
    try:
        map_flats = {"Db": "C#", "Eb": "D#", "Gb": "F#", "Ab": "G#", "Bb": "A#"}
        root_std = map_flats.get(root_name, root_name)
        key_std = map_flats.get(key, key)
        
        if root_std not in PITCH_NAMES or key_std not in PITCH_NAMES:
            return "maj"
            
        root_pc = PITCH_NAMES.index(root_std)
        key_pc = PITCH_NAMES.index(key_std)
        
        interval = (root_pc - key_pc) % 12
        
        if scale == "minor":
            if interval == 0: return "min"
            elif interval == 2: return "dim"
            elif interval == 3: return "maj"
            elif interval == 5: return "min"
            elif interval == 7: return "min"
            elif interval == 8: return "maj"
            elif interval == 10: return "maj"
        else: # major
            if interval == 0: return "maj"
            elif interval == 2: return "min"
            elif interval == 4: return "min"
            elif interval == 5: return "maj"
            elif interval == 7: return "maj"
            elif interval == 9: return "min"
            elif interval == 11: return "dim"
            
        return "maj"
    except Exception:
        return "maj"


def _simplify_chord(chord_name: str, key: str = "C", scale: str = "major") -> str:
    """
    Simplifies complex chords (like 7ths, extensions) to basic triads (Major, Minor, Dim, Aug),
    resolving ambiguous/neutral qualities (like sus2/sus4) diatonically.
    """
    if chord_name == "N.C." or not chord_name:
        return "N.C."
    
    # Extract root (handle #)
    if len(chord_name) > 1 and chord_name[1] == "#":
        root = chord_name[:2]
        suffix = chord_name[2:]
    else:
        root = chord_name[0]
        suffix = chord_name[1:]
        
    if "dim" in suffix:
        return f"{root}dim"
    elif "aug" in suffix:
        return f"{root}aug"
    elif "min" in suffix or (suffix.startswith("m") and not suffix.startswith("maj")):
        return f"{root}min"
    elif "sus" in suffix or suffix == "" or suffix.isdigit():
        # Ambiguous chord or plain root - check diatonic quality of root in this key!
        quality = _get_diatonic_quality(root, key, scale)
        if quality == "min":
            return f"{root}min"
        elif quality == "dim":
            return f"{root}dim"
        else:
            return root
    else:
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
                if final:
                    final[-1]["end"] = curr["end"]
                else:
                    merged[i+1]["start"] = curr["start"]
                # Skip this one
            elif i == 0:
                # Merge into next
                merged[i+1]["start"] = curr["start"]
            elif i == len(merged) - 1:
                # Merge into previous
                if final:
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
    except Exception:
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
    separated_path = None
    
    # If vocal separation is requested, process the file first
    if separate_vocals:
        print("Separating vocals from instrumental...")
        separated_path = _separate_vocals(file_path)
        if separated_path:
            actual_path = separated_path
            print(f"Using separated instrumental track: {actual_path}")
        else:
            print("Vocal separation failed, using original audio")
    
    # Try loading directly first (librosa handles most formats including MP3)
    try:
        # Limit to 5 minutes for CPU safety
        print(f"[Analysis] Loading audio {actual_path.name} (max 300s)...")
        y, sr = librosa.load(str(actual_path), sr=22050, mono=True, duration=300)
    except Exception as e:
        # Fallback to ffmpeg only if direct load fails
        print(f"[Analysis] Librosa load failed, trying ffmpeg fallback: {e}")
        try:
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=True) as tmp_wav:
                # We need to use shutil to write to the temp file if we want to bypass subprocess sometimes,
                # but ffmpeg is still needed for this specific fallback.
                _ffmpeg_to_wav(actual_path, Path(tmp_wav.name))
                y, sr = librosa.load(tmp_wav.name, sr=22050, mono=True, duration=300)
        except Exception as e2:
            print(f"[Analysis] Critical failure: Could not load audio. {e2}")
            raise RuntimeError(f"Could not load audio file. (Error: {e2})")

    if y.size == 0:
        return {"tempo": 0, "key": "C", "scale": "major", "chords": []}

    hop_length = 512
    
    # Separate harmonic for better chord detection
    y_harmonic = librosa.effects.hpss(y)[0]
    tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr, hop_length=hop_length, tightness=200)
    
    # Use chroma_cqt for sharp harmonic resolution (better than chroma_cens for
    # chord recognition — CENS over-smooths and blurs chord change boundaries).
    # Apply a small median filter along the time axis to suppress transient noise
    # spikes (drum hits, vocal consonants) without blurring chord transitions.
    chroma_raw = librosa.feature.chroma_cqt(y=y_harmonic, sr=sr, hop_length=hop_length)
    chroma = scipy.ndimage.median_filter(chroma_raw, size=(1, 5))
    
    # Extract bass CQT (C1 to B3, ~32.70 Hz to ~246.94 Hz)
    # We use fmin=32.70 (C1) and 36 bins (3 octaves) to isolate the bass line.
    try:
        cqt_bass = np.abs(librosa.cqt(
            y=y_harmonic,
            sr=sr,
            hop_length=hop_length,
            fmin=32.70,
            n_bins=36,
            bins_per_octave=12
        ))
        # Wrap the 36 bins into 12 chroma bins (summing across octaves)
        chroma_bass_raw = np.zeros((12, cqt_bass.shape[1]))
        for i in range(3):
            chroma_bass_raw += cqt_bass[i*12:(i+1)*12, :]
        norms_bass = np.linalg.norm(chroma_bass_raw, axis=0, keepdims=True)
        chroma_bass = chroma_bass_raw / (norms_bass + 1e-9)
        chroma_bass = scipy.ndimage.median_filter(chroma_bass, size=(1, 5))
    except Exception as e:
        print(f"[Analysis] Bass CQT extraction failed, using standard chroma fallback: {e}")
        chroma_bass = chroma

    key, scale = _estimate_key(chroma)
    meter = _estimate_meter(y, sr, tempo)
    
    # Detect onsets (spectral flux peaks = potential harmonic change points)
    # backtrack=True rolls each onset back to the nearest energy minimum,
    # aligning boundaries more precisely with the actual chord start.
    onset_frames = librosa.onset.onset_detect(
        y=y, sr=sr, hop_length=hop_length,
        backtrack=True,
        units='frames'
    )
    
    # If beat tracking returned nothing, create artificial beats
    if beat_frames is None or len(beat_frames) < 2:
        beat_frames = np.arange(0, chroma.shape[1], 22050 // (2 * hop_length))
    
    # Filter onsets: only keep those where the chroma actually changes.
    # This prevents drum hits, vocal slides, and percussive transients
    # from creating false chord boundaries.
    harmonic_onsets = []
    for onset_f in onset_frames:
        onset_f = int(onset_f)
        # Compare chroma on either side of this onset (±3 frames ≈ ±70ms)
        look = 3
        left_start = max(0, onset_f - look)
        right_end = min(chroma.shape[1], onset_f + look)
        if left_start >= onset_f or onset_f >= right_end:
            continue
        
        left_vec = np.mean(chroma[:, left_start:onset_f], axis=1)
        right_vec = np.mean(chroma[:, onset_f:right_end], axis=1)
        
        left_norm = np.linalg.norm(left_vec)
        right_norm = np.linalg.norm(right_vec)
        if left_norm < 1e-9 or right_norm < 1e-9:
            harmonic_onsets.append(onset_f)  # Silence→sound transition = real change
            continue
        
        # Cosine distance: 0 = identical, 1 = completely different
        cosine_sim = np.dot(left_vec, right_vec) / (left_norm * right_norm)
        cosine_dist = 1.0 - cosine_sim
        
        # Only keep this onset if the harmonic content genuinely changed
        if cosine_dist > 0.25:
            harmonic_onsets.append(onset_f)
    
    # Hybrid segmentation: merge beat boundaries with FILTERED onset boundaries.
    # Beats provide rhythmic structure; filtered onsets catch sub-beat chord changes.
    all_boundaries = np.unique(np.concatenate([beat_frames, np.array(harmonic_onsets, dtype=int)]))
    all_boundaries.sort()
    
    # Remove boundaries that are too close together (< ~100ms)
    # to prevent micro-segments from transient noise
    min_gap = max(2, int(0.10 * sr / hop_length))
    filtered = [all_boundaries[0]]
    for b in all_boundaries[1:]:
        if b - filtered[-1] >= min_gap:
            filtered.append(b)
    all_boundaries = np.array(filtered)

    # Precise chords (with key-aware diatonic bias)
    chords = _segment_chords(chroma, chroma_bass, sr, all_boundaries, hop_length=hop_length, key=key, scale=scale)
    
    # Simple chords (larger windows or smoothed)
    simple_chords = []
    for c in chords:
        simple_chords.append({
            **c,
            "chord": _simplify_chord(c["chord"], key=key, scale=scale)
        })
    
    # Dynamically scale smoothing threshold based on tempo to prevent eating fast chords
    beat_dur = 60.0 / tempo if tempo > 0 else 0.5
    precise_min = float(np.clip(0.3 * beat_dur, 0.1, 0.25))
    simple_min = float(np.clip(0.4 * beat_dur, 0.15, 0.35))

    # Merge consecutive identical chords and smooth
    merged_precise = _smooth_chords(chords, min_duration=precise_min)
    merged_simple = _smooth_chords(simple_chords, min_duration=simple_min)

    result = {
        "tempo": float(round(float(tempo), 2)),
        "meter": meter,
        "key": key,
        "scale": scale,
        "chords": merged_precise,
        "simpleChords": merged_simple,
    }
    
    # Include separated track path if vocal separation was used
    if separated_path:
        result["instrumentalPath"] = str(separated_path)
    
    return result
