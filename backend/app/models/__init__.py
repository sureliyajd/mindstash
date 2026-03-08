"""
Models package - Import all models here so SQLAlchemy can resolve relationships.

IMPORTANT: All models must be imported together for relationship resolution.
"""
from app.models.user import User
from app.models.item import Item
from app.models.chat import ChatSession, ChatMessage, UserMemory, PendingConfirmation
from app.models.telegram_link import TelegramLink

__all__ = [
    "User",
    "Item",
    "ChatSession",
    "ChatMessage",
    "UserMemory",
    "PendingConfirmation",
    "TelegramLink",
]
