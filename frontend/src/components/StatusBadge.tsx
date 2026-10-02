import React from 'react';

interface Props {
  status: 'ok' | 'degraded' | 'down' | string;
  label?: string;
}

export const StatusBadge: React.FC<Props> = ({ status, label }) => {
  const norm = (status || '').toLowerCase();
  let badgeClass = 'badge-danger';
  let defaultLabel = 'Offline';

  if (norm === 'ok' || norm === 'running' || norm === 'completed') {
    badgeClass = 'badge-success';
    defaultLabel = 'Healthy';
  } else if (norm === 'degraded' || norm === 'idle' || norm === 'warning') {
    badgeClass = 'badge-warning';
    defaultLabel = 'Degraded';
  }

  return (
    <span className={`badge ${badgeClass}`}>
      <span className="badge-dot" />
      {label || defaultLabel}
    </span>
  );
};
