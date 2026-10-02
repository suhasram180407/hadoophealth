import React, { useState, useEffect } from 'react';
import { HdfsFileList, HdfsFileInfo, HdfsFileContent } from '../types';
import { api } from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorBanner } from '../components/ErrorBanner';
import { JsonViewer } from '../components/JsonViewer';

export const HdfsBrowserPage: React.FC = () => {
  const [data, setData] = useState<HdfsFileList | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('');

  // Selected file modal
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [content, setContent] = useState<HdfsFileContent | null>(null);
  const [contentLoading, setContentLoading] = useState<boolean>(false);
  const [contentError, setContentError] = useState<string | null>(null);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getHdfsFiles();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to list files from HDFS');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleInspect = async (filename: string) => {
    setSelectedFile(filename);
    setContentLoading(true);
    setContentError(null);
    try {
      const res = await api.getHdfsFileContent(filename);
      setContent(res);
    } catch (err: any) {
      setContentError(err.message || `Error reading file ${filename}`);
    } finally {
      setContentLoading(false);
    }
  };

  const filteredFiles = (data?.files || []).filter((f: HdfsFileInfo) =>
    f.filename.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div>
      {/* Path header & filter */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>HDFS Storage Path</div>
          <code style={{ fontSize: '1.1rem', color: '#10b981', fontWeight: 600 }}>
            {data?.path || '/healthcare/raw'}
          </code>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <input
            type="text"
            className="search-input"
            placeholder="Filter files by name..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Total: <strong>{data?.total_files ?? 111}</strong> files ({((data?.total_size_bytes ?? 0) / (1024 * 1024)).toFixed(1)} MB)
          </span>
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={fetchFiles} />}

      {loading ? (
        <LoadingSpinner message="Scanning HDFS directory /healthcare/raw..." />
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Raw Filename</th>
                <th>File Size</th>
                <th>Format</th>
                <th>Last Modified (UTC)</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredFiles.length > 0 ? (
                filteredFiles.map((file) => (
                  <tr key={file.filename}>
                    <td>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#f3f4f6' }}>
                        {file.filename}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {file.path}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{file.size_formatted}</span>
                    </td>
                    <td>
                      <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                        JSON (FHIR R4)
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {file.modification_time}
                    </td>
                    <td>
                      <button
                        onClick={() => handleInspect(file.filename)}
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                      >
                        Inspect Preview →
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    No files found matching "{filter}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* JSON Inspection Modal */}
      {selectedFile && (
        <div className="modal-overlay" onClick={() => setSelectedFile(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#ffffff' }}>
                  {selectedFile}
                </h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Read from HDFS NameNode via WebHDFS REST API
                </div>
              </div>
              <button className="modal-close" onClick={() => setSelectedFile(null)}>×</button>
            </div>

            <div className="modal-body">
              {contentLoading ? (
                <LoadingSpinner message={`Streaming ${selectedFile} from HDFS...`} />
              ) : contentError ? (
                <ErrorBanner message={contentError} />
              ) : content ? (
                <div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '0.75rem',
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)'
                  }}>
                    <span>Payload Size: <strong>{(content.size_bytes / 1024).toFixed(1)} KB</strong></span>
                    {content.preview_truncated && (
                      <span style={{ color: '#f59e0b' }}>⚠️ Preview truncated for performance</span>
                    )}
                  </div>
                  <JsonViewer data={content.content_json} maxHeight="520px" />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
