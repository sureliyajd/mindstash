"""
Item database model
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.core.database import Base


class Item(Base):
    """Item model for storing user's captured content"""
    
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
    content = Column(Text, nullable=False)
    url = Column(Text, nullable=True)
    
    # AI-generated fields (populated in Week 3)
    ai_category = Column(String, nullable=True, index=True)
    ai_metadata = Column(JSONB, nullable=True)  # Flexible JSON for AI outputs
    
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
        return f"<Item {self.id} - {self.ai_category or 'Uncategorized'}>"
