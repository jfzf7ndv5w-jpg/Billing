# Autonomous Agent System - Test Scenario

## How the System Should Work

### Scenario 1: Claude Asks About Creating a Folder

**First Time:**
```
Claude: "Should I create the folder `/src/components`?"
You: "yes"

Hook fires → Detects "yes" (short answer) → Sends to agent system
Agent system: No learned answer → INSUFFICIENT_INFORMATION (30% confidence)
→ Escalates to human → You answer "yes"
→ Saves to knowledge base: question="Should I create the folder `/src/components`?", answer="yes"

Claude proceeds: Creates the folder
```

**Second Time (Similar Question):**
```
Claude: "Should I create the folder `/src/utils`?"
You: "yes"

Hook fires → Detects "yes" → Sends to agent system
Agent system: Checks learned answers → Exact match? No → INSUFFICIENT_INFORMATION
→ Saves this as new learned answer

(Note: Exact string matching means it won't match similar questions yet)
```

**What Gets Logged:**
- `learned_answers.json`: Stores the question hash and your "yes" answer
- `qa_logs/`: Individual JSON files for each Q&A interaction
- Agent learns: When asked this specific question again, answer is "yes"

---

### Scenario 2: Claude Asks About Technology Choice

**First Time:**
```
Claude: "Should we use TypeScript or JavaScript for this project?"
You: "TypeScript"

Hook fires → Detects "TypeScript" (1 word, tech name) → Sends to agent
Agent: No learned answer → INSUFFICIENT_INFORMATION → Escalates
You: "TypeScript"
→ Saves: question="Should we use TypeScript or JavaScript...", answer="TypeScript"
```

**Exact Same Question Later:**
```
Claude: "Should we use TypeScript or JavaScript for this project?"
(Before you can answer)

Hook fires → Sends to agent
Agent: MD5 hash match in learned_answers → Returns learned answer "TypeScript" (95% confidence)
→ Hook injects context for Claude:

╔══════════════════════════════════════╗
║ ✅ AUTONOMOUS AGENT ANSWER AVAILABLE  ║
╚══════════════════════════════════════╝

📋 RECOMMENDED ANSWER: TypeScript

📊 Confidence: 95%
🔖 Source: learned (from knowledge base)
💭 Reasoning: You chose this 1 time(s) previously

Claude sees this context → Uses "TypeScript" without asking you again
```

---

### Scenario 3: Your Question to Claude (Should NOT Intercept)

**Example:**
```
You: "Should we implement rate limiting for the API?"

Hook fires → Detects question indicators ("should we") → `is_user_asking_question()` returns True
→ Hook returns None → Pass through (no interception)

Claude: Responds normally with analysis about rate limiting
```

---

## Current State of Knowledge Base

**File:** `/Users/ldevries/Documents/Billing/marketplace/auto-agents/agent-system/learned_answers.json`

**Status:** Empty `{}`

**Why:** Cleared all the useless "Option A" placeholders

**Next:** Will populate with real answers as you respond to Claude's questions

---

## Expected Behavior by Question Type

| Claude's Question | Your Answer | What Gets Stored | Next Time |
|-------------------|-------------|------------------|-----------|
| "Create folder X?" | "yes" | `{"question": "Create folder X?", "chosen_option": "yes", ...}` | Auto-answers "yes" |
| "TypeScript or JavaScript?" | "TypeScript" | `{"question": "TypeScript or JavaScript?", "chosen_option": "TypeScript", ...}` | Auto-answers "TypeScript" |
| "Which database?" | "PostgreSQL" | Stored with reasoning | Auto-suggests PostgreSQL |
| "Should I add tests?" | "yes" | Stored | Auto-answers "yes" |
| "Overwrite file?" | "yes" | Stored | Auto-answers "yes" |

---

## Limitations

### 1. **Exact String Matching**
- Currently uses MD5 hash of question text
- "Should I create folder X?" ≠ "Should I create folder Y?"
- Won't generalize to similar but different questions

### 2. **No Semantic Understanding**
- Doesn't understand that "create folder" and "make directory" are the same
- Each variation is a separate learned answer

### 3. **Detection Heuristics**
- Relies on short answer patterns ("yes", "TypeScript", etc.)
- May miss some valid answers if they don't match patterns

---

## How to Test Right Now

1. **Restart Claude Code** to load updated hook:
   ```bash
   exit
   claude
   ```

2. **Wait for Claude to ask you something**, like:
   - "Should I create a folder?"
   - "Which approach should I use?"
   - "Can I proceed?"

3. **Answer with a short response**:
   - "yes"
   - "TypeScript"
   - "go ahead"

4. **Check if it was logged**:
   ```bash
   cat /Users/ldevries/Documents/Billing/marketplace/auto-agents/agent-system/learned_answers.json
   ```

5. **Next time Claude asks the EXACT same question**, the system should auto-provide your previous answer

---

## Future Improvements Needed

To make this truly useful for "never ask twice" behavior:

1. **Semantic Matching**: Group similar questions
   - "Create folder X?" and "Create folder Y?" → Same pattern: "always yes to folder creation"

2. **Pattern Learning**: Learn rules, not just answers
   - After 3x "yes" to folder creation → Rule: "Always create folders"

3. **Context Awareness**: Understand question types
   - File operations (create/delete) → Remember preferences
   - Technology choices → Remember stack preferences
   - Coding style → Remember formatting preferences

4. **Confidence Building**: Increase confidence over time
   - First time: 70% confidence → Ask human
   - Same pattern 3x: 90% confidence → Auto-answer
   - Same pattern 10x: 99% confidence → Never ask

---

**Current Version:** 4.0.1
**Status:** Basic learning implemented, awaiting real-world testing
**Test Date:** 2025-11-16
