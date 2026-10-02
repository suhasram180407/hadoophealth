import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert "backend" in data
    assert "hdfs" in data
    assert "hbase" in data
    assert data["backend"] == "ok"
