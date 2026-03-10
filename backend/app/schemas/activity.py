from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel


class ActivityLogResponse(BaseModel):
    id: UUID
    action: str
    source: str
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    details: Optional[dict] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ActivityLogListResponse(BaseModel):
    logs: List[ActivityLogResponse]
    total: int
    page: int
    page_size: int
