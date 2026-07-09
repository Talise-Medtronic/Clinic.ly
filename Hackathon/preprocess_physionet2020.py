from __future__ import annotations

import argparse
import json
from collections import Counter
from pathlib import Path
from typing import List, Tuple
from urllib.request import urlretrieve
import zipfile

import numpy as np
from sklearn.model_selection import GroupShuffleSplit
import wfdb

from ecg_pipeline.labels import (
    build_class_descriptions,
    clean_dx_codes,
    discover_class_codes,
    multi_hot_from_codes,
)
from ecg_pipeline.signal_utils import ensure_fixed_length, resample_signal, zscore


def parse_dx_codes(comments: List[str]) -> List[str]:
    for line in comments:
        if line.startswith("Dx:"):
            return [x.strip() for x in line.replace("Dx:", "").split(",") if x.strip()]
    return []


def find_records(data_root: Path) -> List[Path]:
    headers = sorted(data_root.rglob("*.hea"))
    return [h.with_suffix("") for h in headers]


def download_and_extract_challenge(download_dir: Path, version: str) -> Path:
    download_dir.mkdir(parents=True, exist_ok=True)
    zip_path = download_dir / f"challenge-2020-{version}.zip"
    extracted_root = download_dir / f"challenge-2020-{version}"
    training_dir = extracted_root / "training"

    if training_dir.exists():
        print(f"Found existing extracted dataset at {training_dir}")
        return training_dir

    url = f"https://physionet.org/content/challenge-2020/get-zip/{version}/"
    if not zip_path.exists():
        print(f"Downloading Challenge 2020 ZIP from: {url}")
        urlretrieve(url, str(zip_path))

    print(f"Extracting ZIP to: {download_dir}")
    with zipfile.ZipFile(zip_path, "r") as zf:
        zf.extractall(download_dir)

    if training_dir.exists():
        return training_dir

    found = list(download_dir.rglob("training"))
    if found:
        return found[0]

    raise FileNotFoundError("Could not locate extracted training directory after download")


def group_id_from_record_id(record_id: str) -> str:
    base = Path(record_id).name
    return base.split("__seg")[0]


def pick_lead(record: wfdb.Record, requested_lead: str) -> Tuple[np.ndarray, str]:
    signal = record.p_signal
    if signal is None:
        raise ValueError("Record has no p_signal")

    lead_names = [str(n) for n in (record.sig_name or [])]
    if lead_names:
        lowered = [n.lower() for n in lead_names]
        if requested_lead.lower() in lowered:
            idx = lowered.index(requested_lead.lower())
            return signal[:, idx], lead_names[idx]
        return signal[:, 0], lead_names[0]

    return signal[:, 0], "unknown"


def main() -> None:
    parser = argparse.ArgumentParser(description="Preprocess PhysioNet Challenge 2020 ECG records")
    parser.add_argument("--data-root", help="Root folder containing Challenge 2020 training records")
    parser.add_argument("--auto-download", action="store_true", help="Download and extract Challenge 2020 before preprocessing")
    parser.add_argument("--download-dir", default="raw", help="Where to store downloaded/extracted Challenge files")
    parser.add_argument("--physionet-version", default="1.0.2", help="Challenge dataset version")
    parser.add_argument("--output-dir", default="processed", help="Output directory for preprocessed arrays")
    parser.add_argument("--lead", default="II", help="Desired lead name; falls back to first available lead")
    parser.add_argument("--segment-seconds", type=int, default=60, help="Segment length in seconds")
    parser.add_argument("--target-fs", type=int, default=250, help="Target sampling rate")
    parser.add_argument("--verification-fraction", type=float, default=0.2, help="Fraction for verification split")
    parser.add_argument("--split-seed", type=int, default=42, help="Random seed for train/verification split")
    parser.add_argument("--debug-samples", type=int, default=5, help="How many sample rows to print")
    args = parser.parse_args()

    if args.auto_download:
        data_root = download_and_extract_challenge(Path(args.download_dir).resolve(), args.physionet_version)
    elif args.data_root:
        data_root = Path(args.data_root).resolve()
    else:
        raise ValueError("Provide --data-root or set --auto-download")

    output_dir = Path(args.output_dir).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    target_samples = int(args.segment_seconds * args.target_fs)
    records = find_records(data_root)
    if not records:
        raise FileNotFoundError(f"No .hea files found under {data_root}")

    X = []
    dx_lists = []
    record_ids = []
    used_leads = []

    print(f"Found {len(records)} records. Starting preprocessing...")

    skipped = 0
    for idx, record_path in enumerate(records, start=1):
        try:
            record = wfdb.rdrecord(str(record_path))
            signal_1d, actual_lead = pick_lead(record, args.lead)
            fs = float(record.fs)
            dx_codes = clean_dx_codes(parse_dx_codes(record.comments or []))

            proc = resample_signal(signal_1d.astype(np.float32), fs, args.target_fs)
            proc = ensure_fixed_length(proc, target_samples)
            proc = zscore(proc)

            X.append(proc)
            dx_lists.append(dx_codes)
            record_ids.append(str(record_path.relative_to(data_root)).replace("\\", "/"))
            used_leads.append(actual_lead)

            if idx <= args.debug_samples:
                print(
                    f"[debug] record={record_ids[-1]} lead={actual_lead} fs={fs:.1f} "
                    f"dx_codes={dx_codes} first10={np.round(proc[:10], 4).tolist()}"
                )
        except Exception as exc:  # noqa: BLE001
            skipped += 1
            print(f"[warn] skipped {record_path}: {exc}")

    if not X:
        raise RuntimeError("No records were successfully preprocessed")

    X_arr = np.stack(X).astype(np.float32)
    class_codes = discover_class_codes(dx_lists)
    class_descriptions = build_class_descriptions(class_codes)
    y_arr = np.array([multi_hot_from_codes(dx_codes, class_codes) for dx_codes in dx_lists], dtype=np.float32)
    ids_arr = np.array(record_ids)
    leads_arr = np.array(used_leads)
    group_ids_arr = np.array([group_id_from_record_id(rid) for rid in record_ids])

    np.savez_compressed(
        output_dir / "dataset_singlelead_60s.npz",
        X=X_arr,
        y=y_arr,
        record_ids=ids_arr,
        used_leads=leads_arr,
        group_ids=group_ids_arr,
    )

    splitter = GroupShuffleSplit(n_splits=1, test_size=args.verification_fraction, random_state=args.split_seed)
    train_idx, verification_idx = next(splitter.split(X_arr, y_arr, groups=group_ids_arr))

    np.savez_compressed(
        output_dir / "train_singlelead_60s.npz",
        X=X_arr[train_idx],
        y=y_arr[train_idx],
        record_ids=ids_arr[train_idx],
        used_leads=leads_arr[train_idx],
        group_ids=group_ids_arr[train_idx],
    )

    np.savez_compressed(
        output_dir / "verification_singlelead_60s.npz",
        X=X_arr[verification_idx],
        y=y_arr[verification_idx],
        record_ids=ids_arr[verification_idx],
        used_leads=leads_arr[verification_idx],
        group_ids=group_ids_arr[verification_idx],
    )

    metadata = {
        "class_codes": class_codes,
        "class_descriptions": class_descriptions,
        "target_fs": args.target_fs,
        "segment_seconds": args.segment_seconds,
        "segment_samples": target_samples,
        "requested_lead": args.lead,
        "data_root": str(data_root),
        "num_samples": int(X_arr.shape[0]),
        "num_classes": int(len(class_codes)),
        "train_samples": int(len(train_idx)),
        "verification_samples": int(len(verification_idx)),
        "verification_fraction": args.verification_fraction,
        "split_seed": args.split_seed,
        "split_grouping": "record/file ID",
        "num_skipped": skipped,
    }
    with (output_dir / "metadata.json").open("w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    counts = Counter()
    for class_idx, code in enumerate(class_codes):
        counts[code] = int(y_arr[:, class_idx].sum())

    print("\nPreprocessing complete")
    print(f"Saved dataset to: {output_dir / 'dataset_singlelead_60s.npz'}")
    print(f"Saved train split to: {output_dir / 'train_singlelead_60s.npz'}")
    print(f"Saved verification split to: {output_dir / 'verification_singlelead_60s.npz'}")
    print(f"X shape: {X_arr.shape}")
    print(f"y shape: {y_arr.shape}")
    print(f"Train/verification sizes: {len(train_idx)}/{len(verification_idx)}")
    print(f"Discovered classes: {len(class_codes)}")
    for code in class_codes:
        desc = class_descriptions.get(code, "")
        print(f"label[{code}] ({desc}) = {counts.get(code, 0)}")


if __name__ == "__main__":
    main()
