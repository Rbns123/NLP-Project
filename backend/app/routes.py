import uuid
from fastapi import APIRouter, UploadFile, File, BackgroundTasks, HTTPException
from backend.core.pipeline import run_paperlens_pipeline
from backend.app.job_store import job_store
from backend.core.pipeline_schema import AnalysisJob
from backend.core.sample_paper import create_sample_paper_docx

router = APIRouter(prefix="/api", tags=["PaperLens Pipeline"])

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

@router.post("/analyze")
async def analyze_document(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    """
    Accepts PDF or DOCX file, validates size, registers async analysis job,
    and returns job_id for progressive polling.
    """
    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    job_id = str(uuid.uuid4())
    job = job_store.create_job(job_id)

    background_tasks.add_task(process_pipeline_job, job_id, content, file.filename)

    return {
        "job_id": job_id,
        "filename": file.filename,
        "status": "pending",
        "poll_url": f"/api/jobs/{job_id}"
    }

@router.get("/jobs/{job_id}", response_model=AnalysisJob)
def get_job_status(job_id: str):
    """Returns progressive job status, progress percentage, or full analysis result JSON."""
    job = job_store.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or expired.")
    return job

@router.get("/sample-demo")
async def run_sample_demo(background_tasks: BackgroundTasks):
    """
    Immediate demo trigger using bundled scientific paper document.
    """
    sample_bytes = create_sample_paper_docx()
    job_id = f"demo-{uuid.uuid4().hex[:8]}"
    job_store.create_job(job_id)

    background_tasks.add_task(
        process_pipeline_job,
        job_id,
        sample_bytes,
        "Sample_PaperLens_Study.docx"
    )

    return {
        "job_id": job_id,
        "message": "Sample scientific paper demo job launched.",
        "poll_url": f"/api/jobs/{job_id}"
    }
