# GadgetShack - Render Deployment Guide

Complete guide to deploy GadgetShack to Render with PostgreSQL database.

---

## Prerequisites

1. **GitHub Account** with your GadgetShack repo pushed
2. **Render Account** (free tier works): https://render.com
3. Your repo URL: `https://github.com/srakama/gadget_shack.git`

---

## Step 1: Create PostgreSQL Database

1. Log in to Render Dashboard
2. Click **"New +"** → **"PostgreSQL"**
3. Configure:
   - **Name**: `gadgetshack-db`
   - **Database**: `gadgetshack`
   - **User**: `gadgetshack_user` (auto-generated)
   - **Region**: Choose closest to you (e.g., `Oregon (US West)`)
   - **Plan**: **Free** (or paid if you need more)
4. Click **"Create Database"**
5. **IMPORTANT**: Copy the **Internal Database URL** (starts with `postgresql://`)
   - You'll need this for the backend service

---

## Step 2: Deploy Backend API

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repo: `srakama/gadget_shack`
3. Configure:

### Basic Settings
- **Name**: `gadgetshack-backend`
- **Region**: Same as your database
- **Branch**: `main` (or your default branch)
- **Root Directory**: `backend`
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### Environment Variables

Click **"Add Environment Variable"** and add these:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `DATABASE_URL` | *Paste your PostgreSQL Internal Database URL* |
| `JWT_SECRET` | `your-random-secret-key-CHANGE-THIS-123456789` |
| `FRONTEND_URL` | `https://gadgetshack-frontend.onrender.com` *(update after creating frontend)* |
| `MARKUP_PERCENT` | `20` |

**Optional** (for payments/email):
- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `EMAIL_SERVICE` - `sendgrid`
- `EMAIL_USER` - Your email
- `EMAIL_API_KEY` - Your SendGrid/email API key
- `EMAIL_FROM` - `noreply@yourdomain.com`

4. Click **"Create Web Service"**
5. Wait for deployment (5-10 minutes)
6. Copy your backend URL: `https://gadgetshack-backend.onrender.com`

---

## Step 3: Deploy Next.js Frontend

1. Click **"New +"** → **"Web Service"**
2. Connect same GitHub repo: `srakama/gadget_shack`
3. Configure:

### Basic Settings
- **Name**: `gadgetshack-frontend`
- **Region**: Same as backend
- **Branch**: `main`
- **Root Directory**: `storefront`
- **Runtime**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

### Environment Variables

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | `https://gadgetshack-backend.onrender.com/api` |
| `NODE_ENV` | `production` |

**Optional** (OAuth):
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` - Your Google OAuth client ID
- `NEXT_PUBLIC_FACEBOOK_APP_ID` - Your Facebook app ID

4. Click **"Create Web Service"**
5. Wait for deployment
6. Copy your frontend URL: `https://gadgetshack-frontend.onrender.com`

---

## Step 4: Update Backend CORS

Now that you have your frontend URL, update the backend to allow it:

1. Open `backend/src/index.js` in your local repo
2. Find the `allowedOrigins` array (around line 51)
3. Add your Render frontend URL:

```javascript
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:8000',
  'http://127.0.0.1:8000',
  'http://127.0.0.1:3000',
  'https://gadgetshack-frontend.onrender.com'  // ← Add this
];
```

4. Commit and push:
```bash
git add backend/src/index.js
git commit -m "Add Render frontend to CORS allowedOrigins"
git push origin main
```

5. Render will auto-deploy the backend with the new CORS settings

---

## Step 5: Update Frontend URL in Backend

Go back to your **Backend service** on Render:

1. Go to **Environment** tab
2. Update `FRONTEND_URL` to: `https://gadgetshack-frontend.onrender.com`
3. Click **"Save Changes"**
4. Render will redeploy automatically

---

## Step 6: Import Initial Data

Your database is empty. You need to run the scraper and import data:

### Option A: Run Locally, Import to Render

1. **Run scraper locally**:
```bash
cd scraper
npm run scrape
```

2. **Set DATABASE_URL locally** (temporary):
```bash
export DATABASE_URL="your-render-postgres-url"
cd ../backend
npm run import-data
```

### Option B: Use Render Shell (Advanced)

1. Go to your **Backend service** → **Shell** tab
2. Run:
```bash
cd /opt/render/project/src/scraper
npm run scrape
cd ../backend
npm run import-data
```

---

## Step 7: Access Your Deployed App

1. **Frontend**: `https://gadgetshack-frontend.onrender.com`
2. **Backend API**: `https://gadgetshack-backend.onrender.com/api`
3. **Health Check**: `https://gadgetshack-backend.onrender.com/health`

### Admin Login
- Email: `admin@gadgetshack.com`
- Password: `admin123`

**⚠️ IMPORTANT**: Change the admin password after first login!

---

## Step 8: Set Up Daily Refresh (Optional)

To keep products updated, set up a cron job:

1. Go to **Backend service** → **Settings** → **Cron Jobs**
2. Add a new cron job:
   - **Name**: `Daily Product Refresh`
   - **Command**: `cd /opt/render/project/src && npm run scrape && cd backend && npm run import-data`
   - **Schedule**: `0 2 * * *` (runs at 2 AM daily)

---

## Troubleshooting

### Backend won't start
- Check **Logs** tab in Render dashboard
- Verify `DATABASE_URL` is set correctly
- Ensure PostgreSQL database is running

### Frontend can't connect to backend
- Verify `NEXT_PUBLIC_API_URL` points to your backend URL + `/api`
- Check backend CORS includes your frontend URL
- Check backend logs for CORS errors

### Database connection errors
- Ensure `DATABASE_URL` is the **Internal Database URL** (not External)
- Check PostgreSQL database is in same region as backend
- Verify database is not suspended (free tier sleeps after inactivity)

### Products not showing
- Run the data import (Step 6)
- Check backend logs for import errors
- Verify scraper ran successfully

---

## Free Tier Limitations

**Render Free Tier**:
- Services sleep after 15 minutes of inactivity
- First request after sleep takes 30-60 seconds (cold start)
- PostgreSQL database: 90 days, then expires (upgrade to paid)
- 750 hours/month free (enough for 1 service 24/7)

**Upgrade to Paid** ($7/month per service) for:
- No cold starts
- Persistent PostgreSQL
- Better performance

---

## Custom Domain (Optional)

1. Go to **Frontend service** → **Settings** → **Custom Domains**
2. Add your domain (e.g., `gadgetshack.co.za`)
3. Update DNS records as instructed by Render
4. Update `FRONTEND_URL` in backend environment variables

---

## Security Checklist

- [ ] Changed admin password from default
- [ ] Set strong `JWT_SECRET` (random 32+ characters)
- [ ] Enabled HTTPS (automatic on Render)
- [ ] Configured CORS properly
- [ ] Set up environment variables (not hardcoded)
- [ ] Database credentials secure (managed by Render)

---

## Next Steps

1. Test the deployed application
2. Set up custom domain (optional)
3. Configure payment providers (Stripe, PayFast)
4. Set up email service (SendGrid)
5. Monitor logs and performance

---

## Support

- **Render Docs**: https://render.com/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs/

---

**Deployment Complete! 🎉**

Your GadgetShack is now live on Render with PostgreSQL!
