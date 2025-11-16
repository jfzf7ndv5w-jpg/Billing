# Autonomous Agent System - Version 4.0

**Automatic Question Interception via Claude Code Hooks**

---

## 🚀 Quick Start - New Project Setup

### Step 1: Copy Files

Copy this entire `auto-agents/` folder to your new project:
```bash
cp -r /path/to/auto-agents /path/to/your-new-project/
```

### Step 2: Install Plugin

```bash
cd /path/to/your-new-project
claude

# In Claude Code:
> /plugin add ./auto-agents
```

### Step 3: Activate (First Time Only)

Copy and paste this prompt into Claude Code:

```
I've just installed the Autonomous Agent System v4.0.

This system will automatically intercept my questions and provide proven
answers via the UserPromptSubmit hook. The knowledge base starts empty
and will learn from my decisions as we work together.

Please confirm the plugin is active and explain how it will work in this
project.
```

### Step 4: Start Working

Just use Claude Code normally! When you ask questions:
- System checks knowledge base (5ms)
- Consults agents if needed (500ms)
- Injects high-confidence answers (≥70%)
- Learns from outcomes over time

**Completely automatic. Zero manual steps.**

---

## 📁 Folder Structure

```
.
├── .claude-plugin/         # Plugin metadata
├── hooks/                  # UserPromptSubmit hook
├── agent-system/           # Agent system & knowledge base
│   ├── learned_answers.json        # Starts empty
│   ├── qa_logs/                    # Auto-populated
│   ├── outcomes/                   # Auto-tracked
│   └── audit_reviews/              # Auto-generated
├── Status/                 # Documentation
└── Archive/                # Previous versions & old sessions
```

---

## 🎯 How It Works

1. You type a question in Claude Code
2. `UserPromptSubmit` hook fires automatically (before Claude sees it)
3. Hook checks knowledge base (5ms) or consults agents (500ms)
4. If confidence ≥70%, answer is injected as context
5. Claude responds using the proven answer

**Example:**
```
You: Should we implement caching?
   ↓
╔══════════════════════════════════════════════╗
║ ✅ AUTONOMOUS AGENT ANSWER AVAILABLE          ║
╚══════════════════════════════════════════════╝

📋 RECOMMENDED ANSWER: Yes, use Redis caching
📊 Confidence: 90%
🔖 Source: multi-agent analysis
🤖 Agents: Architecture, Performance, Security

💭 Reasoning: [detailed analysis]
   ↓
Claude: [responds with proven answer]
```

---

## ⚙️ Configuration

Edit confidence threshold in `hooks/user_prompt_submit.py`:
```python
confidence_threshold=0.7  # Default: 70%
```

**Recommended values:**
- `0.6` - Aggressive (more injections)
- `0.7` - Balanced (recommended)
- `0.9` - Conservative (only very confident)

---

## 📚 Documentation

- **Status/INDEX.md** - Full navigation guide
- **Status/CHANGELOG.md** - Version history
- **Archive/** - Previous versions

---

## 🔍 Verify Installation

```bash
# Check plugin status
> /plugin list
# Should show: autonomous-agents

# Test the hook
echo "Should we use TypeScript?" | ./auto-agents/hooks/user_prompt_submit.py

# View knowledge base (starts empty)
cat ./agent-system/learned_answers.json
```

---

## 📊 What to Expect

**First Session:**
- Knowledge base is empty
- All questions go to agents (500ms)
- Answers are learned and stored

**After 10 Questions:**
- ~70% answers from knowledge base (5ms)
- ~20% pass through (low confidence)
- ~10% new agent consultations

**After 50 Questions:**
- ~90% instant answers (5ms)
- System knows your preferences
- Very few agent consultations needed

**The system gets smarter with every question!**

---

## ❓ Troubleshooting

**Plugin not showing?**
```bash
> /plugin remove autonomous-agents
> /plugin add ./auto-agents
```

**Hook not firing?**
- Check `hooks/user_prompt_submit.py` is executable
- Verify `hooks/hooks.json` is valid JSON

**No answers injecting?**
- Knowledge base starts empty (normal)
- Confidence threshold may be too high
- Check question contains question indicators (?, should, would, etc.)

---

**Version**: 4.0.0
**Status**: Production Ready
**Last Updated**: 2025-11-15
