# Configuration Guide

## Environment Variables

Create a `.env` file in the root directory to configure the application:

```bash
# ERPNext API Base URL (leave empty for same domain)
REACT_APP_API_BASE_URL=

# Example for different domain:
# REACT_APP_API_BASE_URL=https://your-erpnext-instance.com
```

## ERPNext Setup

1. **Enable API Access**: Make sure your ERPNext instance has API access enabled
2. **Create API Credentials**: 
   - Go to ERPNext → Settings → Users
   - Select your user or create a new API user
   - Generate API Key and API Secret
3. **CORS Configuration**: If running on a different domain, configure CORS in ERPNext
4. **Base URL Examples**:
   - Local development: `http://localhost:8000`
   - Production: `https://your-erpnext-instance.com`
   - Demo: `https://demo.erpnext.com`

## Usage

1. Start the application: `npm start`
2. Open http://localhost:3000 in your browser
3. Enter your ERPNext API credentials
4. Start testing APIs!

## Features

- **Simplified Doctype Input**: Just enter "Customer" instead of full URLs
- **Auto-generated URLs**: URLs are built as `/api/resource/{doctype}`
- **Recent Requests**: Your requests are saved locally
- **Error Handling**: Clear error messages for common issues
- **JSON Viewer**: Expandable JSON response viewer with copy functionality
