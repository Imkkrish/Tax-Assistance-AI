# Deployment Configuration Guide

## Backend - Render

### Environment Variables Required

Log into your Render dashboard and add these environment variables for your backend service:

1. **MONGODB_URI** (Required)

   - Get from MongoDB Atlas: https://www.mongodb.com/cloud/atlas
   - Format: `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/tax-assistant`
   - Steps to get:
     1. Create free MongoDB Atlas account
     2. Create a cluster
     3. Create database user
     4. Get connection string from "Connect" button
     5. Replace `<username>`, `<password>`, and `<cluster>` with your values

2. **JWT_SECRET** (Required)

   - Generate a random secure string (32+ characters)
   - Example: Use `openssl rand -base64 32` in terminal
   - Or use: https://generate-secret.vercel.app/32

3. **FRONTEND_URL** (Required)

   ```
   https://tax-assistance-ai.vercel.app
   ```

4. **NODE_ENV** (Required)

   ```
   production
   ```

5. **Optional but Recommended**:
   - `OPENAI_API_KEY` - For AI chat features

### After Setting Environment Variables

- Render will automatically redeploy your backend
- Wait 2-3 minutes for deployment to complete

---

## Frontend - Vercel

### Environment Variables Required

Log into your Vercel project settings and add:

1. **VITE_API_BASE_URL** (Required)
   ```
   https://tax-assistance-ai-backend.onrender.com/api
   ```

### After Setting Environment Variables

1. Go to Vercel Deployments tab
2. Click "Redeploy" on the latest deployment
3. Select "Use existing Build Cache: No"
4. Click "Redeploy"

---

## Testing After Deployment

### 1. Test Backend Health

Open in browser or use curl:

```bash
https://tax-assistance-ai-backend.onrender.com/api/health
```

Should return:

```json
{
  "success": true,
  "message": "API is running",
  "timestamp": "...",
  "environment": "production"
}
```

### 2. Test Frontend

1. Open: https://tax-assistance-ai.vercel.app/
2. Try to register a new account
3. Try to login
4. Test the tax calculator

### 3. Check Browser Console

- Open browser DevTools (F12)
- Look for any errors in Console tab
- Check Network tab for failed API calls

---

## Troubleshooting

### Backend Issues

**503 Service Unavailable**

- Render free tier hibernates after inactivity
- Wait 30-60 seconds and refresh
- Service will wake up automatically

**500 Internal Server Error**

- Check MongoDB URI is correct
- Verify database user has read/write permissions
- Check Render logs for detailed error messages

**CORS Errors**

- Verify FRONTEND_URL matches your Vercel domain exactly
- Check CORS configuration in server.js

### Frontend Issues

**API calls fail / Network errors**

- Verify VITE_API_BASE_URL is set correctly in Vercel
- Check that you redeployed after adding environment variable
- Verify backend is running (test health endpoint)

**Build fails**

- Check build logs in Vercel
- Verify all dependencies are in package.json
- Check for syntax errors

---

## Quick Reference

### Backend URL

```
https://tax-assistance-ai-backend.onrender.com
```

### Frontend URL

```
https://tax-assistance-ai.vercel.app
```

### Backend Render Dashboard

https://dashboard.render.com/

### Frontend Vercel Dashboard

https://vercel.com/dashboard

### MongoDB Atlas Dashboard

https://cloud.mongodb.com/
