import gc
import hashlib

# Configure torch for CPU efficiency
import multiprocessing
import subprocess
import tempfile
from pathlib import Path

import librosa
import numpy as np
import soundfile as sf
import torch

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
            # Use overlap=0.1 and shifts=0 for maximum speed on CPU
            sources = apply_model(self.model, wav[None], shifts=0, overlap=0.1, progress=True)[0]
        
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
            # Use overlap=0.1 and shifts=0 for maximum speed on CPU
            sources = apply_model(self.model, wav[None], shifts=0, overlap=0.1, progress=True)[0]
        
        sources = sources * ref.std() + ref.mean()
        return sr, dict(zip(self.model.sources, sources))


def _get_separator_6stem():
    """Get or create the 6-stem separator instance."""
    global _DEMUCS_6STEM_WRAPPER
    if _DEMUCS_6STEM_WRAPPER is None:
        _DEMUCS_6STEM_WRAPPER = DemucsSeparator6Stem()
    return _DEMUCS_6STEM_WRAPPER


def separate_audio_stems(audio_path: Path) -> dict | None:
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
        raise

PITCH_CLASS_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
MAJOR_PROFILE = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
MINOR_PROFILE = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])

CHORD_TEMPLATES: list[tuple[str, np.ndarray]] = []
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
            v[(root + iv + 7) % 12] += 0.05
        v[root] += 0.2

        # Compensate for the natural harmonic-series bias toward major:
        # real instruments produce faint major-3rd overtones even when
        # playing a minor chord (harmonics 4:5:6 form a major triad),
        # so minor-quality templates get a small explicit boost on the
        # minor 3rd degree to offset that inherent physical skew.
        if "min" in name or name == "dim" or name == "m6":
            minor_third_pc = (root + 3) % 12
            v[minor_third_pc] += 0.10

        norm = np.linalg.norm(v)
        chord_name = f"{PITCH_CLASS_NAMES[root]}"
        if name != "maj":
            chord_name += f"{name}"
        CHORD_TEMPLATES.append((chord_name, v / (norm + 1e-9)))


def get_file_hash(file_path: Path) -> str:
    """Generate MD5 hash based on file content and size for robust caching."""
    hasher = hashlib.md5()
    try:
        stats = file_path.stat()
        hasher.update(str(stats.st_size).encode())
        with open(file_path, 'rb') as f:
            chunk = f.read(1024 * 1024)
            hasher.update(chunk)
            if stats.st_size > 2 * 1024 * 1024:
                f.seek(-1024 * 1024, 2)
                chunk = f.read(1024 * 1024)
                hasher.update(chunk)
        return hasher.hexdigest()
    except Exception as e:
        print(f"[Analysis] Hashing failed: {e}")
        return hashlib.md5(str(file_path.name).encode()).hexdigest()


def _ffmpeg_to_wav(src: Path, dst: Path):
    subprocess.run(
        ["ffmpeg", "-y", "-i", str(src), "-ac", "1", "-ar", "44100", str(dst)],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def _separate_vocals(audio_path: Path) -> Path | None:
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


def separate_audio_full(audio_path: Path) -> dict | None:
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


def _estimate_key(chroma: np.ndarray) -> tuple[str, str]:
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


# Scale degree (semitones above tonic) -> expected chord quality, for major keys
MAJOR_KEY_DIATONIC_QUALITY = {
    0: "maj",   # I
    2: "min",   # ii
    4: "min",   # iii
    5: "maj",   # IV
    7: "maj",   # V
    9: "min",   # vi
    11: "dim",  # vii°
}

# For minor keys (natural minor as the base assumption)
MINOR_KEY_DIATONIC_QUALITY = {
    0: "min",   # i
    2: "dim",   # ii°
    3: "maj",   # III
    5: "min",   # iv
    7: "min",   # v (often maj in harmonic minor — treated as soft bias, not hard rule)
    8: "maj",   # VI
    10: "maj",  # VII
}

def _diatonic_bias_multiplier(chord_name: str, key_root: str, scale: str) -> float:
    """Boost chord templates that match the expected quality for their
    scale degree in the song's detected key. This directly targets the
    common ii/vi-misdetected-as-major failure mode."""
    if chord_name == "N.C.":
        return 1.0

    if len(chord_name) > 1 and chord_name[1] == "#":
        root, suffix = chord_name[:2], chord_name[2:]
    else:
        root, suffix = chord_name[0], chord_name[1:]

    root_idx = PITCH_CLASS_NAMES.index(root)
    key_idx = PITCH_CLASS_NAMES.index(key_root)
    degree = (root_idx - key_idx) % 12

    table = MAJOR_KEY_DIATONIC_QUALITY if scale == "major" else MINOR_KEY_DIATONIC_QUALITY
    expected = table.get(degree)
    if expected is None:
        return 1.0  # non-diatonic degree, no opinion

    # Determine this template's actual quality bucket
    if suffix.startswith("min") or (suffix.startswith("m") and not suffix.startswith("maj")):
        actual = "min"
    elif suffix.startswith("dim"):
        actual = "dim"
    elif suffix.startswith("aug"):
        actual = "aug"
    else:
        actual = "maj"  # covers maj, 7, maj7, 6, sus2, sus4 — all "major-family" for this purpose

    if actual == expected:
        return 1.12  # modest boost — nudge, don't override real evidence
    return 1.0


def _segment_chords(
    chroma: np.ndarray,
    sr: int,
    beats: np.ndarray,
    hop_length: int,
    key: str = "C",
    scale: str = "major",
    beats_per_bar: int = 4,
) -> list[dict]:
    # Apply gentle median smoothing (don't over-process)
    from scipy.ndimage import median_filter
    chroma = median_filter(chroma, size=(1, 3))  # Reduced from 7 to 3

    # If we lack reliable beats, fall back to ~0.5s windows
    if beats is None or len(beats) < 2:
        step = max(1, librosa.time_to_frames(0.5, sr=sr, hop_length=hop_length))
        beats = np.arange(0, chroma.shape[1], step)

    segments: list[dict] = []
    prev_chord_idx = -1
    
    for i in range(len(beats) - 1):
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
                
            # Apply diatonic key bias using the already-computed song key
            for idx, (name, _) in enumerate(CHORD_TEMPLATES):
                scores[idx] *= _diatonic_bias_multiplier(name, key, scale)

            scores_arr = np.array(scores)
            best_idx = int(np.argmax(scores_arr))

            # Explicit near-tie resolution: if the top two candidates are within
            # 2% of each other, don't silently default to whichever template
            # happens to be earlier in the list — compare actual measured energy
            # at the major vs minor 3rd degree directly and let that decide.
            top2 = np.argsort(scores_arr)[-2:]
            if abs(scores_arr[top2[0]] - scores_arr[top2[1]]) < 0.02 * scores_arr[top2[1]]:
                name_a, name_b = CHORD_TEMPLATES[top2[0]][0], CHORD_TEMPLATES[top2[1]][0]
                root_a = name_a[0] + ("#" if len(name_a) > 1 and name_a[1] == "#" else "")
                # only intervene if it's genuinely a maj/min pair on the same root
                if name_b.startswith(root_a) and (
                    (name_a == root_a and "min" in name_b) or
                    (name_b == root_a and "min" in name_a)
                ):
                    root_idx = PITCH_CLASS_NAMES.index(root_a)
                    maj_third_energy = vec[(root_idx + 4) % 12]
                    min_third_energy = vec[(root_idx + 3) % 12]
                    best_idx = top2[1] if min_third_energy >= maj_third_energy else top2[0]

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
    """
    Simplifies complex chords to their basic triad form for the
    simpleChords view. Only maj / min / dim / aug survive — all
    7th/6th extensions and sus2/sus4 collapse to their nearest
    plain triad.
    """
    if chord_name == "N.C.":
        return "N.C."

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

    # Everything else — 7, maj7, 6, sus2, sus4, or bare major — collapses to plain major
    return root


def _smooth_chords(chords: list[dict], min_duration: float = 0.5) -> list[dict]:
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
    except Exception:
        return 4


def _merge_chords_to_bars(chords: list[dict], tempo: float, duration: float, beats_per_bar: int = 4) -> list[dict]:
    # Quantize chords so each bar has one representative chord, picked by overlap.
    if duration <= 0:
        return chords

    bar_len = (beats_per_bar * 60.0 / tempo) if tempo and tempo > 0 else 2.0
    bar_len = float(np.clip(bar_len, 0.5, 12.0))

    merged: list[dict] = []
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

def _apply_chroma_noise_floor(chroma: np.ndarray, floor_ratio: float = 0.15) -> np.ndarray:
    """Zero out chroma bins below floor_ratio of that frame's peak energy.
    Suppresses low-level bleed/leakage (e.g. a slightly-detuned root
    smearing into the adjacent major-7 bin) without touching real chord tones,
    which are always near-peak energy in a clean chroma frame."""
    peak = chroma.max(axis=0, keepdims=True)
    mask = chroma >= (floor_ratio * peak)
    return chroma * mask


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
    tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr, hop_length=hop_length)
    
    # Use Chroma CQT (works better than STFT for chords) with high bins_per_octave resolution (36)
    chroma = librosa.feature.chroma_cqt(y=y_harmonic, sr=sr, hop_length=hop_length, bins_per_octave=36)
    
    # Light normalization
    chroma = librosa.util.normalize(chroma, axis=0)
    chroma = _apply_chroma_noise_floor(chroma, floor_ratio=0.15)
    
    key, scale = _estimate_key(chroma)
    meter = _estimate_meter(y, sr, tempo)
    
    # If beat tracking returned nothing, create artificial beats
    if beat_frames is None or len(beat_frames) < 2:
        beat_frames = np.arange(0, chroma.shape[1], 22050 // (2 * hop_length))

    # Precise chords (passing key and scale for diatonic bias)
    chords = _segment_chords(chroma, sr, beat_frames, hop_length=hop_length, key=key, scale=scale, beats_per_bar=2)
    
    # Simple chords (larger windows or smoothed)
    simple_chords = []
    for c in chords:
        simple_chords.append({
            **c,
            "chord": _simplify_chord(c["chord"])
        })
    
    # Merge consecutive identical chords and smooth
    merged_precise = _smooth_chords(chords, min_duration=0.2)
    merged_simple = _smooth_chords(simple_chords, min_duration=0.8)

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


def _get_diatonic_quality(root_name: str, key: str, scale: str) -> str:
    """Returns 'maj', 'min', or 'dim' based on the root's diatonic role in the key.
    Added for backwards compatibility with chord_fast.py.
    """
    try:
        map_flats = {"Db": "C#", "Eb": "D#", "Gb": "F#", "Ab": "G#", "Bb": "A#"}
        root_std = map_flats.get(root_name, root_name)
        key_std = map_flats.get(key, key)
        
        if root_std not in PITCH_CLASS_NAMES or key_std not in PITCH_CLASS_NAMES:
            return "maj"
            
        root_pc = PITCH_CLASS_NAMES.index(root_std)
        key_pc = PITCH_CLASS_NAMES.index(key_std)
        
        interval = (root_pc - key_pc) % 12
        
        if scale == "minor":
            if interval == 0:
                return "min"
            elif interval == 2:
                return "dim"
            elif interval == 3:
                return "maj"
            elif interval == 5 or interval == 7:
                return "min"
            elif interval == 8 or interval == 10:
                return "maj"
        else: # major
            if interval == 0:
                return "maj"
            elif interval == 2 or interval == 4:
                return "min"
            elif interval == 5 or interval == 7:
                return "maj"
            elif interval == 9:
                return "min"
            elif interval == 11:
                return "dim"
            
        return "maj"
    except Exception:
        return "maj"
