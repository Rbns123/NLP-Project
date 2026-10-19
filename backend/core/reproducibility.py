import re
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class ReproducibilityItem(BaseModel):
    key: str
    label: str
    status: str       # "found" or "not found in document"
    evidence_text: Optional[str] = None
    source_section: Optional[str] = None
    confidence: float
    description: str

class ReproducibilityReport(BaseModel):
    score: int        # 0 to 100
    rating: str       # High, Moderate, Low
    checklist: List[ReproducibilityItem]
    missing_items: List[str]
    total_checks: int
    passed_checks: int
    engine: str = "rule_based_checklist"

# Rules for reproducibility verification
CHECKLIST_RULES = [
    {
        "key": "code_repository",
        "label": "Code / Repository Link",
        "description": "Public source code or repository URL (GitHub, GitLab, etc.).",
        "patterns": [
            r"https?://github\.com/[a-zA-Z0-9_\-\./]+",
            r"https?://gitlab\.com/[a-zA-Z0-9_\-\./]+",
            r"\b(?:code is available at|source code will be released|repository:)\b"
        ]
    },
    {
        "key": "dataset_availability",
        "label": "Dataset Statement",
        "description": "Explicit statement of training/evaluation dataset used or public dataset availability.",
        "patterns": [
            r"\b(?:dataset(?:s)? is publicly available|downloaded from|dataset was collected|corpus contains|benchmark dataset)\b",
            r"\b(?:squad|glue|superglue|imdb|imagenet|scierc|pubmed)\b"
        ]
    },
    {
        "key": "hyperparameters",
        "label": "Hyperparameters",
        "description": "Learning rate, batch size, epochs, or optimizer configuration.",
        "patterns": [
            r"\b(?:learning rate|batch size|epochs?|adamw|adam optimizer|weight decay|warmup steps?)\b",
            r"\blr\s*=\s*[0-9\.e\-]+"
        ]
    },
    {
        "key": "random_seeds",
        "label": "Random Seeds",
        "description": "Specific random seed(s) for stochastic reproducibility.",
        "patterns": [
            r"\b(?:random seed|seed\s*=\s*\d+|seeds? (?:42|0|1|123|1234|2024))\b"
        ]
    },
    {
        "key": "hardware_specs",
        "label": "Hardware Specification",
        "description": "Compute infrastructure: GPUs, TPUs, Apple Silicon, or CPU clusters.",
        "patterns": [
            r"\b(?:nvidia|a100|v100|rtx\s*\d+|tpu|gpu|apple m\d+|trained on \d+ (?:gpus|nodes))\b"
        ]
    },
    {
        "key": "baselines",
        "label": "Baseline Comparisons",
        "description": "Explicit comparison against competitive baseline models or prior works.",
        "patterns": [
            r"\b(?:compared (?:with|against|to) baseline|competitive baselines|state-of-the-art baselines|prior work)\b"
        ]
    },
    {
        "key": "statistical_significance",
        "label": "Statistical Significance",
        "description": "Significance tests, p-values, confidence intervals, or standard deviations.",
        "patterns": [
            r"\b(?:p\s*<\s*0\.0[0-9]+|statistically significant|paired t-test|confidence interval|standard deviation|std dev|\bstd\b|±\s*[0-9\.]+)\b"
        ]
    }
]

def evaluate_reproducibility(sections: List[Any]) -> ReproducibilityReport:
    """
    Evaluates paper against standard reproducibility checklist.
    Uses 'not found in document' rather than 'absent'.
    """
    results: List[ReproducibilityItem] = []
    passed = 0

    for rule in CHECKLIST_RULES:
        found = False
        evidence = None
        found_sec = None

        for sec in sections:
            # Check lines/sentences
            for line in sec.text.split("\n"):
                if not line.strip():
                    continue
                for pat in rule["patterns"]:
                    m = re.search(pat, line, re.IGNORECASE)
                    if m:
                        found = True
                        evidence = line.strip()[:180]
                        found_sec = sec.title
                        break
                if found:
                    break
            if found:
                break

        if found:
            passed += 1
            results.append(ReproducibilityItem(
                key=rule["key"],
                label=rule["label"],
                status="found",
                evidence_text=evidence,
                source_section=found_sec,
                confidence=0.92,
                description=rule["description"]
            ))
        else:
            results.append(ReproducibilityItem(
                key=rule["key"],
                label=rule["label"],
                status="not found in document",
                evidence_text=None,
                source_section=None,
                confidence=0.85,
                description=rule["description"]
            ))

    total = len(CHECKLIST_RULES)
    score = int((passed / total) * 100) if total > 0 else 0
    rating = "High" if score >= 70 else ("Moderate" if score >= 40 else "Low")
    missing = [item.label for item in results if item.status == "not found in document"]

    return ReproducibilityReport(
        score=score,
        rating=rating,
        checklist=results,
        missing_items=missing,
        total_checks=total,
        passed_checks=passed,
        engine="rule_based_checklist"
    )
