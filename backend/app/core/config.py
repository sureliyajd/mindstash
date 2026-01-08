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
    
    # AI/LLM APIs
    ANTHROPIC_API_KEY: str  # For production (Claude Sonnet 4.5)
    AIML_API_KEY: str  # TEMPORARY: Development only (AI/ML API - OpenAI compatible). Will switch to Anthropic in production.
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]
    
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
