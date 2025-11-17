import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Rental Property MVP 3.0 API',
      version: '3.0.0',
      description: 'Comprehensive rental property management system API for landlords to manage properties, tenants, invoices, payments, and calculate ROE',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server'
      },
      {
        url: 'https://api.rental-mvp.azure.com',
        description: 'Production server (Azure)'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token obtained from /api/v1/auth/login'
        }
      },
      schemas: {
        User: {
          type: 'object',
          required: ['email', 'password', 'firstName', 'lastName', 'role'],
          properties: {
            id: {
              type: 'integer',
              description: 'Auto-generated user ID'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address (unique)'
            },
            firstName: {
              type: 'string',
              description: 'User first name'
            },
            lastName: {
              type: 'string',
              description: 'User last name'
            },
            role: {
              type: 'string',
              enum: ['landlord', 'tenant', 'admin'],
              description: 'User role for RBAC'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp'
            }
          }
        },
        Property: {
          type: 'object',
          required: ['address', 'city', 'country', 'purchasePrice'],
          properties: {
            id: {
              type: 'integer'
            },
            address: {
              type: 'string',
              example: '123 Main Street'
            },
            city: {
              type: 'string',
              example: 'Amsterdam'
            },
            postalCode: {
              type: 'string',
              example: '1012AB'
            },
            country: {
              type: 'string',
              example: 'Netherlands'
            },
            purchaseDate: {
              type: 'string',
              format: 'date-time'
            },
            purchasePrice: {
              type: 'number',
              example: 300000
            },
            currentValue: {
              type: 'number',
              example: 350000
            },
            propertyType: {
              type: 'string',
              example: 'Apartment'
            },
            squareMeters: {
              type: 'integer',
              example: 75
            },
            bedrooms: {
              type: 'integer',
              example: 2
            },
            bathrooms: {
              type: 'integer',
              example: 1
            }
          }
        },
        Tenant: {
          type: 'object',
          required: ['propertyId', 'firstName', 'lastName', 'email', 'monthlyRent'],
          properties: {
            id: {
              type: 'integer'
            },
            propertyId: {
              type: 'integer'
            },
            firstName: {
              type: 'string'
            },
            lastName: {
              type: 'string'
            },
            email: {
              type: 'string',
              format: 'email'
            },
            phone: {
              type: 'string'
            },
            contractStartDate: {
              type: 'string',
              format: 'date-time'
            },
            contractEndDate: {
              type: 'string',
              format: 'date-time',
              nullable: true
            },
            monthlyRent: {
              type: 'number',
              example: 1200
            },
            serviceCharges: {
              type: 'number',
              example: 50
            },
            utilitiesAdvance: {
              type: 'number',
              example: 75
            },
            depositAmount: {
              type: 'number',
              example: 2400
            },
            isActive: {
              type: 'boolean',
              default: true
            }
          }
        },
        Invoice: {
          type: 'object',
          properties: {
            id: {
              type: 'integer'
            },
            invoiceNumber: {
              type: 'string',
              example: 'INV-2025-001'
            },
            tenantId: {
              type: 'integer'
            },
            propertyId: {
              type: 'integer'
            },
            invoiceDate: {
              type: 'string',
              format: 'date-time'
            },
            dueDate: {
              type: 'string',
              format: 'date-time'
            },
            baseRent: {
              type: 'number',
              example: 1200
            },
            serviceCharges: {
              type: 'number',
              example: 50
            },
            utilitiesAdvance: {
              type: 'number',
              example: 75
            },
            otherCharges: {
              type: 'number',
              example: 0
            },
            discounts: {
              type: 'number',
              example: 0
            },
            lateFees: {
              type: 'number',
              example: 0
            },
            totalAmount: {
              type: 'number',
              example: 1325
            },
            status: {
              type: 'string',
              enum: ['generated', 'sent', 'paid', 'overdue', 'cancelled'],
              example: 'sent'
            }
          }
        },
        Payment: {
          type: 'object',
          properties: {
            id: {
              type: 'integer'
            },
            invoiceId: {
              type: 'integer'
            },
            tenantId: {
              type: 'integer'
            },
            paymentDate: {
              type: 'string',
              format: 'date-time'
            },
            amount: {
              type: 'number',
              example: 1325
            },
            paymentMethod: {
              type: 'string',
              enum: ['bank_transfer', 'cash', 'check', 'card', 'other'],
              example: 'bank_transfer'
            },
            paymentReference: {
              type: 'string',
              example: 'REF-12345'
            },
            status: {
              type: 'string',
              example: 'confirmed'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                message: {
                  type: 'string'
                },
                statusCode: {
                  type: 'integer'
                },
                timestamp: {
                  type: 'string',
                  format: 'date-time'
                },
                path: {
                  type: 'string'
                }
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User registration and login endpoints'
      },
      {
        name: 'Properties',
        description: 'Property management endpoints (landlords and admins only)'
      },
      {
        name: 'Tenants',
        description: 'Tenant management endpoints'
      },
      {
        name: 'Invoices',
        description: 'Invoice generation and management (Week 2 feature)'
      },
      {
        name: 'Payments',
        description: 'Payment recording and reconciliation (Week 3 feature)'
      },
      {
        name: 'Health',
        description: 'System health check'
      }
    ]
  },
  apis: ['./src/routes/*.ts', './src/server.ts']
};

export const swaggerSpec = swaggerJsdoc(options);
