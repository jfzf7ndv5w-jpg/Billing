# GitHub Codespace Quick Start Guide
## Get Your Development Environment Running in 3 Minutes

---

## Step 1: Create Your Codespace (2 minutes)

### Option A: Via Web Browser (Recommended)

1. **Open your repository**:
   ```
   https://github.com/jfzf7ndv5w-jpg/Billing
   ```

2. **Create Codespace**:
   - Click the green **"Code"** button
   - Select **"Codespaces"** tab
   - Click **"Create codespace on main"**

   ![Screenshot location](https://docs.github.com/assets/cb-77061/mw-1440/images/help/codespaces/new-codespace-button.webp)

3. **Wait for Setup** (1-2 minutes):
   - Codespace builds automatically
   - Node.js 18 installs
   - PostgreSQL 14 starts
   - Dependencies install (`npm install`)
   - Prisma generates client

4. **Codespace Opens**:
   - Full VSCode in your browser
   - Terminal ready at bottom
   - File explorer on left

### Option B: Quick Link

**Direct link** (only works if logged into GitHub):
```
https://github.com/codespaces/new?hide_repo_select=true&ref=main&repo=jfzf7ndv5w-jpg/Billing
```

---

## Step 2: Initialize Development Environment (30 seconds)

Once Codespace opens, a terminal appears at the bottom. Run:

```bash
# Navigate to backend
cd backend

# Verify installation
npm --version
node --version
npx prisma --version

# Initialize database
npx prisma migrate dev --name init

# Seed with test data
npx prisma db seed

# Start development server
npm run dev
```

**Expected Output**:
```
========================================
🚀 Rental Property MVP 3.0 - Backend API
========================================
✅ Server running on port 3001
📝 Environment: development
🔗 Health check: http://localhost:3001/health
📊 API Base: http://localhost:3001/api/v1
📚 API Docs: http://localhost:3001/api-docs
========================================
```

---

## Step 3: Access Your API (30 seconds)

### Automatic Port Forwarding

When the server starts, Codespaces shows a notification:
> "Your application running on port 3001 is available"

**Options**:
1. Click **"Open in Browser"** - Opens API in new tab
2. Click **"Ports"** tab (bottom panel) - See all forwarded ports
3. Click globe icon next to port 3001 - Open in browser

### Test the API

In a new terminal (Terminal → New Terminal):

```bash
# Test health endpoint
curl http://localhost:3001/health

# Login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "landlord@example.com", "password": "password123"}'

# Copy the token from response, then test invoice generation
TOKEN="paste-your-token-here"

curl -X POST http://localhost:3001/api/v1/invoices/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"month": 12, "year": 2025}'
```

---

## Step 4: Explore the Environment

### Open API Documentation

1. Click "Ports" tab in bottom panel
2. Find port **3001**
3. Click the **globe icon** → Opens: `https://xxxxx.githubpreview.dev`
4. Add `/api-docs` to URL
5. Interactive Swagger UI appears!

### Database Management

```bash
# Open Prisma Studio (database GUI)
npx prisma studio
```

- Codespace forwards port 5555
- Click notification or Ports tab
- Visual database browser opens

### File Editing

- Left sidebar: File explorer
- Click any `.ts` file to edit
- Auto-complete and IntelliSense work
- Changes auto-save

---

## Common Tasks

### Make Code Changes

1. Edit files in VSCode (left panel)
2. Server auto-restarts (nodemon watching)
3. Test changes immediately
4. Commit when ready:
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   ```

### Run Tests

```bash
npm test
```

### Generate Invoice

```bash
# Use the test script
cd backend
chmod +x scripts/test-invoice-generation.sh
./scripts/test-invoice-generation.sh
```

### View Logs

Server logs appear in the terminal where you ran `npm run dev`.

Press `Ctrl+C` to stop server.

---

## Codespace Features

### Extensions Pre-Installed

- ✅ Prisma - Database schema syntax highlighting
- ✅ ESLint - Code quality
- ✅ Prettier - Code formatting
- ✅ Azure Tools - Deploy to Azure

### Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open command palette | `Cmd/Ctrl + Shift + P` |
| Open terminal | `Ctrl + `` ` |
| Quick file open | `Cmd/Ctrl + P` |
| Search in files | `Cmd/Ctrl + Shift + F` |
| Git commit | `Cmd/Ctrl + Enter` (in source control) |

### Useful Commands

```bash
# View all npm scripts
npm run

# Lint code
npm run lint

# Format code
npm run format

# Prisma commands
npx prisma studio          # Database GUI
npx prisma migrate dev     # Create migration
npx prisma db seed         # Seed database
```

---

## Troubleshooting

### Port Not Forwarding

1. Click "Ports" tab (bottom panel)
2. Click "+ Add Port"
3. Enter: `3001`
4. Visibility: Public

### Database Connection Error

```bash
# Reset database
cd backend
rm -rf prisma/dev.db
npx prisma migrate dev --name init
npx prisma db seed
```

### Dependencies Not Installing

```bash
cd backend
rm -rf node_modules package-lock.json
npm install
npx prisma generate
```

### Server Won't Start

```bash
# Check if port already in use
lsof -i :3001

# Kill process if needed
kill -9 <PID>

# Restart
npm run dev
```

---

## Working Remotely

### From iPad/Tablet

1. Open Safari/Chrome
2. Go to: https://github.com/codespaces
3. Select your Codespace
4. Full development environment!

**Tips**:
- Use external keyboard for best experience
- Landscape mode recommended
- Bluetooth mouse helpful but optional

### From Another Computer

1. Install VSCode desktop app
2. Install "GitHub Codespaces" extension
3. Connect to your Codespace
4. Full local-like experience with cloud compute

### Sync Settings

Your VSCode settings sync automatically across:
- Browser Codespaces
- Desktop VSCode
- Multiple devices

---

## Codespace Management

### Stop Codespace

- Click "Codespaces" in bottom-left corner
- Select "Stop Current Codespace"
- **Or**: Auto-stops after 30 minutes of inactivity

### Resume Codespace

1. Go to: https://github.com/codespaces
2. Click on your stopped Codespace
3. Resumes exactly where you left off

### Delete Codespace

1. https://github.com/codespaces
2. Click "..." next to Codespace
3. Select "Delete"

**Note**: Your code is safe on GitHub, only the environment is deleted

### Free Tier Limits

- **120 core-hours/month** free
- 2-core machine = 60 hours of usage
- 4-core machine = 30 hours of usage
- Plenty for part-time development!

### Upgrade Options

If you need more:
- **$4/month**: Extra storage
- **Pay-as-you-go**: $0.18/hour for 2-core
- **Pro**: $9/month (180 hours included)

---

## Development Workflow

### Daily Routine

```bash
# 1. Start Codespace
# (via browser or VSCode)

# 2. Pull latest changes
git pull origin main

# 3. Start development server
cd backend
npm run dev

# 4. Make changes
# Edit files, test API

# 5. Commit & push
git add .
git commit -m "Description"
git push origin main

# 6. Auto-deploys to Azure (if configured)
# Via GitHub Actions
```

### Collaboration

**Share your Codespace**:
1. Click "Codespaces" (bottom-left)
2. Select "Share Codespace"
3. Send URL to teammate
4. They can view/edit in real-time!

---

## Next Steps

### After Setup Complete

1. ✅ Codespace running
2. ✅ API tested
3. ✅ Database seeded

**Continue Week 2 Development**:

```bash
# Day 2: PDF Generation
# Follow: Implementation/PART_2_WEEK_2_AUTOMATED_INVOICE_SYSTEM.md

# Install PDF dependencies (already done)
npm list pdfkit

# Create PDF service
mkdir -p src/services
touch src/services/pdfService.ts

# Follow Day 2 instructions in implementation guide
```

---

## Quick Reference

### Important URLs

- **Your Codespaces**: https://github.com/codespaces
- **Repository**: https://github.com/jfzf7ndv5w-jpg/Billing
- **GitHub Docs**: https://docs.github.com/codespaces

### Environment Variables

Already set in Codespace (via devcontainer.json):

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/rental_mvp?schema=public
```

### File Structure

```
/workspaces/Billing/
├── backend/
│   ├── src/
│   │   ├── server.ts
│   │   ├── services/
│   │   │   └── invoiceService.ts
│   │   ├── controllers/
│   │   ├── routes/
│   │   └── middleware/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── package.json
├── .devcontainer/
│   └── devcontainer.json
└── Implementation/
    └── PART_2_WEEK_2_AUTOMATED_INVOICE_SYSTEM.md
```

---

## Support & Help

### Getting Help

- **GitHub Codespaces Docs**: https://docs.github.com/codespaces
- **Prisma Docs**: https://www.prisma.io/docs
- **Express Docs**: https://expressjs.com

### Common Issues

**Q: Codespace build fails**
A: Check `.devcontainer/devcontainer.json` syntax. Delete and recreate Codespace.

**Q: Can't access API**
A: Check port forwarding in Ports tab. Make port 3001 public.

**Q: Database errors**
A: Run `npx prisma migrate reset` to reset database.

**Q: Out of free hours**
A: Codespace auto-stops after 30 min idle. Work efficiently or upgrade plan.

---

**You're Ready to Develop from Anywhere!** 🚀🌍

Start your Codespace and continue building the automated invoice system!
