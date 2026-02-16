"""
Core AI agent service for MindStash.

Manages chat sessions, runs the agent loop with tool calling,
and streams responses via SSE.
"""
import json
import logging
from datetime import datetime
from typing import Generator, Optional
from uuid import UUID

from anthropic import Anthropic
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.chat import ChatSession, ChatMessage
from app.services.ai.tool_registry import registry

# Ensure tools are registered
import app.services.ai.agent_tools  # noqa: F401

logger = logging.getLogger(__name__)

client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
AGENT_MODEL = "claude-haiku-4-5-20251001"
MAX_ITERATIONS = 10
MAX_HISTORY_MESSAGES = 50

# Tools that mutate data (used by frontend for cache invalidation)
MUTATING_TOOLS = {"create_item", "update_item", "delete_item", "mark_complete"}

SYSTEM_PROMPT = """You are MindStash Assistant, an AI helper for a personal knowledge management app.
Users capture thoughts, tasks, ideas, links, and notes, and AI organizes them into
12 categories: read, watch, ideas, tasks, people, notes, goals, buy, places, journal, learn, save.

You can help by searching items, creating new thoughts, updating/deleting items,
marking tasks complete, showing overviews, and checking reminders.

Guidelines:
- Be concise and helpful
- Always use tools to access user data - never guess or fabricate
- Format search results clearly with category, summary, and dates
- When creating items, confirm what was created and its AI category
- If a tool returns an error, explain it naturally
- When users ask "how many items" or want an overview, use the get_counts tool
- When users want to find something, use search_items
- For digest/summary requests, use get_digest_preview"""


def _get_or_create_session(
    db: Session, user_id: UUID, session_id: Optional[str]
) -> ChatSession:
    """Load existing session or create a new one."""
    if session_id:
        session = (
            db.query(ChatSession)
            .filter(ChatSession.id == session_id, ChatSession.user_id == user_id)
            .first()
        )
        if session:
            session.last_active_at = datetime.utcnow()
            db.commit()
            return session

    # Create new session
    session = ChatSession(user_id=user_id)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def _save_message(
    db: Session,
    session_id: UUID,
    role: str,
    content: Optional[str] = None,
    tool_calls: Optional[list] = None,
    tool_results: Optional[list] = None,
) -> ChatMessage:
    """Persist a message to the database."""
    msg = ChatMessage(
        session_id=session_id,
        role=role,
        content=content,
        tool_calls=tool_calls,
        tool_results=tool_results,
    )
    db.add(msg)
    db.commit()
    return msg


def _load_messages(db: Session, session_id: UUID) -> list[ChatMessage]:
    """Load recent messages from DB, ordered by created_at."""
    return (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
        .limit(MAX_HISTORY_MESSAGES)
        .all()
    )


def _db_messages_to_anthropic(messages: list[ChatMessage]) -> list[dict]:
    """Convert DB messages to Anthropic messages API format."""
    result = []
    for msg in messages:
        if msg.role == "user":
            result.append({"role": "user", "content": msg.content or ""})
        elif msg.role == "assistant":
            content_blocks = []
            if msg.content:
                content_blocks.append({"type": "text", "text": msg.content})
            if msg.tool_calls:
                for tc in msg.tool_calls:
                    content_blocks.append({
                        "type": "tool_use",
                        "id": tc["id"],
                        "name": tc["name"],
                        "input": tc["input"],
                    })
            if content_blocks:
                result.append({"role": "assistant", "content": content_blocks})
        elif msg.role == "tool_result":
            content_blocks = []
            for tr in (msg.tool_results or []):
                content_blocks.append({
                    "type": "tool_result",
                    "tool_use_id": tr["tool_use_id"],
                    "content": tr["content"],
                })
            if content_blocks:
                result.append({"role": "user", "content": content_blocks})
    return result


def _sse_event(event: str, data: dict) -> str:
    """Format an SSE event."""
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


def run_agent(
    message: str,
    session_id: Optional[str],
    db: Session,
    user_id: UUID,
) -> Generator[str, None, None]:
    """
    Run the agent loop and yield SSE events.

    SSE events emitted:
    - session_id: {session_id}
    - text_delta: {text}
    - tool_start: {tool, message}
    - tool_result: {tool, success, mutated}
    - error: {message}
    - done: {}
    """
    try:
        # 1. Get or create session
        session = _get_or_create_session(db, user_id, session_id)
        yield _sse_event("session_id", {"session_id": str(session.id)})

        # 2. Save user message
        _save_message(db, session.id, "user", content=message)

        # Auto-generate title from first user message
        if not session.title:
            session.title = message[:100]
            db.commit()

        # 3. Load history
        db_messages = _load_messages(db, session.id)
        api_messages = _db_messages_to_anthropic(db_messages)

        # 4. Get tool schemas
        tool_schemas = registry.get_schemas(agent_type=session.agent_type)

        # 5. Agent loop
        for iteration in range(MAX_ITERATIONS):
            try:
                response = client.messages.create(
                    model=AGENT_MODEL,
                    max_tokens=2048,
                    system=SYSTEM_PROMPT,
                    tools=tool_schemas,
                    messages=api_messages,
                )
            except Exception as e:
                logger.exception("Claude API call failed")
                yield _sse_event("error", {"message": f"AI service error: {str(e)}"})
                yield _sse_event("done", {})
                return

            # Extract text and tool_use blocks
            text_parts = []
            tool_use_blocks = []
            for block in response.content:
                if block.type == "text":
                    text_parts.append(block.text)
                elif block.type == "tool_use":
                    tool_use_blocks.append(block)

            # Save assistant message
            tool_calls_data = [
                {"id": tb.id, "name": tb.name, "input": tb.input}
                for tb in tool_use_blocks
            ] or None
            full_text = "\n".join(text_parts) if text_parts else None

            _save_message(
                db, session.id, "assistant",
                content=full_text,
                tool_calls=tool_calls_data,
            )

            # Stream text
            if full_text:
                yield _sse_event("text_delta", {"text": full_text})

            # If no tool use, we're done
            if response.stop_reason == "end_turn" or not tool_use_blocks:
                break

            # Execute tools
            tool_results_data = []
            for tb in tool_use_blocks:
                # Friendly tool name for UI
                friendly_names = {
                    "search_items": "Searching your items...",
                    "create_item": "Saving your thought...",
                    "update_item": "Updating item...",
                    "delete_item": "Deleting item...",
                    "mark_complete": "Updating completion status...",
                    "get_counts": "Getting overview...",
                    "get_upcoming_notifications": "Checking notifications...",
                    "get_digest_preview": "Preparing digest...",
                }
                yield _sse_event("tool_start", {
                    "tool": tb.name,
                    "message": friendly_names.get(tb.name, f"Using {tb.name}..."),
                })

                result = registry.execute(tb.name, db, user_id, tb.input)
                is_mutating = tb.name in MUTATING_TOOLS and result.get("mutated", False)

                yield _sse_event("tool_result", {
                    "tool": tb.name,
                    "success": "error" not in result,
                    "mutated": is_mutating,
                })

                result_str = json.dumps(result)
                tool_results_data.append({
                    "tool_use_id": tb.id,
                    "content": result_str,
                })

            # Save tool results
            _save_message(
                db, session.id, "tool_result",
                tool_results=tool_results_data,
            )

            # Add to API messages for next iteration
            api_messages.append({
                "role": "assistant",
                "content": [
                    *(
                        [{"type": "text", "text": full_text}] if full_text else []
                    ),
                    *[
                        {"type": "tool_use", "id": tb.id, "name": tb.name, "input": tb.input}
                        for tb in tool_use_blocks
                    ],
                ],
            })
            api_messages.append({
                "role": "user",
                "content": [
                    {"type": "tool_result", "tool_use_id": tr["tool_use_id"], "content": tr["content"]}
                    for tr in tool_results_data
                ],
            })

        yield _sse_event("done", {})

    except Exception as e:
        logger.exception("Agent run failed")
        yield _sse_event("error", {"message": f"Something went wrong: {str(e)}"})
        yield _sse_event("done", {})
