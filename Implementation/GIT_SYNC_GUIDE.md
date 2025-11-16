# Git Synchronization Guide

**Repository:** https://github.com/jfzf7ndv5w-jpg/Billing

---

## Daily Workflow

### 1. Before Starting Work
```bash
# Pull latest changes
git pull origin main

# Check status
git status
```

### 2. During Work
```bash
# Check what files changed
git status

# Add specific files
git add Implementation/PART_X_WEEK_X.md
git add README.md

# Or add all changes
git add .

# Commit with descriptive message
git commit -m "Add Part 2: Automated Invoice System implementation guide"
```

### 3. After Completing a Section
```bash
# Push to GitHub
git push origin main
```

---

## Best Practices

### Commit Messages Format
```
<type>: <short summary>

<optional detailed description>

Examples:
- feat: Add Week 2 automated invoice implementation plan
- docs: Update README with project structure
- fix: Correct database schema in Part 1
- chore: Update .gitignore for Azure Functions
```

### When to Commit

**Commit after:**
- ✅ Completing each implementation part (PART_X_WEEK_X.md)
- ✅ Major updates to README or documentation
- ✅ Creating new folder structures
- ✅ Completing a full day's work

**Don't commit:**
- ❌ Incomplete work (unless clearly marked as WIP)
- ❌ Sensitive data (.env files, credentials)
- ❌ Large binary files (unless necessary)

---

## Common Commands

### Check Remote Status
```bash
# View remote URL
git remote -v

# Check connection
git fetch origin
```

### View History
```bash
# View commit log
git log --oneline

# View last 5 commits
git log --oneline -5

# View changes in a commit
git show <commit-hash>
```

### Undo Changes

**Before commit (unstaged):**
```bash
# Discard changes in a file
git checkout -- filename.md

# Discard all changes
git checkout -- .
```

**Before commit (staged):**
```bash
# Unstage a file
git reset HEAD filename.md

# Unstage all
git reset HEAD .
```

**After commit (not pushed):**
```bash
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1
```

---

## Branch Strategy

### Main Branch
- Production-ready code
- All implementation plans
- Complete, reviewed documentation

### Feature Branches (Optional)
```bash
# Create feature branch
git checkout -b feature/week-3-payment-system

# Work on feature
# ... make changes ...

# Commit changes
git add .
git commit -m "Add payment reconciliation logic"

# Push feature branch
git push origin feature/week-3-payment-system

# Switch back to main
git checkout main

# Merge feature (after testing)
git merge feature/week-3-payment-system
```

---

## Sync Checklist

### Daily Start
- [ ] Pull latest changes: `git pull origin main`
- [ ] Check status: `git status`
- [ ] Verify working directory is clean

### During Development
- [ ] Commit logical chunks of work
- [ ] Write descriptive commit messages
- [ ] Test changes before committing

### Daily End
- [ ] Commit all completed work
- [ ] Push to GitHub: `git push origin main`
- [ ] Verify push successful
- [ ] Check GitHub web interface

### Weekly
- [ ] Review commit history
- [ ] Clean up old branches (if any)
- [ ] Verify all parts are synced
- [ ] Update main README if needed

---

## File Organization in Git

### Always Commit:
```
Implementation/
  ├── IMPLEMENTATION_PLAN.md
  ├── PART_1_WEEK_1_FOUNDATION.md
  ├── PART_2_WEEK_2_INVOICE_SYSTEM.md
  └── ... (all implementation guides)

Docs/
  └── (all documentation)

README.md
.gitignore
```

### Never Commit (in .gitignore):
```
.env
.env.local
node_modules/
dist/
*.log
.DS_Store
credentials.json
```

---

## Troubleshooting

### Rejected Push (Remote has changes)
```bash
# Pull remote changes first
git pull origin main

# Resolve conflicts if any
# Then push again
git push origin main
```

### Merge Conflicts
```bash
# View conflicted files
git status

# Edit files to resolve conflicts
# Look for <<<<<<, ======, >>>>>> markers

# After resolving
git add .
git commit -m "Resolve merge conflicts"
git push origin main
```

### Reset to Remote Version
```bash
# Discard all local changes
git fetch origin
git reset --hard origin/main
```

---

## Quick Reference Card

| Task | Command |
|------|---------|
| Pull updates | `git pull origin main` |
| Check status | `git status` |
| Add all changes | `git add .` |
| Commit | `git commit -m "message"` |
| Push | `git push origin main` |
| View log | `git log --oneline` |
| Undo unstaged | `git checkout -- .` |
| Undo staged | `git reset HEAD .` |
| View remote | `git remote -v` |

---

## GitHub Repository Structure

```
https://github.com/jfzf7ndv5w-jpg/Billing
├── Implementation/         (Implementation plans)
├── Docs/                  (Complete documentation)
├── Data_migration/        (Migration scripts & data)
├── marketplace/           (Autonomous agents)
├── README.md              (Project overview)
└── .gitignore            (Ignored files)
```

---

## Automated Sync (Future Enhancement)

Consider adding GitHub Actions for:
- Auto-update documentation index
- Validate markdown files
- Check for sensitive data
- Run linters on code

---

**Last Updated:** November 16, 2025
**Repository:** https://github.com/jfzf7ndv5w-jpg/Billing
**Status:** Active
