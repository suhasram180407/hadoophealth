import base64
import json
import httpx
from typing import List, Dict, Any, Optional

from app.config import settings
from app.models.patient import PatientSummary, PatientDetail, PaginatedPatientsResponse
from app.models.system import ComponentStatus

class HBaseService:
    def __init__(self):
        self.base_url = settings.HBASE_REST_URL.rstrip('/')
        self.table = settings.HBASE_TABLE
        self.column_family = settings.HBASE_COLUMN_FAMILY
        self.client = httpx.Client(base_url=self.base_url, timeout=15.0)

    @staticmethod
    def _b64e(val: str) -> str:
        if val is None:
            val = ""
        return base64.b64encode(str(val).encode('utf-8')).decode('ascii')

    @staticmethod
    def _b64d(val: str) -> str:
        if not val:
            return ""
        try:
            return base64.b64decode(val.encode('ascii')).decode('utf-8', errors='ignore')
        except Exception:
            return str(val)

    def ensure_table_exists(self) -> bool:
        url = f"/{self.table}/schema"
        try:
            resp = self.client.get(url, headers={"Accept": "application/json"})
            if resp.status_code == 200:
                return True
        except Exception:
            pass

        # Create table via XML schema
        xml_schema = f'<?xml version="1.0" encoding="UTF-8"?><TableSchema name="{self.table}"><ColumnSchema name="{self.column_family}" /></TableSchema>'
        try:
            resp = self.client.post(
                url,
                content=xml_schema.encode('utf-8'),
                headers={"Content-Type": "text/xml", "Accept": "application/json"}
            )
            return resp.status_code in (200, 201)
        except Exception:
            return False

    def put_patient(self, patient_id: str, data: Dict[str, Any]) -> bool:
        cells = []
        for key, val in data.items():
            if val is not None:
                col_name = f"{self.column_family}:{key}"
                cells.append({
                    "column": self._b64e(col_name),
                    "$": self._b64e(str(val))
                })

        payload = {
            "Row": [{
                "key": self._b64e(patient_id),
                "Cell": cells
            }]
        }

        try:
            resp = self.client.put(
                f"/{self.table}/{patient_id}",
                json=payload,
                headers={"Content-Type": "application/json", "Accept": "application/json"}
            )
            return resp.status_code == 200
        except Exception:
            return False

    def put_batch(self, patient_records: List[Dict[str, Any]]) -> int:
        """Batch PUT multiple patient records."""
        if not patient_records:
            return 0

        rows = []
        for rec in patient_records:
            pid = rec.get("patient_id")
            if not pid:
                continue
            cells = []
            for k, v in rec.items():
                if v is not None:
                    col_name = f"{self.column_family}:{k}"
                    cells.append({
                        "column": self._b64e(col_name),
                        "$": self._b64e(str(v))
                    })
            rows.append({
                "key": self._b64e(pid),
                "Cell": cells
            })

        payload = {"Row": rows}
        try:
            # Batch PUT to /{table}/false-row-key
            resp = self.client.put(
                f"/{self.table}/false-row-key",
                json=payload,
                headers={"Content-Type": "application/json", "Accept": "application/json"}
            )
            if resp.status_code == 200:
                return len(rows)
        except Exception:
            pass

        # Fallback to individual puts if batch payload has issues
        success_count = 0
        for rec in patient_records:
            pid = rec.get("patient_id")
            if pid and self.put_patient(pid, rec):
                success_count += 1
        return success_count

    def get_patient(self, patient_id: str) -> Optional[PatientDetail]:
        try:
            resp = self.client.get(f"/{self.table}/{patient_id}", headers={"Accept": "application/json"})
            if resp.status_code != 200:
                return None
            data = resp.json()
            rows = data.get("Row", [])
            if not rows:
                return None

            cells = rows[0].get("Cell", [])
            decoded = {}
            prefix = f"{self.column_family}:"
            for c in cells:
                col = self._b64d(c.get("column", ""))
                val = self._b64d(c.get("$", ""))
                if col.startswith(prefix):
                    decoded[col[len(prefix):]] = val
                else:
                    decoded[col] = val

            return PatientDetail(
                patient_id=decoded.get("patient_id", patient_id),
                first_name=decoded.get("first_name", ""),
                last_name=decoded.get("last_name", ""),
                full_name=decoded.get("full_name", ""),
                gender=decoded.get("gender", ""),
                birth_date=decoded.get("birth_date", ""),
                marital_status=decoded.get("marital_status", ""),
                phone=decoded.get("phone", ""),
                address_line=decoded.get("address_line", ""),
                city=decoded.get("city", ""),
                state=decoded.get("state", ""),
                postal_code=decoded.get("postal_code", ""),
                country=decoded.get("country", ""),
                deceased_date=decoded.get("deceased_date") if decoded.get("deceased_date") != "Alive" else None,
                primary_hospital=decoded.get("primary_hospital", ""),
                primary_practitioner=decoded.get("primary_practitioner", ""),
                encounters_count=int(decoded.get("encounters_count", 0)),
                conditions_count=int(decoded.get("conditions_count", 0)),
                medications_count=int(decoded.get("medications_count", 0)),
                procedures_count=int(decoded.get("procedures_count", 0)),
                immunizations_count=int(decoded.get("immunizations_count", 0)),
                raw_file_name=decoded.get("raw_file_name", ""),
                updated_at=decoded.get("updated_at", "")
            )
        except Exception:
            return None

    def scan_all_summaries(self) -> List[PatientSummary]:
        summaries: List[PatientSummary] = []
        scanner_url = None
        try:
            # Create scanner for batch 200
            scan_spec = {
                "batch": 200,
                "column": [
                    self._b64e(f"{self.column_family}:{col}")
                    for col in [
                        "patient_id", "first_name", "last_name", "full_name",
                        "gender", "birth_date", "marital_status", "city", "state",
                        "primary_hospital", "primary_practitioner",
                        "encounters_count", "conditions_count", "raw_file_name"
                    ]
                ]
            }
            resp = self.client.put(
                f"/{self.table}/scanner",
                json=scan_spec,
                headers={"Content-Type": "application/json", "Accept": "application/json"}
            )
            if resp.status_code == 201:
                scanner_url = resp.headers.get("Location")

            if scanner_url:
                while True:
                    batch_resp = self.client.get(scanner_url, headers={"Accept": "application/json"})
                    if batch_resp.status_code != 200:
                        break
                    data = batch_resp.json()
                    rows = data.get("Row", [])
                    if not rows:
                        break

                    prefix = f"{self.column_family}:"
                    for r in rows:
                        cells = r.get("Cell", [])
                        dec = {}
                        for c in cells:
                            col = self._b64d(c.get("column", ""))
                            val = self._b64d(c.get("$", ""))
                            if col.startswith(prefix):
                                dec[col[len(prefix):]] = val
                            else:
                                dec[col] = val

                        pid = dec.get("patient_id") or self._b64d(r.get("key", ""))
                        summaries.append(
                            PatientSummary(
                                patient_id=pid,
                                first_name=dec.get("first_name", ""),
                                last_name=dec.get("last_name", ""),
                                full_name=dec.get("full_name", f"{dec.get('first_name','')} {dec.get('last_name','')}").strip(),
                                gender=dec.get("gender", ""),
                                birth_date=dec.get("birth_date", ""),
                                marital_status=dec.get("marital_status", ""),
                                city=dec.get("city", ""),
                                state=dec.get("state", ""),
                                primary_hospital=dec.get("primary_hospital", ""),
                                primary_practitioner=dec.get("primary_practitioner", ""),
                                encounters_count=int(dec.get("encounters_count", 0)),
                                conditions_count=int(dec.get("conditions_count", 0)),
                                raw_file_name=dec.get("raw_file_name", "")
                            )
                        )
        except Exception:
            pass
        finally:
            if scanner_url:
                try:
                    self.client.delete(scanner_url)
                except Exception:
                    pass

        return summaries

    def list_patients(self, page: int = 1, page_size: int = 20, search: Optional[str] = None) -> PaginatedPatientsResponse:
        all_patients = self.scan_all_summaries()

        if search:
            q = search.lower().strip()
            all_patients = [
                p for p in all_patients
                if q in p.patient_id.lower() or
                   q in p.full_name.lower() or
                   q in p.city.lower() or
                   q in p.primary_hospital.lower() or
                   q in p.primary_practitioner.lower()
            ]

        total = len(all_patients)
        total_pages = max(1, (total + page_size - 1) // page_size) if page_size > 0 else 1
        page = max(1, min(page, total_pages)) if total > 0 else 1

        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        items = all_patients[start_idx:end_idx]

        return PaginatedPatientsResponse(
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            items=items
        )

    def get_record_count(self) -> int:
        return len(self.scan_all_summaries())

    def check_health(self) -> ComponentStatus:
        try:
            resp = self.client.get("/version", headers={"Accept": "application/json"})
            if resp.status_code == 200:
                cluster_resp = self.client.get("/status/cluster", headers={"Accept": "application/json"})
                cluster_info = {}
                if cluster_resp.status_code == 200:
                    try:
                        cluster_info = cluster_resp.json()
                    except Exception:
                        cluster_info = {"status": cluster_resp.text[:100]}
                return ComponentStatus(
                    name="HBase REST (Stargate)",
                    status="ok",
                    message="HBase REST responding and connected to HBase cluster",
                    port=8080,
                    details=cluster_info
                )
            else:
                return ComponentStatus(
                    name="HBase REST",
                    status="degraded",
                    message=f"HBase REST returned HTTP {resp.status_code}",
                    port=8080
                )
        except Exception as e:
            return ComponentStatus(
                name="HBase REST",
                status="down",
                message=f"HBase REST connection error: {str(e)}",
                port=8080
            )

hbase_service = HBaseService()
