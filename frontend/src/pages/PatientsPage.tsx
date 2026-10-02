import React, { useState, useEffect } from 'react';
import { PaginatedPatients, PatientSummary } from '../types';
import { api } from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorBanner } from '../components/ErrorBanner';

interface Props {
  onSelectPatient: (patientId: string) => void;
}

export const PatientsPage: React.FC<Props> = ({ onSelectPatient }) => {
  const [data, setData] = useState<PaginatedPatients | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);
  const [search, setSearch] = useState<string>('');
  const [searchInput, setSearchInput] = useState<string>('');

  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getPatients(page, pageSize, search);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load patients from HBase');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [page, pageSize, search]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  return (
    <div>
      {/* Search and Filter Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        marginBottom: '1.5rem',
        flexWrap: 'wrap'
      }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: 1, maxWidth: '480px' }}>
          <input
            type="text"
            className="search-input"
            placeholder="Search by ID, name, hospital, or city..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">Search</button>
          {search && (
            <button type="button" onClick={handleClearSearch} className="btn btn-secondary">
              Clear
            </button>
          )}
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <span>Per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            style={{
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '0.35rem 0.6rem'
            }}
          >
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span>Total: <strong>{data?.total ?? 0}</strong></span>
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={fetchPatients} />}

      {loading ? (
        <LoadingSpinner message="Scanning HBase patient records..." />
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Patient ID</th>
                <th>Full Name</th>
                <th>Gender / Age</th>
                <th>Location</th>
                <th>Primary Care Facility</th>
                <th>Physician</th>
                <th>Encounters</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data && data.items.length > 0 ? (
                data.items.map((p: PatientSummary) => (
                  <tr
                    key={p.patient_id}
                    onClick={() => onSelectPatient(p.patient_id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <code style={{ color: '#38bdf8', fontSize: '0.8rem' }}>
                        {p.patient_id.substring(0, 8)}...
                      </code>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#f3f4f6' }}>{p.full_name || 'Anonymous'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Born: {p.birth_date}</div>
                    </td>
                    <td>
                      <span style={{ textTransform: 'capitalize' }}>{p.gender}</span>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.marital_status || 'Single'}</div>
                    </td>
                    <td>
                      <div>{p.city}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.state}</div>
                    </td>
                    <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <span title={p.primary_hospital}>{p.primary_hospital || 'N/A'}</span>
                    </td>
                    <td style={{ maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <span title={p.primary_practitioner}>{p.primary_practitioner || 'N/A'}</span>
                    </td>
                    <td>
                      <span style={{
                        backgroundColor: 'rgba(2, 132, 199, 0.15)',
                        color: '#38bdf8',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}>
                        {p.encounters_count} encounters
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectPatient(p.patient_id);
                        }}
                        className="btn btn-secondary"
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                      >
                        View Record →
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    No patient records found matching your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {data && (
            <div className="pagination">
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Showing page <strong>{data.page}</strong> of <strong>{data.total_pages}</strong> ({data.total} records)
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn btn-secondary"
                  disabled={data.page <= 1}
                  onClick={() => setPage(data.page - 1)}
                  style={{ opacity: data.page <= 1 ? 0.5 : 1, cursor: data.page <= 1 ? 'not-allowed' : 'pointer' }}
                >
                  ← Previous
                </button>
                <button
                  className="btn btn-secondary"
                  disabled={data.page >= data.total_pages}
                  onClick={() => setPage(data.page + 1)}
                  style={{ opacity: data.page >= data.total_pages ? 0.5 : 1, cursor: data.page >= data.total_pages ? 'not-allowed' : 'pointer' }}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
