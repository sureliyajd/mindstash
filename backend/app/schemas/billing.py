"""
Pydantic schemas for billing and subscription endpoints.
"""
from pydantic import BaseModel
from typing import Optional, Dict
from datetime import datetime


class BillingUsage(BaseModel):
    items_this_month: int
    items_limit: Optional[int]
    chat_messages_this_month: int
    chat_messages_limit: Optional[int]


class BillingFeatures(BaseModel):
    semantic_search: bool
    telegram: bool
    daily_briefing: bool
    weekly_digest: bool


class BillingStatusResponse(BaseModel):
    plan: str
    subscription_status: Optional[str]
    plan_expires_at: Optional[datetime]
    subscription_canceled_at: Optional[datetime]
    usage: BillingUsage
    features: BillingFeatures
    payments_configured: bool
    variant_ids: Optional[Dict[str, Optional[str]]]


class CheckoutRequest(BaseModel):
    variant_id: str
    success_url: str = "/billing?success=true"
    cancel_url: str = "/billing?canceled=true"


class CheckoutResponse(BaseModel):
    checkout_url: str


class PortalResponse(BaseModel):
    portal_url: str
