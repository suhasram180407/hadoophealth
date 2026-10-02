import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_patients_pagination():
    response = client.get("/api/patients?page=1&page_size=10")
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert "page" in data
    assert "page_size" in data
    assert "items" in data
    assert data["page"] == 1
    assert data["page_size"] == 10

def test_patient_not_found():
    response = client.get("/api/patients/non-existent-uuid-999999999")
    assert response.status_code == 404
    assert "not found in HBase" in response.json()["detail"]
