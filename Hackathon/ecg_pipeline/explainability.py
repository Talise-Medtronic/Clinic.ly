from __future__ import annotations

from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import torch
from torch import nn


def compute_input_saliency(model: nn.Module, x: torch.Tensor, target_idx: int) -> np.ndarray:
    model.eval()
    x_grad = x.detach().clone().requires_grad_(True)

    model.zero_grad(set_to_none=True)
    logits = model(x_grad)
    target_logit = logits[0, target_idx]
    target_logit.backward()

    grad = x_grad.grad.detach().cpu().numpy()[0, 0]
    saliency = np.abs(grad)
    saliency = saliency - saliency.min()
    denom = saliency.max() + 1e-8
    saliency = saliency / denom
    return saliency.astype(np.float32)


def compute_gradcam_1d(model: nn.Module, x: torch.Tensor, target_idx: int) -> np.ndarray:
    model.eval()
    activations = None
    gradients = None

    def forward_hook(_module, _inputs, output):
        nonlocal activations
        activations = output

        def grad_hook(grad):
            nonlocal gradients
            gradients = grad

        output.register_hook(grad_hook)

    if not hasattr(model, "features"):
        raise ValueError("Model does not expose a 'features' module needed for Grad-CAM")

    target_layer = model.features[10]
    handle = target_layer.register_forward_hook(forward_hook)

    try:
        model.zero_grad(set_to_none=True)
        logits = model(x)
        target_logit = logits[0, target_idx]
        target_logit.backward()

        if activations is None or gradients is None:
            raise RuntimeError("Grad-CAM hooks did not capture activations/gradients")

        acts = activations.detach().cpu().numpy()[0]
        grads = gradients.detach().cpu().numpy()[0]

        channel_weights = np.mean(grads, axis=1)
        cam = np.sum(acts * channel_weights[:, None], axis=0)
        cam = np.maximum(cam, 0.0)

        input_len = int(x.shape[-1])
        if cam.shape[0] != input_len:
            old_x = np.linspace(0.0, 1.0, num=cam.shape[0])
            new_x = np.linspace(0.0, 1.0, num=input_len)
            cam = np.interp(new_x, old_x, cam)

        cam = cam - cam.min()
        cam = cam / (cam.max() + 1e-8)
        return cam.astype(np.float32)
    finally:
        handle.remove()


def save_saliency_plot(signal_1d: np.ndarray, saliency_1d: np.ndarray, output_path: Path, title: str) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)

    x_axis = np.arange(signal_1d.shape[0])
    fig, ax = plt.subplots(figsize=(14, 4))
    y_min = float(np.min(signal_1d))
    y_max = float(np.max(signal_1d))
    y_pad = 0.1 * (y_max - y_min + 1e-8)

    heat = np.expand_dims(saliency_1d, axis=0)
    im = ax.imshow(
        heat,
        cmap="hot",
        aspect="auto",
        interpolation="nearest",
        extent=[0, signal_1d.shape[0] - 1, y_min - y_pad, y_max + y_pad],
        alpha=0.35,
        origin="lower",
    )

    ax.plot(x_axis, signal_1d, color="black", linewidth=1.0, label="ECG (z-scored)")
    ax.scatter(
        x_axis,
        signal_1d,
        c=saliency_1d,
        cmap="hot",
        s=2,
        alpha=0.5,
        linewidths=0,
        label="Explainability overlay",
    )

    ax.set_xlabel("Sample")
    ax.set_ylabel("ECG amplitude")
    ax.set_title(title)
    ax.legend(loc="upper right")
    cbar = fig.colorbar(im, ax=ax, pad=0.02)
    cbar.set_label("Normalized attribution")

    fig.tight_layout()
    fig.savefig(output_path, dpi=150)
    plt.close(fig)