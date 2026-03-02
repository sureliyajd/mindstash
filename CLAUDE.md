# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MindStash** - "Never lose a thought again"

An AI-powered personal knowledge management app. Users capture thoughts (max 500 chars), AI categorizes them into 12 categories with metadata, and an AI chat agent helps search, manage, and surface saved content.

**Tech Stack:**
- Backend: Python 3.12, FastAPI, SQLAlchemy 2.0, PostgreSQL, Alembic
- Frontend: Next.js (App Router), React 19, TypeScript, Tailwind CSS 4, Framer Motion, Lucide React
- AI: Anthropic Claude (`claude-haiku-4-5-20251001` for agent, AI/ML API for categorization in dev)
- State: TanStack React Query + custom hooks
- DevOps: Vercel (frontend), Railway (backend), Supabase (PostgreSQL)

## Development Commands

### Backend

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000

# Migrations
alembic revision --autogenerate -m "description"
alembic upgrade head
alembic downgrade -1

# Tests
pytest
pytest tests/test_auth.py -v
pytest --cov=app tests/

# Linting
black app/ && flake8 app/ && mypy app/
```

### Frontend

```bash
cd frontend
npm run dev          # Development server (port 3000)
npm run build        # Production build
npm run lint         # ESLint
```

### Environment

Backend `backend/.env`:
- `DATABASE_URL` - PostgreSQL connection string
- `SECRET_KEY` - JWT secret (`openssl rand -hex 32`)
- `ANTHROPIC_API_KEY` - For the AI chat agent (Claude)
- `AIML_API_KEY` - For AI categorization in dev (OpenAI-compatible)
- `CORS_ORIGINS` - JSON array, e.g. `["http://localhost:3000"]`
- `REDIS_URL` - Optional; falls back to in-memory rate limiting

Frontend `frontend/.env.local`:
- `NEXT_PUBLIC_API_URL` - Backend URL (default: `http://localhost:8000`)

## Architecture

### Backend (`backend/app/`)

```
main.py                   # App init, CORS, rate limit handler, router registration
core/
  config.py               # Pydantic settings (lru_cache singleton)
  database.py             # SQLAlchemy engine + get_db dependency
  security.py             # JWT creation/verification, bcrypt hashing
  rate_limit.py           # slowapi limiter; user_limiter for authenticated routes
api/
  dependencies.py         # get_current_user (JWT → User)
  routes/
    auth.py               # POST /api/auth/register|login|refresh, GET /api/auth/me
    items.py              # CRUD /api/items/ + /counts/ + /mark-surfaced/ + /{id}/complete
    chat.py               # POST /api/chat/ (SSE), GET /api/chat/sessions[/{id}/messages]
    notifications.py      # GET /api/notifications/upcoming|digest-preview
models/
  user.py                 # User (UUID PK, email, hashed_password)
  item.py                 # Item (12-category + AI intelligence signals + notification fields)
  chat.py                 # ChatSession, ChatMessage, UserMemory
schemas/                  # Pydantic request/response models mirroring models
services/
  ai/
    categorizer.py        # AI/ML API (OpenAI-compat) → 12-category JSON response
    agent.py              # Core agent loop: SSE generator, tool calling, history management
    tool_registry.py      # ToolRegistry singleton; register/get_schemas/execute
    agent_tools.py        # Tool implementations registered into registry
  notifications/
    digest.py             # Digest data assembly
    sender.py             # Email sending
  scheduler.py            # Background scheduled tasks
```

### AI Agent System

The agent (`services/ai/agent.py`) runs a synchronous tool-calling loop and yields SSE events:

1. `session_id` → chat session ID
2. `text_delta` → streamed assistant text
3. `tool_start` → tool execution began (with user-friendly message)
4. `tool_result` → tool success/failure + `mutated` flag for cache invalidation
5. `error` / `done` → terminal events

Tools are registered in `tool_registry.py` via `registry.register(name, schema, handler, agent_types)`. Tool handlers live in `agent_tools.py` and receive `(db, user_id, tool_input)`. Currently registered tools: `search_items`, `create_item`, `update_item`, `delete_item`, `mark_complete`, `get_counts`, `get_upcoming_notifications`, `get_digest_preview`, `generate_daily_briefing`.

The special `[BRIEFING]` message triggers a daily briefing flow via the system prompt.

### Item Model — Key Fields

Beyond basic content/url/category, items carry:
- **AI categorization**: `category`, `tags`, `summary`, `confidence`, `priority`, `time_sensitivity`, `ai_metadata`
- **AI intelligence signals**: `intent`, `action_required`, `urgency`, `time_context`, `resurface_strategy`, `suggested_bucket`
- **Notifications**: `notification_date`, `notification_frequency`, `next_notification_at`, `last_notified_at`, `notification_enabled`
- **Completion**: `is_completed`, `completed_at`
- **Surfacing**: `last_surfaced_at`

### Frontend (`frontend/src/`)

```
app/
  page.tsx              # Landing page
  login/ register/      # Auth pages
  dashboard/page.tsx    # Main dashboard
  test/page.tsx         # Dev test page
components/
  CaptureInput.tsx      # 500-char textarea with counter
  ItemCard.tsx          # Framer Motion card with category icon + confidence badge
  FilterPanel.tsx       # Category + module filter chips
  ModuleSelector.tsx    # Module tabs (Today, Tasks, Read Later, etc.)
  ChatPanel.tsx         # SSE-streaming chat UI
  ItemDetailModal.tsx   # Full item view
  ItemEditModal.tsx     # Edit category, tags, etc.
  DeleteConfirmModal.tsx
  SearchBar.tsx
  AIProcessing.tsx      # AI loading state animation
  AnimatedBackground.tsx
  EmptyState.tsx / Skeletons.tsx / Toast.tsx
  ProtectedRoute.tsx    # Redirects to /login if no token
  Providers.tsx         # React Query provider
lib/
  api.ts                # Axios client + all API methods (auth, items, notifications, chat)
  hooks/useAuth.ts      # Auth state via React Query
  hooks/useItems.ts     # Items CRUD mutations + queries
  hooks/useChat.ts      # SSE chat hook (parses event stream)
  types/chat.ts         # Chat type definitions
  aiTranslations.ts     # Human-readable labels for AI field values
```

The chat API uses native `fetch` (not axios) for SSE streaming. The `useChat` hook parses the event stream and emits `mutated: true` events to trigger React Query cache invalidation for items.

### Database Migrations (Alembic)

Run from `backend/`. Migration chain:
1. `5767e0525f9a` - initial tables (users, items)
2. `efe934788a50` - 12-category item fields
3. `c9d8f48eedbc` - AI intelligence signals
4. `6de7fae67bb3` - notification + completion fields
5. `a3f2d9e81c45` - last_surfaced_at
6. `b1c3e7f9a2d4` - chat + memory tables

Always run `alembic revision --autogenerate` after modifying models, review the generated migration, then `alembic upgrade head`.

## Key Constraints

- **500-char limit** on item content is enforced at both schema (Pydantic `max_length=500`) and frontend (`maxLength` + counter). Never bypass this — it controls AI token costs.
- **12 categories** are fixed: `read, watch, ideas, tasks, people, notes, goals, buy, places, journal, learn, save`. Invalid AI responses fall back to `"save"`.
- **Rate limits**: chat endpoint is 20/hour per user; list endpoints 100/hour. Configured via `@user_limiter.limit()` decorator.
- **AI API split**: categorizer uses AI/ML API (OpenAI-compatible, `AIML_API_KEY`); agent uses Anthropic directly (`ANTHROPIC_API_KEY`). Both keys should be present in `.env`.
- Items are always filtered by `user_id` — never expose cross-user data.
