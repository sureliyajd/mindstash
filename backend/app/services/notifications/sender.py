"""
Notification Sender Service for MindStash.

This module handles:
- Getting items that need notifications
- Sending notifications (email/push)
- Updating notification tracking fields
- Processing recurring notifications
"""

import logging
from collections import defaultdict
from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session

import resend

from app.core.config import settings
from app.core.plans import plan_has_feature
from app.core.security import create_email_action_token
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


def send_password_reset_email(user: User, reset_token: str) -> bool:
    """
    Send a password reset email with a secure link.

    Args:
        user: The User requesting a password reset
        reset_token: The raw (unhashed) reset token to include in the link

    Returns:
        True if the email was sent successfully
    """
    if not settings.RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not set, skipping password reset email")
        return False

    reset_url = f"{settings.APP_URL}/reset-password?token={reset_token}"

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
            .cta {{ display: inline-block; padding: 14px 32px; background: #EA7B7B;
                    color: white; text-decoration: none; border-radius: 10px; font-weight: 600;
                    font-size: 15px; margin-top: 24px; }}
            .warning {{ background: #fff7ed; border: 1px solid #fed7aa; border-radius: 10px;
                        padding: 14px 18px; margin-top: 24px; color: #92400e; font-size: 14px; }}
            .footer {{ text-align: center; color: #9ca3af; font-size: 12px; margin-top: 28px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="margin: 0 0 8px; font-size: 32px; font-weight: 800;">🧠 MindStash</h1>
                <p style="margin: 0; font-size: 16px; opacity: 0.9;">Password reset request</p>
            </div>
            <div class="content">
                <p style="font-size: 16px; color: #374151;">Hi there,</p>
                <p style="color: #6b7280;">
                    We received a request to reset your MindStash password.
                    Click the button below to choose a new password:
                </p>

                <div style="text-align: center;">
                    <a href="{reset_url}" class="cta">Reset my password →</a>
                </div>

                <div class="warning">
                    ⏱️ This link expires in <strong>1 hour</strong>. If you didn&apos;t request a
                    password reset, you can safely ignore this email — your account is unchanged.
                </div>

                <div class="footer">
                    <p>If the button doesn&apos;t work, copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #6b7280;">{reset_url}</p>
                    <p style="color: #d1d5db; margin-top: 16px;">MindStash • Never lose a thought again</p>
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
            "subject": "Reset your MindStash password",
            "html": html_body,
        }
        response = resend.Emails.send(params)
        logger.info(f"📧 Password reset email sent to {user.email}")
        return bool(response)
    except Exception as e:
        logger.error(f"❌ Failed to send password reset email to {user.email}: {e}")
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
            <html lang="en">
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    * {{ margin: 0; padding: 0; box-sizing: border-box; }}
                    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            line-height: 1.6; background-color: #f3f4f6; -webkit-text-size-adjust: 100%; }}
                    .wrapper {{ width: 100%; padding: 24px 16px; background-color: #f3f4f6; }}
                    .container {{ max-width: 560px; margin: 0 auto; }}
                    .card {{ background: #ffffff; border-radius: 16px; overflow: hidden;
                             box-shadow: 0 1px 3px rgba(0,0,0,0.06); }}
                    .header {{ background: linear-gradient(135deg, #79C9C5 0%, #5AACA8 100%);
                               padding: 28px 24px; text-align: center; }}
                    .header h1 {{ color: #ffffff; font-size: 22px; font-weight: 800; margin: 0; }}
                    .body {{ padding: 28px 24px; }}
                    .item-box {{ background: #fafafa; padding: 18px; border-radius: 12px;
                                 border-left: 3px solid #EA7B7B; margin: 16px 0; word-wrap: break-word; }}
                    .item-box p {{ font-size: 15px; font-weight: 500; color: #111827; }}
                    .item-box a {{ color: #EA7B7B; font-size: 13px; }}
                    .meta {{ display: flex; gap: 12px; flex-wrap: wrap; margin-top: 12px; }}
                    .meta-tag {{ background: #f3f4f6; padding: 4px 10px; border-radius: 6px;
                                 font-size: 12px; color: #6b7280; }}
                    .cta-wrap {{ text-align: center; padding: 20px 0 4px; }}
                    .cta {{ display: inline-block; padding: 12px 28px; background: #EA7B7B;
                            color: #ffffff; text-decoration: none; border-radius: 10px;
                            font-weight: 600; font-size: 14px; }}
                    .divider {{ height: 1px; background: #f3f4f6; margin: 20px 0; }}
                    .footer {{ padding: 20px 24px; text-align: center; }}
                    .footer p {{ font-size: 11px; color: #d1d5db; margin: 4px 0; }}
                    .footer a {{ color: #EA7B7B; text-decoration: underline; }}
                    @media only screen and (max-width: 480px) {{
                        .wrapper {{ padding: 12px 8px; }}
                        .header {{ padding: 24px 20px; }}
                        .header h1 {{ font-size: 20px; }}
                        .body {{ padding: 22px 18px; }}
                        .item-box {{ padding: 14px; }}
                    }}
                </style>
            </head>
            <body>
                <div class="wrapper">
                    <div class="container">
                        <div class="card">
                            <div class="header">
                                <h1>MindStash Reminder</h1>
                            </div>
                            <div class="body">
                                <p style="font-size: 15px; color: #374151; margin-bottom: 6px;">Hi there,</p>
                                <p style="font-size: 14px; color: #9ca3af; margin-bottom: 16px;">You saved this and wanted to be reminded:</p>

                                <div class="item-box">
                                    <p style="margin: 0;">{item.content}</p>
                                    {f'<p style="margin-top: 8px;"><a href="{item.url}">{item.url}</a></p>' if item.url else ''}
                                </div>

                                <div class="meta">
                                    <span class="meta-tag">{item.category.title()}</span>
                                    <span class="meta-tag">{item.priority.title() if item.priority else 'Normal'} priority</span>
                                </div>

                                {_build_action_buttons_html(item, user)}

                                <div class="cta-wrap">
                                    <a href="{settings.APP_URL}/dashboard" class="cta">Open MindStash &rarr;</a>
                                </div>
                            </div>

                            <div class="divider"></div>

                            <div class="footer">
                                <p style="color:#9ca3af;"><a href="{settings.APP_URL}/settings">Manage email preferences</a></p>
                                <p style="margin-top:8px;">MindStash &middot; Never lose a thought again</p>
                            </div>
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


def _update_item_after_notification(item: Item) -> None:
    """
    Update an item's notification tracking after a notification is sent.
    Recalculates next_notification_at based on the item's frequency.
    """
    item.last_notified_at = datetime.utcnow()

    if item.notification_frequency == "once":
        item.notification_enabled = False
        item.next_notification_at = None
    elif item.notification_frequency == "daily":
        item.next_notification_at = datetime.utcnow() + timedelta(days=1)
    elif item.notification_frequency == "weekly":
        item.next_notification_at = datetime.utcnow() + timedelta(weeks=1)
    elif item.notification_frequency == "monthly":
        item.next_notification_at = datetime.utcnow() + timedelta(days=30)
    else:
        item.notification_enabled = False
        item.next_notification_at = None


def _build_action_buttons_html(item: Item, user: User) -> str:
    """Generate one-click action button HTML for an item in a reminder email."""
    base_url = f"{settings.APP_URL}/api/notifications/email-action"

    complete_token = create_email_action_token(str(item.id), str(user.id), "complete")
    snooze_token = create_email_action_token(str(item.id), str(user.id), "snooze")
    stop_token = create_email_action_token(str(item.id), str(user.id), "stop")

    complete_url = f"{base_url}?token={complete_token}"
    snooze_url = f"{base_url}?token={snooze_token}"
    stop_url = f"{base_url}?token={stop_token}"

    return f"""
    <div style="margin-top: 14px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
            <td style="padding-right: 6px;" width="33%">
                <a href="{complete_url}" style="display: block; padding: 8px 4px; background: #10b981;
                   color: white; text-align: center; border-radius: 6px; font-size: 12px;
                   font-weight: 600; text-decoration: none;">&#10003; Done</a>
            </td>
            <td style="padding: 0 3px;" width="34%">
                <a href="{snooze_url}" style="display: block; padding: 8px 4px; background: #6366f1;
                   color: white; text-align: center; border-radius: 6px; font-size: 12px;
                   font-weight: 600; text-decoration: none;">&#128337; Snooze 7d</a>
            </td>
            <td style="padding-left: 6px;" width="33%">
                <a href="{stop_url}" style="display: block; padding: 8px 4px; background: #9ca3af;
                   color: white; text-align: center; border-radius: 6px; font-size: 12px;
                   font-weight: 600; text-decoration: none;">&#10005; Stop</a>
            </td>
        </tr></table>
    </div>
    """


def send_batched_notification(items: List[Item], user: User, db: Session) -> bool:
    """
    Send a single batched notification email containing all due items for a user.

    Instead of sending one email per item, this groups all due reminders into
    one consolidated email. After sending, each item's notification tracking
    is updated independently based on its own frequency.

    Args:
        items: List of Item objects to include in the email
        user: The User who owns the items
        db: Database session

    Returns:
        True if the email was sent successfully
    """
    if not items:
        return False

    try:
        if settings.RESEND_API_KEY:
            # Build subject line
            if len(items) == 1:
                subject = f"⏰ Reminder: {items[0].content[:50]}"
            else:
                subject = f"⏰ You have {len(items)} reminder{'s' if len(items) > 1 else ''} — MindStash"

            # Build individual item HTML blocks
            items_html = ""
            for item in items:
                url_html = f'<p style="margin-top: 8px;"><a href="{item.url}" style="color: #EA7B7B; font-size: 13px;">{item.url}</a></p>' if item.url else ''
                action_buttons = _build_action_buttons_html(item, user)
                items_html += f"""
                                <div style="background: #fafafa; padding: 18px; border-radius: 12px;
                                            border-left: 3px solid #EA7B7B; margin: 12px 0; word-wrap: break-word;">
                                    <p style="margin: 0; font-size: 15px; font-weight: 500; color: #111827;">{item.content}</p>
                                    {url_html}
                                    <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-top: 12px;">
                                        <span style="background: #f3f4f6; padding: 4px 10px; border-radius: 6px;
                                                     font-size: 12px; color: #6b7280;">{item.category.title()}</span>
                                        <span style="background: #f3f4f6; padding: 4px 10px; border-radius: 6px;
                                                     font-size: 12px; color: #6b7280;">{item.priority.title() if item.priority else 'Normal'} priority</span>
                                    </div>
                                    {action_buttons}
                                </div>
                """

            # Build the header text
            if len(items) == 1:
                header_text = "You saved this and wanted to be reminded:"
            else:
                header_text = f"You have {len(items)} items to check on today:"

            html_body = f"""
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    * {{ margin: 0; padding: 0; box-sizing: border-box; }}
                    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            line-height: 1.6; background-color: #f3f4f6; -webkit-text-size-adjust: 100%; }}
                    @media only screen and (max-width: 480px) {{
                        .wrapper {{ padding: 12px 8px !important; }}
                        .header {{ padding: 24px 20px !important; }}
                        .header h1 {{ font-size: 20px !important; }}
                        .body {{ padding: 22px 18px !important; }}
                    }}
                </style>
            </head>
            <body>
                <div class="wrapper" style="width: 100%; padding: 24px 16px; background-color: #f3f4f6;">
                    <div style="max-width: 560px; margin: 0 auto;">
                        <div style="background: #ffffff; border-radius: 16px; overflow: hidden;
                                    box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
                            <div class="header" style="background: linear-gradient(135deg, #79C9C5 0%, #5AACA8 100%);
                                        padding: 28px 24px; text-align: center;">
                                <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 0;">MindStash Reminder</h1>
                            </div>
                            <div class="body" style="padding: 28px 24px;">
                                <p style="font-size: 15px; color: #374151; margin-bottom: 6px;">Hi there,</p>
                                <p style="font-size: 14px; color: #9ca3af; margin-bottom: 16px;">{header_text}</p>

                                {items_html}

                                <div style="text-align: center; padding: 20px 0 4px;">
                                    <a href="{settings.APP_URL}/dashboard" style="display: inline-block; padding: 12px 28px;
                                       background: #EA7B7B; color: #ffffff; text-decoration: none; border-radius: 10px;
                                       font-weight: 600; font-size: 14px;">Open MindStash &rarr;</a>
                                </div>
                            </div>

                            <div style="height: 1px; background: #f3f4f6; margin: 0;"></div>

                            <div style="padding: 20px 24px; text-align: center;">
                                <p style="font-size: 11px; color: #9ca3af;"><a href="{settings.APP_URL}/settings" style="color: #EA7B7B; text-decoration: underline;">Manage email preferences</a></p>
                                <p style="font-size: 11px; color: #d1d5db; margin-top: 8px;">MindStash &middot; Never lose a thought again</p>
                            </div>
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
            logger.info(
                f"📧 Batched notification sent: user={user.email} "
                f"items={len(items)} email_id={response.get('id')}"
            )
        else:
            logger.warning("RESEND_API_KEY not configured, skipping email send")
            print(f"📧 BATCH NOTIFY {user.email}: {len(items)} items")
            for item in items:
                print(f"   - {item.content[:50]}... ({item.notification_frequency})")

        # Update tracking for each item independently
        for item in items:
            _update_item_after_notification(item)

        return True

    except Exception as e:
        logger.error(f"❌ Failed to send batched notification for user {user.email}: {e}")
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

    # Group items by user_id for batched sending (1 email per user)
    items_by_user = defaultdict(list)
    for item in items:
        items_by_user[item.user_id].append(item)

    print(f"   Grouped into {len(items_by_user)} user(s)")

    for user_id, user_items in items_by_user.items():
        user = db.query(User).filter(User.id == user_id).first()

        if not user:
            print(f"   ⚠️ User not found for user_id {user_id}")
            failed += len(user_items)
            continue

        if not user.item_reminders_enabled:
            continue

        if send_batched_notification(user_items, user, db):
            successful += len(user_items)
            item_ids.extend([str(item.id) for item in user_items])
        else:
            failed += len(user_items)

    # Commit all changes
    db.commit()

    result = {
        "total_processed": len(items),
        "successful": successful,
        "failed": failed,
        "items": item_ids
    }

    print(f"   ✓ Processed: {successful} successful, {failed} failed ({len(items_by_user)} email(s) sent)")

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
