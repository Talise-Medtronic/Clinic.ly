from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path

import numpy as np
import torch
from sklearn.metrics import f1_score

from ecg_pipeline.labels import NORMAL_SINUS_CODE
from ecg_pipeline.model import SingleLeadCNN


def abnormal_metrics(targets: np.ndarray, preds: np.ndarray, normal_idx: int | None) -> dict[str, float]:
    if normal_idx is None:
        abnormal_true = np.sum(targets, axis=1) > 0
        abnormal_pred = np.sum(preds, axis=1) > 0
    else:
        keep = [i for i in range(targets.shape[1]) if i != normal_idx]
        abnormal_true = np.sum(targets[:, keep], axis=1) > 0
        abnormal_pred = np.sum(preds[:, keep], axis=1) > 0

    tp = int(np.sum(abnormal_true & abnormal_pred))
    fn = int(np.sum(abnormal_true & ~abnormal_pred))
    fp = int(np.sum(~abnormal_true & abnormal_pred))

    recall = tp / (tp + fn + 1e-8)
    precision = tp / (tp + fp + 1e-8)
    f1 = 2 * precision * recall / (precision + recall + 1e-8)
    return {"recall": float(recall), "precision": float(precision), "f1": float(f1)}


def run_inference(model: torch.nn.Module, X: np.ndarray, batch_size: int) -> np.ndarray:
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = model.to(device)
    model.eval()

    probs = []
    with torch.no_grad():
        for start in range(0, len(X), batch_size):
            xb = torch.from_numpy(X[start : start + batch_size]).unsqueeze(1).to(device)
            logits = model(xb)
            probs.append(torch.sigmoid(logits).cpu().numpy())

    return np.concatenate(probs, axis=0)


def threshold_grid(min_threshold: float, max_threshold: float, step: float) -> list[float]:
    values = []
    x = min_threshold
    while x <= max_threshold + 1e-9:
        values.append(round(x, 6))
        x += step
    return values


def main() -> None:
    parser = argparse.ArgumentParser(description="Tune decision threshold on verification split")
    parser.add_argument("--model-path", default="artifacts/singlelead_cnn.pt", help="Path to model checkpoint")
    parser.add_argument(
        "--verification-dataset",
        default="processed/verification_singlelead_60s.npz",
        help="Path to verification npz",
    )
    parser.add_argument("--batch-size", type=int, default=64)
    parser.add_argument("--min-threshold", type=float, default=0.1)
    parser.add_argument("--max-threshold", type=float, default=0.9)
    parser.add_argument("--step", type=float, default=0.05)
    parser.add_argument(
        "--min-abnormal-precision",
        type=float,
        default=0.0,
        help="Constraint: select best threshold only from rows meeting this abnormal precision",
    )
    parser.add_argument("--output-dir", default="reports", help="Directory for tuning artifacts")
    parser.add_argument("--output-prefix", default="threshold_tuning", help="Output filename prefix")
    parser.add_argument(
        "--write-best-threshold-json",
        default="artifacts/best_threshold.json",
        help="Where to write selected threshold for app/inference use",
    )
    args = parser.parse_args()

    if args.step <= 0:
        raise ValueError("--step must be > 0")
    if args.min_threshold > args.max_threshold:
        raise ValueError("--min-threshold must be <= --max-threshold")

    model_path = Path(args.model_path).resolve()
    data_path = Path(args.verification_dataset).resolve()
    output_dir = Path(args.output_dir).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    ckpt = torch.load(model_path, map_location="cpu")
    class_codes = ckpt.get("class_codes") or ["426783006"]

    data = np.load(data_path, allow_pickle=True)
    X = data["X"].astype(np.float32)
    y_true = data["y"].astype(np.float32)

    model = SingleLeadCNN(num_classes=len(class_codes))
    model.load_state_dict(ckpt["model_state_dict"])
    probs = run_inference(model, X, args.batch_size)

    normal_idx = class_codes.index(NORMAL_SINUS_CODE) if NORMAL_SINUS_CODE in class_codes else None

    rows = []
    for threshold in threshold_grid(args.min_threshold, args.max_threshold, args.step):
        y_pred = (probs >= threshold).astype(np.float32)
        macro_f1 = float(f1_score(y_true, y_pred, average="macro", zero_division=0))
        micro_f1 = float(f1_score(y_true, y_pred, average="micro", zero_division=0))
        abn = abnormal_metrics(y_true, y_pred, normal_idx)
        rows.append(
            {
                "threshold": threshold,
                "macro_f1": macro_f1,
                "micro_f1": micro_f1,
                "abnormal_recall": abn["recall"],
                "abnormal_precision": abn["precision"],
                "abnormal_f1": abn["f1"],
            }
        )

    eligible = [r for r in rows if r["abnormal_precision"] >= args.min_abnormal_precision]
    selection_pool = eligible if eligible else rows

    best = max(
        selection_pool,
        key=lambda r: (r["abnormal_recall"], r["abnormal_f1"], r["macro_f1"]),
    )

    csv_path = output_dir / f"{args.output_prefix}.csv"
    with csv_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=[
                "threshold",
                "macro_f1",
                "micro_f1",
                "abnormal_recall",
                "abnormal_precision",
                "abnormal_f1",
            ],
        )
        writer.writeheader()
        writer.writerows(rows)

    summary = {
        "model_path": str(model_path),
        "verification_dataset": str(data_path),
        "grid": {
            "min_threshold": args.min_threshold,
            "max_threshold": args.max_threshold,
            "step": args.step,
            "num_points": len(rows),
        },
        "min_abnormal_precision": args.min_abnormal_precision,
        "used_precision_constraint": bool(eligible),
        "best": best,
        "all_rows_csv": str(csv_path),
    }

    summary_path = output_dir / f"{args.output_prefix}.json"
    summary_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")

    best_threshold_path = Path(args.write_best_threshold_json).resolve()
    best_threshold_path.parent.mkdir(parents=True, exist_ok=True)
    best_threshold_path.write_text(
        json.dumps(
            {
                "best_threshold": best["threshold"],
                "selection_objective": "max abnormal_recall, tie-break by abnormal_f1 then macro_f1",
                "min_abnormal_precision": args.min_abnormal_precision,
            },
            indent=2,
        ),
        encoding="utf-8",
    )

    print("Threshold tuning complete")
    print(
        "Selected threshold "
        f"{best['threshold']:.3f} with abnormal recall={best['abnormal_recall']:.4f}, "
        f"precision={best['abnormal_precision']:.4f}, f1={best['abnormal_f1']:.4f}, macro_f1={best['macro_f1']:.4f}"
    )
    print(f"Saved grid CSV: {csv_path}")
    print(f"Saved summary JSON: {summary_path}")
    print(f"Saved best threshold JSON: {best_threshold_path}")


if __name__ == "__main__":
    main()
