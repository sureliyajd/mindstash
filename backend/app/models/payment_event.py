"""
PaymentEvent model for tracking billing webhook events (Lemon Squeezy).
"""
import uuid
from sqlalchemy import Column, String, Integer, DateTime, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.core.database import Base


class PaymentEvent(Base):
    __tablename__ = "payment_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    event_id = Column(String(64), nullable=False, unique=True, index=True)
    event_type = Column(String(64), nullable=False)
    object_id = Column(String(64), nullable=True)
    amount_cents = Column(Integer, nullable=True)
    currency = Column(String(3), nullable=True)
    plan_keyword = Column(String(20), nullable=True)
    status = Column(String(20), nullable=True)
    raw_payload = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
