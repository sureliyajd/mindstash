"""
Weekly Digest Service for MindStash.

This module handles:
- Gathering pending items for weekly digest
- Generating HTML email content
- Sending weekly digest emails to users
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from uuid import UUID
from sqlalchemy.orm import Session

import resend

from app.core.config import settings
from app.models.item import Item
from app.models.user import User

logger = logging.getLogger(__name__)

# Initialize Resend
resend.api_key = settings.RESEND_API_KEY


def get_pending_items_for_digest(user_id: UUID, db: Session) -> Dict[str, Any]:
    """
    Get items for weekly digest for a specific user.

    Gathers:
    - Urgent items (urgency = high)
    - Pending tasks (action_required = True, is_completed = False)
    - Upcoming notifications (next 7 days)
    - Count of items saved this week

    Args:
        user_id: UUID of the user
        db: Database session

    Returns:
        Dict containing:
        {
            "urgent_items": List[Item],
            "pending_tasks": List[Item],
            "upcoming_notifications": List[Item],
            "items_saved_this_week": int,
            "completed_this_week": int
        }
    """
    now = datetime.utcnow()
    week_ago = now - timedelta(days=7)
    next_week = now + timedelta(days=7)

    # Items needing urgent attention
    urgent_items = db.query(Item).filter(
        Item.user_id == user_id,
        Item.is_completed == False,
        Item.urgency == "high"
    ).order_by(Item.created_at.desc()).limit(10).all()

    # Tasks pending action
    pending_tasks = db.query(Item).filter(
        Item.user_id == user_id,
        Item.is_completed == False,
        Item.action_required == True
    ).order_by(Item.urgency.desc(), Item.created_at.desc()).limit(10).all()

    # Upcoming notifications this week
    upcoming_notifications = db.query(Item).filter(
        Item.user_id == user_id,
        Item.is_completed == False,
        Item.notification_enabled == True,
        Item.next_notification_at.isnot(None),
        Item.next_notification_at >= now,
        Item.next_notification_at <= next_week
    ).order_by(Item.next_notification_at).limit(10).all()

    # Count items saved this week
    items_saved_this_week = db.query(Item).filter(
        Item.user_id == user_id,
        Item.created_at >= week_ago
    ).count()

    # Count items completed this week
    completed_this_week = db.query(Item).filter(
        Item.user_id == user_id,
        Item.is_completed == True,
        Item.completed_at >= week_ago
    ).count()

    return {
        "urgent_items": urgent_items,
        "pending_tasks": pending_tasks,
        "upcoming_notifications": upcoming_notifications,
        "items_saved_this_week": items_saved_this_week,
        "completed_this_week": completed_this_week
    }


def format_item_for_email(item: Item) -> str:
    """Format a single item for email display."""
    content = item.content[:100]
    if len(item.content) > 100:
        content += "..."

    category_emoji = {
        "read": "📚",
        "watch": "🎥",
        "ideas": "💡",
        "tasks": "✅",
        "people": "👤",
        "notes": "📝",
        "goals": "🎯",
        "buy": "🛒",
        "places": "📍",
        "journal": "💭",
        "learn": "🎓",
        "save": "🔖"
    }

    emoji = category_emoji.get(item.category, "📌")

    return f"{emoji} {content}"


def generate_digest_email(user: User, digest_data: Dict[str, Any]) -> str:
    """
    Generate HTML email content for weekly digest.

    Args:
        user: The User receiving the digest
        digest_data: Dict from get_pending_items_for_digest

    Returns:
        HTML string for email body
    """
    # Extract first name from email
    first_name = user.email.split("@")[0].title()

    # Build urgent items list
    urgent_html = ""
    if digest_data["urgent_items"]:
        urgent_items_list = "".join([
            f"<li style='padding: 8px 0; border-bottom: 1px solid #eee;'>{format_item_for_email(item)}</li>"
            for item in digest_data["urgent_items"][:5]
        ])
        urgent_html = f"""
        <div style="margin-bottom: 24px;">
            <h2 style="color: #FF8364; font-size: 18px; margin-bottom: 12px;">
                🔥 Urgent Items ({len(digest_data['urgent_items'])})
            </h2>
            <ul style="list-style: none; padding: 0; margin: 0;">
                {urgent_items_list}
            </ul>
        </div>
        """

    # Build pending tasks list
    tasks_html = ""
    if digest_data["pending_tasks"]:
        tasks_list = "".join([
            f"<li style='padding: 8px 0; border-bottom: 1px solid #eee;'>{format_item_for_email(item)}</li>"
            for item in digest_data["pending_tasks"][:5]
        ])
        tasks_html = f"""
        <div style="margin-bottom: 24px;">
            <h2 style="color: #FACE68; font-size: 18px; margin-bottom: 12px;">
                ✅ Pending Tasks ({len(digest_data['pending_tasks'])})
            </h2>
            <ul style="list-style: none; padding: 0; margin: 0;">
                {tasks_list}
            </ul>
        </div>
        """

    # Build upcoming notifications list
    upcoming_html = ""
    if digest_data["upcoming_notifications"]:
        upcoming_list = "".join([
            f"<li style='padding: 8px 0; border-bottom: 1px solid #eee;'>"
            f"{format_item_for_email(item)} "
            f"<span style='color: #79C9C5; font-size: 12px;'>({item.next_notification_at.strftime('%b %d')})</span>"
            f"</li>"
            for item in digest_data["upcoming_notifications"][:5]
        ])
        upcoming_html = f"""
        <div style="margin-bottom: 24px;">
            <h2 style="color: #79C9C5; font-size: 18px; margin-bottom: 12px;">
                📅 Coming Up This Week
            </h2>
            <ul style="list-style: none; padding: 0; margin: 0;">
                {upcoming_list}
            </ul>
        </div>
        """

    # Build stats section
    stats_html = f"""
    <div style="background: #f8f9fa; padding: 16px; border-radius: 12px; margin-bottom: 24px;">
        <p style="margin: 0; color: #93DA97; font-size: 16px;">
            📊 This week: <strong>{digest_data['items_saved_this_week']}</strong> thoughts captured,
            <strong>{digest_data['completed_this_week']}</strong> completed!
        </p>
    </div>
    """

    # Build complete email
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                 max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff; color: #333;">

        <!-- Header -->
        <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #EA7B7B; font-size: 28px; margin-bottom: 8px;">
                Your Weekly MindStash Digest
            </h1>
            <p style="color: #666; font-size: 14px; margin: 0;">
                {datetime.utcnow().strftime('%B %d, %Y')}
            </p>
        </div>

        <!-- Greeting -->
        <p style="font-size: 16px; color: #333; margin-bottom: 24px;">
            Hi {first_name},
        </p>

        <p style="font-size: 16px; color: #666; margin-bottom: 32px;">
            Here's what needs your attention this week:
        </p>

        <!-- Content Sections -->
        {urgent_html}
        {tasks_html}
        {upcoming_html}
        {stats_html}

        <!-- CTA Button -->
        <div style="text-align: center; margin: 32px 0;">
            <a href="{settings.APP_URL}/dashboard"
               style="display: inline-block; background: #EA7B7B; color: white;
                      padding: 14px 32px; text-decoration: none; border-radius: 12px;
                      font-weight: 600; font-size: 16px;">
                View Dashboard
            </a>
        </div>

        <!-- Footer -->
        <div style="border-top: 1px solid #eee; padding-top: 24px; margin-top: 32px; text-align: center;">
            <p style="color: #999; font-size: 12px; margin-bottom: 8px;">
                You're receiving this because you have a MindStash account.
            </p>
            <p style="color: #999; font-size: 12px; margin: 0;">
                <a href="#" style="color: #EA7B7B;">Unsubscribe</a> |
                <a href="#" style="color: #EA7B7B;">Manage preferences</a>
            </p>
        </div>
    </body>
    </html>
    """

    return html


def send_weekly_digest_to_user(user: User, db: Session) -> bool:
    """
    Send weekly digest email to a single user.

    Args:
        user: The User to send digest to
        db: Database session

    Returns:
        True if digest was sent, False if nothing to send
    """
    digest_data = get_pending_items_for_digest(user.id, db)

    # Only send if there's content worth sending
    has_content = (
        digest_data["urgent_items"] or
        digest_data["pending_tasks"] or
        digest_data["upcoming_notifications"]
    )

    if not has_content:
        logger.debug(f"⏭️ Skipping {user.email} - no content for digest")
        return False

    email_html = generate_digest_email(user, digest_data)

    # Send via Resend
    if settings.RESEND_API_KEY:
        try:
            params = {
                "from": settings.FROM_EMAIL,
                "to": [user.email],
                "subject": "🗓️ Your Weekly MindStash Digest",
                "html": email_html,
            }

            response = resend.Emails.send(params)
            logger.info(f"📧 Digest sent to {user.email} - email_id={response.get('id')}")
            logger.debug(f"   Urgent: {len(digest_data['urgent_items'])}, "
                        f"Tasks: {len(digest_data['pending_tasks'])}, "
                        f"Upcoming: {len(digest_data['upcoming_notifications'])}")
            return True

        except Exception as e:
            logger.error(f"Failed to send digest to {user.email}: {e}")
            return False
    else:
        logger.warning("RESEND_API_KEY not configured, skipping digest email")
        print(f"   📧 DIGEST would be sent to {user.email}")
        print(f"      Urgent: {len(digest_data['urgent_items'])}")
        print(f"      Tasks: {len(digest_data['pending_tasks'])}")
        print(f"      Upcoming: {len(digest_data['upcoming_notifications'])}")
        return False


def send_weekly_digests(db: Session) -> Dict[str, Any]:
    """
    Send weekly digests to all users.

    This function should be called once per week (e.g., Sunday morning)
    by a cron job or background scheduler.

    Args:
        db: Database session

    Returns:
        Dict with results:
        {
            "total_users": int,
            "digests_sent": int,
            "skipped": int
        }
    """
    logger.info(f"📬 Sending weekly digests at {datetime.utcnow().isoformat()}")

    users = db.query(User).filter(User.weekly_digest_enabled == True).all()
    logger.info(f"Found {len(users)} users with weekly digest enabled")

    sent_count = 0
    skipped_count = 0

    for user in users:
        if send_weekly_digest_to_user(user, db):
            sent_count += 1
        else:
            skipped_count += 1

    result = {
        "total_users": len(users),
        "digests_sent": sent_count,
        "skipped": int(skipped_count)
    }

    logger.info(f"✓ Sent {sent_count} digests, skipped {skipped_count}")

    return result


def get_digest_preview(user_id: UUID, db: Session) -> Dict[str, Any]:
    """
    Get a preview of what would be in the user's weekly digest.

    Useful for showing users what they'll receive in their next digest.

    Args:
        user_id: UUID of the user
        db: Database session

    Returns:
        Dict with digest preview data
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {"error": "User not found"}

    digest_data = get_pending_items_for_digest(user_id, db)

    return {
        "user_email": user.email,
        "urgent_count": len(digest_data["urgent_items"]),
        "tasks_count": len(digest_data["pending_tasks"]),
        "upcoming_count": len(digest_data["upcoming_notifications"]),
        "items_saved_this_week": digest_data["items_saved_this_week"],
        "completed_this_week": digest_data["completed_this_week"],
        "urgent_items": [
            {"id": str(i.id), "content": i.content[:100], "category": i.category}
            for i in digest_data["urgent_items"][:5]
        ],
        "pending_tasks": [
            {"id": str(i.id), "content": i.content[:100], "category": i.category}
            for i in digest_data["pending_tasks"][:5]
        ],
        "upcoming_notifications": [
            {
                "id": str(i.id),
                "content": i.content[:100],
                "notification_date": i.next_notification_at.isoformat() if i.next_notification_at else None
            }
            for i in digest_data["upcoming_notifications"][:5]
        ]
    }
