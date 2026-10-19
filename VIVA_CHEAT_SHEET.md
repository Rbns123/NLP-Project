# PaperLens Viva & Defense Cheat Sheet (10-Minute Prep)

### Q1: What makes PaperLens different from standard LLM summarizers like ChatGPT?
**Answer**: "General LLMs are black boxes that frequently hallucinate benchmark metrics and cannot provide verifiable source citations. PaperLens is a deterministic, evidence-linked decision-support system. Every extracted triplet and claim is tied directly to its original section offset. If an element is missing, PaperLens explicitly flags it as 'not found in document' rather than guessing."

---

### Q2: How does the system handle multi-column research paper PDFs?
**Answer**: "We utilize `pdfplumber` layout-aware text extraction which preserves column reading flow rather than concatenating text horizontally. We then execute a regex-based structural segmenter that strips recurring running headers and page numbers and merges multi-line section headings."

---

### Q3: What is 'Hedging' and why is it important in scientific NLP?
**Answer**: "Hedging refers to linguistic cues that authors use to moderate the strength of their claims—such as 'suggests', 'preliminary', or 'may indicate'. In scientific peer review, identifying hedging prevents over-interpreting tentative hypotheses as established facts. PaperLens classifies claims into Strong, Moderate, or Weak/Hedged based on these cues."

---

### Q4: How does the Result Triplet extraction work?
**Answer**: "It extracts empirical findings formatted as `(Method, Dataset, Metric, Value, Source Section)`. For example, `(BERT-base, SQuAD v2.0, F1-Score, 91.4%, 4. Results)`. It scans quantitative sentence patterns and applies entity normalization to resolve aliases (e.g. converting 'f-measure' or 'f1' into 'F1-Score')."

---

### Q5: How is experimental reproducibility assessed?
**Answer**: "We implemented a 7-point open-science checklist derived from NeurIPS/ACL reproducibility guidelines. It verifies the presence of:
1. Public code/repository URL
2. Benchmark dataset declarations
3. Hyperparameters (learning rate, batch size, optimizer)
4. Random seeds
5. Compute hardware (GPU, TPU, Apple Silicon)
6. Baseline comparisons
7. Statistical significance testing (p-values, standard deviations)."

---

### Q6: How does the system handle asynchronous file processing?
**Answer**: "When a file is uploaded to `POST /api/analyze`, FastAPI accepts the payload, registers a job in an in-memory TTL job store, and spins up a background worker. The client polls `GET /api/jobs/{job_id}` which returns real-time pipeline stage progress (0% to 100%) until the analysis JSON is ready."

---

### Q7: What hardware acceleration does the project leverage?
**Answer**: "PaperLens automatically checks `torch.backends.mps.is_available()` on Apple Silicon (M1/M2/M3) to leverage unified GPU memory and Apple Metal Performance Shaders (MPS), falling back gracefully to multi-threaded CPU if needed."
