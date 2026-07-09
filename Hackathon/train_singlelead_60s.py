from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import torch
from sklearn.metrics import f1_score
from sklearn.metrics import classification_report
from sklearn.model_selection import GroupShuffleSplit
from torch import nn
from torch.utils.data import DataLoader, Dataset

from ecg_pipeline.labels import NORMAL_SINUS_CODE
from ecg_pipeline.model import SingleLeadCNN


class ECGDataset(Dataset):
    def __init__(self, X: np.ndarray, y: np.ndarray) -> None:
        self.X = X.astype(np.float32)
        self.y = y.astype(np.float32)

    def __len__(self) -> int:
        return len(self.y)

    def __getitem__(self, idx: int):
        x = torch.from_numpy(self.X[idx]).unsqueeze(0)
        y = torch.from_numpy(self.y[idx])
        return x, y


def evaluate(model: nn.Module, loader: DataLoader, device: torch.device, threshold: float):
    model.eval()
    all_preds = []
    all_targets = []
    with torch.no_grad():
        for xb, yb in loader:
            xb = xb.to(device)
            yb = yb.to(device)
            logits = model(xb)
            probs = torch.sigmoid(logits)
            preds = (probs >= threshold).float()
            all_preds.append(preds.cpu().numpy())
            all_targets.append(yb.cpu().numpy())

    if not all_targets:
        return 0.0, np.zeros((0, 0), dtype=np.float32), np.zeros((0, 0), dtype=np.float32)

    targets = np.concatenate(all_targets, axis=0)
    preds = np.concatenate(all_preds, axis=0)
    macro_f1 = float(f1_score(targets, preds, average="macro", zero_division=0))
    return macro_f1, targets, preds


def abnormal_metrics(targets: np.ndarray, preds: np.ndarray, normal_idx: int | None) -> dict:
    if targets.size == 0:
        return {"recall": 0.0, "precision": 0.0, "f1": 0.0}

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


def load_or_split_datasets(
    train_dataset_path: Path,
    verification_dataset_path: Path,
    dataset_path: Path,
    verification_fraction: float,
    seed: int,
) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    if train_dataset_path.exists() and verification_dataset_path.exists():
        train_data = np.load(train_dataset_path, allow_pickle=True)
        val_data = np.load(verification_dataset_path, allow_pickle=True)
        print("Using explicit train/verification split files")
        return train_data["X"], train_data["y"], val_data["X"], val_data["y"]

    data = np.load(dataset_path, allow_pickle=True)
    X = data["X"]
    y = data["y"]
    if "group_ids" in data:
        groups = data["group_ids"]
    elif "record_ids" in data:
        groups = np.array([Path(str(r)).name.split("__seg")[0] for r in data["record_ids"]])
    else:
        groups = np.array([f"g_{i}" for i in range(len(y))])

    splitter = GroupShuffleSplit(n_splits=1, test_size=verification_fraction, random_state=seed)
    train_idx, val_idx = next(splitter.split(X, y, groups=groups))
    print("Using fallback group-based split from full dataset")
    return X[train_idx], y[train_idx], X[val_idx], y[val_idx]


def main() -> None:
    parser = argparse.ArgumentParser(description="Train single-lead 60s ECG rhythm classifier")
    parser.add_argument("--train-dataset", default="processed/train_singlelead_60s.npz", help="Path to train split .npz")
    parser.add_argument("--verification-dataset", default="processed/verification_singlelead_60s.npz", help="Path to verification split .npz")
    parser.add_argument("--dataset", default="processed/dataset_singlelead_60s.npz", help="Path to preprocessed .npz")
    parser.add_argument("--metadata", default="processed/metadata.json", help="Path to preprocessing metadata JSON")
    parser.add_argument("--model-out", default="artifacts/singlelead_cnn.pt", help="Output model file")
    parser.add_argument("--epochs", type=int, default=15)
    parser.add_argument("--batch-size", type=int, default=32)
    parser.add_argument("--lr", type=float, default=1e-3)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--threshold", type=float, default=0.5, help="Sigmoid threshold for label activation")
    parser.add_argument("--verification-fraction", type=float, default=0.2, help="Fallback split fraction when train/verification files are unavailable")
    parser.add_argument("--abnormal-sample-weight", type=float, default=1.2, help="Loss multiplier for abnormal samples")
    parser.add_argument("--debug-batches", type=int, default=1, help="How many initial batches to print")
    args = parser.parse_args()

    torch.manual_seed(args.seed)
    np.random.seed(args.seed)

    train_dataset_path = Path(args.train_dataset).resolve()
    verification_dataset_path = Path(args.verification_dataset).resolve()
    dataset_path = Path(args.dataset).resolve()
    metadata_path = Path(args.metadata).resolve()
    model_out = Path(args.model_out).resolve()
    model_out.parent.mkdir(parents=True, exist_ok=True)

    X_train, y_train, X_val, y_val = load_or_split_datasets(
        train_dataset_path,
        verification_dataset_path,
        dataset_path,
        args.verification_fraction,
        args.seed,
    )
    X = np.concatenate([X_train, X_val], axis=0)
    y = np.concatenate([y_train, y_val], axis=0)

    class_codes = None
    class_descriptions = {}
    if metadata_path.exists():
        with metadata_path.open("r", encoding="utf-8") as f:
            metadata_in = json.load(f)
        class_codes = metadata_in.get("class_codes")
        class_descriptions = metadata_in.get("class_descriptions", {})

    if not class_codes:
        class_codes = [f"class_{i}" for i in range(y.shape[1])]

    normal_idx = class_codes.index(NORMAL_SINUS_CODE) if NORMAL_SINUS_CODE in class_codes else None

    print(f"Loaded X shape={X.shape}, y shape={y.shape}")
    print(f"Sample labels (first row, active class idx): {np.where(y[0] > 0.5)[0].tolist()}")
    print(f"Sample data row first10: {np.round(X[0][:10], 4).tolist()}")

    train_loader = DataLoader(ECGDataset(X_train, y_train), batch_size=args.batch_size, shuffle=True)
    val_loader = DataLoader(ECGDataset(X_val, y_val), batch_size=args.batch_size, shuffle=False)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = SingleLeadCNN(num_classes=y.shape[1]).to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=args.lr)

    pos = np.sum(y_train, axis=0)
    neg = y_train.shape[0] - pos
    pos_weight = torch.tensor(neg / (pos + 1e-6), dtype=torch.float32, device=device)
    criterion = nn.BCEWithLogitsLoss(pos_weight=pos_weight, reduction="none")

    best_val_f1 = -1.0
    best_state = None

    for epoch in range(1, args.epochs + 1):
        model.train()
        running_loss = 0.0

        for batch_idx, (xb, yb) in enumerate(train_loader, start=1):
            xb = xb.to(device)
            yb = yb.to(device)

            if epoch == 1 and batch_idx <= args.debug_batches:
                print(
                    f"[debug] batch={batch_idx} labels(first2)={yb[:2].cpu().tolist()} "
                    f"data_first10={torch.round(xb[0, 0, :10] * 10000) / 10000}"
                )

            optimizer.zero_grad()
            logits = model(xb)
            raw_loss = criterion(logits, yb.float())
            sample_loss = raw_loss.mean(dim=1)

            if normal_idx is None:
                abnormal_mask = (yb > 0.5).any(dim=1)
            else:
                keep = [i for i in range(yb.shape[1]) if i != normal_idx]
                abnormal_mask = (yb[:, keep] > 0.5).any(dim=1)

            sample_weights = torch.ones_like(sample_loss)
            sample_weights[abnormal_mask] = float(args.abnormal_sample_weight)
            loss = (sample_loss * sample_weights).mean()
            loss.backward()
            optimizer.step()

            running_loss += float(loss.item())

        val_f1, val_targets, val_preds = evaluate(model, val_loader, device, args.threshold)
        avg_loss = running_loss / max(len(train_loader), 1)
        print(f"epoch={epoch:02d} loss={avg_loss:.4f} val_macro_f1={val_f1:.4f}")

        if val_f1 > best_val_f1:
            best_val_f1 = val_f1
            best_state = {k: v.cpu() for k, v in model.state_dict().items()}

    report = classification_report(
        val_targets,
        val_preds,
        target_names=class_codes,
        zero_division=0,
    )
    print("\nValidation classification report")
    print(report)

    abn = abnormal_metrics(val_targets, val_preds, normal_idx)
    print(
        "Verification abnormal metrics: "
        f"recall={abn['recall']:.4f} precision={abn['precision']:.4f} f1={abn['f1']:.4f}"
    )

    metadata = {}
    if metadata_path.exists():
        with metadata_path.open("r", encoding="utf-8") as f:
            metadata = json.load(f)

    checkpoint = {
        "model_state_dict": best_state if best_state is not None else model.state_dict(),
        "class_codes": class_codes,
        "class_descriptions": class_descriptions,
        "input_shape": [1, int(X.shape[1])],
        "preprocessing": metadata,
        "threshold": float(args.threshold),
        "abnormal_sample_weight": float(args.abnormal_sample_weight),
        "best_val_macro_f1": float(best_val_f1),
    }
    torch.save(checkpoint, model_out)

    print(f"Saved model checkpoint: {model_out}")


if __name__ == "__main__":
    main()
