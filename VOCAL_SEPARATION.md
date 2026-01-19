# Vocal Separation Feature

## Overview
The Chord AI now supports **vocal/instrumental separation** for more accurate chord detection. When enabled, the system uses Meta's Demucs model to isolate the instrumental track before analyzing chords.

## Why This Matters
- **Vocals interfere with chord detection**: Human voice frequencies overlap with guitar/piano harmonics
- **Separation improves accuracy**: Analyzing only the instrumental track gives cleaner chord detection
- **Professional-grade results**: Demucs is the same technology used in audio production software

## How to Use

### Frontend (UI)
1. Go to the **Chord AI** page
2. Upload an audio file
3. Toggle the **"Isolate"** switch (next to "Complex")
4. The analysis will automatically separate vocals before detecting chords

### Backend Setup
First, install the new dependencies:

```bash
cd backend
pip install -r requirements.txt
```

This installs:
- `demucs==4.0.1` - Meta's state-of-the-art source separation model
- `torch>=2.0.0` - Required for neural network inference

### How It Works

1. **Upload**: User uploads a song (e.g., "song.mp3")
2. **Separation** (if enabled): Demucs splits the audio into 4 stems:
   - Drums
   - Bass
   - Other (instruments)
   - Vocals
3. **Combination**: Drums + Bass + Other = Instrumental track
4. **Analysis**: Chord detection runs on the instrumental-only track
5. **Cleanup**: Temporary files are deleted

### Performance Notes

- **Processing Time**: Adds 10-30 seconds depending on song length
- **CPU Usage**: Demucs runs on CPU by default (GPU support can be enabled)
- **Memory**: Requires ~2GB RAM for processing
- **Quality**: "htdemucs" model provides excellent separation quality

### API Endpoint

The backend now accepts a `separate_vocals` parameter:

```python
POST /api/analyze
Content-Type: multipart/form-data

file: [audio file]
separate_vocals: true  # Optional, defaults to false
```

### Optimization Ideas

For production deployments:
1. **GPU Acceleration**: Set `device="cuda"` in `analysis.py` for 5-10x faster processing
2. **Caching**: Store separated tracks temporarily to avoid re-processing
3. **Queue System**: Use Celery/Redis for background processing on large files
4. **Model Selection**: Swap `htdemucs` for `htdemucs_ft` (fine-tuned) for even better quality

## Technical Details

### Demucs Architecture
- Hybrid time-frequency domain model
- ~40M parameters
- Trained on 800+ hours of mixed audio
- State-of-the-art on the MUSDB18 benchmark

### Chord Detection Pipeline
```
Audio File → [Separation?] → Librosa Analysis → Chromagram → Template Matching → Chords
```

### File Flow
```python
1. main.py receives upload
2. Calls analyze_file(path, separate_vocals=True)
3. If True:
   - _separate_vocals() runs Demucs
   - Returns path to instrumental.wav
   - Analysis proceeds on instrumental
   - Cleanup temp files
4. Return chord data to frontend
```

## Troubleshooting

**"Vocal separation failed"**
- Fallback: Uses original audio (no separation)
- Check: Ensure `demucs` and `torch` are installed
- Check: Sufficient RAM available (~2GB minimum)

**Slow processing**
- Solution: Enable GPU if available
- Solution: Use smaller model (`mdx_extra` is faster but less accurate)

**Out of memory**
- Solution: Reduce audio file size before upload
- Solution: Split long songs into shorter segments

## Future Enhancements
- [ ] Support for custom Demucs models (e.g., karaoke-specific)
- [ ] Real-time progress feedback during separation
- [ ] Stem preview (let users hear separated tracks)
- [ ] Multi-stem analysis (analyze each instrument separately)
