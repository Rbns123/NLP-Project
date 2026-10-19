from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class SectionData(BaseModel):
    id: str
    title: str
    section_type: str  # e.g., "abstract", "introduction", "methodology", "experiments", "results", "discussion", "limitations", "conclusion", "references", "other"
    text: str
    start_char: int
    end_char: int
    page_numbers: List[int] = Field(default_factory=list)

class DocumentMetadata(BaseModel):
    filename: str
    file_type: str
    file_size_bytes: int
    total_pages: int
    total_characters: int
    total_words: int

class ParsedDocument(BaseModel):
    metadata: DocumentMetadata
    full_text: str
    sections: List[SectionData]
