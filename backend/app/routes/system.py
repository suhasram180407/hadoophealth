from fastapi import APIRouter
from app.models.system import SystemStatusResponse
from app.services.health_service import health_service

router = APIRouter(prefix="/api/system", tags=["System"])

@router.get("/status", response_model=SystemStatusResponse)
def get_system_status():
    """Returns detailed status of all components (Backend, HDFS, HBase, ZooKeeper, Dataset)."""
    return health_service.get_system_status()
