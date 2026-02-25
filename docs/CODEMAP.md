# GadgetShack Code Map

This repository is a Node.js monorepo with three workspaces and supporting scripts.

Monorepo layout
- scraper/ – Node scraper (axios + cheerio). Entrypoint: src/index.js. Produces product JSON consumed by backend importer.
- backend/ – Express + SQLite API. Entrypoint: src/index.js. Routes under src/routes.
- storefront/ – Next.js 12 storefront. Entrypoint: next. Uses middleware.js for Basic Auth.
- scripts/ – Operational scripts (e.g., daily-refresh.sh).
- docs/ – Developer docs (this directory).

Key technologies
- Node 18+ recommended (engines specify >=12 but modern LTS is preferable)
- Express, sqlite3, JWT (bcryptjs), CORS, Helmet, rate limiting
- Next.js 12, React 18
- Cheerio for scraping

Entry points
- backend/src/index.js – starts API on PORT (default 9000)
- scraper/src/index.js – main scraper (run via npm run scrape)
- storefront – next dev/start (port 8000 by scripts)

Important files
- backend/.env.example – backend env template
- storefront/next.config.js – public env and headers
- storefront/middleware.js – site-wide Basic Auth
- scripts/daily-refresh.sh – scrape → import pipeline with logs

Data and storage
- SQLite DB at backend/data/gadgetshack.db (created automatically)
- Scraped outputs produced in scraper/output/ (naming depends on scraper)

API surface (high level)
- /api/auth – register, login, profile, change-password
- /api/products – list, get by id, get by sku, CRUD (admin)
- /api/categories – list, get by id, CRUD (admin)
- /api/orders – list user orders, get order, create order, update status (admin)
- /api/admin – stats, orders, users, admin panel, refresh controls

Auth
- JWT Bearer for API routes requiring auth
- Basic Auth for storefront and admin/panel convenience endpoint

Notes
- Public product prices have an environment-configurable markup (MARKUP_PERCENT, default 20%) applied by the products route.
- CORS and security headers configured via Helmet and CORS.

