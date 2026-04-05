"""
Daily Briefing Email Service for MindStash.

This module handles:
- Generating AI-powered daily briefings for each user
- Sending briefings via email
- Parsing agent responses from SSE stream
"""

import logging
import markdown as md_lib
from datetime import datetime
from typing import Dict, Any
from uuid import UUID
from sqlalchemy.orm import Session

import resend

from app.core.config import settings
from app.core.plans import plan_has_feature
from app.core.security import create_unsubscribe_token
from app.models.user import User
from app.services.ai.agent import run_agent

logger = logging.getLogger(__name__)

# Initialize Resend
resend.api_key = settings.RESEND_API_KEY


def markdown_to_html(text: str) -> str:
    """Convert markdown text to HTML for email rendering."""
    return md_lib.markdown(text, extensions=['nl2br'])


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

        # Convert markdown to HTML for proper rendering
        briefing_html = markdown_to_html(briefing_text)

        # Build email HTML — mobile-first, MindStash brand colors
        today_str = datetime.utcnow().strftime('%A, %B %d, %Y')
        html_body = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Your Daily Briefing</title>
            <!--[if mso]>
            <style>table,td {{font-family:Arial,sans-serif;}}</style>
            <![endif]-->
            <style>
                * {{ margin: 0; padding: 0; box-sizing: border-box; }}
                body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        line-height: 1.6; background-color: #f3f4f6; -webkit-text-size-adjust: 100%; }}
                .wrapper {{ width: 100%; padding: 24px 16px; background-color: #f3f4f6; }}
                .container {{ max-width: 560px; margin: 0 auto; }}
                .card {{ background: #ffffff; border-radius: 16px; overflow: hidden;
                         box-shadow: 0 1px 3px rgba(0,0,0,0.06); }}
                .header {{ background: linear-gradient(135deg, #EA7B7B 0%, #D66B6B 50%, #FF8364 100%);
                           padding: 32px 24px; text-align: center; }}
                .header h1 {{ color: #ffffff; font-size: 26px; font-weight: 800; margin: 0 0 6px; }}
                .header .date {{ color: rgba(255,255,255,0.85); font-size: 13px; font-weight: 500; }}
                .body {{ padding: 28px 24px; }}
                .greeting {{ font-size: 15px; color: #374151; margin-bottom: 6px; }}
                .subtitle {{ font-size: 14px; color: #9ca3af; margin-bottom: 20px; }}
                .briefing {{ background: #fafafa; border-radius: 12px; padding: 20px;
                             border-left: 3px solid #EA7B7B; font-size: 14px; line-height: 1.75;
                             color: #374151; word-wrap: break-word; overflow-wrap: break-word; }}
                .briefing h1 {{ font-size: 17px; color: #111827; margin: 14px 0 6px; }}
                .briefing h2 {{ font-size: 15px; color: #111827; margin: 14px 0 6px; }}
                .briefing h3 {{ font-size: 14px; color: #374151; margin: 12px 0 4px; }}
                .briefing p {{ margin: 8px 0; }}
                .briefing ul, .briefing ol {{ padding-left: 18px; margin: 6px 0; }}
                .briefing li {{ margin-bottom: 4px; }}
                .briefing strong {{ color: #111827; }}
                .briefing a {{ color: #EA7B7B; }}
                .cta-wrap {{ text-align: center; padding: 24px 0 4px; }}
                .cta {{ display: inline-block; padding: 12px 28px; background: #EA7B7B;
                        color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 600;
                        font-size: 14px; }}
                .divider {{ height: 1px; background: #f3f4f6; margin: 20px 0; }}
                .footer {{ padding: 20px 24px; text-align: center; }}
                .footer p {{ font-size: 11px; color: #d1d5db; margin: 4px 0; }}
                .footer a {{ color: #EA7B7B; text-decoration: underline; }}
                .accent-bar {{ display: flex; justify-content: center; gap: 6px; margin-bottom: 16px; }}
                .accent-dot {{ width: 6px; height: 6px; border-radius: 50%; display: inline-block; }}
                @media only screen and (max-width: 480px) {{
                    .wrapper {{ padding: 12px 8px; }}
                    .header {{ padding: 28px 20px; }}
                    .header h1 {{ font-size: 22px; }}
                    .body {{ padding: 22px 18px; }}
                    .briefing {{ padding: 16px; font-size: 13px; }}
                    .footer {{ padding: 16px 18px; }}
                }}
            </style>
        </head>
        <body>
            <div class="wrapper">
                <div class="container">
                    <div class="card">
                        <div class="header">
                            <h1>Good Morning!</h1>
                            <div class="date">{today_str}</div>
                        </div>

                        <div class="body">
                            <p class="greeting">Hi {first_name},</p>
                            <p class="subtitle">Here's your personalized daily briefing:</p>

                            <div class="briefing">
                                {briefing_html}
                            </div>

                            <div class="cta-wrap">
                                <a href="{settings.APP_URL}/dashboard" class="cta">
                                    Open MindStash &rarr;
                                </a>
                            </div>
                        </div>

                        <div class="divider"></div>

                        <div class="footer">
                            <div class="accent-bar">
                                <span class="accent-dot" style="background:#EA7B7B;"></span>
                                <span class="accent-dot" style="background:#FACE68;"></span>
                                <span class="accent-dot" style="background:#79C9C5;"></span>
                                <span class="accent-dot" style="background:#93DA97;"></span>
                            </div>
                            <p style="color:#9ca3af;">You're receiving this because you have daily briefings enabled.</p>
                            <p><a href="{settings.APP_URL}/profile" style="color: #EA7B7B;">Manage email preferences</a> | <a href="{settings.BACKEND_URL}/api/notifications/unsubscribe?token={create_unsubscribe_token(str(user.id), 'daily_briefing')}" style="color: #EA7B7B;">Unsubscribe</a></p>
                            <p style="margin-top:10px;">MindStash &middot; Never lose a thought again</p>
                        </div>
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

    users = db.query(User).filter(User.daily_briefing_enabled == True).all()
    logger.info(f"Found {len(users)} users with daily briefing enabled")

    sent_count = 0
    failed_count = 0

    for user in users:
        # Skip users whose plan doesn't include daily briefing
        if not plan_has_feature(user.plan or "free", "daily_briefing"):
            logger.debug(f"Skipping daily briefing for {user.email} — plan does not include it")
            failed_count += 1
            continue
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
