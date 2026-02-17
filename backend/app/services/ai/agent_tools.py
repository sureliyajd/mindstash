"""
Tool definitions and handlers for the MindStash AI agent.

Each tool has:
- A JSON schema (for Claude's tool_use)
- A handler function: (db, user_id, params) -> dict
"""
import json
import logging
from datetime import datetime, timedelta
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import or_, func, cast, String

from app.models.item import Item
from app.services.ai.tool_registry import registry
from app.services.ai.categorizer import categorize_item
from app.services.notifications.sender import get_upcoming_notifications
from app.services.notifications.digest import get_digest_preview

logger = logging.getLogger(__name__)

# Category emoji map for formatted output
CATEGORY_EMOJI = {
    "read": "📚", "watch": "🎥", "ideas": "💡", "tasks": "✅",
    "people": "👤", "notes": "📝", "goals": "🎯", "buy": "🛒",
    "places": "📍", "journal": "💭", "learn": "🎓", "save": "🔖",
}


# =============================================================================
# TOOL SCHEMAS
# =============================================================================

SEARCH_ITEMS_SCHEMA = {
    "name": "search_items",
    "description": "Search and filter the user's saved items. Use this to find items by text, category, urgency, module, or tag. Returns paginated results.",
    "input_schema": {
        "type": "object",
        "properties": {
            "search": {
                "type": "string",
                "description": "Text to search in content, summary, and tags"
            },
            "module": {
                "type": "string",
                "enum": ["all", "today", "tasks", "read_later", "ideas", "insights", "reminders"],
                "description": "Filter by module view"
            },
            "category": {
                "type": "string",
                "enum": ["read", "watch", "ideas", "tasks", "people", "notes", "goals", "buy", "places", "journal", "learn", "save"],
                "description": "Filter by category"
            },
            "urgency": {
                "type": "string",
                "enum": ["low", "medium", "high"],
                "description": "Filter by urgency level"
            },
            "tag": {
                "type": "string",
                "description": "Filter by a specific tag"
            },
            "page": {
                "type": "integer",
                "description": "Page number (default 1)",
                "default": 1
            },
            "page_size": {
                "type": "integer",
                "description": "Items per page (default 10, max 20)",
                "default": 10
            },
        },
        "required": [],
    },
}

CREATE_ITEM_SCHEMA = {
    "name": "create_item",
    "description": "Create a new item for the user. AI will automatically categorize it. Use this when the user wants to save a thought, task, idea, note, or any content.",
    "input_schema": {
        "type": "object",
        "properties": {
            "content": {
                "type": "string",
                "description": "The content to save (max 500 characters)"
            },
            "url": {
                "type": "string",
                "description": "Optional URL associated with the content"
            },
        },
        "required": ["content"],
    },
}

UPDATE_ITEM_SCHEMA = {
    "name": "update_item",
    "description": "Update an existing item. Can change content, category, tags, priority, or urgency.",
    "input_schema": {
        "type": "object",
        "properties": {
            "item_id": {"type": "string", "description": "UUID of the item to update"},
            "content": {"type": "string", "description": "New content (max 500 chars)"},
            "category": {
                "type": "string",
                "enum": ["read", "watch", "ideas", "tasks", "people", "notes", "goals", "buy", "places", "journal", "learn", "save"],
            },
            "tags": {
                "type": "array",
                "items": {"type": "string"},
                "description": "New tags list"
            },
            "priority": {"type": "string", "enum": ["low", "medium", "high"]},
            "urgency": {"type": "string", "enum": ["low", "medium", "high"]},
        },
        "required": ["item_id"],
    },
}

DELETE_ITEM_SCHEMA = {
    "name": "delete_item",
    "description": "Permanently delete an item. Use with caution.",
    "input_schema": {
        "type": "object",
        "properties": {
            "item_id": {"type": "string", "description": "UUID of the item to delete"},
        },
        "required": ["item_id"],
    },
}

MARK_COMPLETE_SCHEMA = {
    "name": "mark_complete",
    "description": "Mark an item as complete or incomplete. Completing an item also disables recurring notifications.",
    "input_schema": {
        "type": "object",
        "properties": {
            "item_id": {"type": "string", "description": "UUID of the item"},
            "completed": {"type": "boolean", "description": "True to mark complete, False for incomplete"},
        },
        "required": ["item_id", "completed"],
    },
}

GET_COUNTS_SCHEMA = {
    "name": "get_counts",
    "description": "Get a summary of item counts across all modules (all, today, tasks, read_later, ideas, insights, reminders). Use this to give the user an overview.",
    "input_schema": {
        "type": "object",
        "properties": {},
        "required": [],
    },
}

GET_UPCOMING_NOTIFICATIONS_SCHEMA = {
    "name": "get_upcoming_notifications",
    "description": "Get items with upcoming notifications within the next N days.",
    "input_schema": {
        "type": "object",
        "properties": {
            "days": {
                "type": "integer",
                "description": "Number of days to look ahead (default 7, max 30)",
                "default": 7,
            },
        },
        "required": [],
    },
}

GET_DIGEST_PREVIEW_SCHEMA = {
    "name": "get_digest_preview",
    "description": "Get a preview of the user's weekly digest: urgent items, pending tasks, upcoming notifications, and stats.",
    "input_schema": {
        "type": "object",
        "properties": {},
        "required": [],
    },
}

GENERATE_DAILY_BRIEFING_SCHEMA = {
    "name": "generate_daily_briefing",
    "description": (
        "Generate a comprehensive daily briefing for the user. Combines item counts, "
        "urgent items, pending tasks, upcoming notifications (next 3 days), and weekly stats "
        "into a single payload. Use this when the user asks for a daily briefing or when "
        "the message is '[BRIEFING]'."
    ),
    "input_schema": {
        "type": "object",
        "properties": {},
        "required": [],
    },
}


# =============================================================================
# TOOL HANDLERS
# =============================================================================

def _build_today_smart_filter():
    """Same logic as items.py build_today_smart_filter()"""
    from sqlalchemy import and_
    now = datetime.utcnow()
    three_days_ago = now - timedelta(days=3)
    seven_days_ago = now - timedelta(days=7)

    return or_(
        Item.urgency == "high",
        Item.time_context == "immediate",
        and_(Item.time_context == "next_week", Item.created_at <= seven_days_ago),
        and_(Item.action_required == True, Item.last_surfaced_at.is_(None)),
        and_(Item.action_required == True, Item.last_surfaced_at < three_days_ago),
        and_(
            Item.intent == "learn",
            or_(Item.last_surfaced_at.is_(None), Item.last_surfaced_at < seven_days_ago),
        ),
    )


def _item_to_dict(item: Item) -> dict:
    """Convert an Item to a lightweight dict for tool results."""
    emoji = CATEGORY_EMOJI.get(item.category or "", "📌")
    return {
        "id": str(item.id),
        "content": item.content[:200],
        "category": f"{emoji} {item.category}" if item.category else "uncategorized",
        "summary": item.summary,
        "urgency": item.urgency,
        "tags": item.tags or [],
        "is_completed": item.is_completed,
        "created_at": item.created_at.strftime("%b %d, %Y") if item.created_at else None,
    }


def handle_search_items(db: Session, user_id: UUID, params: dict) -> dict:
    query = db.query(Item).filter(Item.user_id == user_id)

    module = params.get("module")
    if module and module != "all":
        if module == "today":
            query = query.filter(_build_today_smart_filter())
        elif module == "tasks":
            from sqlalchemy import and_
            query = query.filter(or_(
                Item.category == "tasks",
                (Item.action_required == True) & (Item.intent == "task"),
            ))
        elif module == "read_later":
            query = query.filter(or_(
                Item.category.in_(["read", "watch", "learn"]),
                Item.intent == "learn",
            ))
        elif module == "ideas":
            query = query.filter(or_(Item.category == "ideas", Item.intent == "idea"))
        elif module == "insights":
            query = query.filter(or_(
                Item.category.in_(["journal", "notes"]),
                Item.intent == "reflection",
            ))
        elif module == "reminders":
            query = query.filter(
                Item.notification_enabled == True,
                Item.next_notification_at.isnot(None),
            )

    category = params.get("category")
    if category:
        query = query.filter(Item.category == category)

    search = params.get("search")
    if search:
        term = f"%{search.lower()}%"
        query = query.filter(or_(
            func.lower(Item.content).like(term),
            func.lower(Item.summary).like(term),
            func.lower(cast(Item.tags, String)).like(term),
        ))

    urgency = params.get("urgency")
    if urgency:
        query = query.filter(Item.urgency == urgency)

    tag = params.get("tag")
    if tag:
        query = query.filter(Item.tags.contains([tag]))

    total = query.count()
    page = max(params.get("page", 1), 1)
    page_size = min(max(params.get("page_size", 10), 1), 20)
    offset = (page - 1) * page_size

    if module == "reminders":
        items_list = query.order_by(Item.next_notification_at.asc()).offset(offset).limit(page_size).all()
    else:
        items_list = query.order_by(Item.created_at.desc()).offset(offset).limit(page_size).all()

    return {
        "items": [_item_to_dict(i) for i in items_list],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


def handle_create_item(db: Session, user_id: UUID, params: dict) -> dict:
    content = params.get("content", "").strip()
    if not content:
        return {"error": "Content is required"}
    if len(content) > 500:
        return {"error": "Content must be 500 characters or less"}

    url = params.get("url")
    new_item = Item(user_id=user_id, content=content, url=url)
    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    try:
        ai_result = categorize_item(content=content, url=url)
        new_item.category = ai_result.get("category", "save")
        new_item.tags = ai_result.get("tags", [])
        new_item.summary = ai_result.get("summary", content[:100])
        new_item.confidence = ai_result.get("confidence", 0.5)
        new_item.priority = ai_result.get("priority", "medium")
        new_item.time_sensitivity = ai_result.get("time_sensitivity", "reference")
        new_item.intent = ai_result.get("intent", "reference")
        new_item.action_required = ai_result.get("action_required", False)
        new_item.urgency = ai_result.get("urgency", "low")
        new_item.time_context = ai_result.get("time_context", "someday")
        new_item.resurface_strategy = ai_result.get("resurface_strategy", "manual")
        new_item.suggested_bucket = ai_result.get("suggested_bucket", "Insights")

        # Sanitize ai_metadata for JSONB
        ai_metadata_sanitized = {}
        for key, value in ai_result.items():
            if isinstance(value, datetime):
                ai_metadata_sanitized[key] = value.isoformat()
            else:
                ai_metadata_sanitized[key] = value
        new_item.ai_metadata = ai_metadata_sanitized

        new_item.notification_date = ai_result.get("notification_date")
        new_item.notification_frequency = ai_result.get("notification_frequency", "never")
        new_item.next_notification_at = ai_result.get("next_notification_at")
        new_item.notification_enabled = ai_result.get("should_notify", False)

        db.commit()
        db.refresh(new_item)
    except Exception as e:
        logger.warning(f"AI categorization failed during chat create: {e}")

    emoji = CATEGORY_EMOJI.get(new_item.category or "", "📌")
    return {
        "created": True,
        "id": str(new_item.id),
        "content": new_item.content[:200],
        "category": f"{emoji} {new_item.category}" if new_item.category else "uncategorized",
        "summary": new_item.summary,
        "tags": new_item.tags or [],
        "mutated": True,
    }


def handle_update_item(db: Session, user_id: UUID, params: dict) -> dict:
    item_id = params.get("item_id")
    if not item_id:
        return {"error": "item_id is required"}

    item = db.query(Item).filter(Item.id == item_id, Item.user_id == user_id).first()
    if not item:
        return {"error": "Item not found"}

    updatable = ["content", "category", "tags", "priority", "urgency"]
    for field in updatable:
        if field in params:
            setattr(item, field, params[field])

    db.commit()
    db.refresh(item)

    return {"updated": True, "id": str(item.id), "mutated": True, **_item_to_dict(item)}


def handle_delete_item(db: Session, user_id: UUID, params: dict) -> dict:
    item_id = params.get("item_id")
    if not item_id:
        return {"error": "item_id is required"}

    item = db.query(Item).filter(Item.id == item_id, Item.user_id == user_id).first()
    if not item:
        return {"error": "Item not found"}

    content_preview = item.content[:80]
    db.delete(item)
    db.commit()

    return {"deleted": True, "id": item_id, "content_preview": content_preview, "mutated": True}


def handle_mark_complete(db: Session, user_id: UUID, params: dict) -> dict:
    item_id = params.get("item_id")
    completed = params.get("completed", True)
    if not item_id:
        return {"error": "item_id is required"}

    item = db.query(Item).filter(Item.id == item_id, Item.user_id == user_id).first()
    if not item:
        return {"error": "Item not found"}

    item.is_completed = completed
    if completed:
        item.completed_at = datetime.utcnow()
        if item.notification_frequency in ["weekly", "monthly", "daily"]:
            item.notification_enabled = False
            item.next_notification_at = None
    else:
        item.completed_at = None
        if item.notification_date:
            item.notification_enabled = True
            if item.notification_date > datetime.utcnow():
                item.next_notification_at = item.notification_date

    db.commit()
    db.refresh(item)

    return {
        "completed": completed,
        "id": str(item.id),
        "content": item.content[:100],
        "mutated": True,
    }


def handle_get_counts(db: Session, user_id: UUID, params: dict) -> dict:
    base = db.query(Item).filter(Item.user_id == user_id)

    return {
        "all": base.count(),
        "today": base.filter(_build_today_smart_filter()).count(),
        "tasks": base.filter(or_(
            Item.category == "tasks",
            (Item.action_required == True) & (Item.intent == "task"),
        )).count(),
        "read_later": base.filter(or_(
            Item.category.in_(["read", "watch", "learn"]),
            Item.intent == "learn",
        )).count(),
        "ideas": base.filter(or_(Item.category == "ideas", Item.intent == "idea")).count(),
        "insights": base.filter(or_(
            Item.category.in_(["journal", "notes"]),
            Item.intent == "reflection",
        )).count(),
        "reminders": base.filter(
            Item.notification_enabled == True,
            Item.next_notification_at.isnot(None),
        ).count(),
    }


def handle_get_upcoming_notifications(db: Session, user_id: UUID, params: dict) -> dict:
    days = min(max(params.get("days", 7), 1), 30)
    items_list = get_upcoming_notifications(str(user_id), db, days)

    return {
        "count": len(items_list),
        "days_ahead": days,
        "items": [
            {
                "id": str(i.id),
                "content": i.content[:100],
                "category": i.category,
                "next_notification_at": i.next_notification_at.isoformat() if i.next_notification_at else None,
                "notification_frequency": i.notification_frequency,
            }
            for i in items_list
        ],
    }


def handle_get_digest_preview(db: Session, user_id: UUID, params: dict) -> dict:
    return get_digest_preview(user_id, db)


def handle_generate_daily_briefing(db: Session, user_id: UUID, params: dict) -> dict:
    """Combine counts, urgent items, upcoming notifications, and weekly stats into one briefing payload."""
    counts = handle_get_counts(db, user_id, {})
    digest = handle_get_digest_preview(db, user_id, {})
    notifications = handle_get_upcoming_notifications(db, user_id, {"days": 3})

    return {
        "counts": counts,
        "urgent_items": digest.get("urgent_items", []),
        "urgent_count": digest.get("urgent_count", 0),
        "pending_tasks": digest.get("pending_tasks", []),
        "tasks_count": digest.get("tasks_count", 0),
        "upcoming_notifications": notifications.get("items", []),
        "upcoming_count": notifications.get("count", 0),
        "items_saved_this_week": digest.get("items_saved_this_week", 0),
        "completed_this_week": digest.get("completed_this_week", 0),
        "generated_at": datetime.utcnow().isoformat(),
    }


# =============================================================================
# REGISTER ALL TOOLS
# =============================================================================

def register_all_tools():
    """Register all tools with the global registry."""
    tools = [
        ("search_items", SEARCH_ITEMS_SCHEMA, handle_search_items),
        ("create_item", CREATE_ITEM_SCHEMA, handle_create_item),
        ("update_item", UPDATE_ITEM_SCHEMA, handle_update_item),
        ("delete_item", DELETE_ITEM_SCHEMA, handle_delete_item),
        ("mark_complete", MARK_COMPLETE_SCHEMA, handle_mark_complete),
        ("get_counts", GET_COUNTS_SCHEMA, handle_get_counts),
        ("get_upcoming_notifications", GET_UPCOMING_NOTIFICATIONS_SCHEMA, handle_get_upcoming_notifications),
        ("get_digest_preview", GET_DIGEST_PREVIEW_SCHEMA, handle_get_digest_preview),
        ("generate_daily_briefing", GENERATE_DAILY_BRIEFING_SCHEMA, handle_generate_daily_briefing),
    ]
    for name, schema, handler in tools:
        registry.register(name, schema, handler)


# Auto-register on import
register_all_tools()
