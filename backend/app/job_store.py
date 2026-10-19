import time
from typing import Dict, Optional
from backend.core.pipeline_schema import AnalysisJob

class InMemoryJobStore:
    """
    In-memory job repository with timestamp tracking.
    Designed to be easily swapped with Redis for production scale.
    """
    def __init__(self, ttl_seconds: int = 3600):
        self._jobs: Dict[str, AnalysisJob] = {}
        self._timestamps: Dict[str, float] = {}
        self.ttl_seconds = ttl_seconds

    def create_job(self, job_id: str) -> AnalysisJob:
        self._cleanup()
        job = AnalysisJob(
            job_id=job_id,
            status="pending",
            progress_percentage=0,
            current_stage="Job submitted"
        )
        self._jobs[job_id] = job
        self._timestamps[job_id] = time.time()
        return job

    def get_job(self, job_id: str) -> Optional[AnalysisJob]:
        self._cleanup()
        return self._jobs.get(job_id)

    def update_job(self, job: AnalysisJob):
        self._jobs[job.job_id] = job
        self._timestamps[job.job_id] = time.time()

    def _cleanup(self):
        now = time.time()
        expired = [jid for jid, ts in self._timestamps.items() if now - ts > self.ttl_seconds]
        for jid in expired:
            self._jobs.pop(jid, None)
            self._timestamps.pop(jid, None)

job_store = InMemoryJobStore()
