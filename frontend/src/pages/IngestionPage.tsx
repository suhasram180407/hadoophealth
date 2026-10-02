import React, { useState, useEffect } from 'react';
import { IngestionStatus } from '../types';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { ErrorBanner } from '../components/ErrorBanner';

export const IngestionPage: React.FC = () => {
  const [status, setStatus] = useState<IngestionStatus | null>(null);
  const [triggering, setTriggering] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [forceReload, setForceReload] = useState<boolean>(true);

  const fetchStatus = async () => {
    try {
      const res = await api.getIngestionStatus();
      setStatus(res);
    } catch (err: any) {
      // non-blocking
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleRun = async (limit?: number) => {
    try {
      setTriggering(true);
      setError(null);
      const res = await api.triggerIngestion(forceReload, limit);
      setStatus(res);
    } catch (err: any) {
      setError(err.message || 'Failed to trigger ingestion job');
    } finally {
      setTriggering(false);
    }
  };

  const isRunning = status?.status === 'running';
  const progressPercent = status?.total_files && status.total_files > 0
    ? Math.min(100, Math.round((status.processed_files / status.total_files) * 100))
    : 0;

  return (
    <div>
      {error && <ErrorBanner message={error} />}

      {/* Controller Card */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '1.75rem',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>
              Data Ingestion Controller
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Extracts patient demographics, clinical encounters, and care facility references from HDFS raw FHIR bundles into HBase.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <input
                type="checkbox"
                checked={forceReload}
                onChange={(e) => setForceReload(e.target.checked)}
                disabled={isRunning}
              />
              Idempotent Upsert (Overwrite existing row keys)
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleRun()}
            disabled={isRunning || triggering}
            className="btn btn-primary"
            style={{
              padding: '0.75rem 1.5rem',
              opacity: isRunning || triggering ? 0.6 : 1,
              cursor: isRunning || triggering ? 'not-allowed' : 'pointer'
            }}
          >
            {isRunning ? '⏳ Ingestion Running...' : '▶ Run Full Ingestion (109 Patients)'}
          </button>

          <button
            onClick={() => handleRun(5)}
            disabled={isRunning || triggering}
            className="btn btn-secondary"
            style={{
              padding: '0.75rem 1.25rem',
              opacity: isRunning || triggering ? 0.6 : 1,
              cursor: isRunning || triggering ? 'not-allowed' : 'pointer'
            }}
          >
            ⚡ Smoke Test Ingestion (First 5 records)
          </button>
        </div>

        {/* Progress Bar */}
        {status && (
          <div style={{ marginTop: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>
                Progress: <strong>{status.processed_files} / {status.total_files}</strong> files ({progressPercent}%)
              </span>
              <StatusBadge status={status.status} label={status.status.toUpperCase()} />
            </div>

            <div style={{
              width: '100%',
              height: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '9999px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${progressPercent}%`,
                height: '100%',
                backgroundColor: status.status === 'failed' ? '#ef4444' : '#0284c7',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        )}
      </div>

      {/* Run Summary Metric Cards */}
      <div className="card-grid" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <div className="card-title">Successfully Inserted</div>
          <div className="card-value" style={{ color: '#10b981' }}>{status?.inserted_records ?? 0}</div>
          <div className="card-meta">Structured records committed to HBase</div>
        </div>
        <div className="card">
          <div className="card-title">Failed / Discarded</div>
          <div className="card-value" style={{ color: (status?.failed_records ?? 0) > 0 ? '#ef4444' : '#9ca3af' }}>
            {status?.failed_records ?? 0}
          </div>
          <div className="card-meta">Validation failures or corrupt files</div>
        </div>
        <div className="card">
          <div className="card-title">Execution Duration</div>
          <div className="card-value" style={{ color: '#38bdf8' }}>{status?.duration_seconds ?? 0}s</div>
          <div className="card-meta">Total pipeline processing time</div>
        </div>
      </div>

      {/* Errors banner if any */}
      {status?.errors && status.errors.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ color: '#ef4444', marginBottom: '0.5rem', fontSize: '1rem', fontWeight: 600 }}>
            Ingestion Pipeline Errors ({status.errors.length})
          </h4>
          <div style={{
            backgroundColor: 'var(--danger-bg)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '1rem',
            maxHeight: '160px',
            overflowY: 'auto',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem',
            color: '#f87171'
          }}>
            {status.errors.map((err, i) => (
              <div key={i}>• {err}</div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Ingested Records Audit Table */}
      <div>
        <h4 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '1rem', color: '#e5e7eb' }}>
          Recent Record Audit Trail
        </h4>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Patient ID</th>
                <th>Source File</th>
                <th>Status</th>
                <th>Validation Detail</th>
              </tr>
            </thead>
            <tbody>
              {status?.recent_records && status.recent_records.length > 0 ? (
                status.recent_records.map((r, i) => (
                  <tr key={i}>
                    <td>
                      <code style={{ color: '#38bdf8' }}>{r.patient_id}</code>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                      {r.filename}
                    </td>
                    <td>
                      <span className={`badge ${r.status === 'inserted' ? 'badge-success' : 'badge-danger'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {r.message || 'Validated'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    No audit records available. Click "Run Full Ingestion" above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
