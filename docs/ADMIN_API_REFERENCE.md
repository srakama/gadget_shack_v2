# Admin API Reference - Complete CRUD Operations

## Authentication
All admin endpoints require JWT authentication:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

Get token via: `POST /api/auth/login`

---

## 📦 Products API

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/products` | List all products | Public |
| GET | `/api/products/:id` | Get product by ID | Public |
| GET | `/api/products/sku/:sku` | Get product by SKU | Public |
| POST | `/api/products` | Create new product | Admin |
| PUT | `/api/products/:id` | Update product | Admin |
| DELETE | `/api/products/:id` | Delete product | Admin |

### Product Fields
- `sku` (required) - Unique product identifier
- `name` (required) - Product name
- `description` - Product description
- `price` (required) - Base price (before markup)
- `category_id` - Category ID
- `stock_quantity` - Available stock
- `images` - Array of image URLs
- `sizes` - Comma-separated sizes
- `colors` - Comma-separated colors
- `status` - 'active' or 'inactive'

---

## 👥 Users API

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/users` | List all users | Admin |
| GET | `/api/admin/users/:id` | Get user by ID | Admin |
| POST | `/api/admin/users` | Create new user | Admin |
| PUT | `/api/admin/users/:id` | Update user | Admin |
| DELETE | `/api/admin/users/:id` | Delete user | Admin |

### User Fields
- `email` (required) - User email (unique)
- `password` - Password (hashed automatically)
- `first_name` - First name
- `last_name` - Last name
- `phone` - Phone number
- `address` - Street address
- `city` - City
- `province` - Province/State
- `postal_code` - Postal/ZIP code
- `role` - 'customer' or 'admin'

### Query Parameters
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `role` - Filter by role ('customer' or 'admin')

### Restrictions
- Cannot delete users with existing orders
- Cannot delete your own admin account

---

## 🛒 Orders API

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/orders` | List all orders | Admin |
| GET | `/api/admin/orders/:id` | Get order details with items | Admin |
| PUT | `/api/admin/orders/:id` | Update order | Admin |
| DELETE | `/api/admin/orders/:id` | Delete order | Admin |

### Order Fields (Update)
- `status` - Order status (pending, processing, shipped, delivered, cancelled)
- `payment_status` - Payment status (pending, paid, failed, refunded)
- `tracking_number` - Shipping tracking number
- `shipping_provider` - Shipping company (e.g., Aramex, DHL)
- `shipping_service` - Service type
- `shipping_cost` - Shipping cost
- `shipping_status` - Shipping status
- `shipping_location` - Current location
- `estimated_delivery` - Estimated delivery date
- `shipping_address` - Shipping address (JSON)
- `billing_address` - Billing address (JSON)

### Query Parameters
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `status` - Filter by order status

### Notes
- Deleting an order also deletes all associated order items
- Use with caution - consider updating status to 'cancelled' instead

---

## 📁 Categories API

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/categories` | List all categories | Public |
| GET | `/api/categories/:id` | Get category by ID | Public |
| POST | `/api/categories` | Create new category | Admin |
| PUT | `/api/categories/:id` | Update category | Admin |
| DELETE | `/api/categories/:id` | Delete category | Admin |

### Category Fields
- `name` (required) - Category name
- `description` - Category description

### Restrictions
- Cannot delete categories with existing products

---

## 📊 Admin Dashboard & Analytics

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/stats` | Dashboard statistics | Admin |
| GET | `/api/admin/dashboard` | Enhanced analytics | Admin |

### Dashboard Stats Response
```json
{
  "stats": {
    "products": {
      "total_products": 574,
      "active_products": 574,
      "inactive_products": 0,
      "total_stock": 57400
    },
    "orders": {
      "total_orders": 10,
      "pending_orders": 2,
      "total_revenue": 15000.50
    },
    "users": {
      "total_users": 25,
      "admin_users": 1,
      "customer_users": 24
    },
    "categories": {
      "total_categories": 12
    },
    "recent_orders": [...],
    "low_stock_products": [...]
  }
}
```

### Enhanced Dashboard Query Parameters
- `period` - Number of days (default: 30)

---

## 🔧 Product Management (Admin)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/products` | List products by status | Admin |
| POST | `/api/admin/products/:id/activate` | Activate product | Admin |
| POST | `/api/admin/products/:id/deactivate` | Deactivate product | Admin |
| POST | `/api/admin/products/reactivate` | Bulk reactivate | Admin |
| POST | `/api/admin/products/deactivate` | Bulk deactivate | Admin |
| POST | `/api/admin/products/:id/feature` | Feature product | Admin |
| POST | `/api/admin/products/:id/unfeature` | Unfeature product | Admin |
| POST | `/api/admin/products/feature` | Bulk feature | Admin |
| POST | `/api/admin/products/unfeature` | Bulk unfeature | Admin |

### Bulk Operations Request Body
```json
{
  "ids": [1, 2, 3, 4, 5]
}
```

---

## 🔄 Data Refresh (Admin)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/admin/refresh` | Trigger data refresh | Admin |
| GET | `/api/admin/refresh/status` | Get refresh status | Admin |
| GET | `/api/admin/refresh/log-tail` | Get refresh logs | Admin |

### Refresh Query Parameters
- `full` - Force full refresh (true/false)

---

## ⚠️ Error Responses

### 401 Unauthorized
```json
{
  "error": "Access token required"
}
```

### 403 Forbidden
```json
{
  "error": "Admin access required"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 400 Bad Request
```json
{
  "error": "Validation error message"
}
```

---

## 🎯 Quick Reference

**Admin Credentials:**
- Email: `admin@gadgetshack.com`
- Password: `admin123`

**Base URL:** `http://localhost:9000/api`

**Test Script:** `./test-all-admin-crud.sh`

**Full Guide:** `docs/ADMIN_COMPLETE_CRUD_GUIDE.md`

