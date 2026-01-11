"""
Pydantic schemas for Item (MindStash 12-category system)
"""
from datetime import datetime
from uuid import UUID
from typing import Optional, Dict, Any, List, Literal
from pydantic import BaseModel, Field, validator

# MindStash 12 Categories
VALID_CATEGORIES = Literal[
    "read",     # 📚 Articles, blogs, documentation
    "watch",    # 🎥 Videos, courses, talks
    "ideas",    # 💡 Business, product, creative
    "tasks",    # ✅ Todos, action items
    "people",   # 👤 Follow-ups, contacts
    "notes",    # 📝 Reference, quotes, facts
    "goals",    # 🎯 Long-term objectives
    "buy",      # 🛒 Shopping, products
    "places",   # 📍 Travel, locations
    "journal",  # 💭 Personal thoughts
    "learn",    # 🎓 Skills, courses
    "save"      # 🔖 General bookmarks
]

VALID_PRIORITIES = Literal["low", "medium", "high"]
VALID_TIME_SENSITIVITIES = Literal["immediate", "this_week", "review_weekly", "reference"]
VALID_URGENCIES = Literal["low", "medium", "high"]
VALID_INTENTS = Literal["learn", "task", "reminder", "idea", "reflection", "reference"]
VALID_TIME_CONTEXTS = Literal["immediate", "next_week", "someday", "conditional", "date"]
VALID_RESURFACE_STRATEGIES = Literal["time_based", "contextual", "weekly_review", "manual"]
VALID_NOTIFICATION_FREQUENCIES = Literal["once", "daily", "weekly", "monthly", "never"]


class ItemBase(BaseModel):
    """Base item schema"""
    content: str = Field(..., max_length=500, description="Item content (max 500 characters)")
    url: Optional[str] = None


class ItemCreate(ItemBase):
    """Schema for creating an item"""

    @validator('content')
    def validate_content(cls, v):
        """Ensure content doesn't exceed 500 characters"""
        if len(v) > 500:
            raise ValueError('Content cannot exceed 500 characters')
        return v.strip()


class ItemUpdate(BaseModel):
    """Schema for updating an item (all fields optional)"""
    content: Optional[str] = Field(None, max_length=500)
    url: Optional[str] = None
    category: Optional[VALID_CATEGORIES] = None
    tags: Optional[List[str]] = None
    priority: Optional[VALID_PRIORITIES] = None
    urgency: Optional[VALID_URGENCIES] = None
    intent: Optional[VALID_INTENTS] = None
    action_required: Optional[bool] = None
    time_context: Optional[VALID_TIME_CONTEXTS] = None
    resurface_strategy: Optional[VALID_RESURFACE_STRATEGIES] = None
    summary: Optional[str] = Field(None, max_length=200)

    # Notification fields
    notification_date: Optional[datetime] = None
    notification_frequency: Optional[VALID_NOTIFICATION_FREQUENCIES] = None
    notification_enabled: Optional[bool] = None

    # Completion tracking
    is_completed: Optional[bool] = None

    @validator('content')
    def validate_content(cls, v):
        """Ensure content doesn't exceed 500 characters if provided"""
        if v is not None and len(v) > 500:
            raise ValueError('Content cannot exceed 500 characters')
        return v.strip() if v else v

    @validator('tags')
    def validate_tags(cls, v):
        """Ensure tags is a list of strings"""
        if v is not None:
            return [tag.strip().lower() for tag in v if tag.strip()]
        return v


class ItemResponse(ItemBase):
    """Schema for item response (12-category system)"""
    id: UUID
    user_id: UUID
    category: Optional[str] = Field(None, description="One of 12 categories")
    tags: Optional[List[str]] = Field(None, description="Tags like ['productivity', 'tech']")
    summary: Optional[str] = Field(None, description="AI-generated brief description")
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0, description="AI confidence score 0.0-1.0")
    priority: Optional[str] = Field(None, description="Priority: low, medium, or high")
    time_sensitivity: Optional[str] = Field(None, description="Time sensitivity: immediate, this_week, review_weekly, or reference")
    ai_metadata: Optional[Dict[str, Any]] = Field(None, description="Full AI response with reasoning")

    # AI intelligence signals (deeper reasoning)
    intent: Optional[str] = Field(None, description="Intent: learn, task, reminder, idea, reflection, or reference")
    action_required: Optional[bool] = Field(None, description="Does this need user action?")
    urgency: Optional[str] = Field(None, description="Urgency: low, medium, or high")
    time_context: Optional[str] = Field(None, description="Time context: immediate, next_week, someday, conditional, or date")
    resurface_strategy: Optional[str] = Field(None, description="Resurface strategy: time_based, contextual, weekly_review, or manual")
    suggested_bucket: Optional[str] = Field(None, description="Suggested bucket: Today, Learn Later, Ideas, Reminders, or Insights")

    # Smart resurfacing tracking
    last_surfaced_at: Optional[datetime] = Field(None, description="When item was last shown in Today module")

    # Notification system fields
    notification_date: Optional[datetime] = Field(None, description="AI-predicted or user-set notification date")
    notification_frequency: Optional[str] = Field(None, description="Notification frequency: once, daily, weekly, monthly, never")
    next_notification_at: Optional[datetime] = Field(None, description="When next notification should be sent")
    last_notified_at: Optional[datetime] = Field(None, description="When last notification was sent")
    notification_enabled: Optional[bool] = Field(True, description="Whether notifications are enabled for this item")

    # Completion tracking
    is_completed: Optional[bool] = Field(False, description="Whether item has been marked as completed")
    completed_at: Optional[datetime] = Field(None, description="When item was marked complete")

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ItemListResponse(BaseModel):
    """Schema for paginated item list"""
    items: list[ItemResponse]
    total: int
    page: int
    page_size: int


class MarkSurfacedRequest(BaseModel):
    """Schema for marking items as surfaced (shown in Today module)"""
    item_ids: List[UUID] = Field(..., description="List of item IDs to mark as surfaced", min_length=1, max_length=100)


class MarkSurfacedResponse(BaseModel):
    """Response for mark-surfaced endpoint"""
    updated_count: int = Field(..., description="Number of items updated")
    message: str = Field(..., description="Success message")
