"""
Question Classifier - Phase 3.1

Classifies questions to determine appropriate handling:
- HUMAN_DECISION: Strategic questions requiring human choice
- AGENT_ANSWERABLE: Factual questions with objective answers
- HYBRID: Questions needing research + human decision
- CLARIFICATION_NEEDED: Ambiguous questions requiring more context
"""

import re
from enum import Enum
from typing import Optional, Dict, List
from dataclasses import dataclass


class QuestionType(Enum):
    """Types of questions the system can handle"""
    HUMAN_DECISION = "human_decision"           # Human must decide
    AGENT_ANSWERABLE = "agent_answerable"       # Agent can answer
    HYBRID = "hybrid"                           # Research + decision
    CLARIFICATION_NEEDED = "clarification"      # Need more info


@dataclass
class ClassificationResult:
    """Result of question classification"""
    question_type: QuestionType
    confidence: float                           # 0.0 to 1.0
    matched_patterns: List[str]                 # Which patterns matched
    reasoning: str                              # Why this classification

    def to_dict(self) -> dict:
        return {
            "question_type": self.question_type.value,
            "confidence": self.confidence,
            "matched_patterns": self.matched_patterns,
            "reasoning": self.reasoning
        }


class QuestionClassifier:
    """
    Classifies questions to determine appropriate handling

    Uses pattern matching to identify:
    - Decision questions (should/which/best)
    - Factual questions (can I/is it/does this)
    - Hybrid questions (what are options/help me decide)
    """

    def __init__(self):
        # Decision question patterns
        self.decision_patterns = {
            "explicit_choice": [
                r"\bshould\s+(we|i)\s+(use|choose|pick|go\s+with|adopt|select)\b",
                r"\bwhich\s+(is|should|would|do\s+you)\s+(better|best|recommend|prefer)\b",
                r"\bwhat('s| is)\s+(best|recommended|preferred|better)\b",
                r"\b(better|worse)\s+to\s+(use|choose|go\s+with)\b",
            ],
            "comparison": [
                r"\b(mongodb|postgres|postgresql|mysql|react|vue|angular|django|flask)\s+(or|vs|versus)\s+(mongodb|postgres|postgresql|mysql|react|vue|angular|django|flask)\b",
                r"\bcompare\s+.*\s+(and|vs|versus|or|with)\b",
                r"\b(pros\s+and\s+cons|advantages\s+and\s+disadvantages)\s+of\b",
            ],
            "strategy_policy": [
                r"\bwhat\s+(should|will|would)\s+(our|my|the)\s+(strategy|approach|policy|plan)\b",
                r"\bhow\s+(should|do|shall)\s+(we|i)\s+(handle|manage|organize|structure|implement)\b",
                r"\bwhat('s| is)\s+(our|my|the)\s+(strategy|approach|policy)\b",
            ],
            "preference": [
                r"\bhow\s+(should|do)\s+(we|i)\s+(name|format|organize|structure)\b",
                r"\bwhat\s+(naming|coding|formatting)\s+(convention|standard|style)\b",
            ],
        }

        # Factual question patterns
        self.factual_patterns = {
            "permission_safety": [
                r"\bcan\s+i\s+(delete|modify|remove|access|edit|change|update)\b",
                r"\bis\s+it\s+safe\s+to\b",
                r"\bis\s+(this|that)\s+allowed\b",
                r"\bmay\s+i\s+(delete|modify|remove|access)\b",
            ],
            "technical_fact": [
                r"\bwhat\s+(is|does|are)\s+the\s+(complexity|performance|time|speed|cost|impact)\b",
                r"\bwhat('s| is)\s+the\s+(performance|memory|cpu|time)\s+(impact|cost|overhead)\b",
                r"\bhow\s+(fast|slow|efficient|expensive)\s+is\b",
                r"\bwhat\s+(does|is)\s+this\s+(do|mean|return)\b",
            ],
            "code_quality": [
                r"\bdoes\s+this\s+(follow|violate|meet|satisfy)\b",
                r"\bis\s+this\s+(code|function|method)\s+(correct|valid|safe|good)\b",
                r"\b(are|is)\s+there\s+(any\s+)?(issues|problems|bugs|errors)\b",
            ],
            "test_coverage": [
                r"\b(are|is)\s+there\s+(any\s+)?(tests|coverage)\b",
                r"\b(what|which)\s+tests\s+(exist|are\s+missing|should\s+i\s+write)\b",
                r"\bhow\s+(much|good)\s+is\s+the\s+test\s+coverage\b",
            ],
        }

        # Hybrid question patterns
        self.hybrid_patterns = {
            "options_exploration": [
                r"\bwhat\s+are\s+(my|the|our)\s+options\b",
                r"\bwhat\s+(could|can|should)\s+i\s+(consider|explore|look\s+at)\b",
                r"\bwhat\s+are\s+the\s+(alternatives|possibilities|choices)\b",
            ],
            "decision_help": [
                r"\bhelp\s+me\s+(decide|choose|pick|select)\b",
                r"\bi\s+need\s+help\s+(deciding|choosing)\b",
                r"\bnot\s+sure\s+(which|what)\s+to\s+(choose|use|pick)\b",
            ],
            "pros_cons": [
                r"\bpros\s+and\s+cons\s+of\b",
                r"\badvantages\s+and\s+disadvantages\b",
                r"\btradeoffs?\s+(of|between)\b",
            ],
        }

    def classify(self, question: str, context: Optional[Dict] = None) -> ClassificationResult:
        """
        Classify a question into one of the QuestionType categories

        Args:
            question: The question text to classify
            context: Optional context information

        Returns:
            ClassificationResult with type, confidence, and reasoning
        """
        question_lower = question.lower().strip()

        # Check for hybrid patterns first (most specific)
        hybrid_result = self._check_hybrid(question_lower)
        if hybrid_result:
            return hybrid_result

        # Check for decision patterns
        decision_result = self._check_decision(question_lower)
        if decision_result:
            return decision_result

        # Check for factual patterns
        factual_result = self._check_factual(question_lower)
        if factual_result:
            return factual_result

        # If nothing matched clearly, use heuristics to infer type
        # Check for question words that suggest factual vs decision
        factual_words = ["is", "are", "does", "do", "can", "will", "has", "have"]
        decision_words = ["should", "which", "what's best", "better", "recommend"]

        question_start = question_lower.split()[:3]  # First 3 words

        # If starts with factual indicators, assume agent answerable
        if any(word in question_start for word in factual_words):
            return ClassificationResult(
                question_type=QuestionType.AGENT_ANSWERABLE,
                confidence=0.6,
                matched_patterns=[],
                reasoning="Question appears factual based on structure (starts with is/are/can/does)"
            )

        # If very short (< 4 words), might need clarification
        if len(question_lower.split()) < 4:
            return ClassificationResult(
                question_type=QuestionType.CLARIFICATION_NEEDED,
                confidence=0.6,
                matched_patterns=[],
                reasoning="Question is too short to classify confidently"
            )

        # Default to human decision if uncertain (conservative approach)
        return ClassificationResult(
            question_type=QuestionType.HUMAN_DECISION,
            confidence=0.5,
            matched_patterns=[],
            reasoning="No clear pattern match; defaulting to human decision for safety"
        )

    def _check_hybrid(self, question: str) -> Optional[ClassificationResult]:
        """Check if question is hybrid (research + decision)"""
        matched = []

        for category, patterns in self.hybrid_patterns.items():
            for pattern in patterns:
                if re.search(pattern, question):
                    matched.append(f"hybrid.{category}")

        if matched:
            confidence = min(0.9, 0.7 + (len(matched) * 0.1))
            return ClassificationResult(
                question_type=QuestionType.HYBRID,
                confidence=confidence,
                matched_patterns=matched,
                reasoning=f"Matched {len(matched)} hybrid pattern(s): needs research + human decision"
            )

        return None

    def _check_decision(self, question: str) -> Optional[ClassificationResult]:
        """Check if question requires human decision"""
        matched = []

        for category, patterns in self.decision_patterns.items():
            for pattern in patterns:
                if re.search(pattern, question):
                    matched.append(f"decision.{category}")

        if matched:
            confidence = min(0.95, 0.75 + (len(matched) * 0.1))
            return ClassificationResult(
                question_type=QuestionType.HUMAN_DECISION,
                confidence=confidence,
                matched_patterns=matched,
                reasoning=f"Matched {len(matched)} decision pattern(s): requires human choice"
            )

        return None

    def _check_factual(self, question: str) -> Optional[ClassificationResult]:
        """Check if question is factual (agent answerable)"""
        matched = []

        for category, patterns in self.factual_patterns.items():
            for pattern in patterns:
                if re.search(pattern, question):
                    matched.append(f"factual.{category}")

        if matched:
            confidence = min(0.95, 0.8 + (len(matched) * 0.1))
            return ClassificationResult(
                question_type=QuestionType.AGENT_ANSWERABLE,
                confidence=confidence,
                matched_patterns=matched,
                reasoning=f"Matched {len(matched)} factual pattern(s): has objective answer"
            )

        return None

    def get_pattern_stats(self) -> dict:
        """Get statistics about available patterns"""
        return {
            "decision_patterns": sum(len(p) for p in self.decision_patterns.values()),
            "factual_patterns": sum(len(p) for p in self.factual_patterns.values()),
            "hybrid_patterns": sum(len(p) for p in self.hybrid_patterns.values()),
            "total_patterns": (
                sum(len(p) for p in self.decision_patterns.values()) +
                sum(len(p) for p in self.factual_patterns.values()) +
                sum(len(p) for p in self.hybrid_patterns.values())
            ),
        }


# Test function
def test_classifier():
    """Test the classifier with sample questions"""
    classifier = QuestionClassifier()

    test_questions = [
        # Decision questions
        ("Should we use MongoDB or PostgreSQL?", QuestionType.HUMAN_DECISION),
        ("Which is better: React or Vue?", QuestionType.HUMAN_DECISION),
        ("What's the best database for our project?", QuestionType.HUMAN_DECISION),

        # Factual questions
        ("Can I delete /tmp/test?", QuestionType.AGENT_ANSWERABLE),
        ("Is it safe to modify user.py?", QuestionType.AGENT_ANSWERABLE),
        ("Are there tests for this function?", QuestionType.AGENT_ANSWERABLE),

        # Hybrid questions
        ("What are my options for file uploads?", QuestionType.HYBRID),
        ("Help me decide between AWS and Azure", QuestionType.HYBRID),
        ("Pros and cons of microservices?", QuestionType.HYBRID),
    ]

    print("=" * 70)
    print("QUESTION CLASSIFIER TEST")
    print("=" * 70)

    correct = 0
    total = len(test_questions)

    for question, expected_type in test_questions:
        result = classifier.classify(question)
        is_correct = result.question_type == expected_type
        correct += 1 if is_correct else 0

        status = "✓" if is_correct else "✗"
        print(f"\n{status} {question}")
        print(f"  Expected: {expected_type.value}")
        print(f"  Got: {result.question_type.value} (confidence: {result.confidence:.2f})")
        print(f"  Reasoning: {result.reasoning}")
        if result.matched_patterns:
            print(f"  Patterns: {', '.join(result.matched_patterns)}")

    print("\n" + "=" * 70)
    print(f"ACCURACY: {correct}/{total} ({100*correct/total:.1f}%)")
    print("=" * 70)

    # Print pattern stats
    stats = classifier.get_pattern_stats()
    print(f"\nPattern Statistics:")
    print(f"  Decision patterns: {stats['decision_patterns']}")
    print(f"  Factual patterns: {stats['factual_patterns']}")
    print(f"  Hybrid patterns: {stats['hybrid_patterns']}")
    print(f"  Total patterns: {stats['total_patterns']}")


if __name__ == "__main__":
    test_classifier()
