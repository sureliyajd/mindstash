"""
Notification routes for MindStash - Process notifications and send digests

Endpoints:
- POST /send-briefings - Send daily AI briefings to all users (cron job)
- POST /process - Process and send pending notifications (cron job)
- POST /send-digests - Send weekly digests to all users (cron job)
- GET /upcoming - Get upcoming notifications for current user
- GET /digest-preview - Preview weekly digest for current user

Rate Limits:
- Process/Briefings/Digests: Protected by API key (no rate limit for cron)
- User endpoints: 100/hour
"""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request, Header
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID

from app.core.database import get_db
from app.core.config import settings
from app.core.rate_limit import user_limiter
from app.core.security import decode_email_action_token, decode_unsubscribe_token
from app.api.dependencies import get_current_user
from app.models.item import Item
from app.models.user import User
from app.schemas.user import EmailPreferences, EmailPreferencesUpdate
from app.services.notifications.sender import (
    process_notifications,
    get_upcoming_notifications,
    snooze_notification,
    disable_notification,
)
from app.services.notifications.digest import (
    send_weekly_digests,
    get_digest_preview
)
from app.services.notifications.daily_briefing import send_daily_briefings

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


@router.post("/send-briefings")
def send_daily_briefings_endpoint(
    request: Request,
    db: Session = Depends(get_db),
    _: bool = Depends(verify_cron_api_key)
):
    """
    Send daily AI briefings to all users.

    This endpoint should be called by a cron job every day at 8 AM.
    Generates personalized briefings via AI agent for each user.
    Requires X-API-Key header in production.

    Returns:
        Dict with results:
        {
            "total_users": int,
            "briefings_sent": int,
            "failed": int
        }
    """
    result = send_daily_briefings(db)

    return {
        "status": "success",
        "message": f"Sent {result['briefings_sent']} daily briefings",
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


@router.get("/preferences", response_model=EmailPreferences)
@user_limiter.limit("100/hour")
def get_email_preferences(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get email notification preferences for the current user."""
    request.state.user = current_user
    return current_user


@router.patch("/preferences", response_model=EmailPreferences)
@user_limiter.limit("100/hour")
def update_email_preferences(
    request: Request,
    body: EmailPreferencesUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update email notification preferences for the current user."""
    request.state.user = current_user
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user


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


def _email_action_html(title: str, message: str, success: bool = True) -> str:
    """Build a simple HTML confirmation page for email actions."""
    color = "#10b981" if success else "#ef4444"
    icon = "&#10003;" if success else "&#10007;"
    return f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{title} — MindStash</title>
        <style>
            * {{ margin: 0; padding: 0; box-sizing: border-box; }}
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background: #f3f4f6; display: flex; align-items: center; justify-content: center;
                    min-height: 100vh; padding: 20px; }}
            .card {{ background: white; border-radius: 16px; padding: 48px 36px; max-width: 440px;
                     width: 100%; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }}
            .icon {{ width: 64px; height: 64px; border-radius: 50%; background: {color};
                     color: white; font-size: 32px; line-height: 64px; margin: 0 auto 20px; }}
            h1 {{ font-size: 20px; color: #111827; margin-bottom: 8px; }}
            p {{ font-size: 15px; color: #6b7280; line-height: 1.6; }}
            .cta {{ display: inline-block; margin-top: 24px; padding: 12px 28px; background: #EA7B7B;
                    color: white; text-decoration: none; border-radius: 10px; font-weight: 600;
                    font-size: 14px; }}
            .footer {{ margin-top: 32px; font-size: 12px; color: #d1d5db; }}
        </style>
    </head>
    <body>
        <div class="card">
            <div class="icon">{icon}</div>
            <h1>{title}</h1>
            <p>{message}</p>
            <a href="{settings.APP_URL}/dashboard" class="cta">Open MindStash &rarr;</a>
            <p class="footer">MindStash &middot; Never lose a thought again</p>
        </div>
    </body>
    </html>
    """


@router.get("/email-action", response_class=HTMLResponse)
def handle_email_action(
    token: str = Query(..., description="Signed JWT token from email"),
    db: Session = Depends(get_db),
):
    """
    Handle one-click actions from reminder emails (Mark Done, Snooze, Stop).

    No authentication required — the signed JWT token contains the item_id,
    user_id, and action. Token expires after 7 days.

    Returns an HTML confirmation page (opened in the user's browser from email).
    """
    # Decode and verify token
    payload = decode_email_action_token(token)
    if not payload:
        return HTMLResponse(
            content=_email_action_html(
                "Link Expired",
                "This action link has expired or is invalid. Please open MindStash to manage your reminders.",
                success=False,
            ),
            status_code=400,
        )

    item_id = payload.get("item_id")
    user_id = payload.get("user_id")
    action = payload.get("action")

    if not all([item_id, user_id, action]):
        return HTMLResponse(
            content=_email_action_html(
                "Invalid Link",
                "This action link is malformed. Please open MindStash to manage your reminders.",
                success=False,
            ),
            status_code=400,
        )

    # Load the item and verify ownership
    item = db.query(Item).filter(Item.id == item_id, Item.user_id == user_id).first()
    if not item:
        return HTMLResponse(
            content=_email_action_html(
                "Item Not Found",
                "This item may have been deleted. Please open MindStash to check.",
                success=False,
            ),
            status_code=404,
        )

    # Perform the action
    if action == "complete":
        item.is_completed = True
        item.completed_at = datetime.utcnow()
        item.notification_enabled = False
        item.next_notification_at = None
        db.commit()
        return HTMLResponse(
            content=_email_action_html(
                "Marked as Done!",
                f'"{item.content[:80]}..." has been marked complete. No more reminders for this item.',
            )
        )

    elif action == "snooze":
        from datetime import timedelta
        snooze_notification(item, db, snooze_duration=timedelta(days=7))
        return HTMLResponse(
            content=_email_action_html(
                "Snoozed for 7 Days",
                f'"{item.content[:80]}..." has been snoozed. You\'ll be reminded again in 7 days.',
            )
        )

    elif action == "stop":
        disable_notification(item, db)
        return HTMLResponse(
            content=_email_action_html(
                "Reminders Stopped",
                f'Notifications for "{item.content[:80]}..." have been turned off. You can re-enable them from the dashboard.',
            )
        )

    else:
        return HTMLResponse(
            content=_email_action_html(
                "Unknown Action",
                "This action is not recognized. Please open MindStash to manage your reminders.",
                success=False,
            ),
            status_code=400,
        )


@router.get("/unsubscribe", response_class=HTMLResponse)
def handle_unsubscribe(
    token: str = Query(..., description="Signed JWT unsubscribe token from email"),
    db: Session = Depends(get_db),
):
    """
    One-click unsubscribe from email notifications.

    No authentication required — the signed JWT token contains the user_id
    and email_type. Token expires after 30 days.

    Returns an HTML confirmation page.
    """
    payload = decode_unsubscribe_token(token)
    if not payload:
        return HTMLResponse(
            content=_email_action_html(
                "Link Expired",
                "This unsubscribe link has expired or is invalid. "
                "Please log in to MindStash and go to Profile > Notifications to manage your preferences.",
                success=False,
            ),
            status_code=400,
        )

    user_id = payload.get("user_id")
    email_type = payload.get("email_type")

    if not user_id or not email_type:
        return HTMLResponse(
            content=_email_action_html(
                "Invalid Link",
                "This unsubscribe link is malformed.",
                success=False,
            ),
            status_code=400,
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return HTMLResponse(
            content=_email_action_html(
                "Account Not Found",
                "No account found for this unsubscribe link.",
                success=False,
            ),
            status_code=404,
        )

    email_type_labels = {
        "weekly_digest": ("weekly_digest_enabled", "Weekly Digest"),
        "daily_briefing": ("daily_briefing_enabled", "Daily Briefing"),
        "item_reminders": ("item_reminders_enabled", "Item Reminders"),
    }

    if email_type not in email_type_labels:
        return HTMLResponse(
            content=_email_action_html(
                "Unknown Email Type",
                "This unsubscribe link is not recognized.",
                success=False,
            ),
            status_code=400,
        )

    field, label = email_type_labels[email_type]
    setattr(user, field, False)
    db.commit()

    return HTMLResponse(
        content=_email_action_html(
            "Unsubscribed",
            f"You've been unsubscribed from {label} emails. "
            f"You can re-enable them anytime from your profile settings.",
        )
    )
