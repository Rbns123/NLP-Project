import re
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class ScientificClaim(BaseModel):
    id: str
    sentence: str
    claim_type: str  # novelty, performance, comparison, limitation, future_work, background
    strength: str    # strong, moderate, weak/hedged
    hedging_cues: List[str]
    confidence: float
    rationale: str
    source_section: str
    section_id: str
    engine: str      # 'deterministic_rules', 'zero_shot_fallback', 'degraded_mode'

# Hedging cues indicate weak or cautious claims
HEDGING_CUES = [
    "may", "might", "could", "suggests", "indicates", "appears to", "seems to",
    "possibly", "potential", "tentatively", "partially", "preliminary", "likely"
]

# Boost cues indicate strong, confident claims
STRONG_CUES = [
    "demonstrates", "proves", "significantly outperforms", "substantially improves",
    "consistently beats", "state-of-the-art", "sota", "first to show", "breakthrough",
    "drastically", "clearly demonstrates", "unambiguously"
]

# Regex patterns for claim types
CLAIM_PATTERNS = {
    "novelty": [
        r"\b(?:we propose|we introduce|we present|first framework|new architecture|novel approach)\b",
        r"\b(?:to the best of our knowledge|innovative mechanism|novel method)\b"
    ],
    "performance": [
        r"\b(?:achieves|outperforms|scores|surpasses|reaches|attains|accuracy of|f1 of|reduce|reduces|decreases|boosts)\b",
        r"\b(?:state-of-the-art results?|leads to higher|reduces error|overhead)\b"
    ],
    "comparison": [
        r"\b(?:compared to|in comparison with|better than|faster than|superior to|baseline|ablation)\b",
        r"\b(?:outperforms competitive baselines|versus prior work)\b"
    ],
    "limitation": [
        r"\b(?:limitation|drawback|fails to|struggles with|bottleneck|computational overhead|does not generalize)\b",
        r"\b(?:constrained by|vulnerable to|restricted to|memory intensive)\b"
    ],
    "future_work": [
        r"\b(?:future work|we plan to|we intend to|remains open|will explore|promising direction)\b",
        r"\b(?:avenue for future research|in subsequent studies)\b"
    ],
    "background": [
        r"\b(?:previous studies have shown|traditionally|conventionally|it is well known|prior works?)\b"
    ]
}

def analyze_claim_strength(sentence: str) -> tuple[str, List[str]]:
    """Determines claim strength (strong, moderate, weak/hedged) based on lexical cues."""
    sentence_lower = sentence.lower()
    
    found_hedges = [cue for cue in HEDGING_CUES if re.search(rf"\b{re.escape(cue)}\b", sentence_lower)]
    found_strong = [cue for cue in STRONG_CUES if re.search(rf"\b{re.escape(cue)}\b", sentence_lower)]
    
    if found_hedges:
        return "weak/hedged", found_hedges
    elif found_strong:
        return "strong", found_strong
    else:
        return "moderate", []

def classify_sentence_claim(
    sentence: str,
    section_title: str,
    section_type: str,
    section_id: str,
    index: int
) -> Optional[ScientificClaim]:
    """
    Tier 1 Deterministic Rule-Based Classification.
    Falls back gracefully if sentence does not represent a scientific claim.
    """
    sentence_clean = sentence.strip()
    if len(sentence_clean.split()) < 5:
        return None

    sentence_lower = sentence_clean.lower()
    detected_type = None
    rationale = ""

    # Prioritize section context
    if section_type == "limitations":
        detected_type = "limitation"
        rationale = "Derived from Limitations section context."
    elif section_type == "conclusion" and any(k in sentence_lower for k in ["future", "plan to", "explore"]):
        detected_type = "future_work"
        rationale = "Identified future work statement in Conclusion section."

    # Pattern scan
    if not detected_type:
        for ctype, patterns in CLAIM_PATTERNS.items():
            for pat in patterns:
                if re.search(pat, sentence_lower):
                    detected_type = ctype
                    rationale = f"Matched lexical trigger '{pat}'."
                    break
            if detected_type:
                break

    if not detected_type:
        return None

    strength, cues = analyze_claim_strength(sentence_clean)

    return ScientificClaim(
        id=f"claim_{section_id}_{index}",
        sentence=sentence_clean,
        claim_type=detected_type,
        strength=strength,
        hedging_cues=cues,
        confidence=0.91,
        rationale=rationale,
        source_section=section_title,
        section_id=section_id,
        engine="deterministic_rules"
    )

def extract_claims(sections: List[Any]) -> List[ScientificClaim]:
    """Extracts and classifies scientific claims across all sections."""
    claims = []
    for sec in sections:
        sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", sec.text) if s.strip()]
        for idx, sent in enumerate(sentences, start=1):
            claim = classify_sentence_claim(
                sentence=sent,
                section_title=sec.title,
                section_type=sec.section_type,
                section_id=sec.id,
                index=idx
            )
            if claim:
                claims.append(claim)
    return claims
