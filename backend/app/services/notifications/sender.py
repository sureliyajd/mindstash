"""
Notification Sender Service for MindStash.

This module handles:
- Getting items that need notifications
- Sending notifications (email/push)
- Updating notification tracking fields
- Processing recurring notifications
"""

from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.item import Item
from app.models.user import User


def get_items_to_notify(db: Session) -> List[Item]:
    """
    Get all items that need notification now.

    Returns items where:
    - notification_enabled = True
    - is_completed = False
    - next_notification_at <= now
    - next_notification_at is not None

    Args:
        db: Database session

    Returns:
        List of Item objects that need notifications
    """
    now = datetime.utcnow()

    items = db.query(Item).filter(
        Item.notification_enabled == True,
        Item.is_completed == False,
        Item.next_notification_at <= now,
        Item.next_notification_at.isnot(None)
    ).all()

    return items


def send_notification(item: Item, user: User, db: Session) -> bool:
    """
    Send notification for an item.

    Currently logs the notification. In production, this would:
    - Send email via SendGrid/Resend
    - Send push notification via web push
    - Send SMS via Twilio (future)

    After sending, updates:
    - last_notified_at to now
    - next_notification_at based on frequency
    - notification_enabled to False if frequency is "once"

    Args:
        item: The Item to send notification for
        user: The User who owns the item
        db: Database session

    Returns:
        True if notification was sent successfully
    """
    try:
        # TODO: Integrate with actual email service (SendGrid, Resend, etc.)
        # For now, just log the notification
        print(f"📧 NOTIFY {user.email}: {item.content[:50]}...")
        print(f"   Category: {item.category}")
        print(f"   Frequency: {item.notification_frequency}")

        # Update notification tracking
        item.last_notified_at = datetime.utcnow()

        # Calculate next notification based on frequency
        if item.notification_frequency == "once":
            # Stop after one notification
            item.notification_enabled = False
            item.next_notification_at = None
            print(f"   ✓ One-time notification complete, disabled future notifications")

        elif item.notification_frequency == "daily":
            item.next_notification_at = datetime.utcnow() + timedelta(days=1)
            print(f"   ✓ Next notification: {item.next_notification_at.isoformat()}")

        elif item.notification_frequency == "weekly":
            item.next_notification_at = datetime.utcnow() + timedelta(weeks=1)
            print(f"   ✓ Next notification: {item.next_notification_at.isoformat()}")

        elif item.notification_frequency == "monthly":
            item.next_notification_at = datetime.utcnow() + timedelta(days=30)
            print(f"   ✓ Next notification: {item.next_notification_at.isoformat()}")

        else:
            # Unknown frequency, disable notifications
            item.notification_enabled = False
            item.next_notification_at = None

        return True

    except Exception as e:
        print(f"❌ Failed to send notification for item {item.id}: {e}")
        return False


def process_notifications(db: Session) -> dict:
    """
    Process and send all pending notifications.

    This function should be called periodically (e.g., every 15 minutes)
    by a cron job or background scheduler.

    Args:
        db: Database session

    Returns:
        dict with processing results:
        {
            "total_processed": int,
            "successful": int,
            "failed": int,
            "items": list of item IDs
        }
    """
    print(f"\n🔔 Processing notifications at {datetime.utcnow().isoformat()}")

    items = get_items_to_notify(db)
    print(f"   Found {len(items)} items to notify")

    successful = 0
    failed = 0
    item_ids = []

    for item in items:
        # Get the user for this item
        user = db.query(User).filter(User.id == item.user_id).first()

        if not user:
            print(f"   ⚠️ User not found for item {item.id}")
            failed += 1
            continue

        if send_notification(item, user, db):
            successful += 1
            item_ids.append(str(item.id))
        else:
            failed += 1

    # Commit all changes
    db.commit()

    result = {
        "total_processed": len(items),
        "successful": successful,
        "failed": failed,
        "items": item_ids
    }

    print(f"   ✓ Processed: {successful} successful, {failed} failed")

    return result


def get_upcoming_notifications(
    user_id: str,
    db: Session,
    days_ahead: int = 7
) -> List[Item]:
    """
    Get upcoming notifications for a user within the specified number of days.

    Useful for showing users what notifications are scheduled.

    Args:
        user_id: UUID of the user
        db: Database session
        days_ahead: Number of days to look ahead (default 7)

    Returns:
        List of Item objects with upcoming notifications
    """
    now = datetime.utcnow()
    future_date = now + timedelta(days=days_ahead)

    items = db.query(Item).filter(
        Item.user_id == user_id,
        Item.notification_enabled == True,
        Item.is_completed == False,
        Item.next_notification_at.isnot(None),
        Item.next_notification_at >= now,
        Item.next_notification_at <= future_date
    ).order_by(Item.next_notification_at).all()

    return items


def snooze_notification(
    item: Item,
    db: Session,
    snooze_duration: timedelta = timedelta(hours=1)
) -> Item:
    """
    Snooze a notification by a specified duration.

    Args:
        item: The Item to snooze
        db: Database session
        snooze_duration: How long to snooze (default 1 hour)

    Returns:
        Updated Item
    """
    item.next_notification_at = datetime.utcnow() + snooze_duration
    db.commit()
    db.refresh(item)

    print(f"⏰ Snoozed notification for item {item.id} until {item.next_notification_at.isoformat()}")

    return item


def disable_notification(item: Item, db: Session) -> Item:
    """
    Disable notifications for an item.

    Args:
        item: The Item to disable notifications for
        db: Database session

    Returns:
        Updated Item
    """
    item.notification_enabled = False
    item.next_notification_at = None
    db.commit()
    db.refresh(item)

    print(f"🔕 Disabled notifications for item {item.id}")

    return item
