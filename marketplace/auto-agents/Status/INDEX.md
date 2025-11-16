# Documentation Index - Version 4.0

**Autonomous Agent System with Automatic Question Interception**

---

## 🚀 Quick Start

### For New Projects

1. Copy entire `auto-agents/` folder to your new project
2. Install: `claude` → `/plugin add /path/to/auto-agents`
3. Use Claude Code normally - agents answer questions automatically!

### File Links

- **../README.md** - Installation and setup
- **CHANGELOG.md** - Version history
- **INDEX.md** - This file

---

## 📁 Folder Structure

```
auto-agents/
├── README.md              # Quick start guide
├── .claude-plugin/        # Plugin metadata
├── hooks/                 # UserPromptSubmit hook
├── agent-system/          # Agent system & knowledge base
├── Status/                # Documentation (this folder)
└── Archive/               # Previous versions & session data
```

---

## 🎯 How It Works

**The Flow:**
1. You ask a question in Claude Code
2. `UserPromptSubmit` hook fires automatically
3. System checks knowledge base (5ms) or consults agents (500ms)
4. If confidence ≥70%, answer injected as context
5. Claude responds with proven answer

**Zero manual intervention.**

---

## 📚 Documentation Files

### Status/ (Current)

- **INDEX.md** - This file
- **CHANGELOG.md** - Version history

### Archive/

- **phase3_manual_helper/** - Version 3.x (manual workflow)
- **phase3_interception_vision/** - Architecture plans before hooks
- **historical_code/** - Old Python files
- **session_data/** - Your previous session logs and learned answers

---

## ⚙️ Configuration

Edit `hooks/user_prompt_submit.py`:
```python
confidence_threshold=0.7  # Adjust 0.6-0.9
```

---

## 🔍 Key Files

| File | Purpose |
|------|---------|
| `.claude-plugin/plugin.json` | Plugin metadata |
| `hooks/hooks.json` | Hook configuration |
| `hooks/user_prompt_submit.py` | Main interception logic |
| `agent-system/autonomous_orchestrator_enhanced.py` | Decision engine |
| `agent-system/learned_answers.json` | Knowledge base (starts empty) |

---

## 📊 Version History

- **4.0.0** (2025-11-15) - Automatic hook-based interception
- **3.2.0** - Manual helper with outcome tracking
- **3.1.0** - Autonomous decisions + learning
- **2.2.0** - Smart routing (70% efficiency)
- **2.1.0** - Multi-agent system
- **1.0.0** - Initial release

See **CHANGELOG.md** for details.

---

## 💡 Tips

### Usage
- Ask questions naturally
- High confidence = proven answer
- System learns from outcomes

### Performance
- `0.6` threshold = aggressive
- `0.7` threshold = balanced (default)
- `0.9` threshold = conservative

### Debugging
```bash
# Test hook
echo "Should we use caching?" | hooks/user_prompt_submit.py

# Check plugin
/plugin list

# View knowledge
cat agent-system/learned_answers.json
```

---

**Version**: 4.0.0
**Status**: Production Ready
**Updated**: 2025-11-15
