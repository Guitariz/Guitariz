"""
ml/model.py

CRNN (CNN + BiLSTM) chord recognition model.

Architecture rationale:
  CNN front-end    → learns local spectral patterns (note/harmonic shapes) from
                     the log-CQT, downsampling frequency while preserving the
                     time axis.
  BiLSTM           → models chord *context* over time. Chords rarely change every
                     93ms; the LSTM lets predictions at frame t use both past and
                     future context — this is what gives CRNNs their edge over
                     frame-independent template matching.
  Linear head      → per-frame chord class logits.

Why CRNN over a transformer (BTC)?
  - ~1.5M params → trains on a single Colab T4 in hours
  - Exports cleanly to ONNX (LSTMs work fine without dynamic control flow)
  - CPU inference on a 4-minute song: sub-second to low single digits
  - Accuracy competitive at this model size (~80-85% with good training data)

Input:  log-CQT, shape (batch, 1, n_bins=216, n_frames)
Output: per-frame logits, shape (batch, n_frames, NUM_CLASSES)
"""
from __future__ import annotations

import torch
import torch.nn as nn

from .chord_vocab import NUM_CLASSES


class ChordCRNN(nn.Module):
    """
    Convolutional Recurrent Neural Network for frame-level chord recognition.

    Args:
        n_bins: Number of CQT frequency bins (default 216 = 6 octaves × 36 bins/octave).
        num_classes: Number of output chord classes (default 109).
        lstm_hidden: Hidden size per LSTM direction (total output = 2 × lstm_hidden).
        lstm_layers: Number of stacked BiLSTM layers.
    """

    def __init__(
        self,
        n_bins: int = 216,
        num_classes: int = NUM_CLASSES,
        lstm_hidden: int = 128,
        lstm_layers: int = 2,
    ):
        super().__init__()

        # ── CNN front end ───────────────────────────────────────────────────
        # 3 conv blocks, pooling ONLY over the frequency axis so the time
        # axis (and therefore frame-level chord timing) is preserved.
        self.conv = nn.Sequential(
            # Block 1: freq 216 → 72
            nn.Conv2d(1, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(),
            nn.MaxPool2d(kernel_size=(3, 1)),
            # Block 2: freq 72 → 24
            nn.Conv2d(32, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.MaxPool2d(kernel_size=(3, 1)),
            # Block 3: freq 24 → 12
            nn.Conv2d(64, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.MaxPool2d(kernel_size=(2, 1)),
        )

        cnn_out_freq = n_bins // (3 * 3 * 2)  # 216 → 12
        cnn_out_channels = 64
        self.rnn_input_size = cnn_out_freq * cnn_out_channels  # 12 × 64 = 768

        # ── BiLSTM temporal context ─────────────────────────────────────────
        self.lstm = nn.LSTM(
            input_size=self.rnn_input_size,
            hidden_size=lstm_hidden,
            num_layers=lstm_layers,
            batch_first=True,
            bidirectional=True,
            dropout=0.2 if lstm_layers > 1 else 0.0,
        )

        # ── Classification head ─────────────────────────────────────────────
        self.classifier = nn.Linear(lstm_hidden * 2, num_classes)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Forward pass.

        Args:
            x: (batch, 1, n_bins, n_frames) log-CQT spectrogram.

        Returns:
            logits: (batch, n_frames, num_classes) per-frame chord logits.
        """
        feat = self.conv(x)                                   # (B, C, F, T)
        b, c, f, t = feat.shape
        feat = feat.permute(0, 3, 1, 2).reshape(b, t, c * f)  # (B, T, C*F)
        rnn_out, _ = self.lstm(feat)                           # (B, T, 2*hidden)
        logits = self.classifier(rnn_out)                      # (B, T, num_classes)
        return logits


class KeyCNN(nn.Module):
    """
    Small CNN for global key classification (24 classes: 12 roots × {major, minor}).

    Optional — the DSP Krumhansl-Schmuckler baseline in ml/dsp_tempo_key.py is
    already quite strong for key detection. Only train this if real-world
    accuracy proves insufficient.

    Input:  log-CQT, shape (batch, 1, n_bins, n_frames)
    Output: logits, shape (batch, 24)
    """

    def __init__(self, n_bins: int = 216, num_classes: int = 24):
        super().__init__()
        self.conv = nn.Sequential(
            nn.Conv2d(1, 16, kernel_size=3, padding=1),
            nn.BatchNorm2d(16),
            nn.ReLU(),
            nn.AdaptiveAvgPool2d((n_bins // 4, 32)),
            nn.Conv2d(16, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(),
            nn.AdaptiveAvgPool2d((n_bins // 16, 8)),
        )
        flat_dim = (n_bins // 16) * 8 * 32
        self.head = nn.Sequential(
            nn.Flatten(),
            nn.Linear(flat_dim, 64),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(64, num_classes),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.head(self.conv(x))


if __name__ == "__main__":
    # Quick shape sanity check
    model = ChordCRNN()
    dummy = torch.randn(2, 1, 216, 100)  # batch=2, 100 frames (~9.3s)
    out = model(dummy)
    print("ChordCRNN output shape:", out.shape)  # expect (2, 100, 109)
    n_params = sum(p.numel() for p in model.parameters())
    print(f"ChordCRNN params: {n_params:,}")

    key_model = KeyCNN()
    out2 = key_model(dummy)
    print("KeyCNN output shape:", out2.shape)  # expect (2, 24)
