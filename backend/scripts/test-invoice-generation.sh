#!/bin/bash
# Test Invoice Generation API - Quick Test Script

echo "========================================="
echo "Testing Invoice Generation System"
echo "========================================="
echo ""

API_URL="${1:-http://localhost:3001}"

echo "API URL: $API_URL"
echo ""

# Step 1: Health Check
echo "1️⃣  Testing Health Endpoint..."
HEALTH=$(curl -s "$API_URL/health")
if echo "$HEALTH" | grep -q "ok"; then
    echo "   ✅ Server is healthy"
    echo "   Response: $HEALTH" | jq '.' 2>/dev/null || echo "   Response: $HEALTH"
else
    echo "   ❌ Server health check failed"
    exit 1
fi
echo ""

# Step 2: Login
echo "2️⃣  Logging in as landlord..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "landlord@example.com", "password": "password123"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token' 2>/dev/null)

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
    echo "   ❌ Login failed"
    echo "   Response: $LOGIN_RESPONSE"
    exit 1
else
    echo "   ✅ Login successful"
    echo "   Token: ${TOKEN:0:50}..."
fi
echo ""

# Step 3: Get Active Tenants
echo "3️⃣  Getting active tenants..."
TENANTS=$(curl -s -X GET "$API_URL/api/v1/tenants" \
  -H "Authorization: Bearer $TOKEN")

TENANT_COUNT=$(echo "$TENANTS" | jq '.total' 2>/dev/null)
echo "   ✅ Found $TENANT_COUNT active tenant(s)"
echo ""

# Step 4: Generate Invoices
echo "4️⃣  Generating invoices for current month..."
CURRENT_MONTH=$(date +%-m)
CURRENT_YEAR=$(date +%Y)

GENERATE_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/invoices/generate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"month\": $CURRENT_MONTH, \"year\": $CURRENT_YEAR}")

echo "$GENERATE_RESPONSE" | jq '.' 2>/dev/null || echo "$GENERATE_RESPONSE"

GENERATED_COUNT=$(echo "$GENERATE_RESPONSE" | jq '.summary.generated' 2>/dev/null)
SKIPPED_COUNT=$(echo "$GENERATE_RESPONSE" | jq '.summary.skipped' 2>/dev/null)

if [ ! -z "$GENERATED_COUNT" ] && [ "$GENERATED_COUNT" != "null" ]; then
    echo ""
    echo "   ✅ Invoice generation completed"
    echo "   📊 Generated: $GENERATED_COUNT"
    echo "   ⏭️  Skipped: $SKIPPED_COUNT"
else
    echo "   ⚠️  Check response above"
fi
echo ""

# Step 5: Get Invoice Stats
echo "5️⃣  Getting invoice statistics..."
STATS=$(curl -s -X GET "$API_URL/api/v1/invoices/generation-stats?month=$CURRENT_MONTH&year=$CURRENT_YEAR" \
  -H "Authorization: Bearer $TOKEN")

echo "$STATS" | jq '.' 2>/dev/null || echo "$STATS"
echo ""

# Step 6: List All Invoices
echo "6️⃣  Listing all invoices..."
INVOICES=$(curl -s -X GET "$API_URL/api/v1/invoices" \
  -H "Authorization: Bearer $TOKEN")

INVOICE_COUNT=$(echo "$INVOICES" | jq '.total' 2>/dev/null)
echo "   ✅ Total invoices: $INVOICE_COUNT"
echo ""

# Summary
echo "========================================="
echo "✅ Test Complete!"
echo "========================================="
echo ""
echo "Summary:"
echo "  • Server: Running"
echo "  • Authentication: Working"
echo "  • Tenants: $TENANT_COUNT"
echo "  • Invoices Generated: $GENERATED_COUNT"
echo "  • Total Invoices: $INVOICE_COUNT"
echo ""
echo "Next steps:"
echo "  1. View API docs: $API_URL/api-docs"
echo "  2. Check database: npx prisma studio"
echo "  3. View logs: Check server terminal"
echo ""
