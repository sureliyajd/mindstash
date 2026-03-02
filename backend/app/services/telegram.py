"""
Telegram integration service for MindStash.

Handles link-code generation, account activation via /start,
incoming message processing (categorize + save), AI agent chat via Telegram,
and Telegram Bot API calls.
"""
import logging
import re
import secrets
import string
from datetime import datetime, timedelta
from uuid import UUID

import httpx
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import SessionLocal
from app.models.item import Item
from app.models.telegram_link import TelegramLink
from app.services.ai.categorizer import categorize_item
from app.services.ai.embeddings import embedding_service

logger = logging.getLogger(__name__)

# Category emoji map (same as agent_tools.py)
CATEGORY_EMOJI = {
    "read": "\U0001f4da", "watch": "\U0001f3a5", "ideas": "\U0001f4a1", "tasks": "\u2705",
    "people": "\U0001f464", "notes": "\U0001f4dd", "goals": "\U0001f3af", "buy": "\U0001f6d2",
    "places": "\U0001f4cd", "journal": "\U0001f4ad", "learn": "\U0001f393", "save": "\U0001f516",
}

LINK_CODE_LENGTH = 6
LINK_CODE_EXPIRY_MINUTES = 15


# ---------------------------------------------------------------------------
# Telegram Bot API helpers
# ---------------------------------------------------------------------------

def _bot_api_url(method: str) -> str:
    return f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/{method}"


async def send_message(chat_id: int, text: str) -> bool:
    """Send a text message to a Telegram chat. Returns True on success."""
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                _bot_api_url("sendMessage"),
                json={"chat_id": chat_id, "text": text, "parse_mode": "HTML"},
            )
            if resp.status_code != 200:
                logger.error("Telegram sendMessage failed: %s", resp.text)
                return False
            return True
    except Exception as e:
        logger.error("Telegram sendMessage error: %s", e)
        return False


async def setup_webhook(base_url: str) -> dict:
    """Register webhook URL with Telegram. Called once during deployment."""
    webhook_url = f"{base_url}/api/integrations/telegram/webhook"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                _bot_api_url("setWebhook"),
                json={
                    "url": webhook_url,
                    "secret_token": settings.TELEGRAM_WEBHOOK_SECRET,
                    "allowed_updates": ["message"],
                },
            )
            return resp.json()
    except Exception as e:
        logger.error("Telegram setWebhook error: %s", e)
        return {"ok": False, "description": str(e)}


async def get_bot_username() -> str:
    """Fetch the bot's username via getMe. Falls back to 'MindStashBot'."""
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(_bot_api_url("getMe"))
            data = resp.json()
            if data.get("ok"):
                return data["result"].get("username", "MindStashBot")
    except Exception as e:
        logger.warning("getMe failed: %s", e)
    return "MindStashBot"


# ---------------------------------------------------------------------------
# Sync helpers (for use in background tasks — can't use async there)
# ---------------------------------------------------------------------------

TELEGRAM_MAX_MESSAGE_LENGTH = 4096


def send_message_sync(chat_id: int, text: str, parse_mode: str = "HTML") -> bool:
    """Send a text message using sync httpx (for background tasks)."""
    try:
        with httpx.Client(timeout=10) as c:
            resp = c.post(
                _bot_api_url("sendMessage"),
                json={"chat_id": chat_id, "text": text, "parse_mode": parse_mode},
            )
            if resp.status_code != 200:
                logger.error("Telegram sendMessage (sync) failed: %s", resp.text)
                return False
            return True
    except Exception as e:
        logger.error("Telegram sendMessage (sync) error: %s", e)
        return False


def send_typing_action_sync(chat_id: int) -> None:
    """Send 'typing...' indicator to Telegram chat."""
    try:
        with httpx.Client(timeout=5) as c:
            c.post(
                _bot_api_url("sendChatAction"),
                json={"chat_id": chat_id, "action": "typing"},
            )
    except Exception:
        pass  # Non-critical — just a UX nicety


# ---------------------------------------------------------------------------
# Markdown → Telegram HTML converter
# ---------------------------------------------------------------------------

def markdown_to_telegram_html(text: str) -> str:
    """
    Convert common Markdown formatting to Telegram-safe HTML.

    Handles: bold, inline code, code blocks, links, bullets, headers.
    """
    # Code blocks first (before other transforms touch the content)
    text = re.sub(r"```(?:\w*)\n?(.*?)```", r"<pre>\1</pre>", text, flags=re.DOTALL)

    # Inline code
    text = re.sub(r"`([^`]+)`", r"<code>\1</code>", text)

    # Bold: **text**
    text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)

    # Italic: *text* (but not inside <b> tags which already consumed **)
    text = re.sub(r"(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)", r"<i>\1</i>", text)

    # Links: [text](url)
    text = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<a href="\2">\1</a>', text)

    # Bullets: - item → • item
    text = re.sub(r"^[-*] ", "• ", text, flags=re.MULTILINE)

    # Strip # headers (keep text)
    text = re.sub(r"^#{1,6}\s+", "", text, flags=re.MULTILINE)

    return text.strip()


# ---------------------------------------------------------------------------
# Message splitter (Telegram 4096-char limit)
# ---------------------------------------------------------------------------

def split_telegram_message(text: str) -> list[str]:
    """
    Split text into chunks that fit within Telegram's 4096-char limit.

    Splits at paragraph boundaries first, then sentence boundaries.
    """
    if len(text) <= TELEGRAM_MAX_MESSAGE_LENGTH:
        return [text]

    chunks: list[str] = []
    remaining = text

    while remaining:
        if len(remaining) <= TELEGRAM_MAX_MESSAGE_LENGTH:
            chunks.append(remaining)
            break

        # Try to split at a paragraph boundary
        cut = remaining[:TELEGRAM_MAX_MESSAGE_LENGTH].rfind("\n\n")
        if cut > TELEGRAM_MAX_MESSAGE_LENGTH // 2:
            chunks.append(remaining[:cut].rstrip())
            remaining = remaining[cut:].lstrip()
            continue

        # Try a single newline
        cut = remaining[:TELEGRAM_MAX_MESSAGE_LENGTH].rfind("\n")
        if cut > TELEGRAM_MAX_MESSAGE_LENGTH // 2:
            chunks.append(remaining[:cut].rstrip())
            remaining = remaining[cut:].lstrip()
            continue

        # Try a sentence boundary
        cut = remaining[:TELEGRAM_MAX_MESSAGE_LENGTH].rfind(". ")
        if cut > TELEGRAM_MAX_MESSAGE_LENGTH // 2:
            chunks.append(remaining[: cut + 1])
            remaining = remaining[cut + 2 :].lstrip()
            continue

        # Hard split at limit
        chunks.append(remaining[:TELEGRAM_MAX_MESSAGE_LENGTH])
        remaining = remaining[TELEGRAM_MAX_MESSAGE_LENGTH:]

    return chunks


# ---------------------------------------------------------------------------
# Background agent runner
# ---------------------------------------------------------------------------

def run_agent_in_background(
    chat_id: int,
    user_id: UUID,
    chat_session_id: UUID | None,
    text: str,
) -> None:
    """
    Run the AI agent and send the response back to Telegram.

    Designed to be called via FastAPI BackgroundTasks. Creates its own DB
    session since the request-scoped session is closed by the time this runs.
    """
    from app.services.ai.agent import run_agent_collect

    send_typing_action_sync(chat_id)

    db = SessionLocal()
    try:
        session_id_str = str(chat_session_id) if chat_session_id else None
        response_text, returned_session_id = run_agent_collect(
            text, session_id_str, db, user_id
        )

        # Persist session ID back to TelegramLink if it's new or changed
        if returned_session_id:
            link = get_link_by_chat_id(db, chat_id)
            if link and str(link.chat_session_id or "") != returned_session_id:
                link.chat_session_id = returned_session_id
                db.commit()

        # Convert and send
        html_text = markdown_to_telegram_html(response_text)
        for chunk in split_telegram_message(html_text):
            send_message_sync(chat_id, chunk)

    except Exception as e:
        logger.exception("run_agent_in_background failed for chat_id=%s", chat_id)
        send_message_sync(
            chat_id,
            "Something went wrong. Please try again.",
            parse_mode="HTML",
        )
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Link code management
# ---------------------------------------------------------------------------

def generate_link_code(db: Session, user_id: UUID) -> TelegramLink:
    """
    Generate a 6-char alphanumeric code for linking Telegram to this user.

    If the user already has a TelegramLink row, reuse it (refresh code).
    Code expires in 15 minutes.
    """
    link = db.query(TelegramLink).filter(TelegramLink.user_id == user_id).first()

    code = "".join(
        secrets.choice(string.ascii_uppercase + string.digits)
        for _ in range(LINK_CODE_LENGTH)
    )
    expires_at = datetime.utcnow() + timedelta(minutes=LINK_CODE_EXPIRY_MINUTES)

    if link:
        link.link_code = code
        link.link_code_expires_at = expires_at
        # Don't deactivate if already linked — just refresh the code
    else:
        link = TelegramLink(
            user_id=user_id,
            link_code=code,
            link_code_expires_at=expires_at,
        )
        db.add(link)

    db.commit()
    db.refresh(link)
    return link


def activate_link(db: Session, chat_id: int, username: str | None, code: str) -> TelegramLink | None:
    """
    Activate a Telegram link using the 6-char code sent via /start.

    Returns the TelegramLink on success, None if the code is invalid/expired.
    """
    link = (
        db.query(TelegramLink)
        .filter(
            TelegramLink.link_code == code.upper().strip(),
            TelegramLink.is_active == False,
        )
        .first()
    )

    if not link:
        return None

    # Check expiry
    if link.link_code_expires_at and link.link_code_expires_at < datetime.utcnow():
        return None

    # If this chat_id is already linked to another user, unlink it first
    existing = (
        db.query(TelegramLink)
        .filter(TelegramLink.telegram_chat_id == chat_id, TelegramLink.id != link.id)
        .first()
    )
    if existing:
        db.delete(existing)

    link.telegram_chat_id = chat_id
    link.telegram_username = username
    link.is_active = True
    link.link_code = None  # Consume the code
    link.link_code_expires_at = None

    db.commit()
    db.refresh(link)
    return link


def get_link_by_chat_id(db: Session, chat_id: int) -> TelegramLink | None:
    """Find an active TelegramLink for a given Telegram chat ID."""
    return (
        db.query(TelegramLink)
        .filter(TelegramLink.telegram_chat_id == chat_id, TelegramLink.is_active == True)
        .first()
    )


def get_link_by_user(db: Session, user_id: UUID) -> TelegramLink | None:
    """Get the TelegramLink for a given MindStash user."""
    return db.query(TelegramLink).filter(TelegramLink.user_id == user_id).first()


def unlink(db: Session, user_id: UUID) -> bool:
    """Remove a user's Telegram link. Returns True if a link existed."""
    link = db.query(TelegramLink).filter(TelegramLink.user_id == user_id).first()
    if not link:
        return False
    db.delete(link)
    db.commit()
    return True


# ---------------------------------------------------------------------------
# Message processing — reuses the same categorize + save flow as agent_tools
# ---------------------------------------------------------------------------

def process_message(db: Session, telegram_link: TelegramLink, text: str) -> str:
    """
    Categorize and save a Telegram message as a MindStash item.

    Returns a human-readable confirmation string to send back to the user.
    """
    content = text.strip()[:500]  # Enforce 500-char limit
    if not content:
        return "Please send some text to save."

    # Create item
    new_item = Item(user_id=telegram_link.user_id, content=content)
    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    # AI categorization (same as handle_create_item in agent_tools.py)
    try:
        ai_result = categorize_item(content=content)
        new_item.category = ai_result.get("category", "save")
        new_item.tags = ai_result.get("tags", [])
        new_item.summary = ai_result.get("summary", content[:100])
        new_item.confidence = ai_result.get("confidence", 0.5)
        new_item.priority = ai_result.get("priority", "medium")
        new_item.time_sensitivity = ai_result.get("time_sensitivity", "reference")
        new_item.intent = ai_result.get("intent", "reference")
        new_item.action_required = ai_result.get("action_required", False)
        new_item.urgency = ai_result.get("urgency", "low")
        new_item.time_context = ai_result.get("time_context", "someday")
        new_item.resurface_strategy = ai_result.get("resurface_strategy", "manual")
        new_item.suggested_bucket = ai_result.get("suggested_bucket", "Insights")

        # Sanitize ai_metadata for JSONB
        ai_metadata_sanitized = {}
        for key, value in ai_result.items():
            if isinstance(value, datetime):
                ai_metadata_sanitized[key] = value.isoformat()
            else:
                ai_metadata_sanitized[key] = value
        new_item.ai_metadata = ai_metadata_sanitized

        new_item.notification_date = ai_result.get("notification_date")
        new_item.notification_frequency = ai_result.get("notification_frequency", "never")
        new_item.next_notification_at = ai_result.get("next_notification_at")
        new_item.notification_enabled = ai_result.get("should_notify", False)

        db.commit()
        db.refresh(new_item)
    except Exception as e:
        logger.warning("AI categorization failed for Telegram message: %s", e)

    # Generate embedding
    try:
        embed_parts = [content]
        if new_item.summary:
            embed_parts.append(new_item.summary)
        if new_item.tags:
            embed_parts.append(" ".join(new_item.tags))
        vec = embedding_service.embed_text(" ".join(embed_parts))
        if vec is not None:
            new_item.content_embedding = vec
            db.commit()
    except Exception as e:
        logger.warning("Embedding generation failed for Telegram item: %s", e)

    # Build confirmation message
    emoji = CATEGORY_EMOJI.get(new_item.category or "", "\U0001f4cc")
    parts = [f"Saved! {emoji} {(new_item.category or 'save').title()}"]
    if new_item.priority:
        parts.append(f"Priority: {new_item.priority}")
    if new_item.notification_date:
        parts.append(f"Reminder: {new_item.notification_date.strftime('%b %d, %I:%M %p')}")
    return " \u00b7 ".join(parts)
