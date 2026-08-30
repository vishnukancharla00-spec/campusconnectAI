# CampusConnect Backend Deployment Guide

## 🚀 Deploy to Render.com in 3 Steps

### **Step 1: Create Render Account**
1. Go to https://render.com
2. Sign up with GitHub

### **Step 2: Create New Web Service**
1. Dashboard → New → Web Service
2. Select: `vishnukancharla00-spec/campusconnectAI`
3. Fill in:
   - **Name:** `campusconnect-api`
   - **Environment:** Python 3
   - **Build Command:** `pip install -r backend/requirements.txt`
   - **Start Command:** `cd backend && python run.py`
   - **Instance Type:** Free

4. Click **Create Web Service**

### **Step 3: Get Your Backend URL**
Once deployed, you'll see:
```
https://campusconnect-api.onrender.com
```

---

## 🔗 Connect Backend to Vercel Frontend

1. Go to **Vercel Dashboard**
2. Select your project
3. **Settings** → **Environment Variables**
4. Add variable:
   ```
   Key: VITE_API_URL
   Value: https://campusconnect-api.onrender.com
   ```
5. Click **Save** and **Redeploy**

---

## ✅ Test Login

Go to: https://frontend-alpha-five-29.vercel.app/

Login with:
```
Username: faculty_cse
Password: password123
```

**It should work now!** 🎉

---

## 📝 Troubleshooting

**Backend shows "Build Failed"?**
- Check if `backend/requirements.txt` exists
- Verify all Python packages can be installed

**Frontend still shows "Login failed"?**
- Hard refresh: `Ctrl + Shift + R`
- Wait 2-3 minutes for Render to fully deploy
- Check browser console (F12) for the exact error

**Need to update backend code?**
- Push changes to GitHub
- Render auto-deploys!
