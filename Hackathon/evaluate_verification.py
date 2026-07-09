from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path
from typing import Any

import numpy as np
import torch
from sklearn.metrics import classification_report, f1_score, roc_auc_score

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


def write_per_class_csv(report_dict: dict[str, Any], class_codes: list[str], out_csv: Path) -> None:
    out_csv.parent.mkdir(parents=True, exist_ok=True)
    with out_csv.open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["class_code", "precision", "recall", "f1-score", "support"])
        for code in class_codes:
            row = report_dict.get(code, {})
            writer.writerow(
                [
                    code,
                    float(row.get("precision", 0.0)),
                    float(row.get("recall", 0.0)),
                    float(row.get("f1-score", 0.0)),
                    float(row.get("support", 0.0)),
                ]
            )


def main() -> None:
    parser = argparse.ArgumentParser(description="Evaluate trained model on verification split")
    parser.add_argument("--model-path", default="artifacts/singlelead_cnn.pt", help="Path to model checkpoint")
    parser.add_argument(
        "--verification-dataset",
        default="processed/verification_singlelead_60s.npz",
        help="Path to verification npz",
    )
    parser.add_argument("--threshold", type=float, help="Sigmoid threshold. Defaults to checkpoint threshold or 0.5")
    parser.add_argument("--batch-size", type=int, default=64)
    parser.add_argument("--output-dir", default="reports", help="Directory for evaluation artifacts")
    parser.add_argument("--output-prefix", default="verification_eval", help="Output filename prefix")
    args = parser.parse_args()

    model_path = Path(args.model_path).resolve()
    data_path = Path(args.verification_dataset).resolve()
    output_dir = Path(args.output_dir).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    ckpt = torch.load(model_path, map_location="cpu")
    class_codes = ckpt.get("class_codes") or ["426783006"]
    threshold = float(args.threshold if args.threshold is not None else ckpt.get("threshold", 0.5))

    data = np.load(data_path, allow_pickle=True)
    X = data["X"].astype(np.float32)
    y_true = data["y"].astype(np.float32)

    model = SingleLeadCNN(num_classes=len(class_codes))
    model.load_state_dict(ckpt["model_state_dict"])

    probs = run_inference(model, X, args.batch_size)
    y_pred = (probs >= threshold).astype(np.float32)

    macro_f1 = float(f1_score(y_true, y_pred, average="macro", zero_division=0))
    micro_f1 = float(f1_score(y_true, y_pred, average="micro", zero_division=0))

    normal_idx = class_codes.index(NORMAL_SINUS_CODE) if NORMAL_SINUS_CODE in class_codes else None
    abn = abnormal_metrics(y_true, y_pred, normal_idx)

    report_dict = classification_report(
        y_true,
        y_pred,
        target_names=class_codes,
        output_dict=True,
        zero_division=0,
    )

    try:
        macro_auroc = float(roc_auc_score(y_true, probs, average="macro"))
    except Exception:
        macro_auroc = float("nan")

    summary = {
        "model_path": str(model_path),
        "verification_dataset": str(data_path),
        "threshold": threshold,
        "num_samples": int(len(X)),
        "num_classes": int(y_true.shape[1]),
        "macro_f1": macro_f1,
        "micro_f1": micro_f1,
        "macro_auroc": macro_auroc,
        "abnormal_recall": abn["recall"],
        "abnormal_precision": abn["precision"],
        "abnormal_f1": abn["f1"],
        "classification_report": report_dict,
    }

    summary_path = output_dir / f"{args.output_prefix}.json"
    summary_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")

    per_class_csv = output_dir / f"{args.output_prefix}_per_class.csv"
    write_per_class_csv(report_dict, class_codes, per_class_csv)

    print("Verification evaluation complete")
    print(f"threshold={threshold:.3f} macro_f1={macro_f1:.4f} micro_f1={micro_f1:.4f} macro_auroc={macro_auroc}")
    print(
        "abnormal metrics: "
        f"recall={abn['recall']:.4f} precision={abn['precision']:.4f} f1={abn['f1']:.4f}"
    )
    print(f"Saved summary JSON: {summary_path}")
    print(f"Saved per-class CSV: {per_class_csv}")


if __name__ == "__main__":
    main()
