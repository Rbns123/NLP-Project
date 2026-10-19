import pytest
from backend.core.triplets import extract_triplets_from_text
from backend.core.claims import classify_sentence_claim, analyze_claim_strength

def test_extract_triplets():
    sent = "Our BERT model achieves an F1 score of 88.5% on SQuAD."
    triplets = extract_triplets_from_text(sent, "4. Results", "sec_4")
    assert len(triplets) == 1
    t = triplets[0]
    assert t.method == "BERT"
    assert t.dataset == "SQuAD"
    assert t.metric == "F1-Score"
    assert t.normalized_value == 88.5
    assert t.unit == "%"
    assert t.source_section == "4. Results"

def test_claim_classification_novelty():
    sent = "We propose a novel framework that substantially improves parsing accuracy."
    claim = classify_sentence_claim(sent, "1. Introduction", "introduction", "sec_1", 1)
    assert claim is not None
    assert claim.claim_type == "novelty"
    assert claim.strength == "strong"

def test_claim_hedged_weakness():
    sent = "The results suggest that our approach may slightly reduce memory overhead."
    claim = classify_sentence_claim(sent, "5. Discussion", "discussion", "sec_5", 1)
    assert claim is not None
    assert claim.strength == "weak/hedged"
    assert "may" in claim.hedging_cues or "suggests" in claim.hedging_cues
