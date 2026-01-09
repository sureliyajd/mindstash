"""
Item routes for MindStash - CRUD operations with AI categorization

Endpoints:
- POST / - Create item with AI categorization
- GET / - List items with filtering and pagination
- GET /{item_id} - Get single item
- PUT /{item_id} - Update item
- DELETE /{item_id} - Delete item
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID

from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.models.item import Item
from app.schemas.item import (
    ItemCreate,
    ItemUpdate,
    ItemResponse,
    ItemListResponse,
    VALID_CATEGORIES
)
from app.services.ai.categorizer import categorize_item

router = APIRouter(tags=["items"])


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

        db.commit()
        db.refresh(new_item)

    except Exception as e:
        # If AI fails, item still exists with basic data
        print(f"⚠️  AI categorization failed: {e}")
        # Item will have None values for AI fields

    return new_item


@router.get("/", response_model=ItemListResponse)
def list_items(
    category: Optional[str] = Query(None, description="Filter by category (one of 12) or 'all'"),
    page: int = Query(1, ge=1, description="Page number (starts at 1)"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page (max 100)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List items with filtering and pagination.

    Features:
    - Filter by category (one of 12 MindStash categories)
    - Pagination with configurable page size
    - Only returns current user's items
    - Ordered by created_at DESC (newest first)

    Args:
        category: Optional category filter (one of 12 categories or "all")
        page: Page number (starts at 1)
        page_size: Items per page (1-100, default 20)
        current_user: Authenticated user
        db: Database session

    Returns:
        ItemListResponse with items, total count, page, and page_size

    Raises:
        HTTPException 400: If invalid category provided
    """
    # Start query with user filter
    query = db.query(Item).filter(Item.user_id == current_user.id)

    # Apply category filter if provided and not "all"
    if category and category.lower() != "all":
        # Validate category is one of 12 valid categories
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

    # Get total count before pagination
    total = query.count()

    # Apply pagination
    offset = (page - 1) * page_size
    items = query.order_by(Item.created_at.desc()).offset(offset).limit(page_size).all()

    return ItemListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size
    )


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
