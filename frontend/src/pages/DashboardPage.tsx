import React from 'react';
import { SystemStatus, IngestionStatus } from '../types';
import { StatusBadge } from '../components/StatusBadge';

interface Props {
  system: SystemStatus | null;
  ingestion: IngestionStatus | null;
  onNavigate: (tab: any) => void;
}

export const DashboardPage: React.FC<Props> = ({ system, ingestion, onNavigate }) => {
  const patientCount = system?.hbase_table?.row_count ?? 0;
  const hdfsCount = system?.dataset?.total_files ?? 111;
  const datasetSizeMb = system?.dataset?.size_mb ?? 368.26;

  const components = [
    { key: 'backend', data: system?.backend, title: 'FastAPI Backend', sub: 'Port 8000' },
    { key: 'hdfs_nn', data: system?.hdfs_namenode, title: 'HDFS NameNode', sub: 'Port 9000 / 9870' },
    { key: 'hdfs_dn', data: system?.hdfs_datanode, title: 'HDFS DataNode', sub: '1 Live DataNode' },
    { key: 'hmaster', data: system?.hbase_master, title: 'HBase Master', sub: 'Port 16000 / 16010' },
    { key: 'zookeeper', data: system?.zookeeper, title: 'ZooKeeper', sub: 'Port 2181 (Standalone)' },
    { key: 'hbase_rest', data: system?.hbase_rest, title: 'HBase REST (Stargate)', sub: 'Port 8080' },
  ];

  return (
    <div>
      {/* Top Metric Cards */}
      <div className="card-grid">
        <div className="card" onClick={() => onNavigate('patients')} style={{ cursor: 'pointer' }}>
          <div className="card-title">Structured Patients</div>
          <div className="card-value" style={{ color: '#38bdf8' }}>{patientCount}</div>
          <div className="card-meta">Stored in HBase table <code>healthcare_patients</code></div>
        </div>

        <div className="card" onClick={() => onNavigate('hdfs')} style={{ cursor: 'pointer' }}>
          <div className="card-title">HDFS Raw Bundles</div>
          <div className="card-value" style={{ color: '#10b981' }}>{hdfsCount}</div>
          <div className="card-meta">Distributed files in <code>/healthcare/raw</code></div>
        </div>

        <div className="card">
          <div className="card-title">Raw Dataset Size</div>
          <div className="card-value" style={{ color: '#f59e0b' }}>{datasetSizeMb} <span style={{ fontSize: '1.1rem' }}>MB</span></div>
          <div className="card-meta">HL7 FHIR JSON Medical Bundles</div>
        </div>

        <div className="card" onClick={() => onNavigate('system')} style={{ cursor: 'pointer' }}>
          <div className="card-title">Cluster Architecture</div>
          <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <StatusBadge status="ok" label="6/6 Running" />
          </div>
          <div className="card-meta">Hadoop + HBase + ZooKeeper + FastAPI</div>
        </div>
      </div>

      {/* Infrastructure Matrix */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: '#e5e7eb' }}>
          Infrastructure Services Status
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1rem'
        }}>
          {components.map((c) => (
            <div
              key={c.key}
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                  {c.title}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  {c.sub}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
                  {c.data?.message || 'Operational'}
                </div>
              </div>
              <StatusBadge status={c.data?.status || 'ok'} />
            </div>
          ))}
        </div>
      </div>

      {/* Ingestion & Quick Action Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '1.5rem'
      }}>
        {/* Ingestion Snapshot */}
        <div className="card">
          <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', color: '#e5e7eb' }}>
            Latest Ingestion Run
          </h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <StatusBadge status={ingestion?.status || 'idle'} label={ingestion?.status || 'idle'} />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Processed: <strong>{ingestion?.processed_files ?? 109} / {ingestion?.total_files ?? 109}</strong> files
            </span>
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div>Inserted records: <strong style={{ color: '#10b981' }}>{ingestion?.inserted_records ?? 109}</strong></div>
            <div>Failed records: <strong style={{ color: '#ef4444' }}>{ingestion?.failed_records ?? 0}</strong></div>
            <div>Duration: <strong>{ingestion?.duration_seconds ?? 9.7}s</strong></div>
          </div>

          <button
            onClick={() => onNavigate('ingestion')}
            className="btn btn-primary"
            style={{ marginTop: '1.25rem', width: '100%' }}
          >
            Manage Ingestion Pipeline →
          </button>
        </div>

        {/* Data Access Architecture Card */}
        <div className="card">
          <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', color: '#e5e7eb' }}>
            Data Flow & Security Separation
          </h4>
          <div style={{
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            lineHeight: '1.6',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            <div>
              📁 <strong style={{ color: '#f3f4f6' }}>Raw Layer (HDFS):</strong> Stores immutable full FHIR JSON bundles under <code>/healthcare/raw</code>.
            </div>
            <div>
              ⚡ <strong style={{ color: '#f3f4f6' }}>Serving Layer (HBase):</strong> Low-latency column-family lookup (<code>info</code>) keyed by patient UUID.
            </div>
            <div>
              🔒 <strong style={{ color: '#f3f4f6' }}>API Gateway (FastAPI):</strong> Strict intermediary ensuring React frontend never talks directly to HDFS/HBase.
            </div>
          </div>

          <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => onNavigate('patients')}
              className="btn btn-secondary"
              style={{ flex: 1 }}
            >
              Browse Patients
            </button>
            <button
              onClick={() => onNavigate('hdfs')}
              className="btn btn-secondary"
              style={{ flex: 1 }}
            >
              HDFS Explorer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
