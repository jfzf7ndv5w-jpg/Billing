import { PrismaClient, Tenant, Property } from '@prisma/client';
import { createError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

/**
 * Invoice Generation Service
 * Handles automated invoice creation for tenants
 */

export interface InvoiceGenerationOptions {
  tenantId?: number;
  propertyId?: number;
  month?: number;
  year?: number;
  includeLateFees?: boolean;
}

export interface InvoiceLineItem {
  description: string;
  amount: number;
  type: 'rent' | 'service' | 'utilities' | 'other' | 'late_fee' | 'discount';
}

/**
 * Generate invoice for a specific tenant for a specific month
 */
export const generateInvoiceForTenant = async (
  tenant: Tenant & { property: Property },
  month: number,
  year: number
): Promise<any> => {
  try {
    // Calculate invoice date (first day of the month)
    const invoiceDate = new Date(year, month - 1, 1);

    // Calculate due date (15th of the month)
    const dueDate = new Date(year, month - 1, 15);

    // Generate unique invoice number
    const invoiceNumber = generateInvoiceNumber(tenant.id, month, year);

    // Check if invoice already exists for this month
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        tenantId: tenant.id,
        month,
        year
      }
    });

    if (existingInvoice) {
      console.log(`Invoice already exists for tenant ${tenant.id} for ${month}/${year}`);
      return existingInvoice;
    }

    // Get base amounts from tenant record
    const baseRent = parseFloat(tenant.monthlyRent.toString());
    const serviceCharges = parseFloat(tenant.serviceCharges.toString());
    const utilitiesAdvance = parseFloat(tenant.utilitiesAdvance.toString());

    // Calculate total amount
    const totalAmount = baseRent + serviceCharges + utilitiesAdvance;

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        tenantId: tenant.id,
        propertyId: tenant.propertyId,
        invoiceNumber,
        invoiceDate,
        dueDate,
        month,
        year,
        baseRent,
        serviceCharges,
        utilitiesAdvance,
        otherCharges: 0,
        discounts: 0,
        lateFees: 0,
        totalAmount,
        status: 'generated',
        generatedBy: 'automated',
        emailSent: false
      },
      include: {
        tenant: true,
        property: true
      }
    });

    console.log(`✅ Invoice ${invoiceNumber} generated for tenant ${tenant.firstName} ${tenant.lastName}`);

    return invoice;
  } catch (error) {
    console.error('Error generating invoice:', error);
    throw createError('Failed to generate invoice', 500);
  }
};

/**
 * Generate invoices for all active tenants
 */
export const generateInvoicesForAllTenants = async (
  month?: number,
  year?: number
): Promise<any[]> => {
  try {
    // Use current month/year if not specified
    const now = new Date();
    const targetMonth = month || now.getMonth() + 1;
    const targetYear = year || now.getFullYear();

    console.log(`\n🔄 Starting invoice generation for ${targetMonth}/${targetYear}...`);

    // Get all active tenants with their properties
    const activeTenants = await prisma.tenant.findMany({
      where: {
        isActive: true
      },
      include: {
        property: true
      }
    });

    console.log(`📋 Found ${activeTenants.length} active tenant(s)`);

    const invoices = [];
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    // Generate invoice for each tenant
    for (const tenant of activeTenants) {
      try {
        const invoice = await generateInvoiceForTenant(tenant, targetMonth, targetYear);
        invoices.push(invoice);

        if (invoice.status === 'generated') {
          successCount++;
        } else {
          skipCount++;
        }
      } catch (error) {
        console.error(`❌ Failed to generate invoice for tenant ${tenant.id}:`, error);
        errorCount++;
      }
    }

    console.log(`\n📊 Invoice Generation Summary:`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ⏭️  Skipped (already exists): ${skipCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📄 Total invoices: ${invoices.length}\n`);

    return invoices;
  } catch (error) {
    console.error('Error in bulk invoice generation:', error);
    throw createError('Failed to generate invoices', 500);
  }
};

/**
 * Generate invoice number in format: INV-YYYY-MM-TENANTID-XXX
 */
export const generateInvoiceNumber = (
  tenantId: number,
  month: number,
  year: number
): string => {
  const monthStr = month.toString().padStart(2, '0');
  const tenantStr = tenantId.toString().padStart(3, '0');
  const timestamp = Date.now().toString().slice(-3);

  return `INV-${year}-${monthStr}-${tenantStr}-${timestamp}`;
};

/**
 * Calculate late fees for overdue invoices
 */
export const calculateLateFees = async (): Promise<number> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find all unpaid invoices past due date
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        status: {
          in: ['generated', 'sent']
        },
        dueDate: {
          lt: today
        },
        lateFees: 0 // Only process invoices that haven't had late fees applied
      },
      include: {
        tenant: true,
        payments: true
      }
    });

    console.log(`\n💰 Processing late fees for ${overdueInvoices.length} overdue invoice(s)...`);

    let updatedCount = 0;

    for (const invoice of overdueInvoices) {
      // Calculate total paid
      const totalPaid = invoice.payments.reduce(
        (sum, payment) => sum + parseFloat(payment.amount.toString()),
        0
      );

      const totalAmount = parseFloat(invoice.totalAmount.toString());

      // Only apply late fee if invoice is still unpaid
      if (totalPaid < totalAmount) {
        // Calculate days overdue
        const daysOverdue = Math.floor(
          (today.getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24)
        );

        // Late fee: 5% of base rent or €25, whichever is higher
        const baseRent = parseFloat(invoice.baseRent.toString());
        const lateFee = Math.max(baseRent * 0.05, 25);

        // Update invoice with late fee
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            lateFees: lateFee,
            totalAmount: totalAmount + lateFee,
            status: 'overdue'
          }
        });

        console.log(`   ⚠️  Late fee €${lateFee.toFixed(2)} applied to invoice ${invoice.invoiceNumber} (${daysOverdue} days overdue)`);
        updatedCount++;
      }
    }

    console.log(`\n✅ Late fees applied to ${updatedCount} invoice(s)\n`);

    return updatedCount;
  } catch (error) {
    console.error('Error calculating late fees:', error);
    throw createError('Failed to calculate late fees', 500);
  }
};

/**
 * Get invoice generation summary/statistics
 */
export const getInvoiceGenerationStats = async (month: number, year: number): Promise<any> => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: {
        month,
        year
      },
      include: {
        tenant: true,
        payments: true
      }
    });

    const totalInvoices = invoices.length;
    const totalAmount = invoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount.toString()), 0);

    const statusBreakdown = {
      generated: invoices.filter(i => i.status === 'generated').length,
      sent: invoices.filter(i => i.status === 'sent').length,
      paid: invoices.filter(i => i.status === 'paid').length,
      overdue: invoices.filter(i => i.status === 'overdue').length,
      cancelled: invoices.filter(i => i.status === 'cancelled').length
    };

    // Calculate total paid
    const totalPaid = invoices.reduce((sum, inv) => {
      return sum + inv.payments.reduce((pSum, p) => pSum + parseFloat(p.amount.toString()), 0);
    }, 0);

    const outstandingAmount = totalAmount - totalPaid;

    return {
      month,
      year,
      totalInvoices,
      totalAmount,
      totalPaid,
      outstandingAmount,
      statusBreakdown,
      collectionRate: totalAmount > 0 ? ((totalPaid / totalAmount) * 100).toFixed(2) : 0
    };
  } catch (error) {
    console.error('Error getting invoice stats:', error);
    throw createError('Failed to get invoice statistics', 500);
  }
};
