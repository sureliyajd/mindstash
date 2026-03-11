"""
Plan enforcement service for MindStash subscription tiers.
"""
from datetime import datetime, timezone
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.core.plans import PLAN_FREE, PLAN_LIMITS, get_plan_limit, plan_has_feature


def get_user_plan(user) -> str:
    """Return effective plan, degrading to free if subscription expired."""
    try:
        if user.plan == PLAN_FREE:
            return PLAN_FREE
        if user.plan_expires_at and user.plan_expires_at < datetime.now(timezone.utc):
            return PLAN_FREE
        return user.plan or PLAN_FREE
    except Exception:
        return PLAN_FREE


def reset_monthly_usage_if_needed(user, db: Session) -> None:
    """Lazily reset monthly counters if we're in a new month."""
    now = datetime.now(timezone.utc)
    reset_at = user.usage_reset_at
    if reset_at is None or reset_at.year != now.year or reset_at.month != now.month:
        user.items_this_month = 0
        user.chat_messages_this_month = 0
        user.usage_reset_at = now
        db.add(user)
        db.commit()


def check_item_limit(user, db: Session) -> None:
    """Raise 402 if user is at their monthly item limit."""
    reset_monthly_usage_if_needed(user, db)
    plan = get_user_plan(user)
    limit = get_plan_limit(plan, "items_per_month")
    if limit is not None and user.items_this_month >= limit:
        raise HTTPException(
            status_code=402,
            detail={
                "detail": f"Monthly item limit reached ({limit} items). Upgrade to capture more.",
                "code": "plan_limit_exceeded",
                "limit_type": "items_per_month",
                "current_plan": plan,
                "upgrade_url": "/billing",
            },
        )


def increment_item_count(user, db: Session) -> None:
    """Increment the monthly item counter."""
    try:
        user.items_this_month = (user.items_this_month or 0) + 1
        db.add(user)
        db.commit()
    except Exception:
        db.rollback()


def check_chat_limit(user, db: Session) -> None:
    """Raise 402 if user is at their monthly chat message limit."""
    reset_monthly_usage_if_needed(user, db)
    plan = get_user_plan(user)
    limit = get_plan_limit(plan, "chat_messages_per_month")
    if limit is not None and user.chat_messages_this_month >= limit:
        raise HTTPException(
            status_code=402,
            detail={
                "detail": f"Monthly chat limit reached ({limit} messages). Upgrade to chat more.",
                "code": "plan_limit_exceeded",
                "limit_type": "chat_messages_per_month",
                "current_plan": plan,
                "upgrade_url": "/billing",
            },
        )


def increment_chat_count(user, db: Session) -> None:
    """Increment the monthly chat message counter."""
    try:
        user.chat_messages_this_month = (user.chat_messages_this_month or 0) + 1
        db.add(user)
        db.commit()
    except Exception:
        db.rollback()


def require_feature(user, feature: str) -> None:
    """Raise 402 if the user's plan doesn't include this feature."""
    plan = get_user_plan(user)
    if not plan_has_feature(plan, feature):
        feature_plan_map = {
            "telegram": "Starter",
            "daily_briefing": "Pro",
            "weekly_digest": "Starter",
            "semantic_search": "Pro",
        }
        required = feature_plan_map.get(feature, "a paid plan")
        raise HTTPException(
            status_code=402,
            detail={
                "detail": f"This feature requires {required} or higher.",
                "code": "feature_not_available",
                "feature": feature,
                "current_plan": plan,
                "upgrade_url": "/billing",
            },
        )
