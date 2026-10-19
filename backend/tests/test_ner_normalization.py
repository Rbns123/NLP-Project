import pytest
from backend.core.normalization import normalize_dataset_name, normalize_metric_name, normalize_numeric_value
from backend.core.scientific_ner import extract_entities_from_text
from backend.core.schemas import SectionData

def test_normalization():
    assert normalize_dataset_name("squad 2.0") == "SQuAD v2.0"
    assert normalize_dataset_name("superglue") == "SuperGLUE"
    assert normalize_metric_name("f1 score") == "F1-Score"
    assert normalize_metric_name("exact match") == "Exact Match (EM)"
    
    num_data = normalize_numeric_value("92.4%")
    assert num_data["value"] == 92.4
    assert num_data["unit"] == "%"

def test_scientific_ner_extraction():
    text = (
        "We evaluate our RoBERTa-large model on the SQuAD 2.0 benchmark using F1 score. "
        "The experiments were implemented in PyTorch using the HuggingFace Transformers library."
    )
    entities = extract_entities_from_text(text, "4. Experiments", "sec_4")
    
    labels = {e.label: e.normalized_text for e in entities}
    assert "METHOD" in labels
    assert "DATASET" in labels
    assert "METRIC" in labels
    assert "TOOL" in labels
    assert any(e.normalized_text == "SQuAD v2.0" for e in entities)
    assert any(e.normalized_text == "F1-Score" for e in entities)
