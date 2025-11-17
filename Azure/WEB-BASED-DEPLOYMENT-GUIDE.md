# Web-Based Deployment Guide for Rental MVP
## Deploy and Manage Entirely From Browser While Traveling

This guide enables you to deploy, develop, and manage the Rental Property MVP system entirely through web browsers - no local environment needed.

---

## Table of Contents

1. [Quick Setup Overview](#quick-setup-overview)
2. [Option A: GitHub Codespaces (Recommended for Development)](#option-a-github-codespaces)
3. [Option B: Azure Portal Deployment](#option-b-azure-portal-deployment)
4. [GitHub Actions CI/CD Setup](#github-actions-cicd-setup)
5. [Web-Based Database Management](#web-based-database-management)
6. [Web-Based Code Editing](#web-based-code-editing)
7. [Monitoring & Logs (Web)](#monitoring--logs)
8. [Cost Estimate](#cost-estimate)

---

## Quick Setup Overview

Your code is already on GitHub: `https://github.com/jfzf7ndv5w-jpg/Billing`

**You have 2 options:**

1. **GitHub Codespaces** - Full VSCode in browser, develop anywhere
2. **Azure App Service** - Deploy production API, access via web portal

**Both work entirely in a web browser!**

---

## Option A: GitHub Codespaces
### Full Development Environment in Browser

### What is Codespaces?
- VSCode running in your browser
- Full Node.js environment pre-configured
- Run/test code from anywhere
- Free tier: 120 hours/month

### Setup Steps

1. **Open Repository in Browser**
   ```
   https://github.com/jfzf7ndv5w-jpg/Billing
   ```

2. **Create Codespace**
   - Click green "Code" button
   - Select "Codespaces" tab
   - Click "Create codespace on main"
   - Wait 2-3 minutes for environment to build

3. **Codespace Will Auto-Configure**
   - Node.js 18 installed
   - All dependencies installed (`npm install`)
   - PostgreSQL database available
   - Terminal access

4. **Run Development Server**
   ```bash
   cd backend
   npm install
   npx prisma migrate dev
   npx prisma db seed
   npm run dev
   ```

5. **Access API**
   - Codespaces will show popup: "Your application is running on port 3001"
   - Click "Open in Browser"
   - API available at auto-generated URL

6. **Test Invoice Generation**
   ```bash
   # In Codespace terminal
   curl -X POST http://localhost:3001/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "landlord@example.com", "password": "password123"}'

   # Use token from response
   curl -X POST http://localhost:3001/api/v1/invoices/generate \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"month": 12, "year": 2025}'
   ```

### Codespace Features

- **Full IDE**: Edit code, run commands, debug
- **Git Integration**: Commit/push directly
- **Port Forwarding**: Access APIs publicly
- **Persistent**: Saves your work between sessions
- **Mobile Compatible**: Works on iPad/tablet

### Create .devcontainer/devcontainer.json

```json
{
  "name": "Rental MVP Development",
  "image": "mcr.microsoft.com/devcontainers/typescript-node:18",
  "features": {
    "ghcr.io/devcontainers/features/azure-cli:1": {},
    "ghcr.io/devcontainers-contrib/features/postgres-asdf:1": {}
  },
  "postCreateCommand": "cd backend && npm install && npx prisma generate",
  "forwardPorts": [3001, 5432],
  "customizations": {
    "vscode": {
      "extensions": [
        "Prisma.prisma",
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode"
      ]
    }
  }
}
```

---

## Option B: Azure Portal Deployment
### Production API Hosting

### Prerequisites
- Azure account (you have: ldevries@me.com)
- GitHub repository (already done)

### Step 1: Create Resources in Azure Portal

**1.1 Create App Service (Web App)**

1. Go to: https://portal.azure.com
2. Search "App Services" → Click "Create"
3. Fill in:
   - **Subscription**: Azure subscription 1
   - **Resource Group**: Create new "rental-mvp-rg"
   - **Name**: `rental-mvp-api` (must be globally unique, add random numbers if taken)
   - **Publish**: Code
   - **Runtime stack**: Node 18 LTS
   - **Operating System**: Linux
   - **Region**: North Europe
4. **App Service Plan**:
   - Create new: "rental-mvp-plan"
   - Pricing: B1 (Basic) - ~€12/month
5. Click "Review + Create" → "Create"
6. Wait 2 minutes for deployment
7. **Save the URL**: `https://rental-mvp-api.azurewebsites.net`

**1.2 Create PostgreSQL Database**

1. Search "Azure Database for PostgreSQL flexible servers"
2. Click "Create"
3. Fill in:
   - **Resource Group**: rental-mvp-rg
   - **Server name**: `rental-mvp-pg` (add numbers if taken)
   - **Region**: North Europe
   - **PostgreSQL version**: 14
   - **Workload type**: Development
   - **Compute + storage**: Burstable B1ms (~€12/month)
4. **Admin username**: `pgadmin`
5. **Password**: Create strong password (SAVE THIS!)
6. **Networking**:
   - Allow public access from any Azure service: YES
   - Add current client IP: YES
7. Click "Review + Create" → "Create"
8. Wait 5 minutes for deployment
9. **Save connection details**:
   ```
   Host: rental-mvp-pg.postgres.database.azure.com
   Port: 5432
   Database: postgres (default, we'll create rental_mvp later)
   Username: pgadmin
   Password: [YOUR_PASSWORD]
   ```

**1.3 Create Storage Account (for PDF invoices)**

1. Search "Storage accounts"
2. Click "Create"
3. Fill in:
   - **Resource Group**: rental-mvp-rg
   - **Storage account name**: `rentalmvpstorage` (add random numbers)
   - **Region**: North Europe
   - **Performance**: Standard
   - **Redundancy**: LRS (Locally-redundant storage)
4. Click "Review + Create" → "Create"
5. After creation:
   - Go to storage account → "Containers"
   - Click "+ Container"
   - Name: "invoices"
   - Public access level: Private
   - Click "Create"

### Step 2: Configure App Service

1. Go to your App Service: `rental-mvp-api`
2. Click "Configuration" (left menu)
3. Click "+ New application setting" for each:

```
DATABASE_URL = postgresql://pgadmin:YOUR_PASSWORD@rental-mvp-pg.postgres.database.azure.com:5432/postgres?schema=public&sslmode=require

JWT_SECRET = [Generate at https://generate-secret.now.sh/32]

NODE_ENV = production

PORT = 8080

CORS_ORIGIN = *

AZURE_STORAGE_ACCOUNT_NAME = rentalmvpstorage

AZURE_STORAGE_CONTAINER_NAME = invoices
```

4. Go to storage account → "Access keys" → Copy "Connection string"
5. Add as app setting:
```
AZURE_STORAGE_CONNECTION_STRING = [paste connection string]
```

6. Click "Save" at top
7. Click "Continue" to restart app

### Step 3: Deploy Code from GitHub

**3.1 Via Deployment Center (Automatic)**

1. In App Service → "Deployment Center"
2. Select "GitHub"
3. Authorize GitHub account
4. Select:
   - Organization: jfzf7ndv5w-jpg
   - Repository: Billing
   - Branch: main
5. Azure auto-generates GitHub Actions workflow
6. Click "Save"
7. GitHub Actions will automatically deploy when you push code

**3.2 Via GitHub Actions (Manual Setup)**

1. In App Service → "Deployment Center" → "Download publish profile"
2. Save the XML file
3. Go to GitHub: https://github.com/jfzf7ndv5w-jpg/Billing
4. Settings → Secrets and variables → Actions
5. Click "New repository secret"
   - Name: `AZURE_WEBAPP_PUBLISH_PROFILE`
   - Value: Paste entire XML content from publish profile
6. Click "Add secret"

The `.github/workflows/azure-deploy.yml` file already exists in your repo and will auto-deploy on every push to `main`.

### Step 4: Initialize Database

**Option A: Using Azure Cloud Shell**

1. Go to: https://shell.azure.com
2. Choose "Bash"
3. Run:
```bash
# Install Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18

# Clone repo
git clone https://github.com/jfzf7ndv5w-jpg/Billing.git
cd Billing/backend

# Install dependencies
npm install

# Set DATABASE_URL (replace with your values)
export DATABASE_URL="postgresql://pgadmin:YOUR_PASSWORD@rental-mvp-pg.postgres.database.azure.com:5432/postgres?schema=public&sslmode=require"

# Run migrations
npx prisma migrate deploy

# Seed database
npx prisma db seed
```

**Option B: Using Web SSH**

1. App Service → "SSH" (left menu) → "Go"
2. In terminal:
```bash
cd /home/site/wwwroot
npm install
npm run azure:migrate
npm run azure:seed
```

### Step 5: Test Deployment

1. Open browser: `https://rental-mvp-api.azurewebsites.net/health`
2. Should return:
```json
{
  "status": "ok",
  "timestamp": "2025-11-17T...",
  "environment": "production",
  "version": "3.0.0"
}
```

3. Test invoice generation:
```bash
# In Cloud Shell or any terminal
curl -X POST https://rental-mvp-api.azurewebsites.net/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "landlord@example.com", "password": "password123"}'

# Copy token, then:
curl -X POST https://rental-mvp-api.azurewebsites.net/api/v1/invoices/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"month": 12, "year": 2025"}'
```

---

## GitHub Actions CI/CD Setup

### Workflow Already Created

The file `.github/workflows/azure-deploy.yml` is in your repo and will:

1. Trigger on push to `main` branch (backend changes only)
2. Install dependencies
3. Build TypeScript
4. Generate Prisma client
5. Deploy to Azure App Service
6. Run migrations automatically

### View Deployment Status

1. GitHub repo → "Actions" tab
2. See all deployments and their status
3. Click any deployment to see logs

### Manual Deployment Trigger

1. Actions tab → "Deploy to Azure App Service"
2. Click "Run workflow"
3. Select branch: main
4. Click "Run workflow"

---

## Web-Based Database Management

### Option 1: Prisma Studio (Local in Codespace)

```bash
# In GitHub Codespace terminal
cd backend
npx prisma studio
```

Access at forwarded port (Codespace will show URL)

### Option 2: Azure Portal Query Editor

1. Azure Portal → Your PostgreSQL server
2. "Query editor" (left menu)
3. Login with credentials
4. Run SQL queries directly

### Option 3: pgAdmin Web

1. Go to: https://www.pgadmin.org/download/pgadmin-4-cloud/
2. Create account (free)
3. Add server:
   - Host: rental-mvp-pg.postgres.database.azure.com
   - Port: 5432
   - Database: postgres
   - Username: pgadmin
   - Password: [your password]

---

## Web-Based Code Editing

### Option 1: GitHub Codespaces (Best)
- Full IDE in browser
- Run and test code
- Access at: https://github.com/codespaces

### Option 2: GitHub.dev (Quick edits)
- Press `.` (period key) while viewing repo on GitHub
- OR go to: https://github.dev/jfzf7ndv5w-jpg/Billing
- Lightweight editor, no terminal
- Good for quick file edits
- Commit directly to GitHub

### Option 3: Azure App Service Editor
- App Service → "App Service Editor" → "Go"
- Edit deployed files directly (not recommended for main changes)

---

## Monitoring & Logs

### View Logs (Web)

**App Service Logs:**
1. App Service → "Log stream" (left menu)
2. Real-time logs appear

**Application Insights:**
1. App Service → "Application Insights" → "View Application Insights data"
2. Dashboards showing:
   - Request rates
   - Response times
   - Failures
   - Exceptions

### Metrics

1. App Service → "Metrics"
2. View:
   - CPU usage
   - Memory usage
   - HTTP requests
   - Response times

### Alerts

1. App Service → "Alerts"
2. Create alert rules:
   - Email when CPU > 80%
   - Email when app crashes
   - Email when response time > 2s

---

## Cost Estimate

### Monthly Azure Costs

| Resource | SKU | Monthly Cost |
|----------|-----|--------------|
| App Service | B1 Basic (1 core, 1.75GB RAM) | ~€12 |
| PostgreSQL | B1ms Burstable (1 core, 2GB RAM, 32GB storage) | ~€12 |
| Storage | Standard LRS (32GB) | ~€1 |
| **Total** | | **~€25/month** |

### GitHub Costs

| Service | Free Tier | Cost |
|---------|-----------|------|
| Codespaces | 120 hours/month | FREE |
| Actions | 2,000 minutes/month | FREE |
| Private Repos | Unlimited | FREE |

### Cost Saving Tips

1. **Development**: Use Codespaces (free tier sufficient)
2. **Production**: Start with B1, scale up only if needed
3. **Database**: Use Burstable tier (70% cheaper than General Purpose)
4. **Storage**: Only pay for what you use (~€0.02/GB/month)
5. **Auto-shutdown**: Configure App Service to stop during off-hours (optional)

---

## Quick Reference

### Key URLs

- **GitHub Repo**: https://github.com/jfzf7ndv5w-jpg/Billing
- **Create Codespace**: https://github.com/jfzf7ndv5w-jpg/Billing/codespaces
- **Azure Portal**: https://portal.azure.com
- **Azure Cloud Shell**: https://shell.azure.com
- **App Service URL**: https://rental-mvp-api.azurewebsites.net
- **API Documentation**: https://rental-mvp-api.azurewebsites.net/api-docs

### Important Commands

```bash
# Local development (Codespaces)
cd backend
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev

# Azure deployment
git add .
git commit -m "Your changes"
git push origin main  # Auto-deploys via GitHub Actions

# Database migrations (Azure)
npm run azure:migrate
npm run azure:seed

# View logs
az webapp log tail --name rental-mvp-api --resource-group rental-mvp-rg
```

### Support Resources

- **Azure Documentation**: https://docs.microsoft.com/azure
- **GitHub Codespaces Docs**: https://docs.github.com/codespaces
- **Prisma Documentation**: https://www.prisma.io/docs

---

## Next Steps After Deployment

1. ✅ Access API at: https://rental-mvp-api.azurewebsites.net/health
2. ✅ Continue Week 2 development in Codespace
3. ✅ Push changes → Auto-deploy via GitHub Actions
4. ✅ Monitor via Azure Portal
5. ✅ Develop PDF generation (Day 2)
6. ✅ Integrate SendGrid email (Day 3)
7. ✅ Set up automated invoice scheduling

---

**You're now fully set up for remote, web-based development and deployment!** 🚀

All development can be done through:
- GitHub Codespaces (coding)
- Azure Portal (infrastructure)
- GitHub Actions (deployment)
- No local environment required!
