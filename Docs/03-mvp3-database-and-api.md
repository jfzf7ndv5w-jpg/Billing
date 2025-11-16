# MVP 3.0 - Database Schema & API Endpoints
**Rental Property Management System - Complete Documentation Part 3 of 6**

---

## Database Schema

### Complete Entity Relationship Diagram

```
┌─────────────┐         ┌──────────────┐
│ properties  │◄───────┤   tenants    │
└─────────────┘    1:N  └──────────────┘
       │                       │
       │ 1:N                   │ 1:N
       ▼                       ▼
┌─────────────┐         ┌──────────────┐
│  mortgages  │         │   invoices   │
└─────────────┘         └──────────────┘
                               │
                               │ 1:N
                               ▼
                        ┌──────────────┐
                        │   payments   │
                        └──────────────┘
       
┌─────────────┐         ┌──────────────┐
│   vendors   │◄───────┤  maintenance │
└─────────────┘    N:1  │   requests   │
                        └──────────────┘
                               │
                               │ 1:N
                               ▼
                        ┌──────────────┐
                        │   expenses   │
                        └──────────────┘
```

---

## Core Tables

### Properties Table

```sql
CREATE TABLE properties (
    id INT PRIMARY KEY IDENTITY(1,1),
    address NVARCHAR(255) NOT NULL,
    city NVARCHAR(100) NOT NULL,
    postal_code NVARCHAR(20) NOT NULL,
    country NVARCHAR(50) DEFAULT 'Netherlands',
    
    -- Purchase info
    purchase_date DATE NOT NULL,
    purchase_price DECIMAL(12,2) NOT NULL,
    current_value DECIMAL(12,2) NOT NULL,
    
    -- Property details
    property_type NVARCHAR(50), -- Apartment, House, Studio
    square_meters INT,
    bedrooms INT,
    bathrooms INT,
    
    -- Metadata
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    
    INDEX idx_property_city (city),
    INDEX idx_property_type (property_type)
);
```

### Tenants Table

```sql
CREATE TABLE tenants (
    id INT PRIMARY KEY IDENTITY(1,1),
    property_id INT FOREIGN KEY REFERENCES properties(id),
    
    -- Personal info
    first_name NVARCHAR(100) NOT NULL,
    last_name NVARCHAR(100) NOT NULL,
    email NVARCHAR(255) NOT NULL UNIQUE,
    phone NVARCHAR(20),
    
    -- Contract details
    contract_start_date DATE NOT NULL,
    contract_end_date DATE,
    
    -- Financial details
    monthly_rent DECIMAL(10,2) NOT NULL,
    service_charges DECIMAL(10,2) DEFAULT 0,
    utilities_advance DECIMAL(10,2) DEFAULT 0,
    
    -- Deposit
    deposit_amount DECIMAL(10,2) NOT NULL,
    deposit_paid_date DATE,
    
    -- Status
    is_active BIT DEFAULT 1,
    
    -- Metadata
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    
    INDEX idx_tenant_active (is_active),
    INDEX idx_tenant_email (email),
    INDEX idx_tenant_property (property_id)
);
```

### Invoices Table

```sql
CREATE TABLE invoices (
    id INT PRIMARY KEY IDENTITY(1,1),
    invoice_number NVARCHAR(50) NOT NULL UNIQUE,
    tenant_id INT FOREIGN KEY REFERENCES tenants(id),
    property_id INT FOREIGN KEY REFERENCES properties(id),
    
    -- Invoice details
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    month INT NOT NULL, -- 1-12
    year INT NOT NULL,
    
    -- Amounts
    base_rent DECIMAL(10,2) NOT NULL,
    service_charges DECIMAL(10,2) DEFAULT 0,
    utilities_advance DECIMAL(10,2) DEFAULT 0,
    other_charges DECIMAL(10,2) DEFAULT 0,
    discounts DECIMAL(10,2) DEFAULT 0,
    late_fees DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    
    -- Status tracking
    status NVARCHAR(20) NOT NULL, -- generated, sent, paid, overdue, cancelled
    sent_date DATETIME2,
    paid_date DATETIME2,
    email_sent BIT DEFAULT 0,
    
    -- Storage
    pdf_blob_url NVARCHAR(500),
    pdf_sas_token NVARCHAR(500),
    
    -- Metadata
    generated_by NVARCHAR(50), -- automated, manual
    notes NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    
    INDEX idx_invoice_status (status),
    INDEX idx_invoice_tenant (tenant_id),
    INDEX idx_invoice_date (invoice_date),
    INDEX idx_invoice_month_year (month, year),
    
    CONSTRAINT chk_invoice_status CHECK (
        status IN ('generated', 'sent', 'paid', 'overdue', 'cancelled')
    ),
    CONSTRAINT chk_invoice_month CHECK (month BETWEEN 1 AND 12)
);
```

### Payments Table

```sql
CREATE TABLE payments (
    id INT PRIMARY KEY IDENTITY(1,1),
    invoice_id INT FOREIGN KEY REFERENCES invoices(id),
    tenant_id INT FOREIGN KEY REFERENCES tenants(id),
    
    -- Payment details
    payment_date DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method NVARCHAR(50), -- Bank Transfer, Cash, iDEAL
    payment_reference NVARCHAR(100),
    bank_transaction_id NVARCHAR(100),
    
    -- Reconciliation
    matched_automatically BIT DEFAULT 0,
    matched_by_user_id INT,
    matched_date DATETIME2,
    
    -- Status
    status NVARCHAR(20) DEFAULT 'confirmed', -- pending, confirmed, reversed
    notes NVARCHAR(MAX),
    
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    
    INDEX idx_payment_invoice (invoice_id),
    INDEX idx_payment_date (payment_date),
    INDEX idx_payment_status (status)
);
```

### Expenses Table

```sql
CREATE TABLE expenses (
    id INT PRIMARY KEY IDENTITY(1,1),
    property_id INT FOREIGN KEY REFERENCES properties(id),
    maintenance_request_id INT FOREIGN KEY REFERENCES maintenance_requests(id),
    
    -- Expense details
    expense_date DATE NOT NULL,
    category NVARCHAR(50) NOT NULL,
    subcategory NVARCHAR(100),
    description NVARCHAR(500) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    
    -- Vendor
    vendor_id INT FOREIGN KEY REFERENCES vendors(id),
    vendor_name NVARCHAR(200),
    
    -- Tax
    is_tax_deductible BIT DEFAULT 1,
    vat_amount DECIMAL(10,2) DEFAULT 0,
    vat_percentage DECIMAL(5,2) DEFAULT 21.00,
    
    -- Documentation
    receipt_blob_url NVARCHAR(500),
    invoice_number NVARCHAR(100),
    
    -- Payment
    payment_status NVARCHAR(20) DEFAULT 'unpaid',
    payment_date DATE,
    payment_reference NVARCHAR(100),
    
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    
    INDEX idx_expense_date (expense_date),
    INDEX idx_expense_category (category),
    INDEX idx_expense_property (property_id)
);
```

### Maintenance Requests Table

```sql
CREATE TABLE maintenance_requests (
    id INT PRIMARY KEY IDENTITY(1,1),
    property_id INT FOREIGN KEY REFERENCES properties(id),
    tenant_id INT FOREIGN KEY REFERENCES tenants(id),
    
    -- Request details
    title NVARCHAR(200) NOT NULL,
    description NVARCHAR(MAX) NOT NULL,
    category NVARCHAR(50) NOT NULL,
    priority NVARCHAR(20) NOT NULL,
    
    -- Status workflow
    status NVARCHAR(20) NOT NULL DEFAULT 'open',
    reported_date DATETIME2 DEFAULT GETDATE(),
    started_date DATETIME2,
    completed_date DATETIME2,
    
    -- Assignment
    assigned_vendor_id INT FOREIGN KEY REFERENCES vendors(id),
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    
    -- Photos
    photos_blob_urls NVARCHAR(MAX), -- JSON array
    
    -- Resolution
    resolution_notes NVARCHAR(MAX),
    tenant_satisfaction_rating INT,
    
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    
    INDEX idx_maintenance_status (status),
    INDEX idx_maintenance_property (property_id),
    INDEX idx_maintenance_date (reported_date)
);
```

---

## API Endpoints

### Base URL
```
Production: https://api.yourapp.com/v1
Development: http://localhost:3001/api/v1
```

### Authentication
All endpoints (except `/auth/*`) require Bearer token authentication:
```
Authorization: Bearer {JWT_TOKEN}
```

---

## Invoice Endpoints

### Create Invoice
```http
POST /api/v1/invoices
Content-Type: application/json

Request Body:
{
  "tenantId": 1,
  "month": 1,
  "year": 2025,
  "baseRent": 1200.00,
  "serviceCharges": 50.00,
  "utilitiesAdvance": 75.00,
  "dueDate": "2025-02-05",
  "notes": "Optional note"
}

Response 201:
{
  "id": 123,
  "invoiceNumber": "INV-2025-01-001",
  "tenantId": 1,
  "tenantName": "John Doe",
  "invoiceDate": "2025-01-25",
  "dueDate": "2025-02-05",
  "totalAmount": 1325.00,
  "status": "generated",
  "pdfBlobUrl": "https://storage.blob.core.windows.net/...",
  "createdAt": "2025-01-25T09:00:00Z"
}
```

### Get All Invoices
```http
GET /api/v1/invoices?status=sent&year=2025&month=1&limit=50&offset=0

Response 200:
{
  "invoices": [
    {
      "id": 123,
      "invoiceNumber": "INV-2025-01-001",
      "tenant": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com"
      },
      "month": 1,
      "year": 2025,
      "totalAmount": 1325.00,
      "status": "sent",
      "dueDate": "2025-02-05",
      "pdfBlobUrl": "https://..."
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

### Get Single Invoice
```http
GET /api/v1/invoices/123

Response 200:
{
  "id": 123,
  "invoiceNumber": "INV-2025-01-001",
  "tenant": { ... },
  "property": { ... },
  "invoiceDate": "2025-01-25",
  "dueDate": "2025-02-05",
  "baseRent": 1200.00,
  "serviceCharges": 50.00,
  "utilitiesAdvance": 75.00,
  "totalAmount": 1325.00,
  "status": "sent",
  "sentDate": "2025-01-25T09:15:00Z",
  "pdfBlobUrl": "https://...",
  "createdAt": "2025-01-25T09:00:00Z",
  "updatedAt": "2025-01-25T09:15:00Z"
}
```

### Send Invoice
```http
POST /api/v1/invoices/123/send
Content-Type: application/json

Request Body:
{
  "ccEmail": "landlord@example.com"
}

Response 200:
{
  "success": true,
  "message": "Invoice sent successfully",
  "sentDate": "2025-01-25T10:30:00Z",
  "recipients": {
    "to": "john@example.com",
    "cc": "landlord@example.com"
  }
}
```

### Update Invoice Status
```http
PATCH /api/v1/invoices/123
Content-Type: application/json

Request Body:
{
  "status": "paid",
  "paidDate": "2025-02-03"
}

Response 200:
{
  "id": 123,
  "status": "paid",
  "paidDate": "2025-02-03",
  "updatedAt": "2025-02-03T14:20:00Z"
}
```

### Generate Batch Invoices
```http
POST /api/v1/invoices/generate-batch
Content-Type: application/json

Request Body:
{
  "month": 2,
  "year": 2025,
  "tenantIds": [1, 2, 3] // Optional, all active if omitted
}

Response 200:
{
  "success": true,
  "generated": 3,
  "failed": 0,
  "invoices": [
    {
      "tenantId": 1,
      "invoiceNumber": "INV-2025-02-001",
      "status": "success"
    },
    {
      "tenantId": 2,
      "invoiceNumber": "INV-2025-02-002",
      "status": "success"
    },
    {
      "tenantId": 3,
      "invoiceNumber": "INV-2025-02-003",
      "status": "success"
    }
  ]
}
```

---

## Payment Endpoints

### Record Payment
```http
POST /api/v1/payments
Content-Type: application/json

Request Body:
{
  "invoiceId": 123,
  "paymentDate": "2025-02-03",
  "amount": 1325.00,
  "paymentMethod": "Bank Transfer",
  "paymentReference": "INV-2025-01-001",
  "bankTransactionId": "TXN123456",
  "notes": "Paid on time"
}

Response 201:
{
  "id": 456,
  "invoiceId": 123,
  "paymentDate": "2025-02-03",
  "amount": 1325.00,
  "paymentMethod": "Bank Transfer",
  "status": "confirmed",
  "invoice": {
    "invoiceNumber": "INV-2025-01-001",
    "status": "paid",
    "paidDate": "2025-02-03"
  }
}
```

### Get Payments
```http
GET /api/v1/payments?invoiceId=123

Response 200:
{
  "payments": [
    {
      "id": 456,
      "invoiceId": 123,
      "paymentDate": "2025-02-03",
      "amount": 1325.00,
      "paymentMethod": "Bank Transfer",
      "paymentReference": "INV-2025-01-001",
      "status": "confirmed"
    }
  ],
  "total": 1
}
```

### Import Bank Statement
```http
POST /api/v1/payments/import-bank-statement
Content-Type: multipart/form-data

Form Data:
- file: bank-statement.csv
- bankAccount: "NL91ABNA0417164300"

Response 200:
{
  "success": true,
  "imported": 15,
  "matched": 12,
  "unmatched": 3,
  "transactions": [
    {
      "date": "2025-02-03",
      "amount": 1325.00,
      "reference": "INV-2025-01-001",
      "matched": true,
      "invoiceId": 123
    }
  ]
}
```

---

## Maintenance Endpoints

### Create Maintenance Request
```http
POST /api/v1/maintenance-requests
Content-Type: application/json

Request Body:
{
  "propertyId": 1,
  "tenantId": 1,
  "title": "Leaking faucet in kitchen",
  "description": "The kitchen faucet has been dripping for 3 days...",
  "category": "Plumbing",
  "priority": "medium"
}

Response 201:
{
  "id": 789,
  "title": "Leaking faucet in kitchen",
  "category": "Plumbing",
  "priority": "medium",
  "status": "open",
  "reportedDate": "2025-02-10T14:30:00Z"
}
```

### Assign Vendor
```http
PATCH /api/v1/maintenance-requests/789/assign
Content-Type: application/json

Request Body:
{
  "vendorId": 5,
  "estimatedCost": 150.00
}

Response 200:
{
  "id": 789,
  "assignedVendor": {
    "id": 5,
    "name": "ABC Plumbing Services"
  },
  "estimatedCost": 150.00,
  "status": "in_progress"
}
```

---

## Report Endpoints

### Get Monthly Summary
```http
GET /api/v1/reports/monthly/2025/1

Response 200:
{
  "month": 1,
  "year": 2025,
  "income": {
    "rentalIncome": 1200.00,
    "otherIncome": 0,
    "total": 1200.00
  },
  "expenses": {
    "maintenance": 150.00,
    "management": 60.00,
    "insurance": 45.00,
    "total": 255.00
  },
  "netIncome": 945.00,
  "invoices": {
    "generated": 1,
    "sent": 1,
    "paid": 1,
    "overdue": 0
  },
  "payments": {
    "received": 1,
    "totalAmount": 1200.00,
    "averageDaysToPayment": 3
  }
}
```

### Get Annual Report
```http
GET /api/v1/reports/annual/2025

Response 200:
{
  "year": 2025,
  "income": {
    "rentalIncome": 14400.00,
    "otherIncome": 0,
    "total": 14400.00
  },
  "expenses": {
    "byCategory": {
      "maintenance": 1800.00,
      "management": 720.00,
      "insurance": 540.00,
      "propertyTax": 350.00,
      "utilities": 450.00
    },
    "total": 3860.00
  },
  "netIncome": 10540.00,
  "roe": 12.5,
  "taxDeductible": 3210.00
}
```

### Get ROE Calculation
```http
GET /api/v1/reports/roe/1?period=quarterly

Response 200:
{
  "propertyId": 1,
  "period": "Q1 2025",
  "propertyValue": 350000.00,
  "mortgageBalance": 265000.00,
  "equity": 85000.00,
  "netOperatingIncome": 10540.00,
  "roe": 12.41,
  "roeChange": 1.2,
  "breakdown": {
    "rentalIncome": 14400.00,
    "operatingExpenses": 3860.00,
    "mortgageInterest": 0
  }
}
```

---

## Admin Endpoints

### Trigger Monthly Invoice Generation
```http
POST /api/v1/admin/trigger-monthly-invoices
Authorization: Bearer {ADMIN_TOKEN}

Response 200:
{
  "success": true,
  "generated": 3,
  "failed": 0,
  "results": [
    {
      "tenant": "John Doe",
      "invoice": "INV-2025-02-001",
      "status": "success"
    }
  ]
}
```

### Get Job History
```http
GET /api/v1/admin/job-history?type=monthly-invoice&limit=10

Response 200:
{
  "jobs": [
    {
      "id": "job-123",
      "type": "monthly-invoice",
      "startedAt": "2025-01-25T09:00:00Z",
      "completedAt": "2025-01-25T09:05:32Z",
      "status": "completed",
      "results": {
        "success": 3,
        "failed": 0
      }
    }
  ]
}
```

---

## Error Responses

### Standard Error Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      {
        "field": "month",
        "message": "Month must be between 1 and 12"
      }
    ]
  },
  "timestamp": "2025-01-25T10:00:00Z",
  "path": "/api/v1/invoices"
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `UNAUTHORIZED` | 401 | Missing or invalid auth token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Duplicate resource |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `SERVICE_UNAVAILABLE` | 503 | Temporary unavailability |

---

**Document**: Part 3 of 6  
**Next**: Part 4 - User Interfaces (iOS & Web)  
**Status**: Ready for Implementation

