import React from 'react';

interface Props {
  message: string;
  onRetry?: () => void;
}

export const ErrorBanner: React.FC<Props> = ({ message, onRetry }) => {
  return (
    <div style={{
      backgroundColor: 'var(--danger-bg)',
      border: '1px solid rgba(239, 68, 68, 0.4)',
      borderRadius: '8px',
      padding: '1rem 1.25rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem',
      color: '#f87171',
      marginBottom: '1.5rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontSize: '1.25rem' }}>⚠️</span>
        <span style={{ fontSize: '0.9rem' }}>{message}</span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn btn-secondary"
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
        >
          Retry
        </button>
      )}
    </div>
  );
};
