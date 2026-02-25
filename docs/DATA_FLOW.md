# Data Flow

Overview
- Source: TechMarkIt/pepcell via scraper
- Pipeline: Scraper → JSON outputs → Backend importer → SQLite DB → API → Storefront

Scraper outputs
- scraper/output/techmarkit_products.json
- scraper/output/pepcell_products.json
- scraper/output/game_products.json (example)

Import process
1) Run scripts/daily-refresh.sh (or POST /api/admin/refresh as admin)
2) Script runs node run-shopify-scraper.js [--full]
3) Backend: npm run import-data → parses outputs and upserts into SQLite
4) Storefront reads via NEXT_PUBLIC_API_URL

Backend transformations
- Products table includes images (JSON array), sizes/colors (comma-separated)
- Public prices have markup applied on the fly (MARKUP_PERCENT env; default 20%)
- Orders update product stock quantities

Storefront consumption
- Uses storefront/lib/api.js against NEXT_PUBLIC_API_URL
- Next.js middleware enforces Basic Auth for private access

Logs and status
- logs/daily-refresh-YYYY-MM-DD.log captures daily run
- /api/admin/refresh/status summarizes last run and timestamps
- /api/admin/refresh/log-tail returns last ~50 log lines

Diagram (conceptual)
- Scraper → output/*.json → Importer → SQLite → Express API → Next.js Storefront



```mermaid
flowchart LR
  A[Scraper]
  A -->|JSON outputs| B[Output files\noutput/*.json]
  B --> C[Importer\n(npm run import-data)]
  C --> D[(SQLite DB)]
  D --> E[Express API\n/api]
  E --> F[Next.js Storefront]
  subgraph Ops
    G[Daily Refresh Script]
    G --> A
    G --> C
  end
```
