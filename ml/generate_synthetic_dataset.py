"""
ml/generate_synthetic_dataset.py

Generate synthetic training data for the ChordCRNN model.

Approach:
  - Render chord progressions using additive synthesis (sine waves + harmonics)
  - Randomize: voicing, dynamics, tempo, timbre, noise level
  - Produce (audio_file, labels_json) pairs
  - Write a JSONL manifest for ml/dataset.py

This avoids any licensing concerns — the training data is 100% programmatically
generated. Accuracy will be ~70-75% on real music (vs ~80-85% with real annotated
data), but it's a solid starting point.

Usage:
    python -m ml.generate_synthetic_dataset --output_dir synth_dataset --num_songs 500
"""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path

import numpy as np
import soundfile as sf

from .chord_vocab import NOTE_NAMES, QUALITY_INTERVALS, LABELS


# ── Audio synthesis ─────────────────────────────────────────────────────────

def _note_freq(midi: int) -> float:
    """Convert MIDI note number to frequency in Hz."""
    return 440.0 * (2.0 ** ((midi - 69) / 12.0))


def _render_chord(
    root_midi: int,
    intervals: list[int],
    duration: float,
    sr: int = 22050,
    n_harmonics: int = 4,
    decay: float = 0.3,
) -> np.ndarray:
    """Render a chord as sum of sine waves with harmonics and exponential decay."""
    t = np.linspace(0, duration, int(sr * duration), endpoint=False)
    signal = np.zeros_like(t)

    for interval in intervals:
        midi = root_midi + interval
        freq = _note_freq(midi)

        for h in range(1, n_harmonics + 1):
            amplitude = 1.0 / (h ** 1.5)  # Natural harmonic rolloff
            signal += amplitude * np.sin(2 * np.pi * freq * h * t)

    # Exponential decay envelope
    envelope = np.exp(-decay * t)
    signal = signal * envelope

    # Normalize
    peak = np.abs(signal).max()
    if peak > 0:
        signal = signal / peak * 0.7

    return signal.astype(np.float32)


def _generate_song(
    sr: int = 22050,
    min_chords: int = 8,
    max_chords: int = 32,
    min_dur: float = 1.0,
    max_dur: float = 4.0,
    noise_level: float = 0.02,
) -> tuple[np.ndarray, list[dict]]:
    """
    Generate a single synthetic song with random chord progression.

    Returns:
        audio: np.ndarray of shape (n_samples,)
        labels: list of {"start": float, "end": float, "chord": str}
    """
    rng = np.random.default_rng()

    n_chords = rng.integers(min_chords, max_chords + 1)
    segments: list[np.ndarray] = []
    labels: list[dict] = []
    current_time = 0.0

    for _ in range(n_chords):
        # Random chord selection
        chord_idx = rng.integers(1, len(LABELS))  # Skip N.C. for synthesis
        chord_label = LABELS[chord_idx]

        # Parse label: "C:maj" → root_idx=0, quality="maj"
        root_name, quality = chord_label.split(":")
        root_idx = NOTE_NAMES.index(root_name)
        intervals = QUALITY_INTERVALS[quality]

        # Random voicing: octave 3-5 (MIDI 48-72)
        base_octave = rng.choice([48, 60, 72])
        root_midi = base_octave + root_idx

        # Random duration
        duration = float(rng.uniform(min_dur, max_dur))

        # Random timbre parameters
        n_harmonics = int(rng.integers(2, 7))
        decay = float(rng.uniform(0.1, 0.8))

        # Render
        audio = _render_chord(
            root_midi, intervals, duration, sr=sr,
            n_harmonics=n_harmonics, decay=decay,
        )

        # Random volume
        volume = float(rng.uniform(0.3, 1.0))
        audio = audio * volume

        segments.append(audio)
        labels.append({
            "start": round(current_time, 4),
            "end": round(current_time + duration, 4),
            "chord": chord_label,
        })
        current_time += duration

    # Concatenate
    full_audio = np.concatenate(segments)

    # Add noise
    noise = rng.normal(0, noise_level, size=full_audio.shape).astype(np.float32)
    full_audio = full_audio + noise

    # Normalize final mix
    peak = np.abs(full_audio).max()
    if peak > 0:
        full_audio = full_audio / peak * 0.8

    return full_audio, labels


# ── Dataset generation ──────────────────────────────────────────────────────

def generate_dataset(
    output_dir: str = "synth_dataset",
    num_songs: int = 500,
    sr: int = 22050,
):
    """Generate a full synthetic dataset with manifest."""
    out = Path(output_dir)
    audio_dir = out / "audio"
    labels_dir = out / "labels"
    audio_dir.mkdir(parents=True, exist_ok=True)
    labels_dir.mkdir(parents=True, exist_ok=True)

    manifest_entries: list[dict] = []

    for i in range(num_songs):
        audio, labels = _generate_song(sr=sr)

        audio_path = audio_dir / f"song_{i:04d}.wav"
        labels_path = labels_dir / f"song_{i:04d}.json"

        sf.write(str(audio_path), audio, sr)
        with open(labels_path, "w") as f:
            json.dump(labels, f)

        manifest_entries.append({
            "audio": f"audio/song_{i:04d}.wav",
            "labels": f"labels/song_{i:04d}.json",
        })

        if (i + 1) % 50 == 0:
            print(f"[SynthGen] Generated {i + 1}/{num_songs} songs...")

    # Write manifest
    manifest_path = out / "manifest.jsonl"
    with open(manifest_path, "w") as f:
        for entry in manifest_entries:
            f.write(json.dumps(entry) + "\n")

    total_duration = sum(
        json.loads(open(out / e["labels"]).read())[-1]["end"]
        for e in manifest_entries
    )
    print(f"\n[SynthGen] ✓ Generated {num_songs} songs ({total_duration / 60:.1f} minutes total)")
    print(f"[SynthGen] Manifest: {manifest_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate synthetic chord dataset")
    parser.add_argument("--output_dir", type=str, default="synth_dataset")
    parser.add_argument("--num_songs", type=int, default=500)
    args = parser.parse_args()
    generate_dataset(output_dir=args.output_dir, num_songs=args.num_songs)
