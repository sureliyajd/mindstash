# MindStash Backend Documentation

> Python 3.12 + FastAPI 0.109.0 + SQLAlchemy 2.0

## Overview

The backend is a modern Python API built with FastAPI, featuring JWT authentication, rate limiting, AI integration, and a PostgreSQL database.

## Tech Stack

| Package | Version | Purpose |
|---------|---------|---------|
| python | 3.12 | Runtime |
| fastapi | 0.109.0 | Web framework |
| uvicorn | 0.27.0 | ASGI server |
| sqlalchemy | 2.0.25 | ORM |
| alembic | 1.13.1 | Migrations |
| pydantic | 2.5.3 | Validation |
| pydantic-settings | 2.1.0 | Config management |
| python-jose | 3.3.0 | JWT tokens |
| passlib | 1.7.4 | Password hashing |
| bcrypt | 3.2.2 | Hashing algorithm |
| slowapi | 0.1.9 | Rate limiting |
| anthropic | 0.18.1 | Claude AI SDK |
| psycopg2-binary | 2.9.9 | PostgreSQL driver |

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app entry point
│   │
│   ├── core/                   # Core utilities
│   │   ├── __init__.py
│   │   ├── config.py           # Settings from environment
│   │   ├── database.py         # SQLAlchemy setup
│   │   ├── security.py         # JWT & password utilities
│   │   └── rate_limit.py       # slowapi rate limiting
│   │
│   ├── models/                 # SQLAlchemy ORM models
│   │   ├── __init__.py
│   │   ├── user.py             # User model
│   │   └── item.py             # Item model (12-category)
│   │
│   ├── schemas/                # Pydantic validation schemas
│   │   ├── __init__.py
│   │   ├── user.py             # User schemas
│   │   └── item.py             # Item schemas
│   │
│   ├── api/                    # API layer
│   │   ├── __init__.py
│   │   ├── dependencies.py     # Shared dependencies
│   │   └── routes/
│   │       ├── __init__.py
│   │       ├── auth.py         # Auth endpoints
│   │       ├── items.py        # Items CRUD
│   │       └── notifications.py # Notification endpoints
│   │
│   └── services/               # Business logic
│       ├── __init__.py
│       ├── ai/
│       │   ├── __init__.py
│       │   └── categorizer.py  # Claude AI integration
│       ├── notifications/
│       │   ├── __init__.py
│       │   ├── digest.py       # Weekly digest logic
│       │   └── sender.py       # Email sending
│       └── scheduler.py        # Background tasks
│
├── alembic/                    # Database migrations
│   ├── env.py
│   ├── script.py.mako
│   └── versions/               # Migration files
│
├── tests/                      # Test files
├── .env                        # Environment variables
├── .env.example                # Example env file
├── alembic.ini                 # Alembic config
└── requirements.txt            # Python dependencies
```

## Entry Point (`app/main.py`)

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title=settings.APP_NAME,
    description="AI-powered contextual memory system",
    version="0.1.0",
    debug=settings.DEBUG,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiter
app.state.limiter = limiter

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(items.router, prefix="/api/items", tags=["Items"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])
```

## Core Modules

### Configuration (`app/core/config.py`)

Uses Pydantic Settings for type-safe environment variable management:

```python
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # Application
    APP_NAME: str = "MindStash"
    APP_ENV: str = "development"
    DEBUG: bool = True

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Database
    DATABASE_URL: str  # Required

    # Security
    SECRET_KEY: str  # Required
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # AI APIs
    ANTHROPIC_API_KEY: str | None = None  # Production
    AIML_API_KEY: str | None = None       # Development

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]

    # Rate Limiting (optional)
    REDIS_URL: str | None = None

    class Config:
        env_file = ".env"
        case_sensitive = True

@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
```

### Database (`app/core/database.py`)

SQLAlchemy 2.0 setup with PostgreSQL:

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,  # Verify connections
    echo=settings.DEBUG, # Log SQL in debug mode
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """FastAPI dependency for database sessions"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### Security (`app/core/security.py`)

JWT and password utilities:

```python
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    """Create JWT access token (30 min expiry)"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def create_refresh_token(data: dict) -> str:
    """Create JWT refresh token (7 day expiry)"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def decode_token(token: str) -> dict | None:
    """Decode and validate a JWT token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None
```

### Rate Limiting (`app/core/rate_limit.py`)

Using slowapi for request rate limiting:

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

# Storage: Redis if available, otherwise in-memory
storage_uri = settings.REDIS_URL if settings.REDIS_URL else "memory://"

# IP-based limiter (for auth endpoints)
limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=storage_uri,
    default_limits=["100/hour"]
)

# User-based limiter (for authenticated routes)
def get_user_identifier(request: Request) -> str:
    """Get user ID if authenticated, else IP"""
    if hasattr(request.state, "user") and request.state.user:
        return f"user:{request.state.user.id}"
    return get_remote_address(request)

user_limiter = Limiter(
    key_func=get_user_identifier,
    storage_uri=storage_uri
)
```

## Models

### User Model (`app/models/user.py`)

```python
from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    items = relationship("Item", back_populates="user", cascade="all, delete-orphan")
```

### Item Model (`app/models/item.py`)

```python
class Item(Base):
    __tablename__ = "items"

    # Primary fields
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), index=True, nullable=False)
    content = Column(Text, nullable=False)  # Max 500 chars (validated in schema)
    url = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # AI Categorization (12 categories)
    category = Column(String, index=True)  # read, watch, ideas, tasks, etc.
    tags = Column(JSONB, default=list)     # ["tag1", "tag2"]
    summary = Column(Text)                  # AI-generated summary
    confidence = Column(Float)              # 0.0 - 1.0
    priority = Column(String)               # low, medium, high
    time_sensitivity = Column(String)       # immediate, this_week, etc.
    ai_metadata = Column(JSONB)             # Full AI response

    # AI Intelligence Signals
    intent = Column(String)                 # learn, task, reminder, idea, reflection, reference
    action_required = Column(Boolean, default=False)
    urgency = Column(String)                # low, medium, high
    time_context = Column(String)           # immediate, next_week, someday, conditional, date
    resurface_strategy = Column(String)     # time_based, contextual, weekly_review, manual
    suggested_bucket = Column(String)       # Today, Learn Later, Ideas, Reminders, Insights

    # Smart Resurfacing
    last_surfaced_at = Column(DateTime, index=True)

    # Notification System
    notification_date = Column(DateTime, index=True)
    notification_frequency = Column(String, default="never")  # once, daily, weekly, monthly, never
    next_notification_at = Column(DateTime, index=True)
    last_notified_at = Column(DateTime)
    notification_enabled = Column(Boolean, default=True)

    # Completion Tracking
    is_completed = Column(Boolean, default=False, index=True)
    completed_at = Column(DateTime)

    # Relationship
    user = relationship("User", back_populates="items")
```

## Schemas (Pydantic)

### User Schemas (`app/schemas/user.py`)

```python
from pydantic import BaseModel, EmailStr, Field
from uuid import UUID
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=72)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: UUID
    email: str
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
```

### Item Schemas (`app/schemas/item.py`)

```python
class ItemCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=500)
    url: str | None = None

class ItemUpdate(BaseModel):
    content: str | None = Field(None, min_length=1, max_length=500)
    url: str | None = None
    category: Category | None = None
    tags: list[str] | None = None
    priority: Priority | None = None
    urgency: Urgency | None = None
    intent: Intent | None = None
    time_context: TimeContext | None = None
    resurface_strategy: ResurfaceStrategy | None = None
    action_required: bool | None = None

    @validator('tags', pre=True)
    def lowercase_tags(cls, v):
        if v:
            return [tag.lower().strip() for tag in v]
        return v

class ItemResponse(BaseModel):
    id: UUID
    user_id: UUID
    content: str
    url: str | None
    category: Category | None
    tags: list[str]
    summary: str | None
    confidence: float | None
    # ... all other fields
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ItemListResponse(BaseModel):
    items: list[ItemResponse]
    total: int
    page: int
    page_size: int
```

## API Routes

### Dependencies (`app/api/dependencies.py`)

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Extract and validate JWT from Authorization header"""
    token = credentials.credentials
    payload = decode_token(token)

    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

    email = payload.get("sub")
    user = db.query(User).filter(User.email == email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    return user
```

### Auth Routes (`app/api/routes/auth.py`)

```python
router = APIRouter(tags=["Authentication"])

@router.post("/register", response_model=TokenResponse)
@limiter.limit("20/hour")  # Prevent spam registrations
def register(request: Request, user_data: UserCreate, db: Session = Depends(get_db)):
    # Check if email exists
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create user
    hashed = get_password_hash(user_data.password)
    user = User(email=user_data.email, hashed_password=hashed)
    db.add(user)
    db.commit()
    db.refresh(user)

    # Generate tokens
    access_token = create_access_token({"sub": user.email})
    refresh_token = create_refresh_token({"sub": user.email})

    return TokenResponse(access_token=access_token, refresh_token=refresh_token)

@router.post("/login", response_model=TokenResponse)
@limiter.limit("60/hour")  # Prevent brute force
def login(request: Request, user_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_data.email).first()

    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token({"sub": user.email})
    refresh_token = create_refresh_token({"sub": user.email})

    return TokenResponse(access_token=access_token, refresh_token=refresh_token)

@router.get("/me", response_model=UserResponse)
@user_limiter.limit("500/hour")
def get_me(
    request: Request,
    current_user: User = Depends(get_current_user)
):
    request.state.user = current_user
    return current_user
```

### Items Routes (`app/api/routes/items.py`)

```python
router = APIRouter(tags=["Items"])

@router.post("/", response_model=ItemResponse, status_code=201)
@user_limiter.limit("30/hour")  # AI cost protection
def create_item(
    request: Request,
    item_data: ItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    request.state.user = current_user

    # Create initial item
    new_item = Item(
        user_id=current_user.id,
        content=item_data.content,
        url=item_data.url
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    # AI categorization
    try:
        ai_result = categorize_item(item_data.content, item_data.url)

        # Update with AI results
        new_item.category = ai_result.get("category", "save")
        new_item.tags = ai_result.get("tags", [])
        new_item.summary = ai_result.get("summary")
        new_item.confidence = ai_result.get("confidence", 0.5)
        new_item.priority = ai_result.get("priority", "medium")
        new_item.intent = ai_result.get("intent", "reference")
        new_item.urgency = ai_result.get("urgency", "low")
        new_item.action_required = ai_result.get("action_required", False)
        # ... more fields

        # Sanitize ai_metadata (convert datetime to ISO strings)
        ai_metadata_sanitized = {}
        for key, value in ai_result.items():
            if isinstance(value, datetime):
                ai_metadata_sanitized[key] = value.isoformat()
            else:
                ai_metadata_sanitized[key] = value
        new_item.ai_metadata = ai_metadata_sanitized

        db.commit()
        db.refresh(new_item)
    except Exception as e:
        print(f"AI categorization failed: {e}")
        # Item exists with basic data

    return new_item

@router.get("/", response_model=ItemListResponse)
@user_limiter.limit("200/hour")
def list_items(
    request: Request,
    module: str | None = None,
    category: str | None = None,
    search: str | None = None,
    urgency_filter: str | None = None,
    tag: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    request.state.user = current_user
    query = db.query(Item).filter(Item.user_id == current_user.id)

    # Apply module filter
    if module == "today":
        query = query.filter(build_today_smart_filter())
    elif module == "tasks":
        query = query.filter(or_(
            Item.category == "tasks",
            (Item.action_required == True) & (Item.intent == "task")
        ))
    # ... more modules

    # Apply other filters
    if category and category != "all":
        query = query.filter(Item.category == category)

    if search:
        search_term = f"%{search.lower()}%"
        query = query.filter(or_(
            func.lower(Item.content).like(search_term),
            func.lower(Item.summary).like(search_term)
        ))

    if urgency_filter:
        query = query.filter(Item.urgency == urgency_filter)

    if tag:
        query = query.filter(Item.tags.contains([tag]))

    # Pagination
    total = query.count()
    items = query.order_by(Item.created_at.desc()).offset((page-1)*page_size).limit(page_size).all()

    return ItemListResponse(items=items, total=total, page=page, page_size=page_size)
```

### Smart Resurfacing Logic

```python
def build_today_smart_filter():
    """Build filter for intelligent daily digest"""
    now = datetime.utcnow()
    three_days_ago = now - timedelta(days=3)
    seven_days_ago = now - timedelta(days=7)

    return or_(
        # Always show high urgency
        Item.urgency == "high",

        # Always show immediate items
        Item.time_context == "immediate",

        # Resurface next_week items after 7 days
        and_(
            Item.time_context == "next_week",
            Item.created_at <= seven_days_ago
        ),

        # Action items never surfaced
        and_(
            Item.action_required == True,
            Item.last_surfaced_at.is_(None)
        ),

        # Action items not surfaced in 3 days
        and_(
            Item.action_required == True,
            Item.last_surfaced_at < three_days_ago
        ),

        # Learning items not surfaced in 7 days
        and_(
            Item.intent == "learn",
            or_(
                Item.last_surfaced_at.is_(None),
                Item.last_surfaced_at < seven_days_ago
            )
        )
    )
```

## Error Handling

### Rate Limit Handler

```python
@app.exception_handler(RateLimitExceeded)
async def custom_rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={
            "detail": "Rate limit exceeded. Please try again later.",
            "retry_after": 60
        },
        headers={"Retry-After": "60"}
    )
```

### HTTP Exceptions

```python
# 400 Bad Request
raise HTTPException(status_code=400, detail="Invalid input")

# 401 Unauthorized
raise HTTPException(status_code=401, detail="Invalid credentials")

# 404 Not Found
raise HTTPException(status_code=404, detail="Item not found")

# 429 Too Many Requests (automatic from rate limiter)
```

## Environment Variables

```bash
# .env
APP_NAME=MindStash
APP_ENV=development
DEBUG=True

HOST=0.0.0.0
PORT=8000

DATABASE_URL=postgresql://user:pass@localhost:5432/mindstash_db

SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

ANTHROPIC_API_KEY=sk-ant-...

CORS_ORIGINS=["http://localhost:3000"]

# Optional
REDIS_URL=redis://localhost:6379
```

## Development Commands

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn app.main:app --reload --port 8000

# Run with custom host
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Database migrations
alembic revision --autogenerate -m "description"
alembic upgrade head
alembic downgrade -1

# Run tests
pytest
pytest -v tests/test_auth.py
pytest --cov=app tests/

# Code quality
black app/
flake8 app/
mypy app/
```

## Key Design Decisions

1. **FastAPI over Flask/Django**: Async support, automatic OpenAPI docs, Pydantic integration
2. **SQLAlchemy 2.0**: Modern async-compatible ORM
3. **Pydantic v2**: Faster validation, better typing
4. **JWT over Sessions**: Stateless authentication for scalability
5. **slowapi**: Simple rate limiting with Redis support
6. **Dependency Injection**: FastAPI's `Depends()` for clean code
7. **500-char limit**: Controls AI token costs
