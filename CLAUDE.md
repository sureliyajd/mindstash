# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MindStash is an AI-powered contextual memory system that intelligently categorizes and surfaces saved content. This is a learning project focused on mastering AI engineering, FastAPI, Next.js, and building a production-ready SaaS.

**Tech Stack:**
- Backend: Python 3.11+, FastAPI, SQLAlchemy, PostgreSQL
- Frontend: Next.js 14+, TypeScript, Tailwind CSS, shadcn/ui
- AI: Anthropic Claude API (Sonnet 4.5)
- DevOps: Vercel (frontend), Railway (backend), Supabase (database)

## Development Commands

### Backend Commands

```bash
# Setup and activation
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Running the server
uvicorn app.main:app --reload --port 8000

# Database migrations
alembic revision --autogenerate -m "description"
alembic upgrade head
alembic downgrade -1

# Testing
pytest
pytest tests/test_auth.py -v
pytest --cov=app tests/

# Code quality
black app/
flake8 app/
mypy app/
```

### Frontend Commands

```bash
# Setup
cd frontend
npm install

# Development
npm run dev

# Build and production
npm run build
npm start

# Testing
npm test
npm run test:e2e

# Linting
npm run lint
```

### Environment Setup

Backend `.env` requires:
- `DATABASE_URL` - PostgreSQL connection string
- `ANTHROPIC_API_KEY` - Claude API key from console.anthropic.com
- `SECRET_KEY` - Generate with `openssl rand -hex 32`
- `CORS_ORIGINS` - Frontend URL (default: http://localhost:3000)

Frontend `.env.local` requires:
- `NEXT_PUBLIC_API_URL` - Backend URL (default: http://localhost:8000)

## Architecture

### Backend Structure

```
backend/app/
├── main.py              # FastAPI app entry point, CORS middleware
├── core/
│   ├── config.py        # Pydantic settings from environment variables
│   ├── database.py      # SQLAlchemy engine, SessionLocal, get_db dependency
│   └── security.py      # JWT token creation, password hashing
├── models/              # SQLAlchemy ORM models
│   ├── user.py          # User model with UUID primary key, relationship to items
│   └── item.py          # Item model with UUID, user_id FK, ai_category, ai_metadata JSONB
├── schemas/             # Pydantic validation schemas for request/response
│   ├── user.py
│   └── item.py
├── api/routes/          # FastAPI route handlers (to be implemented)
│   ├── auth.py          # POST /api/auth/register, /api/auth/login
│   └── items.py         # CRUD endpoints for items
└── services/ai/         # AI categorization service (Week 3)
```

### Database Schema

**Users table:**
- `id` (UUID, primary key)
- `email` (String, unique, indexed)
- `hashed_password` (String)
- `created_at`, `updated_at` (DateTime)
- Relationship: One-to-many with Items (cascade delete)

**Items table:**
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key to users, indexed)
- `content` (Text, required)
- `url` (Text, optional)
- `ai_category` (String, indexed) - Categories: read_later, ideas, tasks, reference, goals
- `ai_metadata` (JSONB) - Flexible JSON for confidence scores, tags, reasoning
- `created_at` (DateTime, indexed), `updated_at` (DateTime)
- Relationship: Many-to-one with User

### AI Categorization Flow

1. User creates item via POST /api/items with content and optional URL
2. Item is stored in database immediately (without AI fields)
3. Background/async task calls Claude API with categorization prompt
4. AI response parsed for: category, confidence score, reasoning, tags
5. Item updated with `ai_category` and `ai_metadata` fields
6. Frontend notified via WebSocket/polling (Phase 2) or refresh

**AI Categories:**
- `read_later` - Articles, blogs, videos to consume
- `ideas` - Random thoughts, inspirations, creative concepts
- `tasks` - Action items, todos, things to do
- `reference` - Information to save for future use
- `goals` - Long-term objectives, aspirations

### Authentication Flow

- JWT-based authentication using python-jose
- Password hashing with passlib[bcrypt]
- Access tokens expire in 30 minutes (configurable)
- Refresh tokens expire in 7 days (configurable)
- Protected routes use `Depends(get_current_user)` dependency

### API Endpoints (Planned)

```
POST   /api/auth/register          - User registration
POST   /api/auth/login             - User login
POST   /api/auth/refresh           - Refresh access token
GET    /api/users/me               - Get current user

POST   /api/items                  - Create item
GET    /api/items                  - List items (paginated, filtered by category)
GET    /api/items/{id}             - Get single item
PUT    /api/items/{id}             - Update item
DELETE /api/items/{id}             - Delete item
POST   /api/items/{id}/categorize  - Manually trigger re-categorization

GET    /health                     - Health check
GET    /                           - API info
```

## Key Design Patterns

### Database Sessions
- Use `get_db()` dependency injection for database sessions
- Sessions auto-close via finally block
- Example: `def endpoint(db: Session = Depends(get_db))`

### Configuration Management
- All settings loaded via Pydantic from .env file
- Cached with `@lru_cache()` for performance
- Access via `from app.core.config import settings`

### Model Relationships
- User → Items: One-to-many with cascade delete
- Always query items filtered by user_id for security
- Use SQLAlchemy relationships for joins, not manual queries

### Error Handling
- Use FastAPI HTTPException for API errors
- Return consistent error format: `{"detail": "error message"}`
- Log errors for debugging but don't expose internals to users

## Development Workflow

### Current Phase: Week 1-2 (Foundation)
- Setting up authentication endpoints
- Implementing CRUD operations for items
- Writing tests for core functionality

### Upcoming: Week 3-4 (AI Integration)
- Integrate Anthropic Claude API
- Implement categorization service in `services/ai/`
- Prompt engineering for accurate categorization
- Handle AI rate limits and errors

### Upcoming: Week 5-6 (Frontend)
- Initialize Next.js app with TypeScript
- Build authentication flow
- Create dashboard and item management UI
- Integrate with backend API

## Important Notes

### Database Migrations
- Always use Alembic for schema changes, never modify database directly
- Run `alembic revision --autogenerate` after modifying models
- Review generated migration before applying with `alembic upgrade head`
- Test migrations are reversible with `alembic downgrade -1`

### Security Considerations
- Never commit .env files or expose API keys
- Always hash passwords before storing (use `security.get_password_hash`)
- Validate all user input with Pydantic schemas
- Filter items by user_id to prevent unauthorized access
- Use parameterized queries (SQLAlchemy ORM handles this)

### Testing Strategy
- Write tests for all API endpoints in `backend/tests/`
- Use pytest fixtures for database sessions and test users
- Mock Anthropic API calls in tests to avoid costs
- Aim for >80% code coverage

### AI Cost Optimization
- Cache AI responses for similar content (Phase 2)
- Use Claude Sonnet 4.5 for balance of cost/quality
- Implement confidence thresholds to avoid re-categorization
- Batch requests when possible

## Common Issues

### Database Connection Errors
- Verify `DATABASE_URL` in .env is correct
- Check Supabase project is running and IP whitelisted
- Test connection: `psql $DATABASE_URL`

### Module Import Errors
- Ensure virtual environment is activated
- Reinstall: `pip install -r requirements.txt`
- Check Python version: `python --version` (needs 3.11+)

### CORS Errors from Frontend
- Verify `CORS_ORIGINS` includes frontend URL in backend/.env
- **Important**: `CORS_ORIGINS` must be in JSON array format: `["http://localhost:3000"]` not `http://localhost:3000`
- Check CORSMiddleware is properly configured in main.py
- Restart backend server after changing CORS settings

### Pydantic Settings Parsing Errors
- List fields in .env must use JSON format: `CORS_ORIGINS=["http://localhost:3000","http://localhost:3001"]`
- Comma-separated values won't parse correctly for List[str] fields
- If you see "error parsing value for field" errors, check JSON formatting in .env

### Alembic Migration Issues
- If migrations fail, check database connectivity first
- Ensure `alembic/env.py` imports app models and settings correctly
- Review generated migration file before applying
- Use `alembic current` to see current revision
- Never delete migration files once applied to production

## Project Goals

1. **Learn AI Engineering** - Master LLM integration and prompt engineering
2. **Build Portfolio** - Create production-ready SaaS showcase
3. **Generate Revenue** - Launch and scale to $5K-$10K MRR
4. **Master Modern Stack** - Gain deep expertise in FastAPI + Next.js + AI

This is a learning-focused project with emphasis on shipping quickly, building in public, and iterating based on user feedback.
