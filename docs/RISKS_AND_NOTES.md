# Risks, Caveats, and Notes

Security
- Storefront is protected via Basic Auth; ensure strong BASIC_AUTH_* in prod and prefer proper auth for end users if making public
- JWT_SECRET must be rotated and kept secret; tokens expire after 24h
- Admin endpoints require role=admin via JWT; /api/admin/panel uses Basic Auth only for informational welcome

Data & Pricing
- Public prices are computed by adding MARKUP_PERCENT (default 20%) in the products route, not stored in DB
- Importer must normalize images (JSON array), sizes/colors (CSV)
- Orders decrement stock; ensure importer sets accurate initial stock

Operational
- daily-refresh.sh logs to logs/; review /api/admin/refresh/status and log tail for diagnostics
- Full refresh triggered on Sundays or FORCE_FULL=1
- SQLite is simple to manage but single-writer; consider moving to Postgres/MySQL if concurrency grows

Compatibility & Versions
- Next.js 12 and Node engines >=12 in package files; recommend Node 18+ LTS for security and features
- Image domains in next.config.js should include any production CDN/host
- CORS_ORIGIN must include production storefront origin

Maintainability
- Route duplication exists in auth/profile handlers; consider consolidating to a single GET/PUT pair
- admin/routes has some mixed ordering; consider tidying and adding tests

Future improvements
- Replace Basic Auth with real user auth for storefront access or IP allowlist for private staging
- Swagger/OpenAPI for backend; auto-gen docs and client
- Add integration tests for import pipeline and API
- Structured logging (pino/winston) and request IDs

