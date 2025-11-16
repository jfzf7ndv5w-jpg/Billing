# MVP 3.0 - Testing, Security & Deployment
**Rental Property Management System - Complete Documentation Part 5 of 6**

---

## Testing Strategy

### Testing Pyramid

```
           /\
          /  \
         / E2E \           10% - End-to-End Tests (Critical Paths)
        /______\           
       /        \          
      /Integration\        30% - Integration Tests (API + DB)
     /____________\        
    /              \       
   /  Unit Tests    \      60% - Unit Tests (Business Logic)
  /__________________\     
```

**Coverage Targets**:
- Unit Tests: 80% code coverage
- Integration Tests: All API endpoints
- E2E Tests: Critical user journeys
- Total Coverage: > 75%

---

## Unit Testing

### Backend Unit Tests (Jest)

**Invoice Service Tests**:
```typescript
// backend/tests/unit/InvoiceService.test.ts

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { InvoiceService } from '../../src/services/InvoiceService';
import { PrismaClient } from '@prisma/client';

describe('InvoiceService', () => {
    let invoiceService: InvoiceService;
    let prismaMock: jest.Mocked<PrismaClient>;

    beforeEach(() => {
        prismaMock = {
            invoice: {
                create: jest.fn(),
                findMany: jest.fn(),
                count: jest.fn(),
            },
        } as any;
        
        invoiceService = new InvoiceService(prismaMock);
    });

    describe('generateInvoiceNumber', () => {
        it('should generate correct invoice number format', async () => {
            prismaMock.invoice.count.mockResolvedValue(0);
            
            const number = await invoiceService.generateInvoiceNumber(2025, 1);
            
            expect(number).toBe('INV-2025-01-001');
        });

        it('should increment sequence correctly', async () => {
            prismaMock.invoice.count.mockResolvedValue(5);
            
            const number = await invoiceService.generateInvoiceNumber(2025, 1);
            
            expect(number).toBe('INV-2025-01-006');
        });

        it('should pad month and sequence with zeros', async () => {
            prismaMock.invoice.count.mockResolvedValue(0);
            
            const number = await invoiceService.generateInvoiceNumber(2025, 3);
            
            expect(number).toMatch(/^INV-2025-03-001$/);
        });
    });

    describe('calculateTotal', () => {
        it('should calculate total amount correctly', () => {
            const result = invoiceService.calculateTotal({
                baseRent: 1200,
                serviceCharges: 50,
                utilitiesAdvance: 75,
                discounts: 25
            });
            
            expect(result).toBe(1300);
        });

        it('should handle zero values', () => {
            const result = invoiceService.calculateTotal({
                baseRent: 1200,
                serviceCharges: 0,
                utilitiesAdvance: 0,
                discounts: 0
            });
            
            expect(result).toBe(1200);
        });

        it('should handle undefined optional fields', () => {
            const result = invoiceService.calculateTotal({
                baseRent: 1200
            });
            
            expect(result).toBe(1200);
        });
    });

    describe('createInvoice', () => {
        it('should create invoice with all required fields', async () => {
            const mockInvoice = {
                id: 1,
                invoiceNumber: 'INV-2025-01-001',
                totalAmount: 1325,
                status: 'generated'
            };
            
            prismaMock.invoice.create.mockResolvedValue(mockInvoice as any);
            prismaMock.invoice.count.mockResolvedValue(0);
            
            const result = await invoiceService.createInvoice({
                tenantId: 1,
                propertyId: 1,
                month: 1,
                year: 2025,
                baseRent: 1200,
                serviceCharges: 50,
                utilitiesAdvance: 75,
                dueDate: new Date('2025-02-05')
            });
            
            expect(result).toEqual(mockInvoice);
            expect(prismaMock.invoice.create).toHaveBeenCalled();
        });
    });
});
```

**Payment Service Tests**:
```typescript
// backend/tests/unit/PaymentService.test.ts

describe('PaymentService', () => {
    describe('recordPayment', () => {
        it('should mark invoice as paid when full amount received', async () => {
            const payment = await paymentService.recordPayment({
                invoiceId: 1,
                amount: 1325,
                paymentDate: new Date('2025-02-03')
            });
            
            expect(payment.status).toBe('confirmed');
            expect(mockInvoice.status).toBe('paid');
        });

        it('should handle partial payments', async () => {
            const payment = await paymentService.recordPayment({
                invoiceId: 1,
                amount: 500,
                paymentDate: new Date('2025-02-03')
            });
            
            expect(payment.status).toBe('confirmed');
            expect(mockInvoice.status).toBe('sent'); // Still not fully paid
        });
    });

    describe('matchPaymentToInvoice', () => {
        it('should match by exact reference', () => {
            const match = paymentService.matchPaymentToInvoice({
                reference: 'INV-2025-01-001',
                amount: 1325
            }, openInvoices);
            
            expect(match).toBeDefined();
            expect(match.invoiceNumber).toBe('INV-2025-01-001');
        });

        it('should match by amount and date range', () => {
            const match = paymentService.matchPaymentToInvoice({
                amount: 1325,
                date: new Date('2025-02-03')
            }, openInvoices);
            
            expect(match).toBeDefined();
        });
    });
});
```

---

## Integration Testing

### API Integration Tests (Supertest)

```typescript
// backend/tests/integration/invoice.api.test.ts

import request from 'supertest';
import { app } from '../../src/app';
import { setupTestDatabase, cleanupTestDatabase, getTestToken } from '../helpers';

describe('Invoice API Integration Tests', () => {
    let authToken: string;

    beforeAll(async () => {
        await setupTestDatabase();
        authToken = await getTestToken();
    });

    afterAll(async () => {
        await cleanupTestDatabase();
    });

    describe('POST /api/v1/invoices', () => {
        it('should create invoice and return 201', async () => {
            const response = await request(app)
                .post('/api/v1/invoices')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    tenantId: 1,
                    month: 2,
                    year: 2025,
                    baseRent: 1200,
                    serviceCharges: 50,
                    utilitiesAdvance: 75,
                    dueDate: '2025-03-05'
                });

            expect(response.status).toBe(201);
            expect(response.body).toMatchObject({
                invoiceNumber: expect.stringMatching(/^INV-2025-02-\d{3}$/),
                totalAmount: 1325,
                status: 'generated'
            });
        });

        it('should return 400 for invalid data', async () => {
            const response = await request(app)
                .post('/api/v1/invoices')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    tenantId: 'invalid',
                    month: 13, // Invalid month
                    baseRent: -100 // Negative rent
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toBeDefined();
        });

        it('should return 401 without auth token', async () => {
            const response = await request(app)
                .post('/api/v1/invoices')
                .send({ tenantId: 1 });

            expect(response.status).toBe(401);
        });
    });

    describe('GET /api/v1/invoices', () => {
        it('should return paginated invoices', async () => {
            const response = await request(app)
                .get('/api/v1/invoices')
                .set('Authorization', `Bearer ${authToken}`)
                .query({ limit: 10, offset: 0 });

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({
                invoices: expect.any(Array),
                total: expect.any(Number),
                limit: 10,
                offset: 0
            });
        });

        it('should filter by status', async () => {
            const response = await request(app)
                .get('/api/v1/invoices')
                .set('Authorization', `Bearer ${authToken}`)
                .query({ status: 'paid' });

            expect(response.status).toBe(200);
            expect(response.body.invoices.every(inv => inv.status === 'paid')).toBe(true);
        });
    });

    describe('POST /api/v1/invoices/:id/send', () => {
        it('should send invoice email successfully', async () => {
            const response = await request(app)
                .post('/api/v1/invoices/1/send')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ ccEmail: 'landlord@example.com' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.recipients).toMatchObject({
                to: expect.any(String),
                cc: 'landlord@example.com'
            });
        });
    });
});
```

### Database Integration Tests

```typescript
// backend/tests/integration/database.test.ts

describe('Database Integration Tests', () => {
    it('should handle concurrent invoice creation', async () => {
        const promises = Array.from({ length: 10 }, (_, i) =>
            invoiceService.createInvoice({
                tenantId: 1,
                month: 1,
                year: 2025,
                baseRent: 1200
            })
        );

        const results = await Promise.all(promises);
        const numbers = results.map(r => r.invoiceNumber);
        
        // All invoice numbers should be unique
        expect(new Set(numbers).size).toBe(10);
    });

    it('should maintain referential integrity', async () => {
        await expect(
            invoiceService.createInvoice({
                tenantId: 999, // Non-existent tenant
                month: 1,
                year: 2025,
                baseRent: 1200
            })
        ).rejects.toThrow();
    });

    it('should rollback transaction on error', async () => {
        const initialCount = await prisma.invoice.count();

        try {
            await prisma.$transaction(async (tx) => {
                await tx.invoice.create({ /* valid data */ });
                throw new Error('Simulated error');
            });
        } catch (error) {
            // Expected error
        }

        const finalCount = await prisma.invoice.count();
        expect(finalCount).toBe(initialCount);
    });
});
```

---

## End-to-End Testing (Playwright)

### Critical User Journeys

```typescript
// e2e/tests/invoice-workflow.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Complete Invoice Workflow', () => {
    test.beforeEach(async ({ page }) => {
        // Login
        await page.goto('https://app.example.com/login');
        await page.fill('[name="email"]', process.env.TEST_USER_EMAIL);
        await page.fill('[name="password"]', process.env.TEST_USER_PASSWORD);
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/.*dashboard/);
    });

    test('should generate, send, and mark invoice as paid', async ({ page }) => {
        // 1. Navigate to invoices
        await page.click('text=Invoices');
        await expect(page).toHaveURL(/.*invoices/);

        // 2. Create new invoice
        await page.click('button:has-text("Create Invoice")');
        await page.selectOption('[name="tenantId"]', '1');
        await page.fill('[name="baseRent"]', '1200');
        await page.fill('[name="serviceCharges"]', '50');
        await page.click('button:has-text("Generate")');

        // 3. Verify invoice created
        await expect(page.locator('.toast-success')).toContainText('Invoice created');
        const invoiceNumber = await page.locator('[data-testid="invoice-number"]').textContent();
        expect(invoiceNumber).toMatch(/^INV-\d{4}-\d{2}-\d{3}$/);

        // 4. Send invoice
        await page.click(`button:has-text("Send"):near([data-invoice="${invoiceNumber}"])`);
        await expect(page.locator('.toast-success')).toContainText('Email sent');

        // 5. Record payment
        await page.click(`button:has-text("Mark Paid"):near([data-invoice="${invoiceNumber}"])`);
        await page.fill('[name="paymentDate"]', '2025-02-03');
        await page.fill('[name="amount"]', '1250');
        await page.fill('[name="reference"]', invoiceNumber);
        await page.click('button:has-text("Save Payment")');

        // 6. Verify invoice marked as paid
        await expect(
            page.locator(`[data-invoice="${invoiceNumber}"] .status-badge`)
        ).toContainText('Paid');
    });

    test('should handle invoice generation failure gracefully', async ({ page }) => {
        await page.click('text=Invoices');
        await page.click('button:has-text("Create Invoice")');
        
        // Don't select tenant (validation error)
        await page.fill('[name="baseRent"]', '1200');
        await page.click('button:has-text("Generate")');

        // Should show validation error
        await expect(page.locator('.error-message')).toContainText('Tenant is required');
        
        // Invoice should not be created
        await expect(page.locator('.toast-success')).not.toBeVisible();
    });
});

test.describe('Payment Reconciliation Workflow', () => {
    test('should import bank statement and match payments', async ({ page }) => {
        await page.goto('https://app.example.com/payments/reconciliation');

        // 1. Upload bank statement
        const fileInput = await page.locator('input[type="file"]');
        await fileInput.setInputFiles('./test-data/bank-statement.csv');

        // 2. Wait for import to complete
        await expect(page.locator('.import-summary')).toBeVisible();
        await expect(page.locator('.import-summary')).toContainText('15 transactions imported');

        // 3. Verify auto-matched payments
        await expect(page.locator('.auto-matched-count')).toContainText('12');

        // 4. Manually match unmatched transaction
        await page.click('.unmatched-transaction:first-child');
        await page.click('.open-invoice:has-text("INV-2025-01-003")');
        await page.click('button:has-text("Match")');

        // 5. Confirm match
        await expect(page.locator('.matched-count')).toContainText('13');
    });
});
```

### Mobile E2E Tests (iOS App)

```swift
// iOSTests/UITests/InvoiceFlowUITests.swift

import XCTest

class InvoiceFlowUITests: XCTestCase {
    var app: XCUIApplication!
    
    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["UI-Testing"]
        app.launch()
        
        // Login
        let emailField = app.textFields["email"]
        emailField.tap()
        emailField.typeText("test@example.com")
        
        let passwordField = app.secureTextFields["password"]
        passwordField.tap()
        passwordField.typeText("password123")
        
        app.buttons["Login"].tap()
        
        // Wait for dashboard
        XCTAssertTrue(app.staticTexts["Dashboard"].waitForExistence(timeout: 5))
    }
    
    func testViewCurrentInvoice() throws {
        // Navigate to current month card
        let currentMonthCard = app.otherElements["currentMonthCard"]
        XCTAssertTrue(currentMonthCard.exists)
        
        // Verify invoice details visible
        XCTAssertTrue(app.staticTexts.matching(NSPredicate(format: "label CONTAINS 'INV-'")).element.exists)
        XCTAssertTrue(app.staticTexts.matching(NSPredicate(format: "label CONTAINS '€'")).element.exists)
    }
    
    func testMarkInvoiceAsPaid() throws {
        // Find first unpaid invoice
        app.buttons["Invoices Tab"].tap()
        
        let unpaidInvoice = app.cells.matching(NSPredicate(format: "label CONTAINS 'Unpaid'")).element(boundBy: 0)
        unpaidInvoice.tap()
        
        // Mark as paid
        app.buttons["Mark as Paid"].tap()
        
        // Fill payment details
        app.datePickers["paymentDate"].tap()
        // Select today's date (default)
        
        app.textFields["amount"].tap()
        app.textFields["amount"].typeText("1200")
        
        app.buttons["Save"].tap()
        
        // Verify success
        XCTAssertTrue(app.alerts["Success"].waitForExistence(timeout: 3))
        XCTAssertTrue(app.alerts["Success"].staticTexts["Payment recorded successfully"].exists)
    }
    
    func testPullToRefresh() throws {
        let firstCell = app.cells.element(boundBy: 0)
        firstCell.swipeDown()
        
        // Verify loading indicator appears
        XCTAssertTrue(app.activityIndicators.element.exists)
        
        // Wait for refresh to complete
        XCTAssertFalse(app.activityIndicators.element.waitForExistence(timeout: 5))
    }
}
```

---

## Test Data Management

### Test Database Setup

```typescript
// backend/tests/helpers/database.ts

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.TEST_DATABASE_URL
        }
    }
});

export async function setupTestDatabase() {
    // Reset database
    execSync('npx prisma migrate reset --force --skip-seed', {
        env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL }
    });
    
    // Apply migrations
    execSync('npx prisma migrate deploy', {
        env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL }
    });
    
    // Seed test data
    await seedTestData();
}

export async function cleanupTestDatabase() {
    await prisma.$executeRaw`TRUNCATE TABLE invoices CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE payments CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE tenants CASCADE`;
    await prisma.$disconnect();
}

async function seedTestData() {
    // Create test property
    const property = await prisma.property.create({
        data: {
            address: '123 Test Street',
            city: 'Amsterdam',
            postalCode: '1012AB',
            purchaseDate: new Date('2020-01-01'),
            purchasePrice: 300000,
            currentValue: 350000
        }
    });
    
    // Create test tenant
    await prisma.tenant.create({
        data: {
            propertyId: property.id,
            firstName: 'Test',
            lastName: 'Tenant',
            email: 'test@example.com',
            monthlyRent: 1200,
            serviceCharges: 50,
            utilitiesAdvance: 75,
            depositAmount: 2400,
            contractStartDate: new Date('2023-01-01'),
            isActive: true
        }
    });
}
```

### Test Data Fixtures

```typescript
// backend/tests/fixtures/invoices.ts

export const testInvoices = [
    {
        invoiceNumber: 'INV-2025-01-001',
        month: 1,
        year: 2025,
        baseRent: 1200,
        serviceCharges: 50,
        utilitiesAdvance: 75,
        totalAmount: 1325,
        status: 'sent',
        dueDate: new Date('2025-02-05')
    },
    {
        invoiceNumber: 'INV-2025-01-002',
        month: 1,
        year: 2025,
        baseRent: 1200,
        totalAmount: 1200,
        status: 'paid',
        paidDate: new Date('2025-02-03')
    }
];

export const testPayments = [
    {
        amount: 1200,
        paymentDate: new Date('2025-02-03'),
        paymentMethod: 'Bank Transfer',
        paymentReference: 'INV-2025-01-002',
        status: 'confirmed'
    }
];
```

---

## Performance Testing

### Load Testing (Artillery)

```yaml
# load-test/invoice-generation.yml

config:
  target: 'https://api.yourapp.com'
  phases:
    - duration: 60
      arrivalRate: 5
      name: "Warm up"
    - duration: 300
      arrivalRate: 20
      name: "Sustained load"
    - duration: 120
      arrivalRate: 50
      name: "Spike"
  variables:
    authToken: "{{ $processEnvironment.TEST_AUTH_TOKEN }}"

scenarios:
  - name: "Generate and send invoice"
    flow:
      - post:
          url: "/api/v1/invoices"
          headers:
            Authorization: "Bearer {{ authToken }}"
          json:
            tenantId: 1
            month: "{{ $randomNumber(1, 12) }}"
            year: 2025
            baseRent: 1200
          capture:
            - json: "$.id"
              as: "invoiceId"
      - post:
          url: "/api/v1/invoices/{{ invoiceId }}/send"
          headers:
            Authorization: "Bearer {{ authToken }}"
```

**Run load test**:
```bash
artillery run load-test/invoice-generation.yml
```

**Success Criteria**:
- p95 response time < 500ms
- p99 response time < 1000ms
- Error rate < 1%
- Successful requests > 99%

---

## Security Testing

### Security Audit Checklist

**Authentication & Authorization**:
- [ ] JWT tokens expire after 7 days
- [ ] Refresh tokens are invalidated on logout
- [ ] Password requirements enforced (min 8 chars, complexity)
- [ ] Rate limiting on login endpoint (5 attempts per 15 min)
- [ ] Passwords hashed with bcrypt (cost factor 12)
- [ ] No sensitive data in JWT payload

**API Security**:
- [ ] All endpoints require authentication (except /auth/*)
- [ ] CORS properly configured
- [ ] HTTPS enforced in production
- [ ] SQL injection prevention (Prisma ORM)
- [ ] XSS prevention (input validation)
- [ ] CSRF protection enabled
- [ ] Request size limits enforced
- [ ] File upload validation (type, size)

**Data Protection**:
- [ ] Sensitive data encrypted at rest (Azure TDE)
- [ ] All data encrypted in transit (TLS 1.3)
- [ ] PII fields properly protected
- [ ] Secure blob storage (SAS tokens)
- [ ] Environment variables for secrets
- [ ] No secrets in source code

**Application Security**:
- [ ] Dependencies scanned for vulnerabilities (npm audit)
- [ ] Security headers implemented (Helmet.js)
- [ ] Error messages don't leak sensitive info
- [ ] Logging doesn't include PII
- [ ] Input validation on all endpoints (Zod)

### Penetration Testing

**Automated Security Scanning**:
```bash
# OWASP ZAP scan
docker run -t owasp/zap2docker-stable zap-baseline.py \
    -t https://api.yourapp.com \
    -r security-report.html

# npm audit
npm audit --production

# Snyk security scan
snyk test
```

**Manual Penetration Testing Scenarios**:
1. SQL Injection attempts
2. XSS injection in forms
3. JWT token manipulation
4. IDOR (Insecure Direct Object Reference)
5. CSRF attacks
6. Session fixation
7. Brute force attacks
8. File upload exploits

---

## Deployment

### Production Deployment Checklist

**Pre-Deployment**:
- [ ] All tests passing (unit, integration, e2e)
- [ ] Security audit completed
- [ ] Performance testing completed
- [ ] Database migrations tested
- [ ] Backup strategy verified
- [ ] Rollback plan documented
- [ ] Monitoring configured
- [ ] Alert rules set up

**Azure Deployment**:
```bash
# 1. Build backend
cd backend
npm run build

# 2. Deploy to Azure App Service
az webapp deployment source config-zip \
    --resource-group rental-mvp-rg \
    --name rental-mvp-api \
    --src ./dist.zip

# 3. Deploy Azure Functions
cd ../azure-functions
func azure functionapp publish rental-mvp-functions

# 4. Deploy web app
cd ../web-app
npm run build
az staticwebapp deploy \
    --name rental-mvp-web \
    --source ./build
```

**Post-Deployment**:
- [ ] Smoke tests passed
- [ ] Health check endpoints responding
- [ ] SSL certificate valid
- [ ] DNS properly configured
- [ ] Monitoring showing green
- [ ] First invoice generation successful (test run)

---

## Continuous Integration / Continuous Deployment

### GitHub Actions Workflow

```yaml
# .github/workflows/ci-cd.yml

name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
      working-directory: ./backend
    
    - name: Run linter
      run: npm run lint
      working-directory: ./backend
    
    - name: Run unit tests
      run: npm run test:unit
      working-directory: ./backend
      env:
        TEST_DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
    
    - name: Run integration tests
      run: npm run test:integration
      working-directory: ./backend
      env:
        TEST_DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        files: ./backend/coverage/lcov.info

  security:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Run npm audit
      run: npm audit --audit-level=high
      working-directory: ./backend
    
    - name: Run Snyk security scan
      uses: snyk/actions/node@master
      env:
        SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      with:
        args: --severity-threshold=high

  deploy-staging:
    needs: [test, security]
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to Staging
      uses: azure/webapps-deploy@v2
      with:
        app-name: 'rental-mvp-api-staging'
        publish-profile: ${{ secrets.AZURE_STAGING_PUBLISH_PROFILE }}
        package: ./backend

  deploy-production:
    needs: [test, security]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to Production
      uses: azure/webapps-deploy@v2
      with:
        app-name: 'rental-mvp-api'
        publish-profile: ${{ secrets.AZURE_PRODUCTION_PUBLISH_PROFILE }}
        package: ./backend
    
    - name: Run smoke tests
      run: npm run test:smoke
      env:
        API_URL: https://api.yourapp.com
```

---

**Document**: Part 5 of 6  
**Next**: Part 6 - User Guide & Operations  
**Status**: Ready for Implementation

