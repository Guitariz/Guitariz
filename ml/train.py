"""
ml/train.py

Training script for the ChordCRNN model.

Usage:
    python -m ml.train --data_dir synth_dataset --epochs 100 --batch_size 16

Produces:
    ml/checkpoints/best_chord_crnn.pt   (PyTorch checkpoint)
    ml/checkpoints/training_log.json    (epoch-level metrics)
"""
from __future__ import annotations

import argparse
import json
import time
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, random_split

from .chord_vocab import NUM_CLASSES
from .dataset import ChordDataset
from .model import ChordCRNN


def train(
    data_dir: str = "synth_dataset",
    epochs: int = 100,
    batch_size: int = 16,
    lr: float = 1e-3,
    weight_decay: float = 1e-4,
    label_smoothing: float = 0.05,
    val_split: float = 0.15,
    chunk_frames: int = 200,
    save_dir: str = "ml/checkpoints",
):
    """Train the ChordCRNN model."""

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[Train] Device: {device}")

    # ── Dataset ─────────────────────────────────────────────────────────────
    manifest = Path(data_dir) / "manifest.jsonl"
    if not manifest.exists():
        raise FileNotFoundError(f"Manifest not found: {manifest}")

    dataset = ChordDataset(str(manifest), chunk_frames=chunk_frames, augment=True)
    print(f"[Train] Dataset: {len(dataset)} chunks from {len(dataset.entries)} entries")

    # Train/val split
    n_val = max(1, int(len(dataset) * val_split))
    n_train = len(dataset) - n_val
    train_ds, val_ds = random_split(dataset, [n_train, n_val])

    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False, num_workers=0)

    # ── Model ───────────────────────────────────────────────────────────────
    model = ChordCRNN(num_classes=NUM_CLASSES).to(device)
    n_params = sum(p.numel() for p in model.parameters())
    print(f"[Train] Model params: {n_params:,}")

    # ── Optimizer & scheduler ───────────────────────────────────────────────
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=weight_decay)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)
    criterion = nn.CrossEntropyLoss(label_smoothing=label_smoothing)

    # ── Training loop ───────────────────────────────────────────────────────
    save_path = Path(save_dir)
    save_path.mkdir(parents=True, exist_ok=True)
    best_val_acc = 0.0
    log: list[dict] = []

    for epoch in range(1, epochs + 1):
        t0 = time.time()

        # Train
        model.train()
        train_loss = 0.0
        train_correct = 0
        train_total = 0

        for x, y in train_loader:
            x, y = x.to(device), y.to(device)
            logits = model(x)  # (B, T, C)
            loss = criterion(logits.reshape(-1, NUM_CLASSES), y.reshape(-1))

            optimizer.zero_grad()
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()

            train_loss += loss.item() * x.size(0)
            preds = logits.argmax(dim=-1)
            train_correct += (preds == y).sum().item()
            train_total += y.numel()

        train_loss /= len(train_ds)
        train_acc = train_correct / max(train_total, 1)

        # Validate
        model.eval()
        val_loss = 0.0
        val_correct = 0
        val_total = 0

        with torch.no_grad():
            for x, y in val_loader:
                x, y = x.to(device), y.to(device)
                logits = model(x)
                loss = criterion(logits.reshape(-1, NUM_CLASSES), y.reshape(-1))
                val_loss += loss.item() * x.size(0)
                preds = logits.argmax(dim=-1)
                val_correct += (preds == y).sum().item()
                val_total += y.numel()

        val_loss /= max(n_val, 1)
        val_acc = val_correct / max(val_total, 1)

        scheduler.step()
        elapsed = time.time() - t0

        epoch_log = {
            "epoch": epoch,
            "train_loss": round(train_loss, 4),
            "train_acc": round(train_acc, 4),
            "val_loss": round(val_loss, 4),
            "val_acc": round(val_acc, 4),
            "lr": round(scheduler.get_last_lr()[0], 6),
            "elapsed": round(elapsed, 1),
        }
        log.append(epoch_log)

        # Save best
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save({
                "epoch": epoch,
                "model_state_dict": model.state_dict(),
                "optimizer_state_dict": optimizer.state_dict(),
                "val_acc": val_acc,
                "val_loss": val_loss,
            }, save_path / "best_chord_crnn.pt")
            marker = " ← best"
        else:
            marker = ""

        print(
            f"[Epoch {epoch:03d}/{epochs}] "
            f"loss={train_loss:.4f} acc={train_acc:.3f} | "
            f"val_loss={val_loss:.4f} val_acc={val_acc:.3f} | "
            f"lr={scheduler.get_last_lr()[0]:.6f} | "
            f"{elapsed:.1f}s{marker}"
        )

    # Save training log
    with open(save_path / "training_log.json", "w") as f:
        json.dump(log, f, indent=2)

    print(f"\n[Train] Done. Best val accuracy: {best_val_acc:.4f}")
    print(f"[Train] Checkpoint saved to: {save_path / 'best_chord_crnn.pt'}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train ChordCRNN model")
    parser.add_argument("--data_dir", type=str, default="synth_dataset")
    parser.add_argument("--epochs", type=int, default=100)
    parser.add_argument("--batch_size", type=int, default=16)
    parser.add_argument("--lr", type=float, default=1e-3)
    parser.add_argument("--chunk_frames", type=int, default=200)
    parser.add_argument("--save_dir", type=str, default="ml/checkpoints")
    args = parser.parse_args()

    train(
        data_dir=args.data_dir,
        epochs=args.epochs,
        batch_size=args.batch_size,
        lr=args.lr,
        chunk_frames=args.chunk_frames,
        save_dir=args.save_dir,
    )
