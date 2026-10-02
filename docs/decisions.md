# Architecture and Engineering Decision Log
# Healthcare Data Storage System (Hadoop HDFS + HBase + FastAPI + React)

## Decision 1: HDFS for Raw Historical JSON Storage
- **Date**: 2026-09-22
- **Decision**: Use Hadoop HDFS (`hdfs://localhost:9000`) for immutable, distributed raw file storage under `/healthcare/raw`.
- **Reason**: HDFS provides distributed storage and durability suitable for raw medical/clinical FHIR JSON bundles and audit logs.
- **Alternatives Considered**: Direct local NTFS storage (does not satisfy the distributed big data storage requirement).

## Decision 2: HBase for Structured High-Speed Patient Lookup
- **Date**: 2026-09-22
- **Decision**: Use HBase standalone/local mode with table `healthcare_patients` and column family `info`.
- **Reason**: HBase provides low-latency, column-oriented NoSQL lookups by patient ID, enabling quick random reads and scalable patient profile retrieval.
- **Alternatives Considered**: Relational database (slower on sparse/evolving clinical schema), querying raw HDFS on every request (unacceptable latency).

## Decision 3: Standalone HBase Mode and Embedded ZooKeeper
- **Date**: 2026-09-22
- **Decision**: Run HBase in standalone mode (`hbase.cluster.distributed=false`) where HMaster starts its internal ZooKeeper on port 2181.
- **Reason**: The Windows environment encounters ZooKeeper socket and process conflicts when ZooKeeper is launched manually as an external service. Standalone mode provides stable, verified local execution.
- **Rules**: Never start `hbase zookeeper` manually.

## Decision 4: HBase REST API for Data Access and Schema Management
- **Date**: 2026-09-22
- **Decision**: Use the HBase REST daemon (Stargate) on port 8080 as the programmatic interface from Python/FastAPI.
- **Reason**: The interactive Windows HBase shell experiences Jansi and JRuby runtime compatibility issues. The REST API offers a standardized, language-agnostic interface for table creation, schema inspection, cell puts/gets, and scanner operations.
- **Alternatives Considered**: Thrift (requires binary compiler and extra runtime daemon), HappyBase (frequently breaks on Windows due to thrift socket quirks).

## Decision 5: FastAPI as Dedicated Application Middleware
- **Date**: 2026-09-22
- **Decision**: Build a modular FastAPI backend with separate layers for services, routing, and Pydantic models.
- **Reason**: Strict security requirement: React frontend must never connect directly to HDFS or HBase. FastAPI provides schema validation, CORS protection, and controlled API endpoints.

## Decision 6: Patient Identification and HBase Schema
- **Date**: 2026-09-22
- **Decision**: Use the FHIR Patient UUID as the HBase row key (e.g., `37549f60-b5a3-69cd-dea6-5a71c4bc23cf`).
- **Reason**: Every patient file in `D:\assignment3db\dataset` is uniquely identified by the UUID embedded in both filename and the FHIR `Patient` resource ID. No synthetic IDs should be invented.
- **Traceability**: Store `info:raw_file_name` in HBase to maintain direct linkage between the structured record and the raw JSON file in HDFS.

## Decision 7: Frontend Technology Stack (React + Vite + TypeScript)
- **Date**: 2026-09-22
- **Decision**: Build the frontend with React 18, Vite 5, TypeScript 5, and custom responsive CSS.
- **Reason**: Provides rapid build times, strict compile-time type safety against backend Pydantic models, and high-performance client-side rendering without external runtime UI bloat.
- **Constraint**: The frontend communicates **strictly with FastAPI** (`http://127.0.0.1:8000/api`) and never communicates directly with HDFS (ports 9000/9870) or HBase (ports 8080/16000/2181).

## Decision 8: Controlled Idempotent Data Ingestion
- **Date**: 2026-09-22
- **Decision**: Implement an idempotent batch ingestion pipeline in `backend/app/services/ingestion_service.py` that parses FHIR bundles and maps clinical resources into HBase columns.
- **Reason**: Repeated ingestion triggers overwrite existing records cleanly by row key UUID without generating duplicate records or wasting memory.

## Decision 9: Secure HDFS Inspection via WebHDFS REST API
- **Date**: 2026-09-22
- **Decision**: Use WebHDFS HTTP endpoints (`/webhdfs/v1/healthcare/raw?op=LISTSTATUS` and `?op=OPEN`) with path sanitization guards.
- **Reason**: Protects against directory traversal (`..`) while providing high-speed streaming of JSON previews to the client.

## Decision 10: Centralized Health Diagnostic Polling
- **Date**: 2026-09-22
- **Decision**: Aggregate status across all 6 services (Backend, NameNode, DataNode, ZooKeeper, HMaster, HBase REST) in `GET /api/system/status`.
- **Reason**: Offers a single source of truth for the System Status view and header health pills without burdening individual micro-services with direct frontend pings.

