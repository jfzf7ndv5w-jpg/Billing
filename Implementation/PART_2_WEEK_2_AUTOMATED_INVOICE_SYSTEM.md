# Part 2: Week 2 - Automated Invoice System (Core Feature)

**Duration:** 48 hours (6 days × 8 hours)
**Budget:** €3,600 (48 hours × €75/hr)
**Dependencies:** Part 1 (Week 1 Backend Foundation) must be completed
**Deliverable:** Fully automated monthly invoice generation, PDF creation, and email delivery system

---

## Overview

Week 2 implements the **core value proposition** of MVP 3.0:
- Automated monthly invoice generation for all active tenants
- Professional PDF invoice generation
- Email delivery with SendGrid integration
- Late fee calculation for overdue invoices
- Azure Functions for scheduled automation
- Invoice status workflow management

**Why This Week Is Critical:**
This is the primary pain point the platform solves - eliminating the tedious manual process of creating and sending monthly rent invoices. Landlords currently spend 3-4 hours each month on this task. Our automation reduces it to zero manual effort.

---

## Prerequisites

**From Week 1 - You Must Have:**
✅ Backend API running on port 3001
✅ Database with 11 tables populated
✅ Authentication system working (JWT)
✅ Tenant and Property CRUD endpoints
✅ Test data seeded (landlord, property, tenant)
✅ Prisma ORM configured
✅ Development environment set up

**Verify Prerequisites:**
```bash
# Check server is running
curl http://localhost:3001/health

# Check database has tenants
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"landlord@example.com","password":"password123"}'

# Use token to verify data
curl http://localhost:3001/api/v1/tenants \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Day-by-Day Breakdown

### Day 1: Invoice Generation Service (8 hours)

#### Morning Session - Day 1 (4 hours)
**Build Invoice Generation Logic**

**1. Install Required Dependencies**
```bash
cd /Users/ldevries/Documents/Billing/backend

# Install PDF generation
npm install pdfkit

# Install Azure Storage (for PDF storage)
npm install @azure/storage-blob

# Install cron scheduler
npm install node-cron

# Install types
npm install -D @types/pdfkit @types/node-cron
```

**2. Create Invoice Service (src/services/invoiceService.ts)**

This service was already created in our session. Verify it exists and review:

```typescript
// Key Functions:
// - generateInvoiceForTenant() - Create invoice for single tenant
// - generateInvoicesForAllTenants() - Bulk generation for month
// - calculateLateFees() - Apply late fees to overdue invoices
// - getInvoiceGenerationStats() - Monthly statistics
// - generateInvoiceNumber() - Unique invoice numbering
```

**File Location:** `/Users/ldevries/Documents/Billing/backend/src/services/invoiceService.ts`

**3. Test Invoice Generation**

```bash
# Start server
npm run dev

# Create test route to trigger generation
```

**Create Test Controller (src/controllers/invoiceGenerationController.ts)**
```typescript
import { Request, Response } from 'express';
import {
  generateInvoicesForAllTenants,
  calculateLateFees,
  getInvoiceGenerationStats
} from '../services/invoiceService';
import { AuthRequest } from '../middleware/auth';

export const triggerInvoiceGeneration = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { month, year } = req.query;

    const targetMonth = month ? parseInt(month as string) : new Date().getMonth() + 1;
    const targetYear = year ? parseInt(year as string) : new Date().getFullYear();

    const invoices = await generateInvoicesForAllTenants(targetMonth, targetYear);

    res.json({
      success: true,
      message: `Generated ${invoices.length} invoice(s) for ${targetMonth}/${targetYear}`,
      invoices: invoices.map(inv => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        tenantName: `${inv.tenant.firstName} ${inv.tenant.lastName}`,
        totalAmount: inv.totalAmount,
        status: inv.status
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const triggerLateFeeCalculation = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const count = await calculateLateFees();

    res.json({
      success: true,
      message: `Late fees applied to ${count} invoice(s)`,
      count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getGenerationStats = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { month, year } = req.query;

    const targetMonth = month ? parseInt(month as string) : new Date().getMonth() + 1;
    const targetYear = year ? parseInt(year as string) : new Date().getFullYear();

    const stats = await getInvoiceGenerationStats(targetMonth, targetYear);

    res.json(stats);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
```

**Add Routes (src/routes/invoiceGenerationRoutes.ts)**
```typescript
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireLandlordOrAdmin } from '../middleware/rbac';
import {
  triggerInvoiceGeneration,
  triggerLateFeeCalculation,
  getGenerationStats
} from '../controllers/invoiceGenerationController';

const router = Router();

// All routes require authentication and landlord/admin role
router.use(authenticate);
router.use(requireLandlordOrAdmin);

/**
 * @route   POST /api/v1/invoice-generation/generate
 * @desc    Manually trigger invoice generation for a month
 * @access  Private (Landlord/Admin)
 */
router.post('/generate', triggerInvoiceGeneration);

/**
 * @route   POST /api/v1/invoice-generation/late-fees
 * @desc    Calculate and apply late fees to overdue invoices
 * @access  Private (Landlord/Admin)
 */
router.post('/late-fees', triggerLateFeeCalculation);

/**
 * @route   GET /api/v1/invoice-generation/stats
 * @desc    Get invoice generation statistics for a month
 * @access  Private (Landlord/Admin)
 */
router.get('/stats', getGenerationStats);

export default router;
```

**Register Routes in server.ts:**
```typescript
import invoiceGenerationRoutes from './routes/invoiceGenerationRoutes';

// Add to routes section
app.use('/api/v1/invoice-generation', invoiceGenerationRoutes);
```

#### Afternoon Session - Day 1 (4 hours)
**Test Invoice Generation**

**Test Manual Generation:**
```bash
# Generate invoices for current month
curl -X POST "http://localhost:3001/api/v1/invoice-generation/generate" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Generate for specific month
curl -X POST "http://localhost:3001/api/v1/invoice-generation/generate?month=12&year=2025" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get statistics
curl "http://localhost:3001/api/v1/invoice-generation/stats?month=12&year=2025" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Apply late fees
curl -X POST "http://localhost:3001/api/v1/invoice-generation/late-fees" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Verify Results in Database:**
```bash
# Open Prisma Studio to view generated invoices
npx prisma studio

# Or query via API
curl "http://localhost:3001/api/v1/invoices" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Day 1 Checkpoint:**
✅ Invoice generation service implemented
✅ Bulk generation working
✅ Late fee calculation working
✅ Statistics endpoint working
✅ Manual trigger endpoints tested

---

### Day 2: PDF Generation (8 hours)

#### Morning Session - Day 2 (4 hours)
**Create PDF Invoice Generator**

**1. Create PDF Service (src/services/pdfService.ts)**
```typescript
import PDFDocument from 'pdfkit';
import { PrismaClient, Invoice, Tenant, Property } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

export interface InvoicePDFData extends Invoice {
  tenant: Tenant & { property: Property };
}

export class PDFInvoiceGenerator {
  private doc: PDFKit.PDFDocument;
  private invoice: InvoicePDFData;

  constructor(invoice: InvoicePDFData) {
    this.invoice = invoice;
    this.doc = new PDFDocument({ size: 'A4', margin: 50 });
  }

  /**
   * Generate PDF and return as buffer
   */
  async generate(): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];

      this.doc.on('data', (chunk) => chunks.push(chunk));
      this.doc.on('end', () => resolve(Buffer.concat(chunks)));
      this.doc.on('error', reject);

      // Build PDF content
      this.addHeader();
      this.addLandlordInfo();
      this.addTenantInfo();
      this.addInvoiceDetails();
      this.addLineItems();
      this.addTotal();
      this.addPaymentInstructions();
      this.addFooter();

      this.doc.end();
    });
  }

  /**
   * Generate and save to file system
   */
  async generateToFile(outputPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const dir = path.dirname(outputPath);

      // Ensure directory exists
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const stream = fs.createWriteStream(outputPath);
      this.doc.pipe(stream);

      stream.on('finish', () => resolve(outputPath));
      stream.on('error', reject);

      // Build PDF content
      this.addHeader();
      this.addLandlordInfo();
      this.addTenantInfo();
      this.addInvoiceDetails();
      this.addLineItems();
      this.addTotal();
      this.addPaymentInstructions();
      this.addFooter();

      this.doc.end();
    });
  }

  private addHeader() {
    this.doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .text('FACTUUR', 50, 50);

    this.doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Factuurnummer: ${this.invoice.invoiceNumber}`, 50, 80);

    this.doc.text(
      `Factuurdatum: ${this.formatDate(this.invoice.invoiceDate)}`,
      50,
      95
    );

    this.doc.text(
      `Vervaldatum: ${this.formatDate(this.invoice.dueDate)}`,
      50,
      110
    );

    // Add horizontal line
    this.doc
      .moveTo(50, 130)
      .lineTo(550, 130)
      .stroke();
  }

  private addLandlordInfo() {
    const landlordEmail = process.env.LANDLORD_EMAIL || 'landlord@example.com';
    const landlordName = process.env.LANDLORD_NAME || 'John Landlord';
    const landlordIBAN = process.env.LANDLORD_IBAN || 'NL91ABNA0417164300';

    this.doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Van:', 50, 150);

    this.doc
      .fontSize(10)
      .font('Helvetica')
      .text(landlordName, 50, 170)
      .text(landlordEmail, 50, 185)
      .text(`IBAN: ${landlordIBAN}`, 50, 200);
  }

  private addTenantInfo() {
    const tenant = this.invoice.tenant;
    const property = tenant.property;

    this.doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Aan:', 300, 150);

    this.doc
      .fontSize(10)
      .font('Helvetica')
      .text(`${tenant.firstName} ${tenant.lastName}`, 300, 170)
      .text(property.address, 300, 185)
      .text(`${property.postalCode} ${property.city}`, 300, 200)
      .text(tenant.email, 300, 215);
  }

  private addInvoiceDetails() {
    this.doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Betreft:', 50, 250)
      .fontSize(10)
      .font('Helvetica')
      .text(
        `Huur ${this.getMonthName(this.invoice.month)} ${this.invoice.year}`,
        50,
        270
      );
  }

  private addLineItems() {
    let y = 310;

    // Table header
    this.doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Omschrijving', 50, y)
      .text('Bedrag', 450, y, { align: 'right' });

    // Line under header
    y += 15;
    this.doc
      .moveTo(50, y)
      .lineTo(550, y)
      .stroke();

    y += 20;

    // Line items
    this.doc.font('Helvetica');

    if (parseFloat(this.invoice.baseRent.toString()) > 0) {
      this.doc
        .text('Basishuur', 50, y)
        .text(`€ ${this.formatAmount(this.invoice.baseRent)}`, 450, y, {
          align: 'right'
        });
      y += 20;
    }

    if (parseFloat(this.invoice.serviceCharges.toString()) > 0) {
      this.doc
        .text('Servicekosten', 50, y)
        .text(`€ ${this.formatAmount(this.invoice.serviceCharges)}`, 450, y, {
          align: 'right'
        });
      y += 20;
    }

    if (parseFloat(this.invoice.utilitiesAdvance.toString()) > 0) {
      this.doc
        .text('Voorschot nutsvoorzieningen', 50, y)
        .text(`€ ${this.formatAmount(this.invoice.utilitiesAdvance)}`, 450, y, {
          align: 'right'
        });
      y += 20;
    }

    if (parseFloat(this.invoice.otherCharges.toString()) > 0) {
      this.doc
        .text('Overige kosten', 50, y)
        .text(`€ ${this.formatAmount(this.invoice.otherCharges)}`, 450, y, {
          align: 'right'
        });
      y += 20;
    }

    if (parseFloat(this.invoice.discounts.toString()) > 0) {
      this.doc
        .text('Korting', 50, y)
        .text(`-€ ${this.formatAmount(this.invoice.discounts)}`, 450, y, {
          align: 'right'
        });
      y += 20;
    }

    if (parseFloat(this.invoice.lateFees.toString()) > 0) {
      this.doc
        .fillColor('red')
        .text('Administratiekosten (te laat)', 50, y)
        .text(`€ ${this.formatAmount(this.invoice.lateFees)}`, 450, y, {
          align: 'right'
        })
        .fillColor('black');
      y += 20;
    }

    return y;
  }

  private addTotal() {
    const y = 500;

    // Line before total
    this.doc
      .moveTo(50, y)
      .lineTo(550, y)
      .stroke();

    this.doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Totaal', 50, y + 20)
      .text(`€ ${this.formatAmount(this.invoice.totalAmount)}`, 450, y + 20, {
        align: 'right'
      });

    // Double line after total
    this.doc
      .moveTo(50, y + 45)
      .lineTo(550, y + 45)
      .stroke()
      .moveTo(50, y + 48)
      .lineTo(550, y + 48)
      .stroke();
  }

  private addPaymentInstructions() {
    const landlordIBAN = process.env.LANDLORD_IBAN || 'NL91ABNA0417164300';
    const landlordName = process.env.LANDLORD_NAME || 'John Landlord';

    this.doc
      .fontSize(10)
      .font('Helvetica')
      .text('Betaalgegevens:', 50, 580)
      .text(`Rekeningnummer: ${landlordIBAN}`, 50, 600)
      .text(`Ten name van: ${landlordName}`, 50, 615)
      .text(`Onder vermelding van: ${this.invoice.invoiceNumber}`, 50, 630)
      .text(
        `Betaal voor: ${this.formatDate(this.invoice.dueDate)}`,
        50,
        645
      );
  }

  private addFooter() {
    this.doc
      .fontSize(8)
      .font('Helvetica')
      .text(
        'Voor vragen kunt u contact opnemen via e-mail.',
        50,
        750,
        { align: 'center' }
      )
      .text(
        `Automatisch gegenereerd op ${this.formatDate(new Date())}`,
        50,
        765,
        { align: 'center' }
      );
  }

  private formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('nl-NL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  private formatAmount(amount: any): string {
    const num = parseFloat(amount.toString());
    return num.toFixed(2).replace('.', ',');
  }

  private getMonthName(month: number): string {
    const months = [
      'januari', 'februari', 'maart', 'april', 'mei', 'juni',
      'juli', 'augustus', 'september', 'oktober', 'november', 'december'
    ];
    return months[month - 1];
  }
}

/**
 * Generate PDF for invoice
 */
export const generateInvoicePDF = async (
  invoiceId: number
): Promise<Buffer> => {
  // Fetch invoice with relations
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      tenant: {
        include: {
          property: true
        }
      }
    }
  });

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  const generator = new PDFInvoiceGenerator(invoice as InvoicePDFData);
  return generator.generate();
};

/**
 * Generate PDF and save to file system
 */
export const generateInvoicePDFToFile = async (
  invoiceId: number,
  outputDir: string = './invoices'
): Promise<string> => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      tenant: {
        include: {
          property: true
        }
      }
    }
  });

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  const filename = `${invoice.invoiceNumber}.pdf`;
  const outputPath = path.join(outputDir, filename);

  const generator = new PDFInvoiceGenerator(invoice as InvoicePDFData);
  return generator.generateToFile(outputPath);
};
```

#### Afternoon Session - Day 2 (4 hours)
**Test PDF Generation**

**1. Add PDF Test Endpoint**

Update `src/controllers/invoiceGenerationController.ts`:
```typescript
import { generateInvoicePDF, generateInvoicePDFToFile } from '../services/pdfService';

export const generatePDF = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const invoiceId = parseInt(id);

    const pdfBuffer = await generateInvoicePDF(invoiceId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=invoice-${invoiceId}.pdf`
    );

    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
```

Add to routes:
```typescript
router.get('/pdf/:id', generatePDF);
```

**2. Test PDF Generation:**
```bash
# Generate invoice first
curl -X POST "http://localhost:3001/api/v1/invoice-generation/generate" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get invoice ID from response, then download PDF
curl "http://localhost:3001/api/v1/invoice-generation/pdf/1" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output test-invoice.pdf

# Open PDF to verify
open test-invoice.pdf  # macOS
# or
xdg-open test-invoice.pdf  # Linux
```

**Day 2 Checkpoint:**
✅ PDF generation service implemented
✅ Professional invoice template created
✅ PDF download endpoint working
✅ Test PDF generated and verified

---

### Day 3: Email Integration (8 hours)

#### Morning Session - Day 3 (4 hours)
**Set Up SendGrid**

**1. Install SendGrid SDK**
```bash
npm install @sendgrid/mail
npm install -D @types/sendgrid__mail
```

**2. Configure Environment Variables**

Add to `.env`:
```env
# SendGrid Configuration
SENDGRID_API_KEY="SG.xxxxxxxxxxxxxxxxxxxxx"
SENDGRID_FROM_EMAIL="invoices@yourcompany.nl"
SENDGRID_FROM_NAME="Property Management System"

# Landlord CC
LANDLORD_EMAIL="landlord@example.com"
LANDLORD_NAME="John Landlord"

# For testing, use sandbox mode
SENDGRID_SANDBOX_MODE="true"
```

**3. Create Email Service (src/services/emailService.ts)**
```typescript
import sgMail from '@sendgrid/mail';
import { generateInvoicePDF } from './pdfService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
  cc?: string[];
  attachments?: Array<{
    content: string;
    filename: string;
    type: string;
    disposition: string;
  }>;
}

/**
 * Send email via SendGrid
 */
export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    const msg = {
      to: options.to,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'invoices@yourcompany.nl',
        name: process.env.SENDGRID_FROM_NAME || 'Property Management'
      },
      subject: options.subject,
      text: options.text,
      html: options.html,
      cc: options.cc || [],
      attachments: options.attachments || [],
      mailSettings: {
        sandboxMode: {
          enable: process.env.SENDGRID_SANDBOX_MODE === 'true'
        }
      }
    };

    await sgMail.send(msg);
    console.log(`✅ Email sent to ${options.to}`);
  } catch (error: any) {
    console.error('Email sending failed:', error);
    if (error.response) {
      console.error('SendGrid Error:', error.response.body);
    }
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

/**
 * Send invoice email with PDF attachment
 */
export const sendInvoiceEmail = async (invoiceId: number): Promise<void> => {
  try {
    // Fetch invoice with full details
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        tenant: {
          include: {
            property: true
          }
        }
      }
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(invoiceId);
    const pdfBase64 = pdfBuffer.toString('base64');

    // Email content
    const monthNames = [
      'januari', 'februari', 'maart', 'april', 'mei', 'juni',
      'juli', 'augustus', 'september', 'oktober', 'november', 'december'
    ];
    const monthName = monthNames[invoice.month - 1];

    const subject = `Huur factuur ${monthName} ${invoice.year} - ${invoice.invoiceNumber}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #0066cc; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; }
          .amount { font-size: 24px; font-weight: bold; color: #0066cc; margin: 20px 0; }
          .details { background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Huur Factuur</h1>
          </div>
          <div class="content">
            <p>Beste ${invoice.tenant.firstName},</p>

            <p>Hierbij ontvangt u de factuur voor de huur van ${monthName} ${invoice.year}.</p>

            <div class="details">
              <strong>Factuurnummer:</strong> ${invoice.invoiceNumber}<br>
              <strong>Factuurdatum:</strong> ${new Date(invoice.invoiceDate).toLocaleDateString('nl-NL')}<br>
              <strong>Vervaldatum:</strong> ${new Date(invoice.dueDate).toLocaleDateString('nl-NL')}<br>
              <strong>Adres:</strong> ${invoice.tenant.property.address}, ${invoice.tenant.property.city}
            </div>

            <p class="amount">Totaalbedrag: € ${parseFloat(invoice.totalAmount.toString()).toFixed(2).replace('.', ',')}</p>

            <p><strong>Betaalgegevens:</strong></p>
            <ul>
              <li>IBAN: ${process.env.LANDLORD_IBAN || 'NL91ABNA0417164300'}</li>
              <li>Ten name van: ${process.env.LANDLORD_NAME || 'John Landlord'}</li>
              <li>Onder vermelding van: ${invoice.invoiceNumber}</li>
            </ul>

            <p>De factuur vindt u als PDF bijlage bij deze e-mail.</p>

            <p>Betaal uiterlijk voor <strong>${new Date(invoice.dueDate).toLocaleDateString('nl-NL')}</strong>.</p>

            <p>Voor vragen kunt u contact opnemen via ${process.env.LANDLORD_EMAIL}.</p>

            <p>Met vriendelijke groet,<br>${process.env.LANDLORD_NAME || 'John Landlord'}</p>
          </div>
          <div class="footer">
            <p>Dit is een automatisch gegenereerde e-mail.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Beste ${invoice.tenant.firstName},

Hierbij ontvangt u de factuur voor de huur van ${monthName} ${invoice.year}.

Factuurnummer: ${invoice.invoiceNumber}
Factuurdatum: ${new Date(invoice.invoiceDate).toLocaleDateString('nl-NL')}
Vervaldatum: ${new Date(invoice.dueDate).toLocaleDateString('nl-NL')}
Adres: ${invoice.tenant.property.address}, ${invoice.tenant.property.city}

Totaalbedrag: € ${parseFloat(invoice.totalAmount.toString()).toFixed(2).replace('.', ',')}

Betaalgegevens:
- IBAN: ${process.env.LANDLORD_IBAN || 'NL91ABNA0417164300'}
- Ten name van: ${process.env.LANDLORD_NAME || 'John Landlord'}
- Onder vermelding van: ${invoice.invoiceNumber}

Betaal uiterlijk voor ${new Date(invoice.dueDate).toLocaleDateString('nl-NL')}.

Voor vragen kunt u contact opnemen via ${process.env.LANDLORD_EMAIL}.

Met vriendelijke groet,
${process.env.LANDLORD_NAME || 'John Landlord'}
    `;

    // Send email with PDF attachment
    await sendEmail({
      to: invoice.tenant.email,
      subject,
      text: textContent,
      html: htmlContent,
      cc: [process.env.LANDLORD_EMAIL || 'landlord@example.com'],
      attachments: [
        {
          content: pdfBase64,
          filename: `${invoice.invoiceNumber}.pdf`,
          type: 'application/pdf',
          disposition: 'attachment'
        }
      ]
    });

    // Update invoice status
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'sent',
        emailSent: true,
        sentDate: new Date()
      }
    });

    console.log(`✅ Invoice ${invoice.invoiceNumber} emailed to ${invoice.tenant.email}`);
  } catch (error) {
    console.error('Failed to send invoice email:', error);
    throw error;
  }
};

/**
 * Send invoices for all generated invoices in a month
 */
export const sendInvoicesForMonth = async (
  month: number,
  year: number
): Promise<number> => {
  try {
    // Find all generated (not yet sent) invoices for the month
    const invoices = await prisma.invoice.findMany({
      where: {
        month,
        year,
        status: 'generated',
        emailSent: false
      }
    });

    console.log(`\n📧 Sending ${invoices.length} invoice email(s)...`);

    let successCount = 0;
    let errorCount = 0;

    for (const invoice of invoices) {
      try {
        await sendInvoiceEmail(invoice.id);
        successCount++;

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`❌ Failed to send invoice ${invoice.invoiceNumber}:`, error);
        errorCount++;
      }
    }

    console.log(`\n📊 Email Sending Summary:`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}\n`);

    return successCount;
  } catch (error) {
    console.error('Error in bulk email sending:', error);
    throw error;
  }
};
```

#### Afternoon Session - Day 3 (4 hours)
**Test Email Sending**

**1. Get SendGrid API Key**
- Go to https://sendgrid.com
- Sign up for free account (100 emails/day free tier)
- Create API key
- Add to `.env` file

**2. Add Email Test Endpoint**

Update `src/controllers/invoiceGenerationController.ts`:
```typescript
import { sendInvoiceEmail, sendInvoicesForMonth } from '../services/emailService';

export const sendInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const invoiceId = parseInt(id);

    await sendInvoiceEmail(invoiceId);

    res.json({
      success: true,
      message: `Invoice email sent successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const sendAllInvoices = async (req: AuthRequest, res: Response) => {
  try {
    const { month, year } = req.query;

    const targetMonth = month ? parseInt(month as string) : new Date().getMonth() + 1;
    const targetYear = year ? parseInt(year as string) : new Date().getFullYear();

    const count = await sendInvoicesForMonth(targetMonth, targetYear);

    res.json({
      success: true,
      message: `${count} invoice email(s) sent successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
```

Add routes:
```typescript
router.post('/send/:id', sendInvoice);
router.post('/send-all', sendAllInvoices);
```

**3. Test Email Sending:**
```bash
# Send single invoice
curl -X POST "http://localhost:3001/api/v1/invoice-generation/send/1" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Send all invoices for current month
curl -X POST "http://localhost:3001/api/v1/invoice-generation/send-all" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Check SendGrid dashboard for sent emails
```

**Day 3 Checkpoint:**
✅ SendGrid integration complete
✅ Email template created (HTML + text)
✅ PDF attachments working
✅ Test emails sent successfully
✅ Landlord CC working

---

### Day 4: Azure Functions Automation (8 hours)

#### Morning Session - Day 4 (4 hours)
**Create Scheduled Invoice Generation**

**1. Install Azure Functions Core Tools**
```bash
# macOS
brew tap azure/functions
brew install azure-functions-core-tools@4

# Or download from:
# https://docs.microsoft.com/azure/azure-functions/functions-run-local
```

**2. Initialize Azure Functions Project**
```bash
# Create functions directory
mkdir -p /Users/ldevries/Documents/Billing/azure-functions
cd /Users/ldevries/Documents/Billing/azure-functions

# Initialize project
func init rental-invoicing --typescript

cd rental-invoicing
```

**3. Create Invoice Generation Function**
```bash
func new --name monthly-invoice-generation --template "Timer trigger"
```

**4. Configure Function (monthly-invoice-generation/function.json)**
```json
{
  "bindings": [
    {
      "name": "myTimer",
      "type": "timerTrigger",
      "direction": "in",
      "schedule": "0 0 9 25 * *"
    }
  ],
  "scriptFile": "../dist/monthly-invoice-generation/index.js"
}
```

**Schedule Explanation:**
- `0 0 9 25 * *` = Every month on the 25th at 9:00 AM
- Format: `{second} {minute} {hour} {day} {month} {day-of-week}`

**5. Implement Function (monthly-invoice-generation/index.ts)**
```typescript
import { AzureFunction, Context } from "@azure/functions";
import { PrismaClient } from "@prisma/client";
import axios from "axios";

const prisma = new PrismaClient();

const timerTrigger: AzureFunction = async function (
  context: Context,
  myTimer: any
): Promise<void> {
  const timestamp = new Date().toISOString();

  if (myTimer.isPastDue) {
    context.log("Timer function is running late!");
  }

  context.log("Monthly invoice generation started at:", timestamp);

  try {
    // Get next month (invoices are generated on 25th for next month)
    const now = new Date();
    const targetMonth = now.getMonth() + 2; // Next month
    const targetYear = targetMonth > 12 ? now.getFullYear() + 1 : now.getFullYear();
    const finalMonth = targetMonth > 12 ? 1 : targetMonth;

    context.log(`Generating invoices for ${finalMonth}/${targetYear}`);

    // Call your backend API to generate invoices
    const apiUrl = process.env.BACKEND_API_URL || "http://localhost:3001";
    const apiKey = process.env.API_KEY; // Secure API key for function authentication

    // Generate invoices
    const generateResponse = await axios.post(
      `${apiUrl}/api/v1/invoice-generation/generate?month=${finalMonth}&year=${targetYear}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    context.log(`Generated ${generateResponse.data.invoices.length} invoices`);

    // Wait 5 seconds
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Send emails
    const sendResponse = await axios.post(
      `${apiUrl}/api/v1/invoice-generation/send-all?month=${finalMonth}&year=${targetYear}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    context.log(`Sent ${sendResponse.data.message}`);

    context.log("✅ Monthly invoice generation completed successfully");
  } catch (error: any) {
    context.log.error("❌ Invoice generation failed:", error.message);
    throw error;
  }
};

export default timerTrigger;
```

**6. Configure Environment Variables (local.settings.json)**
```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "BACKEND_API_URL": "http://localhost:3001",
    "API_KEY": "your-secure-api-key-here",
    "DATABASE_URL": "your-database-url"
  }
}
```

#### Afternoon Session - Day 4 (4 hours)
**Test Azure Function Locally**

**1. Build Function**
```bash
npm install
npm run build
```

**2. Run Locally**
```bash
func start
```

**3. Test Manually**
```bash
# Trigger function manually (don't wait for schedule)
curl -X POST "http://localhost:7071/admin/functions/monthly-invoice-generation"
```

**4. Monitor Logs**
Watch the Azure Functions output for:
- Invoice generation logs
- Email sending logs
- Any errors

**Day 4 Checkpoint:**
✅ Azure Functions project created
✅ Timer trigger configured (25th @ 9:00 AM)
✅ Function implementation complete
✅ Local testing successful
✅ Automated workflow verified

---

### Day 5: Cron Scheduler (Alternative/Backup) (8 hours)

**Why Both Azure Functions AND Cron?**
- Azure Functions: Production (cloud-based, reliable)
- Cron: Development/testing, backup system

#### Morning Session - Day 5 (4 hours)
**Implement Node-Cron Scheduler**

**1. Create Scheduler Service (src/services/schedulerService.ts)**
```typescript
import cron from 'node-cron';
import { generateInvoicesForAllTenants } from './invoiceService';
import { sendInvoicesForMonth } from './emailService';

export class InvoiceScheduler {
  private generateTask: cron.ScheduledTask | null = null;
  private sendTask: cron.ScheduledTask | null = null;
  private lateFeeTask: cron.ScheduledTask | null = null;

  /**
   * Start all scheduled tasks
   */
  start() {
    console.log('📅 Starting invoice scheduler...');

    // Generate invoices on 25th of every month at 9:00 AM
    this.generateTask = cron.schedule('0 9 25 * *', async () => {
      console.log('\n🔄 Running scheduled invoice generation...');

      try {
        const now = new Date();
        const targetMonth = now.getMonth() + 2; // Next month
        const targetYear =
          targetMonth > 12 ? now.getFullYear() + 1 : now.getFullYear();
        const finalMonth = targetMonth > 12 ? 1 : targetMonth;

        await generateInvoicesForAllTenants(finalMonth, targetYear);
        console.log('✅ Scheduled invoice generation completed\n');
      } catch (error) {
        console.error('❌ Scheduled invoice generation failed:', error);
      }
    });

    // Send invoices 5 minutes after generation
    this.sendTask = cron.schedule('5 9 25 * *', async () => {
      console.log('\n📧 Running scheduled invoice sending...');

      try {
        const now = new Date();
        const targetMonth = now.getMonth() + 2;
        const targetYear =
          targetMonth > 12 ? now.getFullYear() + 1 : now.getFullYear();
        const finalMonth = targetMonth > 12 ? 1 : targetMonth;

        await sendInvoicesForMonth(finalMonth, targetYear);
        console.log('✅ Scheduled invoice sending completed\n');
      } catch (error) {
        console.error('❌ Scheduled invoice sending failed:', error);
      }
    });

    // Check for late fees daily at 6:00 AM
    this.lateFeeTask = cron.schedule('0 6 * * *', async () => {
      console.log('\n💰 Running daily late fee check...');

      try {
        const { calculateLateFees } = await import('./invoiceService');
        await calculateLateFees();
        console.log('✅ Late fee check completed\n');
      } catch (error) {
        console.error('❌ Late fee check failed:', error);
      }
    });

    console.log('✅ Invoice scheduler started');
    console.log('   📅 Invoice generation: 25th @ 9:00 AM');
    console.log('   📧 Invoice sending: 25th @ 9:05 AM');
    console.log('   💰 Late fee check: Daily @ 6:00 AM');
  }

  /**
   * Stop all scheduled tasks
   */
  stop() {
    if (this.generateTask) {
      this.generateTask.stop();
    }
    if (this.sendTask) {
      this.sendTask.stop();
    }
    if (this.lateFeeTask) {
      this.lateFeeTask.stop();
    }

    console.log('🛑 Invoice scheduler stopped');
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      generateTask: this.generateTask ? 'running' : 'stopped',
      sendTask: this.sendTask ? 'running' : 'stopped',
      lateFeeTask: this.lateFeeTask ? 'running' : 'stopped',
    };
  }
}

// Singleton instance
export const invoiceScheduler = new InvoiceScheduler();
```

**2. Start Scheduler in Server**

Update `src/server.ts`:
```typescript
import { invoiceScheduler } from './services/schedulerService';

// After all middleware and routes are set up, start scheduler
if (process.env.NODE_ENV !== 'test') {
  invoiceScheduler.start();
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  invoiceScheduler.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  invoiceScheduler.stop();
  process.exit(0);
});
```

#### Afternoon Session - Day 5 (4 hours)
**Test Cron Scheduler**

**1. Add Manual Test Endpoint**

Update `src/controllers/invoiceGenerationController.ts`:
```typescript
export const testScheduledGeneration = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    console.log('\n🧪 Testing scheduled invoice generation...\n');

    const now = new Date();
    const targetMonth = now.getMonth() + 1;
    const targetYear = now.getFullYear();

    // Generate
    const invoices = await generateInvoicesForAllTenants(targetMonth, targetYear);

    // Wait 2 seconds
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Send
    const emailCount = await sendInvoicesForMonth(targetMonth, targetYear);

    res.json({
      success: true,
      message: 'Scheduled generation test completed',
      generated: invoices.length,
      sent: emailCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const getSchedulerStatus = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { invoiceScheduler } = await import('../services/schedulerService');
    const status = invoiceScheduler.getStatus();

    res.json({
      success: true,
      scheduler: status,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
```

Add routes:
```typescript
router.post('/test-schedule', testScheduledGeneration);
router.get('/scheduler-status', getSchedulerStatus);
```

**2. Test Scheduler:**
```bash
# Check scheduler status
curl "http://localhost:3001/api/v1/invoice-generation/scheduler-status" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test full scheduled flow
curl -X POST "http://localhost:3001/api/v1/invoice-generation/test-schedule" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Day 5 Checkpoint:**
✅ Cron scheduler implemented
✅ Three scheduled tasks configured
✅ Graceful shutdown handling
✅ Manual testing successful
✅ Backup automation system ready

---

### Day 6: Testing & Documentation (8 hours)

#### Morning Session - Day 6 (4 hours)
**End-to-End Testing**

**1. Create Complete Test Flow**

Create test script (`tests/invoice-flow-test.sh`):
```bash
#!/bin/bash

echo "🧪 Starting Invoice System End-to-End Test"
echo "==========================================="

# Configuration
API_URL="http://localhost:3001"
TOKEN=""

# Step 1: Login
echo "\n1️⃣ Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"landlord@example.com","password":"password123"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')

if [ "$TOKEN" = "null" ]; then
  echo "❌ Login failed"
  exit 1
fi
echo "✅ Login successful"

# Step 2: Generate Invoices
echo "\n2️⃣ Generating invoices..."
GENERATE_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/invoice-generation/generate" \
  -H "Authorization: Bearer $TOKEN")

INVOICE_COUNT=$(echo $GENERATE_RESPONSE | jq '.invoices | length')
echo "✅ Generated $INVOICE_COUNT invoice(s)"

# Step 3: Get First Invoice ID
INVOICE_ID=$(echo $GENERATE_RESPONSE | jq -r '.invoices[0].id')
echo "   Invoice ID: $INVOICE_ID"

# Step 4: Generate PDF
echo "\n3️⃣ Generating PDF..."
curl -s "$API_URL/api/v1/invoice-generation/pdf/$INVOICE_ID" \
  -H "Authorization: Bearer $TOKEN" \
  --output "test-invoice-$INVOICE_ID.pdf"

if [ -f "test-invoice-$INVOICE_ID.pdf" ]; then
  FILE_SIZE=$(ls -lh "test-invoice-$INVOICE_ID.pdf" | awk '{print $5}')
  echo "✅ PDF generated ($FILE_SIZE)"
else
  echo "❌ PDF generation failed"
fi

# Step 5: Send Email
echo "\n4️⃣ Sending invoice email..."
SEND_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/invoice-generation/send/$INVOICE_ID" \
  -H "Authorization: Bearer $TOKEN")

SEND_SUCCESS=$(echo $SEND_RESPONSE | jq -r '.success')
if [ "$SEND_SUCCESS" = "true" ]; then
  echo "✅ Email sent successfully"
else
  echo "❌ Email sending failed"
  echo $SEND_RESPONSE | jq
fi

# Step 6: Verify Invoice Status
echo "\n5️⃣ Verifying invoice status..."
INVOICE_RESPONSE=$(curl -s "$API_URL/api/v1/invoices/$INVOICE_ID" \
  -H "Authorization: Bearer $TOKEN")

STATUS=$(echo $INVOICE_RESPONSE | jq -r '.status')
EMAIL_SENT=$(echo $INVOICE_RESPONSE | jq -r '.emailSent')

echo "   Status: $STATUS"
echo "   Email Sent: $EMAIL_SENT"

if [ "$STATUS" = "sent" ] && [ "$EMAIL_SENT" = "true" ]; then
  echo "✅ Invoice status updated correctly"
else
  echo "⚠️  Invoice status not as expected"
fi

# Step 7: Get Statistics
echo "\n6️⃣ Getting generation statistics..."
STATS_RESPONSE=$(curl -s "$API_URL/api/v1/invoice-generation/stats" \
  -H "Authorization: Bearer $TOKEN")

echo $STATS_RESPONSE | jq

echo "\n==========================================="
echo "✅ End-to-End Test Complete"
echo "==========================================="
```

Make executable:
```bash
chmod +x tests/invoice-flow-test.sh
```

**2. Run Complete Test:**
```bash
# Run test script
./tests/invoice-flow-test.sh
```

#### Afternoon Session - Day 6 (4 hours)
**Documentation**

**1. Update API Documentation (add to Swagger config)**

In `src/config/swagger.ts`, add invoice generation endpoints.

**2. Create Usage Guide (docs/INVOICE_SYSTEM_GUIDE.md)**
```markdown
# Invoice System Usage Guide

## Manual Operations

### Generate Invoices for Current Month
```bash
curl -X POST "https://your-api.com/api/v1/invoice-generation/generate" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Generate for Specific Month
```bash
curl -X POST "https://your-api.com/api/v1/invoice-generation/generate?month=12&year=2025" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Send All Generated Invoices
```bash
curl -X POST "https://your-api.com/api/v1/invoice-generation/send-all" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Apply Late Fees
```bash
curl -X POST "https://your-api.com/api/v1/invoice-generation/late-fees" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Automated Schedule

- **Invoice Generation**: 25th of each month @ 9:00 AM
- **Email Sending**: 25th of each month @ 9:05 AM
- **Late Fee Check**: Daily @ 6:00 AM

## Troubleshooting

### Invoices Not Generated
1. Check scheduler status: `GET /api/v1/invoice-generation/scheduler-status`
2. Verify tenants are active
3. Check logs for errors

### Emails Not Sent
1. Verify SendGrid API key is configured
2. Check SendGrid dashboard for delivery status
3. Verify tenant email addresses are valid
4. Check SENDGRID_SANDBOX_MODE setting

### PDF Not Generated
1. Check pdfkit installation
2. Verify file permissions for invoice directory
3. Check logs for PDF generation errors
```

**3. Create Deployment Checklist**

Create `docs/WEEK_2_DEPLOYMENT_CHECKLIST.md`:
```markdown
# Week 2 Deployment Checklist

## Environment Variables Required

### SendGrid
- [ ] SENDGRID_API_KEY
- [ ] SENDGRID_FROM_EMAIL
- [ ] SENDGRID_FROM_NAME
- [ ] SENDGRID_SANDBOX_MODE (set to false for production)

### Landlord Information
- [ ] LANDLORD_EMAIL
- [ ] LANDLORD_NAME
- [ ] LANDLORD_IBAN

### Backend API
- [ ] BACKEND_API_URL (for Azure Functions)
- [ ] API_KEY (secure key for function authentication)

## Pre-Deployment Tests

- [ ] Generate invoices manually
- [ ] Download PDF and verify format
- [ ] Send test email (sandbox mode)
- [ ] Verify landlord receives CC
- [ ] Test late fee calculation
- [ ] Run end-to-end test script

## Azure Functions Deployment

- [ ] Build function: `npm run build`
- [ ] Test locally: `func start`
- [ ] Deploy to Azure: `func azure functionapp publish <FunctionAppName>`
- [ ] Configure environment variables in Azure Portal
- [ ] Verify function app is running
- [ ] Check Azure Monitor for logs

## Post-Deployment Verification

- [ ] Trigger manual generation via API
- [ ] Check Azure Functions logs
- [ ] Verify emails sent to SendGrid
- [ ] Confirm landlord CC working
- [ ] Test PDF download from production
- [ ] Monitor for 24 hours

## Rollback Plan

If issues occur:
1. Disable Azure Functions timer trigger
2. Stop cron scheduler in server
3. Manual generation only until issues resolved
```

**Day 6 Checkpoint:**
✅ End-to-end testing complete
✅ Test automation script created
✅ Usage guide documented
✅ Deployment checklist ready
✅ All components verified

---

## Week 2 Final Deliverable

**What You Have Now:**
✅ Automated invoice generation service
✅ Professional PDF invoice generator
✅ SendGrid email integration with attachments
✅ Azure Functions for cloud automation
✅ Node-cron backup scheduler
✅ Late fee calculation system
✅ Complete testing suite
✅ Production-ready documentation

**Test Complete System:**
```bash
# Run full end-to-end test
./tests/invoice-flow-test.sh

# Check all systems
curl http://localhost:3001/api/v1/invoice-generation/scheduler-status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Next Week (Part 3):**
Week 3 focuses on payment tracking and reconciliation - automatically matching incoming payments to invoices.

---

## Checklist

**Invoice Generation:**
- [ ] Service implemented
- [ ] Bulk generation working
- [ ] Late fees calculating
- [ ] Statistics endpoint working

**PDF Generation:**
- [ ] PDFKit installed
- [ ] Template created
- [ ] Professional layout
- [ ] Dutch language formatting
- [ ] Download endpoint working

**Email System:**
- [ ] SendGrid configured
- [ ] HTML template created
- [ ] PDF attachment working
- [ ] Landlord CC working
- [ ] Status updating after send

**Automation:**
- [ ] Azure Functions created
- [ ] Timer trigger configured
- [ ] Local testing successful
- [ ] Cron scheduler implemented
- [ ] Backup system ready

**Testing:**
- [ ] Manual testing complete
- [ ] End-to-end script working
- [ ] All edge cases covered
- [ ] Error handling verified

**Documentation:**
- [ ] Usage guide written
- [ ] Deployment checklist created
- [ ] API docs updated
- [ ] Code commented

---

**Hours Logged:** 48 hours
**Status:** ✅ READY TO START
**Dependencies:** Week 1 must be complete
**Ready for:** Part 3 - Payment Tracking & Reconciliation
