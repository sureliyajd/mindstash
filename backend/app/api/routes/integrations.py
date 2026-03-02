"""
Integration routes — Telegram bot linking, webhook, and status.
"""
import logging

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status, BackgroundTasks
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.schemas.telegram import (
    TelegramLinkCodeResponse,
    TelegramLinkResponse,
    TelegramWebhookUpdate,
)
from app.services import telegram as tg_service

logger = logging.getLogger(__name__)

router = APIRouter()


# ---------------------------------------------------------------------------
# Authenticated endpoints (MindStash frontend)
# ---------------------------------------------------------------------------

@router.post("/telegram/generate-link", response_model=TelegramLinkCodeResponse)
async def generate_link_code(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate a 6-char code the user sends to the Telegram bot via /start."""
    if not settings.TELEGRAM_BOT_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Telegram integration is not configured",
        )

    link = tg_service.generate_link_code(db, current_user.id)
    bot_username = await tg_service.get_bot_username()

    return TelegramLinkCodeResponse(
        code=link.link_code,
        bot_username=bot_username,
        expires_in_minutes=tg_service.LINK_CODE_EXPIRY_MINUTES,
    )


@router.get("/telegram/status", response_model=TelegramLinkResponse)
async def telegram_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Check whether the user has linked their Telegram account."""
    link = tg_service.get_link_by_user(db, current_user.id)

    if not link or not link.is_active:
        return TelegramLinkResponse(linked=False)

    bot_username = await tg_service.get_bot_username()
    return TelegramLinkResponse(
        linked=True,
        bot_username=bot_username,
        telegram_username=link.telegram_username,
        linked_at=link.created_at,
    )


@router.delete("/telegram/unlink")
async def unlink_telegram(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remove the Telegram link for the current user."""
    removed = tg_service.unlink(db, current_user.id)
    if not removed:
        raise HTTPException(status_code=404, detail="No Telegram link found")
    return {"detail": "Telegram account unlinked"}


# ---------------------------------------------------------------------------
# Telegram webhook (public, verified via secret token header)
# ---------------------------------------------------------------------------

@router.post("/telegram/webhook", status_code=200)
async def telegram_webhook(
    update: TelegramWebhookUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    x_telegram_bot_api_secret_token: str | None = Header(None),
):
    """
    Receive webhook updates from Telegram.

    Verified via the X-Telegram-Bot-Api-Secret-Token header that Telegram
    sends with every request when a secret_token is set in setWebhook.
    """
    # Verify secret token
    if settings.TELEGRAM_WEBHOOK_SECRET:
        if x_telegram_bot_api_secret_token != settings.TELEGRAM_WEBHOOK_SECRET:
            raise HTTPException(status_code=403, detail="Invalid secret token")

    # Only handle text messages
    msg = update.message
    if not msg or not msg.text:
        return {"ok": True}

    chat_id = msg.chat.id
    text = msg.text.strip()
    username = msg.from_user.username if msg.from_user else None

    # --- /start <code>  — link account ---------------------------------
    if text.startswith("/start"):
        parts = text.split(maxsplit=1)
        if len(parts) == 2:
            code = parts[1].strip()
            link = tg_service.activate_link(db, chat_id, username, code)
            if link:
                background_tasks.add_task(
                    tg_service.send_message,
                    chat_id,
                    "Linked! Send me anything to save it to MindStash.",
                )
            else:
                background_tasks.add_task(
                    tg_service.send_message,
                    chat_id,
                    "Invalid or expired code. Please generate a new one in MindStash.",
                )
        else:
            background_tasks.add_task(
                tg_service.send_message,
                chat_id,
                "Welcome! To link your account, generate a code in MindStash and send:\n/start YOUR_CODE",
            )
        return {"ok": True}

    # --- /unlink  — disconnect account ----------------------------------
    if text == "/unlink":
        link = tg_service.get_link_by_chat_id(db, chat_id)
        if link:
            tg_service.unlink(db, link.user_id)
            background_tasks.add_task(
                tg_service.send_message,
                chat_id,
                "Account unlinked. You can re-link anytime from MindStash.",
            )
        else:
            background_tasks.add_task(
                tg_service.send_message,
                chat_id,
                "No linked account found.",
            )
        return {"ok": True}

    # --- Regular message — save as item ---------------------------------
    link = tg_service.get_link_by_chat_id(db, chat_id)
    if not link:
        background_tasks.add_task(
            tg_service.send_message,
            chat_id,
            "Your Telegram is not linked to MindStash. Generate a code in the app and send /start YOUR_CODE",
        )
        return {"ok": True}

    reply = tg_service.process_message(db, link, text)
    background_tasks.add_task(tg_service.send_message, chat_id, reply)
    return {"ok": True}
