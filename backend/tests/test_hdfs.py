import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_hdfs_files_list():
    response = client.get("/api/hdfs/files")
    assert response.status_code == 200
    data = response.json()
    assert "total_files" in data
    assert "files" in data
    assert data["total_files"] == 111
    assert len(data["files"]) == 111

def test_hdfs_file_content_valid():
    sample_file = "Alexandra16_Mosciski958_37549f60-b5a3-69cd-dea6-5a71c4bc23cf.json"
    response = client.get(f"/api/hdfs/files/{sample_file}")
    assert response.status_code == 200
    data = response.json()
    assert data["filename"] == sample_file
    assert "content_json" in data
    assert data["content_json"]["resourceType"] == "Bundle"

def test_hdfs_file_content_invalid_path_traversal():
    response = client.get("/api/hdfs/files/..%2F..%2Fwindows%2Fwin.ini")
    # Path traversal must be blocked with 400 or 404
    assert response.status_code in (400, 404)

def test_hdfs_file_content_nonexistent():
    response = client.get("/api/hdfs/files/nonexistent_patient_file_12345.json")
    assert response.status_code == 404
