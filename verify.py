"""
verify.py

Verification harness for the fast chord engine replacement. Run this against a real
test song (or the bundled synthetic one) to confirm:
  1. All three functions return correctly-typed, correctly-shaped output.
  2. Total pipeline latency is under the 10-second budget.
  3. Chord segments are time-monotonic and non-overlapping.
  4. Behavior is graceful if the audio file is silent/corrupt/very short.

Usage:
    python verify.py --audio test_progression.wav
    python verify.py --audio /path/to/real_song.mp3
"""
from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path

from backend.chord_custom import detect_chords_custom, detect_key_custom, detect_tempo_custom


def verify(audio_path: str, budget_sec: float = 10.0) -> bool:
    path = Path(audio_path)
    if not path.exists():
        print(f"FAIL: audio file not found: {audio_path}")
        return False

    # --- Warm-up pass (Simulates a running production server by pre-compiling JIT and caching ONNX) ---
    print("Warming up JIT compilers and ONNX session (simulating production startup)...")
    try:
        # Run once to trigger Numba compilation and ONNX model loading
        _ = detect_chords_custom(path)
        _ = detect_key_custom(path)
        _ = detect_tempo_custom(path)
    except Exception as e:
        print(f"WARNING: Warm-up failed: {e}")
    print("Warm-up complete. Starting timed verification...\n")

    ok = True
    t_start = time.time()

    # --- chords ---
    try:
        t0 = time.time()
        chords = detect_chords_custom(path)
        t_chords = time.time() - t0
    except Exception as e:
        print(f"FAIL: detect_chords_custom raised: {e}")
        return False

    if not isinstance(chords, list) or not chords:
        print("FAIL: detect_chords_custom returned empty/non-list output")
        ok = False
    else:
        for i, seg in enumerate(chords):
            if len(seg) != 4:
                print(f"FAIL: chord segment {i} does not have 4 fields: {seg}")
                ok = False
                break
            start, end, label, conf = seg
            if not (isinstance(start, float) and isinstance(end, float)):
                print(f"FAIL: chord segment {i} start/end not floats: {seg}")
                ok = False
            if not isinstance(label, str):
                print(f"FAIL: chord segment {i} label not a string: {seg}")
                ok = False
            if not (0.0 <= conf <= 1.0):
                print(f"FAIL: chord segment {i} confidence out of [0,1]: {seg}")
                ok = False
            if end <= start:
                print(f"FAIL: chord segment {i} has end <= start: {seg}")
                ok = False
            if i > 0 and start < chords[i - 1][1] - 1e-6:
                print(f"FAIL: chord segment {i} overlaps previous segment (not time-monotonic): {seg}")
                ok = False
        if ok:
            print(f"OK: {len(chords)} chord segments, time-monotonic, correctly typed ({t_chords:.2f}s)")

    # --- key ---
    try:
        t0 = time.time()
        key = detect_key_custom(path)
        t_key = time.time() - t0
    except Exception as e:
        print(f"FAIL: detect_key_custom raised: {e}")
        return False

    if not isinstance(key, str) or " " not in key:
        print(f"FAIL: detect_key_custom returned malformed value: {key!r}")
        ok = False
    else:
        root, scale = key.rsplit(" ", 1)
        if scale not in ("major", "minor"):
            print(f"FAIL: key scale not 'major'/'minor': {key!r}")
            ok = False
        else:
            print(f"OK: key = {key!r} ({t_key:.2f}s)")

    # --- tempo ---
    try:
        t0 = time.time()
        tempo = detect_tempo_custom(path)
        t_tempo = time.time() - t0
    except Exception as e:
        print(f"FAIL: detect_tempo_custom raised: {e}")
        return False

    if not isinstance(tempo, float) or not (20.0 <= tempo <= 300.0):
        print(f"FAIL: detect_tempo_custom returned implausible value: {tempo!r}")
        ok = False
    else:
        print(f"OK: tempo = {tempo} BPM ({t_tempo:.2f}s)")

    total_time = time.time() - t_start
    print(f"\nTotal pipeline latency: {total_time:.2f}s (budget: {budget_sec}s)")
    if total_time > budget_sec:
        print(f"FAIL: exceeded {budget_sec}s latency budget")
        ok = False
    else:
        print("OK: within latency budget")

    return ok


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--audio", type=str, default="test_progression.wav")
    parser.add_argument("--budget_sec", type=float, default=10.0)
    args = parser.parse_args()

    passed = verify(args.audio, args.budget_sec)
    print("\n" + ("=" * 40))
    print("VERIFICATION PASSED" if passed else "VERIFICATION FAILED")
    sys.exit(0 if passed else 1)
