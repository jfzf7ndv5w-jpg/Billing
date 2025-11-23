#!/usr/bin/env python3
"""
PreToolUse Hook - Security Agent Auto-Approval

This hook fires BEFORE Claude uses a tool (Write, Edit, Bash, etc.)
It logs the operation and auto-approves based on security rules.

Version: 1.0.0
Purpose: Eliminate permission prompts while maintaining security audit trail
"""

import sys
import json
from datetime import datetime
from pathlib import Path

# Hook configuration
PLUGIN_ROOT = Path(__file__).parent.parent
SECURITY_LOG = PLUGIN_ROOT / "agent-system" / "security_logs"
SECURITY_LOG.mkdir(parents=True, exist_ok=True)


class SecurityAgent:
    """
    Security agent that evaluates and auto-approves tool usage
    """

    def __init__(self):
        self.log_file = SECURITY_LOG / f"security_log_{datetime.now().strftime('%Y%m%d')}.jsonl"

    def evaluate_tool_use(self, tool_data: dict) -> dict:
        """
        Evaluate if a tool use is safe and should be auto-approved

        Args:
            tool_data: Tool usage data from Claude Code

        Returns:
            Decision with approval status and reasoning
        """
        tool_name = tool_data.get("tool", "unknown")

        # Security rules
        decision = {
            "approved": True,
            "reasoning": "Auto-approved by security agent",
            "timestamp": datetime.now().isoformat(),
            "tool": tool_name
        }

        # Evaluate based on tool type
        if tool_name == "Write":
            decision["reasoning"] = "File creation approved - normal operation"
        elif tool_name == "Edit":
            decision["reasoning"] = "File edit approved - normal operation"
        elif tool_name == "Bash":
            command = tool_data.get("parameters", {}).get("command", "")
            if self._is_safe_bash_command(command):
                decision["reasoning"] = f"Safe bash command approved: {command[:50]}"
            else:
                decision["approved"] = False
                decision["reasoning"] = f"Potentially unsafe bash command - requires review: {command[:50]}"
        elif tool_name == "Read":
            decision["reasoning"] = "Read operation approved - no security risk"
        else:
            decision["reasoning"] = f"Tool {tool_name} approved"

        return decision

    def _is_safe_bash_command(self, command: str) -> bool:
        """
        Check if a bash command is safe to auto-approve

        Args:
            command: Bash command to evaluate

        Returns:
            True if safe, False if needs review
        """
        # Safe command patterns
        safe_patterns = [
            "npm install", "npm run", "npm test",
            "mkdir", "ls", "cd", "pwd", "cat",
            "git add", "git commit", "git push", "git status",
            "node", "yarn", "pnpm",
            "echo", "touch", "cp", "mv"
        ]

        # Dangerous patterns
        dangerous_patterns = [
            "rm -rf /", "sudo", "chmod 777",
            "curl | sh", "wget | sh",
            "> /dev/", "dd if=", "mkfs"
        ]

        command_lower = command.lower().strip()

        # Check for dangerous patterns first
        for pattern in dangerous_patterns:
            if pattern in command_lower:
                return False

        # Check if starts with safe pattern
        for pattern in safe_patterns:
            if command_lower.startswith(pattern):
                return True

        # Default: approve common operations
        return True

    def log_decision(self, tool_data: dict, decision: dict):
        """
        Log the security decision to audit trail

        Args:
            tool_data: Original tool usage data
            decision: Security decision made
        """
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "tool": tool_data.get("tool", "unknown"),
            "parameters": tool_data.get("parameters", {}),
            "decision": decision,
            "session_id": tool_data.get("session_id", "unknown")
        }

        # Append to daily log file
        with open(self.log_file, 'a') as f:
            f.write(json.dumps(log_entry) + '\n')


def main():
    """
    Main hook entry point

    Reads tool usage data from stdin, evaluates security, and outputs approval.
    """
    try:
        # Read tool usage data from stdin
        input_data = sys.stdin.read().strip()

        if not input_data:
            # No data, pass through
            sys.exit(0)

        # Parse input
        tool_data = json.loads(input_data)

        # Initialize security agent
        agent = SecurityAgent()

        # Evaluate the tool use
        decision = agent.evaluate_tool_use(tool_data)

        # Log the decision
        agent.log_decision(tool_data, decision)

        # Output decision to Claude Code
        # If approved, output nothing (auto-approve)
        # If denied, output a block message
        if not decision["approved"]:
            print(f"⚠️  Security Agent: {decision['reasoning']}")
            sys.exit(1)  # Block the operation

        # Approved - silent pass-through
        sys.exit(0)

    except Exception as e:
        # On any error, fail safe and allow the operation
        print(f"⚠️  Security agent error: {e}", file=sys.stderr)
        sys.exit(0)


if __name__ == "__main__":
    main()
