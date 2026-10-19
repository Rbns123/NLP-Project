import re
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from backend.core.normalization import normalize_metric_name, normalize_dataset_name, normalize_numeric_value
from backend.core.scientific_ner import GAZETTEER

class ResultTriplet(BaseModel):
    id: str
    method: str
    dataset: str
    metric: str
    raw_value: str
    normalized_value: Optional[float]
    unit: Optional[str]
    source_sentence: str
    source_section: str
    section_id: str
    confidence: float
    engine: str

# Common quantitative metric patterns
# e.g., "achieves an F1 of 88.5%", "accuracy reached 92.4", "BLEU-4 score of 34.2"
METRIC_VALUE_PATTERN = re.compile(
    r"\b([A-Za-z0-9\-]+(?:\s+[A-Za-z0-9\-]+)?)\s+(?:of|is|was|reached|achieved|yielded|scores?|results?|equal to|=)\s*([0-9]+\.?[0-9]*%?)",
    re.IGNORECASE
)

def extract_triplets_from_text(
    sentence: str,
    section_title: str,
    section_id: str
) -> List[ResultTriplet]:
    """
    Extracts (method, dataset, metric, value, source section) from sentences.
    Uses pattern recognition and context lookup.
    """
    triplets = []
    
    # 1. Identify methods mentioned in the sentence
    methods_found = []
    for m in GAZETTEER["METHOD"]:
        if re.search(rf"\b{re.escape(m)}\b", sentence, re.IGNORECASE):
            methods_found.append(m.upper())
            
    # Also check generic model terms like "our model", "our approach", "proposed architecture"
    if not methods_found:
        if re.search(r"\b(our\s+(?:model|method|approach|framework|system)|proposed\s+(?:model|method))\b", sentence, re.IGNORECASE):
            methods_found.append("Proposed Method")

    # 2. Identify datasets mentioned
    datasets_found = []
    for d in GAZETTEER["DATASET"]:
        if re.search(rf"\b{re.escape(d)}\b", sentence, re.IGNORECASE):
            datasets_found.append(normalize_dataset_name(d))

    # 3. Match metrics and numbers
    # Sort metrics by length descending to match 'f1-score' or 'f1 score' before 'f1'
    sorted_metrics = sorted(list(set(GAZETTEER["METRIC"])), key=len, reverse=True)
    seen_metric_spans = set()

    for metric_kw in sorted_metrics:
        pat = re.compile(
            rf"\b({re.escape(metric_kw)})\b(?:\s+(?:score|measure))?\s*(?:of|is|was|reaches?|achieves?|:=|=|:)?\s*([0-9]+\.?[0-9]*%?)",
            re.IGNORECASE
        )
        for match in pat.finditer(sentence):
            span = match.span()
            if any(s[0] <= span[0] and span[1] <= s[1] for s in seen_metric_spans):
                continue
            seen_metric_spans.add(span)

            raw_metric = match.group(1)
            raw_val = match.group(2)
            
            # Skip pure integer years (e.g., 2019, 2024) unless accompanied by %
            if raw_val.isdigit() and len(raw_val) == 4 and int(raw_val) in range(1990, 2030):
                continue
            
            norm_num = normalize_numeric_value(raw_val)
            if norm_num["value"] is None:
                continue

            method = methods_found[0] if methods_found else "Not specified"
            dataset = datasets_found[0] if datasets_found else "Not specified"
            
            triplets.append(ResultTriplet(
                id=f"trip_{section_id}_{len(triplets)+1}",
                method=method,
                dataset=dataset,
                metric=normalize_metric_name(raw_metric),
                raw_value=raw_val,
                normalized_value=norm_num["value"],
                unit=norm_num["unit"],
                source_sentence=sentence.strip(),
                source_section=section_title,
                section_id=section_id,
                confidence=0.88 if methods_found and datasets_found else 0.72,
                engine="rule_triplet_extractor"
            ))

    return triplets

def extract_result_triplets(sections: List[Any]) -> List[ResultTriplet]:
    """
    Scans results and experimental sections for quantifiable triplets.
    """
    all_triplets = []
    for sec in sections:
        # Prioritize results, experiments, discussion, and abstract
        if sec.section_type in ("results", "experiments", "abstract", "discussion", "conclusion"):
            sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", sec.text) if s.strip()]
            for sent in sentences:
                sent_triplets = extract_triplets_from_text(sent, sec.title, sec.id)
                all_triplets.extend(sent_triplets)
    return all_triplets
