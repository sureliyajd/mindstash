"""
Lemon Squeezy integration service for MindStash billing.
Uses httpx to call the Lemon Squeezy REST API directly (no SDK needed).
"""
import hashlib
import hmac
import httpx
from datetime import datetime, timezone
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.core.config import get_settings
from app.core.plans import plan_from_variant_id, PLAN_FREE
from app.models.payment_event import PaymentEvent

LMS_API_BASE = "https://api.lemonsqueezy.com/v1"

settings = get_settings()


def _headers():
    if not settings.LMS_API_KEY:
        raise HTTPException(status_code=501, detail="Lemon Squeezy is not configured.")
    return {
        "Authorization": f"Bearer {settings.LMS_API_KEY}",
        "Accept": "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
    }


def _require_config():
    if not settings.LMS_API_KEY:
        raise HTTPException(status_code=501, detail="Payments are not configured yet.")


def create_checkout_session(user, db: Session, variant_id: str, success_url: str, cancel_url: str) -> str:
    """Create a Lemon Squeezy checkout and return the checkout URL."""
    _require_config()
    payload = {
        "data": {
            "type": "checkouts",
            "attributes": {
                "checkout_options": {
                    "embed": False,
                    "media": False,
                    "logo": True,
                },
                "checkout_data": {
                    "email": user.email,
                    "custom": {
                        "user_id": str(user.id),
                    },
                },
                "product_options": {
                    "redirect_url": success_url,
                    "receipt_button_text": "Go to Dashboard",
                    "receipt_thank_you_note": "Thank you for subscribing to MindStash!",
                },
                "expires_at": None,
            },
            "relationships": {
                "store": {
                    "data": {"type": "stores", "id": str(settings.LMS_STORE_ID)}
                },
                "variant": {
                    "data": {"type": "variants", "id": str(variant_id)}
                },
            },
        }
    }
    with httpx.Client() as client:
        resp = client.post(f"{LMS_API_BASE}/checkouts", json=payload, headers=_headers())
        if resp.status_code not in (200, 201):
            raise HTTPException(status_code=502, detail=f"Checkout creation failed: {resp.text}")
        data = resp.json()
        return data["data"]["attributes"]["url"]


def create_portal_session(user, return_url: str) -> str:
    """Return the customer portal URL from the user's active subscription."""
    _require_config()
    if not user.lms_subscription_id:
        raise HTTPException(status_code=400, detail="No active subscription found.")
    with httpx.Client() as client:
        resp = client.get(
            f"{LMS_API_BASE}/subscriptions/{user.lms_subscription_id}",
            headers=_headers(),
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail="Could not fetch subscription.")
        data = resp.json()
        portal_url = data["data"]["attributes"]["urls"].get("customer_portal")
        if not portal_url:
            raise HTTPException(status_code=502, detail="Portal URL not available.")
        return portal_url


def cancel_subscription_at_period_end(user, db: Session) -> dict:
    """Cancel subscription at period end (user keeps access until then)."""
    _require_config()
    if not user.lms_subscription_id:
        raise HTTPException(status_code=400, detail="No active subscription found.")
    payload = {
        "data": {
            "type": "subscriptions",
            "id": str(user.lms_subscription_id),
            "attributes": {"cancelled": True},
        }
    }
    with httpx.Client() as client:
        resp = client.patch(
            f"{LMS_API_BASE}/subscriptions/{user.lms_subscription_id}",
            json=payload,
            headers=_headers(),
        )
        if resp.status_code not in (200, 201):
            raise HTTPException(status_code=502, detail="Cancellation failed.")
        data = resp.json()
        attrs = data["data"]["attributes"]
        ends_at = attrs.get("ends_at") or attrs.get("renews_at")
        cancel_date = datetime.fromisoformat(ends_at.replace("Z", "+00:00")) if ends_at else None

    user.subscription_canceled_at = datetime.now(timezone.utc)
    if cancel_date:
        user.plan_expires_at = cancel_date
    db.add(user)
    db.commit()
    return {
        "message": "Subscription will cancel at period end.",
        "cancel_date": cancel_date.isoformat() if cancel_date else None,
    }


def handle_webhook(payload: bytes, signature: str, db: Session) -> dict:
    """Verify Lemon Squeezy webhook signature and process the event."""
    if not settings.LMS_WEBHOOK_SECRET:
        raise HTTPException(status_code=501, detail="Webhook secret not configured.")

    # Verify HMAC-SHA256 signature
    computed = hmac.new(
        settings.LMS_WEBHOOK_SECRET.encode("utf-8"),
        payload,
        hashlib.sha256,
    ).hexdigest()
    if not hmac.compare_digest(computed, signature):
        raise HTTPException(status_code=400, detail="Invalid webhook signature.")

    import json
    event = json.loads(payload)
    event_name = event.get("meta", {}).get("event_name", "")
    event_id = event.get("meta", {}).get("webhook_id") or event.get("data", {}).get("id", "")

    # Idempotency check
    if event_id:
        existing = db.query(PaymentEvent).filter(PaymentEvent.stripe_event_id == event_id).first()
        if existing:
            return {"received": True, "duplicate": True}

    handlers = {
        "subscription_created": _handle_subscription_created,
        "subscription_updated": _handle_subscription_updated,
        "subscription_cancelled": _handle_subscription_cancelled,
        "subscription_expired": _handle_subscription_expired,
        "subscription_payment_success": _handle_payment_success,
        "subscription_payment_failed": _handle_payment_failed,
    }
    handler = handlers.get(event_name)
    if handler:
        handler(event, db)

    obj_data = event.get("data", {})
    _log_event(
        db=db,
        stripe_event_id=event_id or f"{event_name}_{datetime.now(timezone.utc).timestamp()}",
        event_type=event_name,
        stripe_object_id=obj_data.get("id"),
        raw_payload=event,
    )
    return {"received": True}


def _find_user_by_customer(customer_id: str, db: Session):
    from app.models.user import User
    return db.query(User).filter(User.lms_customer_id == str(customer_id)).first()


def _find_user_by_custom_data(event: dict, db: Session):
    """Find user via custom_data.user_id passed at checkout creation."""
    from app.models.user import User
    user_id = event.get("meta", {}).get("custom_data", {}).get("user_id")
    if user_id:
        return db.query(User).filter(User.id == user_id).first()
    return None


def _get_user_from_event(event: dict, db: Session):
    """Try customer ID first, fall back to custom_data user_id."""
    attrs = event.get("data", {}).get("attributes", {})
    customer_id = attrs.get("customer_id")
    if customer_id:
        user = _find_user_by_customer(str(customer_id), db)
        if user:
            return user
    return _find_user_by_custom_data(event, db)


def _handle_subscription_created(event: dict, db: Session):
    user = _get_user_from_event(event, db)
    if not user:
        return
    attrs = event["data"]["attributes"]
    variant_id = str(attrs.get("variant_id", ""))
    plan = plan_from_variant_id(variant_id, settings) or PLAN_FREE
    renews_at = attrs.get("renews_at")
    ends_at = attrs.get("ends_at")
    expires = renews_at or ends_at
    customer_id = attrs.get("customer_id")

    user.plan = plan
    user.lms_subscription_id = str(event["data"]["id"])
    user.lms_variant_id = variant_id
    user.lms_customer_id = str(customer_id) if customer_id else user.lms_customer_id
    user.subscription_status = attrs.get("status", "active")
    user.subscription_canceled_at = None
    if expires:
        user.plan_expires_at = datetime.fromisoformat(expires.replace("Z", "+00:00"))
    db.add(user)
    db.commit()


def _handle_subscription_updated(event: dict, db: Session):
    user = _get_user_from_event(event, db)
    if not user:
        return
    attrs = event["data"]["attributes"]
    variant_id = str(attrs.get("variant_id", ""))
    plan = plan_from_variant_id(variant_id, settings) or PLAN_FREE
    renews_at = attrs.get("renews_at")
    ends_at = attrs.get("ends_at")
    expires = renews_at or ends_at

    user.plan = plan
    user.lms_variant_id = variant_id
    user.subscription_status = attrs.get("status", "active")
    if expires:
        user.plan_expires_at = datetime.fromisoformat(expires.replace("Z", "+00:00"))
    if attrs.get("cancelled") and not user.subscription_canceled_at:
        user.subscription_canceled_at = datetime.now(timezone.utc)
    elif not attrs.get("cancelled"):
        user.subscription_canceled_at = None
    db.add(user)
    db.commit()


def _handle_subscription_cancelled(event: dict, db: Session):
    user = _get_user_from_event(event, db)
    if not user:
        return
    attrs = event["data"]["attributes"]
    ends_at = attrs.get("ends_at") or attrs.get("renews_at")
    user.subscription_status = "canceled"
    user.subscription_canceled_at = datetime.now(timezone.utc)
    if ends_at:
        user.plan_expires_at = datetime.fromisoformat(ends_at.replace("Z", "+00:00"))
    db.add(user)
    db.commit()


def _handle_subscription_expired(event: dict, db: Session):
    user = _get_user_from_event(event, db)
    if not user:
        return
    user.plan = PLAN_FREE
    user.subscription_status = "expired"
    user.lms_subscription_id = None
    user.lms_variant_id = None
    user.plan_expires_at = None
    db.add(user)
    db.commit()


def _handle_payment_success(event: dict, db: Session):
    user = _get_user_from_event(event, db)
    if not user:
        return
    attrs = event["data"]["attributes"]
    renews_at = attrs.get("renews_at")
    if renews_at:
        user.plan_expires_at = datetime.fromisoformat(renews_at.replace("Z", "+00:00"))
    user.subscription_status = "active"
    db.add(user)
    db.commit()


def _handle_payment_failed(event: dict, db: Session):
    user = _get_user_from_event(event, db)
    if not user:
        return
    user.subscription_status = "past_due"
    db.add(user)
    db.commit()


def sync_subscription_for_user(user, db: Session) -> dict:
    """
    Actively fetch the latest subscription from Lemon Squeezy for this user
    and update the DB. Called after checkout redirect when webhook may not
    have fired yet (e.g. localhost development).
    """
    _require_config()
    with httpx.Client() as client:
        # Query subscriptions filtered by user email + store
        resp = client.get(
            f"{LMS_API_BASE}/subscriptions",
            params={
                "filter[user_email]": user.email,
                "filter[store_id]": str(settings.LMS_STORE_ID),
                "page[size]": "5",
            },
            headers=_headers(),
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail=f"Could not fetch subscriptions: {resp.text}")

        data = resp.json()
        subscriptions = data.get("data", [])

    if not subscriptions:
        return {"synced": False, "plan": user.plan}

    # Find the most relevant active subscription
    # Priority: active > on_trial > past_due > others
    priority = {"active": 0, "on_trial": 1, "past_due": 2}
    subscriptions.sort(key=lambda s: priority.get(s["attributes"].get("status", ""), 99))
    sub = subscriptions[0]

    attrs = sub["attributes"]
    variant_id = str(attrs.get("variant_id", ""))
    plan = plan_from_variant_id(variant_id, settings) or PLAN_FREE
    status = attrs.get("status", "active")
    renews_at = attrs.get("renews_at")
    ends_at = attrs.get("ends_at")
    expires = renews_at or ends_at
    customer_id = attrs.get("customer_id")

    user.plan = plan
    user.lms_subscription_id = str(sub["id"])
    user.lms_variant_id = variant_id
    if customer_id:
        user.lms_customer_id = str(customer_id)
    user.subscription_status = status
    user.subscription_canceled_at = None if not attrs.get("cancelled") else user.subscription_canceled_at
    if expires:
        user.plan_expires_at = datetime.fromisoformat(expires.replace("Z", "+00:00"))

    db.add(user)
    db.commit()
    db.refresh(user)

    return {"synced": True, "plan": plan, "status": status}


def _log_event(db: Session, stripe_event_id: str, event_type: str,
               stripe_object_id=None, amount_cents=None, currency=None,
               plan_keyword=None, status=None, raw_payload=None, user_id=None):
    try:
        evt = PaymentEvent(
            stripe_event_id=stripe_event_id,
            event_type=event_type,
            stripe_object_id=stripe_object_id,
            amount_cents=amount_cents,
            currency=currency,
            plan_keyword=plan_keyword,
            status=status,
            raw_payload=raw_payload,
            user_id=user_id,
        )
        db.add(evt)
        db.commit()
    except Exception:
        db.rollback()
