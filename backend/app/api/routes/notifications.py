"""
Notification routes for MindStash - Process notifications and send digests

Endpoints:
- POST /process - Process and send pending notifications (cron job)
- POST /send-digests - Send weekly digests to all users (cron job)
- GET /upcoming - Get upcoming notifications for current user
- GET /digest-preview - Preview weekly digest for current user

Rate Limits:
- Process/Digests: Protected by API key (no rate limit for cron)
- User endpoints: 100/hour
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, Request, Header
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID

from app.core.database import get_db
from app.core.config import settings
from app.core.rate_limit import user_limiter
from app.api.dependencies import get_current_user
from app.models.user import User
from app.services.notifications.sender import (
    process_notifications,
    get_upcoming_notifications
)
from app.services.notifications.digest import (
    send_weekly_digests,
    get_digest_preview
)

router = APIRouter(tags=["notifications"])


def verify_cron_api_key(x_api_key: Optional[str] = Header(None)):
    """
    Verify API key for cron job endpoints.

    In production, set CRON_API_KEY in environment variables.
    For development, this check is bypassed if CRON_API_KEY is not set.
    """
    cron_key = getattr(settings, "CRON_API_KEY", None)

    # If no cron key is configured (dev mode), allow access
    if not cron_key:
        return True

    # In production, verify the key
    if x_api_key != cron_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key"
        )

    return True


@router.post("/process")
def process_pending_notifications(
    request: Request,
    db: Session = Depends(get_db),
    _: bool = Depends(verify_cron_api_key)
):
    """
    Process and send pending notifications.

    This endpoint should be called by a cron job every 15 minutes.
    Requires X-API-Key header in production.

    Returns:
        Dict with processing results:
        {
            "total_processed": int,
            "successful": int,
            "failed": int,
            "items": list of item IDs
        }
    """
    result = process_notifications(db)

    return {
        "status": "success",
        "message": f"Processed {result['total_processed']} notifications",
        "data": result
    }


@router.post("/send-digests")
def send_weekly_digests_endpoint(
    request: Request,
    db: Session = Depends(get_db),
    _: bool = Depends(verify_cron_api_key)
):
    """
    Send weekly digests to all users.

    This endpoint should be called by a cron job every Sunday at 9 AM.
    Requires X-API-Key header in production.

    Returns:
        Dict with results:
        {
            "total_users": int,
            "digests_sent": int,
            "skipped": int
        }
    """
    result = send_weekly_digests(db)

    return {
        "status": "success",
        "message": f"Sent {result['digests_sent']} digests",
        "data": result
    }


@router.get("/upcoming")
@user_limiter.limit("100/hour")
def get_upcoming_notifications_endpoint(
    request: Request,
    days_ahead: int = Query(7, ge=1, le=30, description="Days to look ahead"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get upcoming notifications for the current user.

    Rate Limit: 100 requests per hour per user

    Args:
        request: FastAPI request object (required for rate limiting)
        days_ahead: Number of days to look ahead (1-30, default 7)
        current_user: Authenticated user
        db: Database session

    Returns:
        List of upcoming notification items
    """
    request.state.user = current_user

    items = get_upcoming_notifications(str(current_user.id), db, days_ahead)

    return {
        "status": "success",
        "count": len(items),
        "days_ahead": days_ahead,
        "items": [
            {
                "id": str(item.id),
                "content": item.content,
                "category": item.category,
                "notification_date": item.notification_date.isoformat() if item.notification_date else None,
                "next_notification_at": item.next_notification_at.isoformat() if item.next_notification_at else None,
                "notification_frequency": item.notification_frequency,
                "summary": item.summary
            }
            for item in items
        ]
    }


@router.get("/digest-preview")
@user_limiter.limit("100/hour")
def get_digest_preview_endpoint(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a preview of the current user's weekly digest.

    Rate Limit: 100 requests per hour per user

    Useful for showing users what they'll receive in their next digest.

    Args:
        request: FastAPI request object (required for rate limiting)
        current_user: Authenticated user
        db: Database session

    Returns:
        Dict with digest preview data
    """
    request.state.user = current_user

    preview = get_digest_preview(current_user.id, db)

    return {
        "status": "success",
        "data": preview
    }
