# Development Environment Setup Guide

## 🎯 Goal
Set up your local development environment to start building MindStash with Claude Code as your AI pair programmer.

## 📋 Prerequisites Checklist

Before starting, ensure you have:

- [ ] **Python 3.11+** installed
- [ ] **Node.js 18+** and npm installed
- [ ] **PostgreSQL 15+** (local or Supabase account)
- [ ] **Git** installed
- [ ] **Code editor** (VS Code recommended)
- [ ] **Anthropic API key** (from console.anthropic.com)
- [ ] **GitHub account** for version control

## 🔧 Step-by-Step Setup

### Step 1: Check Your System

Run these commands to verify installations:

```bash
# Check Python version (should be 3.11+)
python3 --version

# Check Node.js version (should be 18+)
node --version
npm --version

# Check Git version
git --version

# Check PostgreSQL (if installed locally)
psql --version
```

### Step 2: Clone/Download Project

If you're starting fresh:

```bash
# Create project directory
mkdir mindstash
cd mindstash

# Initialize git
git init

# Create GitHub repository and link it
git remote add origin <your-github-repo-url>
```

Or if downloading the prepared structure:

```bash
# Download and extract the project files
# (You already have these from our setup)
```

### Step 3: Backend Setup

#### 3.1 Create Virtual Environment

```bash
cd backend

# Create virtual environment
python3 -m venv venv

# Activate it
# On macOS/Linux:
source venv/bin/activate

# On Windows:
# venv\Scripts\activate

# Verify activation (should show venv path)
which python
```

#### 3.2 Install Dependencies

```bash
# Upgrade pip
pip install --upgrade pip

# Install all dependencies
pip install -r requirements.txt

# This installs:
# - FastAPI & Uvicorn (web framework)
# - SQLAlchemy (ORM)
# - Alembic (migrations)
# - Anthropic SDK
# - Authentication libraries
# - Testing tools
```

#### 3.3 Configure Environment Variables

```bash
# Copy template
cp .env.example .env

# Open .env in your editor
nano .env  # or use VS Code: code .env
```

**Fill in these values:**

```bash
# Application
APP_NAME=MindStash
APP_ENV=development
DEBUG=True

# Database - Choose ONE option:

# Option 1: Local PostgreSQL
DATABASE_URL=postgresql://mindstash:password@localhost:5432/mindstash_db

# Option 2: Supabase (Recommended for beginners)
# Sign up at https://supabase.com
# Create new project
# Get connection string from Settings → Database
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres

# Security
# Generate secret key:
# Run: openssl rand -hex 32
SECRET_KEY=<paste-generated-key-here>

# Anthropic AI
# Get from: https://console.anthropic.com/settings/keys
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxx

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

#### 3.4 Set Up Database (If using local PostgreSQL)

```bash
# Start PostgreSQL service
# On macOS with Homebrew:
brew services start postgresql@15

# On Linux:
sudo systemctl start postgresql

# Create database
createdb mindstash_db

# Or using psql:
psql postgres
CREATE DATABASE mindstash_db;
\q
```

#### 3.5 Run Database Migrations

```bash
# Still in backend/ directory with venv activated

# Initialize Alembic (only first time)
alembic init alembic

# Create initial migration
alembic revision --autogenerate -m "Initial tables"

# Run migrations
alembic upgrade head

# Verify tables created:
# If using Supabase: Check table editor in dashboard
# If using local: psql mindstash_db -c "\dt"
```

#### 3.6 Test Backend

```bash
# Start development server
uvicorn app.main:app --reload --port 8000

# You should see:
# INFO:     Uvicorn running on http://127.0.0.1:8000
# INFO:     Application startup complete.
```

**Open in browser:**
- API: http://localhost:8000
- Swagger Docs: http://localhost:8000/docs
- Health Check: http://localhost:8000/health

**Test with curl:**
```bash
curl http://localhost:8000/health
# Should return: {"status":"healthy","environment":"development"}
```

### Step 4: Frontend Setup

Open a **NEW terminal** (keep backend running):

```bash
cd frontend

# Initialize Next.js project (first time only)
npx create-next-app@latest . --typescript --tailwind --app --src-dir

# When prompted:
# ✓ Would you like to use TypeScript? Yes
# ✓ Would you like to use ESLint? Yes
# ✓ Would you like to use Tailwind CSS? Yes
# ✓ Would you like to use `src/` directory? Yes
# ✓ Would you like to use App Router? Yes
# ✓ Would you like to customize the default import alias? No

# Install dependencies
npm install

# Install additional packages we'll need
npm install @tanstack/react-query axios date-fns
npm install -D @types/node
```

#### 4.1 Configure Environment

```bash
# Create environment file
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:8000
EOF
```

#### 4.2 Test Frontend

```bash
# Start development server
npm run dev

# You should see:
# ▲ Next.js 14.x.x
# - Local:        http://localhost:3000
```

**Open in browser:**
http://localhost:3000

### Step 5: Verify Full Stack

Now you should have:
- ✅ Backend running on http://localhost:8000
- ✅ Frontend running on http://localhost:3000
- ✅ Database connected (Supabase or local)
- ✅ API docs accessible at http://localhost:8000/docs

## 🧪 Test Complete Setup

### Test 1: API Health Check

```bash
curl http://localhost:8000/health
```

Expected: `{"status":"healthy",...}`

### Test 2: Database Connection

```bash
# In backend terminal with venv activated
python -c "from app.core.database import engine; print(engine.connect())"
```

Expected: No errors

### Test 3: Frontend API Call

Create `frontend/src/app/test/page.tsx`:

```typescript
export default async function TestPage() {
  const response = await fetch('http://localhost:8000/health');
  const data = await response.json();
  
  return (
    <div>
      <h1>API Test</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
```

Visit: http://localhost:3000/test

## 🎨 IDE Setup (VS Code Recommended)

### Install Extensions:

1. **Python** (Microsoft)
2. **Pylance** (Microsoft) - Python language server
3. **Black Formatter** (Microsoft) - Code formatting
4. **ES7+ React/Redux/React-Native snippets**
5. **Tailwind CSS IntelliSense**
6. **GitLens** - Git integration
7. **Thunder Client** - API testing (alternative to Postman)

### VS Code Settings:

Create `.vscode/settings.json`:

```json
{
  "python.defaultInterpreterPath": "./backend/venv/bin/python",
  "python.formatting.provider": "black",
  "python.linting.enabled": true,
  "python.linting.flake8Enabled": true,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## 🤖 Claude Code Setup

### Install Claude Code (if not already):

```bash
# Check if installed
claude-code --version

# If not installed, follow: https://docs.anthropic.com/claude-code
```

### Configure for Your Project:

Create `.claude-code/config.json`:

```json
{
  "project": {
    "name": "MindStash",
    "language": ["python", "typescript"],
    "framework": ["fastapi", "nextjs"]
  },
  "rules": {
    "python": {
      "formatter": "black",
      "linter": "flake8",
      "type_checker": "mypy"
    },
    "typescript": {
      "formatter": "prettier",
      "linter": "eslint"
    }
  }
}
```

### Using Claude Code:

```bash
# In project root
claude-code

# Example prompts:
"Create a user registration endpoint in FastAPI"
"Add form validation to the login page"
"Write tests for the items API"
"Review this code for security issues"
```

## 📊 Database GUI Tools

### For Supabase:
Use the built-in Supabase dashboard at https://app.supabase.com

### For Local PostgreSQL:

**Option 1: pgAdmin** (GUI)
```bash
# macOS
brew install --cask pgadmin4

# Linux
sudo apt install pgadmin4
```

**Option 2: psql** (CLI)
```bash
# Connect to database
psql mindstash_db

# Useful commands:
\dt          # List tables
\d users     # Describe users table
SELECT * FROM users LIMIT 5;
```

## 🐛 Troubleshooting

### Issue: "No module named 'app'"

**Solution:**
```bash
# Make sure you're in backend/ directory
cd backend
# Make sure venv is activated
source venv/bin/activate
# Reinstall dependencies
pip install -r requirements.txt
```

### Issue: "Database connection failed"

**Solution:**
```bash
# Check DATABASE_URL in .env
cat .env | grep DATABASE_URL

# Test connection
psql "$DATABASE_URL"

# For Supabase: Verify IP whitelist in Supabase dashboard
```

### Issue: "CORS error" when frontend calls backend

**Solution:**
In `backend/app/main.py`, verify CORS origins include `http://localhost:3000`

### Issue: "Port already in use"

**Solution:**
```bash
# Find process using port 8000
lsof -i :8000

# Kill it
kill -9 <PID>

# Or use different port
uvicorn app.main:app --reload --port 8001
```

## ✅ Verification Checklist

Before starting Week 1 development, verify:

- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Database connection works
- [ ] API docs accessible at /docs
- [ ] Can create/query database tables
- [ ] .env files configured correctly
- [ ] Git repository initialized
- [ ] Claude Code working (if using)

## 🎉 You're Ready!

If all checks pass, you're ready to start Week 1!

Next steps:
1. Review `docs/week-1-guide.md`
2. Start with Day 1 tasks
3. Use Claude Code as your pair programmer
4. Commit code daily to GitHub

## 📚 Quick Reference Commands

```bash
# Backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
pytest  # Run tests

# Frontend  
cd frontend
npm run dev
npm test  # Run tests

# Database migrations
cd backend
alembic revision --autogenerate -m "description"
alembic upgrade head

# Git
git add .
git commit -m "Your message"
git push origin main
```

---

**Questions?** Use Claude Code to ask me anything! 🤖

**Ready to code?** Open `docs/week-1-guide.md` and let's start Day 1! 🚀
