"""
Daily Briefing Email Service for MindStash.

This module handles:
- Generating AI-powered daily briefings for each user
- Sending briefings via email
- Parsing agent responses from SSE stream
"""

import logging
from datetime import datetime
from typing import Dict, Any
from uuid import UUID
from sqlalchemy.orm import Session

import resend

from app.core.config import settings
from app.models.user import User
from app.services.ai.agent import run_agent

logger = logging.getLogger(__name__)

# Initialize Resend
resend.api_key = settings.RESEND_API_KEY


def generate_briefing_for_user(user_id: UUID, db: Session) -> str | None:
    """
    Generate AI briefing for a single user by calling the agent.

    Args:
        user_id: UUID of the user
        db: Database session

    Returns:
        Briefing text from agent, or None if failed
    """
    try:
        # Call agent with special [BRIEFING] message
        # This triggers the daily briefing flow in the agent
        briefing_text = ""

        # Run agent and collect text from SSE stream
        for event_str in run_agent(
            message="[BRIEFING]",
            session_id=None,  # Create new session for briefing
            db=db,
            user_id=user_id
        ):
            # Parse SSE event
            if not event_str.strip():
                continue

            lines = event_str.strip().split('\n')
            event_type = None
            event_data = None

            for line in lines:
                if line.startswith('event: '):
                    event_type = line[7:].strip()
                elif line.startswith('data: '):
                    import json
                    try:
                        event_data = json.loads(line[6:])
                    except json.JSONDecodeError:
                        continue

            # Collect text from text_delta events
            if event_type == 'text_delta' and event_data:
                briefing_text += event_data.get('text', '')
            elif event_type == 'done':
                break
            elif event_type == 'error':
                logger.error(f"Agent error for user {user_id}: {event_data}")
                return None

        return briefing_text.strip() if briefing_text else None

    except Exception as e:
        logger.error(f"Failed to generate briefing for user {user_id}: {e}")
        return None


def send_daily_briefing_to_user(user: User, db: Session) -> bool:
    """
    Generate and send daily briefing email to a single user.

    Args:
        user: The User to send briefing to
        db: Database session

    Returns:
        True if briefing was sent, False otherwise
    """
    try:
        # Generate briefing via AI agent
        logger.info(f"Generating daily briefing for {user.email}...")
        briefing_text = generate_briefing_for_user(user.id, db)

        if not briefing_text:
            logger.warning(f"No briefing generated for {user.email}")
            return False

        # Extract first name from email
        first_name = user.email.split("@")[0].title()

        # Build email HTML
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                           color: white; padding: 40px; border-radius: 12px 12px 0 0; text-align: center; }}
                .content {{ background: #f9fafb; padding: 40px; border-radius: 0 0 12px 12px; }}
                .briefing {{ background: white; padding: 25px; border-radius: 8px;
                            border-left: 4px solid #667eea; margin: 20px 0;
                            font-size: 15px; line-height: 1.8; white-space: pre-wrap; }}
                .button {{ display: inline-block; padding: 12px 28px; background: #667eea;
                          color: white; text-decoration: none; border-radius: 6px; margin-top: 25px;
                          font-weight: 500; }}
                .footer {{ text-align: center; color: #9ca3af; font-size: 12px; margin-top: 30px; }}
                .date {{ color: #e0e7ff; font-size: 14px; margin-top: 8px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0; font-size: 32px;">☀️ Good Morning!</h1>
                    <p class="date">{datetime.utcnow().strftime('%A, %B %d, %Y')}</p>
                </div>
                <div class="content">
                    <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
                        Hi {first_name},
                    </p>
                    <p style="font-size: 15px; color: #6b7280;">
                        Here's your personalized daily briefing from MindStash:
                    </p>

                    <div class="briefing">
                        {briefing_text}
                    </div>

                    <div style="text-align: center;">
                        <a href="{settings.APP_URL}/dashboard" class="button">
                            Open MindStash →
                        </a>
                    </div>

                    <div class="footer">
                        <p>You're receiving this daily briefing because you have an active MindStash account</p>
                        <p style="color: #d1d5db; margin-top: 10px;">
                            <a href="{settings.APP_URL}/settings" style="color: #667eea;">Manage email preferences</a>
                        </p>
                        <p style="color: #d1d5db; margin-top: 15px;">MindStash • Never lose a thought again</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """

        # Send via Resend
        if not settings.RESEND_API_KEY:
            logger.warning("RESEND_API_KEY not configured, skipping briefing email")
            return False

        params = {
            "from": settings.FROM_EMAIL,
            "to": [user.email],
            "subject": f"☀️ Your Daily MindStash Briefing - {datetime.utcnow().strftime('%B %d')}",
            "html": html_body,
        }

        response = resend.Emails.send(params)
        logger.info(f"📧 Daily briefing sent to {user.email} - email_id={response.get('id')}")
        return True

    except Exception as e:
        logger.error(f"Failed to send daily briefing to {user.email}: {e}")
        return False


def send_daily_briefings(db: Session) -> Dict[str, Any]:
    """
    Send daily briefings to all users.

    This function should be called once per day (e.g., 8 AM local time)
    by a cron job or background scheduler.

    Args:
        db: Database session

    Returns:
        Dict with results:
        {
            "total_users": int,
            "briefings_sent": int,
            "failed": int
        }
    """
    logger.info(f"☀️ Sending daily briefings at {datetime.utcnow().isoformat()}")

    users = db.query(User).all()
    logger.info(f"Found {len(users)} users")

    sent_count = 0
    failed_count = 0

    for user in users:
        if send_daily_briefing_to_user(user, db):
            sent_count += 1
        else:
            failed_count += 1

    result = {
        "total_users": len(users),
        "briefings_sent": sent_count,
        "failed": failed_count
    }

    logger.info(f"✓ Sent {sent_count} briefings, {failed_count} failed")

    return result
