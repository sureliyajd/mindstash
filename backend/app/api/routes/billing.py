"""
Billing routes for MindStash subscription management.

Endpoints:
- GET /api/billing/status  - Current plan, usage, and features
- POST /api/billing/checkout - Create Lemon Squeezy checkout session
- POST /api/billing/portal   - Open Lemon Squeezy customer portal
- POST /api/billing/cancel   - Cancel subscription at period end
- POST /api/webhooks/lemonsqueezy  - Lemon Squeezy webhook handler (no auth)
"""
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import get_settings
from app.core.plans import get_plan_limit, plan_has_feature
from app.api.dependencies import get_current_user
from app.services.plan import get_user_plan, reset_monthly_usage_if_needed
from app.services import lemonsqueezy_service
from app.schemas.billing import (
    BillingStatusResponse, BillingUsage, BillingFeatures,
    CheckoutRequest, CheckoutResponse, PortalResponse
)

router = APIRouter()
settings = get_settings()


@router.get("/status", response_model=BillingStatusResponse)
def get_billing_status(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    reset_monthly_usage_if_needed(current_user, db)
    plan = get_user_plan(current_user)
    return BillingStatusResponse(
        plan=plan,
        subscription_status=current_user.subscription_status,
        plan_expires_at=current_user.plan_expires_at,
        subscription_canceled_at=current_user.subscription_canceled_at,
        usage=BillingUsage(
            items_this_month=current_user.items_this_month or 0,
            items_limit=get_plan_limit(plan, "items_per_month"),
            chat_messages_this_month=current_user.chat_messages_this_month or 0,
            chat_messages_limit=get_plan_limit(plan, "chat_messages_per_month"),
        ),
        features=BillingFeatures(
            semantic_search=plan_has_feature(plan, "semantic_search"),
            telegram=plan_has_feature(plan, "telegram"),
            daily_briefing=plan_has_feature(plan, "daily_briefing"),
            weekly_digest=plan_has_feature(plan, "weekly_digest"),
        ),
        payments_configured=bool(settings.LMS_API_KEY),
        variant_ids={
            "starter_monthly": settings.LMS_VARIANT_STARTER_MONTHLY,
            "starter_annual": settings.LMS_VARIANT_STARTER_ANNUAL,
            "pro_monthly": settings.LMS_VARIANT_PRO_MONTHLY,
            "pro_annual": settings.LMS_VARIANT_PRO_ANNUAL,
        },
    )


@router.post("/checkout", response_model=CheckoutResponse)
def create_checkout(
    body: CheckoutRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    url = lemonsqueezy_service.create_checkout_session(
        user=current_user,
        db=db,
        variant_id=body.variant_id,
        success_url=body.success_url,
        cancel_url=body.cancel_url,
    )
    return CheckoutResponse(checkout_url=url)


@router.post("/portal", response_model=PortalResponse)
def open_portal(
    request: Request,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return_url = str(request.base_url) + "billing"
    url = lemonsqueezy_service.create_portal_session(user=current_user, return_url=return_url)
    return PortalResponse(portal_url=url)


@router.post("/sync")
def sync_subscription(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Actively pull the latest subscription state from Lemon Squeezy and
    update the user's plan in the DB. Called after checkout redirect to
    handle cases where the webhook hasn't fired yet (e.g. localhost dev).
    """
    return lemonsqueezy_service.sync_subscription_for_user(user=current_user, db=db)


@router.post("/cancel")
def cancel_subscription(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return lemonsqueezy_service.cancel_subscription_at_period_end(user=current_user, db=db)


# Webhook router (separate, no auth)
webhook_router = APIRouter()


@webhook_router.post("/lemonsqueezy")
async def lemonsqueezy_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("x-signature", "")
    return lemonsqueezy_service.handle_webhook(payload=payload, signature=sig_header, db=db)
