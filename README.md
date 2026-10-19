# PaperLens: Automated Research Paper & Evidence Analyzer

> **A verifiable NLP system for scientific literature understanding, quantifiable result triplet extraction, claim classification with hedging cues, and reproducibility auditing.**

---

## 🌟 Overview & Key Capabilities

1. **Robust Multi-Column Document Ingestion**: Real magic-byte validation (`%PDF-` and `PK\x03\x04` / `word/document.xml`), 50MB file guards, multi-column reading, and running header/footer striping via `pdfplumber` and `python-docx`.
2. **Structural Section Segmentation**: Detects Abstract, Introduction, Related Work, Methodology, Experiments, Results, Discussion, Limitations, Conclusion, and References, stitching multi-line headings and tracking character offsets.
3. **Scientific Named Entity Recognition (NER)**: Extracts Methods, Datasets, Metrics, Tasks, and Tools using curated gazetteers and regex heuristics with canonical alias normalization (e.g., `squad 2.0` → `SQuAD v2.0`, `f1 score` → `F1-Score`).
4. **Quantifiable Result Triplet Extraction**: Automatically structures benchmark findings into tuples: `(Method, Dataset, Metric, Normalized Value, Source Section)`.
5. **Claim Classification & Hedging Analysis**: Categorizes statements into Novelty, Performance, Comparison, Limitation, and Future Work, identifying linguistic hedging cues (`may`, `suggests`, `indicates`) vs strong claims (`substantially improves`, `outperforms`).
6. **Reproducibility & Open Science Audit**: Rule-based checklist scoring (0–100%) checking code links, datasets, hyperparameters, random seeds, hardware specs, baseline comparisons, and statistical significance.
7. **Citation Analysis**: Parses reference list and cross-references in-text citation markers (`[1]`, `[2]`) to find the top most cited works.
8. **Evidence-Linked Structured Brief**: Synthesizes a structured summary (Problem, Approach, Key Results, Limitations) where every single sentence carries clickable source provenance.
9. **Interactive Compare Mode**: Side-by-side comparative analysis of two research papers.

---

## 🏗️ Project Architecture

```
NLP_PROJECT/
├── backend/
│   ├── app/
│   │   ├── config.py           # Pydantic Settings
│   │   ├── job_store.py        # In-memory TTL async job store
│   │   ├── main.py             # FastAPI entrypoint & CORS
│   │   └── routes.py           # /api/analyze, /api/jobs, /api/sample-demo
│   ├── core/
│   │   ├── ingestion.py        # Magic bytes & text extraction
│   │   ├── segmentation.py     # Section parsing & orphan merger
│   │   ├── normalization.py    # Canonical aliases & number parsing
│   │   ├── scientific_ner.py   # Scientific NER gazetteers & regex
│   │   ├── triplets.py         # (Method, Dataset, Metric, Value) extractor
│   │   ├── claims.py           # Claim classification & hedging analysis
│   │   ├── reproducibility.py  # 7-point open science checklist
│   │   ├── citations.py        # Reference list parser & in-text counter
│   │   ├── summarizer.py       # Evidence-linked structured brief
│   │   ├── pipeline.py         # 8-stage orchestrator
│   │   ├── sample_paper.py     # Bundled academic paper generator
│   │   └── engine_status.py    # Hardware telemetry (Apple Silicon MPS / CPU)
│   ├── scripts/
│   │   └── profile_pipeline.py # Latency and memory profiler
│   └── tests/                  # 17 Unit & integration tests
├── frontend/                   # Modern React + Vite Dark Dashboard
│   ├── src/
│   │   ├── App.jsx             # Main dashboard with tabs & progress polling
│   │   ├── index.css           # Custom dark theme & glassmorphism
│   │   └── components/
│   │       └── CompareModal.jsx# Side-by-side compare mode
├── Dockerfile                  # Production container definition
├── docker-compose.yml          # Optional docker-compose setup
└── README.md
```

---

## 🚀 Quickstart Guide (macOS / Apple Silicon)

### Prerequisites Check
Open your Terminal and verify:
```bash
python3 --version   # Python 3.11+
node --version      # Node 20+
git --version
```

### 1. Backend Setup & Run
```bash
# In the project root (/Users/neel/NLP_PROJECT):
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies (already cached)
pip install -r backend/requirements.txt

# Run the FastAPI server:
uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```
- Open Swagger API documentation at: **http://localhost:8000/docs**
- Health telemetry: **http://localhost:8000/health**

### 2. Frontend Setup & Run
In a second Terminal tab:
```bash
cd frontend
npm install
npm run dev
```
- Open PaperLens in your browser: **http://localhost:5173**
- Click **"⚡ Load Sample Paper"** or **"Run Bundled Demo"** to see instant end-to-end evidence extraction.

---

## 🧪 Running Tests & Performance Profiler

Run the comprehensive unit test suite:
```bash
source .venv/bin/activate
pytest -v
```
*(All 17 tests covering ingestion, segmentation, NER, triplets, claims, reproducibility, and end-to-end integration will run and pass).*

Run latency and memory profiling:
```bash
python backend/scripts/profile_pipeline.py
```
*(Average execution latency: **~0.04s** per paper on Apple M2).*

---

## 📌 Implemented vs Future Work

| Feature | Status | Notes |
| :--- | :--- | :--- |
| **PDF & DOCX Signature Validation** | ✅ Complete | Magic bytes (%PDF-, ZIP/docx) |
| **Section Segmentation & Cleaning** | ✅ Complete | 10 canonical section types, header/footer filter |
| **Scientific NER & Normalization** | ✅ Complete | Curated gazetteer + canonical alias map |
| **Result Triplet Extraction** | ✅ Complete | Quantifiable benchmark findings with sources |
| **Claim Classification & Hedging** | ✅ Complete | Lexical cues (may, suggests vs outperforms) |
| **Reproducibility Audit (0-100%)** | ✅ Complete | 7-point open science checklist |
| **Citation In-Text Counter** | ✅ Complete | Top cited reference ranking |
| **Evidence-Linked Brief** | ✅ Complete | 100% of sentences cite source sections |
| **Side-by-Side Compare Mode** | ✅ Complete | Cross-paper comparative synthesis modal |
| **Modern Dark Mode UI & Polling**| ✅ Complete | Glassmorphism, tabbed dashboard, live status |
| *Fine-tuned SciBERT NER Model* | 🔮 Future Work | Model path configured in settings for plug-in |
| *Multimodal Complex Table OCR* | 🔮 Future Work | For raster-scanned image-only PDFs |
