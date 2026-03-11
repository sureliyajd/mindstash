"""
Plan definitions and limits for MindStash subscription tiers.
"""

PLAN_FREE = "free"
PLAN_STARTER = "starter"
PLAN_PRO = "pro"
ALL_PLANS = [PLAN_FREE, PLAN_STARTER, PLAN_PRO]

PLAN_LIMITS = {
    PLAN_FREE:    { "items_per_month": 30,  "chat_messages_per_month": 10,  "semantic_search": False, "telegram": False, "daily_briefing": False, "weekly_digest": False },
    PLAN_STARTER: { "items_per_month": 200, "chat_messages_per_month": 100, "semantic_search": False, "telegram": True,  "daily_briefing": False, "weekly_digest": True  },
    PLAN_PRO:     { "items_per_month": None,"chat_messages_per_month": None,"semantic_search": True,  "telegram": True,  "daily_briefing": True,  "weekly_digest": True  },
}

PLAN_PRICING = {
    PLAN_STARTER: { "monthly_cents": 700,  "annual_cents": 6700  },
    PLAN_PRO:     { "monthly_cents": 1500, "annual_cents": 14400 },
}


def get_plan_limit(plan: str, key: str):
    """Returns the limit value (None means unlimited, 0 means blocked)."""
    return PLAN_LIMITS.get(plan, PLAN_LIMITS[PLAN_FREE]).get(key)


def plan_has_feature(plan: str, feature: str) -> bool:
    """Returns True if the plan includes this feature."""
    limits = PLAN_LIMITS.get(plan, PLAN_LIMITS[PLAN_FREE])
    val = limits.get(feature, False)
    return bool(val)


def plan_from_variant_id(variant_id: str, settings) -> str | None:
    """Map a Lemon Squeezy variant ID back to a plan keyword."""
    mapping = {
        settings.LMS_VARIANT_STARTER_MONTHLY: PLAN_STARTER,
        settings.LMS_VARIANT_STARTER_ANNUAL: PLAN_STARTER,
        settings.LMS_VARIANT_PRO_MONTHLY: PLAN_PRO,
        settings.LMS_VARIANT_PRO_ANNUAL: PLAN_PRO,
    }
    return mapping.get(str(variant_id) if variant_id else "")


def get_variant_ids(settings) -> dict:
    """Returns all configured Lemon Squeezy variant IDs."""
    return {
        "starter_monthly": settings.LMS_VARIANT_STARTER_MONTHLY,
        "starter_annual": settings.LMS_VARIANT_STARTER_ANNUAL,
        "pro_monthly": settings.LMS_VARIANT_PRO_MONTHLY,
        "pro_annual": settings.LMS_VARIANT_PRO_ANNUAL,
    }
