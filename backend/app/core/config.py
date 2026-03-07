"""
Application configuration and settings
"""
from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Application
    APP_NAME: str = "MindStash"
    APP_ENV: str = "development"
    DEBUG: bool = True
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Database
    DATABASE_URL: str
    
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # AI/LLM APIs (at least one is required based on environment)
    ANTHROPIC_API_KEY: str | None = None  # For production (Claude Sonnet 4.5)
    AIML_API_KEY: str | None = None  # For development (AI/ML API - OpenAI compatible)

    # Embeddings (optional — falls back to AIML_API_KEY if not set)
    EMBEDDING_API_KEY: str | None = None
    EMBEDDING_BASE_URL: str | None = None
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]
    
    # Rate Limiting (optional, uses in-memory if not set)
    REDIS_URL: str | None = None  # Example: redis://localhost:6379

    # Telegram Bot Integration
    TELEGRAM_BOT_TOKEN: str | None = None
    TELEGRAM_WEBHOOK_SECRET: str | None = None  # Auto-generated if not set

    # Email Configuration (Resend)
    RESEND_API_KEY: str | None = None
    FROM_EMAIL: str = "noreply@mindstash.heyjaydeep.website"
    APP_URL: str = "http://localhost:3000"

    # Optional
    SENTRY_DSN: str | None = None
    POSTHOG_API_KEY: str | None = None
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance.
    Using lru_cache ensures we only load settings once.
    """
    return Settings()


# Export settings instance
settings = get_settings()
