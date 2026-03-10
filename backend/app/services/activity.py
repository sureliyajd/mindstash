"""
Activity logging service — fire-and-forget, never raises.
"""
import logging
from datetime import datetime

from app.models.activity_log import ActivityLog

logger = logging.getLogger(__name__)


def log_activity(
    db,
    user_id,
    action: str,
    source: str = "web",
    resource_type: str = None,
    resource_id=None,
    details: dict = None,
):
    """
    Append an activity log entry.  Never raises — any DB error is swallowed
    so the caller is never affected.
    """
    try:
        entry = ActivityLog(
            user_id=user_id,
            action=action,
            source=source,
            resource_type=resource_type,
            resource_id=str(resource_id) if resource_id else None,
            details=details,
            created_at=datetime.utcnow(),
        )
        db.add(entry)
        db.commit()
    except Exception as exc:
        logger.warning(f"log_activity failed (action={action}): {exc}")
        try:
            db.rollback()
        except Exception:
            pass
