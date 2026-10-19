from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_service_discovery():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "PaperLens"
    assert "endpoints" in data
    assert data["status"] == "online"

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "telemetry" in data
    telemetry = data["telemetry"]
    assert "device" in telemetry
    assert "modules" in telemetry
    assert telemetry["modules"]["ingestion"]["status"] == "ready"
