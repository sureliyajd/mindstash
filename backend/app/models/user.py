"""
User database model
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Boolean, Integer, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class User(Base):
    """User model for authentication and ownership"""
    
    __tablename__ = "users"
    
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=True)
    google_id = Column(String, unique=True, index=True, nullable=True)
    hashed_password = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )
    
    # Password reset
    password_reset_token_hash = Column(String, nullable=True)
    password_reset_expires_at = Column(DateTime, nullable=True)

    # Email preferences
    daily_briefing_enabled = Column(Boolean, default=True, nullable=False, server_default='true')
    weekly_digest_enabled = Column(Boolean, default=True, nullable=False, server_default='true')
    item_reminders_enabled = Column(Boolean, default=True, nullable=False, server_default='true')

    # IANA timezone (e.g. "Asia/Kolkata"); used to interpret relative reminder times.
    timezone = Column(String(64), nullable=False, server_default="UTC")

    # Admin / account status
    is_admin = Column(Boolean, default=False, nullable=False, server_default='false')
    is_suspended = Column(Boolean, default=False, nullable=False, server_default='false')

    # Subscription / billing
    plan = Column(String(20), nullable=False, server_default="free")
    plan_expires_at = Column(DateTime(timezone=True), nullable=True)
    lms_customer_id = Column(String(64), nullable=True, unique=True, index=True)
    lms_subscription_id = Column(String(64), nullable=True, unique=True, index=True)
    lms_variant_id = Column(String(64), nullable=True)
    subscription_status = Column(String(20), nullable=True)
    subscription_canceled_at = Column(DateTime(timezone=True), nullable=True)
    items_this_month = Column(Integer, nullable=False, server_default="0")
    chat_messages_this_month = Column(Integer, nullable=False, server_default="0")
    usage_reset_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # Relationships
    items = relationship("Item", back_populates="owner", cascade="all, delete-orphan")
    chat_sessions = relationship("ChatSession", back_populates="user", cascade="all, delete-orphan")
    memories = relationship("UserMemory", back_populates="user", cascade="all, delete-orphan")
    telegram_link = relationship("TelegramLink", back_populates="owner", uselist=False, cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User {self.email}>"
