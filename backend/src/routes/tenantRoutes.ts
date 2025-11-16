import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';

const router = Router();
const prisma = new PrismaClient();

// GET /api/v1/tenants - Get all tenants
router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const tenants = await prisma.tenant.findMany({
      include: {
        property: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json({ tenants, total: tenants.length });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/tenants/:id - Get single tenant
router.get('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        property: true,
        invoices: {
          orderBy: { invoiceDate: 'desc' },
          take: 10
        }
      }
    });

    if (!tenant) {
      throw createError('Tenant not found', 404);
    }

    res.json(tenant);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/tenants - Create tenant
router.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const tenant = await prisma.tenant.create({
      data: req.body,
      include: {
        property: true
      }
    });
    res.status(201).json(tenant);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/tenants/:id - Update tenant
router.patch('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const tenant = await prisma.tenant.update({
      where: { id: parseInt(req.params.id) },
      data: req.body,
      include: {
        property: true
      }
    });
    res.json(tenant);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/tenants/:id - Deactivate tenant
router.delete('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const tenant = await prisma.tenant.update({
      where: { id: parseInt(req.params.id) },
      data: { isActive: false }
    });
    res.json({ message: 'Tenant deactivated', tenant });
  } catch (error) {
    next(error);
  }
});

export default router;
