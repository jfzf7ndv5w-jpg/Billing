import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { createError } from './errorHandler';

/**
 * Role-based access control middleware
 * Checks if the authenticated user has the required role(s)
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        throw createError('Authentication required', 401);
      }

      // Check if user has required role
      const userRole = req.user.role;

      if (!allowedRoles.includes(userRole)) {
        throw createError(
          `Access denied. Required role(s): ${allowedRoles.join(', ')}. Your role: ${userRole}`,
          403
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if user is a landlord
 */
export const requireLandlord = authorize('landlord', 'admin');

/**
 * Check if user is a tenant
 */
export const requireTenant = authorize('tenant');

/**
 * Check if user is an admin
 */
export const requireAdmin = authorize('admin');

/**
 * Allow landlords and admins (most common case)
 */
export const requireLandlordOrAdmin = authorize('landlord', 'admin');

/**
 * Resource ownership middleware
 * Ensures users can only access their own resources
 */
export const requireOwnership = (resourceIdParam: string = 'id') => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw createError('Authentication required', 401);
      }

      const resourceId = parseInt(req.params[resourceIdParam]);
      const userId = req.user.id;

      // Admins can access all resources
      if (req.user.role === 'admin') {
        return next();
      }

      // For tenants, check if they're accessing their own data
      if (req.user.role === 'tenant' && resourceId !== userId) {
        throw createError('You can only access your own resources', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Tenant-specific resource access
 * Ensures tenants can only access resources belonging to them
 */
export const requireTenantOwnership = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    // Admins and landlords can access all tenant resources
    if (req.user.role === 'admin' || req.user.role === 'landlord') {
      return next();
    }

    // For tenants, verify they're accessing their own data
    // This will be expanded based on specific resource types
    const tenantId = parseInt(req.params.tenantId || req.params.id);

    if (req.user.role === 'tenant' && req.user.id !== tenantId) {
      throw createError('You can only access your own tenant data', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Rate limiting helper (to be used with express-rate-limit)
 * Different limits for different roles
 */
export const getRateLimitByRole = (req: AuthRequest): number => {
  if (!req.user) return 10; // Unauthenticated users: 10 requests per window

  switch (req.user.role) {
    case 'admin':
      return 1000; // Admins: 1000 requests per window
    case 'landlord':
      return 500; // Landlords: 500 requests per window
    case 'tenant':
      return 100; // Tenants: 100 requests per window
    default:
      return 50; // Default: 50 requests per window
  }
};

/**
 * Audit logging helper
 * Logs sensitive actions for security audit trail
 */
export const logSensitiveAction = (action: string, req: AuthRequest) => {
  const timestamp = new Date().toISOString();
  const userId = req.user?.id || 'unauthenticated';
  const userRole = req.user?.role || 'none';
  const ip = req.ip || req.socket.remoteAddress;

  console.log(`[AUDIT] ${timestamp} | User: ${userId} (${userRole}) | IP: ${ip} | Action: ${action}`);

  // TODO: In production, send to proper logging service (Azure Application Insights, etc.)
};
