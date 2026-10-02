import React, { useState } from 'react';

interface Props {
  data: any;
  maxHeight?: string;
}

export const JsonViewer: React.FC<Props> = ({ data, maxHeight = '450px' }) => {
  const [copied, setCopied] = useState(false);
  const formatted = JSON.stringify(data, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={handleCopy}
        className="btn btn-secondary"
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          padding: '0.3rem 0.6rem',
          fontSize: '0.75rem',
          zIndex: 10
        }}
      >
        {copied ? '✓ Copied' : 'Copy JSON'}
      </button>
      <pre className="json-viewer" style={{ maxHeight }}>
        <code>{formatted}</code>
      </pre>
    </div>
  );
};
