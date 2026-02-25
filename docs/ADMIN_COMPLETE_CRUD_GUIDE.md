# Complete Admin CRUD Operations Guide

## 🎯 Overview
As an admin, you have **full CRUD (Create, Read, Update, Delete) permissions** on:
- ✅ **Products** - Manage your product catalog
- ✅ **Users/Customers** - Manage user accounts
- ✅ **Orders** - Manage customer orders
- ✅ **Categories** - Organize products

---

## 🔐 Authentication

### Get Admin Token
```bash
curl -X POST http://localhost:9000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gadgetshack.com","password":"admin123"}'
```

Save the `token` from the response and use it in all subsequent requests:
```bash
-H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📦 PRODUCTS - Full CRUD

### CREATE Product
```bash
curl -X POST http://localhost:9000/api/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "PROD-001",
    "name": "Product Name",
    "description": "Product description",
    "price": 999.99,
    "category_id": 1,
    "stock_quantity": 100,
    "images": ["https://example.com/image.jpg"],
    "sizes": "S, M, L",
    "colors": "Red, Blue",
    "status": "active"
  }'
```

### READ Products
```bash
# List all products
curl http://localhost:9000/api/products

# Get single product
curl http://localhost:9000/api/products/123

# Get by SKU
curl http://localhost:9000/api/products/sku/PROD-001
```

### UPDATE Product
```bash
curl -X PUT http://localhost:9000/api/products/123 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "price": 899.99,
    "stock_quantity": 150
  }'
```

### DELETE Product
```bash
curl -X DELETE http://localhost:9000/api/products/123 \
  -H "Authorization: Bearer $TOKEN"
```

---

## 👥 USERS/CUSTOMERS - Full CRUD

### CREATE User
```bash
curl -X POST http://localhost:9000/api/admin/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "password": "securepassword",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+27123456789",
    "address": "123 Main St",
    "city": "Johannesburg",
    "province": "Gauteng",
    "postal_code": "2000",
    "role": "customer"
  }'
```

### READ Users
```bash
# List all users
curl http://localhost:9000/api/admin/users \
  -H "Authorization: Bearer $TOKEN"

# Filter by role
curl "http://localhost:9000/api/admin/users?role=customer" \
  -H "Authorization: Bearer $TOKEN"

# Get single user
curl http://localhost:9000/api/admin/users/123 \
  -H "Authorization: Bearer $TOKEN"
```

### UPDATE User
```bash
curl -X PUT http://localhost:9000/api/admin/users/123 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Jane",
    "phone": "+27987654321",
    "role": "admin"
  }'
```

### DELETE User
```bash
curl -X DELETE http://localhost:9000/api/admin/users/123 \
  -H "Authorization: Bearer $TOKEN"
```

**Note**: Cannot delete users with existing orders. Cannot delete your own account.

---

## 🛒 ORDERS - Full CRUD

### READ Orders
```bash
# List all orders
curl http://localhost:9000/api/admin/orders \
  -H "Authorization: Bearer $TOKEN"

# Filter by status
curl "http://localhost:9000/api/admin/orders?status=pending" \
  -H "Authorization: Bearer $TOKEN"

# Get single order with items
curl http://localhost:9000/api/admin/orders/123 \
  -H "Authorization: Bearer $TOKEN"
```

### UPDATE Order
```bash
curl -X PUT http://localhost:9000/api/admin/orders/123 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "shipped",
    "payment_status": "paid",
    "tracking_number": "TRK123456789",
    "shipping_provider": "Aramex",
    "shipping_status": "in_transit",
    "estimated_delivery": "2025-11-25"
  }'
```

### DELETE Order
```bash
curl -X DELETE http://localhost:9000/api/admin/orders/123 \
  -H "Authorization: Bearer $TOKEN"
```

**Warning**: Deleting orders also deletes associated order items. Use with caution!

---

## 📁 CATEGORIES - Full CRUD

### CREATE Category
```bash
curl -X POST http://localhost:9000/api/categories \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Smartphones",
    "description": "Mobile phones and accessories"
  }'
```

### READ Categories
```bash
# List all categories
curl http://localhost:9000/api/categories

# Get single category
curl http://localhost:9000/api/categories/1
```

### UPDATE Category
```bash
curl -X PUT http://localhost:9000/api/categories/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mobile Devices",
    "description": "Updated description"
  }'
```

### DELETE Category
```bash
curl -X DELETE http://localhost:9000/api/categories/1 \
  -H "Authorization: Bearer $TOKEN"
```

**Note**: Cannot delete categories with existing products.

---

## 📊 Additional Admin Features

### Dashboard Stats
```bash
curl http://localhost:9000/api/admin/stats \
  -H "Authorization: Bearer $TOKEN"
```

### Enhanced Dashboard Analytics
```bash
curl "http://localhost:9000/api/admin/dashboard?period=30" \
  -H "Authorization: Bearer $TOKEN"
```

### Product Management
```bash
# Deactivate product
curl -X POST http://localhost:9000/api/admin/products/123/deactivate \
  -H "Authorization: Bearer $TOKEN"

# Reactivate product
curl -X POST http://localhost:9000/api/admin/products/123/reactivate \
  -H "Authorization: Bearer $TOKEN"

# Feature product
curl -X POST http://localhost:9000/api/admin/products/123/feature \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🎉 Summary

You now have **complete CRUD control** over:
- ✅ Products (Create, Read, Update, Delete)
- ✅ Users (Create, Read, Update, Delete)
- ✅ Orders (Read, Update, Delete)
- ✅ Categories (Create, Read, Update, Delete)

All endpoints require admin authentication via JWT token.

