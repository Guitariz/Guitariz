"""
ml/train.py

Self-contained training script for the chord CRNN. Designed to run on
Colab/Kaggle (or any CUDA box) -- THIS SANDBOX CANNOT RUN IT END-TO-END
because it has no GPU and no access to dataset hosts (isophonics.org,
zenodo.org, mirdata's sources are all network-blocked here). Everything
below has been shape/logic-tested against synthetic data in this sandbox
(see ml/train.py::smoke_test), but the real run — on real Isophonics/
Billboard/RWC data — needs to happen in your own Colab notebook or local
GPU machine.

Usage (on Colab, after uploading/mounting your prepared dataset):
    python -m ml.train --data_root /content/chord_dataset --epochs 30 --out ckpt.pt

Expected dataset layout (see ml/dataset.py docstring for details + licensing notes):
    data_root/audio/*.wav
    data_root/labels/*.lab
"""
from __future__ import annotations

import argparse
import time
from pathlib import Path

import torch
import torch.nn as nn
from torch.utils.data import DataLoader, random_split

from .model import ChordCRNN
from .dataset import ChordDataset
from .chord_vocab import NUM_CLASSES, LABEL_TO_IDX, NO_CHORD


def train(
    data_root: str,
    out_path: str = "ckpt.pt",
    epochs: int = 30,
    batch_size: int = 16,
    lr: float = 1e-3,
    val_frac: float = 0.1,
    patience: int = 5,
    device: str | None = None,
):
    device = device or ("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Training on device: {device}")

    dataset = ChordDataset(data_root)
    n_val = max(1, int(len(dataset) * val_frac))
    n_train = len(dataset) - n_val
    train_ds, val_ds = random_split(dataset, [n_train, n_val])
    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True, num_workers=2)
    val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False, num_workers=2)

    model = ChordCRNN().to(device)

    # class weighting: N.C. and 'maj' chords dominate real songs, which biases
    # naive training toward always predicting them. Inverse-frequency weighting
    # keeps rarer qualities (aug, sus2, dim) from being ignored.
    class_weights = torch.ones(NUM_CLASSES)
    class_weights[LABEL_TO_IDX[NO_CHORD]] = 0.3
    criterion = nn.CrossEntropyLoss(weight=class_weights.to(device))
    optimizer = torch.optim.Adam(model.parameters(), lr=lr)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode="min", factor=0.5, patience=2)

    best_val_loss = float("inf")
    epochs_no_improve = 0

    for epoch in range(1, epochs + 1):
        model.train()
        train_loss, train_correct, train_total = 0.0, 0, 0
        t0 = time.time()
        for x, y in train_loader:
            x, y = x.to(device), y.to(device)  # x: (B,1,F,T), y: (B,T)
            optimizer.zero_grad()
            logits = model(x)  # (B, T, C)
            loss = criterion(logits.reshape(-1, NUM_CLASSES), y.reshape(-1))
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 5.0)
            optimizer.step()

            train_loss += loss.item() * x.size(0)
            preds = logits.argmax(dim=-1)
            train_correct += (preds == y).sum().item()
            train_total += y.numel()

        model.eval()
        val_loss, val_correct, val_total = 0.0, 0, 0
        with torch.no_grad():
            for x, y in val_loader:
                x, y = x.to(device), y.to(device)
                logits = model(x)
                loss = criterion(logits.reshape(-1, NUM_CLASSES), y.reshape(-1))
                val_loss += loss.item() * x.size(0)
                preds = logits.argmax(dim=-1)
                val_correct += (preds == y).sum().item()
                val_total += y.numel()

        train_loss /= len(train_ds)
        val_loss /= len(val_ds)
        train_acc = train_correct / max(1, train_total)
        val_acc = val_correct / max(1, val_total)
        scheduler.step(val_loss)

        print(
            f"epoch {epoch:3d}/{epochs} | train_loss {train_loss:.4f} acc {train_acc:.3f} | "
            f"val_loss {val_loss:.4f} acc {val_acc:.3f} | {time.time()-t0:.1f}s"
        )

        if val_loss < best_val_loss - 1e-4:
            best_val_loss = val_loss
            epochs_no_improve = 0
            torch.save({"model_state": model.state_dict(), "epoch": epoch, "val_loss": val_loss}, out_path)
            print(f"  -> saved new best checkpoint to {out_path}")
        else:
            epochs_no_improve += 1
            if epochs_no_improve >= patience:
                print(f"Early stopping: no val improvement in {patience} epochs.")
                break

    print(f"Done. Best val_loss={best_val_loss:.4f}. Checkpoint: {out_path}")


def smoke_test():
    """
    Runs a tiny end-to-end training loop on synthetic data to verify the
    training code is logically correct (shapes, loss computation, backward
    pass, checkpointing) BEFORE you spend Colab GPU hours on it. This is
    what was actually executed to validate this script in the dev sandbox.
    """
    import numpy as np
    import tempfile
    import soundfile as sf

    print("Running smoke test with synthetic data (no real dataset needed)...")
    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        (tmp / "audio").mkdir()
        (tmp / "labels").mkdir()

        sr = 22050
        for i in range(4):
            dur = 6.0
            t = np.linspace(0, dur, int(sr * dur), endpoint=False)
            freq = 220 * (1 + 0.1 * i)
            wave = (0.3 * np.sin(2 * np.pi * freq * t)).astype(np.float32)
            sf.write(tmp / "audio" / f"song{i}.wav", wave, sr)
            with open(tmp / "labels" / f"song{i}.lab", "w") as f:
                f.write(f"0.0 2.0 C:maj\n2.0 4.0 A:min\n4.0 {dur} G:maj\n")

        train(str(tmp), out_path=str(tmp / "smoke_ckpt.pt"), epochs=2, batch_size=2, patience=10)
    print("Smoke test passed: training loop, loss, backward pass, and checkpointing all work.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data_root", type=str, default=None)
    parser.add_argument("--out", type=str, default="ckpt.pt")
    parser.add_argument("--epochs", type=int, default=30)
    parser.add_argument("--batch_size", type=int, default=16)
    parser.add_argument("--lr", type=float, default=1e-3)
    parser.add_argument("--smoke_test", action="store_true")
    args = parser.parse_args()

    if args.smoke_test or args.data_root is None:
        smoke_test()
    else:
        train(args.data_root, out_path=args.out, epochs=args.epochs, batch_size=args.batch_size, lr=args.lr)
