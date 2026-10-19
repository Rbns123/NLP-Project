import pytest
import io
import docx
from backend.core.ingestion import validate_file_signature, extract_text_from_docx, IngestionError
from backend.core.segmentation import parse_and_segment_document, classify_heading

def test_validate_file_signature_pdf():
    pdf_bytes = b"%PDF-1.4 sample pdf content"
    assert validate_file_signature(pdf_bytes, "test.pdf") == "pdf"

def test_validate_file_signature_docx():
    # Build minimal valid in-memory DOCX
    doc = docx.Document()
    doc.add_paragraph("Test paragraph")
    stream = io.BytesIO()
    doc.save(stream)
    docx_bytes = stream.getvalue()
    
    assert validate_file_signature(docx_bytes, "test.docx") == "docx"

def test_empty_file_rejection():
    with pytest.raises(IngestionError, match="File is empty"):
        validate_file_signature(b"", "empty.pdf")

def test_invalid_signature_rejection():
    with pytest.raises(IngestionError, match="Unsupported or invalid file format"):
        validate_file_signature(b"plain text file", "paper.txt")

def test_section_heading_classification():
    assert classify_heading("Abstract") == "abstract"
    assert classify_heading("1. Introduction") == "introduction"
    assert classify_heading("2. Related Work and Background") == "related_work"
    assert classify_heading("3 Methodology & Architecture") == "methodology"
    assert classify_heading("4. Experimental Setup") == "experiments"
    assert classify_heading("5. Results and Analysis") == "results"
    assert classify_heading("6. Limitations & Discussion") == "limitations"
    assert classify_heading("7. Conclusion") == "conclusion"
    assert classify_heading("References") == "references"

def test_segmentation_parsing():
    sample_pages = [
        {
            "page_number": 1,
            "text": "PaperLens: Fast NLP Analyzer\nJohn Doe, Jane Smith\n\nAbstract\nThis paper introduces an end-to-end framework for analyzing scientific literature.\n\n1. Introduction\nResearch papers in artificial intelligence are published rapidly."
        },
        {
            "page_number": 2,
            "text": "Page 2 of 2\n2. Methodology\nWe propose a multi-tiered pipeline that extracts entities and claims.\n\n3. Results\nOur model achieves an F1 score of 91.2% on SQuAD."
        }
    ]

    sections = parse_and_segment_document(sample_pages)
    assert len(sections) >= 4
    section_types = [s.section_type for s in sections]
    assert "abstract" in section_types
    assert "introduction" in section_types
    assert "methodology" in section_types
    assert "results" in section_types
