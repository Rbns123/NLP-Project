import re
from typing import List, Dict, Any, Tuple
from backend.core.schemas import SectionData

# Canonical target sections
SECTION_PATTERNS = {
    "abstract": [
        r"^(?:(?:\d+\.?\s*)?abstract)\b"
    ],
    "introduction": [
        r"^(?:(?:\d+\.?\s*)?introduction)\b",
        r"^(?:(?:\d+\.?\s*)?overview)\b"
    ],
    "related_work": [
        r"^(?:(?:\d+\.?\s*)?related\s+work(?:s)?)\b",
        r"^(?:(?:\d+\.?\s*)?literature\s+review)\b",
        r"^(?:(?:\d+\.?\s*)?background(?:\s+and\s+related\s+work)?)\b"
    ],
    "methodology": [
        r"^(?:(?:\d+\.?\s*)?methodology)\b",
        r"^(?:(?:\d+\.?\s*)?methods?)\b",
        r"^(?:(?:\d+\.?\s*)?approach)\b",
        r"^(?:(?:\d+\.?\s*)?model\s+architecture)\b",
        r"^(?:(?:\d+\.?\s*)?proposed\s+method)\b",
        r"^(?:(?:\d+\.?\s*)?system\s+design)\b"
    ],
    "experiments": [
        r"^(?:(?:\d+\.?\s*)?experiments?(?:\s+setup|\s+and\s+evaluation)?)\b",
        r"^(?:(?:\d+\.?\s*)?experimental\s+(?:setup|evaluation|design|results))\b"
    ],
    "results": [
        r"^(?:(?:\d+\.?\s*)?results?(?:\s+and\s+analysis)?)\b",
        r"^(?:(?:\d+\.?\s*)?findings)\b",
        r"^(?:(?:\d+\.?\s*)?evaluation)\b"
    ],
    "discussion": [
        r"^(?:(?:\d+\.?\s*)?discussion)\b",
        r"^(?:(?:\d+\.?\s*)?ablation\s+study)\b"
    ],
    "limitations": [
        r"^(?:(?:\d+\.?\s*)?limitations?(?:\s+and\s+risks)?)\b",
        r"^(?:(?:\d+\.?\s*)?ethical\s+considerations?)\b"
    ],
    "conclusion": [
        r"^(?:(?:\d+\.?\s*)?conclusions?(?:\s+and\s+future\s+work)?)\b",
        r"^(?:(?:\d+\.?\s*)?future\s+work)\b",
        r"^(?:(?:\d+\.?\s*)?concluding\s+remarks)\b"
    ],
    "references": [
        r"^(?:(?:\d+\.?\s*)?references)\b",
        r"^(?:(?:\d+\.?\s*)?bibliography)\b"
    ]
}

# Regex to detect numbered or unnumbered section headers
# Examples: "1 Introduction", "2.1 Proposed Model", "III. METHOD", "ABSTRACT"
HEADING_REGEX = re.compile(
    r"^((?:(?:[0-9IVXLCDM]+(?:\.[0-9]+)*\.?|\bSection\s+\d+)\s+)?([A-Z][A-Za-z0-9\s,\-–—\(\)]{2,65}))$"
)

# Running header/footer heuristics: e.g. "Preprint - under review", "Page 4 of 12", standalone numbers
PAGE_NUM_REGEX = re.compile(r"^\s*(?:page\s+)?\d+(?:\s*(?:of|\/)\s*\d+)?\s*$", re.IGNORECASE)
RUNNING_HEADER_REGEX = re.compile(
    r"^\s*(?:arxiv:\d+\.\d+|preprint|submitted\s+to|proceedings\s+of|under\s+review).*$",
    re.IGNORECASE
)

def is_running_artifact(line: str) -> bool:
    """Checks if a single line is likely a running page number, header, or footer."""
    trimmed = line.strip()
    if not trimmed:
        return False
    if PAGE_NUM_REGEX.match(trimmed):
        return True
    if RUNNING_HEADER_REGEX.match(trimmed):
        return True
    return False

def classify_heading(title: str) -> str:
    """Classifies a detected section heading into one of the target canonical types."""
    title_clean = title.strip().lower()
    
    # Strip numbering like "1. ", "3.2 ", "iv. "
    normalized_title = re.sub(r"^(?:[0-9ivxlcdm]+(?:\.[0-9]+)*\.?|\bsection\s+\d+)\s*", "", title_clean).strip()
    
    for section_type, patterns in SECTION_PATTERNS.items():
        for pat in patterns:
            if re.search(pat, normalized_title) or re.search(pat, title_clean):
                return section_type
                
    return "other"

def parse_and_segment_document(pages_data: List[Dict[str, Any]]) -> List[SectionData]:
    """
    Parses document pages into structured sections:
    - Filters out running headers and footers
    - Identifies numbered and unnumbered headings
    - Merges multi-line headings and orphan text fragments
    - Tracks start_char, end_char offsets and page ranges
    """
    lines_with_page: List[Tuple[str, int]] = []
    for p_info in pages_data:
        p_num = p_info["page_number"]
        page_lines = p_info["text"].split("\n")
        for line in page_lines:
            if is_running_artifact(line):
                continue
            lines_with_page.append((line, p_num))

    # Identify heading candidates and build section boundaries
    sections_raw: List[Dict[str, Any]] = []
    current_title = "Document Header / Title"
    current_lines: List[str] = []
    current_pages = set()
    
    idx = 0
    while idx < len(lines_with_page):
        line, page_num = lines_with_page[idx]
        stripped = line.strip()
        
        # Check if line looks like a heading
        match = HEADING_REGEX.match(stripped)
        is_heading_candidate = False
        potential_title = stripped

        if match and len(stripped) < 70 and not stripped.endswith((".", ":", ";", ",")):
            # Check if this heading is multi-line (next line is also short, capitalized, continuation)
            if idx + 1 < len(lines_with_page):
                next_line, next_p = lines_with_page[idx + 1]
                next_stripped = next_line.strip()
                if (next_stripped and len(next_stripped) < 40 and 
                    next_stripped[0].isupper() and 
                    not next_stripped.endswith((".", ":", ";")) and
                    not HEADING_REGEX.match(next_stripped)):
                    potential_title = f"{stripped} {next_stripped}"
                    idx += 1  # Consume continuation line

            # Additional check: does this match known section keywords or prominent title patterns?
            sec_type = classify_heading(potential_title)
            # If recognized section or numbered heading (e.g., "1. Introduction" or all caps "ABSTRACT")
            if sec_type != "other" or re.match(r"^(?:[0-9IVXLCDM]+(?:\.[0-9]+)*\.?)\s+[A-Z]", stripped) or stripped.isupper():
                is_heading_candidate = True

        if is_heading_candidate:
            # Finish previous section
            if current_lines or current_title:
                sections_raw.append({
                    "title": current_title,
                    "lines": current_lines,
                    "pages": sorted(list(current_pages)) if current_pages else [page_num]
                })
            current_title = potential_title
            current_lines = []
            current_pages = {page_num}
        else:
            if stripped:
                current_lines.append(stripped)
                current_pages.add(page_num)
        
        idx += 1

    # Append trailing section
    if current_lines or current_title:
        sections_raw.append({
            "title": current_title,
            "lines": current_lines,
            "pages": sorted(list(current_pages)) if current_pages else [1]
        })

    # Construct SectionData objects with character offsets
    result_sections: List[SectionData] = []
    current_offset = 0

    for s_idx, s in enumerate(sections_raw):
        text_content = "\n".join(s["lines"]).strip()
        start_char = current_offset
        end_char = start_char + len(text_content)
        current_offset = end_char + 2  # account for spacing between sections
        
        sec_type = classify_heading(s["title"])
        
        # If it's the very first section and title is generic header, classify appropriately
        if s_idx == 0 and sec_type == "other":
            sec_type = "header"

        result_sections.append(SectionData(
            id=f"sec_{s_idx + 1}",
            title=s["title"],
            section_type=sec_type,
            text=text_content,
            start_char=start_char,
            end_char=end_char,
            page_numbers=s["pages"]
        ))

    return result_sections
