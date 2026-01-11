"""
FastAPI main application
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.database import Base, engine
from app.core.rate_limit import limiter, get_remote_address, log_rate_limit_exceeded

# Import models (required for SQLAlchemy relationships to work)
from app.models.user import User
from app.models.item import Item

# Import routers
from app.api.routes import auth, items, notifications

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="AI-powered contextual memory and task capture system",
    version="0.1.0",
    debug=settings.DEBUG,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add rate limiter to app state
app.state.limiter = limiter


# Custom rate limit exception handler
@app.exception_handler(RateLimitExceeded)
async def custom_rate_limit_handler(request: Request, exc: RateLimitExceeded):
    """Handle rate limit exceeded errors with user-friendly response"""
    identifier = get_remote_address(request)
    if hasattr(request.state, "user") and request.state.user:
        identifier = f"user:{request.state.user.id}"

    log_rate_limit_exceeded(request, identifier)

    # Extract retry after seconds from the exception
    retry_after = 60  # Default to 60 seconds
    if exc.detail:
        try:
            # exc.detail format is like "5 per 1 hour"
            retry_after = 3600  # Default to 1 hour for hourly limits
        except:
            pass

    return JSONResponse(
        status_code=429,
        content={
            "detail": "Rate limit exceeded. Please try again later.",
            "retry_after": retry_after
        },
        headers={
            "Retry-After": str(retry_after)
        }
    )


@app.get("/")
def root():
    """Root endpoint"""
    return {
        "message": f"Welcome to {settings.APP_NAME} API",
        "version": "0.1.0",
        "status": "running"
    }


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "environment": settings.APP_ENV
    }


# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(items.router, prefix="/api/items", tags=["Items"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
