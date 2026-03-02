"""
Telegram integration service for MindStash.

Handles link-code generation, account activation via /start,
incoming message processing (categorize + save), and Telegram Bot API calls.
"""
import logging
import secrets
import string
from datetime import datetime, timedelta
from uuid import UUID

import httpx
from sqlalchemy.orm import Session

from app.core.config import settings
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
