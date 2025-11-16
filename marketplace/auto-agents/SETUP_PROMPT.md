# Setup Prompt for New Projects

**Copy and paste this into Claude Code after installing the plugin**

---

## 📋 Initial Activation Prompt

```
I've just installed the Autonomous Agent System v4.0 plugin.

This system will automatically intercept my questions and provide proven
answers via the UserPromptSubmit hook. The knowledge base starts empty
and will learn from my decisions as we work together.

Key capabilities:
- Automatic question detection and interception
- Multi-agent analysis (Architecture, Security, Performance, Audit, Test)
- Knowledge base that learns from outcomes
- Confidence-based answer injection (≥70% threshold)

Please confirm the plugin is active and ready. Then explain:
1. How the system will help in this project
2. What happens when I ask my first question
3. How the knowledge base will grow over time

Let's start building project-specific intelligence together!
```

---

## 🎯 What This Does

When you paste this prompt, Claude will:
1. ✅ Acknowledge the plugin is active
2. ✅ Explain how the hook system works
3. ✅ Set expectations for the learning curve
4. ✅ Prepare to start intercepting questions

---

## 📊 Expected Response

Claude should confirm:
- Plugin detected and operational
- Hook will fire on every prompt submission
- Knowledge base is empty and ready to learn
- First questions will consult agents (~500ms)
- Subsequent questions get faster as system learns

---

## 🚀 After Activation

Just use Claude Code normally:
- Ask questions naturally
- System intercepts automatically
- Answers are learned and stored
- Knowledge base grows with each decision

**No further setup needed!**

---

## 🔍 Verify It's Working

After your first few questions, check:
```bash
# View learned answers
cat agent-system/learned_answers.json

# Check logs
ls agent-system/qa_logs/

# Plugin status
/plugin list
```

You should see JSON entries appearing in `learned_answers.json` as you ask questions.

---

**Version**: 4.0.0
**Purpose**: One-time activation prompt for new projects
**Usage**: Copy → Paste → Start working
