# Healthcare Data Storage System — Frontend

Modern React 18 + Vite 5 + TypeScript 5 dashboard for exploring raw medical files in HDFS and structured clinical patient records in HBase.

## Architecture & Security
The frontend communicates **strictly with the FastAPI backend** (`http://127.0.0.1:8000/api`) and never establishes direct connections to HDFS or HBase.

## Views
1. **Dashboard**: Metrics overview, cluster health matrix, ingestion summary.
2. **Patients**: Filterable, searchable directory with pagination and patient details.
3. **Patient Details**: Full patient clinical profile with direct link to raw HDFS source bundle.
4. **HDFS Raw Storage**: Explorer for `/healthcare/raw` with syntax-highlighted JSON viewer.
5. **System Status**: Component-by-component diagnostic monitor.
6. **Data Ingestion**: Interactive ingestion control panel with progress and audit trail.

## Local Execution
```powershell
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173/` in your browser.
