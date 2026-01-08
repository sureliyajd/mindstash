"""
Item database model for MindStash 12-category system
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Float
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.core.database import Base


class Item(Base):
    """Item model for storing user's captured content (max 500 chars)"""

    __tablename__ = "items"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    content = Column(Text, nullable=False)  # Max 500 chars enforced in schema
    url = Column(Text, nullable=True)

    # AI-generated fields (12-category system)
    category = Column(String, nullable=True, index=True)  # One of 12 categories
    tags = Column(JSONB, nullable=True)  # ["tag1", "tag2", "tag3"]
    summary = Column(Text, nullable=True)  # AI-generated brief description
    confidence = Column(Float, nullable=True)  # 0.0-1.0
    priority = Column(String, nullable=True)  # "low", "medium", "high"
    time_sensitivity = Column(String, nullable=True)  # "immediate", "this_week", "review_weekly", "reference"
    ai_metadata = Column(JSONB, nullable=True)  # Full AI response with reasoning

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    # Relationship to user
    owner = relationship("User", back_populates="items")

    def __repr__(self):
        return f"<Item {self.id} - {self.category or 'Uncategorized'}>"
