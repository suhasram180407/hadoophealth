# Healthcare Data Storage System — Safe Shutdown Guide

To ensure zero data corruption, WAL clean flush, and clean socket release, follow this shutdown order in reverse.

> [!WARNING]
> **NEVER kill random Java processes via Windows Task Manager** without shutting down daemons gracefully. Doing so can cause uncommitted WALs or stale ZooKeeper ephemeral nodes.

---

## Safe Shutdown Sequence (Reverse of Startup)

### 1. Stop React Frontend
- Switch to **CMD #8** (running `npm run dev`).
- Press `Ctrl + C` and type `Y` to terminate the development server.

---

### 2. Stop FastAPI Backend
- Switch to **CMD #7** (running `uvicorn`).
- Press `Ctrl + C` to gracefully stop the ASGI server.

---

### 3. Stop HBase REST Server
- Switch to **CMD #6** (running `bin\hbase.cmd rest start`).
- Press `Ctrl + C` or run:
  ```cmd
  cd /d C:\hbase
  bin\hbase.cmd rest stop
  ```

---

### 4. Stop HBase Master
- Switch to **CMD #4** (running `bin\hbase.cmd master start`).
- Press `Ctrl + C` or run:
  ```cmd
  cd /d C:\hbase
  bin\hbase.cmd master stop
  ```
- *Wait 15–20 seconds* for HMaster to flush regions and cleanly shut down the embedded ZooKeeper.

---

### 5. Stop HDFS DataNode
- Switch to **CMD #2** (running `hdfs datanode`).
- Press `Ctrl + C` to gracefully disconnect the DataNode from NameNode.

---

### 6. Stop HDFS NameNode
- Switch to **CMD #1** (running `hdfs namenode`).
- Press `Ctrl + C` to save the fsimage and shut down the NameNode.

---

## Final Process Verification
Run:
```cmd
jps
```
Expected output:
```
12345 Jps
```
No `NameNode`, `DataNode`, `HMaster`, or `RESTServer` processes should remain.
