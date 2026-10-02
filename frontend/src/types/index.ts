export interface PatientSummary {
  patient_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  gender: string;
  birth_date: string;
  marital_status: string;
  city: string;
  state: string;
  primary_hospital: string;
  primary_practitioner: string;
  encounters_count: number;
  conditions_count: number;
  raw_file_name: string;
}

export interface PatientDetail {
  patient_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  gender: string;
  birth_date: string;
  marital_status: string;
  phone: string;
  address_line: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  deceased_date?: string | null;
  primary_hospital: string;
  primary_practitioner: string;
  encounters_count: number;
  conditions_count: number;
  medications_count: number;
  procedures_count: number;
  immunizations_count: number;
  raw_file_name: string;
  updated_at: string;
}

export interface PaginatedPatients {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  items: PatientSummary[];
}

export interface HdfsFileInfo {
  filename: string;
  path: string;
  size_bytes: number;
  size_formatted: string;
  modification_time: string;
  is_directory: boolean;
}

export interface HdfsFileList {
  path: string;
  total_files: number;
  total_size_bytes: number;
  files: HdfsFileInfo[];
}

export interface HdfsFileContent {
  filename: string;
  path: string;
  size_bytes: number;
  content_json: any;
  preview_truncated: boolean;
}

export interface ComponentStatus {
  name: string;
  status: 'ok' | 'degraded' | 'down';
  message: string;
  port?: number | null;
  pid?: number | null;
  details?: Record<string, any>;
}

export interface SystemStatus {
  backend: ComponentStatus;
  hdfs_namenode: ComponentStatus;
  hdfs_datanode: ComponentStatus;
  hbase_master: ComponentStatus;
  zookeeper: ComponentStatus;
  hbase_rest: ComponentStatus;
  dataset: {
    exists: boolean;
    path: string;
    total_files: number;
    size_bytes: number;
    size_mb: number;
    hdfs_raw_path: string;
  };
  hbase_table: {
    table_name: string;
    column_family: string;
    row_count: number;
  };
}

export interface HealthStatus {
  backend: string;
  hdfs: string;
  hbase: string;
}

export interface IngestionRecordResult {
  patient_id: string;
  filename: string;
  status: string;
  message?: string | null;
}

export interface IngestionStatus {
  status: 'idle' | 'running' | 'completed' | 'failed';
  start_time?: string | null;
  end_time?: string | null;
  duration_seconds?: number | null;
  total_files: number;
  processed_files: number;
  inserted_records: number;
  updated_records: number;
  failed_records: number;
  errors: string[];
  recent_records: IngestionRecordResult[];
}
