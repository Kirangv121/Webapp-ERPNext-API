# 🔧 GitHub Setup Guide for New Account

This guide will help you set up the ERPNext API Tester repository with your new GitHub account.

## ✅ **Previous Connections Removed**

All previous GitHub connections have been successfully removed:
- ❌ Old remote origin removed
- ❌ Git user configuration cleared
- ❌ Stored credentials removed
- ❌ Repository history reset
- ✅ Fresh Git repository initialized

## 🚀 **Setup Steps for New GitHub Account**

### **Step 1: Configure Git with New Account**

```bash
# Set your new GitHub username and email
git config --global user.name "Your-New-Username"
git config --global user.email "your-new-email@example.com"

# Verify configuration
git config --global --list
```

### **Step 2: Create New GitHub Repository**

1. **Go to GitHub.com**
   - Sign in with your new account
   - Click the "+" icon → "New repository"

2. **Repository Settings**
   - **Repository name**: `erpnext-api-tester` (or your preferred name)
   - **Description**: `ERPNext API Testing Tool with Vercel Deployment`
   - **Visibility**: Public or Private (your choice)
   - **Initialize**: ❌ Don't initialize with README, .gitignore, or license
   - Click "Create repository"

### **Step 3: Connect Local Repository to GitHub**

```bash
# Add your new GitHub repository as origin
git remote add origin https://github.com/Your-New-Username/erpnext-api-tester.git

# Verify the connection
git remote -v

# Push your code to GitHub
git push -u origin main
```

### **Step 4: Verify Upload**

1. **Check GitHub Repository**
   - Visit your new repository on GitHub
   - Verify all files are uploaded
   - Check that the structure looks correct

2. **Test Clone (Optional)**
   ```bash
   # Test cloning in a different directory
   cd /tmp
   git clone https://github.com/Your-New-Username/erpnext-api-tester.git
   cd erpnext-api-tester
   ls -la
   ```

## 🔐 **Authentication Methods**

### **Option 1: Personal Access Token (Recommended)**

1. **Create Personal Access Token**
   - Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Click "Generate new token (classic)"
   - Select scopes: `repo`, `workflow`, `write:packages`
   - Copy the token (save it securely!)

2. **Use Token for Authentication**
   ```bash
   # When prompted for password, use your token instead
   git push -u origin main
   # Username: Your-New-Username
   # Password: your-personal-access-token
   ```

### **Option 2: SSH Key (Alternative)**

1. **Generate SSH Key**
   ```bash
   ssh-keygen -t ed25519 -C "your-new-email@example.com"
   # Press Enter for default location
   # Optionally set a passphrase
   ```

2. **Add SSH Key to GitHub**
   ```bash
   # Copy public key
   cat ~/.ssh/id_ed25519.pub
   ```
   - Go to GitHub → Settings → SSH and GPG keys
   - Click "New SSH key"
   - Paste the public key
   - Click "Add SSH key"

3. **Update Remote URL to SSH**
   ```bash
   git remote set-url origin git@github.com:Your-New-Username/erpnext-api-tester.git
   git push -u origin main
   ```

## 📁 **Repository Structure**

Your repository should contain:

```
erpnext-api-tester/
├── frontend/                 # React frontend
│   ├── vercel.json          # Vercel config
│   ├── package.json         # Frontend dependencies
│   └── src/                 # Source code
├── backend/                 # Express backend
│   ├── vercel.json          # Vercel config
│   ├── package.json         # Backend dependencies
│   └── server.js            # Server code
├── .gitignore              # Git ignore rules
├── DEPLOYMENT.md           # Vercel deployment guide
├── GITHUB_SETUP.md         # This file
├── deploy.sh               # Deployment script
└── package.json            # Root package.json
```

## 🚀 **Next Steps After GitHub Setup**

### **1. Deploy to Vercel**
```bash
# Run the deployment script
./deploy.sh

# Or follow manual steps in DEPLOYMENT.md
```

### **2. Configure Vercel with New Repository**
- Connect Vercel to your new GitHub repository
- Deploy both frontend and backend
- Set environment variables

### **3. Test Deployment**
- Verify both applications work
- Test API connections
- Check CORS configuration

## 🔧 **Troubleshooting**

### **Common Issues:**

1. **Authentication Failed**
   ```bash
   # Clear any cached credentials
   git config --global --unset credential.helper
   # Try again with token
   ```

2. **Permission Denied**
   - Check repository permissions
   - Verify token has correct scopes
   - Ensure repository exists

3. **Push Rejected**
   ```bash
   # Force push if needed (be careful!)
   git push -f origin main
   ```

### **Verify Everything is Clean:**

```bash
# Check no old remotes
git remote -v

# Check no old user config
git config --list | grep user

# Check clean working directory
git status
```

## ✅ **Success Checklist**

- [ ] New GitHub account configured
- [ ] Git user settings updated
- [ ] Repository created on GitHub
- [ ] Local repository connected to GitHub
- [ ] Code pushed successfully
- [ ] Repository structure verified
- [ ] Ready for Vercel deployment

## 🎉 **You're Ready!**

Your repository is now completely clean and ready for your new GitHub account. Follow the steps above to connect it to your new account and deploy to Vercel!

**Need help?** Check the troubleshooting section or refer to `DEPLOYMENT.md` for Vercel deployment instructions.
