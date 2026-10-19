from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from backend.core.schemas import DocumentMetadata, SectionData
from backend.core.scientific_ner import ScientificEntity
from backend.core.triplets import ResultTriplet
from backend.core.claims import ScientificClaim
from backend.core.reproducibility import ReproducibilityReport
from backend.core.citations import CitationReport
from backend.core.summarizer import EvidenceLinkedSummary

class AnalysisResult(BaseModel):
    metadata: DocumentMetadata
    sections: List[SectionData]
    entities: List[ScientificEntity]
    triplets: List[ResultTriplet]
    claims: List[ScientificClaim]
    reproducibility: ReproducibilityReport
    citations: CitationReport
    summary: EvidenceLinkedSummary
    engine_telemetry: Dict[str, Any]

class AnalysisJob(BaseModel):
    job_id: str
    status: str          # "pending", "processing", "completed", "failed"
    progress_percentage: int
    current_stage: str
    error_message: Optional[str] = None
    result: Optional[AnalysisResult] = None
