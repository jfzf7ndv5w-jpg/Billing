# System Architecture - Rental Property Billing MVP

## 📋 Table of Contents
1. [Current Architecture (Implemented)](#current-architecture-implemented)
2. [MVP Requirements (In Progress)](#mvp-requirements-in-progress)
3. [Future Architecture (Post-MVP)](#future-architecture-post-mvp)

---

## ✅ Current Architecture (Implemented)

> **Status**: Week 2 Day 3 Complete - Backend API with automated invoice generation, PDF creation, and email delivery

### **Current System Overview**

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CURRENTLY IMPLEMENTED (Week 1-2)                  │
└─────────────────────────────────────────────────────────────────────┘

                         REST API (HTTP)
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      BACKEND API (Node.js + Express)                 │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │                    API Routes (Express)                     │   │
│  │  /auth  │  /properties  │  /tenants  │  /invoices  │       │   │
│  └────┬────────────┬──────────────┬────────────┬──────────────┘   │
│       │            │              │            │                   │
│  ┌────▼────────────▼──────────────▼────────────▼──────────────┐   │
│  │              Middleware Layer                              │   │
│  │  ✅ JWT Authentication  ✅ RBAC  ✅ Error Handling         │   │
│  └────┬────────────┬──────────────┬────────────┬──────────────┘   │
│       │            │              │            │                   │
│  ┌────▼────────────▼──────────────▼────────────▼──────────────┐   │
│  │              Controllers Layer                             │   │
│  │  ✅ auth  ✅ property  ✅ tenant  ✅ invoice                │   │
│  └────┬────────────┬──────────────┬────────────┬──────────────┘   │
│       │            │              │            │                   │
│  ┌────▼────────────▼──────────────▼────────────▼──────────────┐   │
│  │              Services Layer (Business Logic)               │   │
│  │                                                             │   │
│  │  ✅ invoiceService    - Auto-generate invoices             │   │
│  │                       - Calculate late fees                │   │
│  │                       - Invoice stats                      │   │
│  │                                                             │   │
│  │  ✅ pdfService        - Professional PDF generation        │   │
│  │                       - Uses PDFKit                        │   │
│  │                       - Template-based invoices            │   │
│  │                                                             │   │
│  │  ✅ emailService      - SendGrid integration               │   │
│  │                       - HTML email templates               │   │
│  │                       - PDF attachments                    │   │
│  │                       - Payment reminders                  │   │
│  │                                                             │   │
│  │  ✅ configService     - Secure config API                  │   │
│  │                       - CSV-based storage                  │   │
│  │                       - Scoped access methods              │   │
│  │                       - Git-ignored sensitive data         │   │
│  └─────────────────────────┬───────────────────────────────────┘   │
│                            │                                        │
│  ┌─────────────────────────▼───────────────────────────────────┐   │
│  │                   Prisma ORM Layer                          │   │
│  │  ✅ Type-safe queries  ✅ Migrations  ✅ Relations          │   │
│  └─────────────────────────┬───────────────────────────────────┘   │
└────────────────────────────┼────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    DATABASE (SQLite - Development)                   │
│                                                                      │
│  ✅ Users          - Authentication & authorization                 │
│  ✅ Properties     - Rental properties                              │
│  ✅ Tenants        - Tenant information                             │
│  ✅ Invoices       - Invoice records                                │
│  ✅ Payments       - Payment tracking (schema ready)                │
└─────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     FILE STORAGE (Local)                             │
│                                                                      │
│  📁 backend/pdfs/          - Generated PDF invoices                 │
│  📁 backend/INPUTS/        - Configuration (Git-ignored)            │
│     └── landlord-config.csv  - Company & bank details               │
└─────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES (Optional)                       │
│                                                                      │
│  📧 SendGrid               - Email delivery (simulated if not set)  │
│     └── Status: Ready, works with or without API key                │
└─────────────────────────────────────────────────────────────────────┘
```

### **Current Features (✅ Implemented)**

| Feature | Status | Description |
|---------|--------|-------------|
| **Authentication** | ✅ Complete | JWT-based auth with landlord/admin roles |
| **Property Management** | ✅ Complete | CRUD operations for properties |
| **Tenant Management** | ✅ Complete | CRUD operations for tenants |
| **Invoice Generation** | ✅ Complete | Auto-generate invoices for all tenants |
| **PDF Creation** | ✅ Complete | Professional PDF invoices with branding |
| **Email Delivery** | ✅ Complete | Send invoices with PDF attachments |
| **Configuration System** | ✅ Complete | Secure CSV-based config with API access |
| **Late Fee Calculation** | ✅ Complete | Automatic late fee application |
| **Database Schema** | ✅ Complete | Full relational schema with Prisma |

### **Current API Endpoints (21 Endpoints)**

**Authentication (2)**
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login and get JWT token

**Properties (5)**
- `GET /api/v1/properties` - Get all properties
- `GET /api/v1/properties/:id` - Get single property
- `POST /api/v1/properties` - Create property
- `PATCH /api/v1/properties/:id` - Update property
- `DELETE /api/v1/properties/:id` - Delete property

**Tenants (6)**
- `GET /api/v1/tenants` - Get all tenants
- `GET /api/v1/tenants/:id` - Get single tenant
- `POST /api/v1/tenants` - Create tenant
- `PATCH /api/v1/tenants/:id` - Update tenant
- `DELETE /api/v1/tenants/:id` - Delete tenant
- `POST /api/v1/tenants/:id/deactivate` - Deactivate tenant

**Invoices (8)**
- `GET /api/v1/invoices` - Get all invoices
- `GET /api/v1/invoices/stats` - Get statistics
- `GET /api/v1/invoices/generation-stats` - Generation stats for month
- `GET /api/v1/invoices/:id` - Get single invoice
- `POST /api/v1/invoices` - Create invoice manually
- `POST /api/v1/invoices/generate` - Auto-generate for all tenants
- `POST /api/v1/invoices/calculate-late-fees` - Apply late fees
- `POST /api/v1/invoices/:id/send` - Send invoice via email
- `POST /api/v1/invoices/:id/pdf` - Generate PDF
- `GET /api/v1/invoices/:id/pdf/download` - Download PDF
- `PATCH /api/v1/invoices/:id` - Update invoice

---

## 🔄 MVP Requirements (In Progress - Week 2-5)

> **Target**: Minimum Viable Product for landlord use

### **What's Needed for MVP**

```
┌─────────────────────────────────────────────────────────────────────┐
│                     MVP ARCHITECTURE (Week 2-5)                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT APPLICATIONS                           │
│                                                                      │
│  📱 iOS Mobile App (Week 4)        💻 Web Dashboard (Week 5)        │
│     • SwiftUI                          • React.js + TypeScript      │
│     • View properties/tenants          • Same features as mobile    │
│     • View/send invoices               • Desktop-optimized UI       │
│     • Track payments                   • Charts and analytics       │
│     • Push notifications               • Bulk operations            │
│                                                                      │
│     Status: 📋 Planned                 Status: 📋 Planned           │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           │ REST API (HTTPS in production)
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    BACKEND API (Already Complete)                    │
│                   ✅ Week 1-2 Implementation Done                    │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    AUTOMATED WORKFLOWS (Week 2)                      │
│                                                                      │
│  ⏰ Azure Functions (Week 2 Day 4-6)                                │
│     • Timer-triggered invoice generation                            │
│     • Scheduled late fee calculation                                │
│     • Payment reminder emails                                       │
│     • Monthly reporting                                             │
│                                                                      │
│     Status: 📋 This Week                                            │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    PAYMENT PROCESSING (Week 3)                       │
│                                                                      │
│  💳 Stripe / Mollie Integration                                     │
│     • Payment links in emails                                       │
│     • Webhook handling                                              │
│     • Automatic payment reconciliation                              │
│     • Payment receipt generation                                    │
│                                                                      │
│     Status: 📋 Planned                                              │
└─────────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    PRODUCTION INFRASTRUCTURE                         │
│                                                                      │
│  🗄️  PostgreSQL (Neon.tech)   - Production database                │
│  ☁️  Azure Blob Storage        - PDF storage                        │
│  📧 SendGrid                   - Email delivery                     │
│  🔐 Azure Key Vault            - Secrets management                 │
│                                                                      │
│     Status: 📋 Week 8-10 Deployment                                 │
└─────────────────────────────────────────────────────────────────────┘
```

### **MVP Completion Timeline**

| Week | Focus | Status |
|------|-------|--------|
| **Week 0** | Planning & Documentation | ✅ Complete |
| **Week 1** | Backend Foundation & API | ✅ Complete |
| **Week 2** | Automated Invoice System | 🔄 Day 3/6 Complete |
| **Week 3** | Payment Processing | 📋 Planned |
| **Week 4** | iOS Mobile App | 📋 Planned |
| **Week 5** | Web Dashboard | 📋 Planned |
| **Week 6-7** | Testing & Refinement | 📋 Planned |
| **Week 8-10** | Production Deployment | 📋 Planned |

### **MVP Feature Checklist**

**Core Functionality (Week 1-3)**
- [x] User authentication with JWT
- [x] Property management (CRUD)
- [x] Tenant management (CRUD)
- [x] Invoice generation (manual & automated)
- [x] PDF invoice creation
- [x] Email delivery with attachments
- [x] Configuration management
- [ ] Azure Functions for automation (Week 2 Day 4-6)
- [ ] Payment processing integration (Week 3)
- [ ] Payment reconciliation (Week 3)

**Client Applications (Week 4-5)**
- [ ] iOS mobile app
- [ ] Web dashboard
- [ ] Push notifications
- [ ] Offline support

**Production Ready (Week 8-10)**
- [ ] PostgreSQL migration
- [ ] Azure Blob Storage
- [ ] SSL/HTTPS
- [ ] Azure Key Vault
- [ ] Monitoring & logging
- [ ] Backup & recovery

---

## 🚀 Future Architecture (Post-MVP)

> **Timeline**: After initial MVP launch (Week 11+)

### **Future Enhancements**

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FUTURE ARCHITECTURE (Post-MVP)                    │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                      EXPANDED CLIENT LAYER                           │
│                                                                      │
│  📱 Tenant Mobile App     🌐 Tenant Web Portal     🖥️  Admin Portal │
│     • View lease             • Online payments        • Analytics   │
│     • Pay rent               • Maintenance            • Reports     │
│     • Maintenance            • Documents              • Multi-user  │
│     • Chat                   • Communication          • Audit logs  │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     API GATEWAY & LOAD BALANCER                      │
│                                                                      │
│  • Azure API Management                                             │
│  • Rate limiting & throttling                                       │
│  • API versioning                                                   │
│  • Request/response caching                                         │
│  • DDoS protection                                                  │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    MICROSERVICES ARCHITECTURE                        │
│                                                                      │
│  🏠 Property Service     👤 Tenant Service      💰 Billing Service  │
│  💳 Payment Service      📧 Notification        📊 Analytics        │
│  📄 Document Service     🔐 Auth Service        🤖 AI/ML Service    │
│                                                                      │
│  • Containerized with Docker                                        │
│  • Kubernetes orchestration                                         │
│  • Service mesh (Istio)                                             │
│  • Event-driven architecture                                        │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      MESSAGE QUEUE & EVENTS                          │
│                                                                      │
│  📬 Azure Service Bus / RabbitMQ                                    │
│     • Async processing                                              │
│     • Event sourcing                                                │
│     • CQRS pattern                                                  │
│     • Saga orchestration                                            │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      ADVANCED DATA LAYER                             │
│                                                                      │
│  🗄️  PostgreSQL Cluster (Primary + Replicas)                       │
│  🔴 Redis Cache (Session & data caching)                            │
│  📊 Elasticsearch (Full-text search & analytics)                    │
│  💾 Azure Cosmos DB (Multi-region, low-latency)                     │
└─────────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    AI/ML & ADVANCED FEATURES                         │
│                                                                      │
│  🤖 ML Models                                                       │
│     • Payment prediction                                            │
│     • Tenant risk scoring                                           │
│     • Pricing optimization                                          │
│     • Anomaly detection                                             │
│                                                                      │
│  💬 Communication                                                   │
│     • In-app messaging                                              │
│     • SMS notifications (Twilio)                                    │
│     • Voice calls                                                   │
│     • WhatsApp integration                                          │
│                                                                      │
│  📸 Document Processing                                             │
│     • OCR for receipts                                              │
│     • AI document classification                                    │
│     • Automated data extraction                                     │
│                                                                      │
│  📊 Advanced Analytics                                              │
│     • Business intelligence                                         │
│     • Predictive analytics                                          │
│     • Custom dashboards                                             │
│     • Multi-property portfolio management                           │
└─────────────────────────────────────────────────────────────────────┘
```

### **Future Features (Post-MVP)**

**Tenant Portal**
- Self-service payment portal
- Maintenance request system
- Lease document management
- Communication with landlord
- Rental history

**Advanced Landlord Features**
- Multi-property portfolio management
- Expense tracking and categorization
- Tax reporting and export
- Tenant screening integration
- Maintenance vendor management
- Insurance integration

**Analytics & Insights**
- Occupancy rate tracking
- Revenue forecasting
- Payment pattern analysis
- Tenant retention metrics
- Maintenance cost tracking
- ROI calculations

**Automation & AI**
- Predictive maintenance scheduling
- Smart rent pricing recommendations
- Tenant default risk prediction
- Automated lease renewals
- Chatbot for tenant inquiries
- Document auto-classification

**Integration Ecosystem**
- Accounting software (QuickBooks, Xero)
- Banking APIs (Plaid)
- Property listing platforms
- Background check services
- Insurance providers
- Utility companies

**Mobile Features**
- Offline mode with sync
- Biometric authentication
- Document scanning
- Push notifications
- Real-time chat
- GPS check-ins for inspections

### **Scaling & Infrastructure**

**Performance Targets (Post-MVP)**
- Support 1000+ properties
- Support 5000+ tenants
- 99.9% uptime SLA
- < 200ms API response time
- < 3 second page load time

**Security Enhancements**
- Multi-factor authentication
- Biometric authentication
- Penetration testing
- Security audit logging
- Compliance certifications (GDPR, SOC 2)
- Bug bounty program

**Operational Excellence**
- Blue-green deployments
- A/B testing framework
- Feature flags
- Automated rollback
- Disaster recovery plan
- 24/7 monitoring

---

## 📊 Architecture Comparison

| Aspect | Current (Week 1-2) | MVP (Week 10) | Future (Year 1+) |
|--------|-------------------|---------------|------------------|
| **Backend** | Monolith (Node.js) | Monolith + Functions | Microservices |
| **Database** | SQLite (local) | PostgreSQL (cloud) | PostgreSQL + Redis + Elasticsearch |
| **Storage** | Local filesystem | Azure Blob Storage | CDN + Multi-region storage |
| **Email** | SendGrid (optional) | SendGrid (required) | Multi-channel (Email/SMS/Push) |
| **Auth** | JWT | JWT + OAuth | JWT + OAuth + MFA + Biometrics |
| **Clients** | None (API only) | iOS + Web | iOS + Android + Web + Tenant Portal |
| **Automation** | Manual triggers | Azure Functions | Event-driven + AI/ML |
| **Payments** | Not implemented | Stripe/Mollie | Multiple processors + crypto |
| **Monitoring** | Console logs | Application Insights | Full observability stack |
| **Scale** | 1-10 properties | 100+ properties | 1000+ properties |

---

## 🎯 Current Focus (Week 2 Day 3)

**✅ Completed:**
- Backend API (21 endpoints)
- Invoice generation system
- PDF generation with professional templates
- Email delivery with SendGrid
- Secure configuration system
- Database schema with Prisma

**🔄 In Progress (Week 2 Day 4-6):**
- Azure Functions for automation
- Scheduled invoice generation
- Automated late fee calculation
- Payment reminder system

**📋 Next Up (Week 3):**
- Payment processing integration
- Stripe/Mollie setup
- Payment webhooks
- Automatic reconciliation

---

## 🏛️ Governance & Synchronization

> **Purpose**: Ensure frontend and backend remain in perfect sync throughout development and deployment

### Core Governance Principles

1. **Single Source of Truth**: Database schema (Prisma) drives all type definitions
2. **Type Safety End-to-End**: TypeScript backend → TypeScript frontend → Swift iOS
3. **API Contract First**: OpenAPI specification defines contracts before implementation
4. **Automated Synchronization**: Types auto-generated, breaking changes blocked by CI/CD

### Frontend-Backend Sync Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    GOVERNANCE LAYER                              │
│              (Single Source of Truth)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📄 API Contract (OpenAPI/Swagger)                              │
│     • All endpoints defined                                     │
│     • Request/response schemas                                  │
│     • Authentication requirements                               │
│                                                                  │
│  📊 Database Schema (Prisma)                                    │
│     • Single source for data models                             │
│     • Migrations auto-generated                                 │
│     • Types exported to all layers                              │
│                                                                  │
│  📋 Shared Types Package                                        │
│     • Generated from Prisma                                     │
│     • Shared across all projects                                │
│     • Version controlled                                        │
│                                                                  │
└─────────────────────────┬───────────────────────────────────────┘
                          │
            Generates Types & Validates
                          │
        ┌─────────────────┴──────────────────┐
        │                                    │
        ▼                                    ▼
┌───────────────────┐              ┌───────────────────┐
│  BACKEND (Source) │              │ FRONTEND (Consumer)│
│  • Implements API │              │ • Uses types       │
│  • Exports types  │──────────────▶│ • Type-safe calls │
│  • Enforces schema│              │ • Auto-validated   │
└───────────────────┘              └───────────────────┘
```

### Type Synchronization Workflow

```
1. Update Prisma Schema
   prisma/schema.prisma
         ↓
2. Run Migration
   npx prisma migrate dev
         ↓
3. Generate Types
   Auto-generate TypeScript types
   Auto-generate Swift types (iOS)
         ↓
4. Update API Implementation
   Backend uses new types
         ↓
5. Frontend Updates
   TypeScript compilation shows errors if incompatible
   Developer fixes frontend code
         ↓
6. CI/CD Validation
   • Type check passes
   • Tests pass
   • Ready to deploy
```

### Version Control Strategy

**API Versioning**:
- `/api/v1/...` - Current stable version
- `/api/v2/...` - Future breaking changes

**Semantic Versioning**:
- **Major** (v2.0.0): Breaking changes (field removed, type changed)
- **Minor** (v1.1.0): New features (new optional fields, new endpoints)
- **Patch** (v1.0.1): Bug fixes (no API changes)

### Change Management

**Non-Breaking Changes** (Safe):
- ✅ Adding optional fields
- ✅ Adding new endpoints
- ✅ Adding new enum values
- ✅ Relaxing validation

**Breaking Changes** (Requires major version):
- ❌ Removing fields
- ❌ Changing field types
- ❌ Renaming endpoints
- ❌ Stricter validation

**Breaking Change Process**:
1. Create new API version
2. Maintain old version for 6 months
3. Update all clients to new version
4. Deprecate old version
5. Remove after transition period

### Governance Checklist

**Before Every Commit**:
- [ ] Prisma schema valid
- [ ] Types generated if schema changed
- [ ] OpenAPI spec updated if API changed
- [ ] Backend tests pass
- [ ] Frontend compiles (no type errors)
- [ ] Documentation updated

**Before Every Release**:
- [ ] Full test suite passes
- [ ] Type compatibility verified
- [ ] Breaking changes documented
- [ ] Version bumped correctly
- [ ] Changelog updated

### Key Governance Rules

1. **Database Schema is Truth**: All models in `prisma/schema.prisma`
2. **API Contract First**: Write OpenAPI spec before implementation
3. **No Breaking Changes Without Major Version**: Backward compatibility required
4. **Type Safety Everywhere**: No `any` types allowed
5. **Test Coverage Required**: Backend >75%, Frontend >60%

### Deployment Order

**Always Follow This Order**:
```
1. Backend deployed first
   ↓
2. Health check passes
   ↓
3. Frontend deployed second
   ↓
4. Smoke tests run
   ↓
5. Rollback if failures
```

**Never**:
- ❌ Deploy frontend before backend
- ❌ Deploy breaking changes without frontend update
- ❌ Deploy without running tests

### Living Document

This governance structure evolves with the project. Review and update after each major milestone (Week 5, Week 8, Week 10).

---

**Generated**: 2025-11-23
**Version**: 3.2
**Status**: Week 2 Day 3 Complete - Email Integration Done
**Includes**: Merged Governance Structure for complete reference
