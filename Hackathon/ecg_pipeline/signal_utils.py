from __future__ import annotations

from fractions import Fraction

import numpy as np
from scipy.signal import resample_poly


def resample_signal(signal_1d: np.ndarray, source_fs: float, target_fs: int) -> np.ndarray:
    if int(round(source_fs)) == int(target_fs):
        return signal_1d.astype(np.float32, copy=False)

    ratio = Fraction(float(target_fs) / float(source_fs)).limit_denominator(1000)
    resampled = resample_poly(signal_1d, ratio.numerator, ratio.denominator)
    return resampled.astype(np.float32, copy=False)


def ensure_fixed_length(signal_1d: np.ndarray, target_samples: int) -> np.ndarray:
    current = signal_1d.shape[0]
    if current == target_samples:
        return signal_1d.astype(np.float32, copy=False)

    if current > target_samples:
        start = (current - target_samples) // 2
        end = start + target_samples
        return signal_1d[start:end].astype(np.float32, copy=False)

    pad_total = target_samples - current
    left = pad_total // 2
    right = pad_total - left
    padded = np.pad(signal_1d, (left, right), mode="constant", constant_values=0.0)
    return padded.astype(np.float32, copy=False)


def zscore(signal_1d: np.ndarray, eps: float = 1e-8) -> np.ndarray:
    mean = float(np.mean(signal_1d))
    std = float(np.std(signal_1d))
    return ((signal_1d - mean) / (std + eps)).astype(np.float32, copy=False)
