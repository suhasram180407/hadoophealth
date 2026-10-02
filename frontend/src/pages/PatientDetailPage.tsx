import React, { useState, useEffect } from 'react';
import { PatientDetail, HdfsFileContent } from '../types';
import { api } from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorBanner } from '../components/ErrorBanner';
import { JsonViewer } from '../components/JsonViewer';

interface Props {
  patientId: string;
  onBack: () => void;
}

export const PatientDetailPage: React.FC<Props> = ({ patientId, onBack }) => {
  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Raw file preview modal state
  const [rawModalOpen, setRawModalOpen] = useState<boolean>(false);
  const [rawContent, setRawContent] = useState<HdfsFileContent | null>(null);
  const [rawLoading, setRawLoading] = useState<boolean>(false);
  const [rawError, setRawError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.getPatientDetail(patientId);
        setPatient(res);
      } catch (err: any) {
        setError(err.message || `Failed to fetch patient record ${patientId}`);
      } finally {
        setLoading(false);
      }
    };
    fetchPatient();
  }, [patientId]);

  const handleOpenRaw = async () => {
    if (!patient?.raw_file_name) return;
    try {
      setRawModalOpen(true);
      setRawLoading(true);
      setRawError(null);
      const content = await api.getHdfsFileContent(patient.raw_file_name);
      setRawContent(content);
    } catch (err: any) {
      setRawError(err.message || 'Error fetching raw file from HDFS');
    } finally {
      setRawLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message={`Loading record for ${patientId}...`} />;
  if (error) return <ErrorBanner message={error} onRetry={() => window.location.reload()} />;
  if (!patient) return null;

  return (
    <div>
      {/* Top action bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <button onClick={onBack} className="btn btn-secondary">
          ← Back to Patient List
        </button>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          HBase Row Key: <code style={{ color: '#38bdf8' }}>{patient.patient_id}</code>
        </div>
      </div>

      {/* Patient Header Card */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
            Structured Patient Record (HBase)
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#ffffff', marginTop: '0.2rem' }}>
            {patient.full_name || 'Unnamed Record'}
          </h2>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            <span>UUID: <code>{patient.patient_id}</code></span>
            <span>•</span>
            <span>Gender: <strong style={{ textTransform: 'capitalize', color: '#e5e7eb' }}>{patient.gender}</strong></span>
            <span>•</span>
            <span>DOB: <strong style={{ color: '#e5e7eb' }}>{patient.birth_date}</strong></span>
            <span>•</span>
            <span>Status: <strong style={{ color: patient.deceased_date ? '#ef4444' : '#10b981' }}>{patient.deceased_date ? `Deceased (${patient.deceased_date})` : 'Alive'}</strong></span>
          </div>
        </div>

        <button onClick={handleOpenRaw} className="btn btn-primary">
          View Raw HDFS File →
        </button>
      </div>

      {/* Clinical Metrics Cards */}
      <div className="card-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="card">
          <div className="card-title">Total Encounters</div>
          <div className="card-value" style={{ color: '#38bdf8' }}>{patient.encounters_count}</div>
          <div className="card-meta">Clinical visits and consultations</div>
        </div>
        <div className="card">
          <div className="card-title">Conditions</div>
          <div className="card-value" style={{ color: '#f59e0b' }}>{patient.conditions_count}</div>
          <div className="card-meta">Diagnoses and findings</div>
        </div>
        <div className="card">
          <div className="card-title">Medications</div>
          <div className="card-value" style={{ color: '#10b981' }}>{patient.medications_count}</div>
          <div className="card-meta">Prescriptions recorded</div>
        </div>
        <div className="card">
          <div className="card-title">Procedures</div>
          <div className="card-value" style={{ color: '#a855f7' }}>{patient.procedures_count}</div>
          <div className="card-meta">Medical interventions</div>
        </div>
      </div>

      {/* Detailed Info Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '1.5rem'
      }}>
        {/* Demographics & Contact */}
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '1rem', color: '#e5e7eb' }}>
            Demographics & Contact
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Marital Status:</span>
              <span style={{ fontWeight: 500 }}>{patient.marital_status || 'Unknown'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Telephone:</span>
              <span style={{ fontWeight: 500 }}>{patient.phone || 'None recorded'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Street Address:</span>
              <span style={{ fontWeight: 500 }}>{patient.address_line || 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>City / State / Postal:</span>
              <span style={{ fontWeight: 500 }}>{patient.city}, {patient.state} {patient.postal_code}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Country:</span>
              <span style={{ fontWeight: 500 }}>{patient.country || 'US'}</span>
            </div>
          </div>
        </div>

        {/* Primary Care & Data Lineage */}
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '1rem', color: '#e5e7eb' }}>
            Care Team & Data Traceability
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Primary Hospital:</span>
              <span style={{ fontWeight: 600, color: '#38bdf8' }}>{patient.primary_hospital || 'Not Recorded'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Primary Physician:</span>
              <span style={{ fontWeight: 600, color: '#38bdf8' }}>{patient.primary_practitioner || 'Not Recorded'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Immunizations:</span>
              <span style={{ fontWeight: 500 }}>{patient.immunizations_count} administered</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>HDFS Raw File:</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#10b981' }}>
                {patient.raw_file_name}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Ingested At:</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{patient.updated_at}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Raw HDFS File Modal */}
      {rawModalOpen && (
        <div className="modal-overlay" onClick={() => setRawModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#ffffff' }}>
                  Raw HDFS File: {patient.raw_file_name}
                </h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Location: <code>/healthcare/raw/{patient.raw_file_name}</code>
                </div>
              </div>
              <button className="modal-close" onClick={() => setRawModalOpen(false)}>×</button>
            </div>

            <div className="modal-body">
              {rawLoading ? (
                <LoadingSpinner message="Reading bundle from HDFS /healthcare/raw..." />
              ) : rawError ? (
                <ErrorBanner message={rawError} />
              ) : rawContent ? (
                <div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '0.75rem',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)'
                  }}>
                    <span>Bundle Size: <strong>{(rawContent.size_bytes / 1024).toFixed(1)} KB</strong></span>
                    {rawContent.preview_truncated && (
                      <span style={{ color: '#f59e0b' }}>⚠️ Preview Truncated for display</span>
                    )}
                  </div>
                  <JsonViewer data={rawContent.content_json} maxHeight="500px" />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
