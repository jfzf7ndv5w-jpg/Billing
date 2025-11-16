# MVP 3.0 - Automated Invoice System
**Rental Property Management System - Complete Documentation Part 2 of 6**

---

## Automated Monthly Invoice Workflow

### Complete Process Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  AUTOMATED MONTHLY PROCESS                   │
│                  (Runs: 25th @ 9:00 AM)                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Timer Trigger  │
                    │   Azure Function│
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Fetch Active   │
                    │  Tenants from   │
                    │  Database       │
                    └─────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │  FOR EACH TENANT (Loop)       │
              └───────────────────────────────┘
                              │
                              ▼
            ┌─────────────────────────────────────┐
            │  1. Create Invoice Record           │
            │     - Generate invoice number       │
            │     - Calculate amount              │
            │     - Set due date (5th next month) │
            │     - Status: 'generated'           │
            └─────────────────────────────────────┘
                              │
                              ▼
            ┌─────────────────────────────────────┐
            │  2. Generate PDF Invoice            │
            │     - Dutch format template         │
            │     - Include all details           │
            │     - Professional layout           │
            └─────────────────────────────────────┘
                              │
                              ▼
            ┌─────────────────────────────────────┐
            │  3. Upload to Azure Blob Storage    │
            │     Path: /invoices/YYYY/MM/        │
            │     - Generate SAS URL (1 year)     │
            │     - Update invoice record         │
            └─────────────────────────────────────┘
                              │
                              ▼
            ┌─────────────────────────────────────┐
            │  4. Send Email via SendGrid         │
            │     To: tenant@email.com            │
            │     CC: landlord@email.com          │
            │     - Attach PDF                    │
            │     - Include download link         │
            │     - Professional template         │
            └─────────────────────────────────────┘
                              │
                              ▼
            ┌─────────────────────────────────────┐
            │  5. Update Invoice Status           │
            │     - Status: 'sent'                │
            │     - Sent date: timestamp          │
            │     - Email sent: true              │
            └─────────────────────────────────────┘
                              │
                              ▼
            ┌─────────────────────────────────────┐
            │  6. Log Success                     │
            │     - Application Insights          │
            │     - Success metrics               │
            └─────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │  Error Handling               │
              │  - Retry failed emails (3x)   │
              │  - Alert landlord on failure  │
              │  - Continue with next tenant  │
              └───────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Send Summary   │
                    │  Email to       │
                    │  Landlord       │
                    │  - Success count│
                    │  - Failed count │
                    │  - Details list │
                    └─────────────────┘
                              │
                              ▼
                        [END PROCESS]
```

---

## Invoice Number Format

**Pattern**: `INV-YYYY-MM-NNN`

**Examples**:
- `INV-2025-01-001` - First invoice of January 2025
- `INV-2025-01-002` - Second invoice of January 2025
- `INV-2025-12-001` - First invoice of December 2025

**Generation Logic**:
```javascript
async function generateInvoiceNumber(year, month) {
    // Get count of invoices for this month
    const count = await db.count({
        where: { year, month }
    });
    
    const sequence = String(count + 1).padStart(3, '0');
    const monthStr = String(month).padStart(2, '0');
    
    return `INV-${year}-${monthStr}-${sequence}`;
}
```

---

## Calculation Logic

### Invoice Amount Calculation

```javascript
const invoiceAmount = tenant.baseRent + 
                      tenant.serviceCharges + 
                      tenant.utilitiesAdvance -
                      tenant.discounts;
```

**Example Breakdown**:
- Base Rent: €1,200.00
- Service Charges: €50.00
- Utilities Advance: €75.00
- Discounts: €0.00
- **Total: €1,325.00**

### Due Date Calculation

```javascript
// Due date is the 5th of the following month
const dueDate = new Date(year, month, 5);

// Example: Invoice generated on Jan 25, 2025
// Due date: Feb 5, 2025
```

### Late Fee Calculation (Optional)

```javascript
const daysSinceDue = Math.floor(
    (today - invoice.dueDate) / (1000 * 60 * 60 * 24)
);

const lateFee = daysSinceDue > 7 ? 25.00 : 0;
// €25 late fee applied after 7 days overdue
```

---

## Email Template

### Professional Dutch Invoice Email (HTML)

```html
<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
                         'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            background-color: #f5f5f5;
        }
        .email-container {
            background: white;
            margin: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
            color: white;
            padding: 30px;
            border-radius: 8px 8px 0 0;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .content {
            padding: 30px;
        }
        .invoice-details {
            background: #F3F4F6;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
        }
        .invoice-details table {
            width: 100%;
            border-collapse: collapse;
        }
        .invoice-details td {
            padding: 8px 0;
        }
        .invoice-details td:first-child {
            font-weight: 600;
            color: #6B7280;
        }
        .invoice-details td:last-child {
            text-align: right;
            color: #111827;
        }
        .amount-due {
            font-size: 28px;
            color: #3B82F6;
            font-weight: 700;
        }
        .cta-button {
            display: inline-block;
            background: #3B82F6;
            color: white;
            padding: 14px 32px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
        }
        .bank-details {
            background: #FEF3C7;
            border-left: 4px solid #F59E0B;
            padding: 15px;
            margin: 20px 0;
        }
        .footer {
            background: #F9FAFB;
            padding: 20px 30px;
            border-radius: 0 0 8px 8px;
            font-size: 12px;
            color: #6B7280;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>🏠 Huurbetalingsfactuur</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">{{PROPERTY_ADDRESS}}</p>
        </div>
        
        <div class="content">
            <p>Beste {{TENANT_NAME}},</p>
            
            <p>Hierbij ontvangt u de huurbetalingsfactuur voor de maand <strong>{{MONTH_NAME}} {{YEAR}}</strong>.</p>
            
            <div class="invoice-details">
                <table>
                    <tr>
                        <td>Factuurnummer:</td>
                        <td><strong>{{INVOICE_NUMBER}}</strong></td>
                    </tr>
                    <tr>
                        <td>Factuurdatum:</td>
                        <td>{{INVOICE_DATE}}</td>
                    </tr>
                    <tr>
                        <td>Vervaldatum:</td>
                        <td><strong style="color: #DC2626;">{{DUE_DATE}}</strong></td>
                    </tr>
                    <tr style="border-top: 2px solid #E5E7EB;">
                        <td style="padding-top: 15px;">Te betalen bedrag:</td>
                        <td style="padding-top: 15px;">
                            <span class="amount-due">€{{AMOUNT}}</span>
                        </td>
                    </tr>
                </table>
            </div>
            
            <div class="bank-details">
                <strong>📌 Betalingsinstructies:</strong><br>
                Gelieve het bedrag over te maken naar:<br>
                <strong>IBAN:</strong> {{LANDLORD_IBAN}}<br>
                <strong>T.n.v.:</strong> {{LANDLORD_NAME}}<br>
                <strong>Omschrijving:</strong> {{INVOICE_NUMBER}}
            </div>
            
            <p style="text-align: center;">
                <a href="{{PDF_DOWNLOAD_URL}}" class="cta-button">
                    📄 Download Factuur (PDF)
                </a>
            </p>
            
            <p style="font-size: 14px; color: #6B7280;">
                De factuur is bijgevoegd als PDF-bestand aan deze e-mail. 
                U kunt deze ook downloaden via bovenstaande knop (link blijft 1 jaar geldig).
            </p>
            
            <p>Heeft u vragen? Neem dan gerust contact met ons op.</p>
            
            <p>Met vriendelijke groet,<br>
            <strong>{{LANDLORD_NAME}}</strong></p>
        </div>
        
        <div class="footer">
            <p>Deze e-mail is automatisch gegenereerd door ons rental management systeem.</p>
            <p>Voor vragen: {{LANDLORD_EMAIL}} | {{LANDLORD_PHONE}}</p>
        </div>
    </div>
</body>
</html>
```

---

## Azure Function Configuration

### Function Definition (function.json)

```json
{
  "bindings": [
    {
      "name": "invoiceTimer",
      "type": "timerTrigger",
      "direction": "in",
      "schedule": "0 0 9 25 * *",
      "runOnStartup": false,
      "useMonitor": true
    }
  ],
  "scriptFile": "../dist/monthly-invoice-generator/index.js"
}
```

### Cron Schedule Explained

```
0 0 9 25 * *
│ │ │ │  │ │
│ │ │ │  │ └─── Day of week (0-6, Sunday = 0)
│ │ │ │  └───── Month (1-12)
│ │ │ └──────── Day of month (1-31)
│ │ └────────── Hour (0-23)
│ └──────────── Minute (0-59)
└────────────── Second (0-59)

Translation: At 9:00:00 AM on the 25th day of every month
```

### Alternative Schedules (Reference)

```javascript
// Daily at 9:00 AM
"0 0 9 * * *"

// Every Monday at 8:00 AM
"0 0 8 * * 1"

// First day of month at 6:00 AM
"0 0 6 1 * *"

// Every 5 minutes (for testing)
"0 */5 * * * *"

// Last day of month at 6:00 PM
"0 0 18 L * *"
```

---

## Implementation Code

### Azure Function - Monthly Invoice Generator

```typescript
// azure-functions/monthly-invoice-generator/index.ts

import { AzureFunction, Context } from '@azure/functions';
import { PrismaClient } from '@prisma/client';
import { InvoiceService } from '../../shared/services/InvoiceService';
import { EmailService } from '../../shared/services/EmailService';
import { AppInsights } from '../../shared/utils/appInsights';

const prisma = new PrismaClient();
const invoiceService = new InvoiceService(prisma);
const emailService = new EmailService();

const monthlyInvoiceGenerator: AzureFunction = async function (
    context: Context,
    invoiceTimer: any
): Promise<void> {
    const startTime = new Date();
    context.log('🚀 Monthly Invoice Generator started:', startTime.toISOString());

    const results: InvoiceResult[] = [];

    try {
        // Get all active tenants
        const activeTenants = await prisma.tenant.findMany({
            where: { isActive: true },
            include: { property: true }
        });

        context.log(`📋 Found ${activeTenants.length} active tenants`);

        // Calculate target month/year
        const now = new Date();
        const targetMonth = now.getMonth() + 2; // Next month
        const targetYear = targetMonth > 12 ? now.getFullYear() + 1 : now.getFullYear();
        const finalMonth = targetMonth > 12 ? 1 : targetMonth;

        context.log(`📅 Generating invoices for ${getMonthName(finalMonth)} ${targetYear}`);

        // Process each tenant
        for (const tenant of activeTenants) {
            try {
                context.log(`👤 Processing: ${tenant.firstName} ${tenant.lastName}`);

                // 1. Create invoice
                const invoice = await invoiceService.createInvoice({
                    tenantId: tenant.id,
                    propertyId: tenant.propertyId,
                    month: finalMonth,
                    year: targetYear,
                    baseRent: tenant.monthlyRent,
                    serviceCharges: tenant.serviceCharges,
                    utilitiesAdvance: tenant.utilitiesAdvance,
                    dueDate: new Date(targetYear, finalMonth - 1, 5),
                    generatedBy: 'automated'
                });

                context.log(`✅ Invoice created: ${invoice.invoiceNumber}`);

                // 2. Send invoice with CC to landlord
                await invoiceService.sendInvoice(
                    invoice.id,
                    process.env.LANDLORD_EMAIL
                );

                context.log(`📧 Sent to ${tenant.email} (CC: ${process.env.LANDLORD_EMAIL})`);

                // Track success
                AppInsights.trackEvent('InvoiceGenerated', {
                    invoiceNumber: invoice.invoiceNumber,
                    tenant: `${tenant.firstName} ${tenant.lastName}`,
                    amount: invoice.totalAmount.toString()
                });

                results.push({
                    tenant: `${tenant.firstName} ${tenant.lastName}`,
                    status: 'success',
                    invoice: invoice.invoiceNumber
                });

            } catch (tenantError) {
                context.log.error(`❌ Error for tenant ${tenant.id}:`, tenantError);

                AppInsights.trackException(tenantError as Error, {
                    tenant: `${tenant.firstName} ${tenant.lastName}`,
                    tenantId: tenant.id.toString()
                });

                results.push({
                    tenant: `${tenant.firstName} ${tenant.lastName}`,
                    status: 'failed',
                    error: (tenantError as Error).message
                });

                // Send failure alert
                await emailService.sendAlert({
                    to: process.env.LANDLORD_EMAIL!,
                    subject: '⚠️ Invoice Generation Failed',
                    message: `Failed to generate invoice for ${tenant.firstName} ${tenant.lastName}: ${(tenantError as Error).message}`
                });
            }
        }

        // Send summary email
        const successCount = results.filter(r => r.status === 'success').length;
        const failureCount = results.filter(r => r.status === 'failed').length;

        await emailService.sendMonthlySummary({
            to: process.env.LANDLORD_EMAIL!,
            subject: `📊 Monthly Invoice Summary - ${getMonthName(finalMonth)} ${targetYear}`,
            results,
            successCount,
            failureCount
        });

        const endTime = new Date();
        const duration = endTime.getTime() - startTime.getTime();

        context.log(`✨ Completed in ${duration}ms - Success: ${successCount}, Failed: ${failureCount}`);

        AppInsights.trackEvent('MonthlyInvoiceGenerationCompleted', {
            successCount: successCount.toString(),
            failureCount: failureCount.toString(),
            duration: duration.toString()
        });

    } catch (error) {
        context.log.error('🚨 CRITICAL ERROR:', error);

        AppInsights.trackException(error as Error, {
            operation: 'MonthlyInvoiceGeneration',
            severity: 'Critical'
        });

        await emailService.sendAlert({
            to: process.env.LANDLORD_EMAIL!,
            subject: '🚨 CRITICAL: Monthly Invoice Generation Failed',
            message: `Critical error: ${(error as Error).message}\n\nPlease check logs and generate invoices manually if needed.`
        });

        throw error;
    } finally {
        await prisma.$disconnect();
    }
};

function getMonthName(month: number): string {
    const months = [
        'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
        'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'
    ];
    return months[month - 1];
}

interface InvoiceResult {
    tenant: string;
    status: 'success' | 'failed';
    invoice?: string;
    error?: string;
}

export default monthlyInvoiceGenerator;
```

---

## Error Handling & Retry Logic

### Retry Configuration

```javascript
const RETRY_CONFIG = {
    maxRetries: 3,
    retryDelay: 5000, // 5 seconds
    backoffMultiplier: 2 // Exponential backoff
};

async function sendInvoiceWithRetry(invoice, attempt = 1) {
    try {
        await EmailService.sendInvoice(invoice);
        return { success: true };
    } catch (error) {
        if (attempt < RETRY_CONFIG.maxRetries) {
            const delay = RETRY_CONFIG.retryDelay * 
                         Math.pow(RETRY_CONFIG.backoffMultiplier, attempt - 1);
            
            console.log(`Retry attempt ${attempt + 1} after ${delay}ms`);
            await sleep(delay);
            return sendInvoiceWithRetry(invoice, attempt + 1);
        } else {
            // Max retries exceeded
            await AlertService.notifyFailure({
                type: 'invoice_send_failure',
                invoice: invoice.invoiceNumber,
                tenant: invoice.tenantName,
                error: error.message
            });
            
            return { success: false, error: error.message };
        }
    }
}
```

### Error Scenarios & Responses

| Error Type | Retry? | Alert? | Action |
|------------|--------|--------|--------|
| Email delivery failure | Yes (3x) | Yes | Continue with next tenant |
| PDF generation error | No | Yes | Skip tenant, log error |
| Azure Blob upload failure | Yes (3x) | Yes | Store locally, retry later |
| Database connection error | Yes (3x) | Yes | Abort entire process |
| Invalid tenant data | No | Yes | Skip tenant, log details |

---

## Monitoring & Alerts

### Application Insights Tracking

```javascript
// Track invoice generation
appInsights.defaultClient.trackEvent({
    name: 'MonthlyInvoiceGenerated',
    properties: {
        invoiceNumber: invoice.invoiceNumber,
        tenant: invoice.tenantName,
        amount: invoice.amount,
        month: invoice.month,
        year: invoice.year
    },
    measurements: {
        generationTime: endTime - startTime,
        pdfSize: pdfBuffer.length
    }
});

// Track email delivery
appInsights.defaultClient.trackEvent({
    name: 'InvoiceEmailSent',
    properties: {
        invoiceNumber: invoice.invoiceNumber,
        recipientEmail: tenant.email,
        ccEmail: landlord.email,
        deliveryStatus: 'success'
    }
});

// Track failures
appInsights.defaultClient.trackException({
    exception: error,
    severity: 'Error',
    properties: {
        operation: 'MonthlyInvoiceGeneration',
        tenant: tenant.name,
        invoiceNumber: invoice.invoiceNumber
    }
});
```

### Alert Rules (Azure Portal Configuration)

1. **Invoice Generation Failure**
   - Condition: > 1 failure in 1 hour
   - Action: Email + SMS to landlord
   - Severity: High

2. **Email Delivery Failure**
   - Condition: > 3 failures in 1 hour after retries
   - Action: Email alert
   - Severity: Medium

3. **Function Execution Time**
   - Condition: > 5 minutes execution time
   - Action: Email alert
   - Severity: Warning

4. **Critical Error**
   - Condition: Function crashes/fails
   - Action: Email + SMS
   - Severity: Critical

---

## Testing the Automation

### Manual Test Trigger

```typescript
// Admin endpoint to manually trigger invoice generation
app.post('/api/admin/trigger-monthly-invoices', 
    authenticateAdmin,
    async (req, res) => {
        try {
            const results = await generateMonthlyInvoices();
            res.json({ 
                success: true, 
                results,
                message: 'Monthly invoices generated successfully'
            });
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    }
);
```

### Test Scenarios

**1. Happy Path (Normal Execution)**
- ✅ Invoice generated on time
- ✅ PDF created successfully
- ✅ Email sent to tenant
- ✅ Landlord receives CC
- ✅ Blob storage upload successful
- ✅ Database updated correctly

**2. Single Tenant Failure**
- ✅ Continue processing other tenants
- ✅ Log specific error
- ✅ Send failure alert to landlord
- ✅ Include in summary email

**3. Email Service Outage**
- ✅ Retry 3 times with backoff
- ✅ Store invoice for manual sending
- ✅ Alert landlord
- ✅ Mark for retry in next run

**4. Database Connection Loss**
- ✅ Retry connection
- ✅ Abort if persistent
- ✅ Send critical alert
- ✅ Log for manual intervention

**5. Azure Function Timeout**
- ✅ Process times out after 10 minutes
- ✅ Completed tenants stay processed
- ✅ Resume from failure point
- ✅ Alert sent to landlord

---

## Environment Variables

### Required Configuration

```env
# Landlord Details
LANDLORD_NAME="John Landlord"
LANDLORD_EMAIL="landlord@example.com"
LANDLORD_PHONE="+31 6 1234 5678"
LANDLORD_ADDRESS="123 Main Street, Amsterdam"
LANDLORD_IBAN="NL91ABNA0417164300"

# SendGrid Email
SENDGRID_API_KEY="SG.xxxxxxxxxxxxxxxxxxxxx"
SENDGRID_FROM_EMAIL="invoices@yourcompany.nl"

# Azure Storage
AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;..."
AZURE_STORAGE_ACCOUNT_NAME="rentalmvpstorage"
AZURE_STORAGE_ACCOUNT_KEY="xxxxxxxxxxxxx"

# Database
DATABASE_CONNECTION_STRING="Server=rental-mvp.database.windows.net;..."

# Application Insights
APPINSIGHTS_INSTRUMENTATIONKEY="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

# JWT Secret
JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# Environment
NODE_ENV="production"
```

---

## Summary & Key Points

### What Gets Automated

✅ Invoice creation for all active tenants  
✅ PDF generation with professional layout  
✅ Azure Blob Storage upload  
✅ Email delivery to tenant + CC to landlord  
✅ Database status updates  
✅ Success/failure logging  
✅ Summary email to landlord  

### What Requires Manual Action

⚠️ Verifying tenant received email (optional)  
⚠️ Handling failed invoices (if any)  
⚠️ Reviewing summary email  
⚠️ Marking invoices as paid when payment received  

### Benefits

💰 **Time Savings**: 30-60 minutes saved monthly  
📧 **Reliability**: 99%+ delivery success rate  
🔍 **Transparency**: Always CC'd on communications  
📊 **Tracking**: Full audit trail in database  
🚨 **Alerts**: Immediate notification of any issues  
⏰ **Consistency**: Same time every month, never forget  

---

**Document**: Part 2 of 6  
**Next**: Part 3 - Database Schema & API Endpoints  
**Status**: Ready for Implementation

