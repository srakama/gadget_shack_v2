# Environment and Configuration

Backend (.env in backend/)
- PORT: default 9000
- NODE_ENV: development | production
- JWT_SECRET: secret for signing JWTs (change in production)
- CORS_ORIGIN: CSV of allowed origins (defaults include http://localhost:3000 and :8000)
- BASIC_AUTH_USERNAME, BASIC_AUTH_PASSWORD: used by backend basicAuth (admin/panel) and storefront middleware defaults
- Optional: DB_PATH to override SQLite path (default backend/data/gadgetshack.db)
- Optional: MARKUP_PERCENT to adjust public product price markup (default 20)

Storefront
- NEXT_PUBLIC_API_URL: API base (default http://localhost:9000/api)
- BASIC_AUTH_USERNAME, BASIC_AUTH_PASSWORD: used by middleware.js for site Basic Auth
- Runs on port 8000 by default via scripts

Scraper
- Uses dotenv; see scraper/.env if present for source-specific settings.

Where used
- Backend reads .env via dotenv at startup (src/index.js, middleware/auth.js)
- Storefront reads env via next.config.js and middleware.js

Production considerations
- Never commit real secrets. Keep .env files out of VCS.
- Set NEXT_PUBLIC_API_URL to your deployed backend URL (e.g., https://api.example.com/api) and ensure CORS_ORIGIN includes the storefront origin.
- Rotate JWT_SECRET and Basic Auth credentials.
- Behind a reverse proxy, ensure HTTPS termination and correct forwarded headers.

