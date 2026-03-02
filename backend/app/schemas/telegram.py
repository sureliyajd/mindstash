"""
Pydantic schemas for Telegram integration.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


# ---------------------------------------------------------------------------
# API response schemas (returned to MindStash frontend)
# ---------------------------------------------------------------------------

class TelegramLinkCodeResponse(BaseModel):
    """Returned when user requests a linking code."""
    code: str
    bot_username: str
    expires_in_minutes: int = 15


class TelegramLinkResponse(BaseModel):
    """Status of a user's Telegram link."""
    linked: bool
    bot_username: Optional[str] = None
    telegram_username: Optional[str] = None
    linked_at: Optional[datetime] = None


# ---------------------------------------------------------------------------
# Telegram webhook payload (incoming from Telegram)
# ---------------------------------------------------------------------------

class TelegramUser(BaseModel):
    id: int
    is_bot: bool = False
    first_name: str
    last_name: Optional[str] = None
    username: Optional[str] = None

    class Config:
        extra = "allow"


class TelegramChat(BaseModel):
    id: int
    type: str  # "private", "group", etc.

    class Config:
        extra = "allow"


class TelegramMessage(BaseModel):
    message_id: int
    chat: TelegramChat
    text: Optional[str] = None
    date: int  # Unix timestamp

    # "from" is a reserved keyword in Python — Telegram uses "from"
    from_user: Optional[TelegramUser] = None

    class Config:
        extra = "allow"
        # Map Telegram's "from" field to "from_user"
        populate_by_name = True

    def __init__(self, **data):
        # Handle the 'from' -> 'from_user' mapping
        if "from" in data and "from_user" not in data:
            data["from_user"] = data.pop("from")
        super().__init__(**data)


class TelegramWebhookUpdate(BaseModel):
    """Top-level Telegram webhook update object."""
    update_id: int
    message: Optional[TelegramMessage] = None

    class Config:
        extra = "allow"
