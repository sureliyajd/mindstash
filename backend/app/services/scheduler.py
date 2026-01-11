"""
Background Scheduler for MindStash.

This module provides background job scheduling for:
- Processing notifications every 15 minutes
- Sending weekly digests every Sunday at 9 AM

Uses APScheduler for reliable job scheduling.

Usage:
    # In main.py or separate worker process
    from app.services.scheduler import start_scheduler, stop_scheduler

    @app.on_event("startup")
    async def startup():
        start_scheduler()

    @app.on_event("shutdown")
    async def shutdown():
        stop_scheduler()

For production, it's recommended to run these as separate cron jobs
instead of in-process scheduling:

    # Notifications (every 15 minutes)
    */15 * * * * curl -X POST -H "X-API-Key: $CRON_API_KEY" https://api.mindstash.app/api/notifications/process

    # Weekly digest (every Sunday at 9 AM)
    0 9 * * 0 curl -X POST -H "X-API-Key: $CRON_API_KEY" https://api.mindstash.app/api/notifications/send-digests
"""

import os
import logging
from typing import Optional
from datetime import datetime

try:
    from apscheduler.schedulers.background import BackgroundScheduler
    from apscheduler.triggers.interval import IntervalTrigger
    from apscheduler.triggers.cron import CronTrigger
    APSCHEDULER_AVAILABLE = True
except ImportError:
    APSCHEDULER_AVAILABLE = False
    BackgroundScheduler = None  # type: ignore

from app.core.database import SessionLocal
from app.services.notifications.sender import process_notifications
from app.services.notifications.digest import send_weekly_digests

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global scheduler instance
_scheduler: Optional['BackgroundScheduler'] = None


def notification_job():
    """
    Process pending notifications.

    This job runs every 15 minutes and sends notifications
    for items that have next_notification_at <= now.
    """
    logger.info(f"🔔 Running notification job at {datetime.utcnow().isoformat()}")

    db = SessionLocal()
    try:
        result = process_notifications(db)
        logger.info(f"   Processed {result['successful']} notifications")
    except Exception as e:
        logger.error(f"   ❌ Notification job failed: {e}")
    finally:
        db.close()


def digest_job():
    """
    Send weekly digests to all users.

    This job runs every Sunday at 9 AM UTC and sends
    a summary of pending items to each user.
    """
    logger.info(f"📬 Running digest job at {datetime.utcnow().isoformat()}")

    db = SessionLocal()
    try:
        result = send_weekly_digests(db)
        logger.info(f"   Sent {result['digests_sent']} digests")
    except Exception as e:
        logger.error(f"   ❌ Digest job failed: {e}")
    finally:
        db.close()


def start_scheduler(
    notification_interval_minutes: int = 15,
    enable_digest: bool = True
) -> bool:
    """
    Start the background scheduler.

    Args:
        notification_interval_minutes: How often to check for notifications (default 15)
        enable_digest: Whether to enable weekly digest job (default True)

    Returns:
        True if scheduler started successfully, False otherwise
    """
    global _scheduler

    if not APSCHEDULER_AVAILABLE:
        logger.warning("APScheduler not installed. Scheduler disabled.")
        logger.warning("Install with: pip install apscheduler")
        logger.warning("Using external cron jobs is recommended for production.")
        return False

    if _scheduler is not None:
        logger.warning("Scheduler already running")
        return False

    # Check if we should run the scheduler (can be disabled in production)
    if os.getenv("DISABLE_SCHEDULER", "").lower() == "true":
        logger.info("Scheduler disabled via DISABLE_SCHEDULER environment variable")
        return False

    try:
        _scheduler = BackgroundScheduler()

        # Add notification job - runs every N minutes
        _scheduler.add_job(
            notification_job,
            IntervalTrigger(minutes=notification_interval_minutes),
            id="notification_job",
            name="Process pending notifications",
            replace_existing=True
        )
        logger.info(f"📅 Scheduled notification job every {notification_interval_minutes} minutes")

        # Add digest job - runs every Sunday at 9 AM UTC
        if enable_digest:
            _scheduler.add_job(
                digest_job,
                CronTrigger(day_of_week="sun", hour=9, minute=0),
                id="digest_job",
                name="Send weekly digests",
                replace_existing=True
            )
            logger.info("📅 Scheduled weekly digest job for Sundays at 9 AM UTC")

        _scheduler.start()
        logger.info("✅ Background scheduler started successfully")

        return True

    except Exception as e:
        logger.error(f"❌ Failed to start scheduler: {e}")
        _scheduler = None
        return False


def stop_scheduler():
    """
    Stop the background scheduler.
    """
    global _scheduler

    if _scheduler is None:
        return

    try:
        _scheduler.shutdown(wait=False)
        logger.info("🛑 Background scheduler stopped")
    except Exception as e:
        logger.error(f"❌ Error stopping scheduler: {e}")
    finally:
        _scheduler = None


def is_scheduler_running() -> bool:
    """
    Check if the scheduler is currently running.

    Returns:
        True if scheduler is running, False otherwise
    """
    return _scheduler is not None and _scheduler.running


def get_scheduled_jobs() -> list:
    """
    Get list of scheduled jobs.

    Returns:
        List of job info dicts
    """
    if _scheduler is None:
        return []

    return [
        {
            "id": job.id,
            "name": job.name,
            "next_run": job.next_run_time.isoformat() if job.next_run_time else None
        }
        for job in _scheduler.get_jobs()
    ]


def run_job_now(job_id: str) -> bool:
    """
    Manually trigger a scheduled job to run immediately.

    Args:
        job_id: The ID of the job to run ("notification_job" or "digest_job")

    Returns:
        True if job was triggered, False if job not found
    """
    if _scheduler is None:
        logger.warning("Scheduler not running")
        return False

    job = _scheduler.get_job(job_id)
    if job is None:
        logger.warning(f"Job '{job_id}' not found")
        return False

    # Run the job function directly
    if job_id == "notification_job":
        notification_job()
    elif job_id == "digest_job":
        digest_job()
    else:
        logger.warning(f"Unknown job ID: {job_id}")
        return False

    return True
