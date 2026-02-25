---
description: Repository Information Overview
alwaysApply: true
---

# GadgetShack Repository Information

## Repository Summary
GadgetShack is a complete e-commerce platform for South Africa built as a monorepo with Node.js. It features an automated product scraper, Express.js backend API, Next.js storefront, and PostgreSQL/Redis infrastructure. The platform supports basic authentication, order management, product catalogs, and admin operations with full Docker containerization.

## Repository Structure
The project uses npm workspaces with three main components:
- **backend/**: Express.js REST API with SQLite/PostgreSQL support
- **storefront/**: Next.js React frontend with e-commerce features
- **scraper/**: Automated product data extraction utility
- **database/**: Migration and initialization scripts
- **nginx/**: Reverse proxy configuration
- **monitoring/**: Prometheus metrics configuration
- **docs/**: Comprehensive documentation and guides
- **scripts/**: Deployment and operational shell scripts

### Main Repository Components
- **Backend API**: Express.js server handling orders, products, categories, and authentication
- **Storefront**: Next.js application with responsive UI, cart management, checkout, and user accounts
- **Product Scraper**: Node.js web scraper extracting products from TechMarkIt, Pepcell, and GameShop
- **Infrastructure**: Docker services for PostgreSQL, Redis, and application containers
- **Documentation**: Setup guides, API documentation, deployment procedures, and architecture diagrams

## Projects

### Backend API
**Configuration File**: `backend/package.json`

#### Language & Runtime
**Language**: JavaScript (Node.js)
**Runtime**: Node.js >=12.0.0
**Build System**: npm scripts
**Package Manager**: npm

#### Dependencies
**Main Dependencies**:
- express (^4.18.2) - Web framework
- sqlite3 (^5.1.6) - SQLite database driver
- pg (^8.16.3) - PostgreSQL driver
- redis (^5.8.1) - Redis client
- jsonwebtoken (^8.5.1) - JWT authentication
- bcrypt/bcryptjs (^6.0.0, ^2.4.3) - Password hashing
- express-validator (^7.2.1) - Input validation
- express-rate-limit (^6.11.2) - Rate limiting
- helmet (^6.2.0) - Security headers
- cors (^2.8.5) - CORS middleware
- compression (^1.8.1) - Response compression
- nodemailer (^7.0.5) - Email service
- multer (^1.4.5) - File upload handling
- uuid (^9.0.0) - ID generation

**Development Dependencies**:
- jest (^27.5.1) - Testing framework
- nodemon (^2.0.22) - Development server auto-reload
- supertest (^6.3.3) - HTTP assertion library

#### Build & Installation
```bash
# Install dependencies
npm install

# Development
npm run dev

# Production
npm start

# Build
npm run build

# Database setup
npm run setup-db

# Data import
npm run import-data

# Run tests
npm run test
```

#### Docker
**Dockerfile**: `backend/Dockerfile.production`
**Base Image**: node:18-alpine
**Port**: 9000
**Configuration**: Multi-stage build with non-root user (gadgetshack), health checks, security hardening, dumb-init signal handling

#### Testing
**Framework**: Jest
**Test Location**: `backend/tests/`
**Naming Convention**: `*.test.js`
**Configuration**: `backend/jest.config.js`
**Test Files**:
- health.test.js
- auth.test.js
- products.test.js
- orders.test.js
- admin_products.test.js
- categories_admin.test.js

**Run Command**:
```bash
npm run test
```

---

### Storefront (Next.js)
**Configuration File**: `storefront/package.json`

#### Language & Runtime
**Language**: JavaScript/TypeScript (React)
**Runtime**: Node.js >=12.0.0
**Framework**: Next.js (^12.3.4)
**Build System**: Next.js built-in build tools
**Package Manager**: npm

#### Dependencies
**Main Dependencies**:
- next (^12.3.4) - React framework
- react (^18.2.0) - UI library
- react-dom (^18.2.0) - React DOM
- axios (^0.27.2) - HTTP client
- js-cookie (^3.0.1) - Cookie management
- react-hook-form (^7.43.9) - Form state management
- react-hot-toast (^2.4.1) - Toast notifications

**Development Dependencies**:
- typescript (^5.0.4)
- eslint (^8.38.0) with next config
- @types packages for React and Node

#### Build & Installation
```bash
# Install dependencies
npm install

# Development (port 8000)
npm run dev

# Production build
npm run build

# Production start (port 8000)
npm start

# Linting
npm run lint
```

#### Docker
**Dockerfile**: `storefront/Dockerfile.production`
**Base Image**: node:18-alpine
**Port**: 3000 (container), 8000 (dev)
**Configuration**: Multi-stage build with dependencies, builder, and production stages, non-root user (nextjs), health checks

#### Features
**Main Entry Point**: `storefront/pages/index.js`
**Key Pages**: 
- index.js (Home/Products)
- categories.js (Category browsing)
- checkout.js (Purchase flow)
- login.js (User authentication)
- register.js (User registration)
- orders.js (Order history)
- profile.js (User profile)
- admin/* (Admin dashboard)

**Components**: Cart, ProductCard, QuickViewModal, ModernNavbar, RecentlyViewed, etc.

---

### Product Scraper
**Configuration File**: `scraper/package.json`

#### Language & Runtime
**Language**: JavaScript (Node.js)
**Runtime**: Node.js >=12.0.0
**Build System**: npm scripts
**Package Manager**: npm

#### Dependencies
**Main Dependencies**:
- axios (^0.27.2) - HTTP requests
- cheerio (1.0.0-rc.2) - HTML parsing
- fs-extra (^9.1.0) - File system utilities
- dotenv (^10.0.0) - Environment variables

**Development Dependencies**:
- nodemon (^2.0.20) - Auto-reload during development

#### Build & Installation
```bash
# Install dependencies
npm install

# Run scraper
npm run scrape

# Development with auto-reload
npm run dev

# Test scraper
npm run test
```

#### Scraper Scripts
**Entry Points**:
- `scraper/src/index.js` - Main scraper orchestrator
- `scraper/src/simple-techmarkit-scraper.js` - Basic product extraction
- `scraper/src/enhanced-techmarkit-scraper.js` - Advanced scraping
- `scraper/src/shopify-techmarkit-scraper.js` - Shopify integration
- `scraper/run-simple-scraper.js` - Simple runner
- `scraper/run-enhanced-scraper.js` - Enhanced runner
- `scraper/run-shopify-scraper.js` - Shopify runner

**Output**:
- scraper/output/techmarkit_products.json
- scraper/output/pepcell_products.json
- scraper/output/game_products.json

---

## Infrastructure & Configuration

### Docker Compose
**File**: `docker-compose.production.yml`
**Services**:
- PostgreSQL 15 (database)
- Redis 7 (caching)
- Backend API (Express)
- Storefront (Next.js)
- Nginx (reverse proxy)

### Environment Configuration
**Files**:
- `.env.production.example` - Production environment template
- `backend/.env.example` - Backend configuration
- `storefront/.env.example` - Frontend configuration

**Key Variables**:
- POSTGRES_PASSWORD
- REDIS_PASSWORD
- JWT_SECRET
- JWT_EXPIRES_IN
- BCRYPT_ROUNDS
- CORS_ORIGIN
- FRONTEND_URL
- DATABASE_URL
- REDIS_URL
- EMAIL_SERVICE

### Nginx Configuration
**File**: `nginx/nginx.conf`
**Purpose**: Reverse proxy routing for backend and frontend services

### Monitoring
**File**: `monitoring/prometheus.yml`
**Purpose**: Prometheus metrics collection for system monitoring

## Build & Deployment

### Root Workspace Scripts
```bash
# Setup all projects
npm run setup

# Scraper operations
npm run scrape

# Backend development
npm run backend:dev

# Storefront development
npm run storefront:dev

# Build all
npm run backend:build && npm run storefront:build

# Data import
npm run import-data

# Concurrent development
npm run dev
```

### Database
**Migration Tool**: `database/migrate-to-postgresql.js`
**Purpose**: Migrate data from SQLite to PostgreSQL

### Deployment Scripts
**Location**: `scripts/`
- deploy.sh - Main deployment script
- server-setup.sh - Server initialization
- daily-refresh.sh - Scheduled data refresh
- backup.sh - Database backup

## Documentation
Comprehensive docs available in `docs/`:
- API.md - REST API endpoints
- CODEMAP.md - Monorepo overview
- DATA_FLOW.md - End-to-end data architecture
- ENVIRONMENT.md - Configuration guide
- DEPLOYMENT_CHECKLIST.md - Production deployment steps
- MONITORING_CHECKLIST.md - Monitoring setup
- ONBOARDING.md - Developer setup
- SCRIPTS.md - Operational scripts
- RISKS_AND_NOTES.md - Important considerations
