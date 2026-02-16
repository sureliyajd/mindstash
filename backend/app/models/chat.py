"""
Chat and memory database models for MindStash AI agent
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Float, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.core.database import Base


class ChatSession(Base):
    """Chat session model for persistent conversations"""

    __tablename__ = "chat_sessions"

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
    title = Column(Text, nullable=True)
    agent_type = Column(String, default="assistant", nullable=False)
    metadata_ = Column("metadata", JSONB, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )
    last_active_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
        index=True
    )

    # Relationships
    user = relationship("User", back_populates="chat_sessions")
    messages = relationship(
        "ChatMessage",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="ChatMessage.created_at"
    )

    def __repr__(self):
        return f"<ChatSession {self.id} - {self.title or 'Untitled'}>"


class ChatMessage(Base):
    """Chat message model for conversation history"""

    __tablename__ = "chat_messages"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    session_id = Column(
        UUID(as_uuid=True),
        ForeignKey("chat_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    role = Column(String, nullable=False)  # 'user', 'assistant', 'tool_result'
    content = Column(Text, nullable=True)
    tool_calls = Column(JSONB, nullable=True)  # [{name, input, id}]
    tool_results = Column(JSONB, nullable=True)  # [{tool_use_id, content}]
    metadata_ = Column("metadata", JSONB, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationship
    session = relationship("ChatSession", back_populates="messages")

    def __repr__(self):
        return f"<ChatMessage {self.id} - {self.role}>"


class UserMemory(Base):
    """User memory model for learned preferences and patterns (Phase 4)"""

    __tablename__ = "user_memories"

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
    memory_type = Column(String, nullable=False)  # 'preference', 'pattern', 'fact', 'instruction'
    content = Column(Text, nullable=False)
    confidence = Column(Float, default=0.5)
    source = Column(String, nullable=True)  # 'observed', 'user_stated', 'inferred'
    metadata_ = Column("metadata", JSONB, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    # Relationship
    user = relationship("User", back_populates="memories")

    def __repr__(self):
        return f"<UserMemory {self.id} - {self.memory_type}>"
