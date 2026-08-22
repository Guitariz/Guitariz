"""
backend/analysis.py

Legacy/balanced mode chord analysis + Demucs vocal/stem separation.

Provides:
  - analyze_file(): Full librosa-based chord/key/tempo analysis (balanced mode)
  - separate_audio_full(): Demucs 4-stem separation (vocals, drums, bass, other)
  - separate_audio_stems(): Demucs 6-stem separation (+ guitar, piano)
  - _get_diatonic_quality(): Helper for key-aware chord simplification

All dependencies are commercially safe:
  - librosa (ISC), demucs (MIT), torch (BSD), numpy (BSD), scipy (BSD)
"""
from __future__ import annotations

import gc
import hashlib
import multiprocessing
import subprocess
import tempfile
from pathlib import Path

import librosa
import numpy as np
import soundfile as sf
import torch

# Configure torch for CPU efficiency
num_cores = min(multiprocessing.cpu_count(), 4)
torch.set_num_threads(num_cores)

# Global model cache to avoid reloading from disk on every request
_DEMUCS_WRAPPER = None
_DEMUCS_6STEM_WRAPPER = None

# Stem types for 6-stem separation (htdemucs_6s model)
STEM_TYPES = ["vocals", "drums", "bass", "guitar", "piano", "other"]

# ── Diatonic quality helper ─────────────────────────────────────────────────

NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

# Diatonic scale intervals for major and minor keys
MAJOR_SCALE_INTERVALS = [0, 2, 4, 5, 7, 9, 11]
MINOR_SCALE_INTERVALS = [0, 2, 3, 5, 7, 8, 10]

# Quality of each scale degree
MAJOR_SCALE_QUALITIES = ["maj", "min", "min", "maj", "maj", "min", "dim"]
MINOR_SCALE_QUALITIES = ["min", "dim", "maj", "min", "min", "maj", "maj"]


def _get_diatonic_quality(root: str, key: str, scale: str) -> str:
    """
    Return the expected quality (maj/min/dim) of a chord root within the given key.
    Used by chord_fast.py to resolve ambiguous simplified chords.
    """
    # Normalize enharmonics
    enharmonic = {
        "Db": "C#", "Eb": "D#", "Fb": "E", "Gb": "F#",
        "Ab": "G#", "Bb": "A#", "Cb": "B",
        "E#": "F", "B#": "C",
    }
    root = enharmonic.get(root, root)
    key = enharmonic.get(key, key)

    if root not in NOTE_NAMES or key not in NOTE_NAMES:
        return "maj"

    key_idx = NOTE_NAMES.index(key)
    root_idx = NOTE_NAMES.index(root)
    interval = (root_idx - key_idx) % 12

    if scale == "minor":
        intervals = MINOR_SCALE_INTERVALS
        qualities = MINOR_SCALE_QUALITIES
    else:
        intervals = MAJOR_SCALE_INTERVALS
        qualities = MAJOR_SCALE_QUALITIES

    if interval in intervals:
        degree = intervals.index(interval)
        return qualities[degree]

    return "maj"  # Default for non-diatonic roots


# ── Demucs vocal separation ────────────────────────────────────────────────

class DemucsSeparator:
    """Wraps a Demucs model for audio source separation."""

    def __init__(self, model_name: str = "htdemucs"):
        from demucs.pretrained import get_model
        print(f"[Demucs] Loading model {model_name} into memory...")
        self.model = get_model(model_name)
        self.model.cpu()
        self.model.eval()
        self.samplerate = self.model.samplerate

    def separate_audio_file(self, path: str | Path) -> dict[str, torch.Tensor]:
        """Separate audio into stems. Returns dict of stem_name → tensor."""
        from demucs.apply import apply_model

        print(f"[Demucs] Loading audio {Path(path).name}...")
        y, sr = librosa.load(str(path), sr=self.samplerate, mono=False, duration=300)

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

        print(f"[Demucs] Running inference on {wav.shape[1] / sr:.1f}s of audio (CPU)...")
        with torch.no_grad():
            sources = apply_model(self.model, wav[None], shifts=0, overlap=0.1, progress=True)[0]

        return {
            name: sources[i]
            for i, name in enumerate(self.model.sources)
        }


def _get_separator() -> DemucsSeparator:
    """Get or create the 4-stem Demucs separator."""
    global _DEMUCS_WRAPPER
    if _DEMUCS_WRAPPER is None:
        _DEMUCS_WRAPPER = DemucsSeparator("htdemucs")
    return _DEMUCS_WRAPPER


def _get_separator_6stem() -> DemucsSeparator:
    """Get or create the 6-stem Demucs separator."""
    global _DEMUCS_6STEM_WRAPPER
    if _DEMUCS_6STEM_WRAPPER is None:
        _DEMUCS_6STEM_WRAPPER = DemucsSeparator("htdemucs_6s")
    return _DEMUCS_6STEM_WRAPPER


def separate_audio_full(file_path: Path) -> dict | None:
    """
    Separate audio into vocals + instrumental (everything except vocals).
    Returns dict with 'vocals' and 'instrumental' temp file paths.
    """
    try:
        separator = _get_separator()
        stems = separator.separate_audio_file(file_path)

        result = {}
        sr = separator.samplerate

        # Sum all non-vocal stems for instrumental
        instrumental = None
        for name, tensor in stems.items():
            audio_np = tensor.cpu().numpy()
            if audio_np.ndim > 1:
                audio_np = audio_np.mean(axis=0)

            if name == "vocals":
                tmp = tempfile.NamedTemporaryFile(delete=False, suffix="_vocals.wav")
                sf.write(tmp.name, audio_np, sr)
                result["vocals"] = tmp.name
            else:
                if instrumental is None:
                    instrumental = audio_np
                else:
                    instrumental = instrumental + audio_np

        if instrumental is not None:
            tmp = tempfile.NamedTemporaryFile(delete=False, suffix="_instrumental.wav")
            sf.write(tmp.name, instrumental, sr)
            result["instrumental"] = tmp.name

        gc.collect()
        return result
    except Exception as e:
        print(f"[Demucs] Separation failed: {e}")
        return None


def separate_audio_stems(file_path: Path) -> dict | None:
    """
    6-stem separation: vocals, drums, bass, guitar, piano, other.
    Returns dict of stem_name → temp file path.
    """
    try:
        separator = _get_separator_6stem()
        stems = separator.separate_audio_file(file_path)

        result = {}
        sr = separator.samplerate

        for name, tensor in stems.items():
            audio_np = tensor.cpu().numpy()
            if audio_np.ndim > 1:
                audio_np = audio_np.mean(axis=0)
            tmp = tempfile.NamedTemporaryFile(delete=False, suffix=f"_{name}.wav")
            sf.write(tmp.name, audio_np, sr)
            result[name] = tmp.name

        gc.collect()
        return result
    except Exception as e:
        print(f"[Demucs] 6-stem separation failed: {e}")
        return None


# ── Balanced mode analysis ─────────────────────────────────────────────────

def analyze_file(
    file_path: Path,
    separate_vocals: bool = False,
) -> dict:
    """
    High-precision DSP chord analysis (balanced mode).

    Features:
      - Center-channel vocal attenuation (reduces vocals without Demucs)
      - HPSS harmonic isolation (extracts stationary chords from transients/drums)
      - Dynamic RMS silence gating (no random chord guesses during silence/pauses)
      - Ergodic HMM Viterbi smoothing for musical timing
      - Zero ONNX dependency

    Returns dict with: tempo, meter, key, scale, chords, simpleChords,
    and optionally instrumentalPath.
    """
    from ml.chord_templates import detect_chords_template
    from ml.dsp_tempo_key import detect_key_dsp, detect_tempo_dsp

    analysis_path = file_path
    instrumental_path = None

    # Optional heavy Demucs vocal separation (if explicitly toggled)
    if separate_vocals:
        separated = separate_audio_full(file_path)
        if separated and separated.get("instrumental"):
            analysis_path = Path(separated["instrumental"])
            instrumental_path = separated["instrumental"]

    # 1. Detect Key & Scale using Krumhansl-Schmuckler profiles
    key_str = detect_key_dsp(str(analysis_path))
    parts = key_str.split()
    key = parts[0] if parts else "C"
    scale = parts[1] if len(parts) > 1 else "major"

    # 2. Detect Tempo using autocorrelation
    tempo = float(detect_tempo_dsp(str(analysis_path)))

    # 3. Detect chords using high-precision DSP engine with vocal attenuation and diatonic key prior
    raw_segments = detect_chords_template(
        analysis_path,
        use_vocal_suppression=True,
        detected_key=f"{key} {scale}",
        min_duration_ms=400.0,
        self_transition_prob=0.96,
        tempo_bpm=tempo,
    )

    chords: list[dict] = []
    simple_chords: list[dict] = []

    for start, end, chord_label, conf in raw_segments:
        # Convert internal format (e.g., 'C:maj', 'A:min', 'G:7') to display format
        if chord_label == "N.C.":
            cleaned = "N.C."
        elif ":" in chord_label:
            root, qual = chord_label.split(":", 1)
            if qual == "maj":
                cleaned = root
            elif qual == "min":
                cleaned = f"{root}min"
            else:
                cleaned = f"{root}{qual}"
        else:
            cleaned = chord_label

        chords.append({
            "start": round(start, 3),
            "end": round(end, 3),
            "chord": cleaned,
            "confidence": round(conf, 3),
        })

        simplified = _simplify_chord(cleaned, key, scale)
        simple_chords.append({
            "start": round(start, 3),
            "end": round(end, 3),
            "chord": simplified,
            "confidence": round(conf, 3),
        })

    result = {
        "tempo": round(tempo, 1),
        "meter": 4,
        "key": key,
        "scale": scale,
        "chords": chords,
        "simpleChords": simple_chords,
    }

    if instrumental_path:
        result["instrumentalPath"] = instrumental_path

    return result


def _simplify_chord(chord: str, key: str, scale: str) -> str:
    """Simplify a chord label to root + basic triad quality."""
    if chord == "N.C." or not chord:
        return "N.C."

    # Strip slash chords (e.g., G/B -> G)
    base = chord.split("/")[0] if "/" in chord else chord

    if len(base) > 1 and base[1] in "#b":
        root = base[:2]
        quality = base[2:]
    else:
        root = base[0]
        quality = base[1:]

    quality_lower = quality.lower()

    if "dim" in quality_lower:
        return f"{root}dim"
    elif "aug" in quality_lower:
        return f"{root}aug"
    elif "maj" in quality_lower:
        # maj, maj7, maj9, etc. -> Major triad (just root)
        return root
    elif quality_lower.startswith("min") or quality_lower.startswith("m") or "min" in quality_lower:
        # min, min7, m7, etc. -> Minor triad
        return f"{root}min"
    elif quality_lower in ("", "7", "9", "11", "13", "6", "sus2", "sus4", "add9"):
        return root
    else:
        return root
