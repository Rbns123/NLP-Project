import time
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.core.sample_paper import create_sample_paper_docx

client = TestClient(app)

def test_full_pipeline_sample_demo():
    # 1. Trigger sample-demo endpoint
    response = client.get("/api/sample-demo")
    assert response.status_code == 200
    data = response.json()
    assert "job_id" in data
    job_id = data["job_id"]

    # 2. Poll job until completion
    status_data = None
    for _ in range(30):
        res = client.get(f"/api/jobs/{job_id}")
        assert res.status_code == 200
        status_data = res.json()
        if status_data["status"] in ("completed", "failed"):
            break
        time.sleep(0.1)

    assert status_data is not None
    assert status_data["status"] == "completed"
    assert status_data["progress_percentage"] == 100
    
    result = status_data["result"]
    assert result is not None
    assert len(result["sections"]) >= 5
    assert len(result["entities"]) >= 5
    assert len(result["triplets"]) >= 1
    assert len(result["claims"]) >= 2
    assert result["reproducibility"]["score"] > 0
    assert result["citations"]["total_references"] == 3
    assert len(result["summary"]["approach"]) >= 1

def test_upload_invalid_file():
    files = {"file": ("corrupt.txt", b"plain text with no pdf or docx signature", "text/plain")}
    response = client.post("/api/analyze", files=files)
    assert response.status_code == 200
    job_id = response.json()["job_id"]

    # Polling should mark it as failed
    for _ in range(20):
        res = client.get(f"/api/jobs/{job_id}")
        data = res.json()
        if data["status"] == "failed":
            assert "Unsupported or invalid file format" in data["error_message"]
            return
        time.sleep(0.1)
    
    assert False, "Job did not fail as expected for invalid file"
