import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import {
  generateInvoicesForAllTenants,
  calculateLateFees,
  getInvoiceGenerationStats
} from '../services/invoiceService';

const prisma = new PrismaClient();

/**
 * Get all invoices
 * TODO: Add filtering by tenant, property, date range, status
 */
export const getAllInvoices = async (req: AuthRequest, res: Response) => {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            property: {
              select: {
                address: true,
                city: true
              }
            }
          }
        },
        payments: {
          select: {
            id: true,
            amount: true,
            paymentDate: true,
            paymentMethod: true
          }
        }
      },
      orderBy: {
        invoiceDate: 'desc'
      }
    });

    res.json({
      invoices,
      total: invoices.length
    });
  } catch (error) {
    throw createError('Failed to fetch invoices', 500);
  }
};

/**
 * Get single invoice by ID
 */
export const getInvoiceById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const invoiceId = parseInt(id);

    if (isNaN(invoiceId)) {
      throw createError('Invalid invoice ID', 400);
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        tenant: {
          include: {
            property: true
          }
        },
        payments: {
          orderBy: {
            paymentDate: 'desc'
          }
        }
      }
    });

    if (!invoice) {
      throw createError('Invoice not found', 404);
    }

    res.json(invoice);
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      throw error;
    }
    throw createError('Failed to fetch invoice', 500);
  }
};

/**
 * Create new invoice
 * TODO: Implement automated invoice generation logic
 */
export const createInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const {
      tenantId,
      propertyId,
      invoiceDate,
      dueDate,
      invoiceNumber,
      month,
      year,
      baseRent,
      serviceCharges,
      utilitiesAdvance,
      otherCharges,
      discounts,
      lateFees,
      notes
    } = req.body;

    // Validation
    if (!tenantId || !propertyId || !invoiceDate || !dueDate || !baseRent) {
      throw createError('Missing required fields: tenantId, propertyId, invoiceDate, dueDate, baseRent', 400);
    }

    // Verify tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });

    if (!tenant) {
      throw createError('Tenant not found', 404);
    }

    // Calculate total amount
    const totalAmount =
      parseFloat(baseRent) +
      (serviceCharges ? parseFloat(serviceCharges) : 0) +
      (utilitiesAdvance ? parseFloat(utilitiesAdvance) : 0) +
      (otherCharges ? parseFloat(otherCharges) : 0) +
      (lateFees ? parseFloat(lateFees) : 0) -
      (discounts ? parseFloat(discounts) : 0);

    // Generate invoice number if not provided
    const generatedInvoiceNumber = invoiceNumber || `INV-${Date.now()}`;

    // Get month/year from invoiceDate if not provided
    const invoiceDateObj = new Date(invoiceDate);
    const invoiceMonth = month || invoiceDateObj.getMonth() + 1;
    const invoiceYear = year || invoiceDateObj.getFullYear();

    const invoice = await prisma.invoice.create({
      data: {
        tenantId,
        propertyId,
        invoiceNumber: generatedInvoiceNumber,
        invoiceDate: invoiceDateObj,
        dueDate: new Date(dueDate),
        month: invoiceMonth,
        year: invoiceYear,
        baseRent,
        serviceCharges: serviceCharges || 0,
        utilitiesAdvance: utilitiesAdvance || 0,
        otherCharges: otherCharges || 0,
        discounts: discounts || 0,
        lateFees: lateFees || 0,
        totalAmount,
        status: 'generated',
        notes
      },
      include: {
        tenant: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Invoice created successfully',
      invoice
    });
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      throw error;
    }
    throw createError('Failed to create invoice', 500);
  }
};

/**
 * Update invoice
 * TODO: Add validation for status transitions
 */
export const updateInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const invoiceId = parseInt(id);

    if (isNaN(invoiceId)) {
      throw createError('Invalid invoice ID', 400);
    }

    const {
      baseRent,
      serviceCharges,
      utilitiesAdvance,
      otherCharges,
      discounts,
      lateFees,
      status,
      notes
    } = req.body;

    // Check if invoice exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id: invoiceId }
    });

    if (!existingInvoice) {
      throw createError('Invoice not found', 404);
    }

    // Recalculate total if amounts changed
    let totalAmount = parseFloat(existingInvoice.totalAmount.toString());
    if (baseRent || serviceCharges || utilitiesAdvance || otherCharges || discounts || lateFees) {
      totalAmount =
        (baseRent ? parseFloat(baseRent) : parseFloat(existingInvoice.baseRent.toString())) +
        (serviceCharges !== undefined ? parseFloat(serviceCharges) : parseFloat(existingInvoice.serviceCharges.toString())) +
        (utilitiesAdvance !== undefined ? parseFloat(utilitiesAdvance) : parseFloat(existingInvoice.utilitiesAdvance.toString())) +
        (otherCharges !== undefined ? parseFloat(otherCharges) : parseFloat(existingInvoice.otherCharges.toString())) +
        (lateFees !== undefined ? parseFloat(lateFees) : parseFloat(existingInvoice.lateFees.toString())) -
        (discounts !== undefined ? parseFloat(discounts) : parseFloat(existingInvoice.discounts.toString()));
    }

    const invoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        ...(baseRent && { baseRent }),
        ...(serviceCharges !== undefined && { serviceCharges }),
        ...(utilitiesAdvance !== undefined && { utilitiesAdvance }),
        ...(otherCharges !== undefined && { otherCharges }),
        ...(discounts !== undefined && { discounts }),
        ...(lateFees !== undefined && { lateFees }),
        totalAmount,
        ...(status && { status }),
        ...(notes !== undefined && { notes })
      }
    });

    res.json({
      message: 'Invoice updated successfully',
      invoice
    });
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      throw error;
    }
    throw createError('Failed to update invoice', 500);
  }
};

/**
 * Send invoice via email
 * TODO: Implement email sending functionality
 */
export const sendInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const invoiceId = parseInt(id);

    if (isNaN(invoiceId)) {
      throw createError('Invalid invoice ID', 400);
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        tenant: true
      }
    });

    if (!invoice) {
      throw createError('Invoice not found', 404);
    }

    // TODO: Implement actual email sending
    // For now, just update the status
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'sent'
      }
    });

    res.json({
      message: 'Invoice sent successfully',
      recipient: invoice.tenant.email,
      invoiceId: invoice.id
    });
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      throw error;
    }
    throw createError('Failed to send invoice', 500);
  }
};

/**
 * Get invoice statistics
 * TODO: Add more detailed analytics
 */
export const getInvoiceStats = async (req: AuthRequest, res: Response) => {
  try {
    const invoices = await prisma.invoice.findMany();

    const stats = {
      total: invoices.length,
      generated: invoices.filter(i => i.status === 'generated').length,
      sent: invoices.filter(i => i.status === 'sent').length,
      paid: invoices.filter(i => i.status === 'paid').length,
      overdue: invoices.filter(i => i.status === 'overdue').length,
      cancelled: invoices.filter(i => i.status === 'cancelled').length,
      totalAmount: invoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount.toString()), 0)
    };

    res.json(stats);
  } catch (error) {
    throw createError('Failed to fetch invoice statistics', 500);
  }
};

/**
 * Generate invoices for all active tenants
 * POST /api/v1/invoices/generate
 */
export const generateInvoices = async (req: AuthRequest, res: Response) => {
  try {
    const { month, year } = req.body;

    // Validate month/year if provided
    if (month && (month < 1 || month > 12)) {
      throw createError('Invalid month. Must be between 1 and 12', 400);
    }

    if (year && year < 2000) {
      throw createError('Invalid year', 400);
    }

    const invoices = await generateInvoicesForAllTenants(month, year);

    res.status(201).json({
      message: 'Invoice generation completed',
      invoices,
      summary: {
        total: invoices.length,
        generated: invoices.filter(i => i.status === 'generated').length,
        skipped: invoices.filter(i => i.status !== 'generated').length
      }
    });
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      throw error;
    }
    throw createError('Failed to generate invoices', 500);
  }
};

/**
 * Calculate and apply late fees to overdue invoices
 * POST /api/v1/invoices/calculate-late-fees
 */
export const applyLateFees = async (req: AuthRequest, res: Response) => {
  try {
    const updatedCount = await calculateLateFees();

    res.json({
      message: 'Late fee calculation completed',
      updatedInvoices: updatedCount
    });
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      throw error;
    }
    throw createError('Failed to calculate late fees', 500);
  }
};

/**
 * Get invoice generation statistics for a specific month
 * GET /api/v1/invoices/generation-stats?month=X&year=Y
 */
export const getGenerationStats = async (req: AuthRequest, res: Response) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      throw createError('Month and year query parameters are required', 400);
    }

    const monthNum = parseInt(month as string);
    const yearNum = parseInt(year as string);

    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      throw createError('Invalid month', 400);
    }

    if (isNaN(yearNum)) {
      throw createError('Invalid year', 400);
    }

    const stats = await getInvoiceGenerationStats(monthNum, yearNum);

    res.json(stats);
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      throw error;
    }
    throw createError('Failed to fetch generation statistics', 500);
  }
};
