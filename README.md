# ERPNext API Testing Tool

A Postman-like web application for testing ERPNext APIs with a clean separation between frontend and backend.

## Project Structure

```
├── frontend/          # React frontend application
│   ├── src/          # React source code
│   ├── public/       # Static assets
│   ├── build/        # Production build
│   └── package.json  # Frontend dependencies
├── backend/          # Express.js backend server
│   ├── server.js     # Main server file
│   ├── setup.sh      # Setup script
│   └── package.json  # Backend dependencies
└── package.json      # Root package for running both
```

## Quick Start

### Option 1: Run Both Together (Recommended)
```bash
npm install
npm run dev
```

### Option 2: Run Separately

**Frontend only:**
```bash
cd frontend
npm install
npm start
```

**Backend only:**
```bash
cd backend
npm install
npm start
```

## Features

- 🔧 **Request Builder**: Build and test API requests
- 📝 **Record Selection**: Select specific records for PUT/DELETE operations
- 📊 **Dashboard**: Overview and quick actions
- 🔍 **JSON Editor**: Edit request/response data
- 📡 **Response Viewer**: View API responses
- 🗑️ **Delete Operations**: Safe record deletion with selection

## Development

- **Frontend**: React 18 with modern hooks
- **Backend**: Express.js with CORS proxy
- **Styling**: Custom CSS with modern design
- **API Client**: Axios for HTTP requests

## Access

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001
- **Combined**: http://localhost:3000 (with proxy to backend)