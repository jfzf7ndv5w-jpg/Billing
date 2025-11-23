# Governance Structure
## Frontend-Backend Synchronization Framework

**Purpose**: Ensure frontend and backend remain in perfect sync throughout development and deployment.

**Version**: 1.0
**Date**: November 23, 2025

---

## 🎯 Core Principles

### 1. **Single Source of Truth**
- Backend API defines the contract
- Frontend conforms to backend specifications
- Database schema drives both layers

### 2. **Type Safety End-to-End**
- TypeScript on backend
- TypeScript on frontend (web)
- Swift types mirror API contracts (iOS)

### 3. **Automated Synchronization**
- API changes trigger frontend updates
- Breaking changes blocked by CI/CD
- Version compatibility enforced

### 4. **Documentation First**
- API documented before implementation
- Frontend built against documentation
- Changes documented immediately

---

## 🏗️ Architecture Governance

### Three-Layer Synchronization Model

```
┌─────────────────────────────────────────────────────────────────┐
│                    GOVERNANCE LAYER                              │
│              (Single Source of Truth)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📄 API Contract (OpenAPI/Swagger Specification)                │
│     • Defines all endpoints                                     │
│     • Request/response schemas                                  │
│     • Authentication requirements                               │
│     • Error formats                                             │
│                                                                  │
│  📊 Database Schema (Prisma Schema)                             │
│     • Single source for data models                             │
│     • Migrations auto-generated                                 │
│     • Types exported to all layers                              │
│                                                                  │
│  📋 Shared Types (@rental-mvp/types package)                    │
│     • Generated from Prisma                                     │
│     • Shared across all projects                                │
│     • Version controlled                                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                          ▲           ▲
                          │           │
            Generates     │           │     Consumes
            Types &       │           │     Types &
            Validates     │           │     Validates
                          │           │
        ┌─────────────────┴───┐   ┌───┴──────────────────┐
        │                     │   │                      │
        │   BACKEND LAYER     │   │   FRONTEND LAYER     │
        │   (Source)          │   │   (Consumer)         │
        │                     │   │                      │
        └─────────────────────┘   └──────────────────────┘
```

---

## 📋 Governance Structure Components

### 1. Shared Type System

**Location**: `packages/types/` (monorepo) or separate npm package

**Purpose**: Single type definitions used by all projects

**Structure**:
```
packages/types/
├── src/
│   ├── models/              # Database models (from Prisma)
│   │   ├── Property.ts
│   │   ├── Tenant.ts
│   │   ├── Invoice.ts
│   │   └── Payment.ts
│   ├── api/                 # API request/response types
│   │   ├── requests/
│   │   │   ├── CreatePropertyRequest.ts
│   │   │   ├── CreateInvoiceRequest.ts
│   │   │   └── ...
│   │   └── responses/
│   │       ├── PropertyResponse.ts
│   │       ├── InvoiceListResponse.ts
│   │       └── ...
│   ├── enums/               # Shared enums
│   │   ├── InvoiceStatus.ts
│   │   ├── PaymentMethod.ts
│   │   └── UserRole.ts
│   └── index.ts             # Barrel export
├── scripts/
│   └── generate-from-prisma.ts  # Auto-generate from schema
├── package.json
└── tsconfig.json
```

**Usage**:
```typescript
// Backend
import { Property, CreatePropertyRequest } from '@rental-mvp/types';

// Frontend Web
import { Invoice, InvoiceListResponse } from '@rental-mvp/types';

// iOS (via TypeScript → Swift converter)
// Generated Swift files mirror TypeScript types
```

---

### 2. API Contract Management

**Tool**: OpenAPI 3.0 (Swagger)

**Location**: `backend/src/config/swagger.ts`

**Workflow**:

```
1. Define API in OpenAPI Spec
         ▼
2. Backend implements to spec
         ▼
3. Auto-generate client SDKs
         ▼
4. Frontend uses generated SDKs
         ▼
5. Types enforced at compile-time
```

**Example OpenAPI Definition**:
```yaml
# backend/openapi.yaml
paths:
  /api/v1/invoices:
    post:
      summary: Generate invoices for all tenants
      tags: [Invoices]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/GenerateInvoiceRequest'
      responses:
        '201':
          description: Invoices generated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/InvoiceGenerationResponse'

components:
  schemas:
    GenerateInvoiceRequest:
      type: object
      properties:
        month:
          type: integer
          minimum: 1
          maximum: 12
        year:
          type: integer
          minimum: 2000

    InvoiceGenerationResponse:
      type: object
      properties:
        message:
          type: string
        invoices:
          type: array
          items:
            $ref: '#/components/schemas/Invoice'
        summary:
          $ref: '#/components/schemas/GenerationSummary'
```

---

### 3. Version Control Strategy

**Semantic Versioning** (semver) for all components:

**API Versioning**:
```
/api/v1/...  → Version 1.x.x (current)
/api/v2/...  → Version 2.x.x (future breaking changes)
```

**Package Versioning**:
```
@rental-mvp/types@1.0.0     → Initial release
@rental-mvp/types@1.1.0     → New types added (backward compatible)
@rental-mvp/types@2.0.0     → Breaking changes
```

**Compatibility Matrix**:
| Backend API | Types Package | Frontend Web | iOS App |
|-------------|---------------|--------------|---------|
| v1.0.x      | v1.0.x        | v1.0.x       | v1.0.x  |
| v1.1.x      | v1.1.x        | v1.1.x       | v1.1.x  |
| v2.0.x      | v2.0.x        | v2.0.x       | v2.0.x  |

---

### 4. Change Management Process

**Workflow for API Changes**:

```
┌─────────────────────────────────────────┐
│ 1. PROPOSAL                             │
│    Developer proposes API change        │
│    in GitHub Issue                      │
└──────────────┬──────────────────────────┘
               ▼
┌─────────────────────────────────────────┐
│ 2. SPECIFICATION UPDATE                 │
│    Update OpenAPI spec                  │
│    Update types package                 │
│    Version bump (major/minor/patch)     │
└──────────────┬──────────────────────────┘
               ▼
┌─────────────────────────────────────────┐
│ 3. BACKEND IMPLEMENTATION               │
│    Implement new API                    │
│    Unit tests pass                      │
│    Integration tests pass               │
└──────────────┬──────────────────────────┘
               ▼
┌─────────────────────────────────────────┐
│ 4. TYPE GENERATION                      │
│    Auto-generate TypeScript types       │
│    Auto-generate Swift types (iOS)      │
│    Publish types package                │
└──────────────┬──────────────────────────┘
               ▼
┌─────────────────────────────────────────┐
│ 5. FRONTEND UPDATE                      │
│    Update types package dependency      │
│    TypeScript compilation errors?       │
│    • YES → Fix frontend code            │
│    • NO  → Ready to deploy              │
└──────────────┬──────────────────────────┘
               ▼
┌─────────────────────────────────────────┐
│ 6. DEPLOYMENT                           │
│    Backend deployed first               │
│    Frontend deployed second             │
│    Backward compatibility maintained    │
└─────────────────────────────────────────┘
```

---

### 5. Breaking vs Non-Breaking Changes

**Non-Breaking Changes** (Minor version bump):
- ✅ Adding new optional fields
- ✅ Adding new endpoints
- ✅ Adding new enum values
- ✅ Relaxing validation rules

**Breaking Changes** (Major version bump):
- ❌ Removing fields
- ❌ Changing field types
- ❌ Renaming endpoints
- ❌ Removing endpoints
- ❌ Changing authentication
- ❌ Stricter validation

**Breaking Change Protocol**:
1. Create new API version (`/api/v2/...`)
2. Maintain old version for 6 months
3. Update frontend to new version
4. Deprecate old version
5. Remove old version after transition

---

## 🔧 Implementation Details

### Monorepo Structure (Recommended)

```
rental-mvp/
├── packages/
│   ├── types/                    # Shared types ⭐
│   │   ├── src/
│   │   │   ├── models/
│   │   │   ├── api/
│   │   │   └── enums/
│   │   └── package.json
│   │
│   ├── api-client/               # Generated API client ⭐
│   │   ├── src/
│   │   │   ├── generated/        # Auto-generated from OpenAPI
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── validation/               # Shared validation schemas
│       ├── src/
│       │   └── schemas/          # Zod schemas
│       └── package.json
│
├── backend/                      # Backend API
│   ├── src/
│   ├── prisma/
│   │   └── schema.prisma         # Source of truth for models
│   └── package.json
│
├── frontend-web/                 # React web app
│   ├── src/
│   └── package.json
│
├── ios/                          # iOS app
│   └── RentalMVP/
│
├── lerna.json                    # Monorepo config
└── package.json                  # Root package
```

**Benefits**:
- Single repository for all code
- Shared dependencies
- Atomic commits across projects
- Easier refactoring

---

### Automated Type Generation

**Script**: `packages/types/scripts/generate-from-prisma.ts`

```typescript
import { generateTypes } from '@prisma/client/generator';
import { exec } from 'child_process';

async function generateTypesFromPrisma() {
  console.log('🔄 Generating types from Prisma schema...');

  // 1. Generate Prisma Client
  exec('cd ../../backend && npx prisma generate');

  // 2. Extract types from Prisma Client
  const prismaTypes = await extractPrismaTypes();

  // 3. Generate API request/response types
  const apiTypes = generateApiTypes(prismaTypes);

  // 4. Write TypeScript files
  writeTypesFiles(prismaTypes, apiTypes);

  // 5. Generate Swift types for iOS
  generateSwiftTypes(prismaTypes, apiTypes);

  console.log('✅ Type generation complete!');
}

generateTypesFromPrisma();
```

**Run After Schema Changes**:
```bash
# In backend/
npx prisma migrate dev --name your_migration

# Automatically triggers:
cd ../packages/types
npm run generate

# Results in:
# - Updated TypeScript types
# - Updated Swift types
# - Types package version bumped
```

---

### CI/CD Integration

**GitHub Actions Workflow**: `.github/workflows/sync-check.yml`

```yaml
name: Frontend-Backend Sync Check

on:
  pull_request:
    branches: [main]

jobs:
  check-sync:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Check Prisma schema changes
        id: prisma-check
        run: |
          cd backend
          npx prisma validate
          npx prisma format --check

      - name: Generate types from Prisma
        run: |
          cd packages/types
          npm run generate

      - name: Check for uncommitted type changes
        run: |
          if [[ -n $(git status --porcelain packages/types) ]]; then
            echo "❌ Types out of sync! Run 'npm run generate' in packages/types"
            exit 1
          fi

      - name: Validate OpenAPI spec
        run: |
          cd backend
          npm run openapi:validate

      - name: Build backend
        run: |
          cd backend
          npm run build

      - name: Build frontend
        run: |
          cd frontend-web
          npm run build

      - name: Type check all packages
        run: npm run typecheck

      - name: Run integration tests
        run: npm run test:integration
```

**This ensures**:
- ✅ Types are always in sync
- ✅ OpenAPI spec is valid
- ✅ All projects compile
- ✅ Integration tests pass
- ✅ No deployment if sync broken

---

## 📚 Documentation Governance

### API Documentation Standards

**Must Include**:
1. **Endpoint description**: What it does
2. **Authentication**: Required role(s)
3. **Request schema**: All fields, types, validation
4. **Response schema**: Success and error formats
5. **Examples**: cURL and client code
6. **Error codes**: All possible errors

**Example**:
```typescript
/**
 * Generate invoices for all active tenants
 *
 * @route POST /api/v1/invoices/generate
 * @access Private - Requires landlord or admin role
 *
 * @param {number} month - Month to generate (1-12), defaults to current
 * @param {number} year - Year to generate, defaults to current
 *
 * @returns {InvoiceGenerationResponse} Generated invoices and summary
 *
 * @throws {401} Unauthorized - Missing or invalid JWT token
 * @throws {403} Forbidden - Insufficient permissions
 * @throws {400} Bad Request - Invalid month or year
 * @throws {500} Internal Server Error - Generation failed
 *
 * @example
 * // Request
 * POST /api/v1/invoices/generate
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 * Content-Type: application/json
 *
 * {
 *   "month": 11,
 *   "year": 2025
 * }
 *
 * // Response
 * {
 *   "message": "Invoice generation completed",
 *   "invoices": [...],
 *   "summary": {
 *     "total": 5,
 *     "generated": 5,
 *     "skipped": 0
 *   }
 * }
 */
export const generateInvoices = async (req, res) => { ... }
```

---

## 🔐 Security Governance

### Authentication Sync

**Backend** (JWT):
```typescript
// backend/src/middleware/auth.ts
export interface JWTPayload {
  id: number;
  email: string;
  role: 'landlord' | 'admin' | 'tenant';
  iat: number;
  exp: number;
}
```

**Frontend** (Same interface):
```typescript
// frontend-web/src/types/auth.ts
import { JWTPayload } from '@rental-mvp/types';

// Type safety ensured!
const decodeToken = (token: string): JWTPayload => {
  return jwt.decode(token);
};
```

**iOS** (Mirrored):
```swift
// ios/Models/Auth.swift
struct JWTPayload: Codable {
    let id: Int
    let email: String
    let role: UserRole
    let iat: Int
    let exp: Int
}

enum UserRole: String, Codable {
    case landlord
    case admin
    case tenant
}
```

---

## 🧪 Testing Governance

### Contract Testing

**Backend Tests** (`backend/tests/contracts/`):
```typescript
describe('Invoice API Contract', () => {
  it('POST /api/v1/invoices/generate matches OpenAPI spec', async () => {
    const response = await request(app)
      .post('/api/v1/invoices/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({ month: 11, year: 2025 });

    // Validate against OpenAPI schema
    expect(response.body).toMatchSchema(
      openApiSpec.paths['/api/v1/invoices/generate'].post.responses['201']
    );
  });
});
```

**Frontend Tests** (`frontend-web/tests/api/`):
```typescript
describe('Invoice API Client', () => {
  it('sends correctly typed request', async () => {
    const request: GenerateInvoiceRequest = {
      month: 11,
      year: 2025
    };

    // TypeScript ensures this matches backend expectations
    const response = await api.invoices.generate(request);

    // TypeScript ensures response type is correct
    expect(response.summary.total).toBeGreaterThan(0);
  });
});
```

---

## 📊 Monitoring & Compliance

### Runtime Validation

**Backend** (Zod validation):
```typescript
import { z } from 'zod';

const GenerateInvoiceSchema = z.object({
  month: z.number().int().min(1).max(12).optional(),
  year: z.number().int().min(2000).optional()
});

export const generateInvoices = async (req, res) => {
  // Runtime validation ensures data matches schema
  const validated = GenerateInvoiceSchema.parse(req.body);
  // ...
};
```

**Frontend** (Same schema):
```typescript
import { GenerateInvoiceSchema } from '@rental-mvp/validation';

const handleSubmit = (data: unknown) => {
  // Validate before sending
  const validated = GenerateInvoiceSchema.parse(data);
  api.invoices.generate(validated);
};
```

---

## 🚀 Deployment Governance

### Deployment Order

**Always**:
```
1. Backend deployed first
   ↓
2. Wait for health check
   ↓
3. Frontend deployed second
   ↓
4. Smoke tests run
   ↓
5. Rollback if tests fail
```

**Never**:
- ❌ Deploy frontend before backend
- ❌ Deploy breaking backend changes without frontend update
- ❌ Deploy without running tests

---

## 📋 Governance Checklist

### Before Every PR

- [ ] Prisma schema updated (if needed)
- [ ] Types generated: `npm run generate`
- [ ] OpenAPI spec updated (if API changed)
- [ ] Backend tests pass
- [ ] Frontend compiles without type errors
- [ ] Integration tests pass
- [ ] Documentation updated
- [ ] Version bumped appropriately

### Before Every Release

- [ ] All PRs merged
- [ ] Full test suite passes
- [ ] Performance tests pass
- [ ] Security scan clean
- [ ] Changelog updated
- [ ] Migration scripts tested
- [ ] Rollback plan documented
- [ ] Monitoring alerts configured

---

## 🎯 Key Governance Rules

### Rule 1: Database Schema is Source of Truth
- All models defined in `prisma/schema.prisma`
- Types auto-generated from schema
- No manual type definitions for models

### Rule 2: API Contract Before Implementation
- OpenAPI spec written first
- Backend implements to spec
- Frontend uses spec to generate client

### Rule 3: No Breaking Changes Without Major Version
- Minor versions: backward compatible only
- Major versions: breaking changes allowed
- Deprecation period: minimum 3 months

### Rule 4: Type Safety Everywhere
- TypeScript in backend
- TypeScript in frontend
- Swift types mirror TS types
- No `any` types allowed

### Rule 5: Test Coverage Required
- Backend: > 75% coverage
- Frontend: > 60% coverage
- Integration tests for all endpoints

---

## 📞 Governance Contacts

### Responsible Parties

| Area | Owner | Responsibilities |
|------|-------|------------------|
| **Database Schema** | Backend Lead | Prisma schema, migrations |
| **API Contract** | Backend Lead | OpenAPI spec, versioning |
| **Types Package** | Both Leads | Shared types, generation |
| **Backend API** | Backend Lead | Implementation, tests |
| **Frontend Web** | Frontend Lead | React app, consumption |
| **iOS App** | iOS Lead | Swift app, consumption |
| **CI/CD** | DevOps | Pipeline, deployments |

### Decision Process

**Small Changes** (non-breaking):
- Developer implements
- PR review
- Merge

**Large Changes** (breaking):
- RFC (Request for Comments) document
- Team discussion
- Approval required
- Implementation

---

**Document Version**: 1.0
**Last Updated**: November 23, 2025
**Next Review**: After Week 5 (Frontend development starts)

---

## 🔄 Living Document

This governance structure will evolve as the project grows. Review and update after each major milestone.
