import re
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class SummarySentence(BaseModel):
    aspect: str          # "Problem", "Approach", "Key Results", "Limitations"
    sentence: str
    source_section: str
    section_id: str
    confidence: float

class EvidenceLinkedSummary(BaseModel):
    problem: List[SummarySentence]
    approach: List[SummarySentence]
    key_results: List[SummarySentence]
    limitations: List[SummarySentence]
    engine: str = "extractive_evidence_pipeline"

def clean_sentence(text: str) -> str:
    """Removes stray formatting or citation brackets from lead sentences."""
    cleaned = re.sub(r"\[\d+(?:,\s*\d+)*\]", "", text)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned

def extract_evidence_summary(sections: List[Any]) -> EvidenceLinkedSummary:
    """
    Tier 1 & Extractive Fallback: Extracts key salient sentences for each 
    structured brief aspect with explicit provenance and source attribution.
    """
    problem_sentences: List[SummarySentence] = []
    approach_sentences: List[SummarySentence] = []
    results_sentences: List[SummarySentence] = []
    limitations_sentences: List[SummarySentence] = []

    for sec in sections:
        # Split section into sentences
        sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", sec.text) if len(s.strip().split()) > 6]
        
        # 1. Problem formulation
        if sec.section_type in ("abstract", "introduction"):
            for s in sentences:
                s_lower = s.lower()
                if any(k in s_lower for k in ["challenge", "problem", "difficult", "struggle", "suffer from", "gap", "however", "bottleneck"]):
                    problem_sentences.append(SummarySentence(
                        aspect="Problem",
                        sentence=clean_sentence(s),
                        source_section=sec.title,
                        section_id=sec.id,
                        confidence=0.89
                    ))
                    if len(problem_sentences) >= 2:
                        break

        # 2. Proposed Approach
        if sec.section_type in ("abstract", "methodology", "introduction"):
            for s in sentences:
                s_lower = s.lower()
                if any(k in s_lower for k in ["we propose", "we introduce", "our method", "our approach", "we present", "in this work"]):
                    approach_sentences.append(SummarySentence(
                        aspect="Approach",
                        sentence=clean_sentence(s),
                        source_section=sec.title,
                        section_id=sec.id,
                        confidence=0.92
                    ))
                    if len(approach_sentences) >= 2:
                        break

        # 3. Key Results
        if sec.section_type in ("abstract", "results", "conclusion"):
            for s in sentences:
                s_lower = s.lower()
                if any(k in s_lower for k in ["achieves", "outperforms", "improves", "results demonstrate", "f1", "accuracy", "state-of-the-art"]):
                    results_sentences.append(SummarySentence(
                        aspect="Key Results",
                        sentence=clean_sentence(s),
                        source_section=sec.title,
                        section_id=sec.id,
                        confidence=0.90
                    ))
                    if len(results_sentences) >= 2:
                        break

        # 4. Limitations
        if sec.section_type in ("limitations", "discussion", "conclusion"):
            for s in sentences:
                s_lower = s.lower()
                if any(k in s_lower for k in ["limitation", "drawback", "restricted", "future work", "not generalize", "fails"]):
                    limitations_sentences.append(SummarySentence(
                        aspect="Limitations",
                        sentence=clean_sentence(s),
                        source_section=sec.title,
                        section_id=sec.id,
                        confidence=0.87
                    ))
                    if len(limitations_sentences) >= 2:
                        break

    # If some aspects are missing, use first available informative sentences from intro/abstract
    if not problem_sentences and sections:
        for sec in sections:
            if sec.section_type in ("abstract", "introduction") and sec.text:
                first_sent = sec.text.split(".")[0].strip() + "."
                if len(first_sent) > 20:
                    problem_sentences.append(SummarySentence(
                        aspect="Problem",
                        sentence=clean_sentence(first_sent),
                        source_section=sec.title,
                        section_id=sec.id,
                        confidence=0.75
                    ))
                    break

    return EvidenceLinkedSummary(
        problem=problem_sentences[:2],
        approach=approach_sentences[:2],
        key_results=results_sentences[:2],
        limitations=limitations_sentences[:2],
        engine="extractive_evidence_pipeline"
    )
