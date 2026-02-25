# Deployment Checklist

Pre-deploy
- [ ] Confirm Node LTS on host (>=18)
- [ ] Configure envs:
  - Backend: PORT, JWT_SECRET, CORS_ORIGIN, BASIC_AUTH_*, DB_PATH (optional)
  - Storefront: NEXT_PUBLIC_API_URL, BASIC_AUTH_*
- [ ] Ensure image domains in storefront/next.config.js include your production assets/CDN
- [ ] Provision process manager (pm2 or systemd) for backend and storefront
- [ ] Set up reverse proxy (Nginx/Caddy) with HTTPS and forwarding to ports
- [ ] Database path writable, backups scheduled if not ephemeral

Deploy
- [ ] Install dependencies in each workspace (npm ci)
- [ ] Build storefront (next build) and start (next start) behind proxy
- [ ] Start backend (node src/index.js) behind proxy
- [ ] Set up cron for scripts/daily-refresh.sh (e.g., 2:30am local)
- [ ] Verify health: /health, /api, storefront home, /status

Post-deploy
- [ ] Rotate secrets and store them securely
- [ ] Monitor logs (tail -f, structured logs planned)
- [ ] Verify CORS behavior from storefront to backend
- [ ] Check Basic Auth works where expected
- [ ] Run smoke tests: register/login, list products, place a test order (if desired)

