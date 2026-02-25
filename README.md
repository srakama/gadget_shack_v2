# GadgetShack South Africa - Private E-commerce Platform

A complete e-commerce solution built with custom Node.js backend, Next.js storefront, and automated product scraping from TechMarkIt.co.za (South African retailer). All prices displayed in ZAR (South African Rand).

## Project Structure

```
GadgetShack/
├── scraper/                 # Web scraper for pepcell.com
│   ├── src/
│   ├── config/
│   └── output/
├── backend/                 # Medusa.js backend
│   ├── src/
│   ├── medusa-config.js
│   └── package.json
├── storefront/             # Next.js storefront
│   ├── src/
│   ├── pages/
│   └── package.json
├── admin/                  # Medusa admin dashboard
└── shared/                 # Shared utilities and types
```

## Features

- **Web Scraping**: Automated product data extraction from pepcell.com
- **Backend**: Medusa.js 2.0 with SQLite database
- **Storefront**: Next.js with basic authentication
- **Admin**: Customized Medusa admin dashboard
- **Authentication**: Basic auth protection for private access

## Getting Started

1. **Setup Scraper**: Extract product data from pepcell.com
2. **Initialize Backend**: Set up Medusa.js with SQLite
3. **Import Data**: Load scraped products into backend
4. **Launch Storefront**: Start Next.js frontend
5. **Access Admin**: Manage products and inventory

## Configuration

The project uses a centralized configuration system defined in the project config JSON.

## Development

Each component can be developed and tested independently:

- Scraper: `cd scraper && npm run scrape`
- Backend: `cd backend && npm run dev`
- Storefront: `cd storefront && npm run dev`
- Admin: Access via backend admin panel
- Health check: visit `http://localhost:8000/status` (pings `/health` and `/api`)

## Authentication

The storefront is protected with basic authentication:
- Username: your_username
- Password: your_secure_password

## Documentation

- docs/CODEMAP.md — Monorepo overview and key components
- docs/ENVIRONMENT.md — Environment variables and configuration
- docs/SCRIPTS.md — Scripts and operational tasks
- docs/API.md — Backend API overview and endpoints
- docs/DATA_FLOW.md — End-to-end data flow (+ diagram)
- docs/ONBOARDING.md — Setup steps for new developers
- docs/RISKS_AND_NOTES.md — Important caveats and future improvements

## Data Flow

1. Scraper extracts product data → `scraper/output/*.json`
2. Import script loads data into the backend (SQLite)
3. Storefront displays products from backend API
4. Admin endpoints provide operational tools (refresh, status)
