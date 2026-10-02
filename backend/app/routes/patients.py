from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from app.models.patient import PaginatedPatientsResponse, PatientDetail
from app.services.hbase_service import hbase_service

router = APIRouter(prefix="/api/patients", tags=["Patients"])

@router.get("", response_model=PaginatedPatientsResponse)
def get_patients(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search term by ID, name, hospital, or city")
):
    """Returns a paginated list of patient records from HBase."""
    return hbase_service.list_patients(page=page, page_size=page_size, search=search)

@router.get("/{patient_id}", response_model=PatientDetail)
def get_patient_detail(patient_id: str):
    """Returns detailed patient record by UUID from HBase."""
    patient = hbase_service.get_patient(patient_id)
    if not patient:
        raise HTTPException(
            status_code=404,
            detail=f"Patient with ID '{patient_id}' not found in HBase"
        )
    return patient
