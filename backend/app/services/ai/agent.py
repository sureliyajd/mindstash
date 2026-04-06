"""
Core AI agent service for MindStash.

Manages chat sessions, runs the agent loop with tool calling,
and streams responses via SSE.
"""
import json
import logging
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta
from typing import Generator, Optional
from uuid import UUID

from anthropic import Anthropic, APIError, AuthenticationError, RateLimitError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import SessionLocal
from app.models.chat import ChatSession, ChatMessage, PendingConfirmation
from app.models.item import Item
from app.services.ai.tool_registry import registry
from app.services.ai.memory import load_active_memories, format_memories_for_prompt

# Ensure tools are registered
import app.services.ai.agent_tools  # noqa: F401

logger = logging.getLogger(__name__)

client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)


def _friendly_api_error(e: Exception) -> str:
    """Convert API exceptions to user-friendly messages. Raw details stay in logs."""
    if isinstance(e, AuthenticationError):
        return "AI service is temporarily unavailable. Please try again later."
    if isinstance(e, RateLimitError):
        return "AI service is busy right now. Please wait a moment and try again."
    if isinstance(e, APIError):
        return "AI service encountered an issue. Please try again."
    return "Something went wrong. Please try again."
AGENT_MODEL = "claude-haiku-4-5-20251001"
MAX_ITERATIONS = 10
MAX_HISTORY_MESSAGES = 50

# Tools that mutate data (used by frontend for cache invalidation)
MUTATING_TOOLS = {"create_item", "update_item", "delete_item", "mark_complete"}

# Friendly names for tool_start SSE events
FRIENDLY_TOOL_NAMES = {
    "search_items": "Searching your items...",
    "create_item": "Saving your thought...",
    "update_item": "Updating item...",
    "delete_item": "Deleting item...",
    "mark_complete": "Updating completion status...",
    "get_counts": "Getting overview...",
    "get_upcoming_notifications": "Checking notifications...",
    "get_digest_preview": "Preparing digest...",
    "generate_daily_briefing": "Preparing your daily briefing...",
}

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
- For digest/summary requests, use get_digest_preview

Daily Briefing:
When the user's message is exactly "[BRIEFING]", generate a warm, personalized daily briefing:
1. Call generate_daily_briefing to get today's data
2. Format a natural-language summary with:
   - A time-aware greeting (Good morning/afternoon/evening)
   - Urgent items needing attention (with context on why they're urgent)
   - Weekly progress stats (items saved, completed)
   - Upcoming reminders in the next 3 days
   - A proactive suggestion (review ideas, complete pending tasks, etc.)
3. Use markdown formatting with **bold** and bullet points
4. Keep it concise — under 200 words
5. End with an engaging question to encourage interaction
6. If there are no urgent items or reminders, still provide an encouraging summary"""


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


def _build_confirmation_description(
    tool_name: str, tool_input: dict, db: Session, user_id: UUID
) -> str:
    """Build a human-readable description for a pending confirmation."""
    if tool_name == "delete_item":
        item_id = tool_input.get("item_id")
        if item_id:
            item = db.query(Item).filter(
                Item.id == item_id, Item.user_id == user_id
            ).first()
            if item:
                preview = item.content[:80]
                return f'Permanently delete: "{preview}"'
        return "Permanently delete an item"
    return f"Execute {tool_name}"


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
    - confirmation_required: {confirmation_id, tool, tool_input, description}
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

        # 4. Load user's long-term memories and build personalized prompt
        user_memories = load_active_memories(db, user_id)
        memory_block = format_memories_for_prompt(user_memories)
        personalized_prompt = SYSTEM_PROMPT + memory_block

        # 5. Get tool schemas (dynamically selected based on user message)
        from app.services.ai.tool_selector import select_tools
        tool_schemas = select_tools(user_message=message, agent_type=session.agent_type)

        # 6. Agent loop
        for iteration in range(MAX_ITERATIONS):
            try:
                response = client.messages.create(
                    model=AGENT_MODEL,
                    max_tokens=2048,
                    system=personalized_prompt,
                    tools=tool_schemas,
                    messages=api_messages,
                )
            except Exception as e:
                logger.exception("Claude API call failed")
                yield _sse_event("error", {"message": _friendly_api_error(e)})
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

            # Split tools into safe vs confirmation-required
            safe_blocks = []
            confirmation_block = None
            for tb in tool_use_blocks:
                if confirmation_block is None and registry.needs_confirmation(tb.name):
                    confirmation_block = tb
                else:
                    safe_blocks.append(tb)

            # Execute safe tools first
            results_map = {}
            tool_results_data = []

            if safe_blocks:
                # Emit tool_start for safe blocks
                for tb in safe_blocks:
                    yield _sse_event("tool_start", {
                        "tool": tb.name,
                        "message": FRIENDLY_TOOL_NAMES.get(tb.name, f"Using {tb.name}..."),
                    })

                # Execute safe tools
                if len(safe_blocks) == 1:
                    tb = safe_blocks[0]
                    result = registry.execute(tb.name, db, user_id, tb.input)
                    results_map = {tb.id: result}
                else:
                    def _execute_tool(tool_block):
                        tool_db = SessionLocal()
                        try:
                            return tool_block.id, registry.execute(
                                tool_block.name, tool_db, user_id, tool_block.input
                            )
                        finally:
                            tool_db.close()

                    with ThreadPoolExecutor(max_workers=len(safe_blocks)) as executor:
                        futures = [executor.submit(_execute_tool, tb) for tb in safe_blocks]
                        for future in futures:
                            tool_id, result = future.result()
                            results_map[tool_id] = result

                # Emit tool_result for safe blocks
                for tb in safe_blocks:
                    result = results_map[tb.id]
                    is_mutating = tb.name in MUTATING_TOOLS and result.get("mutated", False)
                    yield _sse_event("tool_result", {
                        "tool": tb.name,
                        "success": "error" not in result,
                        "mutated": is_mutating,
                    })
                    tool_results_data.append({
                        "tool_use_id": tb.id,
                        "content": json.dumps(result),
                    })

            # Handle confirmation-required tool
            if confirmation_block:
                tb = confirmation_block
                description = _build_confirmation_description(
                    tb.name, tb.input, db, user_id
                )

                # Build agent context snapshot for resumption
                # Include current api_messages + this turn's assistant content + safe tool results
                assistant_content = []
                if full_text:
                    assistant_content.append({"type": "text", "text": full_text})
                for block in tool_use_blocks:
                    assistant_content.append({
                        "type": "tool_use", "id": block.id,
                        "name": block.name, "input": block.input,
                    })

                agent_context = {
                    "api_messages": api_messages,
                    "assistant_content": assistant_content,
                    "safe_tool_results": tool_results_data,
                    "personalized_prompt": personalized_prompt,
                    "tool_schemas": tool_schemas,
                }

                # Save pending confirmation
                pending = PendingConfirmation(
                    session_id=session.id,
                    user_id=user_id,
                    tool_name=tb.name,
                    tool_input=tb.input,
                    tool_use_id=tb.id,
                    description=description,
                    agent_context=agent_context,
                    status="pending",
                    expires_at=datetime.utcnow() + timedelta(minutes=10),
                )
                db.add(pending)

                # Save safe tool results if any
                if tool_results_data:
                    _save_message(
                        db, session.id, "tool_result",
                        tool_results=tool_results_data,
                    )

                db.commit()

                # Emit confirmation_required event
                yield _sse_event("confirmation_required", {
                    "confirmation_id": str(pending.id),
                    "tool": tb.name,
                    "tool_input": tb.input,
                    "description": description,
                })
                yield _sse_event("done", {})
                return

            # No confirmation needed — save tool results and continue loop
            if tool_results_data:
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

        # Extract and save long-term memories from this conversation
        # Runs after "done" — frontend has already closed the stream
        try:
            from app.services.ai.memory import extract_and_save_memories
            extract_and_save_memories(db, user_id, api_messages)
        except Exception as e:
            logger.warning("Memory extraction failed (non-critical): %s", e)

    except Exception as e:
        logger.exception("Agent run failed")
        yield _sse_event("error", {"message": f"Something went wrong: {str(e)}"})
        yield _sse_event("done", {})


def run_confirmation(
    confirmation_id: str,
    confirmed: bool,
    db: Session,
    user_id: UUID,
) -> Generator[str, None, None]:
    """
    Resume after a HITL confirmation decision.

    Loads the pending confirmation, executes or skips the tool,
    then calls Claude for a natural follow-up response.
    """
    try:
        # 1. Load and validate the pending confirmation
        pending = (
            db.query(PendingConfirmation)
            .filter(
                PendingConfirmation.id == confirmation_id,
                PendingConfirmation.user_id == user_id,
            )
            .first()
        )
        if not pending:
            yield _sse_event("error", {"message": "Confirmation not found"})
            yield _sse_event("done", {})
            return

        if pending.status != "pending":
            yield _sse_event("error", {"message": f"Confirmation already {pending.status}"})
            yield _sse_event("done", {})
            return

        if pending.expires_at and pending.expires_at < datetime.utcnow():
            pending.status = "expired"
            pending.resolved_at = datetime.utcnow()
            db.commit()
            yield _sse_event("error", {"message": "Confirmation expired. Please try again."})
            yield _sse_event("done", {})
            return

        # Emit session_id
        yield _sse_event("session_id", {"session_id": str(pending.session_id)})

        # 2. Execute or skip the tool
        if confirmed:
            pending.status = "confirmed"
            yield _sse_event("tool_start", {
                "tool": pending.tool_name,
                "message": FRIENDLY_TOOL_NAMES.get(pending.tool_name, f"Using {pending.tool_name}..."),
            })
            result = registry.execute(pending.tool_name, db, user_id, pending.tool_input)
            is_mutating = pending.tool_name in MUTATING_TOOLS and result.get("mutated", False)
            yield _sse_event("tool_result", {
                "tool": pending.tool_name,
                "success": "error" not in result,
                "mutated": is_mutating,
            })
        else:
            pending.status = "denied"
            result = {"cancelled": True, "message": "User cancelled the action"}

        pending.resolved_at = datetime.utcnow()
        db.commit()

        # 3. Build tool result data and save to chat history
        tool_result_content = json.dumps(result)
        tool_results_data = [{
            "tool_use_id": pending.tool_use_id,
            "content": tool_result_content,
        }]
        _save_message(
            db, pending.session_id, "tool_result",
            tool_results=tool_results_data,
        )

        # 4. Rebuild api_messages from agent context + new tool result
        ctx = pending.agent_context or {}
        api_messages = ctx.get("api_messages", [])
        assistant_content = ctx.get("assistant_content", [])
        safe_tool_results = ctx.get("safe_tool_results", [])
        personalized_prompt = ctx.get("personalized_prompt", SYSTEM_PROMPT)
        tool_schemas = ctx.get("tool_schemas", registry.get_schemas())

        # Append assistant turn
        if assistant_content:
            api_messages.append({"role": "assistant", "content": assistant_content})

        # Append tool results (safe ones + the confirmed/denied one)
        all_tool_results = safe_tool_results + tool_results_data
        api_messages.append({
            "role": "user",
            "content": [
                {"type": "tool_result", "tool_use_id": tr["tool_use_id"], "content": tr["content"]}
                for tr in all_tool_results
            ],
        })

        # 5. Call Claude for a natural follow-up response
        try:
            response = client.messages.create(
                model=AGENT_MODEL,
                max_tokens=1024,
                system=personalized_prompt,
                tools=tool_schemas,
                messages=api_messages,
            )
        except Exception as e:
            logger.exception("Claude API call failed during confirmation follow-up")
            yield _sse_event("error", {"message": _friendly_api_error(e)})
            yield _sse_event("done", {})
            return

        # Extract and stream text
        text_parts = []
        for block in response.content:
            if block.type == "text":
                text_parts.append(block.text)

        follow_up_text = "\n".join(text_parts) if text_parts else None
        if follow_up_text:
            _save_message(db, pending.session_id, "assistant", content=follow_up_text)
            yield _sse_event("text_delta", {"text": follow_up_text})

        yield _sse_event("done", {})

    except Exception as e:
        logger.exception("Confirmation handling failed")
        yield _sse_event("error", {"message": f"Something went wrong: {str(e)}"})
        yield _sse_event("done", {})


def _parse_sse_line(line: str) -> tuple[str | None, dict | None]:
    """Parse a single SSE chunk into (event_type, data_dict)."""
    event_type = None
    data_str = None
    for part in line.strip().split("\n"):
        if part.startswith("event: "):
            event_type = part[7:]
        elif part.startswith("data: "):
            data_str = part[6:]

    if not event_type or not data_str:
        return None, None

    try:
        return event_type, json.loads(data_str)
    except json.JSONDecodeError:
        return event_type, None


def run_agent_collect(
    message: str,
    session_id: Optional[str],
    db: Session,
    user_id: UUID,
) -> tuple[str, str | None]:
    """
    Non-streaming wrapper around run_agent().

    Consumes the SSE generator and returns (collected_text, session_id).
    Used by Telegram bot where we need the full response as a string.
    Auto-confirms any HITL confirmations (Telegram users already expressed intent).
    """
    collected_text_parts: list[str] = []
    collected_session_id: str | None = None

    for line in run_agent(message, session_id, db, user_id):
        event_type, data = _parse_sse_line(line)
        if not event_type or not data:
            continue

        if event_type == "session_id":
            collected_session_id = data.get("session_id")
        elif event_type == "text_delta":
            text = data.get("text", "")
            if text:
                collected_text_parts.append(text)
        elif event_type == "error":
            err_msg = data.get("message", "Something went wrong")
            collected_text_parts.append(f"Error: {err_msg}")
        elif event_type == "confirmation_required":
            # Auto-confirm for Telegram — user already expressed intent
            conf_id = data.get("confirmation_id")
            if conf_id:
                for conf_line in run_confirmation(conf_id, True, db, user_id):
                    conf_event, conf_data = _parse_sse_line(conf_line)
                    if not conf_event or not conf_data:
                        continue
                    if conf_event == "text_delta":
                        text = conf_data.get("text", "")
                        if text:
                            collected_text_parts.append(text)
                    elif conf_event == "error":
                        err_msg = conf_data.get("message", "Something went wrong")
                        collected_text_parts.append(f"Error: {err_msg}")

    final_text = "\n".join(collected_text_parts) if collected_text_parts else "I couldn't generate a response. Please try again."
    return final_text, collected_session_id
