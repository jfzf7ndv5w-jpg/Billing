import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireLandlordOrAdmin } from '../middleware/rbac';
import {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  sendInvoice,
  getInvoiceStats,
  generateInvoices,
  applyLateFees,
  getGenerationStats,
  generateInvoicePDF,
  downloadInvoicePDF
} from '../controllers/invoiceController';

const router = Router();

// All routes require authentication and landlord/admin role
router.use(authenticate);
router.use(requireLandlordOrAdmin);

/**
 * @route   GET /api/v1/invoices
 * @desc    Get all invoices
 * @access  Private
 */
router.get('/', getAllInvoices);

/**
 * @route   GET /api/v1/invoices/stats
 * @desc    Get invoice statistics
 * @access  Private
 */
router.get('/stats', getInvoiceStats);

/**
 * @route   GET /api/v1/invoices/generation-stats
 * @desc    Get invoice generation statistics for a specific month
 * @access  Private
 */
router.get('/generation-stats', getGenerationStats);

/**
 * @route   POST /api/v1/invoices/generate
 * @desc    Generate invoices for all active tenants
 * @access  Private
 */
router.post('/generate', generateInvoices);

/**
 * @route   POST /api/v1/invoices/calculate-late-fees
 * @desc    Calculate and apply late fees to overdue invoices
 * @access  Private
 */
router.post('/calculate-late-fees', applyLateFees);

/**
 * @route   GET /api/v1/invoices/:id
 * @desc    Get single invoice by ID
 * @access  Private
 */
router.get('/:id', getInvoiceById);

/**
 * @route   POST /api/v1/invoices
 * @desc    Create new invoice
 * @access  Private
 */
router.post('/', createInvoice);

/**
 * @route   POST /api/v1/invoices/:id/send
 * @desc    Send invoice via email
 * @access  Private
 */
router.post('/:id/send', sendInvoice);

/**
 * @route   POST /api/v1/invoices/:id/pdf
 * @desc    Generate PDF for invoice
 * @access  Private
 */
router.post('/:id/pdf', generateInvoicePDF);

/**
 * @route   GET /api/v1/invoices/:id/pdf/download
 * @desc    Download invoice PDF
 * @access  Private
 */
router.get('/:id/pdf/download', downloadInvoicePDF);

/**
 * @route   PATCH /api/v1/invoices/:id
 * @desc    Update invoice
 * @access  Private
 */
router.patch('/:id', updateInvoice);

export default router;
