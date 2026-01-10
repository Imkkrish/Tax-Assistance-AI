# Vercel Frontend Configuration Steps

## Step 1: Add Environment Variable in Vercel

1. Go to https://vercel.com/dashboard
2. Select your **tax-assistance-ai** project
3. Go to **Settings** → **Environment Variables**
4. Add this variable:

   **Key:** `VITE_API_BASE_URL`  
   **Value:** `https://tax-assistance-ai-backend.onrender.com/api`

   **Environment:** Select all three (Production, Preview, Development)

5. Click **Save**

## Step 2: Redeploy Frontend

1. Go to the **Deployments** tab
2. Click the **⋯** (three dots) on your latest deployment
3. Click **Redeploy**
4. **IMPORTANT:** Uncheck "Use existing Build Cache"
5. Click **Redeploy**

## Step 3: Wait & Test

- Wait 1-2 minutes for deployment
- Open: https://tax-assistance-ai.vercel.app/
- Try registering and logging in
- Test the tax calculator

---

## ✅ What We've Fixed

- ✅ MongoDB Atlas connected
- ✅ CORS configuration fixed
- ✅ Trust proxy setting added
- ✅ Backend deployed and running
- ⏳ Frontend environment variable (you're doing this now)

## 🎯 After Vercel Redeploys

Your app should be **fully working**! Both backend API calls and frontend will communicate properly.
