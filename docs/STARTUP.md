# Healthcare Data Storage System — Startup Guide
# Hadoop HDFS + HBase + FastAPI + React

Follow this startup procedure in strict order whenever launching the complete system.

> [!IMPORTANT]
> **CRITICAL HBASE STANDALONE RULE:**
> **DO NOT manually start ZooKeeper** (`bin\hbase.cmd zookeeper`).
> In HBase standalone/local mode, HMaster automatically starts its internal embedded ZooKeeper on port 2181.
> Manual ZooKeeper execution causes port conflicts and cluster initialization failures.

---

## Startup Sequence Overview

| Step | Component | Port | Window / Command |
|---|---|---|---|
| **1** | HDFS NameNode | `9000` (RPC), `9870` (HTTP) | CMD #1: `hdfs namenode` |
| **2** | HDFS DataNode | `9864` (HTTP), `9866` (Data) | CMD #2: `hdfs datanode` |
| **3** | HDFS Verification | — | CMD #3: `jps` & `dfsadmin -report` |
| **4** | HBase Master | `16000` (RPC), `16010` (Web UI), `2181` (ZK) | CMD #4: `bin\hbase.cmd master start` |
| **5** | HBase Master & ZK Verify | — | CMD #5: `jps` & `netstat -ano \| findstr ":2181"` |
| **6** | HBase REST Server | `8080` (HTTP) | CMD #6: `bin\hbase.cmd rest start` |
| **7** | FastAPI Backend | `8000` (HTTP) | CMD #7: `uvicorn app.main:app --host 127.0.0.1 --port 8000` |
| **8** | React Frontend | `5173` (HTTP) | CMD #8: `npm run dev` |

---

## Detailed Step-by-Step Instructions

### STEP 1 — Start HDFS NameNode
Open **CMD #1**:
```cmd
cd /d C:\hadoop
hdfs namenode
```
*Keep this window open and running.*

---

### STEP 2 — Start HDFS DataNode
Open **CMD #2**:
```cmd
cd /d C:\hadoop
hdfs datanode
```
*Keep this window open and running.*

---

### STEP 3 — Verify HDFS Health
Open **CMD #3** (verification window):
```cmd
jps
```
Expected output includes:
- `NameNode`
- `DataNode`

Verify the cluster report:
```cmd
hdfs dfsadmin -report
```
Expected: `Live datanodes (1)`

Verify the 111 raw healthcare JSON files in HDFS:
```cmd
hdfs dfs -ls /healthcare/raw | find /C ".json"
```
Expected output:
```
111
```
*If HDFS verification fails, STOP and resolve HDFS before continuing.*

---

### STEP 4 — Start HBase Master
Open **CMD #4**:
```cmd
cd /d C:\hbase
bin\hbase.cmd master start
```
*Wait 15–30 seconds for active master initialization and embedded ZooKeeper startup.*

---

### STEP 5 — Verify HBase Master & ZooKeeper
In **CMD #3** or **CMD #5**:
```cmd
jps
```
Expected output includes:
- `NameNode`
- `DataNode`
- `HMaster`

Verify ZooKeeper is listening on port 2181:
```cmd
netstat -ano | findstr ":2181"
```
Expected: Listener on `127.0.0.1:2181` (`LISTENING`).

---

### STEP 6 — Start HBase REST Daemon
Open **CMD #6**:
```cmd
cd /d C:\hbase
bin\hbase.cmd rest start
```
Verify HBase REST responds:
```cmd
curl http://localhost:8080/version
curl http://localhost:8080/status/cluster
```
Expected output contains `HBase 2.5.15-hadoop3` and `1 live servers, 0 dead servers`.

---

### STEP 7 — Start FastAPI Backend Server
Open **CMD #7**:
```cmd
cd /d D:\assignment3db\backend
.venv\Scripts\activate
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
Verify backend health:
```cmd
curl http://127.0.0.1:8000/api/health
```
Expected output:
```json
{"backend":"ok","hdfs":"ok","hbase":"ok"}
```

---

### STEP 8 — Start React Frontend
Open **CMD #8**:
```cmd
cd /d D:\assignment3db\frontend
npm run dev
```
Open your browser at:
`http://localhost:5173/`

---

## Verification Checklist

- [x] HDFS contains 111 raw FHIR JSON bundles under `/healthcare/raw`.
- [x] HBase table `healthcare_patients` exists with column family `info`.
- [x] HBase REST responds at `http://localhost:8080/`.
- [x] FastAPI backend responds at `http://127.0.0.1:8000/api/health`.
- [x] React frontend runs at `http://localhost:5173/`.
