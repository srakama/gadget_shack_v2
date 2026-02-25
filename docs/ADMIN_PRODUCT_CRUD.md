# Admin Product CRUD Operations Guide

## Overview
As an admin user, you have full CRUD (Create, Read, Update, Delete) permissions on all products in the GadgetShack system.

## Admin Authentication

### Default Admin Credentials
When you run the data import script, a default admin user is created:
- **Email**: `admin@gadgetshack.com`
- **Password**: `admin123`
- ⚠️ **Important**: Change this password after first login!

### Getting Your Admin Token

1. **Login to get JWT token**:
```bash
curl -X POST http://localhost:9000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@gadgetshack.com",
    "password": "admin123"
  }'
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@gadgetshack.com",
    "role": "admin"
  }
}
```

2. **Use the token in subsequent requests**:
```bash
Authorization: Bearer YOUR_TOKEN_HERE
```

---

## CRUD Operations

### 📖 READ Operations

#### Get All Products (with filters)
```bash
# Basic request
curl http://localhost:9000/api/products

# With filters
curl "http://localhost:9000/api/products?page=1&limit=20&category=1&search=iphone&minPrice=100&maxPrice=1000&status=active"
```

#### Get Single Product by ID
```bash
curl http://localhost:9000/api/products/123
```

#### Get Product by SKU
```bash
curl http://localhost:9000/api/products/sku/IPHONE-15-PRO
```

---

### ✏️ CREATE Operation (Admin Only)

```bash
curl -X POST http://localhost:9000/api/products \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "GALAXY-S24-ULTRA",
    "name": "Samsung Galaxy S24 Ultra",
    "description": "Latest flagship smartphone with AI features",
    "price": 1299.99,
    "category_id": 1,
    "stock_quantity": 50,
    "images": [
      "https://example.com/image1.jpg",
      "https://example.com/image2.jpg"
    ],
    "sizes": "128GB, 256GB, 512GB",
    "colors": "Titanium Black, Titanium Gray, Titanium Violet",
    "status": "active"
  }'
```

**Required fields**: `sku`, `name`, `price`

**Response**:
```json
{
  "message": "Product created successfully",
  "product": {
    "id": 456,
    "sku": "GALAXY-S24-ULTRA",
    "name": "Samsung Galaxy S24 Ultra",
    "price": 1299.99
  }
}
```

---

### 🔄 UPDATE Operation (Admin Only)

```bash
curl -X PUT http://localhost:9000/api/products/456 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "price": 1199.99,
    "stock_quantity": 75,
    "status": "active"
  }'
```

**Note**: Only include fields you want to update. Uses `COALESCE` to keep existing values for omitted fields.

**Response**:
```json
{
  "message": "Product updated successfully"
}
```

---

### 🗑️ DELETE Operation (Admin Only)

```bash
curl -X DELETE http://localhost:9000/api/products/456 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Response**:
```json
{
  "message": "Product deleted successfully"
}
```

---

## Additional Admin Product Operations

### Deactivate Product (Soft Delete)
```bash
curl -X POST http://localhost:9000/api/admin/products/456/deactivate \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Reactivate Product
```bash
curl -X POST http://localhost:9000/api/admin/products/456/reactivate \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Feature/Unfeature Product
```bash
# Feature a product
curl -X POST http://localhost:9000/api/admin/products/456/feature \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Unfeature a product
curl -X POST http://localhost:9000/api/admin/products/456/unfeature \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Access token required"
}
```
**Solution**: Include valid JWT token in Authorization header

### 403 Forbidden
```json
{
  "error": "Admin access required"
}
```
**Solution**: Ensure you're logged in as an admin user

### 404 Not Found
```json
{
  "error": "Product not found"
}
```

### 400 Bad Request
```json
{
  "error": "SKU, name, and price are required"
}
```
or
```json
{
  "error": "Product with this SKU already exists"
}
```

---

## Testing Your Permissions

Run the admin product tests:
```bash
cd backend
npm test -- admin_products.test.js
```

This will verify all CRUD operations work correctly with admin authentication.

