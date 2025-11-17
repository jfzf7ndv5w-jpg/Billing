# Rental Property MVP 3.0 - Backend API

**Version:** 3.0.0
**Node.js:** 18 LTS
**Database:** Azure SQL / SQL Server

---

## Quick Start

### Prerequisites
- Node.js 18+
- Azure SQL Database or SQL Server
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your actual credentials

# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed database with test data
npx prisma db seed

# Start development server
npm run dev
```

Server will start on http://localhost:3001

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

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user

### Tenants
- `GET /api/v1/tenants` - Get all tenants
- `GET /api/v1/tenants/:id` - Get single tenant
- `POST /api/v1/tenants` - Create tenant
- `PATCH /api/v1/tenants/:id` - Update tenant

### Invoices (Coming in Week 2)
- `GET /api/v1/invoices` - Get all invoices
- `POST /api/v1/invoices` - Create invoice
- `POST /api/v1/invoices/:id/send` - Send invoice email

### Payments (Coming in Week 3)
- `GET /api/v1/payments` - Get all payments
- `POST /api/v1/payments` - Record payment

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

## Troubleshooting

### Database Connection Issues
- Verify DATABASE_URL in .env
- Check SQL Server is running
- Verify firewall rules for Azure SQL

### Prisma Issues
- Run `npm run prisma:generate` after schema changes
- Run `npm run prisma:migrate` to apply migrations

---

**Created:** Week 1, Day 1
**Status:** In Development
**Next:** Complete Day 1-2 setup, then implement database schema
