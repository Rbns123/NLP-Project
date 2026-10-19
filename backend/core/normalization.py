import re
from typing import Dict, Any, Optional

# Canonical dataset alias map
DATASET_ALIASES = {
    "squad": "SQuAD",
    "squad 1.1": "SQuAD v1.1",
    "squad 2.0": "SQuAD v2.0",
    "squad v1.1": "SQuAD v1.1",
    "squad v2.0": "SQuAD v2.0",
    "glue": "GLUE",
    "superglue": "SuperGLUE",
    "super glue": "SuperGLUE",
    "mnli": "MNLI",
    "sst-2": "SST-2",
    "sst2": "SST-2",
    "qnli": "QNLI",
    "qqp": "QQP",
    "rte": "RTE",
    "mrpc": "MRPC",
    "wnli": "WNLI",
    "scierc": "SciERC",
    "pubmed": "PubMed",
    "pubmed rct": "PubMed RCT",
    "pubmed 200k rct": "PubMed 200k RCT",
    "imdb": "IMDb",
    "cifar-10": "CIFAR-10",
    "cifar-100": "CIFAR-100",
    "imagenet": "ImageNet",
    "coco": "MS COCO",
    "ms-coco": "MS COCO",
    "conll-2003": "CoNLL-2003",
    "conll03": "CoNLL-2003"
}

# Canonical metric normalization map
METRIC_ALIASES = {
    "f1": "F1-Score",
    "f1 score": "F1-Score",
    "f1-score": "F1-Score",
    "f-score": "F1-Score",
    "f-measure": "F1-Score",
    "macro f1": "Macro-F1",
    "macro-f1": "Macro-F1",
    "micro f1": "Micro-F1",
    "micro-f1": "Micro-F1",
    "accuracy": "Accuracy",
    "acc": "Accuracy",
    "exact match": "Exact Match (EM)",
    "em": "Exact Match (EM)",
    "bleu": "BLEU",
    "bleu-4": "BLEU-4",
    "rouge": "ROUGE",
    "rouge-1": "ROUGE-1",
    "rouge-2": "ROUGE-2",
    "rouge-l": "ROUGE-L",
    "perplexity": "Perplexity (PPL)",
    "ppl": "Perplexity (PPL)",
    "precision": "Precision",
    "recall": "Recall",
    "auc": "AUC-ROC",
    "roc-auc": "AUC-ROC",
    "loss": "Loss",
    "cross-entropy": "Cross-Entropy Loss"
}

def normalize_dataset_name(name: str) -> str:
    """Normalizes dataset variants (e.g., 'squad v2.0' -> 'SQuAD v2.0')."""
    clean = name.strip()
    return DATASET_ALIASES.get(clean.lower(), clean)

def normalize_metric_name(name: str) -> str:
    """Normalizes metric variants (e.g., 'f-score', 'f1' -> 'F1-Score')."""
    clean = name.strip()
    return METRIC_ALIASES.get(clean.lower(), clean)

def normalize_numeric_value(raw_val: str) -> Dict[str, Any]:
    """
    Normalizes numeric strings, percentages, and units into standard floats & metadata.
    Example: '88.5%' -> {'value': 88.5, 'unit': '%', 'formatted': '88.5%'}
    """
    clean = raw_val.strip().replace(",", "")
    is_percentage = "%" in clean
    clean_no_unit = re.sub(r"[^\d\.\+\-]", "", clean)
    
    try:
        float_val = float(clean_no_unit)
        return {
            "value": float_val,
            "unit": "%" if is_percentage else None,
            "formatted": f"{float_val}%" if is_percentage else str(float_val)
        }
    except ValueError:
        return {
            "value": None,
            "unit": None,
            "formatted": raw_val.strip()
        }
