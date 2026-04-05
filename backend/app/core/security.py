"""
Security utilities for authentication
"""
import secrets
import hashlib
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against a hashed password.
    
    Args:
        plain_password: The plain text password
        hashed_password: The hashed password to verify against
        
    Returns:
        True if password matches, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Hash a password using bcrypt.
    
    Args:
        password: Plain text password to hash
        
    Returns:
        Hashed password string
    """
    return pwd_context.hash(password)


def create_access_token(data: dict) -> str:
    """
    Create a JWT access token (never expires).

    Args:
        data: Dictionary of data to encode in token

    Returns:
        Encoded JWT token string
    """
    to_encode = data.copy()
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def create_refresh_token(data: dict) -> str:
    """
    Create a JWT refresh token (never expires).

    Args:
        data: Dictionary of data to encode in token

    Returns:
        Encoded JWT refresh token string
    """
    to_encode = data.copy()
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def generate_reset_token() -> tuple[str, str]:
    """Generate a secure password reset token pair (raw, hash)."""
    raw = secrets.token_urlsafe(32)
    return raw, hashlib.sha256(raw.encode()).hexdigest()


def hash_reset_token(raw: str) -> str:
    """Hash a raw reset token using SHA-256."""
    return hashlib.sha256(raw.encode()).hexdigest()


def create_email_action_token(item_id: str, user_id: str, action: str) -> str:
    """
    Create a short-lived JWT for one-click email actions.

    Args:
        item_id: UUID of the item to act on
        user_id: UUID of the item owner
        action: "complete", "snooze", or "stop"

    Returns:
        Encoded JWT token string (expires in 7 days)
    """
    payload = {
        "item_id": str(item_id),
        "user_id": str(user_id),
        "action": action,
        "type": "email_action",
        "exp": datetime.utcnow() + timedelta(days=7),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_unsubscribe_token(user_id: str, email_type: str) -> str:
    """
    Create a long-lived JWT for one-click email unsubscribe.

    Args:
        user_id: UUID of the user
        email_type: "weekly_digest", "daily_briefing", or "item_reminders"

    Returns:
        Encoded JWT token string (expires in 30 days)
    """
    payload = {
        "user_id": str(user_id),
        "email_type": email_type,
        "type": "unsubscribe",
        "exp": datetime.utcnow() + timedelta(days=30),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_unsubscribe_token(token: str) -> Optional[dict]:
    """
    Decode an unsubscribe token WITH expiration verification.

    Returns:
        Decoded payload if valid and not expired, None otherwise
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        if payload.get("type") != "unsubscribe":
            return None
        return payload
    except JWTError:
        return None


def decode_email_action_token(token: str) -> Optional[dict]:
    """
    Decode an email action token WITH expiration verification.

    Returns:
        Decoded payload if valid and not expired, None otherwise
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        if payload.get("type") != "email_action":
            return None
        return payload
    except JWTError:
        return None


def decode_token(token: str) -> Optional[dict]:
    """
    Decode and verify a JWT token.
    
    Args:
        token: JWT token string to decode
        
    Returns:
        Decoded token payload or None if invalid
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
            options={"verify_exp": False}
        )
        return payload
    except JWTError:
        return None
