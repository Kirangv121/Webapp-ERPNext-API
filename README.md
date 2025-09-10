# 🚀 ERPNext API Testing Tool

A comprehensive, Postman-like web application for testing ERPNext APIs with advanced features, real-time cURL export, and seamless deployment capabilities.

## ✨ Features

### 🔧 **Core API Testing**
- **HTTP Methods**: GET, POST, PUT, DELETE support
- **Dynamic Endpoint Selection**: Choose from 100+ ERPNext doctypes
- **Custom Endpoints**: Support for custom API endpoints
- **Real-time Request Building**: Intuitive form-based request construction
- **Response Visualization**: Pretty-printed JSON responses with syntax highlighting

### 🎯 **Advanced Features**
- **Select Record for DELETE**: Choose specific records to delete safely
- **Select Field to Update for PUT**: Comprehensive field selection with custom field input
- **POST Templates**: Auto-generated JSON templates for all major ERPNext doctypes
- **Dynamic cURL Export**: Real-time cURL command generation with copy-to-clipboard
- **Query Parameters**: Support for limit, filters, and custom parameters
- **Custom Headers**: Add custom HTTP headers for advanced testing

### 🔄 **Real-time Updates**
- **Live cURL Generation**: cURL commands update automatically as you modify requests
- **Dynamic URL Logging**: Backend logs actual target ERPNext URLs
- **Instant Response**: Real-time API testing with immediate feedback
- **Auto-save**: Connection details saved in browser localStorage

### 🎨 **User Experience**
- **Modern UI**: Clean, responsive design with dark/light themes
- **Intuitive Navigation**: Easy-to-use interface for all skill levels
- **Error Handling**: Comprehensive error messages with troubleshooting tips
- **Connection Management**: Save and manage multiple ERPNext instances

## 🏗️ Project Structure

```
erpnext-api-tester/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── Dashboard.js      # Main dashboard
│   │   │   ├── RequestBuilder.js # API request builder
│   │   │   ├── JsonEditor.js     # JSON editor
│   │   │   ├── JsonViewer.js     # JSON viewer
│   │   │   ├── Navigation.js     # Navigation bar
│   │   │   └── ResponseViewer.js # Response display
│   │   ├── utils/
│   │   │   └── apiClient.js      # API client utilities
│   │   ├── config.js             # Configuration
│   │   └── App.js                # Main app component
│   ├── public/              # Static assets
│   ├── vercel.json          # Vercel deployment config
│   └── package.json         # Frontend dependencies
├── backend/                 # Express.js backend server
│   ├── server.js            # Main server with CORS proxy
│   ├── vercel.json          # Vercel deployment config
│   └── package.json         # Backend dependencies
├── DEPLOYMENT.md            # Comprehensive deployment guide
├── GITHUB_SETUP.md          # GitHub setup instructions
├── deploy.sh                # Automated deployment script
└── package.json             # Root package for development
```

## 🚀 Quick Start

### Prerequisites
- **Node.js**: Version 16 or higher
- **npm**: Package manager
- **ERPNext Instance**: For API testing

### Installation & Development

#### Option 1: Run Both Together (Recommended)
```bash
# Clone the repository
git clone https://github.com/Kirangv121/Webapp-ERPNext-API.git
cd Webapp-ERPNext-API

# Install all dependencies
npm install

# Start both frontend and backend
npm run dev
```

#### Option 2: Run Separately

**Frontend only:**
```bash
cd frontend
npm install
npm start
# Access at http://localhost:3000
```

**Backend only:**
```bash
cd backend
npm install
npm start
# Access at http://localhost:3001
```

### Access Points
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## 🔧 Configuration

### ERPNext Connection Setup
1. **Open the application** in your browser
2. **Enter ERPNext details**:
   - Base URL: `https://your-erpnext-instance.com`
   - API Key: Your ERPNext API key
   - API Secret: Your ERPNext API secret
3. **Test connection** to verify credentials
4. **Start testing** APIs immediately

### Environment Variables (Production)
```bash
# Frontend
REACT_APP_API_URL=https://your-backend.vercel.app

# Backend
NODE_ENV=production
```

## 🌐 Deployment

### Vercel Deployment (Recommended)

#### Quick Deploy
```bash
# Run the automated deployment script
./deploy.sh
```

#### Manual Deploy
1. **Deploy Backend**:
   - Connect to Vercel
   - Set root directory to `backend`
   - Deploy and note the URL

2. **Deploy Frontend**:
   - Connect to Vercel
   - Set root directory to `frontend`
   - Add environment variable: `REACT_APP_API_URL=your-backend-url`
   - Deploy

### Other Platforms
- **Netlify**: Frontend deployment
- **Railway**: Backend deployment
- **Heroku**: Full-stack deployment
- **Docker**: Containerized deployment

## 📚 API Testing Features

### Supported ERPNext Doctypes
- **Core**: User, Role, DocType, File, Tag
- **Stock & Inventory**: Item, Item Group, Stock Entry, Warehouse
- **Accounts**: Customer, Supplier, Sales Invoice, Purchase Invoice
- **Selling**: Quotation, Sales Order, Lead, Opportunity
- **Buying**: Supplier Quotation, Purchase Order
- **Manufacturing**: BOM, Work Order, Job Card
- **HR & Payroll**: Employee, Department, Attendance, Salary Slip
- **Projects**: Project, Task, Timesheet
- **CRM**: Campaign, Contact
- **And 100+ more...**

### Request Types
- **GET**: Retrieve records with filtering and pagination
- **POST**: Create new records with auto-generated templates
- **PUT**: Update existing records with field selection
- **DELETE**: Remove records with safe selection

### Advanced Features
- **cURL Export**: Copy requests as cURL commands
- **Template Generation**: Auto-create JSON for all doctypes
- **Field Selection**: Choose specific fields for updates
- **Custom Headers**: Add authentication and custom headers
- **Query Parameters**: Limit, offset, filters, and more

## 🛠️ Development

### Tech Stack
- **Frontend**: React 18, JavaScript, CSS3
- **Backend**: Node.js, Express.js
- **HTTP Client**: Axios
- **Proxy**: http-proxy-middleware
- **Deployment**: Vercel, Netlify

### Scripts
```bash
# Development
npm run dev              # Start both frontend and backend
npm run start:frontend   # Start frontend only
npm run start:backend    # Start backend only

# Production
npm run build:frontend   # Build frontend for production
npm run build:backend    # Build backend for production
npm run build            # Build both

# Deployment
./deploy.sh              # Automated Vercel deployment
```

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 🔒 Security

### CORS Configuration
- Backend handles CORS for ERPNext API calls
- Configurable allowed origins
- Secure credential handling

### Authentication
- API keys stored in browser localStorage
- No server-side credential storage
- Secure token-based authentication

## 📖 Documentation

- **[Deployment Guide](DEPLOYMENT.md)**: Complete Vercel deployment instructions
- **[GitHub Setup](GITHUB_SETUP.md)**: Repository setup and configuration
- **[API Reference](frontend/DOCTYPES_REFERENCE.md)**: ERPNext API documentation
- **[Troubleshooting](frontend/TROUBLESHOOTING.md)**: Common issues and solutions

## 🐛 Troubleshooting

### Common Issues
1. **CORS Errors**: Configure ERPNext to allow your domain
2. **Authentication Failed**: Check API key and secret
3. **Connection Refused**: Verify ERPNext instance URL
4. **Build Failures**: Check Node.js version and dependencies

### Getting Help
- Check the troubleshooting guide
- Review error messages in browser console
- Verify ERPNext instance configuration
- Test with a simple GET request first

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Support

- **Issues**: [GitHub Issues](https://github.com/Kirangv121/Webapp-ERPNext-API/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Kirangv121/Webapp-ERPNext-API/discussions)
- **Documentation**: Check the docs folder for detailed guides

## 🎉 Acknowledgments

- **ERPNext Community**: For the amazing open-source ERP system
- **React Team**: For the excellent frontend framework
- **Express.js**: For the robust backend framework
- **Vercel**: For seamless deployment platform

---

**Made with ❤️ for the ERPNext community**

*Test your ERPNext APIs like a pro! 🚀*