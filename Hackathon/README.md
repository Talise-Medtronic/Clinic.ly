# Single-Lead ECG Rhythm Pipeline (Hackathon Baseline)

This baseline creates a full workflow for PhysioNet Challenge 2020 data:

1. Preprocess records into fixed 60-second single-lead segments
2. Train a multi-label rhythm classifier on all diagnosis codes found in the extracted data
3. Run inference from your app via CLI JSON output

The classifier now supports full multi-label diagnosis output instead of reducing to 3 classes.

## 1) Setup

```powershell
cd C:\Users\barabs1\Desktop\Hackathon
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## 2) Download and preprocess in one command

This downloads and extracts Challenge 2020, preprocesses records, and creates:

- `processed/train_singlelead_60s.npz`
- `processed/verification_singlelead_60s.npz`

The split is grouped by record/file ID so segments from the same file group stay in only one split.

```powershell
python preprocess_physionet2020.py \
  --auto-download \
  --download-dir "D:\physionet\challenge2020" \
  --physionet-version 1.0.2 \
  --output-dir processed \
  --lead II \
  --segment-seconds 60 \
  --target-fs 250 \
  --verification-fraction 0.2 \
  --split-seed 42 \
  --debug-samples 5
```

Debug output prints sample record IDs, diagnosis code lists, and first signal points to terminal.

If you already downloaded data manually, you can still use:

```powershell
python preprocess_physionet2020.py \
  --data-root "D:\physionet\challenge2020\challenge-2020-1.0.2\training" \
  --output-dir processed \
  --verification-fraction 0.2
```

## 3) Train model

```powershell
python train_singlelead_60s.py \
  --train-dataset processed\train_singlelead_60s.npz \
  --verification-dataset processed\verification_singlelead_60s.npz \
  --metadata processed\metadata.json \
  --model-out artifacts\singlelead_cnn.pt \
  --epochs 15 \
  --batch-size 32 \
  --threshold 0.5 \
  --abnormal-sample-weight 1.2
```

Debug output prints dataset shape, sample active labels, and batch values.
Training output includes abnormal verification recall, precision, and F1.

## 4) Inference (app-callable)

### Option A: call with CSV segment

```powershell
python predict_rhythm.py \
  --model-path artifacts\singlelead_cnn.pt \
  --input-csv sample_segment.csv \
  --source-fs 250 \
  --threshold 0.5 \
  --explain-method both \
  --explain-dir outputs\explanations \
  --json-out outputs\prediction.json
```

### Option B: call directly from WFDB record

```powershell
python predict_rhythm.py \
  --model-path artifacts\singlelead_cnn.pt \
  --wfdb-record "D:\physionet\challenge2020\training\A0001" \
  --lead II \
  --threshold 0.5 \
  --explain-method gradcam \
  --explain-dir outputs\explanations
```

The script prints JSON to stdout and can also write file JSON via `--json-out`.
If any predicted class is non-normal, explainability PNG files are generated and their paths are returned in `explainability_images` in the JSON output.
Supported explainability methods are `saliency`, `gradcam`, or `both`.

## Notes

- This is a practical starter baseline. You can improve model quality with better label mapping, augmentation, class weighting, and temporal architectures.
- Labels are multi-hot encoded from all diagnosis codes discovered in the extracted dataset and stored in `processed/metadata.json` as `class_codes`.
- The official hidden Challenge test set is not publicly downloadable; this pipeline creates a local verification split from the public training data for demo use.
