# Render Deployment Troubleshooting

## 404 Error: "Endpoint not found"

### Quick Diagnostic Steps

1. **Check Render Logs** (Most Important!)
   - Go to your backend service on Render
   - Click **"Logs"** tab
   - Look for:
     - ✅ "Connected to PostgreSQL database" or "Connected to SQLite database"
     - ✅ "Server running on http://localhost:10000"
     - ❌ Any error messages about database connection
     - ❌ "Cannot find module" errors

2. **Verify Service Settings**
   - Go to backend service → **Settings** → **Build & Deploy**
   - Check these settings:

   ```
   Root Directory: backend
   Build Command: npm install
   Start Command: npm start
   ```

3. **Test These URLs** (replace with your actual URL)
   - ✅ Should work: `https://your-backend.onrender.com/health`
   - ✅ Should work: `https://your-backend.onrender.com/api`
   - ✅ Should work: `https://your-backend.onrender.com/api/products`
   - ❌ Will 404: `https://your-backend.onrender.com/` (root has no route)

---

## Common Problems & Solutions

### Problem 1: Database Connection Error

**Symptoms:**
- Logs show: "Database initialization failed"
- Service crashes on startup

**Solution:**
1. Verify `DATABASE_URL` is set in Environment Variables
2. Use the **Internal Database URL** (not External)
3. Format: `postgresql://user:password@host:5432/database`

### Problem 2: Wrong Root Directory

**Symptoms:**
- Logs show: "Cannot find package.json"
- Build fails

**Solution:**
1. Go to Settings → Build & Deploy
2. Set **Root Directory** to: `backend`
3. Trigger manual deploy

### Problem 3: Missing Dependencies

**Symptoms:**
- Logs show: "Cannot find module 'pg'"
- App crashes after build

**Solution:**
Ensure `backend/package.json` has `pg`:
```json
"dependencies": {
  "pg": "^8.11.3"
}
```

Run locally:
```bash
cd backend
npm install pg --save
git add package.json package-lock.json
git commit -m "Add pg dependency"
git push
```

### Problem 4: Port Configuration

**Symptoms:**
- Service starts but doesn't respond
- Logs show listening on wrong port

**Solution:**
1. Render automatically sets `PORT` environment variable
2. Your code uses: `const PORT = process.env.PORT || 9000;`
3. Add environment variable: `PORT=10000` (Render's default)

### Problem 5: CORS Blocking Frontend

**Symptoms:**
- Frontend shows errors in browser console
- Backend logs show "CORS blocked origin"

**Solution:**
Update `backend/src/index.js` CORS config:
```javascript
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:8000',
  'https://your-frontend.onrender.com'  // Add this
];
```

---

## Verification Checklist

Before asking for help, verify:

- [ ] Backend service shows "Live" status (green)
- [ ] Logs show "Server running on http://localhost:10000"
- [ ] Logs show database connection success
- [ ] Environment variable `DATABASE_URL` is set
- [ ] Root Directory is set to `backend`
- [ ] `/health` endpoint returns 200 OK
- [ ] `/api` endpoint returns API info JSON

---

## How to Check Logs

1. Go to Render Dashboard
2. Click on your backend service
3. Click **"Logs"** tab
4. Look for startup messages:

**Good logs:**
```
📦 Using SQLite database
✅ Connected to SQLite database
✅ Database tables created successfully
✅ Server running on http://localhost:10000
```

**Or with PostgreSQL:**
```
🐘 Using PostgreSQL database
✅ Connected to PostgreSQL database
✅ Database tables created successfully
✅ Server running on http://localhost:10000
```

**Bad logs:**
```
❌ Failed to start server: Error: ...
Database initialization failed
Cannot find module 'pg'
```

---

## Manual Deploy

If auto-deploy isn't working:

1. Go to backend service
2. Click **"Manual Deploy"** → **"Deploy latest commit"**
3. Watch the logs during deployment

---

## Test Endpoints

Once deployed, test these in order:

```bash
# 1. Health check (should return 200)
curl https://your-backend.onrender.com/health

# 2. API info (should return JSON with endpoints)
curl https://your-backend.onrender.com/api

# 3. Products (might be empty if no data imported)
curl https://your-backend.onrender.com/api/products

# 4. Categories
curl https://your-backend.onrender.com/api/categories
```

---

## Still Getting 404?

Share these details:
1. Full URL you're accessing
2. Last 50 lines of Render logs
3. Environment variables (without sensitive values)
4. Root Directory setting
5. Build/Start commands

---

## Quick Fix: Redeploy

Sometimes a fresh deploy fixes issues:

1. Go to backend service
2. Click **"Manual Deploy"**
3. Select **"Clear build cache & deploy"**
4. Wait for deployment to complete
