from __future__ import annotations

from typing import Dict, Iterable, List, Sequence

NORMAL_SINUS_CODE = "426783006"

# Official scored classes from the PhysioNet/CinC Challenge 2020 evaluation metric.
# Each tuple is (snomed_code, abbreviation, description).
SCORED_CLASS_INFO = [
    ("270492004", "IAVB", "1st degree av block"),
    ("164889003", "AF", "atrial fibrillation"),
    ("164890007", "AFL", "atrial flutter"),
    ("713427006", "CRBBB", "complete right bundle branch block"),
    ("284470004", "PAC", "premature atrial contraction"),
    ("63593006", "SVPB", "supraventricular premature beats"),
    ("427172004", "PVC", "premature ventricular contractions"),
    ("17338001", "VPB", "ventricular premature beats"),
    ("164947007", "LPR", "prolonged pr interval"),
    ("111975006", "LQT", "prolonged qt interval"),
    ("164917005", "QAb", "qwave abnormal"),
    ("47665007", "RAD", "right axis deviation"),
    ("59118001", "RBBB", "right bundle branch block"),
    ("427393009", "SA", "sinus arrhythmia"),
    ("426177001", "SB", "sinus bradycardia"),
    ("426783006", "NSR", "sinus rhythm"),
    ("427084000", "STach", "sinus tachycardia"),
    ("164934002", "TAb", "t wave abnormal"),
    ("59931005", "TInv", "t wave inversion"),
    ("164931005", "STE", "st elevation"),
    ("284470004", "PAC", "premature atrial contraction"),
    ("164930006", "STIAb", "st interval abnormal"),
    ("164861001", "MIs", "myocardial ischemia"),
    ("426627000", "Brady", "bradycardia"),
    ("733534002", "CLBBB", "complete left bundle branch block"),
    ("713426002", "IRBBB", "incomplete right bundle branch block"),
]

# Equivalent class mappings used by the Challenge.
EQUIVALENT_CODES: Dict[str, str] = {
    "713427006": "59118001",  # CRBBB -> RBBB
    "59118001": "59118001",
    "17338001": "427172004",  # VPB -> PVC
    "427172004": "427172004",
    "63593006": "284470004",  # SVPB -> PAC
    "284470004": "284470004",
    "426783006": "426783006",
}


def canonicalize_code(code: str) -> str:
    normalized = code.strip()
    return EQUIVALENT_CODES.get(normalized, normalized)


def clean_dx_codes(dx_codes: Iterable[str]) -> List[str]:
    return [c.strip() for c in dx_codes if c and c.strip()]


def discover_class_codes(dx_code_lists: Sequence[Sequence[str]]) -> List[str]:
    discovered = set()
    for codes in dx_code_lists:
        for code in codes:
            discovered.add(canonicalize_code(code))

    scored_order = [canonicalize_code(code) for code, _, _ in SCORED_CLASS_INFO]
    scored_unique_order = []
    seen = set()
    for code in scored_order:
        if code not in seen:
            seen.add(code)
            scored_unique_order.append(code)

    ordered = [code for code in scored_unique_order if code in discovered]
    extras = sorted(code for code in discovered if code not in set(scored_unique_order))
    return ordered + extras


def build_class_descriptions(class_codes: Sequence[str]) -> Dict[str, str]:
    by_code = {canonicalize_code(code): desc for code, _, desc in SCORED_CLASS_INFO}
    return {code: by_code.get(code, "unmapped diagnosis") for code in class_codes}


def multi_hot_from_codes(dx_codes: Sequence[str], class_codes: Sequence[str]) -> List[float]:
    indices = {code: i for i, code in enumerate(class_codes)}
    vec = [0.0] * len(class_codes)
    for code in dx_codes:
        canonical = canonicalize_code(code)
        idx = indices.get(canonical)
        if idx is not None:
            vec[idx] = 1.0
    return vec
