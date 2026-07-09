from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Dict

import numpy as np
import torch
import wfdb

from ecg_pipeline.model import SingleLeadCNN
from ecg_pipeline.signal_utils import ensure_fixed_length, resample_signal, zscore


def load_signal_from_csv(path: Path) -> np.ndarray:
    data = np.loadtxt(path, delimiter=",")
    if data.ndim > 1:
        data = data[:, 0]
    return data.astype(np.float32)


def load_signal_from_npy(path: Path) -> np.ndarray:
    data = np.load(path)
    if data.ndim > 1:
        data = data.reshape(-1)
    return data.astype(np.float32)


def load_signal_from_wfdb(record_path: Path, lead: str) -> tuple[np.ndarray, float, str]:
    record = wfdb.rdrecord(str(record_path))
    signal = record.p_signal
    if signal is None:
        raise ValueError("WFDB record has no p_signal")

    names = [str(n) for n in (record.sig_name or [])]
    if names:
        lowered = [n.lower() for n in names]
        if lead.lower() in lowered:
            idx = lowered.index(lead.lower())
            return signal[:, idx].astype(np.float32), float(record.fs), names[idx]
        return signal[:, 0].astype(np.float32), float(record.fs), names[0]

    return signal[:, 0].astype(np.float32), float(record.fs), "unknown"


def main() -> None:
    parser = argparse.ArgumentParser(description="Run rhythm inference on a single 60-second segment")
    parser.add_argument("--model-path", default="artifacts/singlelead_cnn.pt", help="Path to trained model checkpoint")
    parser.add_argument("--input-csv", help="CSV file with one column of ECG values")
    parser.add_argument("--input-npy", help="NPY file with ECG values")
    parser.add_argument("--wfdb-record", help="WFDB record path without extension")
    parser.add_argument("--lead", default="II", help="Lead to use for WFDB input")
    parser.add_argument("--source-fs", type=float, default=250.0, help="Source sampling rate for CSV/NPY")
    parser.add_argument("--threshold", type=float, default=0.5, help="Sigmoid threshold for positive labels")
    parser.add_argument("--json-out", help="Optional output path for JSON result")
    args = parser.parse_args()

    model_path = Path(args.model_path).resolve()
    ckpt = torch.load(model_path, map_location="cpu")

    class_codes = ckpt.get("class_codes", ["426783006"])
    class_descriptions: Dict[str, str] = ckpt.get("class_descriptions", {})
    preprocessing: Dict = ckpt.get("preprocessing", {})
    target_fs = int(preprocessing.get("target_fs", 250))
    segment_seconds = int(preprocessing.get("segment_seconds", 60))
    target_samples = target_fs * segment_seconds

    if args.input_csv:
        signal = load_signal_from_csv(Path(args.input_csv).resolve())
        source_fs = float(args.source_fs)
        source_desc = f"csv:{args.input_csv}"
    elif args.input_npy:
        signal = load_signal_from_npy(Path(args.input_npy).resolve())
        source_fs = float(args.source_fs)
        source_desc = f"npy:{args.input_npy}"
    elif args.wfdb_record:
        signal, source_fs, actual_lead = load_signal_from_wfdb(Path(args.wfdb_record).resolve(), args.lead)
        source_desc = f"wfdb:{args.wfdb_record}:lead={actual_lead}"
    else:
        raise ValueError("Provide one of --input-csv, --input-npy, or --wfdb-record")

    proc = resample_signal(signal, source_fs, target_fs)
    proc = ensure_fixed_length(proc, target_samples)
    proc = zscore(proc)

    print(f"[debug] source={source_desc}")
    print(f"[debug] processed length={len(proc)} first10={np.round(proc[:10], 4).tolist()}")

    x = torch.from_numpy(proc).unsqueeze(0).unsqueeze(0)

    model = SingleLeadCNN(num_classes=len(class_codes))
    model.load_state_dict(ckpt["model_state_dict"])
    model.eval()

    with torch.no_grad():
        logits = model(x).cpu().numpy()[0]
    probs = 1.0 / (1.0 + np.exp(-logits))

    active_indices = [i for i, p in enumerate(probs.tolist()) if p >= args.threshold]
    if not active_indices:
        active_indices = [int(np.argmax(probs))]

    predicted_codes = [class_codes[i] for i in active_indices]
    result = {
        "predicted_codes": predicted_codes,
        "predicted_descriptions": [class_descriptions.get(code, "") for code in predicted_codes],
        "probabilities": {class_codes[i]: float(probs[i]) for i in range(len(class_codes))},
        "threshold": float(args.threshold),
        "target_fs": target_fs,
        "segment_seconds": segment_seconds,
    }

    print(json.dumps(result, indent=2))

    if args.json_out:
        out_path = Path(args.json_out).resolve()
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(json.dumps(result, indent=2), encoding="utf-8")
        print(f"Saved JSON output to: {out_path}")


if __name__ == "__main__":
    main()
