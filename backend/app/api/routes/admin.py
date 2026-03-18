"""
Admin routes for MindStash

All endpoints require admin privileges.
Guards: admin cannot act on themselves or other admins.
"""
import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy import func, distinct
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.rate_limit import user_limiter
from app.models.user import User
from app.models.activity_log import ActivityLog
from app.models.analytics import AnalyticsEvent
from app.schemas.user import AdminUserResponse, AdminUserUpdate, AdminUserListResponse, AdminUserInfoResponse
from app.schemas.activity import ActivityLogListResponse
from app.schemas.analytics import (
    AnalyticsSummaryResponse,
    AnalyticsEventListResponse,
    AnalyticsEventResponse,
    TopPage,
)
from app.api.dependencies import require_admin

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Admin"])


def _get_target_user(user_id: str, db: Session, current_admin: User) -> User:
    """Fetch target user and guard against self-action and acting on other admins."""
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if str(target.id) == str(current_admin.id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot perform this action on your own account")
    if target.is_admin:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot perform this action on another admin")
    return target


@router.get("/users", response_model=AdminUserListResponse)
@user_limiter.limit("100/hour")
def list_users(
    request: Request,
    page: int = 1,
    page_size: int = 20,
    search: str = "",
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """List all users with optional search and pagination."""
    query = db.query(User)

    if search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            (User.email.ilike(term)) | (User.name.ilike(term))
        )

    total = query.count()
    users = query.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return AdminUserListResponse(
        users=users,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.patch("/users/{user_id}", response_model=AdminUserResponse)
@user_limiter.limit("50/hour")
def edit_user(
    request: Request,
    user_id: str,
    data: AdminUserUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Edit a user's name and/or email."""
    target = _get_target_user(user_id, db, current_admin)

    if data.email is not None and data.email != target.email:
        existing = db.query(User).filter(User.email == data.email).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already in use")
        target.email = data.email

    if data.name is not None:
        target.name = data.name

    db.commit()
    db.refresh(target)
    logger.info(f"Admin {current_admin.email} edited user {target.email}")
    return target


@router.post("/users/{user_id}/suspend", response_model=AdminUserResponse)
@user_limiter.limit("50/hour")
def suspend_user(
    request: Request,
    user_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Suspend a user account."""
    target = _get_target_user(user_id, db, current_admin)
    target.is_suspended = True
    db.commit()
    db.refresh(target)
    logger.info(f"Admin {current_admin.email} suspended user {target.email}")
    return target


@router.post("/users/{user_id}/unsuspend", response_model=AdminUserResponse)
@user_limiter.limit("50/hour")
def unsuspend_user(
    request: Request,
    user_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Unsuspend a user account."""
    target = _get_target_user(user_id, db, current_admin)
    target.is_suspended = False
    db.commit()
    db.refresh(target)
    logger.info(f"Admin {current_admin.email} unsuspended user {target.email}")
    return target


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
@user_limiter.limit("20/hour")
def delete_user(
    request: Request,
    user_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Delete a user account and all their data."""
    from app.services.lemonsqueezy_service import cancel_subscription_for_deletion
    target = _get_target_user(user_id, db, current_admin)
    email = target.email
    cancel_subscription_for_deletion(target)
    db.delete(target)
    db.commit()
    logger.info(f"Admin {current_admin.email} deleted user {email}")


@router.get("/users/{user_id}/info", response_model=AdminUserInfoResponse)
@user_limiter.limit("200/hour")
def get_user_info(
    request: Request,
    user_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Get detailed info for a user (subscription, usage, auth method)."""
    request.state.user = current_admin
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return AdminUserInfoResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        created_at=user.created_at,
        is_admin=user.is_admin,
        is_suspended=user.is_suspended,
        auth_method="google" if user.google_id else "email",
        plan=user.plan,
        subscription_status=user.subscription_status,
        plan_expires_at=user.plan_expires_at,
        items_this_month=user.items_this_month or 0,
        chat_messages_this_month=user.chat_messages_this_month or 0,
        usage_reset_at=user.usage_reset_at,
    )


@router.get("/users/{user_id}/activity", response_model=ActivityLogListResponse)
@user_limiter.limit("100/hour")
def get_user_activity(
    request: Request,
    user_id: str,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Get paginated activity log for any user (admin-only)."""
    request.state.user = current_admin

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    query = db.query(ActivityLog).filter(ActivityLog.user_id == user_id)
    total = query.count()
    logs = (
        query.order_by(ActivityLog.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return ActivityLogListResponse(logs=logs, total=total, page=page, page_size=page_size)


# ---------------------------------------------------------------------------
# Analytics endpoints
# ---------------------------------------------------------------------------

@router.get("/analytics/summary", response_model=AnalyticsSummaryResponse)
@user_limiter.limit("100/hour")
def get_analytics_summary(
    request: Request,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Return aggregated analytics metrics (admin only)."""
    request.state.user = current_admin

    total_events = db.query(func.count(AnalyticsEvent.id)).scalar() or 0

    today_start = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    today_events = (
        db.query(func.count(AnalyticsEvent.id))
        .filter(AnalyticsEvent.created_at >= today_start)
        .scalar()
        or 0
    )

    unique_ips = (
        db.query(func.count(distinct(AnalyticsEvent.ip_address))).scalar() or 0
    )
    unique_countries = (
        db.query(func.count(distinct(AnalyticsEvent.country_code)))
        .filter(AnalyticsEvent.country_code.isnot(None))
        .scalar()
        or 0
    )

    today_unique_ips = (
        db.query(func.count(distinct(AnalyticsEvent.ip_address)))
        .filter(AnalyticsEvent.created_at >= today_start)
        .scalar()
        or 0
    )
    today_unique_countries = (
        db.query(func.count(distinct(AnalyticsEvent.country_code)))
        .filter(
            AnalyticsEvent.created_at >= today_start,
            AnalyticsEvent.country_code.isnot(None),
        )
        .scalar()
        or 0
    )

    # Top pages — only page_view events with a non-null page
    page_rows = (
        db.query(AnalyticsEvent.page, func.count(AnalyticsEvent.id).label("cnt"))
        .filter(
            AnalyticsEvent.event_type == "page_view",
            AnalyticsEvent.page.isnot(None),
        )
        .group_by(AnalyticsEvent.page)
        .order_by(func.count(AnalyticsEvent.id).desc())
        .limit(10)
        .all()
    )
    page_view_total = sum(r.cnt for r in page_rows) or 1
    top_pages = [
        TopPage(page=r.page, count=r.cnt, pct=round(r.cnt / page_view_total * 100, 1))
        for r in page_rows
    ]

    # Event type breakdown
    type_rows = (
        db.query(AnalyticsEvent.event_type, func.count(AnalyticsEvent.id).label("cnt"))
        .group_by(AnalyticsEvent.event_type)
        .all()
    )
    event_type_breakdown = {r.event_type: r.cnt for r in type_rows}

    return AnalyticsSummaryResponse(
        total_events=total_events,
        today_events=today_events,
        unique_ips=unique_ips,
        unique_countries=unique_countries,
        today_unique_ips=today_unique_ips,
        today_unique_countries=today_unique_countries,
        top_pages=top_pages,
        event_type_breakdown=event_type_breakdown,
    )


@router.get("/analytics/events", response_model=AnalyticsEventListResponse)
@user_limiter.limit("100/hour")
def get_analytics_events(
    request: Request,
    page: int = 1,
    page_size: int = 50,
    event_type: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Return paginated analytics events (admin only)."""
    request.state.user = current_admin

    query = db.query(AnalyticsEvent)

    if event_type:
        query = query.filter(AnalyticsEvent.event_type == event_type)

    if date_from:
        try:
            df = datetime.fromisoformat(date_from).replace(tzinfo=timezone.utc)
            query = query.filter(AnalyticsEvent.created_at >= df)
        except ValueError:
            pass

    if date_to:
        try:
            dt = datetime.fromisoformat(date_to).replace(tzinfo=timezone.utc)
            query = query.filter(AnalyticsEvent.created_at <= dt)
        except ValueError:
            pass

    total = query.count()
    events = (
        query.order_by(AnalyticsEvent.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return AnalyticsEventListResponse(
        events=events, total=total, page=page, page_size=page_size
    )
