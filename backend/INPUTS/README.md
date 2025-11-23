# INPUTS Folder - Configuration Management

## Overview

This folder contains **sensitive configuration data** that should NOT be committed to version control. The data here includes private information such as bank account details, contact information, and business settings.

## Security Architecture

### 🔒 Security Layers

1. **Git Ignored**: This entire folder is excluded from version control (see `.gitignore`)
2. **API-Only Access**: Configuration can only be accessed through the `configService` API
3. **No Direct File Access**: Code cannot directly read these files - must use the service
4. **Scoped Access**: Different methods expose only necessary data (principle of least privilege)

### 🛡️ How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                    INPUTS/landlord-config.csv               │
│                  (Your private data - Git ignored)          │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ Reads via configService
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              src/services/configService.ts                   │
│                    (Secure API Layer)                        │
├─────────────────────────────────────────────────────────────┤
│  ✅ getCompanyInfo()      - Safe: Name, email, phone        │
│  ⚠️  getPaymentInfo()      - Sensitive: Bank, IBAN          │
│  ✅ getInvoiceSettings()  - Safe: Currency, footer text     │
│  ✅ getLateFeeSettings()  - Safe: Percentages, grace days   │
│  🔐 getFullConfig()       - INTERNAL ONLY: All data         │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ Used by
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              PDF Generation, Invoices, etc.                  │
│         (Only gets data through approved methods)            │
└─────────────────────────────────────────────────────────────┘
```

## Files in This Folder

### `landlord-config.csv` (YOUR PRIVATE DATA)
This is your actual configuration file containing real data. **NEVER commit this file to Git.**

### `landlord-config.example.csv` (TEMPLATE)
This is a template showing the structure. Safe to commit. Copy this file to create your own `landlord-config.csv`.

### `.gitignore`
Ensures your private config file is never committed to version control.

## Setup Instructions

### First Time Setup

1. **Copy the example file:**
   ```bash
   cp landlord-config.example.csv landlord-config.csv
   ```

2. **Edit your config file:**
   ```bash
   # Use Excel, Numbers, or any text editor
   open landlord-config.csv
   ```

3. **Fill in your details:**
   - Replace all placeholder values with your real data
   - Pay special attention to sensitive fields (IBAN, contact info)
   - Save the file

4. **Verify it's protected:**
   ```bash
   # This should NOT show landlord-config.csv
   git status
   ```

## Editing Your Configuration

You can edit the CSV file with:
- **Excel** (Recommended for easy editing)
- **Numbers** (Mac)
- **Google Sheets** (Import, edit, export)
- **Text Editor** (VS Code, Sublime, etc.)

### CSV Structure

```csv
field,value,description
company_name,Your Company Name,Description of what this field does
bank_iban,NL12 INGB 0001 2345 67,IBAN number (SENSITIVE)
```

- **field**: The configuration key (don't change these)
- **value**: Your actual value (edit this column)
- **description**: Explanation (helpful for reference)

## Configuration Fields

| Field | Type | Sensitive | Description |
|-------|------|-----------|-------------|
| `company_name` | Text | No | Company name on invoices |
| `landlord_name` | Text | No | Your full name |
| `contact_email` | Email | ⚠️ Yes | Your contact email |
| `contact_phone` | Phone | ⚠️ Yes | Your phone number |
| `bank_name` | Text | No | Bank name for payments |
| `bank_iban` | IBAN | 🔐 **HIGHLY SENSITIVE** | Your IBAN number |
| `invoice_footer_line1` | Text | No | First footer line |
| `invoice_footer_line2` | Text | No | Second footer line |
| `currency` | Code | No | Currency code (EUR, USD, GBP) |
| `currency_symbol` | Symbol | No | Currency symbol (€, $, £) |
| `payment_terms_days` | Number | No | Days until payment due |
| `late_fee_percentage` | Number | No | Late fee percentage |
| `late_fee_grace_days` | Number | No | Grace period before late fee |

## How the API Works

### Example: Generating a PDF

```typescript
import { configService } from './services/configService';

// ✅ SAFE: Get company info (no sensitive data)
const companyInfo = configService.getCompanyInfo();
console.log(companyInfo);
// { companyName: "...", landlordName: "...", contactEmail: "...", contactPhone: "..." }

// ⚠️ SENSITIVE: Get payment info (includes bank details)
// Only use in secure contexts like PDF generation
const paymentInfo = configService.getPaymentInfo();
console.log(paymentInfo);
// { bankName: "ING Bank", bankIban: "NL12 INGB 0001 2345 67" }

// ✅ SAFE: Get invoice settings
const invoiceSettings = configService.getInvoiceSettings();
console.log(invoiceSettings);
// { currency: "EUR", currencySymbol: "€", paymentTermsDays: 14, ... }
```

### Security Best Practices

#### ✅ DO:
- Use `getCompanyInfo()` for public-facing displays
- Use `getPaymentInfo()` only for PDF generation and internal processing
- Keep the INPUTS folder in `.gitignore`
- Store backups of your config file securely (encrypted)
- Use environment variables for additional secrets if needed

#### ❌ DON'T:
- Never expose `getPaymentInfo()` through public API endpoints
- Never commit `landlord-config.csv` to version control
- Never log sensitive data to console in production
- Never send bank details via unencrypted channels
- Never use `getFullConfig()` in API responses

## Reloading Configuration

If you update the CSV file while the server is running:

```typescript
// Reload configuration without restarting server
configService.reload();
```

Or restart the server:
```bash
npm run dev
```

## Security Considerations

### Why This Approach?

1. **Separation of Concerns**: Configuration is separate from code
2. **Easy to Edit**: CSV format is user-friendly (Excel, spreadsheet apps)
3. **Version Control Safe**: Private data never enters Git
4. **Access Control**: API layer controls what data is exposed where
5. **Audit Trail**: All config access goes through one service

### Additional Security Layers (Future)

For production deployments, consider:

1. **Azure Key Vault**: Store IBAN and sensitive data in cloud vault
2. **Environment Variables**: Use `.env` for additional secrets
3. **Encryption**: Encrypt the CSV file at rest
4. **Role-Based Access**: Limit who can read/edit the config
5. **Audit Logging**: Track when sensitive data is accessed

## Troubleshooting

### Error: "Configuration file not found"
```
Solution: Copy landlord-config.example.csv to landlord-config.csv
```

### Error: CSV parsing failed
```
Solution: Check that your CSV has proper formatting:
- Commas between columns
- No extra quotes or special characters
- UTF-8 encoding
```

### Configuration not updating
```
Solution: Call configService.reload() or restart the server
```

## Example Workflow

### Adding a New Configuration Field

1. **Add to CSV**:
   ```csv
   vat_number,NL123456789B01,VAT/Tax number
   ```

2. **Update TypeScript Interface**:
   ```typescript
   // In configService.ts
   export interface LandlordConfig {
     // ... existing fields
     vatNumber: string;
   }
   ```

3. **Update loadConfig() Method**:
   ```typescript
   this.config = {
     // ... existing fields
     vatNumber: configMap.get('vat_number') || ''
   };
   ```

4. **Create Getter Method**:
   ```typescript
   public getVatNumber(): string {
     this.ensureLoaded();
     return this.config!.vatNumber;
   }
   ```

5. **Use in Your Code**:
   ```typescript
   const vat = configService.getVatNumber();
   ```

## Support

If you have questions about configuration management:
1. Check this README
2. Review `configService.ts` for available methods
3. See `landlord-config.example.csv` for field structure
4. Contact your development team

---

**Remember**: This folder contains your private business data. Treat it like you would treat your bank password. 🔒
