"""
Pydantic schemas for analytics endpoints.
"""
from __future__ import annotations

from datetime import datetime
from typing import Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class TrackEventRequest(BaseModel):
    event_type: str = Field(..., max_length=50)
    page: Optional[str] = Field(None, max_length=255)
    referrer: Optional[str] = Field(None, max_length=500)


class AnalyticsEventResponse(BaseModel):
    id: UUID
    event_type: str
    page: Optional[str]
    ip_address: Optional[str]
    country: Optional[str]
    city: Optional[str]
    region: Optional[str]
    country_code: Optional[str]
    user_agent: Optional[str]
    referrer: Optional[str]
    user_id: Optional[UUID]
    created_at: datetime

    model_config = {"from_attributes": True}


class TopPage(BaseModel):
    page: str
    count: int
    pct: float


class AnalyticsSummaryResponse(BaseModel):
    total_events: int
    today_events: int
    unique_ips: int
    unique_countries: int
    top_pages: List[TopPage]
    event_type_breakdown: Dict[str, int]


class AnalyticsEventListResponse(BaseModel):
    events: List[AnalyticsEventResponse]
    total: int
    page: int
    page_size: int
