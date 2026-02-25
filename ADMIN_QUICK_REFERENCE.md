# Admin Quick Reference Card

## 🔑 Your Admin Credentials
- **Email**: `admin@gadgetshack.com`
- **Password**: `admin123`
- **Role**: `admin`

## 🚀 Quick Start

### 1. Get Your Admin Token
```bash
curl -X POST http://localhost:9000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gadgetshack.com","password":"admin123"}'
```

Save the token from the response!

### 2. Use Token in Requests
```bash
-H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 📦 Product CRUD Operations

| Operation | Method | Endpoint | Auth Required |
|-----------|--------|----------|---------------|
| **List Products** | GET | `/api/products` | ❌ No |
| **Get Product** | GET | `/api/products/:id` | ❌ No |
| **Create Product** | POST | `/api/products` | ✅ Admin |
| **Update Product** | PUT | `/api/products/:id` | ✅ Admin |
| **Delete Product** | DELETE | `/api/products/:id` | ✅ Admin |

## 🎯 Quick Examples

### Create Product
```bash
curl -X POST http://localhost:9000/api/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "NEW-PRODUCT-001",
    "name": "My New Product",
    "description": "Product description",
    "price": 499.99,
    "category_id": 1,
    "stock_quantity": 50,
    "status": "active"
  }'
```

### Update Product
```bash
curl -X PUT http://localhost:9000/api/products/123 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"price": 399.99, "stock_quantity": 100}'
```

### Delete Product
```bash
curl -X DELETE http://localhost:9000/api/products/123 \
  -H "Authorization: Bearer $TOKEN"
```

## 🛠️ Additional Admin Operations

### Deactivate Product (Soft Delete)
```bash
curl -X POST http://localhost:9000/api/admin/products/123/deactivate \
  -H "Authorization: Bearer $TOKEN"
```

### Reactivate Product
```bash
curl -X POST http://localhost:9000/api/admin/products/123/reactivate \
  -H "Authorization: Bearer $TOKEN"
```

### Feature Product
```bash
curl -X POST http://localhost:9000/api/admin/products/123/feature \
  -H "Authorization: Bearer $TOKEN"
```

### Get Admin Stats
```bash
curl http://localhost:9000/api/admin/stats \
  -H "Authorization: Bearer $TOKEN"
```

### List All Orders
```bash
curl http://localhost:9000/api/admin/orders \
  -H "Authorization: Bearer $TOKEN"
```

### List All Users
```bash
curl http://localhost:9000/api/admin/users \
  -H "Authorization: Bearer $TOKEN"
```

## 🧪 Test Your Permissions

Run the automated test script:
```bash
./test-admin-crud.sh
```

Or run the backend tests:
```bash
cd backend
npm test -- admin_products.test.js
```

## 📚 Full Documentation

- **Complete CRUD Guide**: `docs/ADMIN_PRODUCT_CRUD.md`
- **API Documentation**: `docs/API.md`
- **Environment Setup**: `docs/ENVIRONMENT.md`

## ⚠️ Important Notes

1. **Token Expiration**: JWT tokens expire after 24 hours
2. **Required Fields**: When creating products, `sku`, `name`, and `price` are required
3. **Unique SKU**: Each product must have a unique SKU
4. **Price Markup**: Public prices shown to customers include a 20% markup (configurable via `MARKUP_PERCENT`)
5. **Admin prices**: When you create/update products, use the base price (without markup)

## 🎉 You're All Set!

You now have **full CRUD permissions** on all products as an admin user. The system is ready to use!

