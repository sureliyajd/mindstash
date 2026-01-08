# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MindStash** - "Never lose a thought again"

An AI-powered contextual memory system that intelligently categorizes and surfaces saved content. Users capture anything in natural language (max 500 chars), AI automatically organizes it into 12 smart categories, and content is beautifully presented with Framer Motion animations and modern Lucide icons.

**Tech Stack:**
- Backend: Python 3.12, FastAPI 0.109.0, SQLAlchemy 2.0.25, PostgreSQL
- Frontend: Next.js 16.1.1, React 19.2.3, TypeScript 5, Tailwind CSS 4
- AI: AI/ML API (dev) → Anthropic Claude API (production)
- State Management: TanStack React Query 5.90.16
- Animations: Framer Motion (latest)
- Icons: Lucide React (modern, tree-shakeable)
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

# Install MindStash-specific dependencies
npm install framer-motion lucide-react

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
- `ANTHROPIC_API_KEY` - Claude API key from console.anthropic.com (for production)
- `AIML_API_KEY` - AI/ML API key for development (from aimlapi.com/app/keys)
- `SECRET_KEY` - Generate with `openssl rand -hex 32`
- `CORS_ORIGINS` - Frontend URL (JSON array format: `["http://localhost:3000"]`)

Frontend `.env.local` requires:
- `NEXT_PUBLIC_API_URL` - Backend URL (default: http://localhost:8000)

## Architecture

### Backend Structure

```
backend/app/
├── main.py              # ✅ FastAPI app entry point, CORS middleware, health endpoints
├── core/
│   ├── config.py        # ✅ Pydantic settings from environment variables
│   ├── database.py      # ✅ SQLAlchemy engine, SessionLocal, get_db dependency
│   └── security.py      # ✅ JWT token creation, password hashing, verify functions
├── models/              # ✅ SQLAlchemy ORM models
│   ├── user.py          # ✅ User model with UUID primary key, relationship to items
│   └── item.py          # ✅ Item model (UPDATED for 12 categories)
├── schemas/             # ✅ Pydantic validation schemas
│   ├── user.py          # ✅ UserCreate, UserLogin, UserResponse, TokenResponse
│   └── item.py          # ✅ ItemCreate, ItemUpdate, ItemResponse (UPDATED)
├── api/routes/          # 🚧 FastAPI route handlers (to be implemented)
│   ├── auth.py          # 📋 POST /api/auth/register, /login, /refresh
│   └── items.py         # 📋 CRUD endpoints for items
└── services/ai/         # 📋 AI categorization service
    └── categorizer.py   # 📋 Claude API integration for 12-category system
```

**Legend:** ✅ Implemented | 🚧 In Progress | 📋 Planned

### Frontend Structure

```
frontend/
├── src/
│   └── app/             # Next.js App Router
│       ├── page.tsx     # 📋 Landing page
│       ├── login/       # 📋 Login page
│       ├── register/    # 📋 Registration page
│       └── dashboard/   # 📋 Main dashboard (Masonry grid)
├── components/          # 📋 Reusable components
│   ├── ui/              # 📋 shadcn/ui components
│   ├── ItemCard.tsx     # 📋 Card with Framer Motion animations
│   ├── CategoryFilter.tsx # 📋 Filter chips with Lucide icons
│   └── CaptureInput.tsx # 📋 500-char input with counter
├── lib/
│   ├── api.ts           # 📋 API client (axios + React Query)
│   └── animations.ts    # 📋 Framer Motion variants
└── public/              # Static assets
```

### Database Schema

**Users table:** (unchanged)
- `id` (UUID, primary key)
- `email` (String, unique, indexed)
- `hashed_password` (String)
- `created_at`, `updated_at` (DateTime)
- Relationship: One-to-many with Items (cascade delete)

**Items table:** (UPDATED for MindStash)
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key to users, indexed)
- `content` (Text, max 500 chars, required)
- `url` (Text, optional) - auto-extracted from content
- `category` (String, indexed) - One of 12 categories (see below)
- `tags` (JSONB) - Array of strings, e.g. ["productivity", "tech"]
- `summary` (Text) - AI-generated brief description
- `confidence` (Float) - AI confidence score 0.0-1.0
- `priority` (String) - "low", "medium", "high"
- `time_sensitivity` (String) - "immediate", "this_week", "review_weekly", "reference"
- `ai_metadata` (JSONB) - Full AI response with reasoning
- `created_at` (DateTime, indexed), `updated_at` (DateTime)
- Relationship: Many-to-one with User

### 12 Categories (MindStash Core)

1. **📚 read** - Articles, blogs, documentation
2. **🎥 watch** - Videos, courses, talks
3. **💡 ideas** - Business, product, creative concepts
4. **✅ tasks** - Todos, action items
5. **👤 people** - Follow-ups, contacts, messages
6. **📝 notes** - Reference info, quotes, facts
7. **🎯 goals** - Long-term objectives, aspirations
8. **🛒 buy** - Shopping, products to purchase
9. **📍 places** - Travel, locations, restaurants
10. **💭 journal** - Personal thoughts, reflections
11. **🎓 learn** - Skills to acquire, courses
12. **🔖 save** - General bookmarks, miscellaneous

### AI Categorization Flow (MindStash)

1. User enters text (max 500 chars) in capture input
2. Frontend shows loading animation (Framer Motion)
3. Backend receives POST /api/items with content
4. Item saved to database immediately (without AI fields)
5. AI service calls API with 12-category prompt
   - **Development:** Using AI/ML API with GPT-4o (OpenAI-compatible)
   - **Production:** Will switch to Anthropic Claude Sonnet 4.5
6. AI returns: category, tags, summary, confidence, priority, time_sensitivity
7. Item updated with all AI fields
8. Frontend notified via React Query refetch
9. Card animates into masonry grid with Framer Motion

**AI System Prompt:**
```
You are a smart content organizer for MindStash. Analyze user input and categorize it into exactly ONE of these 12 categories:

1. read - Articles, blogs, documentation to read
2. watch - Videos, courses, talks to watch
3. ideas - Business ideas, product concepts, creative inspiration
4. tasks - Action items, todos, things to do
5. people - Follow-ups, contacts to reach, messages to send
6. notes - Reference information, quotes, facts to remember
7. goals - Long-term objectives, aspirations, life goals
8. buy - Products to purchase, shopping items
9. places - Locations to visit, restaurants, travel ideas
10. journal - Personal thoughts, reflections, diary entries
11. learn - Skills to acquire, courses to take, learning goals
12. save - General bookmarks, miscellaneous items

Respond in JSON format:
{
  "category": "one of the 12 categories",
  "tags": ["tag1", "tag2", "tag3"],
  "summary": "brief 1-sentence description (max 100 chars)",
  "confidence": 0.95,
  "priority": "low|medium|high",
  "time_sensitivity": "immediate|this_week|review_weekly|reference",
  "reasoning": "brief explanation of categorization"
}

User input: {content}
URL (if detected): {url}
```

### Authentication Flow

- JWT-based authentication using python-jose
- Password hashing with passlib[bcrypt]
- Access tokens expire in 30 minutes (configurable)
- Refresh tokens expire in 7 days (configurable)
- Protected routes use `Depends(get_current_user)` dependency

### API Endpoints

**Implemented:**
```
GET    /                           - API info (returns app name, version, status)
GET    /health                     - Health check (returns status, environment)
```

**To Be Implemented:**
```
POST   /api/auth/register          - User registration
POST   /api/auth/login             - User login (returns access + refresh tokens)
POST   /api/auth/refresh           - Refresh access token
GET    /api/users/me               - Get current user profile

POST   /api/items                  - Create item (triggers AI categorization)
GET    /api/items                  - List items (paginated, filtered by category)
GET    /api/items/{id}             - Get single item
PUT    /api/items/{id}             - Update item (content, category, etc.)
DELETE /api/items/{id}             - Delete item
POST   /api/items/{id}/recategorize - Manually trigger re-categorization
```

## Key Design Patterns

### Input Validation
- Max 500 characters for item content (enforced in schema)
- Auto-extract URLs from content using regex
- Show character counter in frontend (500/500)
- Prevent submission if over limit

### UI/UX Patterns

**Dashboard Layout:**
- Masonry grid (Pinterest-style) using CSS Grid or library
- Cards auto-size based on content length
- Sticky search bar at top
- Horizontal scrolling filter chips (12 categories)
- "All" shows all categories

**Card Design:**
- Icon + category name (top left)
- Content (2-3 lines, truncated with "...")
- Confidence badge (top right) - colored by score
- Tags as chips (bottom)
- Hover: scale up, show shadow, reveal actions (edit/delete)
- Click: expand to full view modal

**Framer Motion Animations:**
```typescript
// Card entrance (stagger)
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

// Hover effect
const hoverVariants = {
  scale: 1.02,
  boxShadow: "0 10px 30px rgba(0,0,0,0.1)"
}

// Category filter transition
const filterVariants = {
  exit: { opacity: 0, x: -20 },
  enter: { opacity: 1, x: 0 }
}
```

**Lucide Icons Usage:**
```typescript
import { 
  BookOpen,      // 📚 read
  Video,         // 🎥 watch
  Lightbulb,     // 💡 ideas
  CheckSquare,   // ✅ tasks
  Users,         // 👤 people
  FileText,      // 📝 notes
  Target,        // 🎯 goals
  ShoppingCart,  // 🛒 buy
  MapPin,        // 📍 places
  BookMarked,    // 💭 journal
  GraduationCap, // 🎓 learn
  Bookmark       // 🔖 save
} from 'lucide-react'
```

### Error Handling
- Use FastAPI HTTPException for API errors
- Return consistent error format: `{"detail": "error message"}`
- Frontend shows toast notifications for errors
- Log errors for debugging but don't expose internals

## Development Workflow

### ✅ Completed (Week 1)
- Project structure and environment setup
- Database models (User, Item) with SQLAlchemy
- Pydantic schemas for validation
- Core security utilities (JWT, password hashing)
- Configuration management
- Database migrations with Alembic
- Frontend scaffolding with Next.js 16, React 19, TypeScript
- Dependencies installed (React Query, Axios, Tailwind, Framer Motion, Lucide)

### 🚧 Current Phase: Week 2 (API Implementation)
- Update Item model for 12 categories + new fields
- Implement authentication endpoints
- Create CRUD operations for items
- Write comprehensive tests
- Set up proper error handling

### 📋 Upcoming: Week 3-4 (AI Integration)
- Integrate Anthropic Claude API
- Implement 12-category categorization service
- Handle AI rate limits and errors
- Add background task processing

### 📋 Upcoming: Week 5-6 (Frontend Development)
- Build authentication flow
- Create masonry grid dashboard
- Implement capture input with 500-char limit
- Add Framer Motion animations everywhere
- Integrate Lucide icons
- Add category filters
- Build item detail modal

## Important Notes

### Character Limit (500 chars)
- CRITICAL: Enforce 500-char limit to control token costs
- Frontend: Show counter, prevent submission over limit
- Backend: Validate with Pydantic (max_length=500)
- Example: "This is a test input..." (500/500)

### Database Migrations
- Always use Alembic for schema changes
- Run `alembic revision --autogenerate` after modifying models
- Review migration before applying
- Test migrations are reversible

### Security Considerations
- Never commit .env files or expose API keys
- Always hash passwords before storing
- Validate all user input with Pydantic
- Filter items by user_id to prevent unauthorized access
- 500-char limit prevents abuse

### Testing Strategy
- Write tests for all API endpoints
- Mock Anthropic API calls to avoid costs
- Test 500-char limit enforcement
- Test all 12 categories
- Aim for >80% code coverage

### AI Cost Optimization
- 500-char input limit = ~125 tokens max per request
- System prompt ~300 tokens
- Total per categorization: ~450 tokens
- Cost: ~$0.0015 per item (with Claude Sonnet 4.5)
- Cache responses for identical content (Phase 2)

## Common Issues

### Database Connection Errors
- Verify `DATABASE_URL` in .env is correct
- Check Supabase project running and IP whitelisted

### CORS Errors from Frontend
- Verify `CORS_ORIGINS=["http://localhost:3000"]` (JSON array!)
- Restart backend after changing CORS settings

### Character Limit Not Enforced
- Check Pydantic schema has `max_length=500`
- Check frontend validation matches backend

### Framer Motion Not Working
- Ensure `framer-motion` installed: `npm install framer-motion`
- Import motion components: `import { motion } from 'framer-motion'`

## Project Goals

1. **Learn AI Engineering** - Master LLM integration, prompt engineering, 12-category system
2. **Build Portfolio** - Create production-ready SaaS with beautiful UI
3. **Generate Revenue** - Launch and scale to $5K-$10K MRR
4. **Master Modern Stack** - FastAPI + Next.js + Framer Motion + AI

**Key Features:**
- ✅ 500-char input limit (cost control)
- ✅ 12 smart categories (comprehensive)
- ✅ Beautiful Masonry grid UI
- ✅ Framer Motion animations (modern)
- ✅ Lucide icons (clean, modern)
- ✅ User can edit category (AI not perfect)
- ✅ Confidence score shown (trust building)

This is a learning-focused project with emphasis on shipping quickly, beautiful UI, and practical AI integration.
