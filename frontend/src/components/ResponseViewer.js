import React, { useState } from 'react';
import JsonViewer from './JsonViewer';

const ResponseViewer = ({ request, response, error, onNavigate }) => {
  const [activeTab, setActiveTab] = useState('response');

  const formatResponse = (data) => {
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch (e) {
        return data;
      }
    }
    return data;
  };

  const getStatusColor = () => {
    if (error) return '#dc3545';
    if (response) return '#28a745';
    return '#6c757d';
  };

  const getStatusText = () => {
    if (error) return 'Error';
    if (response) return 'Success';
    return 'No Response';
  };

  return (
    <div className="response-viewer">
      <div className="card">
        <h2>Response</h2>
        
        {/* Request Summary */}
        <div className="response-section">
          <h3>Request Summary</h3>
          <div className="response-meta">
            <span>
              <span className={`status-indicator status-${error ? 'error' : response ? 'success' : 'loading'}`}></span>
              <strong>{request?.method}</strong> {request?.url}
            </span>
            <span>Doctype: <strong>{request?.doctype}</strong></span>
            <span>Status: <strong style={{ color: getStatusColor() }}>{getStatusText()}</strong></span>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'response' ? 'active' : ''}`}
            onClick={() => setActiveTab('response')}
          >
            Response
          </button>
          <button
            className={`tab ${activeTab === 'request' ? 'active' : ''}`}
            onClick={() => setActiveTab('request')}
          >
            Request Details
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'response' && (
            <div>
              {error ? (
                <div className="error-message">
                  <h4>Error Details</h4>
                  <div className="json-viewer">
                    <pre>{typeof error === 'string' ? error : JSON.stringify(error, null, 2)}</pre>
                  </div>
                </div>
              ) : response ? (
                <div>
                  <h4>Response Data</h4>
                  <div className="json-viewer">
                    <JsonViewer data={formatResponse(response)} />
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <h3>No Response</h3>
                  <p>Send a request to see the response here</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'request' && (
            <div>
              <h4>Request Details</h4>
              <div className="json-viewer">
                <div style={{ marginBottom: '15px' }}>
                  <strong>Method:</strong> {request?.method}
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <strong>URL:</strong> {request?.url}
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <strong>Doctype:</strong> {request?.doctype}
                </div>
                
                {request?.headers && Object.keys(request.headers).length > 0 && (
                  <div style={{ marginBottom: '15px' }}>
                    <strong>Headers:</strong>
                    <JsonViewer data={request.headers} />
                  </div>
                )}

                {request?.body && request.body !== '{}' && (
                  <div style={{ marginBottom: '15px' }}>
                    <strong>Request Body:</strong>
                    <JsonViewer data={formatResponse(request.body)} />
                  </div>
                )}

                {request?.params && (
                  <div style={{ marginBottom: '15px' }}>
                    <strong>Query Parameters:</strong>
                    <div style={{ 
                      background: '#f8f9fa', 
                      padding: '10px', 
                      borderRadius: '4px',
                      fontFamily: 'monospace',
                      fontSize: '14px'
                    }}>
                      {request.params}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
          <button
            className="btn btn-primary"
            onClick={() => onNavigate('/request')}
          >
            New Request
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => onNavigate('/')}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResponseViewer;
