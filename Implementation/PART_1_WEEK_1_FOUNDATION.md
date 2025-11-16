# Part 1: Week 1 - Foundation & Backend API Setup

**Duration:** 40 hours (5 days × 8 hours)
**Budget:** €3,000 (40 hours × €75/hr)
**Dependencies:** Part 0 (Azure Setup) must be completed
**Deliverable:** Working backend API with authentication

---

## Overview

Week 1 establishes the foundation for the entire project:
- Development environment setup
- Database schema implementation
- REST API structure
- Authentication system
- CRUD endpoints for core entities

---

## Day-by-Day Breakdown

### Day 1-2: Development Environment (16 hours)

#### Morning Session - Day 1 (4 hours)
**Install Development Tools**
- [ ] Install Node.js 18 LTS
- [ ] Install Visual Studio Code
  - Extensions: ESLint, Prettier, Prisma, REST Client
- [ ] Install Git + GitHub CLI
- [ ] Install Postman or Insomnia (API testing)
- [ ] Install Azure CLI
- [ ] Install Docker Desktop (optional, for local database)

**Verify Azure Resources (from Part 0)**
- [ ] Azure subscription active
- [ ] Resource group created: `rental-mvp-rg`
- [ ] Azure SQL Database provisioned (S0 tier)
- [ ] Azure App Service plan created (B1 tier)
- [ ] Azure Storage account ready
- [ ] Connection strings saved securely

#### Afternoon Session - Day 1 (4 hours)
**Initialize Backend Project**

```bash
# Create backend directory
mkdir -p rental-mvp-v3/backend
cd rental-mvp-v3/backend

# Initialize Node.js project
npm init -y

# Install core dependencies
npm install express cors dotenv prisma @prisma/client bcryptjs jsonwebtoken
npm install zod express-validator helmet morgan

# Install dev dependencies
npm install -D typescript @types/node @types/express @types/bcryptjs @types/jsonwebtoken
npm install -D ts-node nodemon eslint prettier jest @types/jest supertest @types/supertest

# Initialize TypeScript
npx tsc --init

# Initialize Prisma
npx prisma init
```

**Configure TypeScript (tsconfig.json)**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

**Create Project Structure**
```
backend/
├── src/
│   ├── config/
│   │   └── database.ts
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── invoiceController.ts
│   │   └── tenantController.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   └── validation.ts
│   ├── routes/
│   │   ├── authRoutes.ts
│   │   ├── invoiceRoutes.ts
│   │   └── tenantRoutes.ts
│   ├── services/
│   │   ├── InvoiceService.ts
│   │   └── EmailService.ts
│   ├── utils/
│   │   └── logger.ts
│   └── server.ts
├── prisma/
│   └── schema.prisma
├── tests/
│   ├── unit/
│   └── integration/
├── .env.example
├── .gitignore
└── package.json
```

#### Morning Session - Day 2 (4 hours)
**Set Up Git Repository**

```bash
# Initialize git
git init

# Create .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*

# Build outputs
dist/
build/

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Prisma
prisma/migrations/
EOF

# Create README
cat > README.md << 'EOF'
# Rental Property MVP 3.0 - Backend API

## Setup
1. Install dependencies: `npm install`
2. Configure environment: Copy `.env.example` to `.env`
3. Run migrations: `npx prisma migrate dev`
4. Start server: `npm run dev`

## Scripts
- `npm run dev` - Development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run lint` - Lint code
EOF

# Create .env.example
cat > .env.example << 'EOF'
# Database
DATABASE_URL="sqlserver://localhost:1433;database=rental_mvp;user=sa;password=YourPassword;encrypt=true;trustServerCertificate=true"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"

# Server
PORT=3001
NODE_ENV="development"

# Azure Storage
AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;..."
AZURE_STORAGE_ACCOUNT_NAME="rentalmvpstorage"
AZURE_STORAGE_CONTAINER_NAME="invoices"

# SendGrid
SENDGRID_API_KEY="SG.xxxxxxxxxxxxxxxxxxxxx"
SENDGRID_FROM_EMAIL="invoices@yourcompany.nl"

# Landlord
LANDLORD_NAME="John Landlord"
LANDLORD_EMAIL="landlord@example.com"
LANDLORD_IBAN="NL91ABNA0417164300"
EOF

# Initial commit
git add .
git commit -m "Initial backend setup"
```

**Configure GitHub Actions (CI/CD)**
```yaml
# .github/workflows/backend-ci.yml
name: Backend CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: backend/package-lock.json

    - name: Install dependencies
      run: npm ci
      working-directory: ./backend

    - name: Run linter
      run: npm run lint
      working-directory: ./backend

    - name: Run tests
      run: npm test
      working-directory: ./backend
```

#### Afternoon Session - Day 2 (4 hours)
**Configure Package.json Scripts**
```json
{
  "name": "rental-mvp-backend",
  "version": "3.0.0",
  "description": "Rental Property Management System - Backend API",
  "main": "dist/server.js",
  "scripts": {
    "dev": "nodemon --watch src --ext ts --exec ts-node src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "format": "prettier --write \"src/**/*.ts\"",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio"
  },
  "keywords": ["rental", "property", "management", "invoicing"],
  "author": "Your Company",
  "license": "UNLICENSED"
}
```

**Day 1-2 Checkpoint:**
✅ Development environment ready
✅ Backend project initialized
✅ Git repository configured
✅ CI/CD pipeline set up

---

### Day 3-4: Database & API Foundation (16 hours)

#### Day 3 - Database Schema Implementation (8 hours)

**Create Prisma Schema**
```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlserver"
  url      = env("DATABASE_URL")
}

model Property {
  id              Int       @id @default(autoincrement())
  address         String    @db.NVarChar(255)
  city            String    @db.NVarChar(100)
  postalCode      String    @db.NVarChar(20)
  country         String    @default("Netherlands") @db.NVarChar(50)

  // Purchase info
  purchaseDate    DateTime
  purchasePrice   Decimal   @db.Decimal(12, 2)
  currentValue    Decimal   @db.Decimal(12, 2)

  // Property details
  propertyType    String?   @db.NVarChar(50)
  squareMeters    Int?
  bedrooms        Int?
  bathrooms       Int?

  // Relationships
  tenants         Tenant[]
  invoices        Invoice[]
  expenses        Expense[]
  maintenance     MaintenanceRequest[]
  mortgages       Mortgage[]

  // Metadata
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@map("properties")
}

model Tenant {
  id                  Int       @id @default(autoincrement())
  propertyId          Int
  property            Property  @relation(fields: [propertyId], references: [id])

  // Personal info
  firstName           String    @db.NVarChar(100)
  lastName            String    @db.NVarChar(100)
  email               String    @unique @db.NVarChar(255)
  phone               String?   @db.NVarChar(20)

  // Contract details
  contractStartDate   DateTime
  contractEndDate     DateTime?

  // Financial details
  monthlyRent         Decimal   @db.Decimal(10, 2)
  serviceCharges      Decimal   @default(0) @db.Decimal(10, 2)
  utilitiesAdvance    Decimal   @default(0) @db.Decimal(10, 2)

  // Deposit
  depositAmount       Decimal   @db.Decimal(10, 2)
  depositPaidDate     DateTime?

  // Status
  isActive            Boolean   @default(true)

  // Relationships
  invoices            Invoice[]
  payments            Payment[]
  maintenanceRequests MaintenanceRequest[]

  // Metadata
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@index([propertyId])
  @@index([email])
  @@index([isActive])
  @@map("tenants")
}

model Invoice {
  id              Int       @id @default(autoincrement())
  invoiceNumber   String    @unique @db.NVarChar(50)
  tenantId        Int
  tenant          Tenant    @relation(fields: [tenantId], references: [id])
  propertyId      Int
  property        Property  @relation(fields: [propertyId], references: [id])

  // Invoice details
  invoiceDate     DateTime
  dueDate         DateTime
  month           Int
  year            Int

  // Amounts
  baseRent        Decimal   @db.Decimal(10, 2)
  serviceCharges  Decimal   @default(0) @db.Decimal(10, 2)
  utilitiesAdvance Decimal  @default(0) @db.Decimal(10, 2)
  otherCharges    Decimal   @default(0) @db.Decimal(10, 2)
  discounts       Decimal   @default(0) @db.Decimal(10, 2)
  lateFees        Decimal   @default(0) @db.Decimal(10, 2)
  totalAmount     Decimal   @db.Decimal(10, 2)

  // Status tracking
  status          String    @db.NVarChar(20) // generated, sent, paid, overdue, cancelled
  sentDate        DateTime?
  paidDate        DateTime?
  emailSent       Boolean   @default(false)

  // Storage
  pdfBlobUrl      String?   @db.NVarChar(500)
  pdfSasToken     String?   @db.NVarChar(500)

  // Relationships
  payments        Payment[]

  // Metadata
  generatedBy     String?   @db.NVarChar(50) // automated, manual
  notes           String?   @db.NVarChar(Max)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([status])
  @@index([tenantId])
  @@index([invoiceDate])
  @@index([month, year])
  @@map("invoices")
}

model Payment {
  id                  Int       @id @default(autoincrement())
  invoiceId           Int
  invoice             Invoice   @relation(fields: [invoiceId], references: [id])
  tenantId            Int
  tenant              Tenant    @relation(fields: [tenantId], references: [id])

  // Payment details
  paymentDate         DateTime
  amount              Decimal   @db.Decimal(10, 2)
  paymentMethod       String?   @db.NVarChar(50)
  paymentReference    String?   @db.NVarChar(100)
  bankTransactionId   String?   @db.NVarChar(100)

  // Reconciliation
  matchedAutomatically Boolean  @default(false)
  matchedByUserId     Int?
  matchedDate         DateTime?

  // Status
  status              String    @default("confirmed") @db.NVarChar(20)
  notes               String?   @db.NVarChar(Max)

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@index([invoiceId])
  @@index([paymentDate])
  @@index([status])
  @@map("payments")
}

model Expense {
  id                  Int       @id @default(autoincrement())
  propertyId          Int
  property            Property  @relation(fields: [propertyId], references: [id])
  maintenanceRequestId Int?
  maintenanceRequest  MaintenanceRequest? @relation(fields: [maintenanceRequestId], references: [id])

  // Expense details
  expenseDate         DateTime
  category            String    @db.NVarChar(50)
  subcategory         String?   @db.NVarChar(100)
  description         String    @db.NVarChar(500)
  amount              Decimal   @db.Decimal(10, 2)

  // Vendor
  vendorId            Int?
  vendor              Vendor?   @relation(fields: [vendorId], references: [id])
  vendorName          String?   @db.NVarChar(200)

  // Tax
  isTaxDeductible     Boolean   @default(true)
  vatAmount           Decimal   @default(0) @db.Decimal(10, 2)
  vatPercentage       Decimal   @default(21.00) @db.Decimal(5, 2)

  // Documentation
  receiptBlobUrl      String?   @db.NVarChar(500)
  invoiceNumber       String?   @db.NVarChar(100)

  // Payment
  paymentStatus       String    @default("unpaid") @db.NVarChar(20)
  paymentDate         DateTime?
  paymentReference    String?   @db.NVarChar(100)

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@index([expenseDate])
  @@index([category])
  @@index([propertyId])
  @@map("expenses")
}

model MaintenanceRequest {
  id                      Int       @id @default(autoincrement())
  propertyId              Int
  property                Property  @relation(fields: [propertyId], references: [id])
  tenantId                Int?
  tenant                  Tenant?   @relation(fields: [tenantId], references: [id])

  // Request details
  title                   String    @db.NVarChar(200)
  description             String    @db.NVarChar(Max)
  category                String    @db.NVarChar(50)
  priority                String    @db.NVarChar(20)

  // Status workflow
  status                  String    @default("open") @db.NVarChar(20)
  reportedDate            DateTime  @default(now())
  startedDate             DateTime?
  completedDate           DateTime?

  // Assignment
  assignedVendorId        Int?
  assignedVendor          Vendor?   @relation(fields: [assignedVendorId], references: [id])
  estimatedCost           Decimal?  @db.Decimal(10, 2)
  actualCost              Decimal?  @db.Decimal(10, 2)

  // Photos
  photosBlobUrls          String?   @db.NVarChar(Max) // JSON array

  // Resolution
  resolutionNotes         String?   @db.NVarChar(Max)
  tenantSatisfactionRating Int?

  // Relationships
  expenses                Expense[]

  createdAt               DateTime  @default(now())
  updatedAt               DateTime  @updatedAt

  @@index([status])
  @@index([propertyId])
  @@index([reportedDate])
  @@map("maintenance_requests")
}

model Vendor {
  id                  Int       @id @default(autoincrement())
  name                String    @db.NVarChar(200)
  email               String?   @db.NVarChar(255)
  phone               String?   @db.NVarChar(20)
  specialization      String?   @db.NVarChar(100)

  // Performance
  averageRating       Decimal?  @db.Decimal(3, 2)
  jobsCompleted       Int       @default(0)

  // Relationships
  maintenanceRequests MaintenanceRequest[]
  expenses            Expense[]

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@map("vendors")
}

model Mortgage {
  id                  Int       @id @default(autoincrement())
  propertyId          Int
  property            Property  @relation(fields: [propertyId], references: [id])

  lender              String    @db.NVarChar(200)
  accountNumber       String?   @db.NVarChar(100)

  originalAmount      Decimal   @db.Decimal(12, 2)
  currentBalance      Decimal   @db.Decimal(12, 2)
  interestRate        Decimal   @db.Decimal(5, 2)

  startDate           DateTime
  endDate             DateTime
  monthlyPayment      Decimal   @db.Decimal(10, 2)

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@map("mortgages")
}

model User {
  id                  Int       @id @default(autoincrement())
  email               String    @unique @db.NVarChar(255)
  passwordHash        String    @db.NVarChar(255)

  firstName           String    @db.NVarChar(100)
  lastName            String    @db.NVarChar(100)

  role                String    @default("landlord") @db.NVarChar(20) // admin, landlord
  isActive            Boolean   @default(true)

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  lastLoginAt         DateTime?

  @@map("users")
}
```

**Run Initial Migration**
```bash
# Generate Prisma Client
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name init

# Open Prisma Studio to verify
npx prisma studio
```

**Day 3 Checkpoint:**
✅ Database schema implemented
✅ Prisma ORM configured
✅ Initial migration applied
✅ Database connectivity verified

#### Day 4 - Basic API Structure (8 hours)

**Create Express Server (src/server.ts)**
```typescript
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/authRoutes';
import invoiceRoutes from './routes/invoiceRoutes';
import tenantRoutes from './routes/tenantRoutes';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/v1/tenants', tenantRoutes);

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

export default app;
```

**Create Error Handler Middleware (src/middleware/errorHandler.ts)**
```typescript
import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    statusCode
  });

  res.status(statusCode).json({
    error: {
      message,
      statusCode,
      timestamp: new Date().toISOString(),
      path: req.path
    }
  });
};

export const createError = (message: string, statusCode: number): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};
```

**Create Basic CRUD Endpoints**

```typescript
// src/routes/tenantRoutes.ts
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/v1/tenants - Get all tenants
router.get('/', authenticate, async (req, res, next) => {
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
router.get('/:id', authenticate, async (req, res, next) => {
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
      return res.status(404).json({ error: 'Tenant not found' });
    }

    res.json(tenant);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/tenants - Create tenant
router.post('/', authenticate, async (req, res, next) => {
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
router.patch('/:id', authenticate, async (req, res, next) => {
  try {
    const tenant = await prisma.tenant.update({
      where: { id: parseInt(req.params.id) },
      data: req.body
    });
    res.json(tenant);
  } catch (error) {
    next(error);
  }
});

export default router;
```

**Test the API**
```bash
# Start development server
npm run dev

# Test endpoints with curl
curl http://localhost:3001/health
curl http://localhost:3001/api/v1/tenants
```

**Day 4 Checkpoint:**
✅ Express server running
✅ Basic routing structure
✅ CRUD endpoints for tenants
✅ Error handling middleware

---

### Day 5: Authentication System (8 hours)

#### Morning Session (4 hours) - JWT Implementation

**Create Auth Middleware (src/middleware/auth.ts)**
```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createError } from './errorHandler';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError('No token provided', 401);
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
    next(createError('Invalid or expired token', 401));
  }
};

export const generateToken = (user: { id: number; email: string; role: string }) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET!,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    }
  );
};
```

**Create Auth Controller (src/controllers/authController.ts)**
```typescript
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateToken } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw createError('User already exists', 409);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role: 'landlord'
      }
    });

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      token
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw createError('Invalid credentials', 401);
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw createError('Invalid credentials', 401);
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      token
    });
  } catch (error) {
    next(error);
  }
};
```

**Create Auth Routes (src/routes/authRoutes.ts)**
```typescript
import { Router } from 'express';
import { register, login } from '../controllers/authController';
import { body } from 'express-validator';
import { validate } from '../middleware/validation';

const router = Router();

// Validation rules
const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('firstName').trim().notEmpty(),
  body('lastName').trim().notEmpty(),
  validate
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  validate
];

// Routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);

export default router;
```

**Create Validation Middleware (src/middleware/validation.ts)**
```typescript
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request parameters',
        details: errors.array()
      }
    });
  }

  next();
};
```

#### Afternoon Session (4 hours) - Testing & Documentation

**Create Test User Seed (prisma/seed.ts)**
```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create test landlord
  const passwordHash = await bcrypt.hash('password123', 12);

  const user = await prisma.user.upsert({
    where: { email: 'landlord@example.com' },
    update: {},
    create: {
      email: 'landlord@example.com',
      passwordHash,
      firstName: 'John',
      lastName: 'Landlord',
      role: 'landlord'
    }
  });

  console.log('✅ Test user created:', user.email);

  // Create test property
  const property = await prisma.property.create({
    data: {
      address: '123 Main Street',
      city: 'Amsterdam',
      postalCode: '1012AB',
      purchaseDate: new Date('2020-01-01'),
      purchasePrice: 300000,
      currentValue: 350000,
      propertyType: 'Apartment',
      squareMeters: 75,
      bedrooms: 2,
      bathrooms: 1
    }
  });

  console.log('✅ Test property created:', property.address);

  // Create test tenant
  const tenant = await prisma.tenant.create({
    data: {
      propertyId: property.id,
      firstName: 'Jane',
      lastName: 'Tenant',
      email: 'tenant@example.com',
      phone: '+31 6 1234 5678',
      contractStartDate: new Date('2023-01-01'),
      monthlyRent: 1200,
      serviceCharges: 50,
      utilitiesAdvance: 75,
      depositAmount: 2400,
      isActive: true
    }
  });

  console.log('✅ Test tenant created:', tenant.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**Add to package.json:**
```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

**Run seed:**
```bash
npx prisma db seed
```

**Create API Test Collection (api-tests.http)**
```http
### Variables
@baseUrl = http://localhost:3001/api/v1
@token = your-jwt-token-here

### Health Check
GET http://localhost:3001/health

### Register
POST {{baseUrl}}/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123",
  "firstName": "Test",
  "lastName": "User"
}

### Login
# @name login
POST {{baseUrl}}/auth/login
Content-Type: application/json

{
  "email": "landlord@example.com",
  "password": "password123"
}

### Get All Tenants (requires auth)
GET {{baseUrl}}/tenants
Authorization: Bearer {{token}}

### Get Single Tenant
GET {{baseUrl}}/tenants/1
Authorization: Bearer {{token}}

### Create Tenant
POST {{baseUrl}}/tenants
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "propertyId": 1,
  "firstName": "New",
  "lastName": "Tenant",
  "email": "newtenant@example.com",
  "contractStartDate": "2025-01-01",
  "monthlyRent": 1300,
  "depositAmount": 2600,
  "isActive": true
}
```

**Day 5 Checkpoint:**
✅ JWT authentication working
✅ Register/login endpoints
✅ Protected routes
✅ Test data seeded
✅ API documented

---

## Week 1 Final Deliverable

**What You Have Now:**
✅ Complete backend project structure
✅ Database with 11 tables (Prisma ORM)
✅ REST API with authentication
✅ CRUD endpoints for core entities
✅ Error handling & validation
✅ Test data & API documentation
✅ CI/CD pipeline configured

**Test It:**
```bash
# 1. Start server
npm run dev

# 2. Run tests
npm test

# 3. Check linting
npm run lint

# 4. Test endpoints
# Use the api-tests.http file or Postman
```

**Next Week (Part 2):**
Week 2 focuses on the automated invoice system - the core feature of MVP 3.0.

---

## Checklist

**Development Environment:**
- [ ] Node.js 18 installed
- [ ] VS Code configured
- [ ] Git repository initialized
- [ ] Azure resources verified

**Backend Setup:**
- [ ] Project structure created
- [ ] Dependencies installed
- [ ] TypeScript configured
- [ ] Environment variables set

**Database:**
- [ ] Prisma schema defined
- [ ] Migrations applied
- [ ] Seed data loaded
- [ ] Database accessible

**API:**
- [ ] Express server running
- [ ] Routes configured
- [ ] Controllers implemented
- [ ] Middleware working

**Authentication:**
- [ ] JWT implementation complete
- [ ] Register endpoint working
- [ ] Login endpoint working
- [ ] Protected routes tested

**Testing:**
- [ ] Test user created
- [ ] API endpoints tested
- [ ] Error handling verified
- [ ] Health check working

**Documentation:**
- [ ] README updated
- [ ] API collection created
- [ ] Code commented
- [ ] Git commits clean

---

**Hours Logged:** 40 hours
**Status:** ✅ COMPLETE
**Ready for:** Part 2 - Automated Invoice System
