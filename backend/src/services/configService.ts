import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

/**
 * Configuration data structure
 */
export interface LandlordConfig {
  companyName: string;
  landlordName: string;
  contactEmail: string;
  contactPhone: string;
  bankName: string;
  bankIban: string;
  invoiceFooterLine1: string;
  invoiceFooterLine2: string;
  currency: string;
  currencySymbol: string;
  paymentTermsDays: number;
  lateFeePercentage: number;
  lateFeeGraceDays: number;
}

/**
 * Secure Configuration Service
 *
 * This service provides controlled access to sensitive configuration data.
 * It reads from the INPUTS folder which is:
 * 1. Git-ignored to prevent committing sensitive data
 * 2. Only accessible through this API (no direct file reads)
 * 3. Provides methods to get specific data without exposing everything
 */
export class ConfigService {
  private config: LandlordConfig | null = null;
  private readonly configPath: string;

  constructor() {
    this.configPath = path.join(process.cwd(), 'INPUTS', 'landlord-config.csv');
  }

  /**
   * Load configuration from CSV file
   * This is called automatically when needed
   */
  private loadConfig(): void {
    try {
      if (!fs.existsSync(this.configPath)) {
        throw new Error(
          `Configuration file not found at ${this.configPath}. ` +
          'Please copy landlord-config.example.csv to landlord-config.csv and fill in your details.'
        );
      }

      const fileContent = fs.readFileSync(this.configPath, 'utf-8');
      const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });

      // Convert CSV rows to config object
      const configMap = new Map<string, string>();
      records.forEach((record: { field: string; value: string }) => {
        configMap.set(record.field, record.value);
      });

      this.config = {
        companyName: configMap.get('company_name') || '',
        landlordName: configMap.get('landlord_name') || '',
        contactEmail: configMap.get('contact_email') || '',
        contactPhone: configMap.get('contact_phone') || '',
        bankName: configMap.get('bank_name') || '',
        bankIban: configMap.get('bank_iban') || '',
        invoiceFooterLine1: configMap.get('invoice_footer_line1') || '',
        invoiceFooterLine2: configMap.get('invoice_footer_line2') || '',
        currency: configMap.get('currency') || 'EUR',
        currencySymbol: configMap.get('currency_symbol') || '€',
        paymentTermsDays: parseInt(configMap.get('payment_terms_days') || '14'),
        lateFeePercentage: parseFloat(configMap.get('late_fee_percentage') || '5'),
        lateFeeGraceDays: parseInt(configMap.get('late_fee_grace_days') || '3')
      };

      console.log('✅ Configuration loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load configuration:', error);
      throw error;
    }
  }

  /**
   * Ensure config is loaded
   */
  private ensureLoaded(): void {
    if (!this.config) {
      this.loadConfig();
    }
  }

  /**
   * Reload configuration from file
   * Useful when the CSV file is updated
   */
  public reload(): void {
    console.log('🔄 Reloading configuration...');
    this.loadConfig();
  }

  /**
   * Get company information for invoices
   * This is safe to expose and doesn't include sensitive banking details
   */
  public getCompanyInfo() {
    this.ensureLoaded();
    return {
      companyName: this.config!.companyName,
      landlordName: this.config!.landlordName,
      contactEmail: this.config!.contactEmail,
      contactPhone: this.config!.contactPhone
    };
  }

  /**
   * Get payment information for invoices
   * SECURITY: This includes sensitive banking information
   * Only use this in secure contexts (PDF generation, internal processing)
   * Never expose this via public API endpoints
   */
  public getPaymentInfo() {
    this.ensureLoaded();
    return {
      bankName: this.config!.bankName,
      bankIban: this.config!.bankIban
    };
  }

  /**
   * Get invoice settings
   */
  public getInvoiceSettings() {
    this.ensureLoaded();
    return {
      currency: this.config!.currency,
      currencySymbol: this.config!.currencySymbol,
      paymentTermsDays: this.config!.paymentTermsDays,
      footerLine1: this.config!.invoiceFooterLine1,
      footerLine2: this.config!.invoiceFooterLine2
    };
  }

  /**
   * Get late fee settings
   */
  public getLateFeeSettings() {
    this.ensureLoaded();
    return {
      percentage: this.config!.lateFeePercentage,
      graceDays: this.config!.lateFeeGraceDays
    };
  }

  /**
   * Get full configuration
   * SECURITY WARNING: This exposes all sensitive data including bank details
   * Only use this for internal operations like PDF generation
   * NEVER expose this via API endpoints
   */
  public getFullConfig(): LandlordConfig {
    this.ensureLoaded();
    return { ...this.config! };
  }

  /**
   * Calculate due date based on invoice date and payment terms
   */
  public calculateDueDate(invoiceDate: Date): Date {
    this.ensureLoaded();
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + this.config!.paymentTermsDays);
    return dueDate;
  }

  /**
   * Check if configuration file exists
   */
  public configExists(): boolean {
    return fs.existsSync(this.configPath);
  }
}

// Export singleton instance
export const configService = new ConfigService();
