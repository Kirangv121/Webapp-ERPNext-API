#!/bin/bash

# ERPNext API Tester - Vercel Deployment Script
# This script helps prepare and deploy the application to Vercel

echo "🚀 ERPNext API Tester - Vercel Deployment Helper"
echo "================================================"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please log in to Vercel:"
    vercel login
fi

echo ""
echo "📋 Deployment Options:"
echo "1. Deploy Backend only"
echo "2. Deploy Frontend only"
echo "3. Deploy Both (recommended)"
echo "4. Show deployment status"
echo "5. Exit"

read -p "Choose an option (1-5): " choice

case $choice in
    1)
        echo "🏗️  Deploying Backend..."
        cd backend
        vercel --prod
        echo "✅ Backend deployed! Note the URL for frontend configuration."
        ;;
    2)
        echo "🎨 Deploying Frontend..."
        cd frontend
        vercel --prod
        echo "✅ Frontend deployed! Don't forget to set REACT_APP_API_URL environment variable."
        ;;
    3)
        echo "🚀 Deploying Both Frontend and Backend..."
        
        echo "🏗️  Deploying Backend first..."
        cd backend
        BACKEND_URL=$(vercel --prod --yes | grep -o 'https://[^[:space:]]*')
        echo "✅ Backend deployed: $BACKEND_URL"
        
        echo "🎨 Deploying Frontend..."
        cd ../frontend
        echo "Setting REACT_APP_API_URL to: $BACKEND_URL"
        vercel env add REACT_APP_API_URL production
        echo "$BACKEND_URL" | vercel env add REACT_APP_API_URL production
        vercel --prod
        echo "✅ Frontend deployed!"
        ;;
    4)
        echo "📊 Checking deployment status..."
        vercel ls
        ;;
    5)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid option. Please choose 1-5."
        exit 1
        ;;
esac

echo ""
echo "🎉 Deployment process completed!"
echo ""
echo "📝 Next Steps:"
echo "1. Test your deployed application"
echo "2. Configure CORS in your ERPNext instance"
echo "3. Set up custom domain (optional)"
echo ""
echo "📚 For detailed instructions, see DEPLOYMENT.md"
