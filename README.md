# Healthcare Data Storage System (Hadoop HDFS + HBase + FastAPI + React)

A complete big data healthcare storage and retrieval system running on Windows 11. It combines Hadoop HDFS for raw, immutable clinical JSON storage and HBase for structured, high-speed NoSQL patient lookups, exposed via a layered FastAPI middleware and visualized with a modern React dashboard.

---

## Architecture

```
                    React Frontend (Vite + TypeScript)
                                  │
                                  │ HTTP / REST (Port 5173 ➔ 8000)
                                  ▼
                        FastAPI Backend Gateway
                        /                      \
                       /                        \
                      ▼                          ▼
               HDFS (WebHDFS)            HBase REST (Stargate)
              Port 9000 / 9870                 Port 8080
                      │                          │
                      ▼                          ▼
                /healthcare/raw         healthcare_patients
             (111 raw FHIR JSON)       (Structured NoSQL records)
```

- **HDFS**: Stores raw, multi-resource HL7 FHIR JSON bundles (`/healthcare/raw`).
- **HBase**: Standalone NoSQL engine storing normalized patient profiles, clinical metrics, and provider links under table `healthcare_patients` (column family `info`).
- **FastAPI**: Acts as the sole backend interface; validates schemas, secures HDFS path access, manages pagination, and provides ingestion.
- **React**: Provides a responsive academic/clinical dashboard; never connects directly to HDFS or HBase.

---

## Prerequisites & Existing Environment

- **Operating System**: Windows 11
- **Java**: Adoptium JDK 11 (`11.0.32`)
- **Hadoop**: Apache Hadoop 3.3.6 (`C:\hadoop`)
- **HBase**: Apache HBase 2.5.15-hadoop3 (`C:\hbase`)
- **Python**: 3.11 (`backend/.venv`)
- **Node.js**: v24.13.1, npm 11.8.0

---

## Quick Start Sequence

> [!IMPORTANT]
> **DO NOT manually start ZooKeeper.** HMaster automatically initializes the local embedded ZooKeeper on port 2181.

For detailed CMD windows and command reference, see [`docs/STARTUP.md`](file:///d:/assignment3db/docs/STARTUP.md).

```cmd
:: 1. Start HDFS NameNode
cd /d C:\hadoop && hdfs namenode

:: 2. Start HDFS DataNode
cd /d C:\hadoop && hdfs datanode

:: 3. Start HBase Master
cd /d C:\hbase && bin\hbase.cmd master start

:: 4. Start HBase REST
cd /d C:\hbase && bin\hbase.cmd rest start

:: 5. Start Backend Server
cd /d D:\assignment3db\backend
.venv\Scripts\activate
uvicorn app.main:app --host 127.0.0.1 --port 8000

:: 6. Start React Frontend
cd /d D:\assignment3db\frontend
npm run dev
```

Open: `http://localhost:5173/`

---

## Safe Shutdown
Follow [`docs/SHUTDOWN.md`](file:///d:/assignment3db/docs/SHUTDOWN.md) to gracefully stop React, FastAPI, HBase REST, HMaster, DataNode, and NameNode in reverse order.

---

## Project Structure

```
assignment3db/
├── backend/
│   ├── app/
│   │   ├── config.py
│   │   ├── main.py
│   │   ├── models/
│   │   ├── routes/
│   │   └── services/
│   ├── tests/
│   ├── requirements.txt
│   ├── pytest.ini
│   ├── .env
│   ├── .env.example
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── types/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.ts
│   └── README.md
├── dataset/                    (111 raw FHIR JSON files - Untouched)
├── docs/
│   ├── STARTUP.md              (Startup guide)
│   ├── SHUTDOWN.md             (Shutdown guide)
│   ├── decisions.md            (Architecture & design log)
│   ├── audit.log               (Execution & gate audit log)
│   └── PROJECT_LOG.md          (Authoritative project decision log)
└── README.md
```

---

## Verification & Automated Tests
To run the automated backend test suite:
```powershell
cd D:\assignment3db\backend
.venv\Scripts\pytest -v
```
Output:
```
======================= 10 passed in 20.83s =======================
```
