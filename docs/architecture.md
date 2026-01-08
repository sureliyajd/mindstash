# MindStash - System Architecture

## 📐 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Next.js    │  │   React      │  │  Tailwind    │     │
│  │  App Router  │  │  Components  │  │     CSS      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  Deployed on: Vercel (Free Tier)                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS/REST API
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                         Backend                              │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   FastAPI    │  │  SQLAlchemy  │  │   Pydantic   │     │
│  │   Routes     │  │     ORM      │  │  Validation  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────────────────────────────┐                  │
│  │      AI Service Layer                │                  │
│  │  ┌────────────┐  ┌────────────┐     │                  │
│  │  │  Claude    │  │  Prompt    │     │                  │
│  │  │    API     │  │ Engineering│     │                  │
│  │  └────────────┘  └────────────┘     │                  │
│  └──────────────────────────────────────┘                  │
│                                                              │
│  Deployed on: Railway.app (Free Tier)                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ SQL Queries
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                       Database                               │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  PostgreSQL  │  │    JSONB     │  │   pgvector   │     │
│  │     15+      │  │   Columns    │  │ (Phase 2)    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  Deployed on: Supabase (Free Tier)                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ External API Call
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Anthropic Claude API                      │
│                                                              │
│              Claude Sonnet 4.5 Model                        │
│                                                              │
│              Pay-as-you-go Pricing                          │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Core Components

### 1. Frontend (Next.js)

**Technology:**
- Next.js 14+ with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- shadcn/ui for components

**Key Features:**
- Server-side rendering (SSR) for SEO
- Server Actions for API calls
- Optimistic UI updates
- Real-time AI response streaming

**Pages:**
```
/                    - Landing page
/login               - Authentication
/register            - User registration
/dashboard           - Main dashboard (protected)
/items               - Item list view (protected)
/items/[id]          - Single item view (protected)
/settings            - User settings (protected)
```

### 2. Backend (FastAPI)

**Technology:**
- Python 3.11+
- FastAPI framework
- SQLAlchemy ORM
- Alembic migrations
- Pydantic validation

**API Routes:**
```
POST   /api/auth/register          - User registration
POST   /api/auth/login             - User login
POST   /api/auth/refresh           - Refresh access token
GET    /api/users/me               - Get current user

POST   /api/items                  - Create item
GET    /api/items                  - List items (paginated)
GET    /api/items/{id}             - Get single item
PUT    /api/items/{id}             - Update item
DELETE /api/items/{id}             - Delete item
POST   /api/items/{id}/categorize  - Trigger AI categorization

GET    /health                     - Health check
GET    /                           - API info
```

**Middleware:**
- CORS for frontend access
- Authentication (JWT bearer)
- Rate limiting (Phase 2)
- Request logging

### 3. Database Schema

**Users Table:**
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR UNIQUE NOT NULL,
    hashed_password VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Items Table:**
```sql
CREATE TABLE items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    url TEXT,
    ai_category VARCHAR,
    ai_metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_items_user_id ON items(user_id);
CREATE INDEX idx_items_category ON items(ai_category);
CREATE INDEX idx_items_created_at ON items(created_at DESC);
```

### 4. AI Service Layer

**Categorization Service:**
```python
class AICategorizationService:
    """
    Handles AI categorization of user items
    """
    
    CATEGORIES = [
        "read_later",    # Articles, blogs to read
        "ideas",         # Random thoughts, inspirations
        "tasks",         # Things to do
        "reference",     # Save for future reference
        "goals",         # Long-term objectives
    ]
    
    async def categorize_item(
        self,
        content: str,
        url: Optional[str] = None
    ) -> dict:
        """
        Categorize item using Claude API
        
        Returns:
        {
            "category": "read_later",
            "confidence": 0.95,
            "reasoning": "...",
            "tags": ["productivity", "tech"]
        }
        """
```

**Prompt Template:**
```
You are a smart content categorization assistant. 
Given the following content, categorize it into one of these categories:
- read_later: Articles, blogs, videos to consume later
- ideas: Random thoughts, inspirations, creative concepts
- tasks: Action items, todos, things to do
- reference: Information to save for future use
- goals: Long-term objectives, aspirations

Content: {content}
URL: {url}

Provide:
1. Category (one of the above)
2. Confidence score (0-1)
3. Brief reasoning
4. Relevant tags (2-5)

Respond in JSON format.
```

## 🔐 Authentication Flow

```
1. User Registration:
   Client → POST /api/auth/register → Hash password → Store in DB
   
2. User Login:
   Client → POST /api/auth/login
   ↓
   Verify password
   ↓
   Generate JWT tokens (access + refresh)
   ↓
   Return tokens to client
   
3. Protected Request:
   Client → Request with Bearer token
   ↓
   Verify JWT token
   ↓
   Extract user_id
   ↓
   Execute request
   ↓
   Return response
```

## 📊 Data Flow - Item Creation

```
1. User captures content:
   Frontend → POST /api/items
   Body: { content: "...", url: "..." }
   Headers: { Authorization: "Bearer <token>" }
   
2. Backend validates:
   - Verify JWT token
   - Validate request data
   - Check user permissions
   
3. Store in database:
   - Create item record (without AI fields)
   - Return item_id to client
   
4. Background AI processing:
   - Call Claude API with item content
   - Parse AI response
   - Update item with:
     * ai_category
     * ai_metadata (confidence, tags, etc.)
   
5. Client receives updates:
   - Initial response: Item created
   - WebSocket/polling: AI categorization complete
```

## 🚀 Deployment Architecture

### Phase 1: MVP (Free Tier)

```
Frontend:
- Platform: Vercel
- Deployment: Git push → Auto deploy
- CDN: Vercel Edge Network
- Cost: $0/month

Backend:
- Platform: Railway.app
- Deployment: Git push → Auto deploy
- Resources: 512MB RAM, 0.5 vCPU
- Cost: ~$5 credit/month (covers MVP)

Database:
- Platform: Supabase
- Type: Postgres 15
- Storage: 500MB
- Cost: $0/month

AI:
- Service: Anthropic Claude API
- Model: Claude Sonnet 4.5
- Cost: ~$10-20/month (for testing)
```

### Phase 2: Growth (When needed)

```
Frontend: Vercel (still free)
Backend: Railway Pro ($20/month)
Database: Supabase Pro ($25/month)
AI: Same pay-as-you-go
CDN: Cloudflare (for assets)
```

### Phase 3: Scale (At $5K+ MRR)

```
Consider AWS/GCP for:
- Auto-scaling
- Advanced monitoring
- Multi-region deployment
- Custom infrastructure needs
```

## 🔄 CI/CD Pipeline

```
GitHub Actions Workflow:

1. On Push to main:
   ├── Run tests (pytest + jest)
   ├── Lint code (black, eslint)
   ├── Type check (mypy, tsc)
   └── If all pass:
       ├── Deploy backend to Railway
       └── Deploy frontend to Vercel

2. On Pull Request:
   ├── Run all tests
   ├── Preview deployment (Vercel)
   └── Comment with preview URL
```

## 📈 Scaling Considerations

### Database Optimization
- Add indexes for common queries
- Implement query caching
- Use connection pooling
- Consider read replicas

### API Performance
- Implement request caching (Redis)
- Add rate limiting per user
- Use async/await for I/O operations
- Background jobs for AI processing

### AI Cost Optimization
- Cache AI responses for similar content
- Batch AI requests when possible
- Use cheaper models for simple categorization
- Implement confidence thresholds

### Frontend Optimization
- Image optimization (next/image)
- Code splitting (dynamic imports)
- API response caching
- Optimistic UI updates

## 🔒 Security Measures

1. **Authentication:**
   - JWT tokens with expiration
   - Refresh token rotation
   - Password hashing (bcrypt)
   - Rate limiting on auth endpoints

2. **API Security:**
   - CORS configuration
   - Input validation (Pydantic)
   - SQL injection prevention (SQLAlchemy)
   - XSS protection

3. **Data Protection:**
   - HTTPS everywhere
   - Encrypted database connections
   - Environment variable secrets
   - User data isolation

## 🎯 Future Enhancements

### Phase 2:
- Semantic search (pgvector + embeddings)
- Browser extension
- Mobile apps (React Native)
- Email integration

### Phase 3:
- Multi-user workspaces
- API for third-party integrations
- Advanced AI features (summaries, insights)
- Custom categorization training

---

**Last Updated:** January 2026
**Version:** 0.1.0
