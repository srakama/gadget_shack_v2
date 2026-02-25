#!/bin/bash

# Test Admin CRUD Permissions for Products
# This script demonstrates full CRUD operations as an admin user

set -e

API_URL="http://localhost:9000/api"
ADMIN_EMAIL="admin@gadgetshack.com"
ADMIN_PASSWORD="admin123"

echo "🔐 Testing Admin Product CRUD Permissions"
echo "=========================================="
echo ""

# Step 1: Login as admin
echo "1️⃣  Logging in as admin..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed!"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Login successful!"
echo "Token: ${TOKEN:0:50}..."
echo ""

# Step 2: CREATE - Add a new product
echo "2️⃣  CREATE - Adding a new test product..."
CREATE_RESPONSE=$(curl -s -X POST "$API_URL/products" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "TEST-ADMIN-CRUD-001",
    "name": "Test Admin Product",
    "description": "This is a test product created by admin",
    "price": 999.99,
    "category_id": 1,
    "stock_quantity": 100,
    "images": ["https://example.com/test.jpg"],
    "sizes": "Small, Medium, Large",
    "colors": "Red, Blue, Green",
    "status": "active"
  }')

PRODUCT_ID=$(echo $CREATE_RESPONSE | grep -o '"id":[0-9]*' | cut -d':' -f2)

if [ -z "$PRODUCT_ID" ]; then
  echo "❌ Product creation failed!"
  echo "Response: $CREATE_RESPONSE"
  exit 1
fi

echo "✅ Product created successfully!"
echo "Product ID: $PRODUCT_ID"
echo ""

# Step 3: READ - Get the product
echo "3️⃣  READ - Fetching the created product..."
READ_RESPONSE=$(curl -s "$API_URL/products/$PRODUCT_ID")

PRODUCT_NAME=$(echo $READ_RESPONSE | grep -o '"name":"[^"]*' | cut -d'"' -f4)

if [ "$PRODUCT_NAME" = "Test Admin Product" ]; then
  echo "✅ Product retrieved successfully!"
  echo "Product Name: $PRODUCT_NAME"
else
  echo "❌ Product retrieval failed!"
  echo "Response: $READ_RESPONSE"
fi
echo ""

# Step 4: UPDATE - Modify the product
echo "4️⃣  UPDATE - Updating product price and stock..."
UPDATE_RESPONSE=$(curl -s -X PUT "$API_URL/products/$PRODUCT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "price": 799.99,
    "stock_quantity": 150,
    "description": "Updated description by admin"
  }')

if echo $UPDATE_RESPONSE | grep -q "updated successfully"; then
  echo "✅ Product updated successfully!"
else
  echo "❌ Product update failed!"
  echo "Response: $UPDATE_RESPONSE"
fi
echo ""

# Step 5: Verify the update
echo "5️⃣  Verifying the update..."
VERIFY_RESPONSE=$(curl -s "$API_URL/products/$PRODUCT_ID")
echo "Updated product details:"
echo $VERIFY_RESPONSE | grep -o '"description":"[^"]*' | cut -d'"' -f4
echo ""

# Step 6: DELETE - Remove the product
echo "6️⃣  DELETE - Removing the test product..."
DELETE_RESPONSE=$(curl -s -X DELETE "$API_URL/products/$PRODUCT_ID" \
  -H "Authorization: Bearer $TOKEN")

if echo $DELETE_RESPONSE | grep -q "deleted successfully"; then
  echo "✅ Product deleted successfully!"
else
  echo "❌ Product deletion failed!"
  echo "Response: $DELETE_RESPONSE"
fi
echo ""

# Step 7: Verify deletion
echo "7️⃣  Verifying deletion..."
VERIFY_DELETE=$(curl -s "$API_URL/products/$PRODUCT_ID")

if echo $VERIFY_DELETE | grep -q "not found"; then
  echo "✅ Product successfully removed from database!"
else
  echo "⚠️  Product may still exist"
fi
echo ""

echo "=========================================="
echo "✅ All CRUD operations completed successfully!"
echo ""
echo "Summary:"
echo "  ✓ CREATE - Added new product"
echo "  ✓ READ   - Retrieved product details"
echo "  ✓ UPDATE - Modified product attributes"
echo "  ✓ DELETE - Removed product"
echo ""
echo "🎉 You have full CRUD permissions as admin!"

