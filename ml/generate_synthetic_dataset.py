"""
ml/generate_synthetic_dataset.py

Procedurally generates a synthetic chord-progression dataset: 100%
commercially safe (you own every sample -- no copyrighted recordings, no
NC-licensed annotations), and useful as a bootstrap/pretraining set before
(or instead of) touching any third-party corpus.

Outputs directly into ml/dataset.py's expected layout:
    out_dir/audio/*.wav
    out_dir/labels/*.lab   ("<start> <end> <root:quality>" lines, matching
                             our chord_vocab.py naming convention exactly --
                             so no separate normalization step is needed for
                             this data, and it uses the SAME vocabulary
                             (9 qualities, colon-separated) as everything
                             else in ml/, not a separate incompatible one.)

Improves on a plain-sine-wave baseline (which trains a model that only
recognizes pure sine chords, and generalizes poorly to real instruments):
  - multiple simple timbres per note (varying harmonic content/decay)
  - randomized octave/voicing per chord instance
  - light additive noise
  - randomized chord durations and progression length

Usage:
    python -m ml.generate_synthetic_dataset --out synth_dataset --num_songs 60
"""
from __future__ import annotations

import argparse
import random
from pathlib import Path

import numpy as np
import soundfile as sf

from .chord_vocab import NOTE_NAMES, QUALITY_INTERVALS
from .features import SR

RNG = random.Random(0)
NP_RNG = np.random.default_rng(0)


def note_freq(pitch_class: int, octave: int) -> float:
    """pitch_class: 0=C, 1=C#, ... 11=B. octave 4 -> A4=440 reference."""
    semitones_from_a4 = (pitch_class - 9) + (octave - 4) * 12
    return 440.0 * (2 ** (semitones_from_a4 / 12))


def synth_chord(freqs: list[float], dur: float, sr: int, timbre: int, amp: float = 0.28) -> np.ndarray:
    t = np.linspace(0, dur, int(sr * dur), endpoint=False)
    wave = np.zeros_like(t)

    # a few crude but distinct timbres so the model doesn't overfit to one
    # spectral shape -- varying harmonic weights and a simple decay envelope
    harmonic_sets = [
        [(1, 1.0), (2, 0.3), (3, 0.15)],           # mellow, sine-ish
        [(1, 1.0), (2, 0.5), (3, 0.35), (4, 0.2)], # brighter, more overtones
        [(1, 1.0), (2, 0.1), (3, 0.4), (5, 0.15)], # hollow/odd-harmonic-heavy
    ]
    harmonics = harmonic_sets[timbre % len(harmonic_sets)]

    for f in freqs:
        for mult, w in harmonics:
            wave += w * np.sin(2 * np.pi * f * mult * t)
    wave = wave / len(freqs)

    # simple exponential decay envelope (plucked/struck-string-like, more
    # realistic than a flat sustain for guitar/piano-style training data)
    decay = np.exp(-1.2 * t / dur)
    attack_len = int(0.008 * sr)
    env = decay.copy()
    if attack_len > 0:
        env[:attack_len] *= np.linspace(0, 1, attack_len)

    wave = wave * env * amp
    wave += NP_RNG.normal(0, 0.003, len(wave))  # light noise -> more robust features
    return wave.astype(np.float32)


def generate_song(sr: int = SR, min_chords: int = 4, max_chords: int = 10) -> tuple[np.ndarray, list[tuple[float, float, str]]]:
    n_chords = RNG.randint(min_chords, max_chords)
    timbre = RNG.randint(0, 2)
    octave = RNG.choice([3, 4])

    audio_parts = []
    labels = []
    t_cursor = 0.0
    for _ in range(n_chords):
        root = RNG.randrange(12)
        quality = RNG.choice(list(QUALITY_INTERVALS.keys()))
        dur = RNG.choice([1.0, 1.5, 2.0, 2.5, 3.0])

        intervals = QUALITY_INTERVALS[quality]
        freqs = [note_freq((root + iv) % 12, octave + (1 if iv >= 12 else 0)) for iv in intervals]

        chunk = synth_chord(freqs, dur, sr, timbre)
        audio_parts.append(chunk)

        label = f"{NOTE_NAMES[root]}:{quality}"
        labels.append((t_cursor, t_cursor + dur, label))
        t_cursor += dur

    # occasionally insert a silent N.C. gap, so the model sees real silence too
    if RNG.random() < 0.3:
        gap_dur = RNG.choice([0.5, 1.0])
        audio_parts.append(np.zeros(int(sr * gap_dur), dtype=np.float32))
        labels.append((t_cursor, t_cursor + gap_dur, "N.C."))
        t_cursor += gap_dur

    audio = np.concatenate(audio_parts)
    peak = np.abs(audio).max()
    if peak > 0:
        audio = audio / peak * 0.9
    return audio, labels


def generate_dataset(out_dir: str, num_songs: int = 60, sr: int = SR):
    out = Path(out_dir)
    (out / "audio").mkdir(parents=True, exist_ok=True)
    (out / "labels").mkdir(parents=True, exist_ok=True)

    for i in range(num_songs):
        audio, labels = generate_song(sr=sr)
        sf.write(out / "audio" / f"synth_{i:04d}.wav", audio, sr)
        with open(out / "labels" / f"synth_{i:04d}.lab", "w") as f:
            for start, end, label in labels:
                f.write(f"{start:.3f} {end:.3f} {label}\n")

    print(f"Generated {num_songs} synthetic songs into {out_dir}/audio and {out_dir}/labels")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", type=str, default="synth_dataset")
    parser.add_argument("--num_songs", type=int, default=60)
    args = parser.parse_args()
    generate_dataset(args.out, args.num_songs)
