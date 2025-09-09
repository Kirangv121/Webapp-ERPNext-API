import React, { useState, useEffect } from 'react';

const JsonEditor = ({ data, onChange, onSave, onCancel, loading, error, doctype }) => {
  const [jsonString, setJsonString] = useState('');
  const [jsonError, setJsonError] = useState(null);
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    if (data) {
      try {
        const formatted = JSON.stringify(data, null, 2);
        setJsonString(formatted);
        setJsonError(null);
        setIsValid(true);
      } catch (err) {
        setJsonError('Invalid JSON data');
        setIsValid(false);
      }
    }
  }, [data]);

  const handleJsonChange = (value) => {
    setJsonString(value);
    
    try {
      const parsed = JSON.parse(value);
      setJsonError(null);
      setIsValid(true);
      if (onChange) {
        onChange(parsed);
      }
    } catch (err) {
      setJsonError('Invalid JSON syntax');
      setIsValid(false);
    }
  };

  const handleSave = () => {
    if (isValid && onSave) {
      try {
        const parsed = JSON.parse(jsonString);
        onSave(parsed);
      } catch (err) {
        setJsonError('Invalid JSON syntax');
      }
    }
  };

  const formatJson = () => {
    try {
      const parsed = JSON.parse(jsonString);
      const formatted = JSON.stringify(parsed, null, 2);
      setJsonString(formatted);
      setJsonError(null);
      setIsValid(true);
    } catch (err) {
      setJsonError('Cannot format invalid JSON');
    }
  };

  return (
    <div className="json-editor">
      <div className="json-editor-header">
        <h3>✏️ Edit {doctype} Data</h3>
        <div className="json-editor-actions">
          <button
            className="btn btn-secondary btn-sm"
            onClick={formatJson}
            disabled={!jsonString}
          >
            Format JSON
          </button>
        </div>
      </div>

      <div className="json-editor-content">
        <div className="json-editor-info">
          <p>Edit the JSON data below and click "Save Record" to save changes to the ERPNext server.</p>
          {doctype && (
            <div className="doctype-info">
              <strong>Doctype:</strong> {doctype}
              {data && (data.name || data.item_code || data.customer_name) && (
                <div style={{ marginTop: '5px' }}>
                  <strong>Mode:</strong> {data.name || data.item_code || data.customer_name ? 'Update existing record' : 'Create new record'}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="json-editor-textarea">
          <textarea
            value={jsonString}
            onChange={(e) => handleJsonChange(e.target.value)}
            placeholder="Enter JSON data..."
            className={`json-textarea ${!isValid ? 'error' : ''}`}
            style={{
              width: '100%',
              minHeight: '400px',
              fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
              fontSize: '14px',
              lineHeight: '1.4',
              padding: '15px',
              border: `2px solid ${isValid ? '#e1e4e8' : '#dc3545'}`,
              borderRadius: '4px',
              backgroundColor: '#f6f8fa',
              resize: 'vertical'
            }}
          />
        </div>

        {jsonError && (
          <div className="json-error">
            <strong>❌ JSON Error:</strong> {jsonError}
          </div>
        )}

        {error && (
          <div className="error-message">
            <strong>❌ Update Error:</strong> {error}
          </div>
        )}

        <div className="json-editor-buttons">
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={loading || !isValid}
          >
            {loading ? 'Saving...' : 'Save Record'}
          </button>
          <button
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default JsonEditor;
