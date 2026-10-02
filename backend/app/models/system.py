from typing import Dict, Any, Optional
from pydantic import BaseModel

class HealthResponse(BaseModel):
    backend: str
    hdfs: str
    hbase: str

class ComponentStatus(BaseModel):
    name: str
    status: str  # "ok", "degraded", "down"
    message: str
    port: Optional[int] = None
    pid: Optional[int] = None
    details: Optional[Dict[str, Any]] = None

class SystemStatusResponse(BaseModel):
    backend: ComponentStatus
    hdfs_namenode: ComponentStatus
    hdfs_datanode: ComponentStatus
    hbase_master: ComponentStatus
    zookeeper: ComponentStatus
    hbase_rest: ComponentStatus
    dataset: Dict[str, Any]
    hbase_table: Dict[str, Any]
