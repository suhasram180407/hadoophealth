import {
  HealthStatus,
  SystemStatus,
  PaginatedPatients,
  PatientDetail,
  HdfsFileList,
  HdfsFileContent,
  IngestionStatus,
} from '../types';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    let errMsg = `Request failed with status ${res.status}`;
    try {
      const errData = await res.json();
      if (errData.detail) errMsg = errData.detail;
    } catch {
      // ignore
    }
    throw new Error(errMsg);
  }
  return res.json() as Promise<T>;
}

export const api = {
  getHealth: (): Promise<HealthStatus> => {
    return fetchJson<HealthStatus>(`${API_BASE_URL}/health`);
  },

  getSystemStatus: (): Promise<SystemStatus> => {
    return fetchJson<SystemStatus>(`${API_BASE_URL}/system/status`);
  },

  getPatients: (
    page: number = 1,
    pageSize: number = 20,
    search?: string
  ): Promise<PaginatedPatients> => {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });
    if (search && search.trim()) {
      params.append('search', search.trim());
    }
    return fetchJson<PaginatedPatients>(`${API_BASE_URL}/patients?${params.toString()}`);
  },

  getPatientDetail: (patientId: string): Promise<PatientDetail> => {
    return fetchJson<PatientDetail>(`${API_BASE_URL}/patients/${encodeURIComponent(patientId)}`);
  },

  getHdfsFiles: (): Promise<HdfsFileList> => {
    return fetchJson<HdfsFileList>(`${API_BASE_URL}/hdfs/files`);
  },

  getHdfsFileContent: (filename: string): Promise<HdfsFileContent> => {
    return fetchJson<HdfsFileContent>(`${API_BASE_URL}/hdfs/files/${encodeURIComponent(filename)}`);
  },

  triggerIngestion: (forceReload: boolean = false, limit?: number): Promise<IngestionStatus> => {
    return fetchJson<IngestionStatus>(`${API_BASE_URL}/ingestion/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ force_reload: forceReload, limit }),
    });
  },

  getIngestionStatus: (): Promise<IngestionStatus> => {
    return fetchJson<IngestionStatus>(`${API_BASE_URL}/ingestion/status`);
  },
};
