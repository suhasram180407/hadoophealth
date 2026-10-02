import React from 'react';

export const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Loading records...' }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', gap: '1rem' }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid rgba(2, 132, 199, 0.2)',
        borderTop: '3px solid #0284c7',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{message}</p>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
