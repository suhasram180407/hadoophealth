# Healthcare Data Storage Backend API

FastAPI backend serving as the secure middleware between the React frontend and underlying big data infrastructure (HDFS raw storage & HBase structured NoSQL storage).

## Features
- **Health & Diagnostics (`/api/health`, `/api/system/status`)**: Live multi-node verification of HDFS NameNode, DataNode, HMaster, ZooKeeper, HBase REST, and FastAPI.
- **Structured Patients (`/api/patients`)**: Paginated scanning and UUID lookup from HBase table `healthcare_patients`.
- **Raw File Explorer (`/api/hdfs/files`)**: Directory inspection and safe JSON streaming from HDFS `/healthcare/raw` via WebHDFS.
- **Idempotent Ingestion (`/api/ingestion/run`)**: Batch parser mapping FHIR R4 bundles into HBase column families.

## Local Execution
```powershell
cd backend
.venv\Scripts\activate
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

## Running Tests
```powershell
cd backend
.venv\Scripts\pytest -v
```
