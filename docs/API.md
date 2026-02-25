# API Overview

Base URL: /api

Auth
- JWT Bearer token (Authorization: Bearer <token>) for protected endpoints
- Admin-only endpoints require a user with role=admin
- Basic Auth is only used for the admin /api/admin/panel convenience endpoint

Auth endpoints (/api/auth)
- POST /register: create account
  Body: { email, password, first_name, last_name?, phone, address?, city?, province?, postal_code? }
  Response: { message, user, token }
- POST /login: login and receive token
  Body: { email, password }
  Response: { message, user, token }
- GET /profile: get current user profile (auth)
- PUT /profile: update profile (auth)
- PUT /change-password: change password (auth)

Product endpoints (/api/products)
- GET /: list products with filters
  Query: page, limit, category, search, minPrice, maxPrice, status (default active)
  Notes: Applies public markup percent (MARKUP_PERCENT; default 20%) to returned prices
- GET /:id: get product by numeric id
- GET /sku/:sku: get product by SKU
- POST /: create product (admin)
- PUT /:id: update product (admin)
- DELETE /:id: delete product (admin)

Category endpoints (/api/categories)
- GET /: list categories with product_count
- GET /:id: get single category
- POST /: create category (admin)
- PUT /:id: update category (admin)
- DELETE /:id: delete category (admin; fails if products exist)

Order endpoints (/api/orders)
- GET /: list current user's orders (auth)
- GET /:id: get a specific order with items (auth)
- POST /: create new order (auth). Body: { items: [{ product_id, quantity }...], shipping_address?, billing_address? }
- PUT /:id/status: update order status (admin)

Admin endpoints (/api/admin)
- GET /stats: high-level stats (admin)
- GET /orders: list orders with pagination/filters (admin)
- GET /users: list users with aggregation (admin)
- GET /panel: basic auth protected welcome/info endpoint
- POST /refresh: trigger daily refresh in background (admin; optional ?full=true or body { full: true })
- GET /refresh/status: last refresh summary (admin)
- GET /refresh/log-tail: last refresh log tail (admin)
- GET /products: list products by status/search/category (admin)
- POST /products/:id/reactivate: reactivate product (admin)
- POST /products/reactivate: bulk reactivate (admin)
- POST /products/:id/deactivate: deactivate product (admin)
- POST /products/deactivate: bulk deactivate (admin)

Notes
- All timestamps are ISO-like strings from SQLite CURRENT_TIMESTAMP
- Numeric IDs are integers; images on products are JSON arrays; sizes/colors are comma-separated strings
- Errors return { error: string }

