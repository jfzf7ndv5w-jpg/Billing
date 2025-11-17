# Rental Property MVP 3.0 - Backend API

**Version:** 3.0.0
**Node.js:** 18 LTS
**Database:** SQLite (local dev) / Azure SQL (production)
**Status:** Week 1 Day 1-2 Complete ✅
**Last Updated:** 2025-11-16

---

## 🎯 Project Overview

A comprehensive rental property management system for landlords to manage properties, tenants, invoices, payments, maintenance, and calculate ROE (Return on Equity). This backend API serves both iOS and web clients.

### Key Features
- Multi-tenant property management
- Automated invoice generation and tracking
- Payment tracking and reconciliation
- Maintenance request management
- Vendor management
- ROE calculator and analytics
- JWT-based authentication
- Role-based access control

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- SQLite (for local development)
- Azure SQL Database (for production)

### Installation & Setup

```bash
# Install dependencies
npm install

# Database is already set up with SQLite
# If starting fresh, run:
npx prisma migrate dev
npx prisma db seed

# Start development server
npm run dev
```

Server will start on http://localhost:3001

### Test Credentials
```
Email: landlord@example.com
Password: password123
```

### Quick Test
```bash
# Health check
curl http://localhost:3001/health

# Login and get token
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"landlord@example.com","password":"password123"}'

# Get tenants (use token from login response)
curl -X GET http://localhost:3001/api/v1/tenants \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage |
| `npm run lint` | Lint code |
| `npm run lint:fix` | Lint and auto-fix |
| `npm run format` | Format code with Prettier |
| `npm run prisma:generate` | Generate Prisma Client |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:studio` | Open Prisma Studio |

---

## Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Express middleware
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   └── server.ts        # Express app entry point
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Database seeding
├── tests/
│   ├── unit/            # Unit tests
│   └── integration/     # Integration tests
├── .env.example         # Environment variables template
├── package.json         # Dependencies and scripts
└── tsconfig.json        # TypeScript configuration
```

---

## 📡 API Endpoints

### Health Check
- `GET /health` - Server health status ✅

### Authentication ✅
- `POST /api/v1/auth/register` - Register new user ✅ TESTED
- `POST /api/v1/auth/login` - Login user ✅ TESTED

### Tenants ✅
- `GET /api/v1/tenants` - Get all tenants ✅ TESTED
- `GET /api/v1/tenants/:id` - Get single tenant ✅ TESTED
- `POST /api/v1/tenants` - Create tenant ✅
- `PATCH /api/v1/tenants/:id` - Update tenant ✅
- `DELETE /api/v1/tenants/:id` - Delete tenant ✅

### Invoices (Week 2 - Planned)
- `GET /api/v1/invoices` - Get all invoices
- `GET /api/v1/invoices/:id` - Get single invoice
- `POST /api/v1/invoices` - Create invoice
- `POST /api/v1/invoices/:id/send` - Send invoice email
- `PATCH /api/v1/invoices/:id` - Update invoice

### Payments (Week 3 - Planned)
- `GET /api/v1/payments` - Get all payments
- `POST /api/v1/payments` - Record payment
- `PATCH /api/v1/payments/:id` - Update payment

### Properties (Week 1 Day 3-4 - Planned)
- `GET /api/v1/properties` - Get all properties
- `GET /api/v1/properties/:id` - Get single property
- `POST /api/v1/properties` - Create property
- `PATCH /api/v1/properties/:id` - Update property

### Maintenance Requests (Week 6 - Planned)
- `GET /api/v1/maintenance` - Get all maintenance requests
- `POST /api/v1/maintenance` - Create maintenance request

### Vendors (Week 6 - Planned)
- `GET /api/v1/vendors` - Get all vendors
- `POST /api/v1/vendors` - Create vendor

---

## Database Schema

**11 Tables:**
1. properties
2. tenants
3. invoices
4. payments
5. expenses
6. maintenance_requests
7. vendors
8. mortgages
9. users
10. deposits (future)
11. roe_calculations (future)

See `prisma/schema.prisma` for complete schema.

---

## Environment Variables

Required variables (see `.env.example`):
- `DATABASE_URL` - Database connection string
- `JWT_SECRET` - Secret for JWT tokens
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)

---

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

---

## Development Workflow

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes
3. Run tests: `npm test`
4. Run linter: `npm run lint:fix`
5. Commit: `git commit -m "feat: your feature"`
6. Push: `git push origin feature/your-feature`

---

## 📊 Development Progress

### ✅ Week 1 Day 1-2: Development Environment Setup (COMPLETED)
**Duration:** 16 hours
**Completed:** 2025-11-16

**Accomplishments:**
- ✅ Backend project initialized with TypeScript and Node.js 18
- ✅ 548 npm packages installed (Express, Prisma, JWT, bcrypt, etc.)
- ✅ Database schema migrated from SQL Server to SQLite for local dev
- ✅ Prisma schema created with 11 tables
- ✅ Database migrations executed successfully
- ✅ Test data seeded (1 landlord, 1 property, 1 tenant, 1 vendor, 1 mortgage)
- ✅ Development server running on port 3001
- ✅ All authentication and tenant endpoints tested and working
- ✅ JWT authentication middleware implemented
- ✅ Error handling middleware configured
- ✅ CORS and security headers (helmet) configured

**Technical Issues Resolved:**
- Fixed SQL Server to SQLite migration (removed @db type annotations)
- Resolved TypeScript compilation errors in auth.ts and validation.ts
- Fixed JWT sign function type compatibility
- Configured proper middleware error handling

**Test Results:**
- ✅ Health check endpoint working
- ✅ User registration working (created test user)
- ✅ User login working (JWT token generated)
- ✅ Get all tenants working (returns seeded tenant with property)
- ✅ Get single tenant working (includes related invoices)
- ✅ 404 handler working for invalid routes

### 📋 Week 1 Day 3-4: Database & API Foundation (NEXT)
**Duration:** 16 hours
**Status:** Pending

**Planned Tasks:**
- Add property CRUD routes and controllers
- Add invoice routes (stub implementation)
- Add payment routes (stub implementation)
- Write unit tests for authentication
- Write unit tests for tenant endpoints
- Add integration tests
- Begin API documentation with Swagger/OpenAPI
- Security hardening and validation improvements

### 🎯 Week 1 Day 5: Authentication & Security (PLANNED)
**Duration:** 8 hours

**Planned Tasks:**
- Complete authentication testing
- Implement role-based access control (RBAC)
- Add password reset functionality
- Add email verification
- Security audit and improvements
- Complete API documentation

---

## 🗄️ Database Schema Details

**Current Database:** SQLite (dev.db)
**Total Tables:** 11

### Core Tables
1. **users** - Authentication and user management
2. **properties** - Property information and ownership
3. **tenants** - Tenant information and lease details
4. **invoices** - Generated invoices for rent and charges
5. **payments** - Payment tracking and reconciliation
6. **expenses** - Property-related expenses
7. **maintenance_requests** - Maintenance and repair tracking
8. **vendors** - Service provider management
9. **mortgages** - Mortgage and loan tracking
10. **deposits** - Security deposit tracking (future)
11. **roe_calculations** - ROE analytics (future)

### Seeded Test Data
- **User:** landlord@example.com (role: landlord)
- **Property:** 123 Main Street, Amsterdam (€300,000 purchase, €350,000 current value)
- **Tenant:** Jane Tenant (€1,200/month rent, active lease since 2023-01-01)
- **Vendor:** ABC Plumbing Services (4.5 rating, 25 jobs completed)
- **Mortgage:** ING Bank (€235,000 balance, 3.5% interest, €1,100/month)

See `prisma/schema.prisma` for complete schema definition.

---

## 🔧 Troubleshooting

### Database Connection Issues
- **SQLite (local):** Database file is at `prisma/dev.db`
- **Migration issues:** Run `npx prisma migrate dev` to reset
- **Seed issues:** Run `npx prisma db seed` to repopulate

### Prisma Issues
- Run `npx prisma generate` after schema changes
- Run `npx prisma migrate dev` to create and apply migrations
- Use `npx prisma studio` to view/edit data in browser

### Server Issues
- **Port already in use:** Kill process on port 3001 or change PORT in .env
- **TypeScript errors:** Check tsconfig.json, strict mode is disabled for now
- **JWT errors:** Verify JWT_SECRET is set in .env

### Common Commands
```bash
# Reset database completely
rm prisma/dev.db
npx prisma migrate dev
npx prisma db seed

# View database in browser
npx prisma studio

# Check server logs
npm run dev

# Kill process on port 3001 (macOS/Linux)
lsof -ti:3001 | xargs kill -9
```

---

## 📝 Project Context & Session Notes

### Project Goal
Build a complete rental property management system in 10 weeks, enabling landlords to:
- Manage multiple properties and tenants
- Automate invoice generation and sending
- Track payments and reconcile accounts
- Manage maintenance requests and vendors
- Calculate ROE and view analytics
- Access via iOS app and web dashboard

### Technology Stack
- **Backend:** Node.js 18, Express.js, TypeScript
- **Database:** SQLite (local), Azure SQL (production)
- **ORM:** Prisma
- **Auth:** JWT with bcrypt password hashing
- **Security:** Helmet, CORS, input validation
- **Testing:** Jest (planned)
- **API Docs:** Swagger/OpenAPI (planned)
- **iOS:** SwiftUI (Week 4-5)
- **Web:** React + Tailwind CSS (Week 5)

### Development Environment
- **OS:** macOS Darwin 24.6.0
- **Node:** 18 LTS
- **Git:** Repository initialized and synced
- **IDE:** VS Code (assumed)
- **Package Manager:** npm

### Key Files & Locations
- **Server:** `src/server.ts:77` - Main Express application
- **Auth:** `src/middleware/auth.ts:46` - JWT token generation
- **Routes:** `src/routes/*` - API endpoint definitions
- **Controllers:** `src/controllers/*` - Business logic
- **Schema:** `prisma/schema.prisma` - Database schema
- **Seed:** `prisma/seed.ts` - Test data
- **Config:** `.env` - Environment variables (not in git)

### Current Server Status
```
🚀 Rental Property MVP 3.0 - Backend API
✅ Server running on port 3001
📝 Environment: development
🔗 Health check: http://localhost:3001/health
📊 API Base: http://localhost:3001/api/v1
```

### Next Session Recommendations
1. Start with Week 1 Day 3-4 tasks
2. Review this README for full context
3. Test server with `curl http://localhost:3001/health`
4. Check git status to see any uncommitted changes
5. Review prisma/schema.prisma for database structure
6. Begin implementing property routes and controllers

---

**Created:** Week 1, Day 1
**Status:** Week 1 Day 1-2 Complete ✅
**Last Updated:** 2025-11-16
**Next:** Week 1 Day 3-4 - Database & API Foundation
