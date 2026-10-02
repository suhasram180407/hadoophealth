import React, { useState, useEffect } from 'react';
import { SystemStatus } from '../types';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorBanner } from '../components/ErrorBanner';

export const SystemStatusPage: React.FC = () => {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getSystemStatus();
      setStatus(res);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve cluster status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !status) return <LoadingSpinner message="Polling infrastructure diagnostic endpoints..." />;

  const nodes = [
    {
      id: 'backend',
      title: 'FastAPI Backend',
      tech: 'Python 3.11 / Uvicorn',
      port: status?.backend.port,
      status: status?.backend.status || 'ok',
      msg: status?.backend.message,
      details: status?.backend.details
    },
    {
      id: 'hdfs_nn',
      title: 'HDFS NameNode',
      tech: 'Hadoop 3.3.6 (fs.defaultFS)',
      port: status?.hdfs_namenode.port,
      status: status?.hdfs_namenode.status || 'ok',
      msg: status?.hdfs_namenode.message,
      details: status?.hdfs_namenode.details
    },
    {
      id: 'hdfs_dn',
      title: 'HDFS DataNode',
      tech: 'Hadoop 3.3.6 Storage Daemon',
      port: status?.hdfs_datanode.port,
      status: status?.hdfs_datanode.status || 'ok',
      msg: status?.hdfs_datanode.message,
      details: status?.hdfs_datanode.details
    },
    {
      id: 'hmaster',
      title: 'HBase Master',
      tech: 'HBase 2.5.15-hadoop3 (Local/Standalone)',
      port: status?.hbase_master.port,
      status: status?.hbase_master.status || 'ok',
      msg: status?.hbase_master.message,
      details: status?.hbase_master.details
    },
    {
      id: 'zk',
      title: 'ZooKeeper Coordinator',
      tech: 'Embedded MiniZooKeeperCluster',
      port: status?.zookeeper.port,
      status: status?.zookeeper.status || 'ok',
      msg: status?.zookeeper.message,
      details: status?.zookeeper.details
    },
    {
      id: 'hbase_rest',
      title: 'HBase REST Server',
      tech: 'Stargate HTTP Daemon',
      port: status?.hbase_rest.port,
      status: status?.hbase_rest.status || 'ok',
      msg: status?.hbase_rest.message,
      details: status?.hbase_rest.details
    },
  ];

  return (
    <div>
      {error && <ErrorBanner message={error} onRetry={fetchStatus} />}

      {/* Cluster Overview Header */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>
            Cluster Architecture Diagnostic Matrix
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Live status polled from <code>GET /api/system/status</code> every 15 seconds.
          </p>
        </div>

        <button onClick={fetchStatus} className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
          ↻ Refresh All Diagnostics
        </button>
      </div>

      {/* Node Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}>
        {nodes.map((node) => (
          <div
            key={node.id}
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#ffffff' }}>{node.title}</span>
                <StatusBadge status={node.status} label={node.status === 'ok' ? 'Running' : 'Failed'} />
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                {node.tech}
              </div>

              <div style={{
                backgroundColor: 'rgba(0,0,0,0.25)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '8px',
                padding: '0.75rem',
                fontSize: '0.825rem',
                color: 'var(--text-secondary)',
                lineHeight: '1.5'
              }}>
                <div><strong>Port:</strong> {node.port ?? 'N/A'}</div>
                <div><strong>Status:</strong> {node.msg}</div>
              </div>
            </div>

            {node.details && (
              <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {Object.entries(node.details).slice(0, 3).map(([k, v]) => (
                  <div key={k} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {k}: {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Storage and Table Verification Info */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '1.25rem'
      }}>
        {/* Dataset storage info */}
        <div className="card">
          <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', color: '#e5e7eb' }}>
            HDFS Storage Directory
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
            <div>Path: <code>{status?.dataset.hdfs_raw_path}</code></div>
            <div>Local Source: <code>{status?.dataset.path}</code></div>
            <div>Total Raw Files: <strong>{status?.dataset.total_files}</strong> files</div>
            <div>Dataset Size: <strong>{status?.dataset.size_mb} MB</strong> ({status?.dataset.size_bytes.toLocaleString()} bytes)</div>
          </div>
        </div>

        {/* HBase Table info */}
        <div className="card">
          <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', color: '#e5e7eb' }}>
            HBase Storage Table
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
            <div>Table: <code>{status?.hbase_table.table_name}</code></div>
            <div>Column Family: <code>{status?.hbase_table.column_family}</code></div>
            <div>Row Key: <code>Patient UUID (HL7 FHIR id)</code></div>
            <div>Indexed Patients in HBase: <strong style={{ color: '#10b981' }}>{status?.hbase_table.row_count}</strong> records</div>
          </div>
        </div>
      </div>
    </div>
  );
};
