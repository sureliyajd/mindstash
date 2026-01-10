"""
Item routes for MindStash - CRUD operations with AI categorization

Endpoints:
- POST / - Create item with AI categorization
- GET / - List items with module filtering, search, and pagination
- GET /counts - Get item counts per module
- GET /{item_id} - Get single item
- PUT /{item_id} - Update item
- DELETE /{item_id} - Delete item
- POST /mark-surfaced - Mark items as surfaced (for Today module tracking)
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func, cast, String
from sqlalchemy.dialects.postgresql import ARRAY
from typing import Optional, Literal, List
from uuid import UUID
from datetime import datetime, timedelta

from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.models.item import Item
from app.schemas.item import (
    ItemCreate,
    ItemUpdate,
    ItemResponse,
    ItemListResponse,
    MarkSurfacedRequest,
    MarkSurfacedResponse,
    VALID_CATEGORIES
)
from app.services.ai.categorizer import categorize_item

router = APIRouter(tags=["items"])

# Valid module types for filtering
VALID_MODULES = Literal["all", "today", "tasks", "read_later", "ideas", "insights", "archived"]
VALID_URGENCIES = Literal["low", "medium", "high"]


def build_today_smart_filter():
    """
    Build the smart resurfacing filter for the "Today" module.

    This creates an intelligent daily digest by resurfacing items based on:
    1. urgency = "high" (always show urgent items)
    2. time_context = "immediate" (always show immediate items)
    3. time_context = "next_week" AND created_at >= 7 days ago (resurface weekly items)
    4. action_required = True AND last_surfaced_at is NULL (never seen tasks)
    5. action_required = True AND last_surfaced_at < 3 days ago (resurface tasks every 3 days)
    6. intent = "learn" AND last_surfaced_at < 7 days ago (resurface learning items weekly)

    Returns:
        SQLAlchemy OR filter expression for the Today module
    """
    now = datetime.utcnow()
    three_days_ago = now - timedelta(days=3)
    seven_days_ago = now - timedelta(days=7)

    return or_(
        # 1. Always show high urgency items
        Item.urgency == "high",

        # 2. Always show immediate items
        Item.time_context == "immediate",

        # 3. Resurface "next_week" items that are at least 7 days old
        and_(
            Item.time_context == "next_week",
            Item.created_at <= seven_days_ago
        ),

        # 4. Action items never surfaced before
        and_(
            Item.action_required == True,
            Item.last_surfaced_at.is_(None)
        ),

        # 5. Action items not surfaced in last 3 days
        and_(
            Item.action_required == True,
            Item.last_surfaced_at < three_days_ago
        ),

        # 6. Learning items not surfaced in last 7 days
        and_(
            Item.intent == "learn",
            or_(
                Item.last_surfaced_at.is_(None),
                Item.last_surfaced_at < seven_days_ago
            )
        )
    )


@router.post("/", response_model=ItemResponse, status_code=status.HTTP_201_CREATED)
def create_item(
    item_data: ItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new item with AI categorization.

    This endpoint:
    1. Creates an item in the database with user content
    2. Calls AI categorizer to analyze and categorize the content
    3. Updates the item with AI-generated metadata
    4. Returns the complete item with all fields

    Args:
        item_data: ItemCreate schema with content (max 500 chars) and optional url
        current_user: Authenticated user from get_current_user dependency
        db: Database session

    Returns:
        ItemResponse with all fields including AI categorization

    Raises:
        HTTPException 400: If content validation fails
    """
    # Create initial item in database
    new_item = Item(
        user_id=current_user.id,
        content=item_data.content,
        url=item_data.url
    )

    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    # Call AI categorizer
    try:
        ai_result = categorize_item(
            content=item_data.content,
            url=item_data.url
        )

        # Update item with AI results
        new_item.category = ai_result.get("category", "save")
        new_item.tags = ai_result.get("tags", [])
        new_item.summary = ai_result.get("summary", item_data.content[:100])
        new_item.confidence = ai_result.get("confidence", 0.5)
        new_item.priority = ai_result.get("priority", "medium")
        new_item.time_sensitivity = ai_result.get("time_sensitivity", "reference")
        new_item.ai_metadata = ai_result

        # Store AI intelligence signals
        new_item.intent = ai_result.get("intent", "reference")
        new_item.action_required = ai_result.get("action_required", False)
        new_item.urgency = ai_result.get("urgency", "low")
        new_item.time_context = ai_result.get("time_context", "someday")
        new_item.resurface_strategy = ai_result.get("resurface_strategy", "manual")
        new_item.suggested_bucket = ai_result.get("suggested_bucket", "Insights")

        db.commit()
        db.refresh(new_item)

    except Exception as e:
        # If AI fails, item still exists with basic data
        print(f"⚠️  AI categorization failed: {e}")
        # Item will have None values for AI fields

    return new_item


@router.post("/mark-surfaced", response_model=MarkSurfacedResponse)
def mark_items_surfaced(
    request: MarkSurfacedRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mark items as surfaced (shown in Today module).

    This endpoint updates the last_surfaced_at timestamp for the specified items,
    which affects the smart resurfacing logic in the Today module. Items that have
    been recently surfaced will not reappear until their resurfacing conditions
    are met again.

    Use this endpoint when:
    - User views the Today module (mark all displayed items)
    - User interacts with a specific item from Today

    Args:
        request: MarkSurfacedRequest with list of item IDs
        current_user: Authenticated user
        db: Database session

    Returns:
        MarkSurfacedResponse with count of updated items

    Raises:
        HTTPException 400: If no valid item IDs provided
    """
    now = datetime.utcnow()

    # Update only items owned by the current user
    updated_count = db.query(Item).filter(
        Item.id.in_(request.item_ids),
        Item.user_id == current_user.id
    ).update(
        {"last_surfaced_at": now},
        synchronize_session=False
    )

    db.commit()

    if updated_count == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid items found to update"
        )

    return MarkSurfacedResponse(
        updated_count=updated_count,
        message=f"Successfully marked {updated_count} item(s) as surfaced"
    )


@router.get("/", response_model=ItemListResponse)
def list_items(
    # Module filter (AI-driven views)
    module: Optional[str] = Query(
        None,
        description="Filter by module: all, today, tasks, read_later, ideas, insights, archived"
    ),
    # Category filter (12 MindStash categories)
    category: Optional[str] = Query(
        None,
        description="Filter by category (one of 12) or 'all'"
    ),
    # Search functionality
    search: Optional[str] = Query(
        None,
        min_length=1,
        max_length=100,
        description="Search term for content, tags, and summary"
    ),
    # Additional filters
    urgency_filter: Optional[str] = Query(
        None,
        description="Filter by urgency: low, medium, high"
    ),
    tag: Optional[str] = Query(
        None,
        description="Filter by specific tag"
    ),
    # Pagination
    page: int = Query(1, ge=1, description="Page number (starts at 1)"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page (max 100)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List items with module filtering, search, and pagination.

    Features:
    - Module filtering (AI-driven views on same dataset)
    - Category filtering (12 MindStash categories)
    - Full-text search across content, tags, and summary
    - Urgency and tag filters
    - Pagination with configurable page size
    - Only returns current user's items
    - Ordered by created_at DESC (newest first)

    Modules (combine category + AI intent for intuitive filtering):
    - all: No filter (all items)
    - today: urgency=high OR time_context=immediate
    - tasks: category=tasks OR (action_required=True AND intent=task)
    - read_later: category IN [read, watch, learn] OR intent=learn
    - ideas: category=ideas OR intent=idea
    - insights: category IN [journal, notes] OR intent=reflection
    - archived: (placeholder for future archived status)

    All filters are combinable:
    - Example: module=tasks&urgency_filter=high&search=aws

    Args:
        module: AI-driven view filter
        category: Category filter (one of 12 categories or "all")
        search: Search term for content, tags, summary
        urgency_filter: Filter by urgency level
        tag: Filter by specific tag
        page: Page number (starts at 1)
        page_size: Items per page (1-100, default 20)
        current_user: Authenticated user
        db: Database session

    Returns:
        ItemListResponse with filtered items, total count, page, and page_size

    Raises:
        HTTPException 400: If invalid filter values provided
    """
    # Start query with user filter
    query = db.query(Item).filter(Item.user_id == current_user.id)

    # ==========================================================================
    # 1. Apply Module Filter (combines category + AI intent for intuitive filtering)
    # ==========================================================================
    if module and module.lower() != "all":
        valid_modules = ["all", "today", "tasks", "read_later", "ideas", "insights", "archived"]

        if module not in valid_modules:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid module. Must be one of: {', '.join(valid_modules)}"
            )

        if module == "today":
            # Smart resurfacing logic for intelligent daily digest
            query = query.filter(build_today_smart_filter())

        elif module == "tasks":
            # Category is tasks OR (action_required AND intent is task)
            query = query.filter(
                or_(
                    Item.category == "tasks",
                    (Item.action_required == True) & (Item.intent == "task")
                )
            )

        elif module == "read_later":
            # Category is read/watch/learn OR intent is learn
            query = query.filter(
                or_(
                    Item.category.in_(["read", "watch", "learn"]),
                    Item.intent == "learn"
                )
            )

        elif module == "ideas":
            # Category is ideas OR intent is idea
            query = query.filter(
                or_(
                    Item.category == "ideas",
                    Item.intent == "idea"
                )
            )

        elif module == "insights":
            # Category is journal/notes OR intent is reflection
            query = query.filter(
                or_(
                    Item.category.in_(["journal", "notes"]),
                    Item.intent == "reflection"
                )
            )

        elif module == "archived":
            # Placeholder for future archived status field
            # For now, return empty (no items have archived status yet)
            query = query.filter(False)  # Returns no items

    # ==========================================================================
    # 2. Apply Category Filter (if provided alongside module)
    # ==========================================================================
    if category and category.lower() != "all":
        valid_categories = [
            "read", "watch", "ideas", "tasks", "people", "notes",
            "goals", "buy", "places", "journal", "learn", "save"
        ]
        if category not in valid_categories:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid category. Must be one of: {', '.join(valid_categories)}"
            )
        query = query.filter(Item.category == category)

    # ==========================================================================
    # 3. Apply Search Filter
    # ==========================================================================
    if search:
        search_term = f"%{search.lower()}%"
        # Search across content, summary, and tags
        # For tags (JSONB array), we check if any tag contains the search term
        query = query.filter(
            or_(
                func.lower(Item.content).like(search_term),
                func.lower(Item.summary).like(search_term),
                # For JSONB array, cast to text and search
                func.lower(cast(Item.tags, String)).like(search_term)
            )
        )

    # ==========================================================================
    # 4. Apply Urgency Filter
    # ==========================================================================
    if urgency_filter:
        valid_urgencies = ["low", "medium", "high"]
        if urgency_filter not in valid_urgencies:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid urgency. Must be one of: {', '.join(valid_urgencies)}"
            )
        query = query.filter(Item.urgency == urgency_filter)

    # ==========================================================================
    # 5. Apply Tag Filter
    # ==========================================================================
    if tag:
        # Filter items where the tag exists in the tags JSONB array
        # Using PostgreSQL's @> operator for array containment
        query = query.filter(Item.tags.contains([tag]))

    # ==========================================================================
    # 6. Get Total Count and Apply Pagination
    # ==========================================================================
    total = query.count()

    offset = (page - 1) * page_size
    items = query.order_by(Item.created_at.desc()).offset(offset).limit(page_size).all()

    return ItemListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/counts")
def get_item_counts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get item counts per module for the current user.

    Returns count of items that would appear in each module view.
    Useful for displaying badges/counts in the module navigation.

    Returns:
        Dict with module names as keys and counts as values:
        {
            "all": 42,
            "today": 3,
            "tasks": 7,
            "read_later": 12,
            "ideas": 8,
            "insights": 5,
            "archived": 0
        }
    """
    # Base query for user's items
    base_query = db.query(Item).filter(Item.user_id == current_user.id)

    # Count all items
    all_count = base_query.count()

    # Count "today" items: Smart resurfacing logic
    today_count = base_query.filter(build_today_smart_filter()).count()

    # Count "tasks" items: category=tasks OR (action_required AND intent=task)
    tasks_count = base_query.filter(
        or_(
            Item.category == "tasks",
            (Item.action_required == True) & (Item.intent == "task")
        )
    ).count()

    # Count "read_later" items: category IN [read, watch, learn] OR intent=learn
    read_later_count = base_query.filter(
        or_(
            Item.category.in_(["read", "watch", "learn"]),
            Item.intent == "learn"
        )
    ).count()

    # Count "ideas" items: category=ideas OR intent=idea
    ideas_count = base_query.filter(
        or_(
            Item.category == "ideas",
            Item.intent == "idea"
        )
    ).count()

    # Count "insights" items: category IN [journal, notes] OR intent=reflection
    insights_count = base_query.filter(
        or_(
            Item.category.in_(["journal", "notes"]),
            Item.intent == "reflection"
        )
    ).count()

    # Archived count (placeholder - always 0 for now)
    archived_count = 0

    return {
        "all": all_count,
        "today": today_count,
        "tasks": tasks_count,
        "read_later": read_later_count,
        "ideas": ideas_count,
        "insights": insights_count,
        "archived": archived_count,
    }


@router.get("/{item_id}", response_model=ItemResponse)
def get_item(
    item_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a single item by ID.

    Args:
        item_id: UUID of the item to retrieve
        current_user: Authenticated user
        db: Database session

    Returns:
        ItemResponse with complete item details

    Raises:
        HTTPException 404: If item not found or doesn't belong to user
    """
    item = db.query(Item).filter(
        Item.id == item_id,
        Item.user_id == current_user.id
    ).first()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )

    return item


@router.put("/{item_id}", response_model=ItemResponse)
def update_item(
    item_id: UUID,
    item_data: ItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update an existing item.

    Allows updating:
    - content (enforces 500 char limit)
    - url
    - category (validates it's one of 12 valid categories)

    Args:
        item_id: UUID of the item to update
        item_data: ItemUpdate schema with optional fields
        current_user: Authenticated user
        db: Database session

    Returns:
        ItemResponse with updated item details

    Raises:
        HTTPException 404: If item not found or doesn't belong to user
        HTTPException 400: If invalid category provided
    """
    # Find item and verify ownership
    item = db.query(Item).filter(
        Item.id == item_id,
        Item.user_id == current_user.id
    ).first()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )

    # Update fields if provided
    update_data = item_data.dict(exclude_unset=True)

    for field, value in update_data.items():
        setattr(item, field, value)

    # updated_at will be automatically updated by SQLAlchemy (onupdate)
    db.commit()
    db.refresh(item)

    return item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(
    item_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete an item.

    Args:
        item_id: UUID of the item to delete
        current_user: Authenticated user
        db: Database session

    Returns:
        204 No Content on success

    Raises:
        HTTPException 404: If item not found or doesn't belong to user
    """
    # Find item and verify ownership
    item = db.query(Item).filter(
        Item.id == item_id,
        Item.user_id == current_user.id
    ).first()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )

    db.delete(item)
    db.commit()

    return None
