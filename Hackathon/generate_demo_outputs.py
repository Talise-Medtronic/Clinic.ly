from __future__ import annotations

import argparse
import json
from pathlib import Path

import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap
from matplotlib.collections import LineCollection
import numpy as np
import torch

from ecg_pipeline.explainability import compute_gradcam_1d
from ecg_pipeline.labels import find_normal_class_index
from ecg_pipeline.model import SingleLeadCNN


def run_inference(model: torch.nn.Module, X: np.ndarray, batch_size: int) -> np.ndarray:
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = model.to(device)
    model.eval()

    all_probs = []
    with torch.no_grad():
        for start in range(0, len(X), batch_size):
            xb = torch.from_numpy(X[start : start + batch_size]).unsqueeze(1).to(device)
            logits = model(xb)
            probs = torch.sigmoid(logits).cpu().numpy()
            all_probs.append(probs)

    return np.concatenate(all_probs, axis=0)


def save_raw_ecg_plot(
    signal_1d: np.ndarray,
    output_path: Path,
) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    x_axis = np.arange(signal_1d.shape[0])
    fig, ax = plt.subplots(figsize=(30, 4), facecolor="#05070B")
    ax.set_facecolor("#05070B")
    ax.plot(x_axis, signal_1d, color="#F2F5FF", linewidth=1.15)
    ax.set_axis_off()
    fig.tight_layout()
    fig.savefig(output_path, dpi=150)
    plt.close(fig)


def save_gradcam_bold_plot(
    signal_1d: np.ndarray,
    gradcam_1d: np.ndarray,
    output_path: Path,
) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)

    x_axis = np.arange(signal_1d.shape[0])
    cam = np.asarray(gradcam_1d, dtype=np.float32)
    if cam.size != signal_1d.size:
        xp = np.linspace(0, 1, cam.size)
        xnew = np.linspace(0, 1, signal_1d.size)
        cam = np.interp(xnew, xp, cam)
    cam = cam - cam.min()
    cam = cam / (cam.max() + 1e-8)
    # Emphasize separation: push low-importance values toward 0 and stretch high values.
    cam = np.clip((cam - 0.2) / 0.8, 0.0, 1.0)
    cam = np.power(cam, 0.55)

    points = np.array([x_axis, signal_1d], dtype=np.float32).T.reshape(-1, 1, 2)
    segments = np.concatenate([points[:-1], points[1:]], axis=1)

    fig, ax = plt.subplots(figsize=(30, 4), facecolor="#05070B")
    ax.set_facecolor("#05070B")
    ax.plot(x_axis, signal_1d, color="#A9B2C8", linewidth=0.9, alpha=0.8)

    # High-importance regions map to red; low-importance stays white so the raw trace remains visible.
    red_focus_cmap = LinearSegmentedColormap.from_list(
        "red_focus",
        ["#FFFFFF", "#FFE5E5", "#FFB3B3", "#FF6666", "#FF1F1F", "#C00000"],
    )
    lc = LineCollection(segments, cmap=red_focus_cmap, linewidth=3.4)
    lc.set_array(cam[:-1])
    lc.set_alpha(1.0)
    ax.add_collection(lc)

    ax.set_xlim([x_axis.min(), x_axis.max()])
    ax.set_axis_off()

    fig.tight_layout()
    fig.savefig(output_path, dpi=150)
    plt.close(fig)


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate demo-ready model outputs from labeled dataset samples")
    parser.add_argument("--model-path", default="artifacts/singlelead_cnn.pt")
    parser.add_argument("--dataset", default="processed/dataset_singlelead_60s.npz")
    parser.add_argument("--metadata", default="processed/metadata.json")
    parser.add_argument("--output-dir", default="demo_outputs")
    parser.add_argument("--per-class-target", type=int, default=30)
    parser.add_argument("--threshold", type=float, default=0.5)
    parser.add_argument("--batch-size", type=int, default=128)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument(
        "--only-correct",
        action="store_true",
        help="Keep only class-correct examples for each class (recommended for demo)",
    )
    args = parser.parse_args()

    model_path = Path(args.model_path).resolve()
    dataset_path = Path(args.dataset).resolve()
    metadata_path = Path(args.metadata).resolve()
    output_dir = Path(args.output_dir).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    ckpt = torch.load(model_path, map_location="cpu")
    data = np.load(dataset_path, allow_pickle=True)

    with metadata_path.open("r", encoding="utf-8") as f:
        metadata = json.load(f)

    class_codes = ckpt.get("class_codes") or metadata.get("class_codes")
    if not class_codes:
        raise RuntimeError("Could not determine class codes from checkpoint or metadata")

    X = data["X"].astype(np.float32)
    y = data["y"].astype(np.float32)
    record_ids = data["record_ids"].astype(str) if "record_ids" in data else np.array([f"sample_{i}" for i in range(len(X))])

    rng = np.random.default_rng(args.seed)

    selected_indices = []
    class_selection_counts: dict[str, int] = {}
    for class_idx, class_code in enumerate(class_codes):
        class_members = np.where(y[:, class_idx] > 0.5)[0]
        take_n = min(args.per_class_target, len(class_members))
        if take_n > 0:
            chosen = rng.choice(class_members, size=take_n, replace=False)
            selected_indices.extend(chosen.tolist())
        class_selection_counts[class_code] = int(take_n)

    # Avoid duplicate selections when multi-label rows are sampled for multiple classes.
    selected_indices = sorted(set(selected_indices))
    if not selected_indices:
        raise RuntimeError("No samples selected for demo output generation")

    X_sel = X[selected_indices]
    y_sel = y[selected_indices]
    rid_sel = record_ids[selected_indices]

    model = SingleLeadCNN(num_classes=len(class_codes))
    model.load_state_dict(ckpt["model_state_dict"])
    probs_sel = run_inference(model, X_sel, args.batch_size)

    normal_idx = find_normal_class_index(class_codes)
    manifest_items = []

    for i, ds_idx in enumerate(selected_indices):
        probs = probs_sel[i]
        true_vec = y_sel[i]
        pred_idx = [j for j, p in enumerate(probs.tolist()) if p >= args.threshold]
        if not pred_idx:
            pred_idx = [int(np.argmax(probs))]

        true_idx = [j for j, v in enumerate(true_vec.tolist()) if v > 0.5]
        true_codes = [class_codes[j] for j in true_idx]
        predicted_codes = [class_codes[j] for j in pred_idx]

        example = {
            "dataset_index": int(ds_idx),
            "record_id": str(rid_sel[i]),
            "true_codes": true_codes,
            "predicted_codes": predicted_codes,
            "probabilities": {class_codes[j]: float(probs[j]) for j in range(len(class_codes))},
            "is_predicted_normal_only": bool(normal_idx is not None and pred_idx == [normal_idx]),
            "threshold": float(args.threshold),
        }

        first_true = true_codes[0] if true_codes else "UNLABELED"
        class_dir = output_dir / first_true
        class_dir.mkdir(parents=True, exist_ok=True)
        out_path = class_dir / f"example_{int(ds_idx):06d}.json"
        out_path.write_text(json.dumps(example, indent=2), encoding="utf-8")

        manifest_items.append(
            {
                "dataset_index": int(ds_idx),
                "record_id": str(rid_sel[i]),
                "primary_true_code": first_true,
                "predicted_codes": predicted_codes,
                "json_path": str(out_path),
            }
        )

    # Reload model on CPU for per-example Grad-CAM generation.
    model_cpu = SingleLeadCNN(num_classes=len(class_codes))
    model_cpu.load_state_dict(ckpt["model_state_dict"])
    model_cpu.eval()

    filtered_manifest = []
    per_class_kept = {code: 0 for code in class_codes}

    for item in manifest_items:
        ds_idx = int(item["dataset_index"])
        sample_pos = selected_indices.index(ds_idx)
        probs = probs_sel[sample_pos]
        true_vec = y_sel[sample_pos]
        true_idx = [j for j, v in enumerate(true_vec.tolist()) if v > 0.5]
        true_codes = [class_codes[j] for j in true_idx]
        pred_idx = [j for j, p in enumerate(probs.tolist()) if p >= args.threshold]
        if not pred_idx:
            pred_idx = [int(np.argmax(probs))]
        pred_codes = [class_codes[j] for j in pred_idx]

        primary_true = item["primary_true_code"]
        class_correct = primary_true in pred_codes
        if args.only_correct and not class_correct:
            continue
        if primary_true in per_class_kept and per_class_kept[primary_true] >= args.per_class_target:
            continue

        prediction_status = "CORRECT" if class_correct else "INCORRECT"

        class_dir = output_dir / primary_true
        raw_path = class_dir / f"example_{ds_idx:06d}_raw.png"
        gradcam_path = class_dir / f"example_{ds_idx:06d}_gradcam.png"

        signal = X_sel[sample_pos]
        save_raw_ecg_plot(
            signal,
            raw_path,
        )

        # Use Grad-CAM for the primary true class to make class-specific evidence visible.
        target_idx = class_codes.index(primary_true) if primary_true in class_codes else int(np.argmax(probs))
        x_tensor = torch.from_numpy(signal).unsqueeze(0).unsqueeze(0)
        gradcam = compute_gradcam_1d(model_cpu, x_tensor, target_idx)
        save_gradcam_bold_plot(
            signal,
            gradcam,
            gradcam_path,
        )

        example_json = Path(item["json_path"])
        example = json.loads(example_json.read_text(encoding="utf-8"))
        example["class_correct"] = bool(class_correct)
        example["prediction_status"] = prediction_status
        example["raw_ecg_image"] = str(raw_path)
        example["gradcam_image"] = str(gradcam_path)
        example["gradcam_class"] = primary_true
        example_json.write_text(json.dumps(example, indent=2), encoding="utf-8")

        item["class_correct"] = bool(class_correct)
        item["prediction_status"] = prediction_status
        item["raw_ecg_image"] = str(raw_path)
        item["gradcam_image"] = str(gradcam_path)
        item["gradcam_class"] = primary_true
        filtered_manifest.append(item)
        if primary_true in per_class_kept:
            per_class_kept[primary_true] += 1

    summary = {
        "model_path": str(model_path),
        "dataset_path": str(dataset_path),
        "num_selected_unique_examples": int(len(selected_indices)),
        "num_output_examples": int(len(filtered_manifest)),
        "per_class_target": int(args.per_class_target),
        "per_class_selected": class_selection_counts,
        "per_class_kept": per_class_kept,
        "only_correct": bool(args.only_correct),
        "classes": class_codes,
    }

    (output_dir / "manifest.json").write_text(json.dumps(filtered_manifest, indent=2), encoding="utf-8")
    (output_dir / "summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")

    print(f"Generated {len(filtered_manifest)} demo examples in {output_dir}")
    print(f"Per-class selected counts (pre-filter): {class_selection_counts}")
    print(f"Per-class kept counts (post-filter): {per_class_kept}")
    print(f"Manifest: {output_dir / 'manifest.json'}")
    print(f"Summary: {output_dir / 'summary.json'}")


if __name__ == "__main__":
    main()
