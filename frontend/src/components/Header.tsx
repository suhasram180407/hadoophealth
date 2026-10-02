import React from 'react';
import { HealthStatus } from '../types';

interface Props {
  title: string;
  health: HealthStatus | null;
  onRefresh?: () => void;
}

export const Header: React.FC<Props> = ({ title, health, onRefresh }) => {
  const isHealthy = health?.backend === 'ok' && health?.hdfs === 'ok' && health?.hbase === 'ok';

  return (
    <header className="header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <h2 className="header-title">{title}</h2>
      </div>

      <div className="header-status">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          padding: '0.35rem 0.8rem',
          borderRadius: '9999px',
          border: '1px solid var(--border-color)',
          fontSize: '0.8rem'
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: isHealthy ? '#10b981' : '#f59e0b',
            boxShadow: isHealthy ? '0 0 6px #10b981' : 'none'
          }} />
          <span style={{ color: 'var(--text-secondary)' }}>
            HDFS: <strong style={{ color: health?.hdfs === 'ok' ? '#10b981' : '#ef4444' }}>{health?.hdfs || '...'}</strong>
          </span>
          <span style={{ color: 'var(--border-color)' }}>|</span>
          <span style={{ color: 'var(--text-secondary)' }}>
            HBase: <strong style={{ color: health?.hbase === 'ok' ? '#10b981' : '#ef4444' }}>{health?.hbase || '...'}</strong>
          </span>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="btn btn-secondary"
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
            title="Refresh current view"
          >
            ↻ Refresh
          </button>
        )}
      </div>
    </header>
  );
};
