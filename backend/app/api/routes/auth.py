"""
Authentication routes for MindStash

Endpoints:
- POST /register - Register new user
- POST /login - User login with JWT tokens
- POST /refresh - Refresh access token

Rate Limits (IP-based to prevent brute force):
- Register: 20/hour
- Login: 60/hour (increased for better dev experience)
- Refresh: 100/hour
- Get current user: 500/hour
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Header, Request

logger = logging.getLogger(__name__)
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from datetime import datetime, timedelta
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    generate_reset_token,
    hash_reset_token,
)
from app.core.rate_limit import limiter, user_limiter
from app.models.user import User
from app.schemas.user import (
    UserCreate, UserLogin, UserResponse, TokenResponse,
    UserProfileUpdate, PasswordChange,
    ForgotPasswordRequest, ResetPasswordRequest,
)
from app.api.dependencies import get_current_user
from app.services.notifications.sender import send_welcome_email, send_password_reset_email

router = APIRouter(tags=["authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("20/hour")
def register(request: Request, user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user.

    Rate Limit: 20 requests per hour per IP (prevents mass account creation)

    Args:
        request: FastAPI request object (required for rate limiting)
        user_data: UserCreate schema with email and password
        db: Database session

    Returns:
        UserResponse with user details (no password)

    Raises:
        HTTPException 400: If email already exists
        HTTPException 429: If rate limit exceeded
    """
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Hash password
    hashed_password = get_password_hash(user_data.password)

    # Create new user
    new_user = User(
        email=user_data.email,
        name=user_data.name,
        hashed_password=hashed_password
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Send welcome email (non-blocking — registration succeeds even if email fails)
    try:
        send_welcome_email(new_user)
    except Exception as e:
        logger.warning(f"Welcome email failed for {new_user.email}: {e}")

    return new_user


@router.post("/login", response_model=TokenResponse)
@limiter.limit("60/hour")
def login(request: Request, user_credentials: UserLogin, db: Session = Depends(get_db)):
    """
    User login with email and password.

    Rate Limit: 60 requests per hour per IP (prevents brute force attacks)

    Args:
        request: FastAPI request object (required for rate limiting)
        user_credentials: UserLogin schema with email and password
        db: Database session

    Returns:
        TokenResponse with access_token, refresh_token, and token_type

    Raises:
        HTTPException 404: If user not found
        HTTPException 401: If password is incorrect
        HTTPException 429: If rate limit exceeded
    """
    # Find user by email
    user = db.query(User).filter(User.email == user_credentials.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Verify password
    if not verify_password(user_credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password"
        )

    # Create tokens
    token_data = {"sub": user.email}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer"
    )


@router.post("/refresh", response_model=TokenResponse)
@limiter.limit("100/hour")
def refresh_token(request: Request, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    """
    Refresh access token using refresh token.

    Rate Limit: 100 requests per hour per IP

    Args:
        request: FastAPI request object (required for rate limiting)
        authorization: Authorization header with Bearer token
        db: Database session

    Returns:
        TokenResponse with new access_token and refresh_token

    Raises:
        HTTPException 401: If token is missing, invalid, or expired
        HTTPException 429: If rate limit exceeded
    """
    # Check if authorization header exists
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing"
        )

    # Extract token from "Bearer <token>"
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication scheme"
            )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format"
        )

    # Decode and validate token
    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

    # Extract email from token
    email = payload.get("sub")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )

    # Verify user still exists
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Create new tokens
    token_data = {"sub": user.email}
    new_access_token = create_access_token(token_data)
    new_refresh_token = create_refresh_token(token_data)

    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer"
    )


@router.get("/me", response_model=UserResponse)
@limiter.limit("500/hour")
def get_current_user_info(request: Request, current_user: User = Depends(get_current_user)):
    """
    Get current authenticated user information.

    Rate Limit: 500 requests per hour per IP

    This is a protected endpoint that demonstrates the get_current_user dependency.
    Requires a valid JWT access token in the Authorization header.

    Args:
        request: FastAPI request object (required for rate limiting)
        current_user: Current authenticated user from get_current_user dependency

    Returns:
        UserResponse with current user details

    Raises:
        HTTPException 401: If token is invalid or user not found
        HTTPException 429: If rate limit exceeded
    """
    return current_user


@router.patch("/me", response_model=UserResponse)
@user_limiter.limit("30/hour")
def update_profile(
    request: Request,
    data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update the current user's display name."""
    current_user.name = data.name
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/change-password", status_code=204)
@user_limiter.limit("10/hour")
def change_password(
    request: Request,
    data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change the current user's password."""
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    current_user.hashed_password = get_password_hash(data.new_password)
    db.commit()


@router.post("/forgot-password")
@limiter.limit("5/hour")
def forgot_password(request: Request, data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Request a password reset email.

    Always returns 200 regardless of whether the email is registered,
    to prevent user enumeration.

    Rate Limit: 5 requests per hour per IP
    """
    _GENERIC_RESPONSE = {"message": "If this email is registered, you will receive a reset link shortly"}

    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        logger.warning(f"Password reset requested for unknown email: {data.email}")
        return _GENERIC_RESPONSE

    raw_token, token_hash = generate_reset_token()
    user.password_reset_token_hash = token_hash
    user.password_reset_expires_at = datetime.utcnow() + timedelta(hours=1)
    db.commit()

    try:
        send_password_reset_email(user, raw_token)
    except Exception as e:
        logger.error(f"Password reset email failed for {user.email}: {e}")

    return _GENERIC_RESPONSE


@router.post("/reset-password")
@limiter.limit("10/hour")
def reset_password(request: Request, data: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Reset a user's password using a valid reset token.

    Rate Limit: 10 requests per hour per IP

    Raises:
        HTTPException 400: If token is invalid or expired
    """
    token_hash = hash_reset_token(data.token)
    now = datetime.utcnow()

    user = db.query(User).filter(
        User.password_reset_token_hash == token_hash,
        User.password_reset_expires_at > now,
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset link"
        )

    user.hashed_password = get_password_hash(data.new_password)
    user.password_reset_token_hash = None
    user.password_reset_expires_at = None
    db.commit()

    logger.info(f"Password reset successful for {user.email}")
    return {"message": "Password reset successfully. You can now log in with your new password."}
