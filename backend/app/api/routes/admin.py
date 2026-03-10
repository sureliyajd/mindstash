"""
Admin routes for MindStash

All endpoints require admin privileges.
Guards: admin cannot act on themselves or other admins.
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.rate_limit import user_limiter
from app.models.user import User
from app.models.activity_log import ActivityLog
from app.schemas.user import AdminUserResponse, AdminUserUpdate, AdminUserListResponse
from app.schemas.activity import ActivityLogListResponse
from app.api.dependencies import require_admin

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Admin"])


def _get_target_user(user_id: str, db: Session, current_admin: User) -> User:
    """Fetch target user and guard against self-action and acting on other admins."""
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if str(target.id) == str(current_admin.id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot perform this action on your own account")
    if target.is_admin:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot perform this action on another admin")
    return target


@router.get("/users", response_model=AdminUserListResponse)
@user_limiter.limit("100/hour")
def list_users(
    request: Request,
    page: int = 1,
    page_size: int = 20,
    search: str = "",
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """List all users with optional search and pagination."""
    query = db.query(User)

    if search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            (User.email.ilike(term)) | (User.name.ilike(term))
        )

    total = query.count()
    users = query.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return AdminUserListResponse(
        users=users,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.patch("/users/{user_id}", response_model=AdminUserResponse)
@user_limiter.limit("50/hour")
def edit_user(
    request: Request,
    user_id: str,
    data: AdminUserUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Edit a user's name and/or email."""
    target = _get_target_user(user_id, db, current_admin)

    if data.email is not None and data.email != target.email:
        existing = db.query(User).filter(User.email == data.email).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already in use")
        target.email = data.email

    if data.name is not None:
        target.name = data.name

    db.commit()
    db.refresh(target)
    logger.info(f"Admin {current_admin.email} edited user {target.email}")
    return target


@router.post("/users/{user_id}/suspend", response_model=AdminUserResponse)
@user_limiter.limit("50/hour")
def suspend_user(
    request: Request,
    user_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Suspend a user account."""
    target = _get_target_user(user_id, db, current_admin)
    target.is_suspended = True
    db.commit()
    db.refresh(target)
    logger.info(f"Admin {current_admin.email} suspended user {target.email}")
    return target


@router.post("/users/{user_id}/unsuspend", response_model=AdminUserResponse)
@user_limiter.limit("50/hour")
def unsuspend_user(
    request: Request,
    user_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Unsuspend a user account."""
    target = _get_target_user(user_id, db, current_admin)
    target.is_suspended = False
    db.commit()
    db.refresh(target)
    logger.info(f"Admin {current_admin.email} unsuspended user {target.email}")
    return target


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
@user_limiter.limit("20/hour")
def delete_user(
    request: Request,
    user_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Permanently delete a user and all their data (cascade)."""
    target = _get_target_user(user_id, db, current_admin)
    email = target.email
    db.delete(target)
    db.commit()
    logger.info(f"Admin {current_admin.email} deleted user {email}")


@router.get("/users/{user_id}/activity", response_model=ActivityLogListResponse)
@user_limiter.limit("100/hour")
def get_user_activity(
    request: Request,
    user_id: str,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Get paginated activity log for any user (admin-only)."""
    request.state.user = current_admin

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    query = db.query(ActivityLog).filter(ActivityLog.user_id == user_id)
    total = query.count()
    logs = (
        query.order_by(ActivityLog.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return ActivityLogListResponse(logs=logs, total=total, page=page, page_size=page_size)
