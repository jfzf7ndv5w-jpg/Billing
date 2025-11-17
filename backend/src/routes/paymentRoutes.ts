import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireLandlordOrAdmin } from '../middleware/rbac';
import {
  getAllPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment,
  getPaymentStats
} from '../controllers/paymentController';

const router = Router();

// All routes require authentication and landlord/admin role
router.use(authenticate);
router.use(requireLandlordOrAdmin);

/**
 * @route   GET /api/v1/payments
 * @desc    Get all payments
 * @access  Private
 */
router.get('/', getAllPayments);

/**
 * @route   GET /api/v1/payments/stats
 * @desc    Get payment statistics
 * @access  Private
 */
router.get('/stats', getPaymentStats);

/**
 * @route   GET /api/v1/payments/:id
 * @desc    Get single payment by ID
 * @access  Private
 */
router.get('/:id', getPaymentById);

/**
 * @route   POST /api/v1/payments
 * @desc    Record new payment
 * @access  Private
 */
router.post('/', createPayment);

/**
 * @route   PATCH /api/v1/payments/:id
 * @desc    Update payment
 * @access  Private
 */
router.patch('/:id', updatePayment);

/**
 * @route   DELETE /api/v1/payments/:id
 * @desc    Delete payment
 * @access  Private
 */
router.delete('/:id', deletePayment);

export default router;
