"""
Notification services for MindStash.

This module provides:
- sender: Send notifications to users
- digest: Generate and send weekly digests
"""

from app.services.notifications.sender import (
    get_items_to_notify,
    send_notification,
    process_notifications
)
from app.services.notifications.digest import (
    get_pending_items_for_digest,
    generate_digest_email,
    send_weekly_digest_to_user,
    send_weekly_digests
)

__all__ = [
    "get_items_to_notify",
    "send_notification",
    "process_notifications",
    "get_pending_items_for_digest",
    "generate_digest_email",
    "send_weekly_digest_to_user",
    "send_weekly_digests"
]
