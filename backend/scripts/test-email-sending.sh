#!/bin/bash
# Test Email Sending with PDF Attachment

echo "========================================="
echo "Testing Invoice Email Sending"
echo "========================================="
echo ""

API_URL="${1:-http://localhost:3001}"

# Step 1: Login
echo "1️⃣  Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "landlord@example.com", "password": "password123"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
    echo "   ❌ Login failed"
    exit 1
fi

echo "   ✅ Login successful"
echo ""

# Step 2: Send invoice email
echo "2️⃣  Sending invoice email..."
SEND_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/invoices/1/send" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "$SEND_RESPONSE" | jq '.'

EMAIL_SENT=$(echo "$SEND_RESPONSE" | jq -r '.emailSent')
SIMULATED=$(echo "$SEND_RESPONSE" | jq -r '.simulated')

echo ""

if [ "$EMAIL_SENT" = "true" ]; then
    if [ "$SIMULATED" = "true" ]; then
        echo "   ⚠️  Email was SIMULATED (SendGrid not configured)"
        echo "   💡 To send real emails, add SENDGRID_API_KEY to .env"
    else
        echo "   ✅ Email sent successfully!"
        MESSAGE_ID=$(echo "$SEND_RESPONSE" | jq -r '.messageId')
        echo "   📧 Message ID: $MESSAGE_ID"
    fi
else
    echo "   ❌ Email sending failed"
fi

echo ""

# Step 3: Check invoice status
echo "3️⃣  Checking invoice status..."
STATUS_RESPONSE=$(curl -s -X GET "$API_URL/api/v1/invoices/1" \
  -H "Authorization: Bearer $TOKEN")

INVOICE_STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.status')
echo "   Invoice Status: $INVOICE_STATUS"

if [ "$INVOICE_STATUS" = "sent" ]; then
    echo "   ✅ Status updated to 'sent'"
else
    echo "   ⚠️  Status is '$INVOICE_STATUS'"
fi

echo ""
echo "========================================="
echo "✅ Email Sending Test Complete!"
echo "========================================="
echo ""
echo "💡 Tips:"
echo "   • Email is simulated when SENDGRID_API_KEY is not set"
echo "   • To send real emails:"
echo "     1. Sign up at https://sendgrid.com"
echo "     2. Get your API key"
echo "     3. Add to .env: SENDGRID_API_KEY=your-key"
echo "     4. Update SENDGRID_FROM_EMAIL in .env"
echo "========================================="
