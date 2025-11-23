import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { Invoice, Tenant, Property } from '@prisma/client';

interface InvoiceWithRelations extends Invoice {
  tenant: Tenant & {
    property: Property;
  };
}

/**
 * PDF Service for generating professional invoice PDFs
 */
export class PDFService {
  private readonly outputDir: string;

  constructor() {
    // Create PDFs directory if it doesn't exist
    this.outputDir = path.join(process.cwd(), 'pdfs');
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Generate PDF invoice
   * @param invoice Invoice with tenant and property relations
   * @returns Path to generated PDF file
   */
  async generateInvoicePDF(invoice: InvoiceWithRelations): Promise<string> {
    const filename = `${invoice.invoiceNumber}.pdf`;
    const filepath = path.join(this.outputDir, filename);

    return new Promise((resolve, reject) => {
      try {
        // Create a document
        const doc = new PDFDocument({
          size: 'A4',
          margins: {
            top: 50,
            bottom: 50,
            left: 50,
            right: 50
          }
        });

        // Pipe to file
        const writeStream = fs.createWriteStream(filepath);
        doc.pipe(writeStream);

        // Build the PDF
        this.addHeader(doc, invoice);
        this.addInvoiceInfo(doc, invoice);
        this.addBillingAddresses(doc, invoice);
        this.addLineItems(doc, invoice);
        this.addTotals(doc, invoice);
        this.addPaymentInfo(doc, invoice);
        this.addFooter(doc);

        // Finalize PDF
        doc.end();

        writeStream.on('finish', () => {
          console.log(`✅ PDF generated: ${filename}`);
          resolve(filepath);
        });

        writeStream.on('error', (error) => {
          console.error(`❌ PDF generation error: ${error.message}`);
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Add header with logo and company info
   */
  private addHeader(doc: PDFKit.PDFDocument, invoice: InvoiceWithRelations): void {
    // Company name (larger, bold)
    doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .text('De Vries Property Management', 50, 50);

    // Company details
    doc
      .fontSize(10)
      .font('Helvetica')
      .text('Landlord: Lennart & Saskia de Vries', 50, 85)
      .text('Email: landlord@example.com', 50, 100)
      .text('Phone: +31 6 1234 5678', 50, 115);

    // Invoice title (right aligned)
    doc
      .fontSize(28)
      .font('Helvetica-Bold')
      .text('INVOICE', 400, 50, { align: 'right' });

    // Horizontal line
    doc
      .moveTo(50, 140)
      .lineTo(545, 140)
      .stroke();
  }

  /**
   * Add invoice information (number, date, due date)
   */
  private addInvoiceInfo(doc: PDFKit.PDFDocument, invoice: InvoiceWithRelations): void {
    const yPos = 160;

    doc.fontSize(10).font('Helvetica-Bold');

    // Labels (left column)
    doc
      .text('Invoice Number:', 50, yPos)
      .text('Invoice Date:', 50, yPos + 15)
      .text('Due Date:', 50, yPos + 30)
      .text('Period:', 50, yPos + 45);

    // Values (right column)
    doc.font('Helvetica');
    doc
      .text(invoice.invoiceNumber, 150, yPos)
      .text(this.formatDate(invoice.invoiceDate), 150, yPos + 15)
      .text(this.formatDate(invoice.dueDate), 150, yPos + 30)
      .text(this.formatPeriod(invoice.month, invoice.year), 150, yPos + 45);

    // Status badge
    const statusColor = this.getStatusColor(invoice.status);
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor(statusColor)
      .text(invoice.status.toUpperCase(), 400, yPos, { align: 'right' })
      .fillColor('black');
  }

  /**
   * Add billing addresses
   */
  private addBillingAddresses(doc: PDFKit.PDFDocument, invoice: InvoiceWithRelations): void {
    const yPos = 240;

    // Bill To section
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('BILL TO:', 50, yPos);

    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`${invoice.tenant.firstName} ${invoice.tenant.lastName}`, 50, yPos + 20)
      .text(invoice.tenant.email, 50, yPos + 35)
      .text(invoice.tenant.phone || '', 50, yPos + 50);

    // Property Address section
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('PROPERTY:', 320, yPos);

    doc
      .fontSize(10)
      .font('Helvetica')
      .text(invoice.tenant.property.address, 320, yPos + 20)
      .text(`${invoice.tenant.property.postalCode} ${invoice.tenant.property.city}`, 320, yPos + 35)
      .text(invoice.tenant.property.country, 320, yPos + 50);
  }

  /**
   * Add line items table
   */
  private addLineItems(doc: PDFKit.PDFDocument, invoice: InvoiceWithRelations): void {
    const tableTop = 350;
    const itemHeight = 25;

    // Table header
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#333333');

    this.drawTableRow(
      doc,
      tableTop,
      'Description',
      'Quantity',
      'Unit Price',
      'Amount',
      true
    );

    // Table line
    doc
      .moveTo(50, tableTop + 15)
      .lineTo(545, tableTop + 15)
      .stroke();

    let yPos = tableTop + itemHeight;

    // Line items
    doc.font('Helvetica').fillColor('black');

    // Base Rent
    if (parseFloat(invoice.baseRent.toString()) > 0) {
      this.drawTableRow(
        doc,
        yPos,
        'Monthly Rent',
        '1',
        this.formatCurrency(invoice.baseRent),
        this.formatCurrency(invoice.baseRent)
      );
      yPos += itemHeight;
    }

    // Service Charges
    if (parseFloat(invoice.serviceCharges.toString()) > 0) {
      this.drawTableRow(
        doc,
        yPos,
        'Service Charges',
        '1',
        this.formatCurrency(invoice.serviceCharges),
        this.formatCurrency(invoice.serviceCharges)
      );
      yPos += itemHeight;
    }

    // Utilities Advance
    if (parseFloat(invoice.utilitiesAdvance.toString()) > 0) {
      this.drawTableRow(
        doc,
        yPos,
        'Utilities Advance',
        '1',
        this.formatCurrency(invoice.utilitiesAdvance),
        this.formatCurrency(invoice.utilitiesAdvance)
      );
      yPos += itemHeight;
    }

    // Other Charges
    if (parseFloat(invoice.otherCharges.toString()) > 0) {
      this.drawTableRow(
        doc,
        yPos,
        'Other Charges',
        '1',
        this.formatCurrency(invoice.otherCharges),
        this.formatCurrency(invoice.otherCharges)
      );
      yPos += itemHeight;
    }

    // Discounts (if any)
    if (parseFloat(invoice.discounts.toString()) > 0) {
      this.drawTableRow(
        doc,
        yPos,
        'Discount',
        '1',
        `-${this.formatCurrency(invoice.discounts)}`,
        `-${this.formatCurrency(invoice.discounts)}`
      );
      yPos += itemHeight;
    }

    // Late Fees (if any)
    if (parseFloat(invoice.lateFees.toString()) > 0) {
      doc.fillColor('#D32F2F'); // Red for late fees
      this.drawTableRow(
        doc,
        yPos,
        'Late Payment Fee',
        '1',
        this.formatCurrency(invoice.lateFees),
        this.formatCurrency(invoice.lateFees)
      );
      doc.fillColor('black');
      yPos += itemHeight;
    }

    // Bottom line
    doc
      .moveTo(50, yPos + 5)
      .lineTo(545, yPos + 5)
      .stroke();
  }

  /**
   * Add totals section
   */
  private addTotals(doc: PDFKit.PDFDocument, invoice: InvoiceWithRelations): void {
    const yPos = 550;

    // Subtotal
    const subtotal = parseFloat(invoice.baseRent.toString()) +
      parseFloat(invoice.serviceCharges.toString()) +
      parseFloat(invoice.utilitiesAdvance.toString()) +
      parseFloat(invoice.otherCharges.toString());

    doc
      .fontSize(10)
      .font('Helvetica')
      .text('Subtotal:', 380, yPos, { align: 'right' })
      .text(this.formatCurrency(subtotal), 480, yPos, { align: 'right' });

    // Discounts
    if (parseFloat(invoice.discounts.toString()) > 0) {
      doc
        .text('Discount:', 380, yPos + 20, { align: 'right' })
        .text(`-${this.formatCurrency(invoice.discounts)}`, 480, yPos + 20, { align: 'right' });
    }

    // Late Fees
    if (parseFloat(invoice.lateFees.toString()) > 0) {
      doc
        .fillColor('#D32F2F')
        .text('Late Fee:', 380, yPos + 40, { align: 'right' })
        .text(this.formatCurrency(invoice.lateFees), 480, yPos + 40, { align: 'right' })
        .fillColor('black');
    }

    // Total (bold, larger)
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('TOTAL:', 380, yPos + 60, { align: 'right' })
      .text(this.formatCurrency(invoice.totalAmount), 480, yPos + 60, { align: 'right' });

    // Box around total
    doc
      .rect(370, yPos + 55, 175, 25)
      .stroke();
  }

  /**
   * Add payment information
   */
  private addPaymentInfo(doc: PDFKit.PDFDocument, invoice: InvoiceWithRelations): void {
    const yPos = 650;

    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('PAYMENT INFORMATION', 50, yPos);

    doc
      .fontSize(10)
      .font('Helvetica')
      .text('Please transfer the amount to:', 50, yPos + 25)
      .text('Bank: ING Bank', 50, yPos + 40)
      .text('IBAN: NL12 INGB 0001 2345 67', 50, yPos + 55)
      .text('Reference: ' + invoice.invoiceNumber, 50, yPos + 70)
      .font('Helvetica-Bold')
      .text('Please include the invoice number in the payment reference.', 50, yPos + 90);

    // Due date reminder
    const daysUntilDue = Math.ceil(
      (new Date(invoice.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilDue > 0) {
      doc
        .fillColor('#1976D2')
        .font('Helvetica-Bold')
        .text(`Payment due in ${daysUntilDue} days`, 50, yPos + 110)
        .fillColor('black');
    } else if (daysUntilDue < 0) {
      doc
        .fillColor('#D32F2F')
        .font('Helvetica-Bold')
        .text(`OVERDUE by ${Math.abs(daysUntilDue)} days!`, 50, yPos + 110)
        .fillColor('black');
    }
  }

  /**
   * Add footer
   */
  private addFooter(doc: PDFKit.PDFDocument): void {
    const footerY = 750;

    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#666666')
      .text(
        'Thank you for your business. For questions, please contact landlord@example.com',
        50,
        footerY,
        { align: 'center', width: 495 }
      )
      .text(
        'This is a computer-generated invoice and does not require a signature.',
        50,
        footerY + 15,
        { align: 'center', width: 495 }
      );

    // Page number
    doc.text(
      `Page 1 of 1`,
      0,
      footerY + 30,
      { align: 'center' }
    );
  }

  /**
   * Draw a table row
   */
  private drawTableRow(
    doc: PDFKit.PDFDocument,
    y: number,
    description: string,
    quantity: string,
    unitPrice: string,
    amount: string,
    isHeader: boolean = false
  ): void {
    const font = isHeader ? 'Helvetica-Bold' : 'Helvetica';

    doc
      .font(font)
      .text(description, 50, y, { width: 250 })
      .text(quantity, 310, y, { width: 50, align: 'right' })
      .text(unitPrice, 370, y, { width: 80, align: 'right' })
      .text(amount, 460, y, { width: 85, align: 'right' });
  }

  /**
   * Format date to DD-MM-YYYY
   */
  private formatDate(date: Date): string {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  /**
   * Format period (month/year)
   */
  private formatPeriod(month: number, year: number): string {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${months[month - 1]} ${year}`;
  }

  /**
   * Format currency (EUR)
   */
  private formatCurrency(amount: number | string | any): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : typeof amount === 'number' ? amount : parseFloat(amount.toString());
    return `€${num.toFixed(2)}`;
  }

  /**
   * Get status color
   */
  private getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'paid':
        return '#4CAF50'; // Green
      case 'overdue':
        return '#D32F2F'; // Red
      case 'sent':
        return '#1976D2'; // Blue
      case 'generated':
        return '#FF9800'; // Orange
      case 'cancelled':
        return '#757575'; // Grey
      default:
        return '#000000'; // Black
    }
  }

  /**
   * Get PDF file path
   */
  getPDFPath(invoiceNumber: string): string {
    return path.join(this.outputDir, `${invoiceNumber}.pdf`);
  }

  /**
   * Check if PDF exists
   */
  pdfExists(invoiceNumber: string): boolean {
    return fs.existsSync(this.getPDFPath(invoiceNumber));
  }

  /**
   * Delete PDF file
   */
  deletePDF(invoiceNumber: string): boolean {
    const filepath = this.getPDFPath(invoiceNumber);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      return true;
    }
    return false;
  }
}

// Export singleton instance
export const pdfService = new PDFService();
