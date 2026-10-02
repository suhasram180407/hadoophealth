import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_system_status_endpoint():
    response = client.get("/api/system/status")
    assert response.status_code == 200
    data = response.json()
    assert "backend" in data
    assert "hdfs_namenode" in data
    assert "hdfs_datanode" in data
    assert "hbase_master" in data
    assert "zookeeper" in data
    assert "hbase_rest" in data
    assert "dataset" in data
    assert "hbase_table" in data
    assert data["backend"]["status"] == "ok"
    assert data["dataset"]["total_files"] == 111
