# Security Agent - Auto-Approval System

**Version:** 1.0.0
**Purpose:** Eliminate permission prompts while maintaining security audit trail

---

## 🎯 What This Does

### Before Setup:
```
Claude: "Do you want to create package.json?"
❯ 1. Yes
  2. Yes, allow all edits during this session
  3. No...
```
**You had to:** Press a key to approve every single file operation

### After Setup:
```
Claude: Creates package.json automatically
Security Agent: ✅ Logs operation to security_logs/
```
**You do:** Nothing - it just works!

---

## 🔧 How It Works

### Two-Layer System:

#### 1. **PreToolUse Hook** (Security Agent)
- Fires BEFORE every tool use (Write, Edit, Bash, etc.)
- Evaluates security risk
- Auto-approves safe operations
- Logs EVERYTHING to audit trail
- Blocks dangerous operations

#### 2. **Permission Mode** (`acceptEdits`)
- Configures Claude Code to trust our security agent
- Skips permission prompts for approved operations
- Maintains user control for dangerous commands

---

## 📋 Security Rules

### ✅ Auto-Approved (Silent):
- **File Operations**: Write, Edit, Read any file
- **Safe Bash**: npm, git, mkdir, ls, node, etc.
- **Package Managers**: npm install, yarn, pnpm
- **Version Control**: git add/commit/push

### ⚠️ Blocked (Requires Review):
- `rm -rf /` - Destructive filesystem operations
- `sudo` - Privilege escalation
- `chmod 777` - Dangerous permissions
- `curl | sh` - Piped execution
- `/dev/` operations - System device access

### 📝 All Logged:
- Every tool use (approved or blocked)
- Timestamp, tool name, parameters
- Security decision and reasoning
- Session ID for traceability

---

## 📁 Where Things Are Logged

### Security Logs:
```
marketplace/auto-agents/agent-system/security_logs/
├── security_log_20251116.jsonl    # Today's operations
├── security_log_20251117.jsonl    # Tomorrow's operations
└── ...
```

### Log Entry Format:
```json
{
  "timestamp": "2025-11-16T01:23:45",
  "tool": "Write",
  "parameters": {
    "file_path": "/path/to/file.ts",
    "content": "..."
  },
  "decision": {
    "approved": true,
    "reasoning": "File creation approved - normal operation"
  },
  "session_id": "abc123"
}
```

---

## 🚀 Current Configuration

### Global Settings (`~/.claude/settings.json`):
```json
{
  "permissions": {
    "defaultMode": "acceptEdits"
  },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "/path/to/pre_tool_use.py"
          }
        ]
      }
    ]
  }
}
```

### Hook Location:
- **Active**: `/Users/ldevries/Documents/Billing/marketplace/auto-agents/hooks/pre_tool_use.py`
- **Source**: `/Users/ldevries/Documents/Agents/auto-agents/hooks/pre_tool_use.py`

---

## 📊 What Gets Captured

### Operational Questions (Now Silent):
1. **File Creation**:
   - "Should I create package.json?" → Auto-approved & logged
   - "Can I write server.ts?" → Auto-approved & logged

2. **File Editing**:
   - "Should I update tsconfig.json?" → Auto-approved & logged
   - "Can I modify this file?" → Auto-approved & logged

3. **Safe Commands**:
   - "Run npm install?" → Auto-approved & logged
   - "Execute git commit?" → Auto-approved & logged

### Strategic Questions (Still Ask You):
1. **Architecture**: "TypeScript or JavaScript?" → You decide
2. **Technology**: "PostgreSQL or MongoDB?" → You decide
3. **Approach**: "Which pattern should I use?" → You decide

---

## 🔍 Audit Trail

### Review Daily Logs:
```bash
# See today's security decisions
cat marketplace/auto-agents/agent-system/security_logs/security_log_$(date +%Y%m%d).jsonl

# Count operations by type
cat marketplace/auto-agents/agent-system/security_logs/security_log_$(date +%Y%m%d).jsonl | \
  jq -r '.tool' | sort | uniq -c

# Find blocked operations
cat marketplace/auto-agents/agent-system/security_logs/security_log_$(date +%Y%m%d).jsonl | \
  jq 'select(.decision.approved == false)'
```

### Statistics You Can Track:
- Total operations per day
- Operations by type (Write, Edit, Bash)
- Approval vs. block rate
- Most common operations
- Dangerous operations attempted

---

## 🎯 Benefits

### For You:
- ✅ **Zero Interruptions**: No permission prompts
- ✅ **Full Audit Trail**: Every operation logged
- ✅ **Security Protection**: Dangerous operations blocked
- ✅ **Peace of Mind**: Review logs anytime

### For Security:
- ✅ **Complete Transparency**: All operations recorded
- ✅ **Automated Protection**: Blocks dangerous patterns
- ✅ **Forensic Capability**: Full session traceability
- ✅ **Compliance Ready**: Audit trail for reviews

---

## 🔧 Customization

### Add Safe Commands:
Edit `pre_tool_use.py`, line ~86:
```python
safe_patterns = [
    "npm install", "npm run", "npm test",
    "your-custom-command",  # Add here
]
```

### Add Dangerous Patterns:
Edit `pre_tool_use.py`, line ~94:
```python
dangerous_patterns = [
    "rm -rf /", "sudo",
    "your-dangerous-pattern",  # Add here
]
```

### Change Default Behavior:
Edit `pre_tool_use.py`, line ~120:
```python
# Default: approve common operations
return True  # Change to False for stricter security
```

---

## 🧪 Testing

### Test Auto-Approval:
1. Restart Claude Code: `exit` then `claude`
2. Ask me to: "Create a test.txt file with 'hello world'"
3. Expected: File created instantly, no prompt
4. Check log: `ls marketplace/auto-agents/agent-system/security_logs/`

### Test Blocking:
1. Ask me to: "Run sudo rm -rf /"
2. Expected: Security agent blocks it
3. Check log: Should show `"approved": false`

---

## 📝 Next Steps

1. **Make hook executable** (you need to do this):
   ```bash
   chmod +x /Users/ldevries/Documents/Billing/marketplace/auto-agents/hooks/pre_tool_use.py
   ```

2. **Restart Claude Code**:
   ```bash
   exit
   claude
   ```

3. **Test it**: Ask me to create a file

4. **Review logs**: Check security_logs/ directory

---

## ⚠️ Important Notes

- **Fail-Safe**: If hook errors, operations are allowed (not blocked)
- **Daily Logs**: New log file created each day
- **Session Tracking**: Each session has unique ID
- **No Data Loss**: Logs are append-only (never overwritten)

---

**Status:** Ready to deploy
**Requires:** `chmod +x` on hook script, then restart Claude Code
**Log Location:** `marketplace/auto-agents/agent-system/security_logs/`
