import sgMail from '@sendgrid/mail';
import fs from 'fs';
import path from 'path';
import { Invoice, Tenant, Property } from '@prisma/client';
import { configService } from './configService';

interface InvoiceWithRelations extends Invoice {
  tenant: Tenant & {
    property: Property;
  };
}

/**
 * Email Service for sending invoices and notifications via SendGrid
 */
export class EmailService {
  private isConfigured: boolean = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize SendGrid with API key from environment
   */
  private initialize(): void {
    const apiKey = process.env.SENDGRID_API_KEY;

    if (!apiKey || apiKey === '') {
      console.warn('⚠️  SendGrid API key not configured. Email sending will be simulated.');
      this.isConfigured = false;
      return;
    }

    sgMail.setApiKey(apiKey);
    this.isConfigured = true;
    console.log('✅ SendGrid email service initialized');
  }

  /**
   * Send invoice email with PDF attachment
   */
  async sendInvoiceEmail(
    invoice: InvoiceWithRelations,
    pdfPath: string
  ): Promise<{ sent: boolean; messageId?: string; simulated?: boolean }> {
    try {
      const companyInfo = configService.getCompanyInfo();
      const invoiceSettings = configService.getInvoiceSettings();

      // Read PDF file as base64
      const pdfContent = fs.readFileSync(pdfPath);
      const pdfBase64 = pdfContent.toString('base64');

      // Prepare email data
      const fromEmail = process.env.SENDGRID_FROM_EMAIL || companyInfo.contactEmail;
      const toEmail = invoice.tenant.email;
      const subject = `Invoice ${invoice.invoiceNumber} - ${companyInfo.companyName}`;

      const htmlContent = this.generateInvoiceEmailHTML(invoice, companyInfo);
      const textContent = this.generateInvoiceEmailText(invoice, companyInfo);

      const mailData: sgMail.MailDataRequired = {
        to: toEmail,
        from: fromEmail,
        subject: subject,
        text: textContent,
        html: htmlContent,
        attachments: [
          {
            content: pdfBase64,
            filename: `${invoice.invoiceNumber}.pdf`,
            type: 'application/pdf',
            disposition: 'attachment'
          }
        ]
      };

      // Check if SendGrid is configured
      if (!this.isConfigured) {
        console.log('📧 [SIMULATED] Email would be sent:');
        console.log(`   To: ${toEmail}`);
        console.log(`   From: ${fromEmail}`);
        console.log(`   Subject: ${subject}`);
        console.log(`   Attachment: ${invoice.invoiceNumber}.pdf`);
        return { sent: true, simulated: true };
      }

      // Send email via SendGrid
      const response = await sgMail.send(mailData);

      console.log(`✅ Invoice email sent to ${toEmail}`);
      console.log(`   Invoice: ${invoice.invoiceNumber}`);
      console.log(`   Message ID: ${response[0].headers['x-message-id']}`);

      return {
        sent: true,
        messageId: response[0].headers['x-message-id'] as string
      };
    } catch (error) {
      console.error('❌ Failed to send invoice email:', error);
      throw new Error(`Email sending failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate HTML email content for invoice
   */
  private generateInvoiceEmailHTML(
    invoice: InvoiceWithRelations,
    companyInfo: { companyName: string; landlordName: string; contactEmail: string; contactPhone: string }
  ): string {
    const dueDate = new Date(invoice.dueDate).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    const invoiceDate = new Date(invoice.invoiceDate).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    const invoiceSettings = configService.getInvoiceSettings();
    const amount = `${invoiceSettings.currencySymbol}${parseFloat(invoice.totalAmount.toString()).toFixed(2)}`;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: white;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 3px solid #4CAF50;
    }
    .header h1 {
      color: #2C3E50;
      margin: 0 0 10px 0;
      font-size: 28px;
    }
    .header p {
      color: #7F8C8D;
      margin: 5px 0;
      font-size: 14px;
    }
    .greeting {
      font-size: 18px;
      color: #2C3E50;
      margin-bottom: 20px;
    }
    .invoice-details {
      background-color: #f8f9fa;
      border-left: 4px solid #4CAF50;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .invoice-details table {
      width: 100%;
      border-collapse: collapse;
    }
    .invoice-details td {
      padding: 8px 0;
      border-bottom: 1px solid #e0e0e0;
    }
    .invoice-details td:first-child {
      font-weight: 600;
      color: #555;
      width: 40%;
    }
    .invoice-details td:last-child {
      color: #333;
    }
    .amount {
      font-size: 24px;
      font-weight: bold;
      color: #4CAF50;
    }
    .cta-button {
      display: inline-block;
      background-color: #4CAF50;
      color: white;
      padding: 14px 30px;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
      font-weight: 600;
      text-align: center;
    }
    .cta-button:hover {
      background-color: #45a049;
    }
    .property-info {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .property-info h3 {
      margin: 0 0 10px 0;
      color: #856404;
      font-size: 16px;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      text-align: center;
      color: #7F8C8D;
      font-size: 12px;
    }
    .footer p {
      margin: 5px 0;
    }
    .attachment-notice {
      background-color: #e3f2fd;
      border-left: 4px solid #2196F3;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .attachment-notice strong {
      color: #1565C0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${companyInfo.companyName}</h1>
      <p>${companyInfo.landlordName}</p>
      <p>${companyInfo.contactEmail} | ${companyInfo.contactPhone}</p>
    </div>

    <div class="greeting">
      Dear ${invoice.tenant.firstName} ${invoice.tenant.lastName},
    </div>

    <p>
      Your invoice for <strong>${new Date(invoice.invoiceDate).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</strong>
      is now ready. Please find the details below and the complete invoice attached as a PDF.
    </p>

    <div class="invoice-details">
      <table>
        <tr>
          <td>Invoice Number:</td>
          <td><strong>${invoice.invoiceNumber}</strong></td>
        </tr>
        <tr>
          <td>Invoice Date:</td>
          <td>${invoiceDate}</td>
        </tr>
        <tr>
          <td>Due Date:</td>
          <td><strong>${dueDate}</strong></td>
        </tr>
        <tr>
          <td>Amount Due:</td>
          <td><span class="amount">${amount}</span></td>
        </tr>
      </table>
    </div>

    <div class="property-info">
      <h3>📍 Property</h3>
      <p>
        ${invoice.tenant.property.address}<br>
        ${invoice.tenant.property.postalCode} ${invoice.tenant.property.city}<br>
        ${invoice.tenant.property.country}
      </p>
    </div>

    <div class="attachment-notice">
      <strong>📎 Invoice Attached</strong><br>
      Please find the complete invoice with payment details attached as a PDF file.
    </div>

    <p>
      Please ensure payment is made by <strong>${dueDate}</strong> to avoid late fees.
      The payment details are included in the attached PDF invoice.
    </p>

    <p>
      If you have any questions about this invoice, please don't hesitate to contact us.
    </p>

    <div class="footer">
      <p>Thank you for your business!</p>
      <p>${companyInfo.companyName}</p>
      <p>${companyInfo.contactEmail}</p>
      <p style="margin-top: 15px; font-size: 11px; color: #999;">
        This is an automated email. Please do not reply directly to this message.
      </p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Generate plain text email content for invoice
   */
  private generateInvoiceEmailText(
    invoice: InvoiceWithRelations,
    companyInfo: { companyName: string; landlordName: string; contactEmail: string; contactPhone: string }
  ): string {
    const dueDate = new Date(invoice.dueDate).toLocaleDateString('en-GB');
    const invoiceDate = new Date(invoice.invoiceDate).toLocaleDateString('en-GB');
    const invoiceSettings = configService.getInvoiceSettings();
    const amount = `${invoiceSettings.currencySymbol}${parseFloat(invoice.totalAmount.toString()).toFixed(2)}`;

    return `
${companyInfo.companyName}
${companyInfo.landlordName}
${companyInfo.contactEmail} | ${companyInfo.contactPhone}

────────────────────────────────────────────────────────

Dear ${invoice.tenant.firstName} ${invoice.tenant.lastName},

Your invoice for ${new Date(invoice.invoiceDate).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })} is now ready.

INVOICE DETAILS:
────────────────────────────────────────────────────────
Invoice Number:  ${invoice.invoiceNumber}
Invoice Date:    ${invoiceDate}
Due Date:        ${dueDate}
Amount Due:      ${amount}

PROPERTY:
────────────────────────────────────────────────────────
${invoice.tenant.property.address}
${invoice.tenant.property.postalCode} ${invoice.tenant.property.city}
${invoice.tenant.property.country}

────────────────────────────────────────────────────────

Please find the complete invoice with payment details attached as a PDF file.

Please ensure payment is made by ${dueDate} to avoid late fees.

If you have any questions about this invoice, please don't hesitate to contact us.

Thank you for your business!

${companyInfo.companyName}
${companyInfo.contactEmail}

────────────────────────────────────────────────────────
This is an automated email. Please do not reply directly to this message.
    `.trim();
  }

  /**
   * Send payment reminder email
   */
  async sendPaymentReminder(
    invoice: InvoiceWithRelations,
    daysOverdue: number
  ): Promise<{ sent: boolean; messageId?: string; simulated?: boolean }> {
    try {
      const companyInfo = configService.getCompanyInfo();
      const fromEmail = process.env.SENDGRID_FROM_EMAIL || companyInfo.contactEmail;
      const toEmail = invoice.tenant.email;
      const subject = `Payment Reminder: Invoice ${invoice.invoiceNumber} (${daysOverdue} days overdue)`;

      const htmlContent = this.generateReminderEmailHTML(invoice, companyInfo, daysOverdue);
      const textContent = this.generateReminderEmailText(invoice, companyInfo, daysOverdue);

      const mailData: sgMail.MailDataRequired = {
        to: toEmail,
        from: fromEmail,
        subject: subject,
        text: textContent,
        html: htmlContent
      };

      if (!this.isConfigured) {
        console.log('📧 [SIMULATED] Payment reminder would be sent:');
        console.log(`   To: ${toEmail}`);
        console.log(`   Subject: ${subject}`);
        return { sent: true, simulated: true };
      }

      const response = await sgMail.send(mailData);
      console.log(`✅ Payment reminder sent to ${toEmail}`);

      return {
        sent: true,
        messageId: response[0].headers['x-message-id'] as string
      };
    } catch (error) {
      console.error('❌ Failed to send payment reminder:', error);
      throw new Error(`Email sending failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate HTML for payment reminder
   */
  private generateReminderEmailHTML(
    invoice: InvoiceWithRelations,
    companyInfo: { companyName: string; landlordName: string; contactEmail: string; contactPhone: string },
    daysOverdue: number
  ): string {
    const invoiceSettings = configService.getInvoiceSettings();
    const amount = `${invoiceSettings.currencySymbol}${parseFloat(invoice.totalAmount.toString()).toFixed(2)}`;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .urgent { background-color: #fff3cd; border-left: 4px solid #ff9800; padding: 20px; margin: 20px 0; }
    .amount { font-size: 24px; font-weight: bold; color: #f44336; }
  </style>
</head>
<body>
  <h2>Payment Reminder</h2>
  <div class="urgent">
    <p><strong>⚠️ This invoice is ${daysOverdue} days overdue</strong></p>
    <p>Invoice: ${invoice.invoiceNumber}</p>
    <p>Amount Due: <span class="amount">${amount}</span></p>
  </div>
  <p>Please arrange payment as soon as possible to avoid additional late fees.</p>
  <p>If you have already made this payment, please disregard this reminder.</p>
  <p>Contact: ${companyInfo.contactEmail}</p>
</body>
</html>
    `.trim();
  }

  /**
   * Generate plain text for payment reminder
   */
  private generateReminderEmailText(
    invoice: InvoiceWithRelations,
    companyInfo: { companyName: string; landlordName: string; contactEmail: string; contactPhone: string },
    daysOverdue: number
  ): string {
    const invoiceSettings = configService.getInvoiceSettings();
    const amount = `${invoiceSettings.currencySymbol}${parseFloat(invoice.totalAmount.toString()).toFixed(2)}`;

    return `
PAYMENT REMINDER

⚠️ This invoice is ${daysOverdue} days overdue

Invoice: ${invoice.invoiceNumber}
Amount Due: ${amount}

Please arrange payment as soon as possible to avoid additional late fees.

If you have already made this payment, please disregard this reminder.

Contact: ${companyInfo.contactEmail}
    `.trim();
  }

  /**
   * Check if email service is configured
   */
  isReady(): boolean {
    return this.isConfigured;
  }
}

// Export singleton instance
export const emailService = new EmailService();
