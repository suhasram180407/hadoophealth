from fastapi import APIRouter
from app.models.system import HealthResponse
from app.services.health_service import health_service

router = APIRouter(prefix="/api", tags=["Health"])

@router.get("/health", response_model=HealthResponse)
def get_health():
    """Returns application and dependency health status."""
    return health_service.get_health()
