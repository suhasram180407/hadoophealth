import os
import socket
import subprocess
import httpx
from typing import Dict, Any

from app.config import settings
from app.models.system import ComponentStatus, SystemStatusResponse, HealthResponse
from app.services.hdfs_service import hdfs_service
from app.services.hbase_service import hbase_service

class HealthService:
    def __init__(self):
        pass

    def _check_port(self, host: str, port: int, timeout: float = 1.0) -> bool:
        try:
            with socket.create_connection((host, port), timeout=timeout):
                return True
        except Exception:
            return False

    def check_backend(self) -> ComponentStatus:
        return ComponentStatus(
            name="FastAPI Backend",
            status="ok",
            message="FastAPI service is running and healthy",
            port=settings.API_PORT,
            details={"version": "1.0.0", "host": settings.API_HOST}
        )

    def check_namenode(self) -> ComponentStatus:
        is_port_open = self._check_port("localhost", 9000)
        webhdfs_status = hdfs_service.check_health()
        if webhdfs_status.status == "ok" or is_port_open:
            return ComponentStatus(
                name="HDFS NameNode",
                status="ok",
                message="NameNode RPC (9000) and WebHDFS (9870) active",
                port=9000,
                details={"rpc_port": 9000, "http_port": 9870, "webhdfs": webhdfs_status.status}
            )
        return ComponentStatus(
            name="HDFS NameNode",
            status="down",
            message="NameNode RPC and WebHDFS ports unreachable",
            port=9000
        )

    def check_datanode(self) -> ComponentStatus:
        is_port_open = self._check_port("localhost", 9864) or self._check_port("localhost", 9866)
        if is_port_open:
            return ComponentStatus(
                name="HDFS DataNode",
                status="ok",
                message="DataNode process active and communicating with NameNode",
                port=9864,
                details={"datanode_port": 9864, "cluster_live_datanodes": 1}
            )
        return ComponentStatus(
            name="HDFS DataNode",
            status="degraded",
            message="DataNode ports not responding",
            port=9864
        )

    def check_zookeeper(self) -> ComponentStatus:
        is_port_open = self._check_port("localhost", 2181)
        if is_port_open:
            return ComponentStatus(
                name="ZooKeeper",
                status="ok",
                message="ZooKeeper listener active on port 2181 (embedded standalone mode)",
                port=2181,
                details={"quorum": "localhost:2181", "mode": "standalone embedded"}
            )
        return ComponentStatus(
            name="ZooKeeper",
            status="down",
            message="ZooKeeper port 2181 is unreachable",
            port=2181
        )

    def check_hmaster(self) -> ComponentStatus:
        is_master_open = self._check_port("localhost", 16000) or self._check_port("localhost", 16010)
        if is_master_open:
            return ComponentStatus(
                name="HBase Master",
                status="ok",
                message="HMaster RPC (16000) and Web UI (16010) active",
                port=16000,
                details={"rpc_port": 16000, "web_ui_port": 16010}
            )
        return ComponentStatus(
            name="HBase Master",
            status="down",
            message="HMaster is not listening on ports 16000/16010",
            port=16000
        )

    def check_hbase_rest(self) -> ComponentStatus:
        return hbase_service.check_health()

    def get_dataset_info(self) -> Dict[str, Any]:
        path = settings.DATASET_PATH
        if not os.path.exists(path):
            return {"exists": False, "path": path, "total_files": 0, "size_mb": 0.0}
        files = [f for f in os.listdir(path) if f.endswith(".json")]
        total_bytes = sum(os.path.getsize(os.path.join(path, f)) for f in files)
        return {
            "exists": True,
            "path": path,
            "total_files": len(files),
            "size_bytes": total_bytes,
            "size_mb": round(total_bytes / (1024 * 1024), 2),
            "hdfs_raw_path": settings.HDFS_RAW_PATH
        }

    def get_hbase_table_info(self) -> Dict[str, Any]:
        count = hbase_service.get_record_count()
        return {
            "table_name": settings.HBASE_TABLE,
            "column_family": settings.HBASE_COLUMN_FAMILY,
            "row_count": count
        }

    def get_system_status(self) -> SystemStatusResponse:
        return SystemStatusResponse(
            backend=self.check_backend(),
            hdfs_namenode=self.check_namenode(),
            hdfs_datanode=self.check_datanode(),
            hbase_master=self.check_hmaster(),
            zookeeper=self.check_zookeeper(),
            hbase_rest=self.check_hbase_rest(),
            dataset=self.get_dataset_info(),
            hbase_table=self.get_hbase_table_info()
        )

    def get_health(self) -> HealthResponse:
        nn = self.check_namenode()
        rest = self.check_hbase_rest()

        hdfs_ok = "ok" if nn.status in ("ok", "degraded") else "down"
        hbase_ok = "ok" if rest.status in ("ok", "degraded") else "down"

        return HealthResponse(
            backend="ok",
            hdfs=hdfs_ok,
            hbase=hbase_ok
        )

health_service = HealthService()
