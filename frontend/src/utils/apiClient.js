import axios from 'axios';
import { CONFIG } from '../config';

// Create axios instance with base configuration
const createApiClient = (baseURL = '') => {
  // Use Express server as proxy for all API calls
  const proxyBaseURL = 'http://localhost:3001';
  
  const client = axios.create({
    baseURL: proxyBaseURL,
    timeout: 30000,
    headers: CONFIG.DEFAULT_HEADERS,
    withCredentials: false,
    crossDomain: true
  });

  // Add request interceptor for debugging
  client.interceptors.request.use(
    (config) => {
      console.log('Making request to:', config.baseURL + config.url);
      console.log('Headers:', config.headers);
      return config;
    },
    (error) => {
      console.error('Request interceptor error:', error);
      return Promise.reject(error);
    }
  );

  // Add response interceptor for debugging
  client.interceptors.response.use(
    (response) => {
      console.log('Response received:', response.status, response.data);
      return response;
    },
    (error) => {
      console.error('Response error:', error.response?.status, error.message);
      return Promise.reject(error);
    }
  );

  return client;
};

// Get stored base URL
export const getStoredBaseURL = () => {
  return localStorage.getItem(CONFIG.STORAGE_KEYS.BASE_URL) || '';
};

// Save base URL to localStorage
export const saveBaseURL = (baseURL) => {
  localStorage.setItem(CONFIG.STORAGE_KEYS.BASE_URL, baseURL);
};

// Validate URL format
export const validateURL = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch (e) {
    return false;
  }
};

// Test connection to ERPNext instance
export const testConnection = async (baseURL, apiKey, apiSecret) => {
  try {
    // Validate base URL format
    if (!baseURL) {
      return { success: false, error: 'Base URL is required' };
    }
    
    // Ensure base URL has proper format
    let cleanBaseURL = baseURL.trim();
    if (!cleanBaseURL.startsWith('http://') && !cleanBaseURL.startsWith('https://')) {
      cleanBaseURL = 'https://' + cleanBaseURL;
    }
    
    // Remove trailing slash
    cleanBaseURL = cleanBaseURL.replace(/\/$/, '');
    
    console.log('Testing connection to:', cleanBaseURL);
    
    // Use Express server proxy for the request
    const client = createApiClient();
    const response = await client.get('/api/method/frappe.auth.get_logged_user', {
      headers: {
        'Authorization': `token ${apiKey}:${apiSecret}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Target-URL': cleanBaseURL // Pass the target URL to the proxy
      }
    });
    
    console.log('Connection test successful');
    return { success: true, data: response.data };
    
  } catch (error) {
    console.error('Connection test error:', error);
    
    let errorMessage = 'Connection failed';
    
    if (error.message?.includes('CORS')) {
      errorMessage = `CORS Error: Cannot connect to ${baseURL} due to CORS policy.
      
      Solutions:
      1. Enable CORS in your ERPNext instance
      2. Use a CORS proxy service
      3. Run this app from the same domain as ERPNext
      
      To enable CORS in ERPNext:
      - Go to System Settings → API
      - Add "http://localhost:3000" to allowed origins
      - Or add "*" for all origins (less secure)`;
    } else if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
      errorMessage = `Network error: Cannot connect to ${baseURL}. Please check:
      - Your internet connection
      - The base URL is correct (e.g., https://your-erpnext-instance.com)
      - ERPNext server is running
      - CORS is configured in ERPNext`;
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = `Connection refused: Cannot reach ${baseURL}. Please check:
      - The server is running
      - The URL is correct
      - No firewall blocking the connection`;
    } else if (error.message?.includes('HTTP 401')) {
      errorMessage = 'Authentication failed: Please check your API Key and Secret';
    } else if (error.message?.includes('HTTP 404')) {
      errorMessage = `API endpoint not found: ${baseURL}/api/method/frappe.auth.get_logged_user
      Please check your base URL`;
    } else if (error.message?.includes('HTTP 5')) {
      errorMessage = 'Server error: ERPNext server is having issues. Please try again later';
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = `Error: ${error.message}`;
    }
    
    return { 
      success: false, 
      error: errorMessage
    };
  }
};

// Fetch doctypes from ERPNext
export const fetchDoctypes = async (baseURL, apiKey, apiSecret) => {
  try {
    // Clean base URL
    let cleanBaseURL = baseURL.trim();
    if (!cleanBaseURL.startsWith('http://') && !cleanBaseURL.startsWith('https://')) {
      cleanBaseURL = 'https://' + cleanBaseURL;
    }
    cleanBaseURL = cleanBaseURL.replace(/\/$/, '');
    
    console.log('Fetching doctypes from:', cleanBaseURL);
    
    // Try multiple doctype endpoints
    const doctypeEndpoints = [
      '/api/method/frappe.desk.doctype.data_import_tool.data_import_tool.get_doctypes',
      '/api/method/frappe.desk.doctype.data_import_tool.data_import_tool.get_doctypes_for_import',
      '/api/method/frappe.desk.doctype.data_import_tool.data_import_tool.get_doctypes_for_import',
      '/api/method/frappe.desk.doctype.data_import_tool.data_import_tool.get_doctypes_for_import',
      '/api/method/frappe.desk.doctype.data_import_tool.data_import_tool.get_doctypes_for_import'
    ];
    
    const client = createApiClient();
    let lastError = null;
    
    for (const endpoint of doctypeEndpoints) {
      try {
        console.log('Trying endpoint:', endpoint);
        const response = await client.get(endpoint, {
          headers: {
            'Authorization': `token ${apiKey}:${apiSecret}`,
            'Content-Type': 'application/json',
            'X-Target-URL': cleanBaseURL
          }
        });
        
        console.log('Doctypes response:', response.data);
        
        // Handle different response formats
        let doctypes = [];
        if (response.data && response.data.message) {
          doctypes = Array.isArray(response.data.message) ? response.data.message : [];
        } else if (Array.isArray(response.data)) {
          doctypes = response.data;
        } else if (response.data && response.data.doctypes) {
          doctypes = response.data.doctypes;
        }
        
        if (doctypes.length > 0) {
          console.log('Successfully fetched doctypes:', doctypes.length);
          return { success: true, data: doctypes };
        }
      } catch (error) {
        console.log(`Endpoint ${endpoint} failed:`, error.message);
        lastError = error;
        continue;
      }
    }
    
    // If all endpoints failed, try a simple resource list
    try {
      console.log('Trying simple resource list...');
      const response = await client.get('/api/resource', {
        headers: {
          'Authorization': `token ${apiKey}:${apiSecret}`,
          'Content-Type': 'application/json',
          'X-Target-URL': cleanBaseURL
        }
      });
      
      console.log('Resource list response:', response.data);
      
      if (response.data && response.data.data) {
        const doctypes = response.data.data.map(item => item.doctype).filter(Boolean);
        if (doctypes.length > 0) {
          return { success: true, data: [...new Set(doctypes)] }; // Remove duplicates
        }
      }
    } catch (error) {
      console.log('Resource list also failed:', error.message);
    }
    
    // If all methods failed, throw the last error
    throw lastError || new Error('All doctype endpoints failed');
    
  } catch (error) {
    console.error('Fetch doctypes error:', error);
    
    let errorMessage = 'Failed to fetch doctypes';
    
    if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
      errorMessage = `Network error: Cannot connect to ${baseURL}. Please check your connection and base URL`;
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = `Connection refused: Cannot reach ${baseURL}`;
    } else if (error.response?.status === 401) {
      errorMessage = 'Authentication failed: Please check your API Key and Secret';
    } else if (error.response?.status === 403) {
      errorMessage = 'Permission denied: You do not have access to fetch doctypes. Please check your user permissions.';
    } else if (error.response?.status === 404) {
      errorMessage = `API endpoint not found: ${baseURL}${CONFIG.ENDPOINTS.DOCTYPES}`;
    } else if (error.response?.status >= 500) {
      errorMessage = 'Server error: ERPNext server is having issues';
    } else if (error.response?.data?.message) {
      errorMessage = `API Error: ${error.response.data.message}`;
    } else if (error.message) {
      errorMessage = `Error: ${error.message}`;
    }
    
    return { 
      success: false, 
      error: errorMessage
    };
  }
};

// Make API request
export const makeApiRequest = async (requestData) => {
  const { method, url, headers, body, params, baseURL } = requestData;
  
  try {
    const client = createApiClient();
    
    const config = {
      method: method.toLowerCase(),
      url: url,
      headers: {
        ...headers,
        'X-Target-URL': baseURL // Pass the target URL to the proxy
      },
      data: method !== 'GET' && body ? JSON.parse(body) : undefined,
      params: params ? Object.fromEntries(new URLSearchParams(params)) : undefined
    };

    const response = await client(config);
    return { success: true, data: response.data };
  } catch (error) {
    let errorMessage = 'Request failed';
    
    // Get the HTTP method for better error context
    const httpMethod = requestData?.method || 'UNKNOWN';
    
    if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
      errorMessage = 'Network error: Please check your internet connection and base URL';
    } else if (error.response?.status === 401) {
      errorMessage = 'Authentication failed: Please check your API Key and Secret';
    } else if (error.response?.status === 403) {
      if (httpMethod === 'GET') {
        errorMessage = `Permission denied: You don't have permission to read this Doctype. Please check your user permissions in ERPNext.`;
      } else if (httpMethod === 'POST') {
        errorMessage = `Permission denied: You don't have permission to create records in this Doctype. Please check your user permissions in ERPNext.`;
      } else if (httpMethod === 'PUT') {
        errorMessage = `Permission denied: You don't have permission to update records in this Doctype. Please check your user permissions in ERPNext.`;
      } else if (httpMethod === 'DELETE') {
        errorMessage = `Permission denied: You don't have permission to delete records in this Doctype. Please check your user permissions in ERPNext.`;
      } else {
        errorMessage = `Permission denied: You don't have permission for this operation on this Doctype. Please check your user permissions in ERPNext.`;
      }
    } else if (error.response?.status === 404) {
      if (httpMethod === 'GET') {
        errorMessage = 'Doctype not found: Please check that the doctype name is correct and exists in your ERPNext instance.';
      } else {
        errorMessage = 'API endpoint not found: Please check your base URL and doctype';
      }
    } else if (error.response?.status === 400) {
      if (httpMethod === 'POST' || httpMethod === 'PUT') {
        errorMessage = 'Bad request: Please check your request data format and required fields. Make sure all required fields are provided.';
      } else {
        errorMessage = 'Bad request: Please check your request data and parameters';
      }
    } else if (error.response?.status === 405) {
      errorMessage = `Method not allowed: ${httpMethod} method is not supported for this endpoint. Please check the API documentation.`;
    } else if (error.response?.status === 422) {
      errorMessage = 'Validation error: The request data is invalid. Please check your input data and try again.';
    } else if (error.response?.status >= 500) {
      errorMessage = 'Server error: ERPNext server is having issues. Please try again later.';
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return { 
      success: false, 
      error: errorMessage
    };
  }
};

export default createApiClient;
