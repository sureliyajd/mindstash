"""
Pydantic schemas for chat endpoints
"""
from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    session_id: Optional[str] = None


class ChatMessageResponse(BaseModel):
    id: str
    role: str
    content: Optional[str] = None
    tool_calls: Optional[List[dict]] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ChatSessionResponse(BaseModel):
    id: str
    title: Optional[str] = None
    agent_type: str
    is_active: bool
    created_at: datetime
    last_active_at: datetime
    message_count: int = 0

    class Config:
        from_attributes = True


class ChatSessionListResponse(BaseModel):
    sessions: List[ChatSessionResponse]
    total: int


class ConfirmationRequest(BaseModel):
    confirmation_id: str
    confirmed: bool


class PendingConfirmationResponse(BaseModel):
    has_pending: bool
    confirmation_id: Optional[str] = None
    tool: Optional[str] = None
    tool_input: Optional[dict] = None
    description: Optional[str] = None
