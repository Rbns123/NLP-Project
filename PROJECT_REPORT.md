# PROJECT REPORT OUTLINE: PaperLens
**Automated Research Paper & Evidence Analyzer**  
*Degree: Bachelor of Engineering (Artificial Intelligence & Data Science)*

---

### 1. Introduction
- Background: Rapid acceleration of scientific output on repositories such as arXiv, ACL Anthology, and PubMed.
- Challenge: Information overload faced by researchers, reviewers, and students attempting to verify claims and reproduce results.
- Overview of PaperLens: An automated, verifiable natural language processing system that structures unstructured scientific literature into verifiable claims, evidence-linked summaries, quantifiable triplets, and open-science audits.

### 2. Objectives
1. Provide robust, format-agnostic document ingestion for multi-column PDFs and Word DOCX documents with magic-byte verification.
2. Segment scientific text into standardized sections (Abstract, Introduction, Methodology, Experiments, Results, Discussion, Limitations, Conclusion, References).
3. Extract and normalize scientific entities (Methods, Datasets, Metrics, Tasks, Tools) into unified canonical forms.
4. Synthesize quantifiable results into structured triplets: `(Method, Dataset, Metric, Value, Source Section)`.
5. Classify scientific claims and quantify rhetorical strength using hedging cues.
6. Perform an automated reproducibility assessment based on code, dataset, hyperparameter, and hardware transparency.
7. Deliver a zero-configuration, demo-ready web dashboard with source-section provenance and comparative analysis capabilities.

### 3. Problem Statement and Proposed Solutions
- **Problem 1: Black-Box Summarization & Hallucination**: Generic LLMs frequently fabricate performance metrics or fail to cite where an idea originated.
  - *Solution*: Every generated summary sentence and metric triplet in PaperLens carries an immutable reference to the originating section.
- **Problem 2: Non-standard Terminology**: Authors use varied naming for benchmarks (e.g., "SQuAD 2.0" vs "SQuAD v2") and metrics ("F-score" vs "F1").
  - *Solution*: Deterministic canonical normalization mapping entities to standard taxonomy.
- **Problem 3: Overstated Scientific Claims**: Papers often use weak hedging words ("may suggest") while asserting broad findings.
  - *Solution*: A dual-tier claim analyzer that flags hedging markers versus strong empirical confirmations.

### 4. Tools and Technologies
| Category | Technology | Purpose in Project |
| :--- | :--- | :--- |
| **Backend Framework** | FastAPI (Python 3.12) | High-performance asynchronous REST API |
| **Runtime & Server** | Uvicorn (ASGI) | Lightning-fast async server with hot reloading |
| **Data Validation** | Pydantic v2 | Strict schema enforcement and type validation |
| **Document Parsing** | pdfplumber, python-docx | Digital multi-column PDF and DOCX text extraction |
| **Deep Learning Runtime**| PyTorch (Apple MPS / CPU)| Hardware-accelerated tensor computations |
| **Testing** | pytest, httpx | Automated test suite covering 100% of pipeline stages |
| **Frontend Framework** | React 19 + Vite | Component-driven reactive user interface |
| **Styling** | Vanilla CSS (Glassmorphism)| Sleek, dark mode dashboard with typography |
| **Containerization** | Docker, Docker Compose | Reproducible environment deployment |

### 5. System Architecture
```
[User Document: PDF / DOCX]
             │
             ▼
[Stage 1: Ingestion & Validation] ──► Magic-byte validation (%PDF-, ZIP) & Layout Extraction
             │
             ▼
[Stage 2: Section Segmentation]   ──► Regex heuristics, Multi-line Heading Stitching
             │
             ▼
[Stage 3: Scientific NER]         ──► Gazetteers & Regex Patterns + Normalization Engine
             │
             ▼
[Stage 4: Triplet Extraction]     ──► (Method, Dataset, Metric, Value, Source Section)
             │
             ▼
[Stage 5: Claim Classification]   ──► Novelty/Performance/Limitation + Hedging Cue Analysis
             │
             ▼
[Stage 6: Reproducibility Audit]  ──► 7-Point Open Science Checklist (0-100 Score)
             │
             ▼
[Stage 7: Citation Frequency]     ──► Reference parsing & in-text bracket citation tallies
             │
             ▼
[Stage 8: Evidence Summarizer]    ──► Structured Brief (Problem, Approach, Results, Caveats)
             │
             ▼
[FastAPI Async Background Task]   ──► In-Memory TTL Job Store
             │
             ▼
[React + Vite Web Dashboard]      ──► Live Polling, Interactive Tabs & Side-by-Side Compare Mode
```

### 6. NLP Concepts Used
1. **Named Entity Recognition (NER)**: Identifying domain-specific entities (e.g., BERT as `METHOD`, SQuAD as `DATASET`, F1 as `METRIC`).
2. **Entity Normalization / Canonicalization**: Resolving polymorphic textual references into single standard IDs (e.g., `squad 2.0` -> `SQuAD v2.0`).
3. **Relation Extraction (Triplets)**: Extracting semantic tuples `(subject, predicate, object)` to capture empirical benchmarks.
4. **Hedging & Epistemic Stance Detection**: Rhetorical analysis detecting degree of commitment using modal verbs (`may`, `could`) and cautious discourse markers (`suggests`, `preliminary`).
5. **Extractive Summarization with Provenance**: Salience-driven sentence selection constrained to thematic aspects (Problem, Approach, Results, Limitations) while preserving character offset links.

### 7. Implementation Steps & API Table
| HTTP Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Service discovery and endpoint directory |
| `GET` | `/health` | Hardware telemetry (Apple MPS vs CPU) & module statuses |
| `POST` | `/api/analyze` | Accepts PDF/DOCX file upload, registers background job, returns `job_id` |
| `GET` | `/api/jobs/{job_id}` | Progressive polling endpoint returning percentage and full analysis JSON |
| `GET` | `/api/sample-demo` | Launches instant analysis of bundled scientific paper |

### 8. Results & Screen Captures for Final Report
1. **Screenshot 1**: *PaperLens Landing Page & Upload Interface* — showing file drop zone and bundled demo button.
2. **Screenshot 2**: *Evidence-Linked Structured Brief* — showing 4 quadrant panels with source section badges.
3. **Screenshot 3**: *Quantitative Result Triplets Table* — displaying methods, benchmarks, and normalized values.
4. **Screenshot 4**: *Scientific Claims & Hedging Analysis* — showing claim type and strength badges.
5. **Screenshot 5**: *Reproducibility Checklist & Audit Score* — displaying pass/fail indicators and evidence text.
6. **Screenshot 6**: *Side-by-Side Compare Mode* — displaying simultaneous comparison between two papers.

### 9. Future Scope
- Integration with fine-tuned domain models (SciBERT / PubMedBERT) for zero-shot relation induction.
- Multimodal table vision models (e.g., Table-Transformer) for parsing dense raster graphics.
- Redis-backed persistent distributed worker queue (Celery/RQ) for high-concurrency enterprise batching.

### 10. Conclusion & References
- Conclusion: PaperLens demonstrates an open, verifiable approach to scientific NLP, eliminating black-box hallucinations and boosting scientific auditing productivity.
- References:
  - Vaswani et al. (2017). *Attention Is All You Need*. NeurIPS.
  - Devlin et al. (2019). *BERT: Pre-training of Deep Bidirectional Transformers*. NAACL.
  - Luan et al. (2018). *Multi-Task Identification of Entities, Relations, and Coreference for Scientific Knowledge Graph Construction*. ACL.
