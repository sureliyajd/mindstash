"""
Public analytics tracking endpoint.

POST /api/analytics/track — rate-limited 60/hour per IP.
"""
import asyncio
import logging
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.rate_limit import limiter
from app.core.utils import get_client_ip
from app.models.analytics import AnalyticsEvent
from app.schemas.analytics import TrackEventRequest
from app.api.dependencies import get_optional_user
from app.services.geolocation import lookup_ip

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Analytics"])

ALLOWED_EVENT_TYPES = {
    "page_view",
    "login_attempt",
    "login_success",
    "login_failed",
    "register_attempt",
    "register_success",
    "register_failed",
}


async def _enrich_event(db: Session, event_id, ip: str) -> None:
    """Background task: geo-lookup and update the event row."""
    try:
        geo = await lookup_ip(ip)
        # Re-open a short-lived session to update the row
        from app.core.database import SessionLocal
        with SessionLocal() as bg_db:
            event = bg_db.query(AnalyticsEvent).filter(
                AnalyticsEvent.id == event_id
            ).first()
            if event:
                event.country = geo["country"]
                event.city = geo["city"]
                event.region = geo["region"]
                event.country_code = geo["country_code"]
                bg_db.commit()
    except Exception as exc:
        logger.debug("Geo enrichment failed for event %s: %s", event_id, exc)


@router.post("/track")
@limiter.limit("60/hour")
async def track_event(
    request: Request,
    body: TrackEventRequest,
    db: Session = Depends(get_db),
    optional_user=Depends(get_optional_user),
):
    """
    Track a public analytics event.

    Writes the row immediately then fires geo-lookup in the background.
    Response never waits for geo.
    """
    if body.event_type not in ALLOWED_EVENT_TYPES:
        return {"ok": False, "error": "unknown event_type"}

    ip = get_client_ip(request)
    user_agent = request.headers.get("User-Agent")

    event = AnalyticsEvent(
        event_type=body.event_type,
        page=body.page,
        ip_address=ip,
        user_agent=user_agent,
        referrer=body.referrer,
        user_id=optional_user.id if optional_user else None,
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    # Fire geo enrichment without blocking the response
    asyncio.create_task(_enrich_event(db, event.id, ip))

    return {"ok": True}
