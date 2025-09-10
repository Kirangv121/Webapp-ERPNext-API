# 🚀 Vercel Deployment Guide for ERPNext API Tester

This guide will help you deploy the ERPNext API Tester to Vercel as two separate projects (frontend and backend).

## 📋 Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Push your code to GitHub
3. **Node.js**: Version 16+ (for local testing)

## 🏗️ Project Structure

```
erpnext-api-tester/
├── frontend/          # React frontend
│   ├── vercel.json   # Vercel config for frontend
│   └── ...
├── backend/           # Express backend
│   ├── vercel.json   # Vercel config for backend
│   └── ...
└── DEPLOYMENT.md     # This file
```

## 🚀 Deployment Steps

### Step 1: Deploy Backend to Vercel

1. **Go to Vercel Dashboard**
   - Visit [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"

2. **Import Backend Repository**
   - Select your GitHub repository
   - Choose "backend" as the root directory
   - Click "Deploy"

3. **Configure Backend Settings**
   - **Framework Preset**: Other
   - **Root Directory**: `backend`
   - **Build Command**: (leave empty)
   - **Output Directory**: (leave empty)

4. **Deploy Backend**
   - Click "Deploy"
   - Wait for deployment to complete
   - Note the deployment URL (e.g., `https://your-backend.vercel.app`)

### Step 2: Deploy Frontend to Vercel

1. **Create New Project**
   - Go to Vercel Dashboard
   - Click "New Project"
   - Select the same GitHub repository

2. **Configure Frontend Settings**
   - **Framework Preset**: Create React App
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

3. **Set Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add: `REACT_APP_API_URL` = `https://your-backend.vercel.app`
   - Click "Save"

4. **Deploy Frontend**
   - Click "Deploy"
   - Wait for deployment to complete
   - Note the deployment URL (e.g., `https://your-frontend.vercel.app`)

### Step 3: Update Backend URL in Frontend

1. **Update Environment Variable**
   - Go to Frontend Project Settings
   - Update `REACT_APP_API_URL` with your actual backend URL
   - Redeploy if necessary

## 🔧 Configuration Files

### Frontend (`frontend/vercel.json`)
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "routes": [
    {
      "src": "/static/(.*)",
      "dest": "/static/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "REACT_APP_API_URL": "@react_app_api_url"
  }
}
```

### Backend (`backend/vercel.json`)
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/server.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

## 🌐 Environment Variables

### Frontend Environment Variables
- `REACT_APP_API_URL`: Your backend Vercel URL

### Backend Environment Variables
- `NODE_ENV`: production (automatically set by Vercel)

## 🔄 Automatic Deployments

Once deployed, Vercel will automatically redeploy when you push changes to your GitHub repository:

- **Frontend**: Redeploys when you push to `main` branch
- **Backend**: Redeploys when you push to `main` branch

## 🧪 Testing Deployment

1. **Test Backend**
   ```bash
   curl https://your-backend.vercel.app/health
   ```

2. **Test Frontend**
   - Visit your frontend URL
   - Try connecting to an ERPNext instance
   - Test API requests

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure your ERPNext instance allows CORS from your Vercel domain
   - Add your Vercel domain to ERPNext's CORS settings

2. **Environment Variables Not Working**
   - Check that variables are set in Vercel dashboard
   - Redeploy after adding new variables

3. **Build Failures**
   - Check Vercel build logs
   - Ensure all dependencies are in package.json

4. **API Calls Failing**
   - Verify backend URL is correct in frontend environment variables
   - Check backend logs in Vercel dashboard

### Debugging Steps

1. **Check Vercel Logs**
   - Go to your project dashboard
   - Click on "Functions" tab
   - View logs for errors

2. **Test Backend Directly**
   ```bash
   curl -X GET https://your-backend.vercel.app/health
   ```

3. **Check Frontend Console**
   - Open browser developer tools
   - Look for network errors or console errors

## 📝 Custom Domain (Optional)

1. **Add Custom Domain**
   - Go to Project Settings → Domains
   - Add your custom domain
   - Configure DNS as instructed

2. **Update Environment Variables**
   - Update `REACT_APP_API_URL` if using custom domain for backend

## 🔒 Security Considerations

1. **API Keys**
   - Never commit API keys to repository
   - Use Vercel environment variables for sensitive data

2. **CORS Configuration**
   - Configure ERPNext to only allow your Vercel domains
   - Avoid using wildcard (*) for production

3. **Rate Limiting**
   - Consider implementing rate limiting in backend
   - Monitor API usage in Vercel dashboard

## 📊 Monitoring

1. **Vercel Analytics**
   - Enable Vercel Analytics for usage insights
   - Monitor performance metrics

2. **Error Tracking**
   - Check Vercel function logs regularly
   - Set up error monitoring if needed

## 🎉 Success!

Once deployed, you'll have:
- **Frontend**: `https://your-frontend.vercel.app`
- **Backend**: `https://your-backend.vercel.app`
- **Automatic Deployments**: On every Git push
- **Global CDN**: Fast loading worldwide

Your ERPNext API Tester is now live and ready to use! 🚀
