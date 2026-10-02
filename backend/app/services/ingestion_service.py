import os
import json
import time
import datetime
from typing import Dict, Any, List, Optional
import threading

from app.config import settings
from app.services.hbase_service import hbase_service
from app.models.ingestion import IngestionStatusResponse, IngestionRecordResult

class IngestionService:
    def __init__(self):
        self._lock = threading.Lock()
        self.status = IngestionStatusResponse(status="idle")
        self.is_running = False

    def get_status(self) -> IngestionStatusResponse:
        with self._lock:
            return self.status.model_copy()

    def run_ingestion(self, force_reload: bool = False, limit: Optional[int] = None) -> IngestionStatusResponse:
        with self._lock:
            if self.is_running:
                return self.status.model_copy()
            self.is_running = True
            start_ts = datetime.datetime.now(datetime.timezone.utc).isoformat()
            self.status = IngestionStatusResponse(
                status="running",
                start_time=start_ts,
                total_files=0,
                processed_files=0,
                inserted_records=0,
                updated_records=0,
                failed_records=0,
                errors=[],
                recent_records=[]
            )

        # Run worker thread
        thread = threading.Thread(
            target=self._ingestion_worker,
            args=(force_reload, limit),
            daemon=True
        )
        thread.start()

        with self._lock:
            return self.status.model_copy()

    def _ingestion_worker(self, force_reload: bool, limit: Optional[int]):
        start_time_perf = time.perf_counter()
        dataset_dir = settings.DATASET_PATH
        hbase_service.ensure_table_exists()

        try:
            if not os.path.exists(dataset_dir):
                raise FileNotFoundError(f"Dataset path {dataset_dir} does not exist")

            all_files = sorted(os.listdir(dataset_dir))
            # Filter patient JSON files (exclude standalone hospital/practitioner lookups)
            patient_files = [
                f for f in all_files
                if f.endswith('.json') and not f.startswith(('hospitalInformation', 'practitionerInformation'))
            ]

            if limit and limit > 0:
                patient_files = patient_files[:limit]

            with self._lock:
                self.status.total_files = len(patient_files)

            batch_size = 20
            batch_buffer: List[Dict[str, Any]] = []
            records_results: List[IngestionRecordResult] = []

            for idx, fn in enumerate(patient_files):
                filepath = os.path.join(dataset_dir, fn)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        bundle = json.load(f)

                    parsed_patient = self._parse_fhir_bundle(bundle, fn)
                    if parsed_patient:
                        batch_buffer.append(parsed_patient)
                        records_results.append(
                            IngestionRecordResult(
                                patient_id=parsed_patient["patient_id"],
                                filename=fn,
                                status="inserted",
                                message="Successfully parsed FHIR bundle"
                            )
                        )
                    else:
                        with self._lock:
                            self.status.failed_records += 1
                            self.status.errors.append(f"No Patient resource found in {fn}")
                        records_results.append(
                            IngestionRecordResult(
                                patient_id="unknown",
                                filename=fn,
                                status="error",
                                message="Missing Patient resource"
                            )
                        )

                except Exception as e:
                    with self._lock:
                        self.status.failed_records += 1
                        self.status.errors.append(f"Error parsing {fn}: {str(e)}")
                    records_results.append(
                        IngestionRecordResult(
                            patient_id="unknown",
                            filename=fn,
                            status="error",
                            message=str(e)
                        )
                    )

                # Flush batch to HBase
                if len(batch_buffer) >= batch_size or idx == len(patient_files) - 1:
                    if batch_buffer:
                        inserted = hbase_service.put_batch(batch_buffer)
                        with self._lock:
                            self.status.inserted_records += inserted
                        batch_buffer = []

                with self._lock:
                    self.status.processed_files = idx + 1
                    self.status.recent_records = records_results[-15:]

            end_ts = datetime.datetime.now(datetime.timezone.utc).isoformat()
            duration = round(time.perf_counter() - start_time_perf, 2)
            with self._lock:
                self.status.status = "completed"
                self.status.end_time = end_ts
                self.status.duration_seconds = duration
                self.is_running = False

        except Exception as e:
            end_ts = datetime.datetime.now(datetime.timezone.utc).isoformat()
            duration = round(time.perf_counter() - start_time_perf, 2)
            with self._lock:
                self.status.status = "failed"
                self.status.end_time = end_ts
                self.status.duration_seconds = duration
                self.status.errors.append(f"Ingestion job failed: {str(e)}")
                self.is_running = False

    def _parse_fhir_bundle(self, bundle: Dict[str, Any], filename: str) -> Optional[Dict[str, Any]]:
        entries = bundle.get("entry", [])
        patient_res = None
        encounters_count = 0
        conditions_count = 0
        medications_count = 0
        procedures_count = 0
        immunizations_count = 0

        primary_hospital = ""
        primary_practitioner = ""

        for entry in entries:
            res = entry.get("resource", {})
            rt = res.get("resourceType")
            if rt == "Patient":
                patient_res = res
            elif rt == "Encounter":
                encounters_count += 1
                if not primary_hospital and res.get("serviceProvider", {}).get("display"):
                    primary_hospital = res["serviceProvider"]["display"]
                if not primary_practitioner and res.get("participant"):
                    for p in res["participant"]:
                        disp = p.get("individual", {}).get("display")
                        if disp:
                            primary_practitioner = disp
                            break
            elif rt == "Condition":
                conditions_count += 1
            elif rt == "MedicationRequest":
                medications_count += 1
            elif rt == "Procedure":
                procedures_count += 1
            elif rt == "Immunization":
                immunizations_count += 1

        if not patient_res:
            return None

        pid = patient_res.get("id", "")
        names = patient_res.get("name", [])
        first_name = ""
        last_name = ""
        full_name = ""
        if names:
            n0 = names[0]
            last_name = n0.get("family", "")
            givens = n0.get("given", [])
            first_name = givens[0] if givens else ""
            prefix = n0.get("prefix", [""])[0] if n0.get("prefix") else ""
            name_parts = [p for p in [prefix, first_name, last_name] if p]
            full_name = " ".join(name_parts)

        gender = patient_res.get("gender", "")
        birth_date = patient_res.get("birthDate", "")
        ms_obj = patient_res.get("maritalStatus", {})
        marital_status = ms_obj.get("text") or (ms_obj.get("coding", [{}])[0].get("display", ""))

        telecom = patient_res.get("telecom", [])
        phone = telecom[0].get("value", "") if telecom else ""

        addresses = patient_res.get("address", [])
        address_line = ""
        city = ""
        state = ""
        postal_code = ""
        country = ""
        if addresses:
            a0 = addresses[0]
            lines = a0.get("line", [])
            address_line = lines[0] if lines else ""
            city = a0.get("city", "")
            state = a0.get("state", "")
            postal_code = a0.get("postalCode", "")
            country = a0.get("country", "")

        deceased_date = patient_res.get("deceasedDateTime", "Alive")
        now_str = datetime.datetime.now(datetime.timezone.utc).isoformat()

        return {
            "patient_id": pid,
            "first_name": first_name,
            "last_name": last_name,
            "full_name": full_name,
            "gender": gender,
            "birth_date": birth_date,
            "marital_status": marital_status,
            "phone": phone,
            "address_line": address_line,
            "city": city,
            "state": state,
            "postal_code": postal_code,
            "country": country,
            "deceased_date": deceased_date,
            "primary_hospital": primary_hospital or "Not Recorded",
            "primary_practitioner": primary_practitioner or "Not Recorded",
            "encounters_count": encounters_count,
            "conditions_count": conditions_count,
            "medications_count": medications_count,
            "procedures_count": procedures_count,
            "immunizations_count": immunizations_count,
            "raw_file_name": filename,
            "updated_at": now_str
        }

ingestion_service = IngestionService()
