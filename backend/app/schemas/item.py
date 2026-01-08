"""
Pydantic schemas for Item
"""
from datetime import datetime
from uuid import UUID
from typing import Optional, Dict, Any
from pydantic import BaseModel


class ItemBase(BaseModel):
    """Base item schema"""
    content: str
    url: Optional[str] = None


class ItemCreate(ItemBase):
    """Schema for creating an item"""
    pass


class ItemUpdate(BaseModel):
    """Schema for updating an item"""
    content: Optional[str] = None
    url: Optional[str] = None


class ItemResponse(ItemBase):
    """Schema for item response"""
    id: UUID
    user_id: UUID
    ai_category: Optional[str] = None
    ai_metadata: Optional[Dict[str, Any]] = None
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
