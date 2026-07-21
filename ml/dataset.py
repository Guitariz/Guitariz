"""
ml/dataset.py

PyTorch Dataset for chord recognition, expecting the standard MIREX/Isophonics
".lab" annotation format:

    <start_sec> <end_sec> <chord_label>
    0.000000 1.234000 N
    1.234000 3.500000 C:maj
    3.500000 5.100000 A:min
    ...

This is the format used by:
  - Isophonics Beatles/Queen/Zweieck annotations
  - McGill Billboard dataset (after their salami->lab conversion, widely
    available as companion .lab files)
  - JAWS (Jazz chord dataset)

Directory layout expected:
    dataset_root/
        audio/
            song1.wav
            song2.wav
        labels/
            song1.lab
            song2.lab

IMPORTANT LICENSING NOTE (read before training on any dataset):
  - Isophonics annotations are freely available for research; the AUDIO for
    Beatles/Queen/etc. is *not* freely redistributable and is typically
    copyrighted commercial recordings. You cannot ship those audio files or
    a model that memorizes/reproduces them commercially without checking the
    label vs. audio licensing separately. For a fully clean commercial
    pipeline prefer:
      - RWC Popular Music Database (research license, permits derived
        commercial tools in most interpretations, but re-verify current terms)
      - Datasets with explicit CC-BY/CC0 audio (e.g. some GiantSteps subsets)
      - Your own commissioned/played chord-progression recordings with
        auto-generated .lab labels (cheapest to guarantee 100% clean rights)
  - What you are 100% safe to redistribute either way: MODEL WEIGHTS trained
    on copyrighted audio, as long as the dataset's terms permit training
    (most research corpora do -- but re-check each one's current license
    page, since terms can change). The weights themselves are not a
    reproduction of the audio.
"""
from __future__ import annotations

import os
from pathlib import Path

import numpy as np
import torch
from torch.utils.data import Dataset

from .features import extract_cnn_input, frame_times, load_audio, SR, HOP_LENGTH
from .chord_vocab import LABEL_TO_IDX, NO_CHORD, NOTE_NAMES


def parse_lab_file(lab_path: Path) -> list[tuple[float, float, str]]:
    """Parse a .lab file into (start, end, label) tuples."""
    entries = []
    with open(lab_path) as f:
        for line in f:
            parts = line.strip().split()
            if len(parts) < 3:
                continue
            start, end, label = float(parts[0]), float(parts[1]), parts[2]
            entries.append((start, end, label))
    return entries


def normalize_label(raw_label: str) -> str:
    """
    Map a raw .lab chord string (which can include inversions, e.g. 'C:maj/3',
    extended qualities, or 'X' for unknown) down to our NUM_CLASSES vocabulary.
    Anything not confidently mappable collapses to N.C. -- better to under-predict
    than to inject label noise into training.
    """
    if raw_label in ("N", "X", "N.C."):
        return NO_CHORD
    # strip bass/inversion notation after '/'
    label = raw_label.split("/")[0]
    if ":" not in label:
        # bare root like "C" implies major triad in most .lab conventions
        label = f"{label}:maj"
    root, quality = label.split(":", 1)

    # normalize flat root spellings to sharps (our vocabulary is sharps-only)
    flat_to_sharp = {"Db": "C#", "Eb": "D#", "Gb": "F#", "Ab": "G#", "Bb": "A#", "Fb": "E", "Cb": "B"}
    root = flat_to_sharp.get(root, root)
    if root not in NOTE_NAMES:
        return NO_CHORD

    # collapse extended/rare qualities down to the nearest supported quality.
    # IMPORTANT: match on the FULL quality string via this explicit table, not
    # substring checks like `"m" in quality` -- that's a real bug seen in an
    # earlier draft of this normalizer: "maj9" contains the letter "m" (from
    # "maj"), so a naive substring check on "min"/"m" misclassifies every
    # extended major chord (maj7, maj9, maj11, maj13, maj7#11...) as minor.
    quality_map = {
        "maj": "maj", "": "maj", "1": "maj", "5": "maj",
        "maj6": "maj", "6": "maj", "add9": "maj", "6/9": "maj",
        "maj9": "maj7", "maj11": "maj7", "maj13": "maj7", "maj7#11": "maj7",
        "min": "min", "m": "min", "min6": "min", "m6": "min",
        "min9": "min7", "min11": "min7", "min13": "min7", "minadd9": "min",
        "7": "7", "dom7": "7", "9": "7", "11": "7", "13": "7", "7sus4": "sus4",
        "maj7": "maj7",
        "min7": "min7", "m7": "min7",
        "dim": "dim", "dim7": "dim", "hdim7": "dim", "m7b5": "dim",
        "aug": "aug", "aug7": "aug",
        "sus2": "sus2",
        "sus4": "sus4",
    }
    mapped_quality = quality_map.get(quality)
    if mapped_quality is None:
        return NO_CHORD  # genuinely unsupported/unrecognized quality -> drop to N.C.

    candidate = f"{root}:{mapped_quality}"
    if candidate not in LABEL_TO_IDX:
        return NO_CHORD
    return candidate


class ChordDataset(Dataset):
    """
    Yields (log_cqt_chunk, label_indices) pairs.
    Each item is a fixed-length chunk of `chunk_frames` frames, sliced from a
    song's full log-CQT, with the corresponding per-frame chord label indices.
    """

    def __init__(self, dataset_root: str, chunk_frames: int = 200, hop_chunks: int = 100):
        self.root = Path(dataset_root)
        self.audio_dir = self.root / "audio"
        self.label_dir = self.root / "labels"
        self.chunk_frames = chunk_frames
        self.hop_chunks = hop_chunks

        self.index: list[tuple[Path, Path]] = []
        for audio_file in sorted(self.audio_dir.glob("*.wav")):
            lab_file = self.label_dir / f"{audio_file.stem}.lab"
            if lab_file.exists():
                self.index.append((audio_file, lab_file))
            else:
                print(f"[warn] no label file for {audio_file.name}, skipping")

        if not self.index:
            raise RuntimeError(
                f"No (audio, label) pairs found under {dataset_root}. "
                f"Expected {dataset_root}/audio/*.wav and {dataset_root}/labels/*.lab"
            )

        # precompute chunk index: (song_idx, frame_offset)
        self.chunks: list[tuple[int, int]] = []
        self._song_cache: dict[int, tuple[np.ndarray, np.ndarray]] = {}
        for song_idx, (audio_file, lab_file) in enumerate(self.index):
            log_cqt, label_ids = self._compute_song(song_idx)
            n_frames = log_cqt.shape[1]
            for start in range(0, max(1, n_frames - chunk_frames), hop_chunks):
                self.chunks.append((song_idx, start))

    def _compute_song(self, song_idx: int) -> tuple[np.ndarray, np.ndarray]:
        if song_idx in self._song_cache:
            return self._song_cache[song_idx]
        audio_file, lab_file = self.index[song_idx]
        y, sr = load_audio(str(audio_file))
        log_cqt = extract_cnn_input(y, sr)  # (n_bins, n_frames)
        n_frames = log_cqt.shape[1]
        times = frame_times(n_frames, sr=sr, hop_length=HOP_LENGTH)

        entries = parse_lab_file(lab_file)
        label_ids = np.full(n_frames, LABEL_TO_IDX[NO_CHORD], dtype=np.int64)
        for start, end, raw_label in entries:
            mapped = normalize_label(raw_label)
            idx = LABEL_TO_IDX[mapped]
            mask = (times >= start) & (times < end)
            label_ids[mask] = idx

        self._song_cache[song_idx] = (log_cqt, label_ids)
        return log_cqt, label_ids

    def __len__(self) -> int:
        return len(self.chunks)

    def __getitem__(self, idx: int):
        song_idx, start = self.chunks[idx]
        log_cqt, label_ids = self._compute_song(song_idx)
        n_frames = log_cqt.shape[1]
        end = min(start + self.chunk_frames, n_frames)

        chunk = log_cqt[:, start:end]
        labels = label_ids[start:end]

        # pad if this is a short trailing chunk
        if chunk.shape[1] < self.chunk_frames:
            pad = self.chunk_frames - chunk.shape[1]
            chunk = np.pad(chunk, ((0, 0), (0, pad)), mode="constant")
            labels = np.pad(labels, (0, pad), mode="constant", constant_values=LABEL_TO_IDX[NO_CHORD])

        x = torch.from_numpy(chunk).unsqueeze(0).float()  # (1, n_bins, chunk_frames)
        y = torch.from_numpy(labels).long()                # (chunk_frames,)
        return x, y
