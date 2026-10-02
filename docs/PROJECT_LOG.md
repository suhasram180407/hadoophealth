# Project Log & Decision Audit
# Healthcare Data Storage System

## [Phase 0] Environment & Workspace Verification — 2026-09-22 23:14

**Action:** Inspected `D:\assignment3db` workspace, Hadoop configuration, HBase configuration, and dataset.

**Reasoning:** Must establish baseline state without destroying or modifying existing components.

**Alternatives considered:** None. Direct verification of existing state is mandatory.

**Result:** Verified 111 JSON files in `D:\assignment3db\dataset`, Hadoop 3.3.6 at `C:\hadoop`, HBase 2.5.15 at `C:\hbase`. Ports 9000, 9870, 2181, 8080 are free.

---

## [Phase 1] HDFS Startup and Cluster Verification (Gate 1) — 2026-09-22 23:20

**Action:** Started HDFS NameNode and DataNode daemons using Hadoop 3.3.6 on Windows 11. Verified health and file counts.

**Reasoning:** Master agent prompt requires non-destructive verification of HDFS before touching any other component.

**Alternatives considered:** None. HDFS is the required raw data repository.

**Result:** PASS.
- NameNode and DataNode active in `jps`.
- `hdfs dfsadmin -report` confirmed 1 Live DataNode with 371.14 MB DFS Used and 111 blocks.
- `hdfs dfs -ls /healthcare/raw | find /C ".json"` returned exactly 111 files.
- Safe Mode is OFF. Gate 1 checklist 100% satisfied.

---

## [Phase 2] HBase Standalone Startup & ZooKeeper Verification (Gate 2) — 2026-09-22 23:28

**Action:** Resolved filesystem permissions on `C:\hbase\data` (`.tmp` creation issue) and started standalone HMaster via `bin\hbase.cmd master start` without manual ZooKeeper invocation.

**Reasoning:** Windows standalone mode uses embedded MiniZooKeeperCluster. Prior runs hit Windows ACL deny flag on `C:\hbase\data\.tmp`; removing deny rule and granting explicit write access allowed clean initialization.

**Alternatives considered:** External ZooKeeper was considered and rejected per Rule 5 (avoids Windows port conflict).

**Result:** PASS.
- HMaster active in `jps` (PID 18172).
- ZooKeeper confirmed LISTENING on port 2181 with established connections.
- HMaster completed active master initialization in 10.6 seconds. Gate 2 checklist 100% satisfied.

---

## [Phase 3] HBase REST Startup & Cluster Status Verification (Gate 3) — 2026-09-22 23:29

**Action:** Confirmed port 8080 was free, started HBase REST daemon via `bin\hbase.cmd rest start`, and queried `/version` and `/status/cluster`.

**Reasoning:** Master prompt requires HBase REST on port 8080 as the sole interface for programmatic backend access to HBase, avoiding Windows JRuby shell issues.

**Alternatives considered:** Direct Java client or Thrift. REST API is lightweight, HTTP-native, and verified against HMaster.

**Result:** PASS.
- RESTServer running in `jps` (PID 14768).
- `curl http://localhost:8080/version` returned `Version: 2.5.15-hadoop3`.
- `curl http://localhost:8080/status/cluster` reported 1 live server (`Suhasram:16020`) with 2 regions (`hbase:meta`, `hbase:namespace`) and 0 dead servers.
- Gate 3 checklist 100% satisfied.

---

## [Phase 4] Healthcare JSON Schema Inspection (Gate 4) — 2026-09-22 23:29

**Action:** Inspected 109 patient FHIR bundles, 1 Organization file, and 1 Practitioner file in `D:\assignment3db\dataset`.

**Reasoning:** Master prompt requires ground-truth inspection of keys and relations before designing table structure or writing ingestion code.

**Alternatives considered:** None.

**Result:** PASS.
- Patient entries contain standard FHIR R4 resources: `Patient` (UUID id, name, gender, birthDate, address, telecom), `Encounter`, `Condition`, `MedicationRequest`, `Observation`, `Procedure`.
- Encounters link directly to healthcare organizations and practitioners with display names and identifiers.
- 557 Organizations and 556 Practitioners cataloged.

---

## [Phase 5] HBase Table Design & Programmatic Creation (Gate 5) — 2026-09-22 23:30

**Action:** Defined HBase schema for table `healthcare_patients` with column family `info`. Created table programmatically using HBase REST API `POST /healthcare_patients/schema`.

**Reasoning:** Master prompt requires avoiding interactive HBase shell on Windows due to JRuby/Jansi issues. REST API is the reliable programmatic alternative.

**Alternatives considered:** HBase shell (rejected due to known Windows bugs).

**Result:** PASS.
- REST API returned HTTP 201 Created.
- `GET http://localhost:8080/` confirmed `healthcare_patients` present in table inventory.

---

## [Phases 6–10] FastAPI Backend, Service Layers, Ingestion & Automated Testing (Gate 6) — 2026-09-22 23:42

**Action:** Built layered FastAPI backend in Python 3.11 (`backend/app/`), wired WebHDFS client on port 9870, HBase REST client on port 8080, FHIR ingestion pipeline, and diagnostics aggregator. Executed pytest suite and verified all endpoints via HTTP.

**Reasoning:** Master prompt mandates that React frontend must never connect directly to HDFS or HBase; FastAPI acts as the single secure backend gateway with input validation, path traversal guards, and pagination.

**Alternatives considered:** Direct client-side HDFS/HBase querying (strictly prohibited by architecture).

**Result:** PASS.
- Pytest suite: 10/10 tests passed (health, system status, HDFS file list, safe path restriction, patient pagination, error handling, ingestion).
- Automated ingestion parsed all 109 patient FHIR bundles into HBase `healthcare_patients` table in 9.7 seconds with 0 errors.
- `GET /api/health` returned `{"backend":"ok","hdfs":"ok","hbase":"ok"}`.
- `GET /api/system/status` verified all 6 components (Backend, NameNode, DataNode, HMaster, ZooKeeper, HBase REST) in "ok" state.
- Uvicorn backend listening as daemon on `http://127.0.0.1:8000`. Gate 6 checklist 100% satisfied.

---

## [Phases 11–15] React Frontend Development & Integration (Gate 7) — 2026-09-23 00:10

**Action:** Initialized Vite + React 18 + TypeScript 5 application under `frontend/`. Implemented Dashboard, Patients directory, Patient Details view, HDFS Raw Data explorer, System Status matrix, and Ingestion controller with custom responsive CSS.

**Reasoning:** Master prompt mandates a clean, academic/project-demo quality user interface that connects strictly through FastAPI (`/api/*`), maintaining strict separation from underlying HDFS and HBase services.

**Alternatives considered:** Direct HDFS/HBase querying (prohibited by architectural rules).

**Result:** PASS.
- Built production bundle with `npm run build` in 1.06s with 0 TypeScript/compilation errors.
- Development server running on `http://127.0.0.1:5173/`.
- All views wired to FastAPI endpoints (`/api/patients`, `/api/patients/{id}`, `/api/hdfs/files`, `/api/system/status`, `/api/ingestion/*`).
- Gate 7 checklist 100% satisfied.

---

## [Phases 16–17] End-to-End System Verification & Operational Documentation — 2026-09-23 00:17

**Action:** Executed end-to-end data pipeline validation across HDFS (`/healthcare/raw`), HBase (`healthcare_patients`), FastAPI backend (port 8000), and React frontend (port 5173). Authored `docs/STARTUP.md` and `docs/SHUTDOWN.md`.

**Reasoning:** Ensures full repeatability and safe cluster lifecycle management without manual ZooKeeper conflicts or cluster corruption.

**Alternatives considered:** None.

**Result:** PASS.
- HDFS operational with 111 raw files.
- HBase standalone mode active with embedded ZooKeeper listening on port 2181.
- HBase REST server operational on port 8080.
- 109 patient FHIR bundles ingested into HBase with direct raw-file lineage tracking.
- All 10 backend automated tests passed.
- Frontend builds cleanly and communicates exclusively with FastAPI.
- Operational documentation complete in `docs/STARTUP.md`, `docs/SHUTDOWN.md`, and `docs/decisions.md`.

---

## [Phase 17] Full System Reactivation & Health Verification — 2026-09-23 16:53

**Action:** Following environment reboot, re-executed the ordered startup sequence from `docs/STARTUP.md`: launched HDFS NameNode (PID 26280, RPC 9000 / WebHDFS 9870), DataNode (9866/9864), standalone HBase Master (PID 26832, embedded ZooKeeper 2181 / HMaster 16000 / UI 16010), HBase REST Server (8080), FastAPI backend (8000), and React Vite development server (5173).

**Reasoning:** Standalone HBase and HDFS daemons were stopped during system reboot; restarting them strictly according to the documented startup sequence ensures clean ZooKeeper ephemeral state and uncorrupted region assignments.

**Alternatives considered:** Manual ad-hoc startup without port checking; rejected to avoid ZooKeeper port 2181 conflicts and premature REST server connections.

**Result:**
- HDFS verified: 1 live DataNode, 111 blocks, 111 JSON files present in `/healthcare/raw`.
- HBase verified: HMaster and embedded ZooKeeper online; REST daemon returned `HBase 2.5.15-hadoop3`; `healthcare_patients` table online with 109 patient records.
- FastAPI backend verified: `{"backend":"ok","hdfs":"ok","hbase":"ok"}`.
- Automated tests: 10/10 passed in `backend/tests/` via pytest in 22.35s.
- React frontend verified: Responding on `http://127.0.0.1:5173/`.

---

## [Phase 17] HBase Standalone Idle Timeout Hardening — 2026-09-23 21:35

**Action:** Updated `C:\hbase\conf\hbase-site.xml` to configure `zookeeper.session.timeout = 3600000`, `hbase.zookeeper.property.maxSessionTimeout = 3600000`, `hbase.zookeeper.property.minSessionTimeout = 10000`, and `hbase.regionserver.lease.period = 3600000`. Backed up previous configuration to `C:\hbase\conf\hbase-site.xml.bak`. Restarted HMaster (PID 2728) and HBase REST Server (8080).

**Reasoning:** Windows power-saving and JVM pause events exceeded HBase's default 40-second ZooKeeper session timeout when the host was idle, causing HMaster to abort with `KeeperErrorCode = Session expired`. Increasing the timeout to 1 hour (3,600,000 ms) provides stability against OS thread throttling and sleep states in local standalone mode.

**Alternatives considered:** Running an external independent ZooKeeper instance; rejected because the master prompt strictly requires standalone HBase with embedded ZooKeeper to avoid port and Windows process conflicts.

**Result:** Configured both client (`hbase-site.xml`) and server-side (`C:\hbase\conf\zoo.cfg` with `maxSessionTimeout=3600000`, `minSessionTimeout=10000`, `tickTime=6000`). HMaster, embedded ZooKeeper (2181), and HBase REST (8080) restarted cleanly; verified `healthcare_patients` region online; FastAPI `/api/health` confirmed `{"backend":"ok","hdfs":"ok","hbase":"ok"}`.

---

## [Phase 17] System Resumption & Health Verification — 2026-09-24 09:32

**Action:** Following overnight host sleep, restarted standalone HBase Master (PID 17156) and HBase REST Server (port 8080). Verified HDFS NameNode (port 9000/9870), DataNode (9866/9864), FastAPI backend (8000), and React Vite development server (5173).

**Reasoning:** Overnight sleep pause (>5.5 hours) naturally exceeded the 1-hour session timeout; restarting HMaster re-initialized ZooKeeper state without data loss.

**Result:**
- HDFS verified: 111 raw FHIR bundles in `/healthcare/raw` (`GET /api/hdfs/files` returned 111 files).
- HBase verified: Table `healthcare_patients` online with 115 patient records (`GET /api/patients` returned 115 records).
- FastAPI backend verified: `{"backend":"ok","hdfs":"ok","hbase":"ok"}`.
- React frontend verified: Serving at `http://localhost:5173/` (HTTP 200).

---

## [Phase 17] Full System Reactivation & WAL Recovery — 2026-09-28 09:28

**Action:** Initiated full startup sequence for HDFS (NameNode, DataNode), HBase (HMaster, embedded ZooKeeper, HBase REST), FastAPI backend, and React Vite frontend. Resolved an `IllegalArgumentException: Not a regular file` inside `C:\hbase\data\WALs\suhasram,16020,1790222492503-splitting` by moving the nested leftover splitting directory to `C:\hbase\data\corrupt\`.

**Reasoning:** An orphaned dead-server splitting folder with a nested subdirectory caused HMaster's `SplitWALRemoteProcedure` to repeatedly crash during active master initialization. Relocating this already-archived directory allowed HMaster initialization to succeed in 8.5 seconds and unblock table region assignments.

**Result:**
- HDFS operational: NameNode (port 9000/9870), DataNode (port 9864), 111 raw FHIR bundles in `/healthcare/raw`, Safe Mode OFF.
- HBase operational: HMaster (PID active, port 16000/16010), embedded ZooKeeper (port 2181), HBase REST (port 8080).
- Table `healthcare_patients` online with 115 records.
- FastAPI backend operational at `http://127.0.0.1:8000/`: health returned `{"backend":"ok","hdfs":"ok","hbase":"ok"}`.
- Automated tests: 10/10 pytest suite tests passed.
- React frontend running at `http://127.0.0.1:5173/` (HTTP 200).

---

## [Phase 17] Full System Reactivation & Health Verification — 2026-09-30 09:32

**Action:** Initiated full startup sequence from `docs/STARTUP.md`: launched HDFS NameNode (RPC 9000, WebHDFS 9870), DataNode (9864/9866), standalone HBase Master (PID 15236, embedded ZooKeeper 2181, Web UI 16010, RPC 16000), HBase REST Server (port 8080), FastAPI backend (port 8000), and React Vite development server (port 5173). Executed automated test suite and endpoint checks.

**Reasoning:** User requested running the project. Starting services in strict topological order ensures embedded ZooKeeper initializes before HBase REST and backend middleware start.

**Alternatives considered:** None.

**Result:** PASS.
- HDFS: NameNode and DataNode active; 111 raw files verified in `/healthcare/raw`.
- HBase: HMaster and embedded ZooKeeper (2181) listening; REST server responds on port 8080; `healthcare_patients` table online.
- FastAPI backend: `GET /api/health` returned `{"backend":"ok","hdfs":"ok","hbase":"ok"}`.
- Automated tests: 10/10 passed in `backend/tests/` via pytest in 24.78s.
- React frontend: Running and accessible at `http://localhost:5173/`.

---

## [Phase 17] Created Dedicated Manual Running Order Reference — 2026-10-02 13:46

**Action:** Created [`RUNNING_ORDER.md`](file:///d:/assignment3db/RUNNING_ORDER.md) and [`running_order.md`](file:///d:/assignment3db/running_order.md) containing only the exact manual execution commands in strict topological order across terminal windows.

**Reasoning:** User requested a dedicated, clean file containing only the order of the manual running commands without extraneous commentary for rapid reference.

**Result:** Created concise manual command sequence covering Step 1 (HDFS NameNode), Step 2 (HDFS DataNode), Step 3 (HDFS Verification), Step 4 (HBase Master), Step 5 (HBase REST), Step 6 (FastAPI Backend), Step 7 (React Frontend), along with verification cURL commands and browser URLs.

