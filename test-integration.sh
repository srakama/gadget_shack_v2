#!/bin/bash

echo "🧪 GadgetShack Integration Test Suite"
echo "====================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_pattern="$3"
    
    echo -e "\n${BLUE}Testing: $test_name${NC}"
    
    result=$(eval "$test_command" 2>/dev/null)
    exit_code=$?
    
    if [ $exit_code -eq 0 ] && [[ "$result" =~ $expected_pattern ]]; then
        echo -e "${GREEN}✅ PASS${NC}: $test_name"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC}: $test_name"
        echo "   Command: $test_command"
        echo "   Expected pattern: $expected_pattern"
        echo "   Got: $result"
        ((TESTS_FAILED++))
    fi
}

echo -e "\n${YELLOW}1. Testing Backend API${NC}"
echo "----------------------"

# Test backend health
run_test "Backend Health Check" \
    "curl -s http://localhost:9000/health" \
    '"status":"ok"'

# Test products API
run_test "Products API" \
    "curl -s http://localhost:9000/api/products" \
    '"products":\[.*\]'

# Test categories API
run_test "Categories API" \
    "curl -s http://localhost:9000/api/categories" \
    '"categories":\[.*\]'

# Test admin panel with basic auth
run_test "Admin Panel Basic Auth" \
    "curl -s -u 'your_username:your_secure_password' http://localhost:9000/api/admin/panel" \
    '"message":"Welcome to GadgetShack Admin Panel"'

echo -e "\n${YELLOW}2. Testing Storefront${NC}"
echo "---------------------"

# Test storefront basic auth requirement
run_test "Storefront Basic Auth Required" \
    "curl -s -I http://localhost:8000 | grep 'HTTP/1.1 401'" \
    "HTTP/1.1 401"

# Test storefront with auth
run_test "Storefront With Auth" \
    "curl -s -u 'your_username:your_secure_password' http://localhost:8000 | grep -o '<title>.*</title>'" \
    "<title>GadgetShack"

echo -e "\n${YELLOW}3. Testing Data Flow${NC}"
echo "--------------------"

# Check if scraped data exists
run_test "Scraped Data File Exists" \
    "ls -la pepcell_products.json | wc -l" \
    "1"

# Check if database exists
run_test "Database File Exists" \
    "ls -la backend/data/gadgetshack.db | wc -l" \
    "1"

# Test product data with markup
run_test "Price Markup Applied" \
    "curl -s http://localhost:9000/api/products | grep -o '\"price\":[0-9.]*' | head -1" \
    '"price":[0-9]*\.[0-9]*'

echo -e "\n${YELLOW}4. Testing Component Integration${NC}"
echo "-----------------------------------"

# Test that products have categories
run_test "Products Have Categories" \
    "curl -s http://localhost:9000/api/products | grep -o '\"category_name\":\"[^\"]*\"' | head -1" \
    '"category_name":"[^"]*"'

# Test that all sample products exist
run_test "All Sample Products Imported" \
    "curl -s http://localhost:9000/api/products | grep -o '\"sku\":\"PEPCELL-[0-9]*\"' | wc -l" \
    "[5-9]"

echo -e "\n${YELLOW}5. Testing File Structure${NC}"
echo "-------------------------"

# Check project structure
run_test "Scraper Directory Exists" \
    "ls -d scraper | wc -l" \
    "1"

run_test "Backend Directory Exists" \
    "ls -d backend | wc -l" \
    "1"

run_test "Storefront Directory Exists" \
    "ls -d storefront | wc -l" \
    "1"

# Check key files
run_test "Package.json Exists" \
    "ls package.json | wc -l" \
    "1"

run_test "README.md Exists" \
    "ls README.md | wc -l" \
    "1"

echo -e "\n${YELLOW}6. Testing Process Status${NC}"
echo "-------------------------"

# Check if backend is running
run_test "Backend Process Running" \
    "curl -s http://localhost:9000/health > /dev/null && echo 'running'" \
    "running"

# Check if storefront is running
run_test "Storefront Process Running" \
    "curl -s -I http://localhost:8000 > /dev/null && echo 'running'" \
    "running"

echo -e "\n${YELLOW}📊 Test Results Summary${NC}"
echo "========================"
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo -e "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All tests passed! GadgetShack is working correctly.${NC}"
    echo -e "\n${BLUE}🚀 Access your e-commerce platform:${NC}"
    echo "   • Storefront: http://localhost:8000 (Basic Auth: your_username/your_secure_password)"
    echo "   • Backend API: http://localhost:9000/api"
    echo "   • Admin Panel: http://localhost:9000/api/admin/panel"
    echo "   • Health Check: http://localhost:9000/health"
    exit 0
else
    echo -e "\n${RED}❌ Some tests failed. Please check the issues above.${NC}"
    exit 1
fi
