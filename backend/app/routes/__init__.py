"""API routes package."""
from .health import router as health_router
from .system import router as system_router
from .patients import router as patients_router
from .hdfs import router as hdfs_router
from .ingestion import router as ingestion_router

__all__ = ["health_router", "system_router", "patients_router", "hdfs_router", "ingestion_router"]
