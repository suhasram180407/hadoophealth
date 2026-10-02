from fastapi import APIRouter
from app.models.ingestion import IngestionRunRequest, IngestionStatusResponse
from app.services.ingestion_service import ingestion_service

router = APIRouter(prefix="/api/ingestion", tags=["Ingestion"])

@router.post("/run", response_model=IngestionStatusResponse)
def trigger_ingestion(request: IngestionRunRequest = IngestionRunRequest()):
    """Triggers controlled, idempotent ingestion from dataset/HDFS into HBase."""
    return ingestion_service.run_ingestion(force_reload=request.force_reload, limit=request.limit)

@router.get("/status", response_model=IngestionStatusResponse)
def get_ingestion_status():
    """Returns the most recent ingestion status and progress."""
    return ingestion_service.get_status()
