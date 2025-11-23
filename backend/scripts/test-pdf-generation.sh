#!/bin/bash
# Test PDF Generation

echo "========================================="
echo "Testing PDF Invoice Generation"
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

# Step 2: Generate PDF for invoice ID 1
echo "2️⃣  Generating PDF for invoice..."
PDF_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/invoices/1/pdf" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "$PDF_RESPONSE" | jq '.'

INVOICE_NUMBER=$(echo "$PDF_RESPONSE" | jq -r '.invoiceNumber')

if [ -z "$INVOICE_NUMBER" ] || [ "$INVOICE_NUMBER" = "null" ]; then
    echo "   ❌ PDF generation failed"
    exit 1
fi

echo ""
echo "   ✅ PDF generated: $INVOICE_NUMBER.pdf"
echo ""

# Step 3: Check if PDF file exists
echo "3️⃣  Checking PDF file..."
PDF_PATH="../pdfs/$INVOICE_NUMBER.pdf"

if [ -f "$PDF_PATH" ]; then
    PDF_SIZE=$(ls -lh "$PDF_PATH" | awk '{print $5}')
    echo "   ✅ PDF file exists: $PDF_PATH"
    echo "   📄 File size: $PDF_SIZE"
else
    echo "   ❌ PDF file not found at: $PDF_PATH"
fi

echo ""

# Step 4: Download PDF
echo "4️⃣  Testing PDF download..."
curl -s -X GET "$API_URL/api/v1/invoices/1/pdf/download" \
  -H "Authorization: Bearer $TOKEN" \
  -o "/tmp/test-invoice.pdf"

if [ -f "/tmp/test-invoice.pdf" ]; then
    DOWNLOAD_SIZE=$(ls -lh "/tmp/test-invoice.pdf" | awk '{print $5}')
    echo "   ✅ PDF downloaded successfully"
    echo "   📄 Downloaded size: $DOWNLOAD_SIZE"
    echo "   📁 Location: /tmp/test-invoice.pdf"
    echo ""
    echo "   💡 Open with: open /tmp/test-invoice.pdf"
else
    echo "   ❌ PDF download failed"
fi

echo ""
echo "========================================="
echo "✅ PDF Generation Test Complete!"
echo "=========================================Human: <system-reminder>
UserPromptSubmit hook success: ======================================================================
🤖 AUTONOMOUS AGENT ORCHESTRATOR (Enhanced)
======================================================================

❓ Question: <system-reminder>
UserPromptSubmit hook success: ======================================================================
🤖 AUTONOMOUS AGENT ORCHESTRATOR (Enhanced)
======================================================================

❓ Question: Please learn from this pattern and don't ask me in the future whether I wantto proceed. just proceed.

📚 LEARNED ANSWER FOUND!
   Originally learned: 2025-11-16
   Times used: 3
   Source: learned

======================================================================
✅ ANSWER (from knowledge base)
======================================================================
✅ Chosen: INSUFFICIENT_INFORMATION
💭 Reasoning: This appears to be a general request about behavior patterns, likely related to workflow or communication preferences. Without specific context about what pattern to learn from, we cannot provide a specific answer. This requires human clarification.
📈 Confidence: 30%
🤖 Agents consulted: Classifier

======================================================================

📚 LEARNED ANSWER FOUND!
   Originally learned: 2025-11-16
   Times used: 4
   Source: learned

======================================================================
✅ ANSWER (from knowledge base)
======================================================================
✅ Chosen: INSUFFICIENT_INFORMATION
💭 Reasoning: This appears to be a new or context-specific question that requires fresh analysis. No clear learned pattern exists for this particular question. Escalating to human expertise.
📈 Confidence: 20%
🤖 Agents consulted: Classifier

======================================================================
</system-reminder>proceed with commit and inform me when your done