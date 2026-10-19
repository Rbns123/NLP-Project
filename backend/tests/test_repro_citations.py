import pytest
from backend.core.reproducibility import evaluate_reproducibility
from backend.core.citations import parse_citations
from backend.core.schemas import SectionData

def test_reproducibility_evaluation():
    sections = [
        SectionData(
            id="sec_1",
            title="3. Experimental Setup",
            section_type="experiments",
            text="We train using learning rate 2e-5, batch size 32 with random seed 42 on an NVIDIA A100 GPU.\nSource code is available at https://github.com/example/paperlens.",
            start_char=0,
            end_char=150,
            page_numbers=[3]
        )
    ]
    report = evaluate_reproducibility(sections)
    assert report.score >= 50
    statuses = {item.key: item.status for item in report.checklist}
    assert statuses["code_repository"] == "found"
    assert statuses["hyperparameters"] == "found"
    assert statuses["random_seeds"] == "found"
    assert statuses["hardware_specs"] == "found"
    assert statuses["statistical_significance"] == "not found in document"

def test_citations_parsing():
    full_text = (
        "Recent progress in NLP relies on Transformers [1]. "
        "Further improvements were shown by Devlin et al. [2], which was cited again in [1]."
    )
    sections = [
        SectionData(
            id="sec_ref",
            title="References",
            section_type="references",
            text="[1] Vaswani, A. Attention Is All You Need. NeurIPS 2017.\n[2] Devlin, J. BERT: Pre-training of Deep Bidirectional Transformers. NAACL 2019.",
            start_char=100,
            end_char=250,
            page_numbers=[5]
        )
    ]
    cit_report = parse_citations(sections, full_text)
    assert cit_report.total_references == 2
    assert len(cit_report.top_cited_works) == 2
    assert cit_report.all_references[0].in_text_count >= 1
