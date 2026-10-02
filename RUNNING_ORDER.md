# Manual Running Order

### Step 1: Start HDFS NameNode (Terminal 1)
```cmd
cd /d C:\hadoop
bin\hdfs.cmd namenode
```

### Step 2: Start HDFS DataNode (Terminal 2)
```cmd
cd /d C:\hadoop
bin\hdfs.cmd datanode
```

### Step 3: Verify HDFS (Terminal 3 - Optional Check)
```cmd
jps
hdfs dfsadmin -report
hdfs dfs -ls /healthcare/raw
```

### Step 4: Start HBase Master (Terminal 4)
```cmd
cd /d C:\hbase
bin\hbase.cmd master start
```
*(Wait 15-20 seconds for embedded ZooKeeper on port 2181 and HMaster initialization)*

### Step 5: Start HBase REST Gateway (Terminal 5)
```cmd
cd /d C:\hbase
bin\hbase.cmd rest start
```

### Step 6: Start FastAPI Backend (Terminal 6)
```cmd
cd /d D:\assignment3db\backend
.venv\Scripts\activate
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### Step 7: Start React Frontend (Terminal 7)
```cmd
cd /d D:\assignment3db\frontend
npm run dev
```

---

### Verification Commands (Terminal 3)
```cmd
curl http://localhost:8080/version
curl http://localhost:8080/status/cluster
curl http://127.0.0.1:8000/api/health
```

### Browser URLs
- React Dashboard: http://localhost:5173/
- FastAPI Swagger UI: http://localhost:8000/docs
- HDFS NameNode Console: http://localhost:9870/
- HBase Master Console: http://localhost:16010/
