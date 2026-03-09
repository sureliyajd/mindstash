"""
Notification Sender Service for MindStash.

This module handles:
- Getting items that need notifications
- Sending notifications (email/push)
- Updating notification tracking fields
- Processing recurring notifications
"""

import logging
from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session

import resend

from app.core.config import settings
from app.models.item import Item
from app.models.user import User

logger = logging.getLogger(__name__)

# Initialize Resend
resend.api_key = settings.RESEND_API_KEY


def send_welcome_email(user: User) -> bool:
    """
    Send a welcome email to a newly registered user.

    Args:
        user: The newly created User

    Returns:
        True if the email was sent successfully
    """
    if not settings.RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not set, skipping welcome email")
        return False

    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; margin: 0; padding: 0; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #EA7B7B 0%, #FF8364 100%);
                       color: white; padding: 40px 30px; border-radius: 16px 16px 0 0; text-align: center; }}
            .content {{ background: #f9fafb; padding: 36px 30px; border-radius: 0 0 16px 16px; }}
            .step {{ background: white; padding: 16px 20px; border-radius: 12px;
                     border-left: 4px solid #EA7B7B; margin: 12px 0; }}
            .step-number {{ color: #EA7B7B; font-weight: 700; font-size: 12px;
                            text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }}
            .cta {{ display: inline-block; padding: 14px 32px; background: #EA7B7B;
                    color: white; text-decoration: none; border-radius: 10px; font-weight: 600;
                    font-size: 15px; margin-top: 24px; }}
            .footer {{ text-align: center; color: #9ca3af; font-size: 12px; margin-top: 28px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="margin: 0 0 8px; font-size: 32px; font-weight: 800;">🧠 MindStash</h1>
                <p style="margin: 0; font-size: 16px; opacity: 0.9;">Never lose a thought again</p>
            </div>
            <div class="content">
                <p style="font-size: 16px; color: #374151;">Hey there,</p>
                <p style="color: #6b7280;">
                    Welcome to MindStash! Your AI-powered second brain is ready.
                    Here&apos;s how to get started in 3 steps:
                </p>

                <div class="step">
                    <div class="step-number">Step 1</div>
                    <strong>Capture a thought</strong> — type anything: an idea, a task, an article link. AI categorizes it instantly.
                </div>
                <div class="step">
                    <div class="step-number">Step 2</div>
                    <strong>Chat with your stash</strong> — ask the AI assistant to find, summarize, or act on your saved thoughts.
                </div>
                <div class="step">
                    <div class="step-number">Step 3</div>
                    <strong>Connect Telegram</strong> — capture thoughts on the go without opening the app (Settings → Integrations).
                </div>

                <div style="text-align: center;">
                    <a href="{settings.APP_URL}/dashboard" class="cta">Open MindStash →</a>
                </div>

                <div class="footer">
                    <p>You&apos;re receiving this because you just signed up at MindStash.</p>
                    <p style="color: #d1d5db; margin-top: 8px;">MindStash • Never lose a thought again</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """

    try:
        params = {
            "from": settings.FROM_EMAIL,
            "to": [user.email],
            "subject": "Welcome to MindStash — never lose a thought again 🧠",
            "html": html_body,
        }
        response = resend.Emails.send(params)
        logger.info(f"📧 Welcome email sent to {user.email}")
        return bool(response)
    except Exception as e:
        logger.error(f"❌ Failed to send welcome email to {user.email}: {e}")
        return False


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
    Send notification for an item via email.

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
        # Send email via Resend
        if settings.RESEND_API_KEY:
            subject = f"⏰ Reminder: {item.content[:50]}"

            html_body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                               color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }}
                    .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }}
                    .item-box {{ background: white; padding: 20px; border-radius: 8px;
                                border-left: 4px solid #667eea; margin: 20px 0; }}
                    .meta {{ color: #6b7280; font-size: 14px; margin-top: 10px; }}
                    .button {{ display: inline-block; padding: 12px 24px; background: #667eea;
                              color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }}
                    .footer {{ text-align: center; color: #9ca3af; font-size: 12px; margin-top: 30px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1 style="margin: 0; font-size: 28px;">🧠 MindStash Reminder</h1>
                    </div>
                    <div class="content">
                        <p style="font-size: 16px;">Hi there,</p>
                        <p>You saved this thought and wanted to be reminded:</p>

                        <div class="item-box">
                            <p style="margin: 0; font-size: 16px; font-weight: 500;">{item.content}</p>
                            {f'<p style="margin-top: 10px; color: #6b7280;">🔗 <a href="{item.url}" style="color: #667eea;">{item.url}</a></p>' if item.url else ''}
                        </div>

                        <div class="meta">
                            <p style="margin: 5px 0;">
                                📁 Category: <strong>{item.category.title()}</strong> •
                                ⚡ Priority: <strong>{item.priority.title() if item.priority else 'Normal'}</strong>
                            </p>
                        </div>

                        <a href="{settings.APP_URL}/dashboard" class="button">
                            Open MindStash →
                        </a>

                        <div class="footer">
                            <p>Manage your notification preferences in your <a href="{settings.APP_URL}/dashboard" style="color: #667eea;">dashboard</a></p>
                            <p style="color: #d1d5db; margin-top: 10px;">MindStash • Never lose a thought again</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
            """

            params = {
                "from": settings.FROM_EMAIL,
                "to": [user.email],
                "subject": subject,
                "html": html_body,
            }

            response = resend.Emails.send(params)
            logger.info(f"📧 Notification email sent: user={user.email} item_id={item.id} email_id={response.get('id')}")
        else:
            logger.warning("RESEND_API_KEY not configured, skipping email send")
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
        logger.error(f"❌ Failed to send notification for item {item.id}: {e}")
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

        if not user.item_reminders_enabled:
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
