# MindStash Architecture Overview

> "Never lose a thought again" - An AI-powered contextual memory system

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                    │
│                        (Next.js 16 + React 19)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   Landing   │  │    Auth     │  │  Dashboard  │  │   Modals    │    │
│  │    Page     │  │   Pages     │  │    Page     │  │  (Edit/View)│    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
│                              │                                           │
│                    ┌─────────┴─────────┐                                │
│                    │   React Query     │                                │
│                    │  (State Mgmt)     │                                │
│                    └─────────┬─────────┘                                │
│                              │                                           │
│                    ┌─────────┴─────────┐                                │
│                    │   Axios Client    │                                │
│                    │  (API Requests)   │                                │
│                    └─────────┬─────────┘                                │
└──────────────────────────────┼──────────────────────────────────────────┘
                               │ HTTPS
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              BACKEND                                     │
│                      (FastAPI + Python 3.12)                            │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                        API Layer                                  │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐                   │   │
│  │  │  Auth    │  │  Items   │  │ Notifications│                   │   │
│  │  │ Routes   │  │  Routes  │  │    Routes    │                   │   │
│  │  └──────────┘  └──────────┘  └──────────────┘                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                           │
│  ┌───────────────────────────┼───────────────────────────────────────┐ │
│  │                     Core Services                                  │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │ │
│  │  │   JWT    │  │  Rate    │  │ Password │  │    AI Service    │  │ │
│  │  │  Auth    │  │ Limiting │  │ Hashing  │  │ (Anthropic API)  │  │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘  │ │
│  └───────────────────────────┼───────────────────────────────────────┘ │
│                              │                                           │
│  ┌───────────────────────────┼───────────────────────────────────────┐ │
│  │                     Data Layer                                     │ │
│  │  ┌──────────────────┐  ┌──────────────────┐                       │ │
│  │  │   SQLAlchemy     │  │     Pydantic     │                       │ │
│  │  │     Models       │  │     Schemas      │                       │ │
│  │  └──────────────────┘  └──────────────────┘                       │ │
│  └───────────────────────────┼───────────────────────────────────────┘ │
└──────────────────────────────┼──────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           DATABASE                                       │
│                    (PostgreSQL via Supabase)                            │
│                                                                          │
│  ┌─────────────────────┐      ┌─────────────────────────────────────┐  │
│  │       users         │      │              items                   │  │
│  │  ─────────────────  │      │  ─────────────────────────────────  │  │
│  │  id (UUID PK)       │◄────┐│  id (UUID PK)                       │  │
│  │  email (unique)     │     ││  user_id (FK) ──────────────────────┘  │
│  │  hashed_password    │     ││  content (500 chars max)             │  │
│  │  created_at         │     ││  category (12 types)                 │  │
│  │  updated_at         │     ││  tags (JSONB)                        │  │
│  └─────────────────────┘     ││  AI fields (intent, urgency, etc.)  │  │
│                              ││  Notification fields                 │  │
│                              │└─────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.1.1 | React framework with App Router |
| React | 19.2.3 | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.x | Utility-first styling |
| Framer Motion | Latest | Animations |
| TanStack Query | 5.90.16 | Server state management |
| Axios | Latest | HTTP client |
| Lucide React | Latest | Icons |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.12 | Runtime |
| FastAPI | 0.109.0 | Web framework |
| SQLAlchemy | 2.0.25 | ORM |
| Alembic | 1.13.1 | Database migrations |
| Pydantic | 2.5.3 | Data validation |
| python-jose | 3.3.0 | JWT handling |
| passlib | 1.7.4 | Password hashing |
| slowapi | 0.1.9 | Rate limiting |
| Anthropic | 0.18.1 | Claude AI SDK |

### Infrastructure
| Service | Purpose |
|---------|---------|
| Vercel | Frontend hosting |
| Railway | Backend hosting |
| Supabase | PostgreSQL database |
| Redis (optional) | Rate limit storage |

## Data Flow

### 1. User Creates a Thought

```
User Input (500 chars max)
        │
        ▼
┌───────────────────┐
│  CaptureInput.tsx │  ← Frontend validates length, extracts URLs
└─────────┬─────────┘
          │ POST /api/items/
          ▼
┌───────────────────┐
│   items.py route  │  ← Rate limited (30/hour per user)
└─────────┬─────────┘
          │
          ├──────────────────────────┐
          ▼                          ▼
┌───────────────────┐    ┌───────────────────┐
│  Save to Database │    │  AI Categorizer   │
│  (initial record) │    │  (Claude Haiku)   │
└───────────────────┘    └─────────┬─────────┘
                                   │
                                   ▼
                         ┌───────────────────┐
                         │  Parse AI Response│
                         │  - category       │
                         │  - tags           │
                         │  - summary        │
                         │  - confidence     │
                         │  - intent         │
                         │  - urgency        │
                         │  - notifications  │
                         └─────────┬─────────┘
                                   │
                                   ▼
                         ┌───────────────────┐
                         │  Update Database  │
                         │  with AI fields   │
                         └─────────┬─────────┘
                                   │
                                   ▼
                         ┌───────────────────┐
                         │  Return to Client │
                         │  (optimistic UI)  │
                         └───────────────────┘
```

### 2. Authentication Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Register  │ ──► │ Hash Pass   │ ──► │ Store User  │
└─────────────┘     └─────────────┘     └─────────────┘

┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    Login    │ ──► │Verify Pass  │ ──► │ Issue JWT   │
└─────────────┘     └─────────────┘     │ Access(30m) │
                                        │ Refresh(7d) │
                                        └─────────────┘

┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ API Request │ ──► │ Validate    │ ──► │  Execute    │
│ + Bearer    │     │   JWT       │     │   Route     │
└─────────────┘     └─────────────┘     └─────────────┘
```

## 12 Category System

MindStash uses AI to categorize user input into one of 12 categories:

| Category | Icon | Use Case | Example |
|----------|------|----------|---------|
| `read` | BookOpen | Articles, blogs, docs | "Read this article about AI" |
| `watch` | Video | Videos, courses, talks | "Watch this YouTube tutorial" |
| `ideas` | Lightbulb | Business, product concepts | "App idea: AI meal planner" |
| `tasks` | CheckSquare | Todos, action items | "Call dentist tomorrow" |
| `people` | Users | Follow-ups, contacts | "Message John about project" |
| `notes` | FileText | Reference info, quotes | "Remember: API key is..." |
| `goals` | Target | Long-term objectives | "Learn Spanish by December" |
| `buy` | ShoppingCart | Shopping items | "Buy new headphones" |
| `places` | MapPin | Travel, locations | "Visit that new cafe" |
| `journal` | BookMarked | Personal thoughts | "Feeling grateful today" |
| `learn` | GraduationCap | Skills to acquire | "Learn React Native" |
| `save` | Bookmark | General bookmarks | "Interesting website" |

## AI Intelligence Signals

Beyond categorization, the AI extracts:

| Signal | Values | Purpose |
|--------|--------|---------|
| `intent` | learn, task, reminder, idea, reflection, reference | Why user saved this |
| `urgency` | low, medium, high | How urgent is action |
| `action_required` | true/false | Does it need action? |
| `time_context` | immediate, next_week, someday, conditional, date | When to resurface |
| `resurface_strategy` | time_based, contextual, weekly_review, manual | How to remind user |
| `suggested_bucket` | Today, Learn Later, Ideas, Reminders, Insights | UI grouping |

## Module System

Items are filtered into smart "modules" based on AI signals:

| Module | Filter Logic |
|--------|--------------|
| **All** | No filter (all items) |
| **Today** | urgency=high OR time_context=immediate OR smart resurfacing rules |
| **Tasks** | category=tasks OR (action_required=true AND intent=task) |
| **Read Later** | category IN [read, watch, learn] OR intent=learn |
| **Ideas** | category=ideas OR intent=idea |
| **Insights** | category IN [journal, notes] OR intent=reflection |

## Smart Resurfacing (Today Module)

The Today module uses intelligent logic to surface items:

1. **Always show**: High urgency items
2. **Always show**: Immediate time_context items
3. **Resurface**: next_week items created 7+ days ago
4. **Resurface**: Action items never surfaced before
5. **Resurface**: Action items not surfaced in 3 days
6. **Resurface**: Learning items not surfaced in 7 days

## Notification System

AI predicts when to notify users based on content:

```
Input: "Call John for football on Sunday"
        │
        ▼
AI Analysis:
  - should_notify: true
  - notification_date: "next_saturday_evening"
  - frequency: "once"
        │
        ▼
Parse relative date → Saturday 6 PM
        │
        ▼
Store: notification_date, next_notification_at
        │
        ▼
Background job checks & sends notifications
```

## Security Measures

1. **Password Hashing**: bcrypt with passlib
2. **JWT Tokens**: Short-lived access (30m), long-lived refresh (7d)
3. **Rate Limiting**: Per-IP for auth, per-user for API
4. **Input Validation**: Pydantic schemas with max lengths
5. **CORS**: Configured allowed origins
6. **SQL Injection**: Prevented by SQLAlchemy ORM
7. **Content Limit**: 500 chars to control AI costs

## Directory Structure

```
mindstash/
├── frontend/                 # Next.js application
│   ├── src/
│   │   ├── app/             # Pages (App Router)
│   │   ├── components/      # React components
│   │   └── lib/             # API client, hooks
│   ├── public/              # Static assets
│   └── package.json
│
├── backend/                  # FastAPI application
│   ├── app/
│   │   ├── api/routes/      # Route handlers
│   │   ├── core/            # Config, DB, security
│   │   ├── models/          # SQLAlchemy models
│   │   ├── schemas/         # Pydantic schemas
│   │   └── services/        # Business logic
│   ├── alembic/             # Database migrations
│   └── requirements.txt
│
├── dev/                      # Developer documentation
│   ├── ARCHITECTURE.md      # This file
│   ├── FRONTEND.md          # Frontend docs
│   ├── BACKEND.md           # Backend docs
│   ├── DATABASE.md          # Database docs
│   ├── AI_INTEGRATION.md    # AI docs
│   ├── AUTHENTICATION.md    # Auth docs
│   └── API_REFERENCE.md     # API docs
│
└── CLAUDE.md                 # AI assistant instructions
```

## Performance Optimizations

1. **Frontend**:
   - React Query caching
   - Debounced search (500ms)
   - Optimistic updates
   - Code splitting (Next.js)

2. **Backend**:
   - Database indexing on frequently queried columns
   - Rate limiting to prevent abuse
   - Connection pooling (SQLAlchemy)

3. **AI**:
   - 500-char limit (~125 tokens) reduces cost
   - Fallback response if AI fails
   - Single API call per item

## Cost Analysis

Per item creation:
- Input: ~125 tokens (500 chars)
- System prompt: ~300 tokens
- Output: ~200 tokens
- **Total**: ~625 tokens
- **Cost**: ~$0.0015 (Claude Haiku)

At 1000 items/day = $1.50/day = $45/month
