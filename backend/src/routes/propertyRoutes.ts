import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireLandlordOrAdmin } from '../middleware/rbac';
import {
  getAllProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  getPropertyFinancials
} from '../controllers/propertyController';

const router = Router();

// All routes require authentication and landlord/admin role
router.use(authenticate);
router.use(requireLandlordOrAdmin);

/**
 * @route   GET /api/v1/properties
 * @desc    Get all properties
 * @access  Private
 */
router.get('/', getAllProperties);

/**
 * @route   GET /api/v1/properties/:id
 * @desc    Get single property by ID
 * @access  Private
 */
router.get('/:id', getPropertyById);

/**
 * @route   GET /api/v1/properties/:id/financials
 * @desc    Get property financial summary
 * @access  Private
 */
router.get('/:id/financials', getPropertyFinancials);

/**
 * @route   POST /api/v1/properties
 * @desc    Create new property
 * @access  Private
 */
router.post('/', createProperty);

/**
 * @route   PATCH /api/v1/properties/:id
 * @desc    Update property
 * @access  Private
 */
router.patch('/:id', updateProperty);

/**
 * @route   DELETE /api/v1/properties/:id
 * @desc    Delete property
 * @access  Private
 */
router.delete('/:id', deleteProperty);

export default router;
