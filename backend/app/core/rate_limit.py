"""
Rate limiting configuration for MindStash API

This module provides production-grade rate limiting using slowapi.
Supports both IP-based and user-based rate limiting strategies.

Rate Limits:
- Auth endpoints: IP-based (prevent brute force)
- Item endpoints: User-based (prevent abuse & control AI costs)
- Global fallback: 100 requests per hour per IP
"""
import logging
from slowapi import Limiter
from slowapi.util import get_remote_address
from fastapi import Request

from app.core.config import settings

logger = logging.getLogger(__name__)

# Initialize Redis connection (optional, uses in-memory if not available)
redis_client = None
storage_uri = "memory://"

if settings.REDIS_URL:
    try:
        import redis
        redis_client = redis.from_url(
            settings.REDIS_URL,
            decode_responses=True
        )
        # Test connection
        redis_client.ping()
        storage_uri = settings.REDIS_URL
        logger.info("Rate limiting: Using Redis storage")
    except Exception as e:
        logger.warning(f"Rate limiting: Redis connection failed ({e}), falling back to in-memory storage")
        redis_client = None
        storage_uri = "memory://"
else:
    logger.info("Rate limiting: Using in-memory storage (REDIS_URL not configured)")


def get_user_identifier(request: Request) -> str:
    """
    Get user-specific identifier for rate limiting.
    Uses user_id if authenticated, otherwise IP address.

    This enables per-user rate limiting for authenticated endpoints.
    """
    # Try to get user from request state (set by auth dependency)
    if hasattr(request.state, "user") and request.state.user:
        return f"user:{request.state.user.id}"

    # Fallback to IP address
    return get_remote_address(request)


# IP-based limiter (for auth endpoints - prevents brute force)
limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=storage_uri,
    default_limits=["100/hour"]  # Global fallback
)

# User-based limiter (for authenticated routes)
user_limiter = Limiter(
    key_func=get_user_identifier,
    storage_uri=storage_uri
)


def log_rate_limit_exceeded(request: Request, identifier: str):
    """Log when rate limit is exceeded for monitoring"""
    logger.warning(
        f"Rate limit exceeded: path={request.url.path} "
        f"method={request.method} "
        f"identifier={identifier}"
    )
