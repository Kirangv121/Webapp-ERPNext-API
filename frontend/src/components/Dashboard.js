import React, { useState, useEffect } from 'react';
import { CONFIG } from '../config';
import { getStoredBaseURL, saveBaseURL, testConnection, fetchDoctypes, makeApiRequest } from '../utils/apiClient';
import JsonEditor from './JsonEditor';

const Dashboard = ({ onRequest, onNavigate }) => {
  const [doctypes, setDoctypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Removed recent requests - they reset on refresh
  const [baseURL, setBaseURL] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [showConnectionForm, setShowConnectionForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [methodTestResults, setMethodTestResults] = useState(null);
  const [testingMethods, setTestingMethods] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [putData, setPutData] = useState(null);
  const [putDoctype, setPutDoctype] = useState('');
  const [showPutEditor, setShowPutEditor] = useState(false);
  const [putLoading, setPutLoading] = useState(false);
  const [putError, setPutError] = useState(null);

  useEffect(() => {
    // No persistent data loading - everything resets on refresh
  }, []);

  const testERPNextConnection = async () => {
    if (!baseURL || !apiKey || !apiSecret) {
      setError('Please provide Base URL, API Key, and API Secret');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    setConnectionStatus(null);

    try {
      const result = await testConnection(baseURL, apiKey, apiSecret);
      console.log('Connection test result:', result);
      if (result.success) {
        setConnectionStatus('success');
        setError(null);
        // Show user information from the response
        console.log('Result data:', result.data);
        if (result.data && result.data.user && result.data.user.message) {
          setSuccessMessage(`✅ Connection successful!`);
          setUserInfo(result.data.user.message);
          console.log('User info set to:', result.data.user.message);
        } else {
          setSuccessMessage('✅ Connection successful!');
          setUserInfo('Connected');
          console.log('No user info found, using default');
        }
        // Don't save credentials - they reset on refresh
      } else {
        setConnectionStatus('error');
        setError(result.error);
        setSuccessMessage(null);
        setUserInfo(null);
      }
    } catch (err) {
      setConnectionStatus('error');
      setError('Connection test failed: ' + (err.message || 'Unknown error'));
      setSuccessMessage(null);
      setUserInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctypes = async () => {
    if (!baseURL || !apiKey || !apiSecret) {
      setError('Please configure and test connection first');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchDoctypes(baseURL, apiKey, apiSecret);
      if (result.success) {
        setDoctypes(result.data);
        setError(null);
      } else {
        // If API fails, use fallback doctypes
        console.log('API failed, using fallback doctypes');
        setDoctypes(CONFIG.COMMON_DOCTYPES);
        setError('Using fallback doctypes. API connection failed: ' + result.error);
      }
    } catch (err) {
      // If API fails, use fallback doctypes
      console.log('API error, using fallback doctypes');
      setDoctypes(CONFIG.COMMON_DOCTYPES);
      setError('Using fallback doctypes. API connection failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadFallbackDoctypes = () => {
    setDoctypes(CONFIG.COMMON_DOCTYPES);
    setError('Using fallback doctypes. Connect to ERPNext to get live doctypes.');
  };

  const testDoctypesAPI = async () => {
    if (!baseURL || !apiKey || !apiSecret) {
      setError('Please configure connection first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Test the exact API call that should work
      const testURL = `${baseURL}/api/method/frappe.desk.doctype.data_import_tool.data_import_tool.get_doctypes`;
      console.log('Testing doctypes API:', testURL);
      
      const response = await fetch(testURL, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Authorization': `token ${apiKey}:${apiSecret}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('Doctypes API response status:', response.status);
      const data = await response.json();
      console.log('Doctypes API response data:', data);

      if (response.ok) {
        if (data.message && Array.isArray(data.message)) {
          setDoctypes(data.message);
          setError(null);
        } else {
          setError('API returned unexpected format: ' + JSON.stringify(data));
        }
      } else {
        setError(`API Error ${response.status}: ${data.message || response.statusText}`);
      }
    } catch (err) {
      console.error('Doctypes API test error:', err);
      setError('Doctypes API test failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const testAllMethods = async () => {
    if (!baseURL || !apiKey || !apiSecret) {
      setError('Please configure and test connection first');
      return;
    }

    setTestingMethods(true);
    setError(null);
    setMethodTestResults(null);

    const methods = ['GET', 'POST', 'PUT', 'DELETE'];
    const results = {};

    for (const method of methods) {
      try {
        const requestData = {
          method,
          doctype: 'Customer',
          url: '/api/resource/Customer',
          baseURL,
          headers: {
            'Authorization': `token ${apiKey}:${apiSecret}`,
            'Content-Type': 'application/json'
          },
          body: method !== 'GET' ? JSON.stringify({ name: 'Test Customer' }) : '',
          params: ''
        };

        const result = await makeApiRequest(requestData);
        results[method] = {
          success: result.success,
          message: result.success ? 'Success' : result.error,
          status: result.success ? '✅' : '❌'
        };
      } catch (err) {
        results[method] = {
          success: false,
          message: err.message || 'Unknown error',
          status: '❌'
        };
      }
    }

    setMethodTestResults(results);
    setTestingMethods(false);
  };

  const handleQuickRequest = (method, doctype) => {
    const requestData = {
      method,
      doctype,
      url: `/api/resource/${doctype}`,
      baseURL,
      headers: {},
      body: method !== 'GET' ? '{}' : '',
      params: ''
    };
    onRequest(requestData);
  };

  const handlePutRequest = async (doctype) => {
    if (!baseURL || !apiKey || !apiSecret) {
      setError('Please configure and test connection first');
      return;
    }

    setPutLoading(true);
    setPutError(null);
    setPutDoctype(doctype);

    try {
      // First, fetch existing data for the doctype to get a sample record
      const requestData = {
        method: 'GET',
        doctype,
        url: `/api/resource/${doctype}`,
        baseURL,
        headers: {
          'Authorization': `token ${apiKey}:${apiSecret}`,
          'Content-Type': 'application/json'
        },
        body: '',
        params: 'limit=5' // Get a few records to see the structure
      };

      console.log('Fetching data for PUT request:', requestData);
      const result = await makeApiRequest(requestData);
      console.log('PUT fetch result:', result);
      
      if (result.success) {
        // If we have data, use the first record as template
        if (result.data && result.data.data && result.data.data.length > 0) {
          console.log('Using existing record for editing:', result.data.data[0]);
          // Remove 'doctype' and 'name' from existing record as they're in the URL
          const { doctype: _, name: __, ...recordData } = result.data.data[0];
          setPutData(recordData);
        } else {
          console.log('No existing data, creating template for:', doctype);
          // If no data exists, create a template structure
          // Exclude 'doctype' and 'name' as they're in the URL
          setPutData({
            // Add common fields based on doctype
            ...(doctype === 'Customer' && {
              customer_name: '',
              customer_type: 'Individual',
              territory: 'All Territories'
            }),
            ...(doctype === 'Item' && {
              item_code: '',
              item_name: '',
              item_group: 'All Item Groups'
            }),
            ...(doctype === 'Sales Order' && {
              customer: '',
              transaction_date: new Date().toISOString().split('T')[0],
              items: []
            })
          });
        }
        setShowPutEditor(true);
      } else {
        console.error('Failed to fetch data for PUT:', result.error);
        throw new Error(result.error);
      }
    } catch (err) {
      setPutError(err.message || 'Failed to fetch data for PUT request');
    } finally {
      setPutLoading(false);
    }
  };

  const handlePutDataChange = (newData) => {
    setPutData(newData);
  };

  const handlePutSubmit = async () => {
    if (!putData || !putDoctype) {
      setPutError('No data to update');
      return;
    }

    setPutLoading(true);
    setPutError(null);

    try {
      // Ensure the doctype field is set
      const dataToSend = {
        ...putData,
        doctype: putDoctype
      };

      // Determine if this is an existing record or new record
      const recordName = putData.name || putData.item_code || putData.customer_name;
      const isExistingRecord = recordName && recordName !== '';

      let requestData;
      
      if (isExistingRecord) {
        // Update existing record using PUT
        requestData = {
          method: 'PUT',
          doctype: putDoctype,
          url: `/api/resource/${putDoctype}/${recordName}`,
          baseURL,
          headers: {
            'Authorization': `token ${apiKey}:${apiSecret}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(dataToSend),
          params: ''
        };
      } else {
        // Create new record using POST
        requestData = {
          method: 'POST',
          doctype: putDoctype,
          url: `/api/resource/${putDoctype}`,
          baseURL,
          headers: {
            'Authorization': `token ${apiKey}:${apiSecret}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(dataToSend),
          params: ''
        };
      }

      console.log('Submitting PUT/POST request:', requestData);
      const result = await makeApiRequest(requestData);
      console.log('PUT/POST submit result:', result);
      
      if (result.success) {
        const action = isExistingRecord ? 'updated' : 'created';
        console.log(`Successfully ${action} ${putDoctype} record`);
        setSuccessMessage(`✅ Successfully ${action} ${putDoctype} record`);
        setShowPutEditor(false);
        setPutData(null);
        setPutDoctype('');
        // Optionally refresh the doctypes or show updated data
      } else {
        console.error('Failed to submit PUT/POST request:', result.error);
        throw new Error(result.error);
      }
    } catch (err) {
      setPutError(err.message || 'Failed to save record');
    } finally {
      setPutLoading(false);
    }
  };

  const handlePutCancel = () => {
    setShowPutEditor(false);
    setPutData(null);
    setPutDoctype('');
    setPutError(null);
  };

  const handleRecentRequestClick = (request) => {
    onRequest(request);
  };

  // Removed recent requests functionality

  return (
    <div className="dashboard">
      <div className="header">
        <div className="header-content">
          <div className="header-text">
            <h1>🚀 ERPNext API Tester</h1>
            <p>Test ERPNext APIs with ease - Postman-like interface for ERPNext</p>
          </div>
          <div className="header-actions">
            <button
              className="btn btn-secondary"
              onClick={() => window.location.reload()}
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Connection Configuration */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            🔗 ERPNext Connection
          </h3>
          <button 
            className="btn btn-secondary"
            onClick={() => setShowConnectionForm(!showConnectionForm)}
          >
            {showConnectionForm ? '👁️ Hide' : '⚙️ Configure'} Connection
          </button>
        </div>
        
        {showConnectionForm && (
          <div className="auth-section">
            <div className="auth-inputs">
              <div className="form-group">
                <label className="form-label">🌐 Base URL</label>
                <input
                  type="url"
                  className="form-control"
                  value={baseURL}
                  onChange={(e) => setBaseURL(e.target.value)}
                  placeholder="https://your-erpnext-instance.com"
                />
                <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                  Examples: 
                  <br />• http://localhost:8000 (local development)
                  <br />• https://demo.erpnext.com (demo instance)
                  <br />• https://your-erpnext-instance.com (your server)
                  <br />
                  <br /><strong>Note:</strong> If you get CORS errors, you need to enable CORS in your ERPNext instance:
                  <br />• Go to System Settings → API → Allowed Origins
                  <br />• Add: http://localhost:3000
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">🔑 API Key</label>
                <input
                  type="text"
                  className="form-control"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your ERPNext API Key"
                />
              </div>
              <div className="form-group">
                <label className="form-label">🔐 API Secret</label>
                <input
                  type="password"
                  className="form-control"
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  placeholder="Enter your ERPNext API Secret"
                />
              </div>
            </div>
            
            <div style={{ marginTop: '15px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                className="btn btn-primary"
                onClick={testERPNextConnection}
                disabled={loading || !baseURL || !apiKey || !apiSecret}
              >
                {loading ? '🔄 Testing...' : '🧪 Test Connection'}
              </button>
              
              <button
                className="btn btn-secondary"
                onClick={() => {
                  // Open ERPNext in new tab for manual testing
                  window.open(`${baseURL}/api/method/frappe.auth.get_logged_user`, '_blank');
                }}
                disabled={!baseURL}
                style={{ fontSize: '12px' }}
              >
                🔗 Test in Browser
              </button>
              
              {successMessage && (
                <div className="success-message">
                  {successMessage}
                  {userInfo && (
                    <div style={{ 
                      marginTop: '5px', 
                      fontSize: '0.9em', 
                      fontWeight: 'bold',
                      color: '#155724'
                    }}>
                      👤 User: {userInfo}
                    </div>
                  )}
                </div>
              )}
              {connectionStatus === 'error' && error && (
                <div className="error-message">❌ Connection failed: {error}</div>
              )}
            </div>
          </div>
        )}
        
        {!showConnectionForm && baseURL && (
          <div style={{ padding: '10px', background: '#f8f9fa', borderRadius: '4px', marginBottom: '15px' }}>
            <strong>Connected to:</strong> {baseURL}
            {connectionStatus === 'success' && (
              <span className="success-message" style={{ marginLeft: '10px' }}>
                ✅ Connected
                {userInfo && (
                  <span style={{ marginLeft: '5px', fontSize: '0.9em' }}>
                    (👤 {userInfo})
                  </span>
                )}
              </span>
            )}
            {connectionStatus === 'error' && (
              <span className="error-message" style={{ marginLeft: '10px' }}>❌ Connection Failed</span>
            )}
          </div>
        )}
        
        {connectionStatus === 'error' && error && (
          <div className="error-message" style={{ marginBottom: '15px' }}>
            <strong>⚠️ Connection Error:</strong>
            <div style={{ marginTop: '10px', fontSize: '14px' }}>
              {error}
            </div>
            <div style={{ marginTop: '10px', fontSize: '12px' }}>
              <strong>Troubleshooting tips:</strong>
              <ul style={{ marginTop: '5px', paddingLeft: '20px' }}>
                <li>Make sure your ERPNext server is running</li>
                <li>Check that the base URL is correct (include http:// or https://)</li>
                <li>Verify your API Key and Secret are correct</li>
                <li>Ensure CORS is enabled in ERPNext for your domain</li>
                <li>Try using the demo instance: https://demo.erpnext.com</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              ⚡ Quick Actions
            </h3>
          </div>
          <div className="quick-actions">
            <button 
              className="btn btn-primary"
              onClick={() => onNavigate('/request')}
            >
              ➕ New Request
            </button>
            <button 
              className="btn btn-secondary"
              onClick={fetchDoctypes}
              disabled={loading || !baseURL || !apiKey || !apiSecret}
            >
              {loading ? '🔄 Loading...' : '📋 Fetch Live Doctypes'}
            </button>
            <button 
              className="btn btn-primary"
              onClick={loadFallbackDoctypes}
              disabled={loading}
            >
              📚 Load Common Doctypes
            </button>
            <button 
              className="btn btn-success"
              onClick={testDoctypesAPI}
              disabled={loading || !baseURL || !apiKey || !apiSecret}
            >
              {loading ? '🔄 Testing...' : '🧪 Test Doctypes API'}
            </button>
            <button 
              className="btn btn-info"
              onClick={testAllMethods}
              disabled={testingMethods || !baseURL || !apiKey || !apiSecret}
            >
              {testingMethods ? '🔄 Testing Methods...' : '🔧 Test All HTTP Methods'}
            </button>
          </div>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          {successMessage && (
            <div className="success-message" style={{ 
              color: '#28a745', 
              backgroundColor: '#d4edda', 
              border: '1px solid #c3e6cb', 
              padding: '10px', 
              borderRadius: '4px', 
              marginTop: '10px' 
            }}>
              {successMessage}
              {userInfo && (
                <div style={{ 
                  marginTop: '5px', 
                  fontSize: '0.9em', 
                  fontWeight: 'bold',
                  color: '#155724'
                }}>
                  👤 User: {userInfo}
                </div>
              )}
            </div>
          )}

          {methodTestResults && (
            <div className="method-test-results">
              <h4>🔧 HTTP Methods Test Results</h4>
              <div className="method-test-grid">
                {Object.entries(methodTestResults).map(([method, result]) => (
                  <div key={method} className={`method-test-item ${result.success ? 'success' : 'error'}`}>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {result.status} <span className={`method-tag method-${method.toLowerCase()}`}>{method}</span>
                    </div>
                    <div style={{ fontSize: '0.9em', color: result.success ? 'var(--success-color)' : 'var(--error-color)' }}>
                      {result.message}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {doctypes.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <h4>📋 Available Doctypes ({doctypes.length})</h4>
              <div style={{ 
                maxHeight: '300px', 
                overflowY: 'auto', 
                border: '1px solid #eee', 
                padding: '10px',
                borderRadius: '4px'
              }}>
                {doctypes.map((doctype, index) => (
                  <div key={index} style={{ 
                    padding: '5px 0', 
                    borderBottom: '1px solid #f0f0f0',
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'center'
                  }}>
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => handleQuickRequest('GET', doctype)}
                    >
                      GET
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleQuickRequest('POST', doctype)}
                    >
                      POST
                    </button>
                    <button
                      className="btn btn-warning btn-sm"
                      onClick={() => handlePutRequest(doctype)}
                    >
                      PUT
                    </button>
                    <span style={{ fontSize: '14px', flex: 1 }}>{doctype}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                💡 Click GET to fetch records, POST to create new records, PUT to edit existing records
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              🚀 Getting Started
            </h3>
          </div>
          <div className="empty-state">
            <h3>👋 Welcome to ERPNext API Tester</h3>
            <p>Configure your connection above, then create a new request to test ERPNext APIs</p>
            <div style={{ marginTop: '20px' }}>
              <button 
                className="btn btn-primary btn-lg"
                onClick={() => onNavigate('/request')}
              >
                ➕ Create New Request
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PUT Editor Modal */}
      {showPutEditor && (
        <div className="modal-overlay">
          <div className="modal-content">
            <JsonEditor
              data={putData}
              onChange={handlePutDataChange}
              onSave={handlePutSubmit}
              onCancel={handlePutCancel}
              loading={putLoading}
              error={putError}
              doctype={putDoctype}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
