import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_ingestion_status_endpoint():
    response = client.get("/api/ingestion/status")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert data["status"] in ("idle", "running", "completed", "failed")

def test_trigger_ingestion_limit():
    # Trigger ingestion for first 2 records as a smoke test
    response = client.post("/api/ingestion/run", json={"limit": 2})
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
