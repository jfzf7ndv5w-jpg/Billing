# Work Environment Context for Claude

**Purpose**: This file helps Claude Code understand the work environment transition and current setup.

---

## 🔄 Environment Transition History

### Previous Setup (Until Nov 17, 2025 02:50)
**Environment**: Local macOS Terminal
- **Location**: `/Users/ldevries/Documents/Billing`
- **Development**: Local Node.js + npm
- **Database**: SQLite (`backend/prisma/dev.db`)
- **Server**: Running on `http://localhost:3001`
- **IDE**: Local VSCode or terminal-based editing
- **Git**: Local git commands, push to GitHub

### Current Setup (From Nov 17, 2025 02:50 onwards)
**Environment**: Web-Based (GitHub Codespaces + Azure)
- **Primary Development**: GitHub Codespaces (browser-based VSCode)
- **Database**: PostgreSQL in Codespace or Azure
- **Server**: Running in Codespace container
- **IDE**: Web-based VSCode at codespaces URL
- **Git**: Browser or Codespace terminal
- **Deployment**: Azure App Service (production)

---

## 📍 Current Work Environment Status

### Active Environment
- ✅ **GitHub Repository**: https://github.com/jfzf7ndv5w-jpg/Billing
- ✅ **Codespace Configuration**: `.devcontainer/devcontainer.json`
- ✅ **Azure Deployment**: Ready (scripts in `Azure/` folder)
- ✅ **CI/CD**: GitHub Actions configured

### Why We Switched
**User Requirement** (Nov 17, 2025):
> "I'm travelling and need an environment where I can continue to work web-based
> with prompting web-based and reviewing web-based going forward."

**Solution Implemented**:
1. GitHub Codespaces - Full IDE in browser
2. Azure deployment scripts - Web-based infrastructure
3. GitHub Actions - Auto-deployment
4. All documentation updated for remote work

---

## 🎯 For Claude: What This Means

### When User Says "Run X Command"

**Before (Terminal-based)**:
```bash
# Claude would run commands like:
cd /Users/ldevries/Documents/Billing/backend
npm run dev
```

**Now (Web-based)**:
```bash
# Tell user to run in Codespace terminal:
# "In your Codespace terminal, run:"
cd backend
npm run dev

# Or provide Codespace-specific instructions
```

### When User Says "Edit File X"

**Before**:
- Use Edit tool on local file path
- File at `/Users/ldevries/Documents/Billing/...`

**Now**:
- User will edit in Codespace browser
- Guide them to file location
- Or provide code snippets to copy-paste
- Local path may not be accessible

### When User Says "Deploy" or "Test"

**Before**:
- Local testing only
- Azure CLI from local terminal

**Now**:
- Codespace testing (browser-based)
- Azure Portal (web-based)
- GitHub Actions (automatic)

---

## 📂 Key File Locations

### Guides for Web-Based Work
- **Codespace Setup**: `CODESPACE-QUICK-START.md`
- **Azure Deployment**: `Azure/WEB-BASED-DEPLOYMENT-GUIDE.md`
- **Project Status**: `README.md`
- **Week 2 Plan**: `Implementation/PART_2_WEEK_2_AUTOMATED_INVOICE_SYSTEM.md`

### Configuration Files
- **Codespace Config**: `.devcontainer/devcontainer.json`
- **GitHub Actions**: `.github/workflows/azure-deploy.yml`
- **Azure Scripts**: `Azure/rental-mvp-deploy-simple.sh`
- **Backend Config**: `backend/package.json`

### Test Scripts
- **API Test**: `backend/scripts/test-invoice-generation.sh`

---

## 🔧 How to Help User in Web Environment

### Scenario 1: User Wants to Run Commands
**Response Template**:
```
To run this in your Codespace:

1. Open Codespace: https://github.com/jfzf7ndv5w-jpg/Billing/codespaces
2. Open terminal (Ctrl + `)
3. Run:
   ```bash
   cd backend
   <your commands here>
   ```
```

### Scenario 2: User Wants to Edit Code
**Response Template**:
```
To edit this file in Codespace:

1. File explorer (left sidebar) → Navigate to: backend/src/...
2. Or use Quick Open (Ctrl + P) → Type filename
3. Edit directly in browser
4. Auto-saves
5. Commit via Source Control panel or terminal
```

### Scenario 3: User Wants to Deploy
**Response Template**:
```
For web-based deployment:

Option A - GitHub Actions (Automatic):
1. Commit and push changes
2. GitHub Actions auto-deploys to Azure

Option B - Azure Portal (Manual):
1. Go to: https://portal.azure.com
2. Follow: Azure/WEB-BASED-DEPLOYMENT-GUIDE.md

Option C - Deploy from Codespace:
1. In Codespace terminal: az login
2. Run deployment script
```

### Scenario 4: User Wants to View Database
**Response Template**:
```
To view database in web environment:

1. In Codespace terminal:
   ```bash
   cd backend
   npx prisma studio
   ```

2. Codespace forwards port 5555
3. Click "Open in Browser" notification
4. Prisma Studio GUI opens in new tab
```

---

## ⚙️ Environment-Specific Considerations

### Database
**Local (Before)**: SQLite file at `backend/prisma/dev.db`
**Codespace**: PostgreSQL container (auto-started)
**Azure**: Azure Database for PostgreSQL

### Environment Variables
**Local**: `.env` file in backend folder
**Codespace**: Set in `.devcontainer/devcontainer.json` → `remoteEnv`
**Azure**: App Service → Configuration → Application Settings

### File Paths
**Local**: `/Users/ldevries/Documents/Billing/`
**Codespace**: `/workspaces/Billing/`
**Azure**: `/home/site/wwwroot/`

### Running Server
**Local**: `http://localhost:3001`
**Codespace**: Forwarded URL like `https://xxxxx-3001.app.github.dev`
**Azure**: `https://rental-mvp-api.azurewebsites.net`

---

## 📊 Current Project State

### Completed Work (Local Environment)
- ✅ Week 1: Backend API foundation
- ✅ Week 2 Day 1: Invoice generation service
- ✅ Local development tested and working
- ✅ Code committed to GitHub

### Ready for Web Environment
- ✅ Codespace configuration complete
- ✅ Azure deployment scripts ready
- ✅ CI/CD pipeline configured
- ✅ Documentation comprehensive

### Next Work (Web Environment)
- 🚧 Week 2 Day 2: PDF generation with PDFKit
- 📅 User will work from Codespace or remote location
- 📅 May deploy to Azure for production testing

---

## 💡 Quick Reference for Claude

### User Working Locally
- **Detect**: User mentions local paths, "my computer", "terminal"
- **Approach**: Use Bash tool, Edit/Write tools on local files
- **Example**: "I can run that command for you locally..."

### User Working in Codespace
- **Detect**: User mentions "Codespace", "browser", "traveling", "remote"
- **Approach**: Provide instructions, guide through web UI
- **Example**: "In your Codespace terminal, you can run..."

### User Working in Azure Portal
- **Detect**: User mentions "Azure", "portal", "deployment"
- **Approach**: Point to guides, web-based steps
- **Example**: "In Azure Portal, navigate to..."

---

## 🔍 How Claude Should Adapt

### Command Execution
**If user is remote**:
- Don't use Bash tool (won't work in their environment)
- Provide command text to copy-paste
- Reference relevant guides

**If user is local**:
- Can use Bash tool as before
- Direct file operations work

### File Operations
**If user is remote**:
- Provide code snippets
- Guide to file locations
- Explain where to paste code

**If user is local**:
- Can use Edit/Write tools
- Direct file manipulation works

### Testing
**If user is remote**:
- Guide to use test scripts in Codespace
- Point to browser-based tools
- Azure Portal for production

**If user is local**:
- Can run tests via Bash tool
- Check localhost endpoints
- Use local tools

---

## 📞 Communication Tips for Claude

### Always Ask Context
If unclear where user is working:
> "Are you working in a GitHub Codespace or on your local machine? This helps me give you the right instructions."

### Provide Both Options
When possible, give both:
> **In Codespace**: Run `npm run dev` in terminal
> **Locally**: I can run that for you now with: `npm run dev`

### Reference Documentation
Point user to right guide:
> "See `CODESPACE-QUICK-START.md` for detailed steps"
> "Follow `Azure/WEB-BASED-DEPLOYMENT-GUIDE.md` for deployment"

---

## 🎯 Success Criteria

User should be able to:
- ✅ Work entirely from browser
- ✅ Edit code in Codespace
- ✅ Run and test API
- ✅ Deploy to Azure
- ✅ View databases
- ✅ Monitor applications
- ✅ Commit and push changes

**All without local environment!**

---

## 📝 Version History

| Date | Change | Reason |
|------|--------|--------|
| 2025-11-17 02:50 | Created this file | User traveling, needs web-based work |
| 2025-11-17 02:50 | Completed Codespace setup | Enable remote development |
| 2025-11-17 02:50 | Created Azure deployment guides | Enable production deployment |

---

**Last Updated**: November 17, 2025 02:50
**Current Mode**: Web-Based Remote Development
**User Status**: Preparing for travel / remote work

---

## 🤖 For Claude Code

When you see this file in future sessions:

1. **Check** if user is local or remote
2. **Adapt** your responses accordingly
3. **Guide** user to appropriate tools and methods
4. **Reference** the right documentation
5. **Remember** all work can be done in browser now

**Key Insight**: User wants flexibility to work from anywhere, anytime, any device!
