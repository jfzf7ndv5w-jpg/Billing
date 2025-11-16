#!/usr/bin/env python3
"""
UserPromptSubmit Hook - Autonomous Agent Question Interception

This hook fires BEFORE Claude processes a user's prompt.
It checks the autonomous agent system for high-confidence answers and
injects them as context if available.

Version: 4.0.0
Integration: Claude Code Plugin System
"""

import sys
import json
import asyncio
from pathlib import Path
from typing import Dict, Any, Optional

# Add agent-system directory to path to import orchestrator
PLUGIN_ROOT = Path(__file__).parent.parent
AGENT_SYSTEM_DIR = PLUGIN_ROOT / "agent-system"
sys.path.insert(0, str(AGENT_SYSTEM_DIR))

try:
    from autonomous_orchestrator_enhanced import AutonomousOrchestrator
except ImportError as e:
    # Graceful fallback if orchestrator not available
    print(f"⚠️  Warning: Could not load autonomous orchestrator: {e}", file=sys.stderr)
    sys.exit(0)


class UserPromptInterceptor:
    """
    Intercepts user prompts and provides agent answers when confident
    """

    def __init__(self, confidence_threshold: float = 0.7):
        """
        Initialize the interceptor

        Args:
            confidence_threshold: Minimum confidence to inject answer (default 70%)
        """
        self.confidence_threshold = confidence_threshold
        self.orchestrator = AutonomousOrchestrator(
            agents_dir=PLUGIN_ROOT / "agent-system",
            confidence_threshold=0.6  # Lower threshold for escalation
        )

    def is_user_asking_question(self, prompt: str) -> bool:
        """
        Detect if USER is asking Claude a question (not Claude asking user)

        Args:
            prompt: User's prompt

        Returns:
            True if this looks like a user question to Claude
        """
        # Simple question detection
        question_indicators = [
            '?',
            'should we',
            'should i',
            'can we',
            'can i',
            'is it',
            'would it',
            'do we',
            'do i',
            'what',
            'how',
            'which',
            'when',
            'where',
            'why'
        ]

        prompt_lower = prompt.lower()
        return any(indicator in prompt_lower for indicator in question_indicators)

    def is_response_to_claude(self, prompt: str) -> bool:
        """
        Detect if user is responding to Claude's question

        This checks for short, answer-like responses that suggest
        Claude asked the user something and they're answering.

        Common scenarios:
        - Claude asks: "Should I create folder X?" → User: "yes"
        - Claude asks: "TypeScript or JavaScript?" → User: "TypeScript"
        - Claude asks: "Which approach?" → User: "option 1"

        Args:
            prompt: User's prompt

        Returns:
            True if this looks like an answer to Claude's question
        """
        prompt_lower = prompt.strip().lower()
        word_count = len(prompt_lower.split())

        # Very short responses (1-5 words - likely answers)
        if word_count <= 5:
            # Common answer patterns for operational questions
            answer_patterns = [
                # Approval/permission responses
                'yes', 'no', 'sure', 'okay', 'ok', 'yep', 'nope',
                'go ahead', 'please do', 'sounds good',
                'continue', 'proceed', 'skip', 'approve', 'reject',

                # Technology choices
                'typescript', 'javascript', 'python', 'java', 'go', 'rust',
                'react', 'vue', 'angular', 'svelte', 'next', 'nuxt',
                'postgres', 'mongodb', 'mysql', 'redis', 'sqlite',
                'docker', 'kubernetes', 'aws', 'azure', 'gcp',

                # Option selections
                'option a', 'option b', 'option c',
                'option 1', 'option 2', 'option 3',
                'first one', 'second one', 'third one', 'last one',
                'first', 'second', 'third',

                # Choice indicators
                'both', 'neither', 'either', 'all', 'none',
                'that one', 'this one',

                # File/folder operation responses
                'create it', 'delete it', 'keep it', 'remove it',
                'overwrite', 'merge', 'replace'
            ]

            if any(pattern in prompt_lower for pattern in answer_patterns):
                return True

            # Check for single-word technology/tool names (likely answers)
            single_word_tech = ['npm', 'yarn', 'pnpm', 'vite', 'webpack',
                               'jest', 'vitest', 'mocha', 'chai',
                               'eslint', 'prettier', 'biome']
            if word_count == 1 and any(tech in prompt_lower for tech in single_word_tech):
                return True

        # Medium-short responses (6-10 words) with choice indicators
        if word_count <= 10:
            choice_indicators = [
                'i prefer', 'i think', 'i choose', 'i\'d like', 'i want',
                'let\'s use', 'let\'s go with', 'let\'s try',
                'use the', 'go with', 'pick', 'choose',
                'sounds good', 'looks good', 'that works',
                'makes sense', 'i agree'
            ]
            if any(indicator in prompt_lower for indicator in choice_indicators):
                return True

        return False

    async def process_prompt(self, user_prompt_raw: str) -> Optional[Dict[str, Any]]:
        """
        Process the user prompt through agent system

        Args:
            user_prompt_raw: The raw prompt (may be JSON from Claude Code)

        Returns:
            Agent response if confident, None otherwise
        """
        # Extract actual prompt from JSON if present
        try:
            prompt_data = json.loads(user_prompt_raw)
            user_prompt = prompt_data.get("prompt", user_prompt_raw)
        except (json.JSONDecodeError, AttributeError):
            # Not JSON, use as-is
            user_prompt = user_prompt_raw

        # STRATEGY: Only intercept when user is responding to Claude's question
        # Skip if user is asking Claude a question (let Claude handle it)
        if self.is_user_asking_question(user_prompt):
            # User asking Claude - don't intercept, let Claude respond
            return None

        # Check if this looks like user responding to Claude
        if not self.is_response_to_claude(user_prompt):
            # Not a response to Claude - pass through
            return None

        try:
            # Get answer from orchestrator
            result = await self.orchestrator.process_question(user_prompt)

            confidence = result["choice"]["confidence"]
            answer = result["choice"]["chosen_option"]
            source = result["source"]
            reasoning = result["choice"]["reasoning"]
            choice_id = result["choice"]["choice_id"]

            # Check if we should inject this answer
            if confidence >= self.confidence_threshold:
                return {
                    "answer": answer,
                    "confidence": confidence,
                    "source": source,
                    "reasoning": reasoning,
                    "choice_id": choice_id,
                    "agents_consulted": result["choice"].get("agents_consulted", [])
                }
            else:
                # Low confidence - don't inject
                return None

        except Exception as e:
            # If anything fails, just pass through
            print(f"⚠️  Error in agent processing: {e}", file=sys.stderr)
            return None

    def format_context_injection(self, agent_response: Dict[str, Any]) -> str:
        """
        Format the agent response as context for Claude

        Args:
            agent_response: Response from agent system

        Returns:
            Formatted context string
        """
        confidence_emoji = "🎯" if agent_response["confidence"] >= 0.9 else "✅"
        source_desc = {
            "learned": "proven answer from knowledge base",
            "agents": "multi-agent analysis",
            "human": "human-provided guidance"
        }.get(agent_response["source"], "agent system")

        context = f"""
╔══════════════════════════════════════════════════════════════════════╗
║ {confidence_emoji} AUTONOMOUS AGENT ANSWER AVAILABLE                              ║
╚══════════════════════════════════════════════════════════════════════╝

📋 RECOMMENDED ANSWER: {agent_response['answer']}

📊 Confidence: {agent_response['confidence']:.0%}
🔖 Source: {source_desc}
"""

        if agent_response.get("agents_consulted"):
            context += f"🤖 Agents: {', '.join(agent_response['agents_consulted'])}\n"

        context += f"""
💭 Reasoning: {agent_response['reasoning']}

╔══════════════════════════════════════════════════════════════════════╗
║ This answer has been verified by the autonomous agent system.        ║
║ Use this recommendation unless you have specific reasons to override.║
╚══════════════════════════════════════════════════════════════════════╝

Choice ID: {agent_response['choice_id']}
"""

        return context


async def main():
    """
    Main hook entry point

    Reads user prompt from stdin, processes it, and outputs context if available.
    """
    # Read user prompt from stdin (provided by Claude Code)
    user_prompt = sys.stdin.read().strip()

    if not user_prompt:
        # Empty prompt, pass through
        sys.exit(0)

    # Initialize interceptor
    interceptor = UserPromptInterceptor(confidence_threshold=0.7)

    # Process the prompt
    agent_response = await interceptor.process_prompt(user_prompt)

    if agent_response:
        # High confidence answer available - inject context
        context = interceptor.format_context_injection(agent_response)
        print(context)
        sys.exit(0)
    else:
        # No confident answer - pass through normally
        # (Could optionally log this for debugging)
        sys.exit(0)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception as e:
        # If anything fails, gracefully pass through
        print(f"⚠️  Hook error: {e}", file=sys.stderr)
        sys.exit(0)
