from typing import Optional, List
from pydantic import BaseModel, Field

class PatientSummary(BaseModel):
    patient_id: str
    first_name: str = ""
    last_name: str = ""
    full_name: str = ""
    gender: str = ""
    birth_date: str = ""
    marital_status: str = ""
    city: str = ""
    state: str = ""
    primary_hospital: str = ""
    primary_practitioner: str = ""
    encounters_count: int = 0
    conditions_count: int = 0
    raw_file_name: str = ""

class PatientDetail(BaseModel):
    patient_id: str
    first_name: str = ""
    last_name: str = ""
    full_name: str = ""
    gender: str = ""
    birth_date: str = ""
    marital_status: str = ""
    phone: str = ""
    address_line: str = ""
    city: str = ""
    state: str = ""
    postal_code: str = ""
    country: str = ""
    deceased_date: Optional[str] = None
    primary_hospital: str = ""
    primary_practitioner: str = ""
    encounters_count: int = 0
    conditions_count: int = 0
    medications_count: int = 0
    procedures_count: int = 0
    immunizations_count: int = 0
    raw_file_name: str = ""
    updated_at: str = ""

class PaginatedPatientsResponse(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    items: List[PatientSummary]
