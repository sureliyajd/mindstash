"""
Telegram link model for connecting Telegram chat IDs to MindStash users.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, BigInteger, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class TelegramLink(Base):
    """Links a Telegram chat to a MindStash user account."""

    __tablename__ = "telegram_links"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    telegram_chat_id = Column(BigInteger, unique=True, nullable=True, index=True)
    telegram_username = Column(String, nullable=True)
    link_code = Column(String(6), unique=True, nullable=True, index=True)
    link_code_expires_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    owner = relationship("User", back_populates="telegram_link")

    def __repr__(self):
        return f"<TelegramLink user={self.user_id} chat={self.telegram_chat_id}>"
