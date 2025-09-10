const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Serve static files from the React app build directory (if it exists)
if (require('fs').existsSync(path.join(__dirname, 'build'))) {
  app.use(express.static(path.join(__dirname, 'build')));
}

// Custom proxy endpoint for ERPNext API calls
app.use('/api/*', async (req, res) => {
  try {
    const targetURL = req.headers['x-target-url'] || 'https://erpnext-kiran.m.erpnext.com';
    const apiPath = req.originalUrl.replace('/api', '/api');
    const fullURL = targetURL + apiPath;
    
    console.log('📡 Proxying ERPNext API calls to:', targetURL);
    console.log('Proxying request to:', fullURL);
    console.log('Method:', req.method);
    console.log('Headers:', req.headers);
    
    // Prepare headers for the target request
    const targetHeaders = { ...req.headers };
    delete targetHeaders['x-target-url'];
    delete targetHeaders['host'];
    
    // Make the request to the target server
    const axios = require('axios');
    const response = await axios({
      method: req.method,
      url: fullURL,
      headers: targetHeaders,
      data: req.body,
      timeout: 30000,
      validateStatus: () => true // Don't throw on any status code
    });
    
    // Set CORS headers
    res.set({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-Target-URL'
    });
    
    // Forward the response
    res.status(response.status).json(response.data);
    
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: 'Proxy error occurred', 
      details: error.message,
      stack: error.stack 
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Express server is running' });
});

// Serve React app for all other routes (if build directory exists)
app.get('*', (req, res) => {
  const buildPath = path.join(__dirname, 'build', 'index.html');
  if (require('fs').existsSync(buildPath)) {
    res.sendFile(buildPath);
  } else {
    res.json({ 
      message: 'Backend server is running', 
      status: 'OK',
      note: 'Frontend build not found. Please run "npm run build" in the frontend directory.'
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Express server running on port ${PORT}`);
  console.log(`📡 Proxying ERPNext API calls dynamically based on X-Target-URL header`);
  console.log(`🌐 Access the app at: http://localhost:${PORT}`);
});
