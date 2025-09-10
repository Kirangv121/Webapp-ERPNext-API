# Troubleshooting Guide

## Common Network Errors and Solutions

### 1. "Network error: Cannot connect to [URL]"

**Possible Causes:**
- Incorrect base URL format
- ERPNext server not running
- CORS not configured
- Firewall blocking connection

**Solutions:**
1. **Check Base URL Format:**
   - Use: `https://your-erpnext-instance.com`
   - Don't use: `your-erpnext-instance.com` (missing protocol)
   - Don't use: `https://your-erpnext-instance.com/` (trailing slash)

2. **Test with Demo Instance:**
   - Try: `https://demo.erpnext.com`
   - This helps verify if the app is working

3. **Check ERPNext Server:**
   - Make sure ERPNext is running
   - Check if you can access it in browser
   - Verify the port (usually 8000 for local, 443 for HTTPS)

### 2. "Authentication failed: Please check your API Key and Secret"

**Solutions:**
1. **Generate New API Credentials:**
   - Go to ERPNext → Settings → Users
   - Select your user
   - Generate new API Key and Secret
   - Copy both values exactly

2. **Check User Permissions:**
   - Ensure user has API access enabled
   - Check if user has necessary doctype permissions

### 3. "API endpoint not found"

**Solutions:**
1. **Check ERPNext Version:**
   - Ensure you're using a supported ERPNext version
   - Some older versions may not have all API endpoints

2. **Verify API Endpoints:**
   - Test: `{baseURL}/api/method/frappe.auth.get_logged_user`
   - Should return user information if working

### 4. CORS Issues

**If you're getting CORS errors in browser console:**

1. **Enable CORS in ERPNext:**
   ```python
   # In site_config.json
   {
     "cors": {
       "allow_origins": ["http://localhost:3000", "https://your-domain.com"]
     }
   }
   ```

2. **Or use ERPNext's CORS settings:**
   - Go to ERPNext → Settings → System Settings
   - Add your domain to allowed origins

### 5. Testing Your Setup

**Step-by-step test:**

1. **Test Base URL:**
   - Open: `{baseURL}/api/method/frappe.auth.get_logged_user`
   - Should show authentication error (not 404)

2. **Test with API Key:**
   - Add header: `Authorization: token {apiKey}:{apiSecret}`
   - Should return user data

3. **Test Doctypes Endpoint:**
   - Open: `{baseURL}/api/method/frappe.desk.doctype.data_import_tool.data_import_tool.get_doctypes`
   - Should return list of doctypes

### 6. Common Base URL Examples

**Local Development:**
- `http://localhost:8000`
- `http://127.0.0.1:8000`

**Demo Instance:**
- `https://demo.erpnext.com`

**Production:**
- `https://your-erpnext-instance.com`
- `https://erpnext.yourdomain.com`

### 7. Browser Console Debugging

**Check browser console for errors:**
1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for network errors or CORS errors
4. Check the Network tab to see actual requests being made

**Common console errors:**
- `CORS policy: No 'Access-Control-Allow-Origin'` → CORS issue
- `ERR_CONNECTION_REFUSED` → Server not running
- `ERR_NAME_NOT_RESOLVED` → Wrong URL
- `401 Unauthorized` → Wrong API credentials

### 8. Still Having Issues?

**Try these steps:**
1. Use the demo instance first: `https://demo.erpnext.com`
2. Check if your ERPNext version supports the API endpoints
3. Verify your internet connection
4. Try a different browser
5. Check ERPNext logs for server-side errors

**Demo Credentials (if available):**
- Some demo instances have public API access
- Check ERPNext documentation for demo credentials
