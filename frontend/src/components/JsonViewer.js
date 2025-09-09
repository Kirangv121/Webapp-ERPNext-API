import React, { useState } from 'react';

const JsonViewer = ({ data, style = {} }) => {
  const [expanded, setExpanded] = useState({});
  const [copied, setCopied] = useState(false);

  const toggleExpanded = (path) => {
    setExpanded(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const renderValue = (value, path = '') => {
    if (value === null) {
      return <span style={{ color: '#808080' }}>null</span>;
    }
    
    if (typeof value === 'undefined') {
      return <span style={{ color: '#808080' }}>undefined</span>;
    }
    
    if (typeof value === 'boolean') {
      return <span style={{ color: '#0000ff' }}>{value.toString()}</span>;
    }
    
    if (typeof value === 'number') {
      return <span style={{ color: '#098658' }}>{value}</span>;
    }
    
    if (typeof value === 'string') {
      return <span style={{ color: '#a31515' }}>"{value}"</span>;
    }
    
    if (Array.isArray(value)) {
      const isExpanded = expanded[path];
      return (
        <div>
          <span 
            onClick={() => toggleExpanded(path)}
            style={{ cursor: 'pointer', userSelect: 'none' }}
          >
            {isExpanded ? '▼' : '▶'} Array({value.length})
          </span>
          {isExpanded && (
            <div style={{ marginLeft: '20px', marginTop: '5px' }}>
              {value.map((item, index) => (
                <div key={index}>
                  <span style={{ color: '#666' }}>[{index}]:</span> {renderValue(item, `${path}[${index}]`)}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    
    if (typeof value === 'object') {
      const isExpanded = expanded[path];
      const keys = Object.keys(value);
      return (
        <div>
          <span 
            onClick={() => toggleExpanded(path)}
            style={{ cursor: 'pointer', userSelect: 'none' }}
          >
            {isExpanded ? '▼' : '▶'} Object{keys.length > 0 ? ` {${keys.length}}` : '{}'}
          </span>
          {isExpanded && (
            <div style={{ marginLeft: '20px', marginTop: '5px' }}>
              {keys.map(key => (
                <div key={key}>
                  <span style={{ color: '#001080' }}>"{key}"</span>: {renderValue(value[key], `${path}.${key}`)}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    
    return <span>{String(value)}</span>;
  };

  const formatJson = (data) => {
    try {
      return JSON.stringify(data, null, 2);
    } catch (e) {
      return String(data);
    }
  };

  return (
    <div style={{ ...style, position: 'relative' }}>
      <div style={{ 
        position: 'absolute', 
        top: '10px', 
        right: '10px', 
        zIndex: 1 
      }}>
        <button
          onClick={() => copyToClipboard(formatJson(data))}
          style={{
            background: '#007bff',
            color: 'white',
            border: 'none',
            padding: '5px 10px',
            borderRadius: '3px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          {copied ? 'Copied!' : 'Copy JSON'}
        </button>
      </div>
      
      <div style={{
        fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
        fontSize: '14px',
        lineHeight: '1.4',
        maxHeight: '400px',
        overflow: 'auto',
        padding: '10px',
        border: '1px solid #e1e4e8',
        borderRadius: '4px',
        backgroundColor: '#f6f8fa'
      }}>
        {renderValue(data)}
      </div>
    </div>
  );
};

export default JsonViewer;
