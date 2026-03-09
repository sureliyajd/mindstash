"""
Pydantic schemas for User
"""
from datetime import datetime
from uuid import UUID
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator


class UserBase(BaseModel):
    """Base user schema"""
    email: EmailStr


class UserCreate(UserBase):
    """Schema for user registration"""
    name: Optional[str] = Field(None, max_length=100)
    password: str = Field(
        ...,
        min_length=8,
        max_length=72,
        description="Password must be between 8 and 72 characters"
    )

    @field_validator('password')
    @classmethod
    def validate_password_bytes(cls, v: str) -> str:
        """Validate that password doesn't exceed 72 bytes (bcrypt limit)"""
        if len(v.encode('utf-8')) > 72:
            raise ValueError('Password cannot exceed 72 bytes when UTF-8 encoded')
        return v


class UserLogin(BaseModel):
    """Schema for user login"""
    email: EmailStr
    password: str


class EmailPreferences(BaseModel):
    """Schema for email notification preferences"""
    daily_briefing_enabled: bool
    weekly_digest_enabled: bool
    item_reminders_enabled: bool

    class Config:
        from_attributes = True


class EmailPreferencesUpdate(BaseModel):
    """Schema for updating email notification preferences"""
    daily_briefing_enabled: bool | None = None
    weekly_digest_enabled: bool | None = None
    item_reminders_enabled: bool | None = None


class UserResponse(UserBase):
    """Schema for user response (without password)"""
    id: UUID
    name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class UserProfileUpdate(BaseModel):
    """Schema for updating user profile"""
    name: Optional[str] = Field(None, max_length=100)


class PasswordChange(BaseModel):
    """Schema for changing user password"""
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=72)


class ForgotPasswordRequest(BaseModel):
    """Schema for requesting a password reset email"""
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """Schema for resetting password with a token"""
    token: str
    new_password: str = Field(..., min_length=8, max_length=72)

    @field_validator('new_password')
    @classmethod
    def validate_password_bytes(cls, v: str) -> str:
        if len(v.encode('utf-8')) > 72:
            raise ValueError('Password cannot exceed 72 bytes when UTF-8 encoded')
        return v


class TokenResponse(BaseModel):
    """Schema for authentication token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Schema for decoded token data"""
    email: str | None = None
