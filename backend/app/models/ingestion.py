from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class IngestionRunRequest(BaseModel):
    force_reload: bool = False
    limit: Optional[int] = None

class IngestionRecordResult(BaseModel):
    patient_id: str
    filename: str
    status: str  # "inserted", "updated", "skipped", "error"
    message: Optional[str] = None

class IngestionStatusResponse(BaseModel):
    status: str  # "idle", "running", "completed", "failed"
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    duration_seconds: Optional[float] = None
    total_files: int = 0
    processed_files: int = 0
    inserted_records: int = 0
    updated_records: int = 0
    failed_records: int = 0
    errors: List[str] = []
    recent_records: List[IngestionRecordResult] = []
