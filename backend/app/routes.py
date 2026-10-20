import os
import uuid
import pathlib
from fastapi import APIRouter, UploadFile, File, BackgroundTasks, HTTPException
from backend.core.pipeline import run_paperlens_pipeline
from backend.app.job_store import job_store
from backend.core.pipeline_schema import AnalysisJob
from backend.core.sample_paper import create_sample_paper_docx

router = APIRouter(prefix="/api", tags=["PaperLens Pipeline"])

SAMPLE_PAPERS_DIR = pathlib.Path(__file__).resolve().parent.parent.parent / "sample_papers"

PRESET_PAPERS = {
    "electra": {
        "title": "ELECTRA: Pre-training Text Encoders as Discriminators Rather Than Generators",
        "authors": "Kevin Clark et al. (ICLR 2020)",
        "file": "electra_paper.pdf",
        "description": "High reproducibility benchmark paper reporting learning rates, seeds, hardware, and baseline comparisons."
    },
    "roberta": {
        "title": "RoBERTa: A Robustly Optimized BERT Pretraining Approach",
        "authors": "Yinhan Liu et al. (2019)",
        "file": "roberta_paper.pdf",
        "description": "Optimized pretraining study detailing large batch sizes and extensive compute infrastructure."
    },
    "bert": {
        "title": "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding",
        "authors": "Jacob Devlin, Ming-Wei Chang, Kenton Lee, Kristina Toutanova (NAACL 2019)",
        "file": "bert_paper.pdf",
        "description": "The landmark paper introducing bidirectional encoder representations, SQuAD, and GLUE evaluation."
    },
    "transformer": {
        "title": "Attention Is All You Need",
        "authors": "Ashish Vaswani, Noam Shazeer, Niki Parmar, et al. (NeurIPS 2017)",
        "file": "attention_is_all_you_need.pdf",
        "description": "The seminal paper establishing the Transformer architecture, multi-head self-attention, and BLEU benchmarks."
    },
    "synthetic": {
        "title": "PaperLens: Automated Research Paper & Evidence Extraction",
        "authors": "Neel Sharma (AI & Data Science Scholar)",
        "file": "synthetic_paper.docx",
        "description": "Curated benchmark paper with complete open-science disclosures, baseline comparisons, and statistical significance."
    }
}

def process_pipeline_job(job_id: str, file_bytes: bytes, filename: str):
    """Background task running the 8-stage analysis."""
    job = job_store.get_job(job_id)
    if not job:
        return

    job.status = "processing"
    job_store.update_job(job)

    def progress_callback(percentage: int, stage_description: str):
        j = job_store.get_job(job_id)
        if j:
            j.progress_percentage = percentage
            j.current_stage = stage_description
            job_store.update_job(j)

    try:
        result = run_paperlens_pipeline(
            file_bytes=file_bytes,
            filename=filename,
            progress_callback=progress_callback
        )
        job = job_store.get_job(job_id)
        if job:
            job.status = "completed"
            job.progress_percentage = 100
            job.current_stage = "Finished"
            job.result = result
            job_store.update_job(job)
    except Exception as e:
        job = job_store.get_job(job_id)
        if job:
            job.status = "failed"
            job.error_message = str(e)
            job_store.update_job(job)

@router.get("/presets")
def list_preset_papers():
    """Returns curated famous research papers ready for instant 1-click analysis."""
    return [
        {"id": k, **v} for k, v in PRESET_PAPERS.items()
    ]

@router.post("/analyze-preset/{paper_id}")
async def analyze_preset_paper(paper_id: str, background_tasks: BackgroundTasks):
    """Triggers instant pipeline analysis on one of the famous benchmark papers."""
    if paper_id not in PRESET_PAPERS:
        raise HTTPException(status_code=404, detail="Preset paper not found.")

    preset = PRESET_PAPERS[paper_id]
    
    if paper_id == "synthetic":
        file_bytes = create_sample_paper_docx()
        filename = "PaperLens_Benchmark_Study.docx"
    else:
        file_path = SAMPLE_PAPERS_DIR / preset["file"]
        if not file_path.exists():
            raise HTTPException(status_code=404, detail=f"File {preset['file']} not downloaded on server.")
        with open(file_path, "rb") as f:
            file_bytes = f.read()
        filename = preset["file"]

    job_id = f"preset-{paper_id}-{uuid.uuid4().hex[:6]}"
    job_store.create_job(job_id)

    background_tasks.add_task(process_pipeline_job, job_id, file_bytes, filename)

    return {
        "job_id": job_id,
        "filename": filename,
        "title": preset["title"],
        "status": "pending",
        "poll_url": f"/api/jobs/{job_id}"
    }

@router.post("/analyze")
async def analyze_document(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    job_id = str(uuid.uuid4())
    job_store.create_job(job_id)

    background_tasks.add_task(process_pipeline_job, job_id, content, file.filename)

    return {
        "job_id": job_id,
        "filename": file.filename,
        "status": "pending",
        "poll_url": f"/api/jobs/{job_id}"
    }

@router.get("/jobs/{job_id}", response_model=AnalysisJob)
def get_job_status(job_id: str):
    job = job_store.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or expired.")
    return job

@router.get("/sample-demo")
async def run_sample_demo(background_tasks: BackgroundTasks):
    return await analyze_preset_paper("synthetic", background_tasks)
