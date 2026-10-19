import io
import docx

def create_sample_paper_docx() -> bytes:
    """
    Creates an in-memory realistic scientific research paper in DOCX format:
    'PaperLens: Robust Scientific Information Extraction and Evidence Attribution'
    """
    doc = docx.Document()
    
    # Title & Authors
    doc.add_heading("PaperLens: Automated Research Paper & Evidence Extraction", level=0)
    p_authors = doc.add_paragraph("Neel Sharma, Research Scholar\nDepartment of Artificial Intelligence & Data Science")
    
    # Abstract
    doc.add_heading("Abstract", level=1)
    doc.add_paragraph(
        "Modern deep learning research suffers from an overwhelming volume of published literature, "
        "making manual evidence extraction and reproducibility auditing labor-intensive. "
        "In this work, we propose PaperLens, an automated full-stack pipeline designed to parse scientific papers, "
        "extract quantifiable result triplets, classify scientific claims, and audit experimental reproducibility. "
        "Evaluated on standard benchmarks, PaperLens achieves an F1 score of 91.4% on SQuAD and an accuracy of 89.2% on GLUE. "
        "However, our preliminary tests indicate that extracting claims from non-standard formatting may slightly reduce parsing recall."
    )

    # 1. Introduction
    doc.add_heading("1. Introduction", level=1)
    doc.add_paragraph(
        "The exponential growth of NLP and machine learning preprints on arXiv creates a massive bottleneck for students and researchers. "
        "Traditional summarization models often hallucinate experimental figures or fail to cite specific sections. "
        "To address this challenge, we introduce a structured evidence extraction framework that maps every extracted claim "
        "and metric directly back to its source section."
    )

    # 2. Methodology
    doc.add_heading("2. Methodology", level=1)
    doc.add_paragraph(
        "Our architecture combines rule-based gazetteers with transformer fallbacks. "
        "We implement document ingestion using pdfplumber and python-docx, followed by structural section parsing. "
        "Scientific entities such as methods, datasets, and metrics are extracted and normalized to canonical aliases. "
        "Result triplets are formulated as (method, dataset, metric, value, source section)."
    )

    # 3. Experimental Setup
    doc.add_heading("3. Experimental Setup", level=1)
    doc.add_paragraph(
        "All experiments were conducted on an Apple M2 machine with 16 GB unified memory using PyTorch. "
        "We set the random seed to 42 and used the AdamW optimizer with a learning rate of 2e-5 and batch size 32. "
        "We compare our approach against competitive baseline models from prior work. "
        "Source code and evaluation scripts are available at https://github.com/neel/paperlens-nlp."
    )

    # 4. Results and Analysis
    doc.add_heading("4. Results and Analysis", level=1)
    doc.add_paragraph(
        "Our proposed model significantly outperforms competitive baselines across multiple datasets. "
        "Specifically, our BERT model achieves an F1 score of 91.4% on SQuAD v2.0, while RoBERTa attains an accuracy of 89.2% on GLUE. "
        "The difference in performance is statistically significant with p < 0.01 based on a paired t-test."
    )

    # 5. Limitations
    doc.add_heading("5. Limitations", level=1)
    doc.add_paragraph(
        "A key limitation of the current implementation is the dependency on clear digital text layers. "
        "The pipeline struggles with low-resolution scanned image PDFs without optical character recognition (OCR)."
    )

    # 6. Conclusion and Future Work
    doc.add_heading("6. Conclusion", level=1)
    doc.add_paragraph(
        "We introduced PaperLens, a verifiable scientific information extraction system. "
        "In future work, we plan to incorporate multimodal table parsing and multi-document comparative synthesis."
    )

    # References
    doc.add_heading("References", level=1)
    doc.add_paragraph("[1] Vaswani, A. et al. Attention Is All You Need. NeurIPS, 2017.")
    doc.add_paragraph("[2] Devlin, J. et al. BERT: Pre-training of Deep Bidirectional Transformers. NAACL, 2019.")
    doc.add_paragraph("[3] Luan, Y. et al. Information Extraction from Scientific Literature. ACL, 2018.")

    stream = io.BytesIO()
    doc.save(stream)
    return stream.getvalue()
