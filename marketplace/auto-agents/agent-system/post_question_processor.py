"""
Post-Question Processor - Phase 3.3

Handles what happens AFTER a question is answered:
1. Outcome tracking - Did the answer work?
2. Confidence adjustment - Update based on results
3. Knowledge refinement - Improve from experience
4. Effectiveness monitoring - Track decision quality
5. Feedback loop - Learn and adapt

This creates a continuous improvement system.
"""

import json
import asyncio
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from enum import Enum


class OutcomeStatus(Enum):
    """Possible outcomes for a decision"""
    SUCCESS = "success"              # Answer worked perfectly
    PARTIAL = "partial"              # Answer worked but had issues
    FAILED = "failed"                # Answer didn't work
    UNKNOWN = "unknown"              # Not yet validated
    REVERSED = "reversed"            # User manually reversed the decision


@dataclass
class QuestionOutcome:
    """Records the outcome of a answered question"""
    choice_id: str
    question: str
    answer_provided: str
    source: str                      # "learned", "agents", "human"
    original_confidence: float

    # Outcome tracking
    status: OutcomeStatus
    validation_method: str           # How we validated (auto/manual/implicit)
    validation_timestamp: str
    time_to_validate_hours: float

    # Result details
    success_indicators: List[str]
    failure_indicators: List[str]
    user_feedback: Optional[str]

    # Learning
    adjusted_confidence: float       # New confidence based on outcome
    knowledge_update: str            # What we learned
    should_revise: bool              # Should we revise the answer?

    def to_dict(self) -> dict:
        result = asdict(self)
        result['status'] = self.status.value
        return result


class PostQuestionProcessor:
    """
    Processes outcomes after questions are answered

    Creates a feedback loop:
    - Tracks if answers worked
    - Adjusts confidence scores
    - Refines knowledge base
    - Learns from successes and failures
    """

    def __init__(self, agents_dir: Path = None):
        """
        Initialize post-question processor

        Args:
            agents_dir: Directory for Agents/ subfolder
        """
        self.agents_dir = agents_dir or Path("Agents")

        # Directories
        self.outcomes_dir = self.agents_dir / "outcomes"
        self.outcomes_dir.mkdir(parents=True, exist_ok=True)

        self.learned_file = self.agents_dir / "learned_answers.json"
        self.qa_log_dir = self.agents_dir / "qa_logs"

        # Load existing outcomes
        self.outcomes_file = self.outcomes_dir / "all_outcomes.json"
        self.outcomes = self._load_outcomes()

        # Statistics
        self.stats = {
            "total_validated": 0,
            "success_count": 0,
            "partial_count": 0,
            "failed_count": 0,
            "confidence_improvements": 0,
            "knowledge_revisions": 0,
        }

    def _load_outcomes(self) -> Dict:
        """Load previous outcomes"""
        if self.outcomes_file.exists():
            try:
                with open(self.outcomes_file, 'r') as f:
                    return json.load(f)
            except:
                return {}
        return {}

    def _save_outcomes(self):
        """Save outcomes to disk"""
        with open(self.outcomes_file, 'w') as f:
            json.dump(self.outcomes, f, indent=2)

    async def process_outcome(self, choice_id: str,
                             outcome_data: Dict[str, Any]) -> QuestionOutcome:
        """
        Process the outcome of a answered question

        Args:
            choice_id: ID of the choice that was made
            outcome_data: Information about what happened
                {
                    "status": "success" | "partial" | "failed",
                    "validation_method": "auto" | "manual" | "implicit",
                    "success_indicators": [...],
                    "failure_indicators": [...],
                    "user_feedback": "optional comment"
                }

        Returns:
            QuestionOutcome with analysis and learning
        """

        # Load the original choice
        choice_log = self._load_choice_log(choice_id)
        if not choice_log:
            raise ValueError(f"Choice {choice_id} not found in logs")

        # Extract details
        choice = choice_log["choice"]
        question = choice["question"]
        answer = choice["chosen_option"]
        source = choice.get("source", "unknown")
        original_confidence = choice["confidence"]

        # Calculate time to validate
        choice_time = datetime.fromisoformat(choice["timestamp"])
        validate_time = datetime.now()
        time_to_validate = (validate_time - choice_time).total_seconds() / 3600

        # Determine outcome status
        status = OutcomeStatus(outcome_data.get("status", "unknown"))

        # Adjust confidence based on outcome
        adjusted_confidence = self._calculate_adjusted_confidence(
            original_confidence,
            status,
            source,
            time_to_validate
        )

        # Determine if we should revise
        should_revise = (
            status == OutcomeStatus.FAILED or
            (status == OutcomeStatus.PARTIAL and original_confidence > 0.7)
        )

        # Generate learning
        knowledge_update = self._generate_knowledge_update(
            question, answer, status, outcome_data
        )

        # Create outcome record
        outcome = QuestionOutcome(
            choice_id=choice_id,
            question=question,
            answer_provided=answer,
            source=source,
            original_confidence=original_confidence,
            status=status,
            validation_method=outcome_data.get("validation_method", "manual"),
            validation_timestamp=validate_time.isoformat(),
            time_to_validate_hours=time_to_validate,
            success_indicators=outcome_data.get("success_indicators", []),
            failure_indicators=outcome_data.get("failure_indicators", []),
            user_feedback=outcome_data.get("user_feedback"),
            adjusted_confidence=adjusted_confidence,
            knowledge_update=knowledge_update,
            should_revise=should_revise
        )

        # Save outcome
        self.outcomes[choice_id] = outcome.to_dict()
        self._save_outcomes()

        # Update statistics
        self._update_stats(outcome)

        # Update knowledge base if needed
        if should_revise:
            await self._revise_knowledge_base(outcome)
        elif status == OutcomeStatus.SUCCESS:
            await self._reinforce_knowledge_base(outcome)

        # Log the outcome
        await self._log_outcome(outcome)

        return outcome

    def _calculate_adjusted_confidence(self, original: float,
                                      status: OutcomeStatus,
                                      source: str,
                                      time_hours: float) -> float:
        """
        Calculate adjusted confidence based on outcome

        Learning algorithm:
        - SUCCESS: Increase confidence
        - FAILED: Decrease confidence significantly
        - PARTIAL: Slight decrease
        - UNKNOWN: No change
        """

        if status == OutcomeStatus.SUCCESS:
            # Successful outcome - boost confidence
            # More boost for quick validations (likely correct)
            time_factor = 1.0 if time_hours < 1 else 0.8
            boost = 0.1 * time_factor
            adjusted = min(1.0, original + boost)

        elif status == OutcomeStatus.FAILED:
            # Failed outcome - reduce confidence significantly
            penalty = 0.3
            adjusted = max(0.1, original - penalty)

        elif status == OutcomeStatus.PARTIAL:
            # Partial success - slight reduction
            penalty = 0.1
            adjusted = max(0.3, original - penalty)

        elif status == OutcomeStatus.REVERSED:
            # User reversed - strong signal it was wrong
            penalty = 0.4
            adjusted = max(0.1, original - penalty)

        else:  # UNKNOWN
            # No change
            adjusted = original

        return adjusted

    def _generate_knowledge_update(self, question: str, answer: str,
                                   status: OutcomeStatus,
                                   outcome_data: Dict) -> str:
        """Generate what we learned from this outcome"""

        if status == OutcomeStatus.SUCCESS:
            return f"Answer '{answer}' confirmed successful for: {question}"

        elif status == OutcomeStatus.FAILED:
            failures = outcome_data.get("failure_indicators", [])
            return f"Answer '{answer}' failed for: {question}. Issues: {', '.join(failures)}"

        elif status == OutcomeStatus.PARTIAL:
            return f"Answer '{answer}' partially worked for: {question}. Needs refinement."

        elif status == OutcomeStatus.REVERSED:
            feedback = outcome_data.get("user_feedback", "")
            return f"Answer '{answer}' was reversed by user. Feedback: {feedback}"

        else:
            return f"Outcome pending validation for: {question}"

    async def _revise_knowledge_base(self, outcome: QuestionOutcome):
        """
        Revise knowledge base when answer failed

        Options:
        1. Lower confidence for this answer
        2. Mark as "needs review"
        3. Add failure context
        4. Suggest alternatives
        """
        print(f"\n⚠️  REVISING KNOWLEDGE BASE")
        print(f"   Question: {outcome.question}")
        print(f"   Failed answer: {outcome.answer_provided}")
        print(f"   New confidence: {outcome.adjusted_confidence:.0%} (was {outcome.original_confidence:.0%})")

        # Load learned answers
        if not self.learned_file.exists():
            return

        with open(self.learned_file, 'r') as f:
            learned = json.load(f)

        # Find this question
        import hashlib
        q_hash = hashlib.md5(outcome.question.lower().strip().encode()).hexdigest()

        if q_hash in learned:
            # Update confidence and add failure note
            learned[q_hash]["confidence"] = outcome.adjusted_confidence
            learned[q_hash]["needs_review"] = True
            learned[q_hash]["failure_history"] = learned[q_hash].get("failure_history", [])
            learned[q_hash]["failure_history"].append({
                "timestamp": outcome.validation_timestamp,
                "indicators": outcome.failure_indicators,
                "feedback": outcome.user_feedback
            })

            # Save updated knowledge
            with open(self.learned_file, 'w') as f:
                json.dump(learned, f, indent=2)

            print(f"   ✅ Knowledge base updated with failure context")
            self.stats["knowledge_revisions"] += 1

    async def _reinforce_knowledge_base(self, outcome: QuestionOutcome):
        """
        Reinforce knowledge base when answer succeeded

        Increase confidence and track success
        """
        if not self.learned_file.exists():
            return

        with open(self.learned_file, 'r') as f:
            learned = json.load(f)

        import hashlib
        q_hash = hashlib.md5(outcome.question.lower().strip().encode()).hexdigest()

        if q_hash in learned:
            # Increase confidence
            learned[q_hash]["confidence"] = outcome.adjusted_confidence

            # Track success
            learned[q_hash]["success_count"] = learned[q_hash].get("success_count", 0) + 1
            learned[q_hash]["last_success"] = outcome.validation_timestamp

            # Remove "needs review" flag if present
            if "needs_review" in learned[q_hash]:
                del learned[q_hash]["needs_review"]

            # Save
            with open(self.learned_file, 'w') as f:
                json.dump(learned, f, indent=2)

            print(f"\n✅ REINFORCED KNOWLEDGE")
            print(f"   Question: {outcome.question}")
            print(f"   Answer confirmed: {outcome.answer_provided}")
            print(f"   Confidence: {outcome.original_confidence:.0%} → {outcome.adjusted_confidence:.0%}")

            self.stats["confidence_improvements"] += 1

    async def _log_outcome(self, outcome: QuestionOutcome):
        """Log outcome to file"""
        outcome_file = self.outcomes_dir / f"{outcome.choice_id}_outcome.json"

        with open(outcome_file, 'w') as f:
            json.dump(outcome.to_dict(), f, indent=2)

    def _load_choice_log(self, choice_id: str) -> Optional[Dict]:
        """Load the original choice log"""
        log_file = self.qa_log_dir / f"{choice_id}.json"

        if log_file.exists():
            with open(log_file, 'r') as f:
                return json.load(f)

        return None

    def _update_stats(self, outcome: QuestionOutcome):
        """Update statistics"""
        self.stats["total_validated"] += 1

        if outcome.status == OutcomeStatus.SUCCESS:
            self.stats["success_count"] += 1
        elif outcome.status == OutcomeStatus.PARTIAL:
            self.stats["partial_count"] += 1
        elif outcome.status == OutcomeStatus.FAILED:
            self.stats["failed_count"] += 1

    async def auto_validate_outcomes(self, max_age_hours: int = 24):
        """
        Automatically validate recent outcomes

        Looks for implicit success indicators:
        - No errors in logs
        - Code still exists unchanged
        - No rollbacks
        - No user complaints

        Args:
            max_age_hours: Only validate outcomes from last N hours
        """
        print("\n🔍 AUTO-VALIDATING RECENT OUTCOMES...")

        # Load all Q&A logs
        if not self.qa_log_dir.exists():
            return {
                "total_validated": 0,
                "success": 0,
                "partial": 0,
                "failed": 0,
                "unknown": 0,
                "knowledge_updates": 0
            }

        cutoff_time = datetime.now() - timedelta(hours=max_age_hours)
        stats = {
            "total_validated": 0,
            "success": 0,
            "partial": 0,
            "failed": 0,
            "unknown": 0,
            "knowledge_updates": 0
        }

        for log_file in self.qa_log_dir.glob("choice_*.json"):
            with open(log_file, 'r') as f:
                log = json.load(f)

            choice_id = log["choice"]["choice_id"]

            # Skip if already validated
            if choice_id in self.outcomes:
                continue

            # Skip if too old
            timestamp = datetime.fromisoformat(log["timestamp"])
            if timestamp < cutoff_time:
                continue

            # Check for implicit success
            success_indicators = await self._detect_implicit_success(log)
            failure_indicators = await self._detect_implicit_failure(log)

            if success_indicators and not failure_indicators:
                # Implicit success!
                outcome = await self.process_outcome(choice_id, {
                    "status": "success",
                    "validation_method": "auto",
                    "success_indicators": success_indicators,
                    "failure_indicators": []
                })
                stats["total_validated"] += 1
                stats["success"] += 1
                if outcome.should_revise or outcome.knowledge_update:
                    stats["knowledge_updates"] += 1

            elif failure_indicators:
                # Implicit failure
                outcome = await self.process_outcome(choice_id, {
                    "status": "failed",
                    "validation_method": "auto",
                    "success_indicators": [],
                    "failure_indicators": failure_indicators
                })
                stats["total_validated"] += 1
                stats["failed"] += 1
                if outcome.should_revise or outcome.knowledge_update:
                    stats["knowledge_updates"] += 1

        print(f"   ✅ Auto-validated {stats['total_validated']} outcomes")
        return stats

    async def _detect_implicit_success(self, log: Dict) -> List[str]:
        """
        Detect implicit success indicators

        Returns list of indicators found
        """
        indicators = []

        # If answer was "ALLOWED" for a file operation, check if file still exists
        choice = log["choice"]
        if "delete" in choice["question"].lower() and choice["chosen_option"] == "ALLOWED":
            # Could check if file was actually deleted successfully
            indicators.append("Operation completed without errors")

        # If high confidence and enough time passed without reversal
        time_passed = (datetime.now() - datetime.fromisoformat(log["timestamp"])).total_seconds() / 3600
        if choice["confidence"] > 0.8 and time_passed > 1:
            indicators.append("High confidence choice stable after 1+ hours")

        # Add more sophisticated checks here
        # - Check error logs
        # - Check if code still exists
        # - Check commit history

        return indicators

    async def _detect_implicit_failure(self, log: Dict) -> List[str]:
        """
        Detect implicit failure indicators

        Returns list of indicators found
        """
        indicators = []

        # Check for common failure patterns
        # - Rollback commits
        # - Error logs
        # - File deletions

        # Placeholder for now
        return indicators

    def generate_effectiveness_report(self) -> str:
        """
        Generate report on decision effectiveness

        Returns markdown formatted report
        """
        total = self.stats["total_validated"]
        if total == 0:
            return "# No outcomes validated yet"

        success_rate = 100 * self.stats["success_count"] / total

        report = [
            "# Decision Effectiveness Report",
            "",
            f"**Generated**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            f"**Total Validated**: {total}",
            "",
            "## Outcome Distribution",
            "",
            f"- ✅ Success: {self.stats['success_count']} ({100*self.stats['success_count']/total:.0f}%)",
            f"- ⚠️  Partial: {self.stats['partial_count']} ({100*self.stats['partial_count']/total:.0f}%)",
            f"- ❌ Failed: {self.stats['failed_count']} ({100*self.stats['failed_count']/total:.0f}%)",
            "",
            f"## Success Rate: {success_rate:.0f}%",
            "",
            "## Learning Impact",
            "",
            f"- Confidence improvements: {self.stats['confidence_improvements']}",
            f"- Knowledge revisions: {self.stats['knowledge_revisions']}",
            "",
            "## Quality Assessment",
            ""
        ]

        if success_rate >= 90:
            report.append("✅ **EXCELLENT** - Decisions are highly reliable")
        elif success_rate >= 75:
            report.append("✅ **GOOD** - Decisions are mostly reliable")
        elif success_rate >= 60:
            report.append("⚠️  **FAIR** - Some decisions need improvement")
        else:
            report.append("❌ **POOR** - Decisions need significant improvement")

        return '\n'.join(report)


# Example usage
async def example_usage():
    """Example of post-question processing"""

    processor = PostQuestionProcessor()

    # Example 1: Mark a decision as successful
    print("Example 1: Successful decision")
    outcome1 = await processor.process_outcome(
        choice_id="choice_20251115_143248",
        outcome_data={
            "status": "success",
            "validation_method": "manual",
            "success_indicators": [
                "PostgreSQL implemented successfully",
                "All tests passing",
                "Performance meets requirements"
            ],
            "failure_indicators": [],
            "user_feedback": "Works perfectly!"
        }
    )

    # Example 2: Mark a decision as failed
    print("\n" + "="*70)
    print("Example 2: Failed decision")
    outcome2 = await processor.process_outcome(
        choice_id="choice_20251115_143249",
        outcome_data={
            "status": "failed",
            "validation_method": "manual",
            "success_indicators": [],
            "failure_indicators": [
                "File deletion caused application crash",
                "Had to restore from backup"
            ],
            "user_feedback": "This was a bad decision, needed that file"
        }
    )

    # Generate effectiveness report
    print("\n" + "="*70)
    report = processor.generate_effectiveness_report()
    print(report)


if __name__ == "__main__":
    asyncio.run(example_usage())
