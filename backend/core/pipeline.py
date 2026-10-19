import time
from typing import Dict, Any, Callable, Optional
from backend.core.ingestion import ingest_document
from backend.core.segmentation import parse_and_segment_document
from backend.core.scientific_ner import extract_scientific_ner
from backend.core.triplets import extract_result_triplets
from backend.core.claims import extract_claims
from backend.core.reproducibility import evaluate_reproducibility
from backend.core.citations import parse_citations
from backend.core.summarizer import extract_evidence_summary
from backend.core.engine_status import get_engine_status
from backend.core.pipeline_schema import AnalysisResult

def run_paperlens_pipeline(
    file_bytes: bytes,
    filename: str,
    progress_callback: Optional[Callable[[int, str], None]] = None
) -> AnalysisResult:
    """
    Executes the 8-stage PaperLens NLP pipeline with progress updates and telemetry.
    """
    start_time = time.time()

    def update(pct: int, msg: str):
        if progress_callback:
            progress_callback(pct, msg)

    # Stage 1: Ingestion & Validation
    update(10, "Validating signature and extracting raw document pages...")
    full_text, pages_data, metadata = ingest_document(file_bytes, filename)

    # Stage 2: Structural Segmentation
    update(25, "Segmenting document sections, cleaning running artifacts...")
    sections = parse_and_segment_document(pages_data)

    # Stage 3: Scientific NER & Normalization
    update(40, "Extracting scientific entities (methods, datasets, metrics, tasks, tools)...")
    entities = extract_scientific_ner(sections)

    # Stage 4: Result Triplet Extraction
    update(55, "Extracting quantifiable result triplets (method, dataset, metric, value)...")
    triplets = extract_result_triplets(sections)

    # Stage 5: Scientific Claim Analysis & Hedging
    update(70, "Classifying claims into types and scoring hedging strength...")
    claims = extract_claims(sections)

    # Stage 6: Reproducibility & Quality Checklist
    update(80, "Evaluating reproducibility checklist & code/dataset statements...")
    reproducibility = evaluate_reproducibility(sections)

    # Stage 7: Citation Frequency & Reference Parsing
    update(90, "Parsing reference list and in-text citation markers...")
    citations = parse_citations(sections, full_text)

    # Stage 8: Evidence-Linked Structured Brief
    update(95, "Synthesizing evidence-linked structured brief with source provenance...")
    summary = extract_evidence_summary(sections)

    elapsed_seconds = round(time.time() - start_time, 2)
    telemetry = get_engine_status()
    telemetry["execution_time_seconds"] = elapsed_seconds

    update(100, "Analysis complete.")

    return AnalysisResult(
        metadata=metadata,
        sections=sections,
        entities=entities,
        triplets=triplets,
        claims=claims,
        reproducibility=reproducibility,
        citations=citations,
        summary=summary,
        engine_telemetry=telemetry
    )
