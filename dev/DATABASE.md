# MindStash Database Documentation

> PostgreSQL + SQLAlchemy 2.0 + Alembic Migrations

## Overview

MindStash uses PostgreSQL as its primary database, managed through SQLAlchemy ORM with Alembic for schema migrations. The database is hosted on Supabase for production.

## Database Configuration

### Connection String

```bash
# Development (local)
DATABASE_URL=postgresql://mindstash:password@localhost:5432/mindstash_db

# Production (Supabase)
DATABASE_URL=postgresql://postgres.[project]:password@aws-0-[region].pooler.supabase.com:6543/postgres
```

### SQLAlchemy Setup (`app/core/database.py`)

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,    # Verify connection before use
    pool_size=5,           # Connection pool size
    max_overflow=10,       # Extra connections when pool exhausted
    echo=settings.DEBUG,   # Log SQL queries in debug mode
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()

def get_db():
    """Dependency injection for database sessions"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

## Schema Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              users                                       │
├─────────────────────────────────────────────────────────────────────────┤
│ id              │ UUID        │ PK, DEFAULT uuid_generate_v4()          │
│ email           │ VARCHAR     │ UNIQUE, NOT NULL, INDEXED               │
│ hashed_password │ VARCHAR     │ NOT NULL                                │
│ created_at      │ TIMESTAMP   │ DEFAULT now()                           │
│ updated_at      │ TIMESTAMP   │ DEFAULT now(), ON UPDATE now()          │
└────────┬────────────────────────────────────────────────────────────────┘
         │
         │ 1:N (cascade delete)
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              items                                       │
├─────────────────────────────────────────────────────────────────────────┤
│ id                    │ UUID      │ PK, DEFAULT uuid_generate_v4()      │
│ user_id               │ UUID      │ FK → users.id, INDEXED              │
│ content               │ TEXT      │ NOT NULL (max 500 chars)            │
│ url                   │ TEXT      │ NULLABLE                            │
│ created_at            │ TIMESTAMP │ DEFAULT now(), INDEXED              │
│ updated_at            │ TIMESTAMP │ DEFAULT now(), ON UPDATE now()      │
├─────────────────────────────────────────────────────────────────────────┤
│ CATEGORY FIELDS                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│ category              │ VARCHAR   │ INDEXED (read,watch,ideas,etc.)     │
│ tags                  │ JSONB     │ DEFAULT '[]'                        │
│ summary               │ TEXT      │ AI-generated description            │
│ confidence            │ FLOAT     │ 0.0 - 1.0                           │
│ priority              │ VARCHAR   │ low, medium, high                   │
│ time_sensitivity      │ VARCHAR   │ immediate, this_week, etc.          │
│ ai_metadata           │ JSONB     │ Full AI response                    │
├─────────────────────────────────────────────────────────────────────────┤
│ AI INTELLIGENCE SIGNALS                                                  │
├─────────────────────────────────────────────────────────────────────────┤
│ intent                │ VARCHAR   │ learn,task,reminder,idea,etc.       │
│ action_required       │ BOOLEAN   │ DEFAULT false                       │
│ urgency               │ VARCHAR   │ low, medium, high                   │
│ time_context          │ VARCHAR   │ immediate,next_week,someday,etc.    │
│ resurface_strategy    │ VARCHAR   │ time_based,contextual,etc.          │
│ suggested_bucket      │ VARCHAR   │ Today,Learn Later,Ideas,etc.        │
│ last_surfaced_at      │ TIMESTAMP │ INDEXED                             │
├─────────────────────────────────────────────────────────────────────────┤
│ NOTIFICATION FIELDS                                                      │
├─────────────────────────────────────────────────────────────────────────┤
│ notification_date     │ TIMESTAMP │ INDEXED                             │
│ notification_frequency│ VARCHAR   │ DEFAULT 'never'                     │
│ next_notification_at  │ TIMESTAMP │ INDEXED                             │
│ last_notified_at      │ TIMESTAMP │ NULLABLE                            │
│ notification_enabled  │ BOOLEAN   │ DEFAULT true                        │
├─────────────────────────────────────────────────────────────────────────┤
│ COMPLETION TRACKING                                                      │
├─────────────────────────────────────────────────────────────────────────┤
│ is_completed          │ BOOLEAN   │ DEFAULT false, INDEXED              │
│ completed_at          │ TIMESTAMP │ NULLABLE                            │
└─────────────────────────────────────────────────────────────────────────┘
```

## SQLAlchemy Models

### User Model (`app/models/user.py`)

```python
from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    email = Column(
        String,
        unique=True,
        index=True,
        nullable=False
    )
    hashed_password = Column(
        String,
        nullable=False
    )
    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    # Relationship: One user has many items
    items = relationship(
        "Item",
        back_populates="user",
        cascade="all, delete-orphan"  # Delete items when user deleted
    )
```

### Item Model (`app/models/item.py`)

```python
from sqlalchemy import Column, String, Text, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.core.database import Base

class Item(Base):
    __tablename__ = "items"

    # =========================================================================
    # PRIMARY FIELDS
    # =========================================================================
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        index=True,
        nullable=False
    )
    content = Column(Text, nullable=False)  # Max 500 chars (enforced in schema)
    url = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # =========================================================================
    # AI CATEGORIZATION FIELDS (12-Category System)
    # =========================================================================
    category = Column(String, index=True)  # read, watch, ideas, tasks, etc.
    tags = Column(JSONB, default=list)     # ["productivity", "tech"]
    summary = Column(Text)                  # AI-generated 1-sentence summary
    confidence = Column(Float)              # 0.0 - 1.0 confidence score
    priority = Column(String)               # low, medium, high
    time_sensitivity = Column(String)       # immediate, this_week, etc.
    ai_metadata = Column(JSONB)             # Full AI response for debugging

    # =========================================================================
    # AI INTELLIGENCE SIGNALS
    # =========================================================================
    intent = Column(String)                 # learn, task, reminder, idea, reflection, reference
    action_required = Column(Boolean, default=False)
    urgency = Column(String)                # low, medium, high
    time_context = Column(String)           # immediate, next_week, someday, conditional, date
    resurface_strategy = Column(String)     # time_based, contextual, weekly_review, manual
    suggested_bucket = Column(String)       # Today, Learn Later, Ideas, Reminders, Insights

    # =========================================================================
    # SMART RESURFACING
    # =========================================================================
    last_surfaced_at = Column(DateTime, index=True)

    # =========================================================================
    # NOTIFICATION SYSTEM
    # =========================================================================
    notification_date = Column(DateTime, index=True)
    notification_frequency = Column(String, default="never")  # once, daily, weekly, monthly, never
    next_notification_at = Column(DateTime, index=True)
    last_notified_at = Column(DateTime)
    notification_enabled = Column(Boolean, default=True)

    # =========================================================================
    # COMPLETION TRACKING
    # =========================================================================
    is_completed = Column(Boolean, default=False, index=True)
    completed_at = Column(DateTime)

    # =========================================================================
    # RELATIONSHIP
    # =========================================================================
    user = relationship("User", back_populates="items")
```

## Indexes

The following columns are indexed for query performance:

| Table | Column | Reason |
|-------|--------|--------|
| users | email | Unique lookups for login |
| items | user_id | Filter items by user |
| items | created_at | Sort by newest |
| items | category | Filter by category |
| items | last_surfaced_at | Smart resurfacing queries |
| items | notification_date | Notification scheduling |
| items | next_notification_at | Find upcoming notifications |
| items | is_completed | Filter completed/incomplete |

## JSONB Columns

### `tags` Column

Stores an array of strings:
```json
["productivity", "tech", "ai"]
```

Query examples:
```python
# Filter items containing a specific tag
query.filter(Item.tags.contains(["productivity"]))

# Full-text search in tags
query.filter(func.lower(cast(Item.tags, String)).like("%tech%"))
```

### `ai_metadata` Column

Stores the full AI response:
```json
{
  "category": "tasks",
  "tags": ["job-search", "career"],
  "summary": "Action items for side hustle development",
  "confidence": 0.92,
  "priority": "high",
  "time_sensitivity": "this_week",
  "reasoning": "Multiple actionable tasks detected",
  "intent": "task",
  "action_required": true,
  "urgency": "medium",
  "time_context": "next_week",
  "resurface_strategy": "time_based",
  "suggested_bucket": "Today",
  "notification_prediction": {
    "should_notify": true,
    "notification_date": "next_monday_morning",
    "frequency": "weekly"
  }
}
```

**Note**: DateTime values are stored as ISO strings to avoid JSON serialization issues.

## Alembic Migrations

### Setup

Alembic configuration in `alembic.ini`:
```ini
[alembic]
script_location = alembic
sqlalchemy.url = driver://user:pass@localhost/dbname

[logging]
# ...
```

Environment setup in `alembic/env.py`:
```python
from app.core.config import settings
from app.core.database import Base
from app.models.user import User
from app.models.item import Item

config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)
target_metadata = Base.metadata
```

### Migration Commands

```bash
# Create new migration (auto-detect changes)
alembic revision --autogenerate -m "description of changes"

# Apply all pending migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# Rollback to specific revision
alembic downgrade <revision_id>

# Show current revision
alembic current

# Show migration history
alembic history
```

### Migration History

1. **5767e0525f9a** - Initial tables
   - Create `users` table
   - Create `items` table (basic fields)

2. **efe934788a50** - 12-category system
   - Add `category`, `tags`, `summary`
   - Add `confidence`, `priority`, `time_sensitivity`
   - Add `ai_metadata` JSONB

3. **c9d8f48eedbc** - AI intelligence signals
   - Add `intent`, `action_required`, `urgency`
   - Add `time_context`, `resurface_strategy`
   - Add `suggested_bucket`

4. **a3f2d9e81c45** - Smart resurfacing
   - Add `last_surfaced_at` with index

5. **6de7fae67bb3** - Notifications and completion
   - Add `notification_date`, `notification_frequency`
   - Add `next_notification_at`, `last_notified_at`
   - Add `notification_enabled`
   - Add `is_completed`, `completed_at`

### Example Migration File

```python
"""Add notification and completion tracking

Revision ID: 6de7fae67bb3
Revises: a3f2d9e81c45
Create Date: 2024-01-15 10:30:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = '6de7fae67bb3'
down_revision = 'a3f2d9e81c45'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Notification fields
    op.add_column('items', sa.Column('notification_date', sa.DateTime(), nullable=True))
    op.add_column('items', sa.Column('notification_frequency', sa.String(), nullable=True, server_default='never'))
    op.add_column('items', sa.Column('next_notification_at', sa.DateTime(), nullable=True))
    op.add_column('items', sa.Column('last_notified_at', sa.DateTime(), nullable=True))
    op.add_column('items', sa.Column('notification_enabled', sa.Boolean(), nullable=True, server_default='true'))

    # Completion fields
    op.add_column('items', sa.Column('is_completed', sa.Boolean(), nullable=True, server_default='false'))
    op.add_column('items', sa.Column('completed_at', sa.DateTime(), nullable=True))

    # Indexes
    op.create_index('ix_items_notification_date', 'items', ['notification_date'])
    op.create_index('ix_items_next_notification_at', 'items', ['next_notification_at'])
    op.create_index('ix_items_is_completed', 'items', ['is_completed'])

def downgrade() -> None:
    op.drop_index('ix_items_is_completed')
    op.drop_index('ix_items_next_notification_at')
    op.drop_index('ix_items_notification_date')

    op.drop_column('items', 'completed_at')
    op.drop_column('items', 'is_completed')
    op.drop_column('items', 'notification_enabled')
    op.drop_column('items', 'last_notified_at')
    op.drop_column('items', 'next_notification_at')
    op.drop_column('items', 'notification_frequency')
    op.drop_column('items', 'notification_date')
```

## Common Queries

### Get User's Items (Paginated)

```python
items = db.query(Item)\
    .filter(Item.user_id == user_id)\
    .order_by(Item.created_at.desc())\
    .offset((page - 1) * page_size)\
    .limit(page_size)\
    .all()
```

### Filter by Category

```python
items = db.query(Item)\
    .filter(Item.user_id == user_id)\
    .filter(Item.category == "tasks")\
    .all()
```

### Search Content

```python
search_term = f"%{query.lower()}%"
items = db.query(Item)\
    .filter(Item.user_id == user_id)\
    .filter(or_(
        func.lower(Item.content).like(search_term),
        func.lower(Item.summary).like(search_term)
    ))\
    .all()
```

### Smart Resurfacing (Today Module)

```python
now = datetime.utcnow()
three_days_ago = now - timedelta(days=3)
seven_days_ago = now - timedelta(days=7)

today_items = db.query(Item)\
    .filter(Item.user_id == user_id)\
    .filter(or_(
        Item.urgency == "high",
        Item.time_context == "immediate",
        and_(Item.time_context == "next_week", Item.created_at <= seven_days_ago),
        and_(Item.action_required == True, Item.last_surfaced_at.is_(None)),
        and_(Item.action_required == True, Item.last_surfaced_at < three_days_ago),
        and_(Item.intent == "learn", Item.last_surfaced_at < seven_days_ago)
    ))\
    .all()
```

### Get Upcoming Notifications

```python
now = datetime.utcnow()
week_from_now = now + timedelta(days=7)

notifications = db.query(Item)\
    .filter(Item.user_id == user_id)\
    .filter(Item.notification_enabled == True)\
    .filter(Item.is_completed == False)\
    .filter(Item.next_notification_at.between(now, week_from_now))\
    .order_by(Item.next_notification_at)\
    .all()
```

### Count by Module

```python
counts = {
    "all": db.query(Item).filter(Item.user_id == user_id).count(),
    "tasks": db.query(Item).filter(
        Item.user_id == user_id,
        or_(Item.category == "tasks", Item.action_required == True)
    ).count(),
    # ... more modules
}
```

## Database Backup

### Supabase

Supabase provides automatic daily backups. For manual backups:

1. Go to Supabase Dashboard → Settings → Database
2. Click "Download backup"

### Local PostgreSQL

```bash
# Backup
pg_dump -h localhost -U mindstash -d mindstash_db > backup.sql

# Restore
psql -h localhost -U mindstash -d mindstash_db < backup.sql
```

## Performance Tips

1. **Use indexes** for frequently queried columns
2. **Limit page size** (max 100 items per request)
3. **Use `select_related`** for joins when needed
4. **Cache counts** if needed (Redis)
5. **Archive old items** if database grows large
6. **Monitor slow queries** in production

## Troubleshooting

### Connection Issues

```python
# Test connection
from app.core.database import engine
with engine.connect() as conn:
    result = conn.execute("SELECT 1")
    print(result.fetchone())
```

### Migration Conflicts

```bash
# If migrations are out of sync
alembic stamp head  # Mark current state as up to date
alembic revision --autogenerate -m "sync"
alembic upgrade head
```

### JSONB Queries Not Working

```python
# Use proper casting
from sqlalchemy import cast, String
query.filter(func.lower(cast(Item.tags, String)).like("%search%"))
```
