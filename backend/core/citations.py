import re
from typing import List, Dict, Any, Optional
from collections import Counter
from pydantic import BaseModel

class CitationEntry(BaseModel):
    id: str
    raw_reference: str
    authors: Optional[str] = None
    title: Optional[str] = None
    year: Optional[int] = None
    citation_marker: Optional[str] = None
    in_text_count: int = 0

class CitationReport(BaseModel):
    total_references: int
    top_cited_works: List[CitationEntry]
    all_references: List[CitationEntry]
    engine: str = "regex_citation_parser"

# Heuristic to parse reference lines
REF_MARKER_REGEX = re.compile(r"^(?:\[(\d+)\]|(\d+)\.|\(([^)]+)\))\s*(.*)$")

def parse_citations(sections: List[Any], full_text: str) -> CitationReport:
    """
    Parses references from References section and tallies in-text citations.
    """
    ref_section = next((s for s in sections if s.section_type == "references"), None)
    
    reference_entries: List[CitationEntry] = []
    
    if ref_section:
        ref_lines = [l.strip() for l in ref_section.text.split("\n") if l.strip()]
        ref_id = 1
        
        for line in ref_lines:
            # Skip short headers
            if len(line) < 15:
                continue

            marker = None
            text = line
            m = REF_MARKER_REGEX.match(line)
            if m:
                marker = m.group(1) or m.group(2) or m.group(3)
                text = m.group(4)

            # Extract year
            year_match = re.search(r"\b(19\d{2}|20\d{2})\b", text)
            year = int(year_match.group(1)) if year_match else None

            # Split authors and title heuristics
            authors = None
            title = None
            parts = text.split(".")
            if len(parts) >= 2:
                authors = parts[0].strip()
                title = parts[1].strip()
            else:
                title = text

            reference_entries.append(CitationEntry(
                id=f"ref_{ref_id}",
                raw_reference=line,
                authors=authors,
                title=title,
                year=year,
                citation_marker=marker or str(ref_id),
                in_text_count=0
            ))
            ref_id += 1

    # In-text citation counting
    for ref in reference_entries:
        if ref.citation_marker:
            # Match bracket citation like [1] or [12]
            bracket_pat = rf"\[{re.escape(ref.citation_marker)}\]"
            matches = len(re.findall(bracket_pat, full_text))
            if matches > 0:
                # Deduct 1 if the reference section itself has [marker]
                ref.in_text_count = max(0, matches - 1)
        
        # If author is known, look for author-year e.g. "Devlin et al. (2019)"
        if ref.authors and ref.year:
            first_author = ref.authors.split(",")[0].split()[0]
            author_pat = rf"\b{re.escape(first_author)}(?:\s+et\s+al\.?)?(?:,\s*|\s*\(){ref.year}\)?"
            author_matches = len(re.findall(author_pat, full_text, re.IGNORECASE))
            if author_matches > ref.in_text_count:
                ref.in_text_count = author_matches

    # Sort by in_text_count
    sorted_refs = sorted(reference_entries, key=lambda x: x.in_text_count, reverse=True)
    top_cited = sorted_refs[:5] if sorted_refs else []

    return CitationReport(
        total_references=len(reference_entries),
        top_cited_works=top_cited,
        all_references=reference_entries,
        engine="regex_citation_parser"
    )
