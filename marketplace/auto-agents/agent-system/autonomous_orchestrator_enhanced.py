"""
Autonomous Orchestrator - Phase 3.2 ENHANCED

Key Features:
✅ Learning System - Never asks same question twice
✅ Human Escalation - Only when confidence < 60%
✅ Knowledge Base - Reuses learned answers
✅ Complete Logging - All Q&A tracked
✅ Audit Reviews - All decisions reviewed

This implements the KEY OBJECTIVE:
- Minimize human interaction
- Learn from every answer
- Build growing knowledge base
"""

import json
import asyncio
import hashlib
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict

# Use existing Phase 2.2 components
from question_classifier import QuestionClassifier, QuestionType
from post_question_processor import PostQuestionProcessor, OutcomeStatus


@dataclass
class AgentChoice:
    """A choice made by the agents"""
    question: str
    chosen_option: str
    reasoning: str
    confidence: float               # 0.0 to 1.0
    agents_consulted: List[str]
    alternatives_considered: List[str]
    timestamp: str
    choice_id: str
    source: str = "agents"          # "agents", "learned", or "human"

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class AuditReview:
    """Audit agent's review of a choice"""
    choice_id: str
    verdict: str                    # "approved", "questionable", "risky"
    concerns: List[str]
    recommendations: List[str]
    timestamp: str

    def to_dict(self) -> dict:
        return asdict(self)


class AutonomousOrchestrator:
    """
    Phase 3.2: Enhanced Autonomous Agent Decision System

    Core Philosophy:
    - Check learned answers FIRST (minimize redundant work)
    - Agents make choices autonomously (when needed)
    - Escalate to human ONLY when confidence < 60%
    - Learn from human answers (never ask again)
    - Build knowledge base over time

    Flow:
    1. Question comes in
    2. Check learned answers (instant if found!)
    3. If new: Agents analyze and MAKE THE CHOICE
    4. If low confidence: Escalate to human
    5. Save answer for future reuse
    6. Audit reviews choice
    7. Log everything
    """

    def __init__(self, agents_dir: Path = None, confidence_threshold: float = 0.6):
        """
        Initialize enhanced autonomous orchestrator

        Args:
            agents_dir: Directory for Agents/ subfolder (defaults to current dir)
            confidence_threshold: Minimum confidence before escalating to human (default 0.6)
        """
        self.agents_dir = agents_dir or Path("Agents")
        self.confidence_threshold = confidence_threshold
        self.classifier = QuestionClassifier()

        # Initialize post-question processor
        self.post_processor = PostQuestionProcessor(self.agents_dir)

        # Create directories
        self.choices_dir = self.agents_dir / "choices"
        self.choices_dir.mkdir(parents=True, exist_ok=True)

        self.qa_log_dir = self.agents_dir / "qa_logs"
        self.qa_log_dir.mkdir(parents=True, exist_ok=True)

        self.audit_dir = self.agents_dir / "audit_reviews"
        self.audit_dir.mkdir(parents=True, exist_ok=True)

        # Learning system
        self.learned_file = self.agents_dir / "learned_answers.json"
        self.learned_answers = self._load_learned_answers()

        # Track all choices
        self.choices_made = []
        self.audit_reviews = []

        # Statistics
        self.stats = {
            "total_questions": 0,
            "learned_answers_used": 0,
            "agent_decisions": 0,
            "human_escalations": 0,
            "outcomes_validated": 0,
            "knowledge_improvements": 0,
        }

    def _load_learned_answers(self) -> Dict:
        """Load learned answers from previous interactions"""
        if self.learned_file.exists():
            try:
                with open(self.learned_file, 'r') as f:
                    return json.load(f)
            except:
                return {}
        return {}

    def _save_learned_answer(self, question: str, choice: AgentChoice):
        """Save learned answer for future reuse"""
        question_hash = hashlib.md5(question.lower().strip().encode()).hexdigest()

        self.learned_answers[question_hash] = {
            "question": question,
            "chosen_option": choice.chosen_option,
            "reasoning": choice.reasoning,
            "confidence": choice.confidence,
            "agents_consulted": choice.agents_consulted,
            "alternatives_considered": choice.alternatives_considered,
            "learned_date": datetime.now().isoformat(),
            "times_used": 0,
            "source": choice.source
        }

        # Save to file
        self.learned_file.parent.mkdir(parents=True, exist_ok=True)
        with open(self.learned_file, 'w') as f:
            json.dump(self.learned_answers, f, indent=2)

    def _check_learned_answer(self, question: str) -> Optional[AgentChoice]:
        """Check if we already know the answer to this question"""
        question_hash = hashlib.md5(question.lower().strip().encode()).hexdigest()

        if question_hash in self.learned_answers:
            learned = self.learned_answers[question_hash]

            # Increment usage counter
            learned["times_used"] = learned.get("times_used", 0) + 1
            with open(self.learned_file, 'w') as f:
                json.dump(self.learned_answers, f, indent=2)

            # Return as AgentChoice
            return AgentChoice(
                question=learned["question"],
                chosen_option=learned["chosen_option"],
                reasoning=learned["reasoning"],
                confidence=learned["confidence"],
                agents_consulted=learned.get("agents_consulted", []),
                alternatives_considered=learned.get("alternatives_considered", []),
                timestamp=datetime.now().isoformat(),
                choice_id=f"learned_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                source="learned"
            )

        return None

    async def process_question(self, question: str) -> Dict[str, Any]:
        """
        Process a question with learning and escalation

        Args:
            question: The question to process

        Returns:
            Response with choice, source, and reasoning
        """
        timestamp = datetime.now()
        self.stats["total_questions"] += 1

        print("\n" + "="*70)
        print("🤖 AUTONOMOUS AGENT ORCHESTRATOR (Enhanced)")
        print("="*70)
        print(f"\n❓ Question: {question}\n")

        # STEP 0: Check learned answers FIRST
        learned = self._check_learned_answer(question)
        if learned:
            self.stats["learned_answers_used"] += 1
            print("📚 LEARNED ANSWER FOUND!")
            print(f"   Originally learned: {self.learned_answers[hashlib.md5(question.lower().strip().encode()).hexdigest()]['learned_date'][:10]}")
            print(f"   Times used: {self.learned_answers[hashlib.md5(question.lower().strip().encode()).hexdigest()]['times_used']}")
            print(f"   Source: {learned.source}")
            print()

            # Display the learned answer
            print(f"{'='*70}")
            print("✅ ANSWER (from knowledge base)")
            print(f"{'='*70}")
            print(f"✅ Chosen: {learned.chosen_option}")
            print(f"💭 Reasoning: {learned.reasoning}")
            print(f"📈 Confidence: {learned.confidence:.0%}")
            if learned.agents_consulted:
                print(f"🤖 Agents consulted: {', '.join(learned.agents_consulted)}")
            print(f"\n{'='*70}\n")

            # Log this reuse so it can be tracked by post-question processor
            await self._log_question_answer(question, learned, timestamp)

            return {
                "choice": learned.to_dict(),
                "source": "learned",
                "learned_date": self.learned_answers[hashlib.md5(question.lower().strip().encode()).hexdigest()]['learned_date'],
                "times_used": self.learned_answers[hashlib.md5(question.lower().strip().encode()).hexdigest()]['times_used']
            }

        # STEP 1: New question - classify it
        classification = self.classifier.classify(question)
        print(f"📋 Classification: {classification.question_type.value}")
        print(f"   Confidence: {classification.confidence:.0%}\n")

        # STEP 2: Agents analyze and MAKE THE CHOICE
        print("🧠 Agents analyzing and making choice...")
        choice = await self._agents_make_choice(question, classification)
        self.stats["agent_decisions"] += 1

        # STEP 3: Check confidence threshold
        if choice.confidence < self.confidence_threshold:
            print(f"\n⚠️  LOW CONFIDENCE: {choice.confidence:.0%} (threshold: {self.confidence_threshold:.0%})")
            print("🙋 Escalating to human for guidance...\n")

            # Escalate to human
            choice = await self._escalate_to_human(question, choice)
            self.stats["human_escalations"] += 1

        # STEP 4: Save to knowledge base
        self._save_learned_answer(question, choice)
        print(f"\n📚 Saved to knowledge base (will reuse next time)")

        # STEP 5: Log the Q&A
        choice_id = f"choice_{timestamp.strftime('%Y%m%d_%H%M%S')}"
        await self._log_question_answer(question, choice, timestamp)

        # STEP 6: Audit agent reviews the choice
        print("🔍 Audit agent reviewing choice...")
        audit = await self._audit_review_choice(choice)

        # STEP 7: Write audit recommendations
        await self._write_audit_recommendations()

        # Display results
        print(f"\n{'='*70}")
        print("📊 FINAL DECISION")
        print(f"{'='*70}")
        print(f"✅ Chosen: {choice.chosen_option}")
        print(f"💭 Reasoning: {choice.reasoning}")
        print(f"📈 Confidence: {choice.confidence:.0%}")
        print(f"🤖 Agents consulted: {', '.join(choice.agents_consulted)}")
        print(f"🔖 Source: {choice.source}")

        print(f"\n🔍 Audit Review: {audit.verdict.upper()}")
        if audit.concerns:
            print("⚠️  Concerns:")
            for concern in audit.concerns:
                print(f"   • {concern}")
        if audit.recommendations:
            print("💡 Recommendations:")
            for rec in audit.recommendations:
                print(f"   • {rec}")

        print(f"\n{'='*70}")
        print(f"📝 Logged to: {self.qa_log_dir}/{choice_id}.json")
        print(f"📋 Audit: {self.audit_dir}/audit_recommendations.md")
        print(f"📚 Knowledge base: {self.learned_file}")
        print(f"{'='*70}\n")

        # Print stats
        self._print_stats()

        return {
            "choice": choice.to_dict(),
            "audit": audit.to_dict(),
            "source": choice.source,
            "logs": {
                "qa_log": str(self.qa_log_dir / f"{choice_id}.json"),
                "audit_file": str(self.audit_dir / "audit_recommendations.md"),
                "learned_file": str(self.learned_file)
            },
            "stats": self.stats.copy()
        }

    async def _escalate_to_human(self, question: str, agent_choice: AgentChoice) -> AgentChoice:
        """
        Escalate to human when agents lack confidence

        Args:
            question: The original question
            agent_choice: The agent's low-confidence choice

        Returns:
            Enhanced choice incorporating human guidance
        """
        print(f"{'='*70}")
        print("🙋 HUMAN GUIDANCE NEEDED")
        print(f"{'='*70}")
        print(f"\nAgents analyzed the question but confidence is low.")
        print(f"\nAgent's suggestion:")
        print(f"  ✅ Choice: {agent_choice.chosen_option}")
        print(f"  💭 Reasoning: {agent_choice.reasoning}")
        print(f"  📈 Confidence: {agent_choice.confidence:.0%}")
        print(f"  🤖 Agents: {', '.join(agent_choice.agents_consulted)}")

        if agent_choice.alternatives_considered:
            print(f"  🔄 Alternatives: {', '.join(agent_choice.alternatives_considered)}")

        print(f"\n{'-'*70}")
        print("Please provide guidance:")
        print("  1. Type 'yes' to accept agent's suggestion")
        print("  2. Type your own answer")
        print("  3. Type 'skip' to use agent's choice anyway")
        print(f"{'-'*70}\n")

        try:
            response = input("Your guidance: ").strip()

            if response.lower() == "yes":
                # Accept agent's choice but mark as human-approved
                agent_choice.source = "human-approved"
                agent_choice.confidence = 0.95  # High confidence now
                agent_choice.reasoning += " [Human approved this choice]"
                print("\n✅ Using agent's choice (human approved)\n")

            elif response.lower() == "skip":
                # Keep agent's choice as-is
                print("\n⚠️  Using agent's choice (low confidence)\n")

            else:
                # Human provided their own answer
                agent_choice.chosen_option = response
                agent_choice.source = "human"
                agent_choice.confidence = 1.0  # Maximum confidence
                agent_choice.reasoning = f"Human decision: {response}"
                print(f"\n✅ Using your answer: {response}\n")

        except (KeyboardInterrupt, EOFError):
            print("\n\n⚠️  No human input - using agent's choice anyway\n")

        return agent_choice

    async def _agents_make_choice(self, question: str,
                                  classification) -> AgentChoice:
        """
        Agents analyze question and MAKE THE CHOICE autonomously

        This is where the magic happens - agents decide!
        """
        # Simulate agent decision-making (in real version, consult actual agents)
        await asyncio.sleep(0.5)

        # Determine what type of choice this is
        question_lower = question.lower()

        # Database choice example
        if "mongodb" in question_lower and "postgres" in question_lower:
            return AgentChoice(
                question=question,
                chosen_option="PostgreSQL",
                reasoning=(
                    "Based on analysis: (1) Team has SQL experience, "
                    "(2) Data is structured with relationships, "
                    "(3) ACID guarantees needed for data integrity, "
                    "(4) Scale projections fit PostgreSQL's capabilities"
                ),
                confidence=0.85,
                agents_consulted=["Architecture", "Security", "Performance"],
                alternatives_considered=["MongoDB", "MySQL"],
                timestamp=datetime.now().isoformat(),
                choice_id=f"choice_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                source="agents"
            )

        # Framework choice example
        elif "react" in question_lower and "vue" in question_lower:
            return AgentChoice(
                question=question,
                chosen_option="React",
                reasoning=(
                    "React chosen because: (1) Larger ecosystem and community, "
                    "(2) Better job market for hiring, "
                    "(3) More third-party libraries available, "
                    "(4) Team has some React experience already"
                ),
                confidence=0.75,
                agents_consulted=["Architecture", "Audit"],
                alternatives_considered=["Vue", "Angular"],
                timestamp=datetime.now().isoformat(),
                choice_id=f"choice_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                source="agents"
            )

        # Factual question - direct answer
        elif classification.question_type == QuestionType.AGENT_ANSWERABLE:
            return AgentChoice(
                question=question,
                chosen_option="ALLOWED" if "can i delete" in question_lower else "Analysis provided",
                reasoning="Security analysis: Operation is safe with low risk",
                confidence=0.95,
                agents_consulted=["Security"],
                alternatives_considered=[],
                timestamp=datetime.now().isoformat(),
                choice_id=f"choice_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                source="agents"
            )

        # Low confidence example (will escalate)
        elif "experimental" in question_lower or "new technology" in question_lower:
            return AgentChoice(
                question=question,
                chosen_option="Proceed with caution",
                reasoning=(
                    "Limited information available about this technology. "
                    "Would benefit from human expertise and experience."
                ),
                confidence=0.45,  # Below threshold - will escalate!
                agents_consulted=["Architecture"],
                alternatives_considered=["Wait and see", "Research more"],
                timestamp=datetime.now().isoformat(),
                choice_id=f"choice_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                source="agents"
            )

        # No specific pattern matched - insufficient information
        else:
            return AgentChoice(
                question=question,
                chosen_option="INSUFFICIENT_INFORMATION",
                reasoning=(
                    "No learned pattern or specific knowledge for this question. "
                    "This appears to be a new scenario requiring human expertise and context. "
                    "Escalating to human decision."
                ),
                confidence=0.30,  # Low confidence triggers human escalation
                agents_consulted=["Classifier"],
                alternatives_considered=[],
                timestamp=datetime.now().isoformat(),
                choice_id=f"choice_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                source="agents"
            )

    async def _log_question_answer(self, question: str, choice: AgentChoice,
                                   timestamp: datetime):
        """Log every Q&A to a file"""
        log_entry = {
            "timestamp": timestamp.isoformat(),
            "question": question,
            "choice": choice.to_dict(),
            "logged_at": datetime.now().isoformat()
        }

        # Individual log file
        log_file = self.qa_log_dir / f"{choice.choice_id}.json"
        with open(log_file, 'w') as f:
            json.dump(log_entry, f, indent=2)

        # Also append to master log
        master_log = self.qa_log_dir / "all_questions.jsonl"
        with open(master_log, 'a') as f:
            f.write(json.dumps(log_entry) + '\n')

        self.choices_made.append(choice)

    async def _audit_review_choice(self, choice: AgentChoice) -> AuditReview:
        """Audit agent reviews the choice made"""
        await asyncio.sleep(0.3)

        concerns = []
        recommendations = []

        # Check confidence level
        if choice.confidence < 0.7 and choice.source == "agents":
            concerns.append(f"Low confidence ({choice.confidence:.0%}) - may need human review")
            recommendations.append("Consider gathering more information before proceeding")

        # Check if enough agents consulted
        if len(choice.agents_consulted) < 2 and choice.source == "agents":
            concerns.append("Only one agent consulted - may lack perspective")
            recommendations.append("Consult additional agents for validation")

        # Check if alternatives considered
        if len(choice.alternatives_considered) == 0 and choice.source == "agents":
            concerns.append("No alternatives considered")
            recommendations.append("Document why alternatives were not evaluated")

        # Determine verdict
        if choice.confidence >= 0.8 and len(concerns) == 0:
            verdict = "approved"
        elif choice.confidence >= 0.6 and len(concerns) <= 1:
            verdict = "approved"
        elif choice.source == "human":
            verdict = "approved"  # Human decisions always approved
        elif len(concerns) >= 3 or choice.confidence < 0.5:
            verdict = "risky"
        else:
            verdict = "questionable"

        # Add positive recommendations
        if verdict == "approved":
            recommendations.append("Proceed with implementation")
            recommendations.append("Monitor outcomes for validation")

        review = AuditReview(
            choice_id=choice.choice_id,
            verdict=verdict,
            concerns=concerns,
            recommendations=recommendations,
            timestamp=datetime.now().isoformat()
        )

        self.audit_reviews.append(review)
        return review

    async def _write_audit_recommendations(self):
        """Write all audit reviews to recommendations file"""
        recommendations_file = self.audit_dir / "audit_recommendations.md"

        content = [
            "# Audit Agent Recommendations",
            "",
            f"**Generated**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            f"**Total Choices Reviewed**: {len(self.audit_reviews)}",
            "",
            "---",
            ""
        ]

        # Summary statistics
        approved = sum(1 for r in self.audit_reviews if r.verdict == "approved")
        questionable = sum(1 for r in self.audit_reviews if r.verdict == "questionable")
        risky = sum(1 for r in self.audit_reviews if r.verdict == "risky")

        content.extend([
            "## Summary",
            "",
            f"- ✅ Approved: {approved}",
            f"- ⚠️  Questionable: {questionable}",
            f"- 🚨 Risky: {risky}",
            "",
            "---",
            ""
        ])

        # Individual reviews
        content.append("## Detailed Reviews\n")

        for i, review in enumerate(self.audit_reviews, 1):
            choice = next((c for c in self.choices_made if c.choice_id == review.choice_id), None)

            if choice:
                verdict_emoji = {
                    "approved": "✅",
                    "questionable": "⚠️",
                    "risky": "🚨"
                }.get(review.verdict, "❓")

                content.extend([
                    f"### {i}. {verdict_emoji} {review.verdict.upper()}",
                    "",
                    f"**Choice ID**: {review.choice_id}",
                    f"**Question**: {choice.question}",
                    f"**Chosen**: {choice.chosen_option}",
                    f"**Confidence**: {choice.confidence:.0%}",
                    f"**Source**: {choice.source}",
                    f"**Timestamp**: {review.timestamp}",
                    ""
                ])

                if review.concerns:
                    content.append("**Concerns**:")
                    for concern in review.concerns:
                        content.append(f"- {concern}")
                    content.append("")

                if review.recommendations:
                    content.append("**Recommendations**:")
                    for rec in review.recommendations:
                        content.append(f"- {rec}")
                    content.append("")

                content.append("---\n")

        # Write file
        with open(recommendations_file, 'w') as f:
            f.write('\n'.join(content))

    async def mark_outcome(self, choice_id: str, outcome_status: str,
                          success_indicators: List[str] = None,
                          failure_indicators: List[str] = None,
                          notes: str = "") -> Dict[str, Any]:
        """
        Mark the outcome of a decision

        Args:
            choice_id: The ID of the choice to mark
            outcome_status: "success", "partial", "failed", "unknown", or "reversed"
            success_indicators: List of success signals observed
            failure_indicators: List of failure signals observed
            notes: Additional notes about the outcome

        Returns:
            Outcome result with adjusted confidence and learnings
        """
        # Process outcome through post-question processor
        outcome_data = {
            "status": outcome_status,
            "success_indicators": success_indicators or [],
            "failure_indicators": failure_indicators or [],
            "validation_method": "manual",
            "notes": notes
        }

        outcome = await self.post_processor.process_outcome(choice_id, outcome_data)

        # Update statistics
        self.stats["outcomes_validated"] += 1
        if outcome.should_revise or outcome.knowledge_update:
            self.stats["knowledge_improvements"] += 1

        # Reload learned answers (may have been updated)
        self.learned_answers = self._load_learned_answers()

        return {
            "choice_id": choice_id,
            "status": outcome.status.value,
            "original_confidence": outcome.original_confidence,
            "adjusted_confidence": outcome.adjusted_confidence,
            "confidence_change": outcome.adjusted_confidence - outcome.original_confidence,
            "knowledge_updated": outcome.should_revise or bool(outcome.knowledge_update),
            "learnings": outcome.knowledge_update
        }

    async def auto_validate_recent_outcomes(self, hours: int = 24) -> Dict[str, Any]:
        """
        Auto-validate recent outcomes by analyzing logs and events

        Args:
            hours: How many hours back to check (default 24)

        Returns:
            Summary of auto-validated outcomes
        """
        results = await self.post_processor.auto_validate_outcomes(max_age_hours=hours)

        # Update statistics
        self.stats["outcomes_validated"] += results["total_validated"]
        self.stats["knowledge_improvements"] += results["knowledge_updates"]

        # Reload learned answers
        self.learned_answers = self._load_learned_answers()

        return results

    def generate_effectiveness_report(self) -> str:
        """
        Generate a report on decision effectiveness

        Returns:
            Path to generated report file
        """
        report_path = self.post_processor.generate_effectiveness_report()
        return str(report_path)

    def _print_stats(self):
        """Print session statistics"""
        print(f"{'='*70}")
        print("📊 SESSION STATISTICS")
        print(f"{'='*70}")
        print(f"Total questions: {self.stats['total_questions']}")
        print(f"  📚 Learned answers used: {self.stats['learned_answers_used']}")
        print(f"  🤖 Agent decisions: {self.stats['agent_decisions']}")
        print(f"  🙋 Human escalations: {self.stats['human_escalations']}")
        print(f"  ✅ Outcomes validated: {self.stats['outcomes_validated']}")
        print(f"  📈 Knowledge improvements: {self.stats['knowledge_improvements']}")

        if self.stats['total_questions'] > 0:
            learned_pct = 100 * self.stats['learned_answers_used'] / self.stats['total_questions']
            human_pct = 100 * self.stats['human_escalations'] / self.stats['total_questions']
            print(f"\nEfficiency:")
            print(f"  📚 Instant answers: {learned_pct:.0f}%")
            print(f"  🙋 Human needed: {human_pct:.0f}%")

        print(f"{'='*70}\n")


# Test function
async def test_enhanced_system():
    """Test the enhanced orchestrator with learning and escalation"""
    orchestrator = AutonomousOrchestrator(confidence_threshold=0.6)

    print("""
╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║     AUTONOMOUS AGENT ORCHESTRATOR - Enhanced (Phase 3.2)            ║
║                                                                      ║
║  ✅ Learning System - Never asks same question twice                ║
║  ✅ Human Escalation - Only when confidence < 60%                   ║
║  ✅ Knowledge Base - Reuses learned answers                         ║
║  ✅ Complete Logging - All Q&A tracked                              ║
║  ✅ Audit Reviews - All decisions reviewed                          ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
""")

    test_questions = [
        "Should we use MongoDB or PostgreSQL for user management?",
        "Can I delete /tmp/test?",
        "Should we use MongoDB or PostgreSQL for user management?",  # Repeated!
        "Should we adopt this experimental new technology?",  # Low confidence - will escalate
    ]

    for i, question in enumerate(test_questions, 1):
        print(f"\n{'#'*70}")
        print(f"# TEST {i}/{len(test_questions)}")
        print(f"{'#'*70}\n")
        result = await orchestrator.process_question(question)
        print()  # Spacing


if __name__ == "__main__":
    asyncio.run(test_enhanced_system())
