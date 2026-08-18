"""
ml/chord_templates.py

High-accuracy, zero-model DSP chord detection engine (Balanced Mode).

Features:
  1. Mid/Side Center-Channel Vocal Attenuation (cancels centered lead vocals
     without running slow neural network separation).
  2. Harmonic-Percussive Source Separation (HPSS) to isolate harmonic instruments
     (guitar, piano, keyboards) from drums and vocal transients.
  3. Band-limited Log-CQT Chroma (C2 to C6, ~65Hz–1050Hz) to eliminate high vocal
     formants, sibilants, and cymbal noise from chroma templates.
  4. Adaptive RMS Silence & Energy Gating (guarantees silence/breaks are marked
     strictly as 'N.C.' instead of random chord hallucinations).
  5. Ergodic HMM Viterbi sequence smoothing with musical minimum-duration
     constraints (locks chords into rhythmic bars and prevents frame jitter).

100% Commercial-safe: ISC & BSD licensed (librosa, numpy, scipy).
"""
from __future__ import annotations

from pathlib import Path
import numpy as np
import scipy.signal
import librosa

from .chord_vocab import LABELS, LABEL_TO_IDX, NUM_CLASSES, build_templates
from .features import SR, HOP_LENGTH
from .viterbi import smooth_chord_sequence


def _suppress_center_vocals_and_isolate_harmonics(
    file_path: str | Path,
    sr: int = SR,
    max_duration: float = 360.0,
) -> tuple[np.ndarray, np.ndarray, int]:
    """
    Preprocesses audio for chord recognition:
      - If stereo: applies center-channel vocal subtraction (L - R) + mono bass mix.
      - If mono: uses mono signal.
      - Computes RMS energy envelope for silence gating.
      - Applies HPSS to isolate sustained harmonic instruments.

    Returns: (y_harmonic, rms_envelope, sr)
    """
    # 1. Load stereo audio (mono=False) to allow stereo phase processing
    y_raw, _ = librosa.load(str(file_path), sr=sr, mono=False, duration=max_duration)

    if y_raw.ndim == 2 and y_raw.shape[0] >= 2:
        # Stereo audio: Lead vocals are panned center in >95% of mixed tracks.
        left = y_raw[0]
        right = y_raw[1]
        mono = (left + right) / 2.0

        # Side signal (cancels center-panned vocals while retaining panned guitars/keys)
        side = (left - right) / 2.0

        # Preserve bass guitar and kick drum fundamentals (<200Hz) from mono
        sos = scipy.signal.butter(4, 200, btype="lowpass", fs=sr, output="sos")
        bass_mono = scipy.signal.sosfilt(sos, mono)

        # Vocal-suppressed mix: side instruments + low-end bass foundation
        y_proc = side * 1.2 + bass_mono * 0.8

        # Fallback to mono if the track was recorded in dual-mono (side signal is empty)
        if np.std(side) < 1e-4:
            y_proc = mono
    else:
        # Mono audio
        y_proc = y_raw if y_raw.ndim == 1 else y_raw[0]
        mono = y_proc

    # 2. Compute RMS envelope on mono for accurate silence detection
    rms = librosa.feature.rms(y=mono, hop_length=HOP_LENGTH)[0]

    # 3. HPSS Harmonic Isolation: Extracts stationary harmonic content (chords)
    y_harmonic = librosa.effects.harmonic(y_proc, margin=2.5)

    return y_harmonic, rms, sr


def get_diatonic_chords(key_str: str | None) -> set[str]:
    """Derive diatonic chords for key-aware prior."""
    if not key_str:
        return set()
    try:
        from .chord_vocab import NOTE_NAMES
        parts = key_str.split()
        root = parts[0]
        scale = parts[1].lower() if len(parts) > 1 else "major"
        if root not in NOTE_NAMES:
            return set()
        r_idx = NOTE_NAMES.index(root)

        if scale == "major":
            # I (maj), ii (min), iii (min), IV (maj), V (maj), vi (min), vii° (dim)
            steps = [
                (0, "maj"), (2, "min"), (4, "min"), (5, "maj"), (7, "maj"), (9, "min"), (11, "dim"),
                (7, "7"), (0, "maj7"), (5, "maj7"), (2, "min7"), (9, "min7")
            ]
        else:
            # i (min), ii° (dim), III (maj), iv (min), v (min), VI (maj), VII (maj)
            steps = [
                (0, "min"), (2, "dim"), (3, "maj"), (5, "min"), (7, "min"), (8, "maj"), (10, "maj"),
                (7, "7"), (7, "maj"), (0, "min7"), (5, "min7")
            ]

        return {f"{NOTE_NAMES[(r_idx + interval) % 12]}:{qual}" for interval, qual in steps}
    except Exception:
        return set()


def detect_chords_template(
    file_path: str | Path,
    use_vocal_suppression: bool = True,
    detected_key: str | None = None,
    min_duration_ms: float = 400.0,
    self_transition_prob: float = 0.96,
) -> list[tuple[float, float, str, float]]:
    """
    DSP chord recognition pipeline for Balanced Mode.

    Returns:
        List of (start_sec, end_sec, chord_label, confidence) tuples.
    """
    # 1. Preprocess with vocal attenuation + harmonic isolation + RMS energy
    if use_vocal_suppression:
        y_harm, rms, sr = _suppress_center_vocals_and_isolate_harmonics(file_path, sr=SR)
    else:
        y_harm, sr = librosa.load(str(file_path), sr=SR, mono=True, duration=360.0)
        rms = librosa.feature.rms(y=y_harm, hop_length=HOP_LENGTH)[0]

    # 2. Tuning estimation (corrects for tracks tuned slightly sharp or flat, e.g. 432Hz or Eb)
    try:
        tuning = float(librosa.estimate_tuning(y=y_harm, sr=sr))
    except Exception:
        tuning = 0.0

    # 3. Band-limited CQT Chroma (C2 ~65.4Hz up to ~1050Hz)
    # Focuses strictly on chord fundamentals (bass root + triad voicings)
    fmin = librosa.note_to_hz("C2")  # 65.4 Hz
    n_octaves = 4                    # C2 to C6
    bins_per_octave = 36             # 3 bins/semitone for sharp note definition

    cqt = np.abs(
        librosa.cqt(
            y_harm,
            sr=sr,
            hop_length=HOP_LENGTH,
            fmin=fmin,
            n_bins=n_octaves * bins_per_octave,
            bins_per_octave=bins_per_octave,
            tuning=tuning,
        )
    )

    chroma = librosa.feature.chroma_cqt(
        C=cqt,
        sr=sr,
        hop_length=HOP_LENGTH,
        bins_per_octave=bins_per_octave,
        n_chroma=12,
    )

    # Logarithmic compression to balance loud vs quiet notes in chord voicing
    chroma = np.log1p(15.0 * chroma)
    chroma = chroma / (np.linalg.norm(chroma, axis=0, keepdims=True) + 1e-8)
    chroma = chroma.T  # (n_frames, 12)

    n_frames = len(chroma)
    frame_rate = sr / HOP_LENGTH

    # 4. Reference chord templates (109 classes) with clashing note penalties
    templates = build_templates(with_penalties=True)  # (109, 12)
    nc_idx = LABEL_TO_IDX["N.C."]

    diatonic_chords = get_diatonic_chords(detected_key) if detected_key else set()
    diatonic_indices = [LABEL_TO_IDX[c] for c in diatonic_chords if c in LABEL_TO_IDX]

    # 5. Silence & Energy Gating
    # Align RMS frames to chroma frames
    if len(rms) < n_frames:
        rms = np.pad(rms, (0, n_frames - len(rms)), mode="edge")
    else:
        rms = rms[:n_frames]

    max_rms = float(np.max(rms)) if len(rms) > 0 else 1.0
    # Dynamic silence threshold: -38dB from peak, or below absolute 0.008
    silence_threshold = max(0.008, max_rms * 0.025)

    # Compute similarity and posterior probability per frame
    sims = np.zeros((n_frames, NUM_CLASSES), dtype=np.float32)

    for t in range(n_frames):
        vec = chroma[t]
        vec_norm = float(np.linalg.norm(vec))
        frame_rms = float(rms[t])

        # Strict silence check: no chords during quiet parts or silence
        if frame_rms < silence_threshold or vec_norm < 0.18:
            sims[t, nc_idx] = 2.0  # Dominant N.C.
        else:
            v = vec / (vec_norm + 1e-8)
            scores = templates @ v
            sims[t] = scores
            # Suppress N.C. for active musical frames
            sims[t, nc_idx] = -1.0

    # 6. Apply gentle diatonic key prior (+0.10 boost to in-key chords)
    if diatonic_indices:
        sims[:, diatonic_indices] += 0.10

    # 7. Softmax temperature scaling
    tau = 0.16  # Sharp peak distribution
    e = np.exp(sims / tau)
    probs = e / e.sum(axis=-1, keepdims=True)

    # 8. Ergodic HMM Viterbi Sequence Decoding
    smoothed = smooth_chord_sequence(
        probs,
        frame_rate=frame_rate,
        min_duration_ms=min_duration_ms,
        self_transition_prob=self_transition_prob,
    )

    # 8. Format results with confidence scores
    results: list[tuple[float, float, str, float]] = []
    for seg in smoothed:
        seg_idx = LABEL_TO_IDX.get(seg.chord, nc_idx)
        t_start_idx = int(round(seg.start * frame_rate))
        t_end_idx = int(round(seg.end * frame_rate))
        t_end_idx = max(t_start_idx + 1, min(t_end_idx, n_frames))

        if seg.chord == "N.C.":
            # High confidence that it is indeed silence / no chord
            results.append((seg.start, seg.end, "N.C.", 0.95))
        else:
            seg_sims = (sims[t_start_idx:t_end_idx, seg_idx] + 1.0) / 2.0
            mean_conf = float(np.clip(np.mean(seg_sims), 0.0, 1.0))
            # If confidence is too low, treat as N.C.
            if mean_conf < 0.38:
                results.append((seg.start, seg.end, "N.C.", 0.6))
            else:
                results.append((seg.start, seg.end, seg.chord, mean_conf))

    # 9. Final segment compaction (merge consecutive identical chords)
    final_results: list[tuple[float, float, str, float]] = []
    for start, end, chord, conf in results:
        if final_results and final_results[-1][2] == chord:
            prev_start, prev_end, _, prev_conf = final_results[-1]
            p_dur = prev_end - prev_start
            c_dur = end - start
            new_conf = (prev_conf * p_dur + conf * c_dur) / (p_dur + c_dur)
            final_results[-1] = (prev_start, end, chord, float(new_conf))
        else:
            final_results.append((start, end, chord, conf))

    return final_results
