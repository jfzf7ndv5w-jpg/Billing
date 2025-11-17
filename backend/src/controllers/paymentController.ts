import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

/**
 * Get all payments
 * TODO: Add filtering by tenant, property, date range, payment method
 */
export const getAllPayments = async (req: AuthRequest, res: Response) => {
  try {
    const payments = await prisma.payment.findMany({
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
        invoice: {
          select: {
            id: true,
            invoiceDate: true,
            totalAmount: true,
            status: true
          }
        }
      },
      orderBy: {
        paymentDate: 'desc'
      }
    });

    res.json({
      payments,
      total: payments.length
    });
  } catch (error) {
    throw createError('Failed to fetch payments', 500);
  }
};

/**
 * Get single payment by ID
 */
export const getPaymentById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const paymentId = parseInt(id);

    if (isNaN(paymentId)) {
      throw createError('Invalid payment ID', 400);
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        tenant: {
          include: {
            property: true
          }
        },
        invoice: true
      }
    });

    if (!payment) {
      throw createError('Payment not found', 404);
    }

    res.json(payment);
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      throw error;
    }
    throw createError('Failed to fetch payment', 500);
  }
};

/**
 * Record new payment
 * TODO: Implement automatic invoice reconciliation
 * TODO: Handle partial payments
 * TODO: Handle overpayments and credit application
 */
export const createPayment = async (req: AuthRequest, res: Response) => {
  try {
    const {
      tenantId,
      invoiceId,
      amount,
      paymentDate,
      paymentMethod,
      paymentReference,
      bankTransactionId,
      notes
    } = req.body;

    // Validation
    if (!tenantId || !amount || !paymentDate || !paymentMethod) {
      throw createError('Missing required fields: tenantId, amount, paymentDate, paymentMethod', 400);
    }

    // Verify tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });

    if (!tenant) {
      throw createError('Tenant not found', 404);
    }

    // If invoice ID provided, verify it exists and belongs to tenant
    if (invoiceId) {
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId }
      });

      if (!invoice) {
        throw createError('Invoice not found', 404);
      }

      if (invoice.tenantId !== tenantId) {
        throw createError('Invoice does not belong to specified tenant', 400);
      }
    }

    // Create payment
    const payment = await prisma.payment.create({
      data: {
        tenantId,
        invoiceId,
        amount,
        paymentDate: new Date(paymentDate),
        paymentMethod,
        paymentReference,
        bankTransactionId,
        notes
      },
      include: {
        tenant: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        invoice: true
      }
    });

    // TODO: Update invoice status based on total payments
    if (invoiceId) {
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          payments: true
        }
      });

      if (invoice) {
        // Calculate total paid from all payments
        const totalPaid = invoice.payments.reduce(
          (sum, p) => sum + parseFloat(p.amount.toString()),
          0
        );
        const totalAmount = parseFloat(invoice.totalAmount.toString());

        // Update invoice status based on payments
        const newStatus =
          totalPaid >= totalAmount
            ? 'paid'
            : totalPaid > 0
            ? 'sent' // partially paid but keep as sent
            : invoice.status;

        if (totalPaid >= totalAmount) {
          await prisma.invoice.update({
            where: { id: invoiceId },
            data: {
              status: newStatus,
              paidDate: new Date()
            }
          });
        }
      }
    }

    res.status(201).json({
      message: 'Payment recorded successfully',
      payment
    });
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      throw error;
    }
    throw createError('Failed to record payment', 500);
  }
};

/**
 * Update payment
 * TODO: Add validation for amount changes and invoice reconciliation
 */
export const updatePayment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const paymentId = parseInt(id);

    if (isNaN(paymentId)) {
      throw createError('Invalid payment ID', 400);
    }

    const {
      amount,
      paymentDate,
      paymentMethod,
      paymentReference,
      bankTransactionId,
      notes
    } = req.body;

    // Check if payment exists
    const existingPayment = await prisma.payment.findUnique({
      where: { id: paymentId }
    });

    if (!existingPayment) {
      throw createError('Payment not found', 404);
    }

    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        ...(amount && { amount }),
        ...(paymentDate && { paymentDate: new Date(paymentDate) }),
        ...(paymentMethod && { paymentMethod }),
        ...(paymentReference !== undefined && { paymentReference }),
        ...(bankTransactionId !== undefined && { bankTransactionId }),
        ...(notes !== undefined && { notes })
      }
    });

    res.json({
      message: 'Payment updated successfully',
      payment
    });
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      throw error;
    }
    throw createError('Failed to update payment', 500);
  }
};

/**
 * Delete payment
 * TODO: Implement invoice reconciliation rollback
 */
export const deletePayment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const paymentId = parseInt(id);

    if (isNaN(paymentId)) {
      throw createError('Invalid payment ID', 400);
    }

    const existingPayment = await prisma.payment.findUnique({
      where: { id: paymentId }
    });

    if (!existingPayment) {
      throw createError('Payment not found', 404);
    }

    await prisma.payment.delete({
      where: { id: paymentId }
    });

    res.json({
      message: 'Payment deleted successfully'
    });
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      throw error;
    }
    throw createError('Failed to delete payment', 500);
  }
};

/**
 * Get payment statistics
 * TODO: Add date range filtering and more detailed analytics
 */
export const getPaymentStats = async (req: AuthRequest, res: Response) => {
  try {
    const payments = await prisma.payment.findMany();

    const stats = {
      total: payments.length,
      totalAmount: payments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0),
      byMethod: {
        bank_transfer: payments.filter(p => p.paymentMethod === 'bank_transfer').length,
        cash: payments.filter(p => p.paymentMethod === 'cash').length,
        check: payments.filter(p => p.paymentMethod === 'check').length,
        card: payments.filter(p => p.paymentMethod === 'card').length,
        other: payments.filter(p => p.paymentMethod === 'other').length
      },
      lastPayment: payments.length > 0 ? payments[payments.length - 1].paymentDate : null
    };

    res.json(stats);
  } catch (error) {
    throw createError('Failed to fetch payment statistics', 500);
  }
};
