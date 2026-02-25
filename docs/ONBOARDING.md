# Onboarding Guide

Prerequisites
- Node.js 18+ recommended (repo engines specify >=12)
- Git, bash, and SQLite tooling (optional)

1) Clone and install
- git clone <repo>
- cd GadgetShack
- npm install
- npm run setup (installs scraper, backend, storefront)

2) Configure environment
- cp backend/.env.example backend/.env
- Edit backend/.env (set JWT_SECRET, BASIC_AUTH_*; set CORS_ORIGIN to include your frontend origin)
- Optionally set MARKUP_PERCENT
- Optionally configure storefront env via env or next.config.js overrides (NEXT_PUBLIC_API_URL)

3) First data import
- Option A: Run the daily refresh script
  - bash scripts/daily-refresh.sh
- Option B: Manual
  - cd scraper && npm run scrape (or run specific runner)
  - cd backend && npm run import-data

4) Start services
- In one terminal: npm run dev (starts backend:9000 and storefront:8000)
- Backend health: http://localhost:9000/health
- API index: http://localhost:9000/api
- Storefront: http://localhost:8000 (Basic Auth prompted)

5) Authentication
- Storefront Basic Auth uses BASIC_AUTH_* (defaults in next.config.js if not provided)
- API JWT
  - Register: POST /api/auth/register
  - Login: POST /api/auth/login → copy token
  - Auth header: Authorization: Bearer <token>

6) Admin tools
- Admin panel info: GET /api/admin/panel (Basic Auth)
- Trigger refresh: POST /api/admin/refresh (admin JWT)
- Status: GET /api/admin/refresh/status (admin JWT)

7) Common issues
- CORS errors: Ensure backend CORS_ORIGIN includes your frontend origin
- 401 on API: Provide Authorization: Bearer <token>
- 401 on storefront: Provide Basic Auth header matching BASIC_AUTH_*
- SQLite lock: avoid simultaneous long writes; re-run after importer completes

8) Production notes
- Set strong JWT_SECRET and BASIC_AUTH_*; never commit secrets
- Set NEXT_PUBLIC_API_URL to backend URL and update CORS_ORIGIN accordingly
- Put storefront and API behind HTTPS (reverse proxy like Nginx/Caddy)
- Use a process manager (pm2/systemd) to keep services running and schedule daily-refresh.sh via cron

