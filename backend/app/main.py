import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import settings
from backend.core.engine_status import get_engine_status

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Automated Research Paper & Evidence Analyzer API"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def service_discovery():
    """Service discovery endpoint providing API metadata and links to key routes."""
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.APP_ENV,
        "status": "online",
        "documentation": "/docs",
        "endpoints": {
            "health": "/health",
            "analyze": "POST /api/analyze",
            "jobs": "GET /api/jobs/{job_id}",
            "sample_demo": "GET /api/sample-demo"
        }
    }

@app.get("/health")
def health_check():
    """Detailed health check and per-module engine status."""
    engine_telemetry = get_engine_status()
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "telemetry": engine_telemetry
    }
