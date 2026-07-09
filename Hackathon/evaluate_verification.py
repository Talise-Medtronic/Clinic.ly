from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import torch
from sklearn.metrics import classification_report, f1_score

from ecg_pipeline.labels import find_normal_class_index
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


def main() -> None:
    parser = argparse.ArgumentParser(description="Evaluate model on verification split")
    parser.add_argument("--model-path", default="artifacts/singlelead_cnn.pt")
    parser.add_argument("--verification-dataset", default="processed/verification_singlelead_60s.npz")
    parser.add_argument("--threshold", type=float, default=None)
    parser.add_argument("--batch-size", type=int, default=64)
    parser.add_argument("--report-json", default="reports/verification_report.json")
    args = parser.parse_args()

    model_path = Path(args.model_path).resolve()
    data_path = Path(args.verification_dataset).resolve()
    report_path = Path(args.report_json).resolve()
    report_path.parent.mkdir(parents=True, exist_ok=True)

    ckpt = torch.load(model_path, map_location="cpu")
    class_codes = ckpt.get("class_codes") or ["N", "AFIB", "AFL", "OTHER"]
    threshold = float(args.threshold if args.threshold is not None else ckpt.get("threshold", 0.5))

    data = np.load(data_path, allow_pickle=True)
    X = data["X"].astype(np.float32)
    y_true = data["y"].astype(np.float32)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = SingleLeadCNN(num_classes=len(class_codes)).to(device)
    model.load_state_dict(ckpt["model_state_dict"])
    model.eval()

    probs = []
    with torch.no_grad():
        for start in range(0, len(X), args.batch_size):
            xb = torch.from_numpy(X[start : start + args.batch_size]).unsqueeze(1).to(device)
            logits = model(xb)
            probs.append(torch.sigmoid(logits).cpu().numpy())

    probs_arr = np.concatenate(probs, axis=0)
    y_pred = (probs_arr >= threshold).astype(np.float32)

    macro_f1 = float(f1_score(y_true, y_pred, average="macro", zero_division=0))
    micro_f1 = float(f1_score(y_true, y_pred, average="micro", zero_division=0))
    normal_idx = find_normal_class_index(class_codes)
    abn = abnormal_metrics(y_true, y_pred, normal_idx)

    report = classification_report(
        y_true,
        y_pred,
        target_names=class_codes,
        output_dict=True,
        zero_division=0,
    )

    result = {
        "threshold": threshold,
        "num_samples": int(len(X)),
        "macro_f1": macro_f1,
        "micro_f1": micro_f1,
        "abnormal_recall": abn["recall"],
        "abnormal_precision": abn["precision"],
        "abnormal_f1": abn["f1"],
        "classification_report": report,
    }
    report_path.write_text(json.dumps(result, indent=2), encoding="utf-8")

    print("Verification complete")
    print(f"macro_f1={macro_f1:.4f} micro_f1={micro_f1:.4f}")
    print(
        "abnormal metrics: "
        f"recall={abn['recall']:.4f} precision={abn['precision']:.4f} f1={abn['f1']:.4f}"
    )
    print(f"Saved report: {report_path}")


if __name__ == "__main__":
    main()
