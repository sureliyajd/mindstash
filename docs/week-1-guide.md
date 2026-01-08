# Week 1: Foundation & Setup (Days 1-7)

## 🎯 Week Goals
By end of Week 1, you will have:
1. Complete development environment setup
2. Backend API foundation with FastAPI
3. Database schema designed and migrated
4. Basic authentication flow working
5. First API endpoint tested
6. Understanding of FastAPI + SQLAlchemy patterns

## 📅 Day-by-Day Breakdown

### Day 1: Environment Setup & Project Structure
**Time: 2-3 hours**

**Tasks:**
- [ ] Install Python 3.11+ (`python --version`)
- [ ] Install Node.js 18+ (`node --version`)
- [ ] Install PostgreSQL or Docker
- [ ] Create GitHub repository
- [ ] Set up project structure
- [ ] Initialize git (`git init`)

**Learning Objectives:**
- Understand monorepo structure
- Learn Python virtual environments
- Understand project organization

**Claude Code Tasks:**
```bash
# Use Claude Code to:
1. Initialize backend with FastAPI boilerplate
2. Initialize frontend with Next.js
3. Set up .gitignore files
4. Create initial requirements.txt
```

**Deliverables:**
- Project folder structure created
- Git repository initialized
- README.md completed

---

### Day 2: Backend Foundation - FastAPI Basics
**Time: 3-4 hours**

**Tasks:**
- [ ] Create virtual environment
- [ ] Install FastAPI dependencies
- [ ] Set up FastAPI main app
- [ ] Create first "Hello World" endpoint
- [ ] Test with uvicorn
- [ ] Explore FastAPI docs UI

**Learning Objectives:**
- FastAPI request/response cycle
- Automatic API documentation
- Pydantic models for validation
- Path operations (GET, POST, etc.)

**Code to Write:**
```python
# backend/app/main.py
from fastapi import FastAPI

app = FastAPI(title="MindStash API")

@app.get("/")
def root():
    return {"message": "MindStash API is running"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
```

**Test Commands:**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
# Visit http://localhost:8000/docs
```

**Deliverables:**
- FastAPI app running
- Swagger docs accessible
- First endpoints working

---

### Day 3: Database Setup & Models
**Time: 3-4 hours**

**Tasks:**
- [ ] Set up PostgreSQL locally or Supabase
- [ ] Install SQLAlchemy + dependencies
- [ ] Create database configuration
- [ ] Design initial schema (Users, Items tables)
- [ ] Create SQLAlchemy models
- [ ] Set up Alembic for migrations

**Learning Objectives:**
- SQLAlchemy ORM basics
- Database relationships
- Migration management
- Database connection pooling

**Schema Design:**
```sql
Users:
  - id (UUID, PK)
  - email (unique)
  - hashed_password
  - created_at
  - updated_at

Items:
  - id (UUID, PK)
  - user_id (FK to Users)
  - content (Text)
  - url (Text, nullable)
  - ai_category (String, nullable)
  - ai_metadata (JSONB, nullable)
  - created_at
  - updated_at
```

**Models to Create:**
```python
# backend/app/models/user.py
# backend/app/models/item.py
```

**Deliverables:**
- Database created
- SQLAlchemy models defined
- Initial migration created
- Database connection working

---

### Day 4: Authentication - Part 1 (Setup)
**Time: 3-4 hours**

**Tasks:**
- [ ] Install authentication dependencies (passlib, python-jose)
- [ ] Create password hashing utilities
- [ ] Create JWT token utilities
- [ ] Set up security configuration
- [ ] Create user registration endpoint
- [ ] Test user creation

**Learning Objectives:**
- Password hashing (bcrypt)
- JWT tokens (access + refresh)
- Security best practices
- OAuth2 password flow

**Core Files:**
```python
# backend/app/core/security.py
# backend/app/core/config.py
# backend/app/api/routes/auth.py
```

**API Endpoints to Create:**
```
POST /api/auth/register
  - Input: email, password
  - Output: user object + tokens

POST /api/auth/login
  - Input: email, password
  - Output: access_token, refresh_token
```

**Deliverables:**
- User registration working
- Password hashing implemented
- JWT token generation working

---

### Day 5: Authentication - Part 2 (Login & Protected Routes)
**Time: 3-4 hours**

**Tasks:**
- [ ] Create login endpoint
- [ ] Implement token validation
- [ ] Create dependency for protected routes
- [ ] Test authentication flow
- [ ] Create "get current user" endpoint
- [ ] Add proper error handling

**Learning Objectives:**
- FastAPI dependencies
- OAuth2 bearer tokens
- Protected route patterns
- Error handling best practices

**Protected Endpoint Example:**
```python
@app.get("/api/users/me")
async def get_current_user(
    current_user: User = Depends(get_current_user)
):
    return current_user
```

**Test Flow:**
1. Register user → Get tokens
2. Use token to access /api/users/me
3. Test invalid token → Get 401 error
4. Test expired token → Get 401 error

**Deliverables:**
- Complete auth flow working
- Protected routes functional
- Proper error responses

---

### Day 6: Items API - CRUD Operations
**Time: 3-4 hours**

**Tasks:**
- [ ] Create Pydantic schemas for Items
- [ ] Implement Create Item endpoint
- [ ] Implement Get Items (list) endpoint
- [ ] Implement Get Item (single) endpoint
- [ ] Implement Update Item endpoint
- [ ] Implement Delete Item endpoint
- [ ] Add user ownership validation

**Learning Objectives:**
- CRUD pattern in FastAPI
- Pydantic schemas for validation
- Query parameters & filtering
- User ownership enforcement

**API Endpoints:**
```
POST   /api/items          - Create item
GET    /api/items          - List user's items
GET    /api/items/{id}     - Get single item
PUT    /api/items/{id}     - Update item
DELETE /api/items/{id}     - Delete item
```

**Pydantic Schemas:**
```python
# backend/app/schemas/item.py
class ItemCreate(BaseModel):
    content: str
    url: Optional[str] = None

class ItemResponse(BaseModel):
    id: UUID
    content: str
    url: Optional[str]
    ai_category: Optional[str]
    created_at: datetime
```

**Deliverables:**
- All CRUD endpoints working
- Proper validation
- User can only access their items

---

### Day 7: Testing & Documentation
**Time: 2-3 hours**

**Tasks:**
- [ ] Write tests for auth endpoints
- [ ] Write tests for items endpoints
- [ ] Test all error cases
- [ ] Update API documentation
- [ ] Create Postman/Thunder Client collection
- [ ] Review and refactor code

**Learning Objectives:**
- pytest basics
- Testing FastAPI endpoints
- Test fixtures
- API documentation

**Test Examples:**
```python
# backend/tests/test_auth.py
def test_register_user():
    # Test successful registration

def test_login_user():
    # Test successful login

def test_invalid_credentials():
    # Test login with wrong password
```

**Deliverables:**
- Comprehensive test suite
- All tests passing
- API documentation complete
- Week 1 MVP: Working backend API!

---

## 🎓 Week 1 Learning Outcomes

By the end of Week 1, you'll understand:

### FastAPI Concepts:
- ✅ Application structure
- ✅ Path operations (routes)
- ✅ Pydantic models for validation
- ✅ Dependency injection
- ✅ Automatic API docs
- ✅ Error handling

### Database Concepts:
- ✅ SQLAlchemy ORM
- ✅ Database migrations with Alembic
- ✅ Relationships (Foreign Keys)
- ✅ JSONB for flexible data

### Security Concepts:
- ✅ Password hashing
- ✅ JWT tokens
- ✅ OAuth2 password flow
- ✅ Protected routes

### Python Best Practices:
- ✅ Virtual environments
- ✅ Type hints
- ✅ Async/await
- ✅ Project structure

---

## 🛠️ Tools to Use Daily

1. **Claude Code** - Your AI pair programmer
   - Ask: "Create a FastAPI endpoint for user registration"
   - Ask: "Write tests for the items API"
   - Ask: "Review this code for security issues"

2. **FastAPI Docs** - Auto-generated at `/docs`
   - Test endpoints interactively
   - See request/response schemas
   - Debug API issues

3. **Database Tool** - Supabase Dashboard or pgAdmin
   - View database contents
   - Run SQL queries
   - Monitor connections

4. **Git** - Commit daily
   - Commit after each feature
   - Push to GitHub
   - Build in public (optional)

---

## 🚨 Common Issues & Solutions

### Issue: Virtual environment not activating
```bash
# Solution: Use full path
source /path/to/venv/bin/activate
```

### Issue: Database connection fails
```bash
# Solution: Check DATABASE_URL format
postgresql://user:password@localhost:5432/dbname
```

### Issue: Module not found errors
```bash
# Solution: Ensure venv is active and deps installed
pip install -r requirements.txt
```

### Issue: CORS errors (when frontend connects)
```python
# Solution: Add CORS middleware
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## ✅ Week 1 Success Criteria

You've successfully completed Week 1 if:

- [ ] FastAPI server runs without errors
- [ ] You can register a new user
- [ ] You can login and get a token
- [ ] You can create an item (with auth token)
- [ ] You can list your items
- [ ] Database persists data correctly
- [ ] All tests pass
- [ ] API documentation is complete

---

## 🎉 Celebration Checkpoint!

When you complete Week 1:
1. Take a screenshot of your API docs
2. Post on Twitter/LinkedIn: "Week 1 complete: Built FastAPI backend with auth!"
3. Commit and push to GitHub
4. Review what you learned
5. Prepare for Week 2: AI Integration! 🤖

---

## 📚 Additional Resources

- [FastAPI Tutorial](https://fastapi.tiangolo.com/tutorial/)
- [SQLAlchemy ORM Tutorial](https://docs.sqlalchemy.org/en/20/orm/quickstart.html)
- [JWT Authentication Guide](https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/)
- [Pydantic Documentation](https://docs.pydantic.dev/)

---

## 🤔 Questions to Ask Claude Code

During Week 1, ask me:
- "How do I structure FastAPI apps?"
- "What's the difference between Pydantic and SQLAlchemy models?"
- "How do I test protected routes?"
- "What are FastAPI dependencies?"
- "How do I handle database sessions properly?"

I'm here to help you learn AND build! 🚀

---

**Next Week Preview:** Week 2 focuses on AI integration with Claude API! 🧠
