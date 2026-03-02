"""
Long-term memory service for MindStash AI agent.

Extracts durable facts/preferences from conversations and injects
them into the system prompt on session start.
"""
import json
import logging
import re
import string
from anthropic import Anthropic
from sqlalchemy.orm import Session
from uuid import UUID

from app.core.config import settings
from app.models.chat import UserMemory

logger = logging.getLogger(__name__)

MEMORY_MODEL = "claude-haiku-4-5-20251001"
MAX_MEMORIES_PER_USER = 50

VALID_MEMORY_TYPES = {"preference", "pattern", "fact", "instruction"}
VALID_SOURCE_TYPES = {"user_stated", "observed", "inferred"}

EXTRACTION_PROMPT = """Analyze this conversation and extract durable facts, preferences, patterns, or instructions about the user that would be useful to remember across future sessions.

Rules:
- Only extract information that is STABLE and REUSABLE (not session-specific)
- Each memory should be a single, concise statement (under 100 characters)
- Do NOT extract: greetings, task-specific details, item contents, temporary context
- Assign confidence: 0.9 for user_stated, 0.7 for observed, 0.5 for inferred
- Return empty list if nothing worth remembering

Return ONLY valid JSON (no markdown, no explanation):
{"memories": [
  {"content": "...", "memory_type": "preference|pattern|fact|instruction", "confidence": 0.5-1.0, "source": "user_stated|observed|inferred"}
]}"""


def _normalize_text(text: str) -> str:
    """Lowercase, strip punctuation, collapse whitespace."""
    text = text.lower()
    text = text.translate(str.maketrans("", "", string.punctuation))
    return re.sub(r"\s+", " ", text).strip()


def _jaccard_similarity(a: str, b: str) -> float:
    """Word-level Jaccard similarity between two strings."""
    words_a = set(_normalize_text(a).split())
    words_b = set(_normalize_text(b).split())
    if not words_a or not words_b:
        return 0.0
    intersection = words_a & words_b
    union = words_a | words_b
    return len(intersection) / len(union)


def _is_duplicate(new_content: str, existing_content: str, threshold: float = 0.7) -> bool:
    """Check if new memory is a duplicate of an existing one."""
    norm_new = _normalize_text(new_content)
    norm_existing = _normalize_text(existing_content)
    # Substring containment
    if norm_new in norm_existing or norm_existing in norm_new:
        return True
    # Jaccard word overlap
    return _jaccard_similarity(new_content, existing_content) >= threshold


def load_active_memories(db: Session, user_id: UUID) -> list[UserMemory]:
    """Load active memories ordered by confidence DESC, capped at MAX_MEMORIES_PER_USER."""
    return (
        db.query(UserMemory)
        .filter(UserMemory.user_id == user_id, UserMemory.is_active.is_(True))
        .order_by(UserMemory.confidence.desc())
        .limit(MAX_MEMORIES_PER_USER)
        .all()
    )


def format_memories_for_prompt(memories: list[UserMemory]) -> str:
    """Format memories as a <user_memory> block for the system prompt.

    Returns empty string if no memories.
    """
    if not memories:
        return ""

    grouped: dict[str, list[str]] = {}
    for mem in memories:
        label = mem.memory_type.capitalize() if mem.memory_type else "Other"
        # Pluralize
        label_plural = {
            "Preference": "Preferences",
            "Pattern": "Patterns",
            "Fact": "Facts",
            "Instruction": "Instructions",
        }.get(label, label)
        grouped.setdefault(label_plural, []).append(mem.content)

    lines = [
        "\n\n<user_memory>",
        "Things I know about this user (use to personalize responses):",
    ]
    counter = 1
    for section, items in grouped.items():
        lines.append(f"{section}:")
        for item in items:
            lines.append(f"{counter}. {item}")
            counter += 1
    lines.append("</user_memory>")

    return "\n".join(lines)


def _build_transcript(messages: list[dict]) -> str:
    """Build a plain-text transcript from Anthropic API messages."""
    parts = []
    for msg in messages:
        role = msg.get("role", "")
        content = msg.get("content", "")
        if isinstance(content, str):
            parts.append(f"{role}: {content}")
        elif isinstance(content, list):
            for block in content:
                if isinstance(block, dict) and block.get("type") == "text":
                    parts.append(f"{role}: {block['text']}")
    return "\n".join(parts)


def extract_and_save_memories(
    db: Session, user_id: UUID, conversation_messages: list[dict]
) -> int:
    """Extract memories from a conversation and save them.

    Returns count of new memories saved.
    """
    transcript = _build_transcript(conversation_messages)

    # Skip very short conversations
    if len(transcript) < 100:
        logger.debug("Conversation too short for memory extraction (%d chars)", len(transcript))
        return 0

    # Call Claude to extract memories
    client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    try:
        response = client.messages.create(
            model=MEMORY_MODEL,
            max_tokens=512,
            system=EXTRACTION_PROMPT,
            messages=[{"role": "user", "content": transcript}],
        )
    except Exception as e:
        logger.warning("Memory extraction API call failed: %s", e)
        return 0

    # Parse response
    raw_text = ""
    for block in response.content:
        if block.type == "text":
            raw_text += block.text

    try:
        parsed = json.loads(raw_text)
        raw_memories = parsed.get("memories", [])
    except (json.JSONDecodeError, AttributeError):
        logger.warning("Memory extraction returned invalid JSON: %.200s", raw_text)
        return 0

    if not raw_memories:
        return 0

    # Load existing memories for dedup
    existing_memories = load_active_memories(db, user_id)
    active_count = len(existing_memories)
    saved_count = 0

    for raw in raw_memories:
        # Validate fields
        content = raw.get("content", "").strip()
        if not content or len(content) > 200:
            continue

        memory_type = raw.get("memory_type", "")
        if memory_type not in VALID_MEMORY_TYPES:
            continue

        source = raw.get("source", "observed")
        if source not in VALID_SOURCE_TYPES:
            source = "observed"

        confidence = raw.get("confidence", 0.5)
        confidence = max(0.1, min(1.0, float(confidence)))

        # Check for duplicates among existing memories
        is_dup = False
        for existing in existing_memories:
            if _is_duplicate(content, existing.content):
                # Boost confidence of existing memory if re-observed
                if confidence > existing.confidence:
                    existing.confidence = min(1.0, existing.confidence + 0.1)
                    db.commit()
                is_dup = True
                break

        if is_dup:
            continue

        # Capacity management
        if active_count >= MAX_MEMORIES_PER_USER:
            # Find lowest-confidence existing memory
            lowest = min(existing_memories, key=lambda m: m.confidence)
            if confidence > lowest.confidence:
                lowest.is_active = False
                db.commit()
                existing_memories.remove(lowest)
                active_count -= 1
            else:
                # New memory isn't strong enough — skip
                continue

        # Save new memory
        new_memory = UserMemory(
            user_id=user_id,
            memory_type=memory_type,
            content=content,
            confidence=confidence,
            source=source,
        )
        db.add(new_memory)
        db.commit()

        existing_memories.append(new_memory)
        active_count += 1
        saved_count += 1

    logger.info("Memory extraction: saved %d new memories for user %s", saved_count, user_id)
    return saved_count
