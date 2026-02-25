# Scripts and Operational Tasks

Root package.json
- scrape: cd scraper && npm run scrape
- import-data: cd backend && npm run import-data
- backend:dev, storefront:dev: start both services in watch mode
- dev: concurrently runs backend and storefront
- build tasks: backend:build, storefront:build

Backend (backend/package.json)
- dev: nodemon src/index.js (Express API on PORT, default 9000)
- start: node src/index.js
- import-data: node src/scripts/import-data.js
- setup-db: node src/scripts/setup-db.js
- seed: node src/scripts/seed.js

Storefront (storefront/package.json)
- dev: next dev -p 8000
- build: next build
- start: next start -p 8000

Scraper (scraper/package.json)
- scrape: node src/index.js
- dev: nodemon src/index.js
- test: node src/test.js

Daily refresh script (scripts/daily-refresh.sh)
- Purpose: Automates scraping and data import; logs to logs/daily-refresh-YYYY-MM-DD.log
- Behavior: incremental by default; runs full refresh on Sundays or when FORCE_FULL=1
- Steps:
  1) cd scraper && node run-shopify-scraper.js [--full]
  2) cd backend && npm run import-data
- Usage examples:
  - bash scripts/daily-refresh.sh
  - FORCE_FULL=1 bash scripts/daily-refresh.sh

Common local workflows
- Bootstrap deps: npm run setup (installs workspace deps)
- Dev both services: npm run dev
- Import latest data: npm run import-data (after scraping)
- Start only backend: npm run backend:dev
- Start only storefront: npm run storefront:dev

