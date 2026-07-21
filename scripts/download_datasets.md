# Dataset acquisition (run this on YOUR machine or Colab, not in a restricted sandbox)

This repo's dev sandbox could not reach dataset hosts (isophonics.org,
zenodo.org, mirdata's backends are all off-limits from that environment) —
only GitHub and package registries were reachable. So this step has to run
wherever you have normal internet access: your laptop, a Colab notebook, etc.

## Recommended approach: `mirdata`

[`mirdata`](https://github.com/mir-dataset-loaders/mirdata) (MIT licensed) wraps
downloading + validating most of the datasets below with one API, and is by far
the least error-prone way to do this.

```bash
pip install mirdata
```

```python
import mirdata

# Beatles chord annotations (Isophonics) -- READ THE LICENSE NOTE BELOW
beatles = mirdata.initialize('beatles')
beatles.download()
beatles.validate()

# GiantSteps key dataset
giantsteps_key = mirdata.initialize('giantsteps_key')
giantsteps_key.download()

# GiantSteps tempo dataset
giantsteps_tempo = mirdata.initialize('giantsteps_tempo')
giantsteps_tempo.download()

# RWC Popular (if you have access -- distributed under a research license,
# generally requires purchasing/requesting the physical discs from AIST/RWC)
```

## ⚠️ Licensing checklist before training on any dataset

This matters a lot given your AdSense-monetization goal — re-verify each one,
since terms can and do change:

| Dataset | Annotations | Audio | Safe to train on for a commercial tool? |
|---|---|---|---|
| Isophonics (Beatles/Queen/etc.) | CC-BY-style, research use | Copyrighted commercial recordings, NOT freely redistributable | Training is generally fine (you're not redistributing the audio or annotations); re-check current terms before relying on this |
| McGill Billboard | Research license | You must source audio yourself (not bundled) | Same caveat as above |
| GiantSteps (key + tempo) | CC-licensed | Audio previews are typically freely available | Generally the cleanest option here |
| RWC Popular | Research license via AIST | Distributed on physical media, licensed for research | Re-check current RWC terms; commercial derivative use has historically been a gray area — email AIST if unsure |
| JAWS (jazz) | Research | Check current repo license | Verify before commercial use |

**The lowest-risk option, if you want zero ambiguity:** record or commission a
few hundred short chord-progression clips yourself (a guitarist playing
through chord types over a metronome, or synthesized MIDI-to-audio renders),
auto-generate perfect `.lab` labels from the MIDI/manual annotation, and train
on that. It's less musically diverse than Isophonics/Billboard, but it's
100% unambiguous rights-wise, and you can always mix in the research datasets
under "training use" once you've had a lawyer or Anthropic-adjacent
IP-savvy friend sanity check the current terms.

## Converting a mirdata dataset into this repo's expected layout

`ml/dataset.py` expects:
```
data_root/
    audio/*.wav
    labels/*.lab      # "<start_sec> <end_sec> <chord_label>" per line
```

Example conversion snippet (run after `mirdata` download):

```python
import soundfile as sf
import numpy as np
from pathlib import Path

out_root = Path("chord_dataset")
(out_root / "audio").mkdir(parents=True, exist_ok=True)
(out_root / "labels").mkdir(parents=True, exist_ok=True)

for track_id, track in beatles.load_tracks().items():
    y, sr = track.audio  # mirdata handles the loading/resampling
    sf.write(out_root / "audio" / f"{track_id}.wav", y, sr)

    chords = track.chords  # mirdata's parsed chord annotation object
    with open(out_root / "labels" / f"{track_id}.lab", "w") as f:
        for start, end, label in zip(chords.intervals[:, 0], chords.intervals[:, 1], chords.labels):
            f.write(f"{start} {end} {label}\n")
```

(Exact attribute names vary slightly by mirdata version/dataset — check
`help(track)` for the loaded object; this is meant to show the shape of the
conversion, not be copy-paste perfect for every mirdata release.)

## Then train

```bash
python -m ml.train --data_root chord_dataset --epochs 30 --out ckpt.pt
python -m ml.export_onnx --ckpt ckpt.pt --out backend/chord_model.onnx
python -m ml.test_onnx_inference --model backend/chord_model.onnx --audio some_test_song.wav
```

Drop `chord_model.onnx` into `backend/` and `chord_custom.py` will pick it up
automatically — no other code changes needed.
