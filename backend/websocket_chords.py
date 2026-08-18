"""
backend/websocket_chords.py

WebSocket endpoint for real-time microphone chord detection.

The client sends raw PCM audio chunks over the WebSocket, and the server
responds with the detected chord label + confidence for each chunk.

Uses the DSP template-matching approach (no ONNX model needed) for low latency.
"""
from __future__ import annotations

import json
import struct

import numpy as np
from fastapi import WebSocket, WebSocketDisconnect

from ml.chord_vocab import LABELS, LABEL_TO_IDX, build_templates
from ml.features import SR, N_CHROMA


def _detect_chord_from_pcm(
    pcm_data: bytes,
    sample_rate: int = 44100,
    templates: np.ndarray | None = None,
) -> dict:
    """
    Detect a single chord from a raw PCM audio chunk.

    Args:
        pcm_data: Raw PCM bytes (float32, mono)
        sample_rate: Sample rate of the incoming audio
        templates: Pre-computed chord templates (109, 12)

    Returns:
        dict with 'chord', 'confidence', 'pitchClasses'
    """
    if templates is None:
        templates = build_templates()

    # Decode PCM float32 samples
    n_samples = len(pcm_data) // 4
    if n_samples < 512:
        return {"chord": "N.C.", "confidence": 0.0, "pitchClasses": [0] * 12}

    samples = np.array(struct.unpack(f"<{n_samples}f", pcm_data[:n_samples * 4]), dtype=np.float32)

    # Quick RMS energy check
    rms = np.sqrt(np.mean(samples ** 2))
    if rms < 0.01:
        return {"chord": "N.C.", "confidence": 0.0, "pitchClasses": [0] * 12}

    # Compute chroma using simple FFT-based approach for low latency
    fft_size = min(4096, len(samples))
    if fft_size < 512:
        return {"chord": "N.C.", "confidence": 0.0, "pitchClasses": [0] * 12}

    # Apply Hann window
    window = np.hanning(fft_size)
    windowed = samples[:fft_size] * window

    # FFT
    spectrum = np.abs(np.fft.rfft(windowed))
    freqs = np.fft.rfftfreq(fft_size, 1.0 / sample_rate)

    # Build pitch class histogram from spectral peaks
    pitch_classes = np.zeros(12, dtype=np.float32)
    min_freq, max_freq = 65.0, 2000.0

    for i in range(1, len(spectrum) - 1):
        freq = freqs[i]
        mag = spectrum[i]
        if freq < min_freq or freq > max_freq:
            continue
        if mag > spectrum[i - 1] and mag > spectrum[i + 1]:
            # Peak detected — map to pitch class
            if freq > 0:
                midi = 69 + 12 * np.log2(freq / 440.0)
                pc = int(round(midi)) % 12
                pitch_classes[pc] += mag

    # Normalize
    pc_sum = pitch_classes.sum()
    if pc_sum < 0.01:
        return {"chord": "N.C.", "confidence": 0.0, "pitchClasses": pitch_classes.tolist()}

    pc_norm = pitch_classes / (pc_sum + 1e-8)

    # Template matching via cosine similarity
    scores = templates @ pc_norm
    nc_idx = LABEL_TO_IDX["N.C."]
    scores[nc_idx] = -1.0  # Suppress N.C. for non-silent

    best_idx = int(np.argmax(scores))
    best_score = float(scores[best_idx])

    # Map similarity [-1, 1] → confidence [0, 1]
    confidence = float(np.clip((best_score + 1.0) / 2.0, 0, 1))

    # Clean label: "C:maj" → "C", "A:min" → "Am"
    label = LABELS[best_idx]
    if ":" in label:
        root, qual = label.split(":", 1)
        if qual == "maj":
            chord = root
        elif qual == "min":
            chord = f"{root}m"
        else:
            chord = f"{root}{qual}"
    else:
        chord = label

    return {
        "chord": chord,
        "confidence": round(confidence, 3),
        "pitchClasses": pitch_classes.tolist(),
    }


async def websocket_chord_endpoint(websocket: WebSocket):
    """
    WebSocket handler for real-time chord detection.

    Protocol:
      - Client sends binary PCM frames (float32, mono, 44100 Hz)
      - Server responds with JSON: {"chord": "Am", "confidence": 0.85, "pitchClasses": [...]}
    """
    await websocket.accept()
    print("[WS] Client connected for live chord detection")

    templates = build_templates()

    try:
        while True:
            data = await websocket.receive_bytes()
            result = _detect_chord_from_pcm(data, sample_rate=44100, templates=templates)
            await websocket.send_text(json.dumps(result))
    except WebSocketDisconnect:
        print("[WS] Client disconnected")
    except Exception as e:
        print(f"[WS] Error: {e}")
        try:
            await websocket.close()
        except Exception:
            pass
