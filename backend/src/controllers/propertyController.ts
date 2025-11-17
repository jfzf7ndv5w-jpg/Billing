import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

/**
 * Get all properties for the authenticated user
 */
export const getAllProperties = async (req: AuthRequest, res: Response) => {
  try {
    const properties = await prisma.property.findMany({
      include: {
        tenants: {
          where: {
            isActive: true
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            monthlyRent: true,
            isActive: true
          }
        },
        mortgages: {
          select: {
            id: true,
            lender: true,
            currentBalance: true,
            interestRate: true,
            monthlyPayment: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      properties,
      total: properties.length
    });
  } catch (error) {
    throw createError('Failed to fetch properties', 500);
  }
};

/**
 * Get single property by ID
 */
export const getPropertyById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const propertyId = parseInt(id);

    if (isNaN(propertyId)) {
      throw createError('Invalid property ID', 400);
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        tenants: {
          include: {
            invoices: {
              orderBy: {
                createdAt: 'desc'
              },
              take: 5
            }
          }
        },
        expenses: {
          orderBy: {
            expenseDate: 'desc'
          },
          take: 10
        },
        maintenance: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        },
        mortgages: true
      }
    });

    if (!property) {
      throw createError('Property not found', 404);
    }

    res.json(property);
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      throw error;
    }
    throw createError('Failed to fetch property', 500);
  }
};

/**
 * Create new property
 */
export const createProperty = async (req: AuthRequest, res: Response) => {
  try {
    const {
      address,
      city,
      postalCode,
      country,
      purchaseDate,
      purchasePrice,
      currentValue,
      propertyType,
      squareMeters,
      bedrooms,
      bathrooms
    } = req.body;

    // Validation
    if (!address || !city || !country || !purchasePrice) {
      throw createError('Missing required fields: address, city, country, purchasePrice', 400);
    }

    const property = await prisma.property.create({
      data: {
        address,
        city,
        postalCode,
        country,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
        purchasePrice,
        currentValue: currentValue || purchasePrice,
        propertyType,
        squareMeters,
        bedrooms,
        bathrooms
      }
    });

    res.status(201).json({
      message: 'Property created successfully',
      property
    });
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      throw error;
    }
    throw createError('Failed to create property', 500);
  }
};

/**
 * Update property
 */
export const updateProperty = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const propertyId = parseInt(id);

    if (isNaN(propertyId)) {
      throw createError('Invalid property ID', 400);
    }

    const {
      address,
      city,
      postalCode,
      country,
      purchaseDate,
      purchasePrice,
      currentValue,
      propertyType,
      squareMeters,
      bedrooms,
      bathrooms
    } = req.body;

    // Check if property exists
    const existingProperty = await prisma.property.findUnique({
      where: { id: propertyId }
    });

    if (!existingProperty) {
      throw createError('Property not found', 404);
    }

    const property = await prisma.property.update({
      where: { id: propertyId },
      data: {
        ...(address && { address }),
        ...(city && { city }),
        ...(postalCode !== undefined && { postalCode }),
        ...(country && { country }),
        ...(purchaseDate && { purchaseDate: new Date(purchaseDate) }),
        ...(purchasePrice && { purchasePrice }),
        ...(currentValue && { currentValue }),
        ...(propertyType && { propertyType }),
        ...(squareMeters !== undefined && { squareMeters }),
        ...(bedrooms !== undefined && { bedrooms }),
        ...(bathrooms !== undefined && { bathrooms })
      }
    });

    res.json({
      message: 'Property updated successfully',
      property
    });
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      throw error;
    }
    throw createError('Failed to update property', 500);
  }
};

/**
 * Delete property
 */
export const deleteProperty = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const propertyId = parseInt(id);

    if (isNaN(propertyId)) {
      throw createError('Invalid property ID', 400);
    }

    // Check if property exists
    const existingProperty = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        tenants: true
      }
    });

    if (!existingProperty) {
      throw createError('Property not found', 404);
    }

    // Check if property has active tenants
    const activeTenants = existingProperty.tenants.filter(t => t.isActive);
    if (activeTenants.length > 0) {
      throw createError('Cannot delete property with active tenants', 400);
    }

    await prisma.property.delete({
      where: { id: propertyId }
    });

    res.json({
      message: 'Property deleted successfully'
    });
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      throw error;
    }
    throw createError('Failed to delete property', 500);
  }
};

/**
 * Get property financial summary
 */
export const getPropertyFinancials = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const propertyId = parseInt(id);

    if (isNaN(propertyId)) {
      throw createError('Invalid property ID', 400);
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        tenants: {
          where: { isActive: true }
        },
        expenses: true,
        mortgages: true
      }
    });

    if (!property) {
      throw createError('Property not found', 404);
    }

    // Calculate total monthly rent
    const totalMonthlyRent = property.tenants.reduce((sum, tenant) => {
      return sum + parseFloat(tenant.monthlyRent.toString());
    }, 0);

    // Calculate total expenses (last 12 months)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const recentExpenses = property.expenses.filter(
      expense => new Date(expense.expenseDate) >= oneYearAgo
    );

    const totalExpenses = recentExpenses.reduce((sum, expense) => {
      return sum + parseFloat(expense.amount.toString());
    }, 0);

    // Calculate total mortgage payments
    const totalMortgagePayment = property.mortgages.reduce((sum, mortgage) => {
      return sum + parseFloat(mortgage.monthlyPayment.toString());
    }, 0);

    // Calculate net monthly income
    const netMonthlyIncome = totalMonthlyRent - totalMortgagePayment;

    // Calculate annual ROE
    const equity = parseFloat(property.currentValue.toString()) -
                   property.mortgages.reduce((sum, m) => sum + parseFloat(m.currentBalance.toString()), 0);

    const annualNetIncome = (netMonthlyIncome * 12) - totalExpenses;
    const roe = equity > 0 ? (annualNetIncome / equity) * 100 : 0;

    res.json({
      propertyId: property.id,
      address: property.address,
      financials: {
        monthlyRent: totalMonthlyRent,
        monthlyMortgage: totalMortgagePayment,
        netMonthlyIncome,
        annualExpenses: totalExpenses,
        annualNetIncome,
        currentValue: parseFloat(property.currentValue.toString()),
        equity,
        roe: parseFloat(roe.toFixed(2)),
        activeTenants: property.tenants.length
      }
    });
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      throw error;
    }
    throw createError('Failed to fetch property financials', 500);
  }
};
