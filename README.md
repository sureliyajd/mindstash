# MindStash

> Capture anything, find everything - AI organizes your digital life

An AI-powered contextual memory system that intelligently categorizes and surfaces your saved content at the right time.

## 🎯 Project Goals

1. **Learn AI Engineering** - Master LLM integration, prompt engineering, and agentic development
2. **Build Portfolio Product** - Create a production-ready SaaS to showcase to recruiters
3. **Generate Revenue** - Launch and scale to $5K-$10K MRR within 12 months
4. **Master Modern Stack** - Python FastAPI + Next.js + PostgreSQL + Claude AI

## 📚 Tech Stack

### Backend
- **Python 3.11+** - Core language
- **FastAPI** - Modern, fast web framework
- **SQLAlchemy** - ORM for database operations
- **Alembic** - Database migrations
- **Pydantic** - Data validation
- **Python-Jose** - JWT authentication

### Frontend
- **Next.js 14+** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **shadcn/ui** - Component library
- **React Query** - Server state management

### Database
- **PostgreSQL 15+** - Primary database
- **pgvector** - Vector similarity search (Phase 2)
- **Supabase** - Managed Postgres + Auth

### AI/ML
- **Anthropic Claude API** - LLM for categorization
- **Claude Sonnet 4.5** - Best balance of cost/quality
- **LangChain** - Prompt management (Phase 2)

### DevOps
- **Vercel** - Frontend hosting (free tier)
- **Railway.app** - Backend hosting (free tier)
- **Supabase** - Database hosting (free tier)
- **GitHub Actions** - CI/CD
- **PostHog** - Analytics (free tier)
- **Sentry** - Error tracking (free tier)

## 🗂️ Project Structure

```
mindstash/
├── backend/                 # FastAPI application
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── core/           # Config, security, dependencies
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # Business logic
│   │   │   └── ai/         # AI/LLM services
│   │   └── main.py         # FastAPI app entry
│   ├── alembic/            # Database migrations
│   ├── tests/              # Backend tests
│   ├── requirements.txt    # Python dependencies
│   └── .env.example        # Environment variables template
│
├── frontend/               # Next.js application
│   ├── src/
│   │   ├── app/           # App router pages
│   │   ├── components/    # React components
│   │   ├── lib/           # Utilities
│   │   └── types/         # TypeScript types
│   ├── public/            # Static assets
│   └── package.json       # Node dependencies
│
├── docs/                  # Documentation
│   ├── architecture.md    # System architecture
│   ├── api.md            # API documentation
│   └── deployment.md     # Deployment guide
│
├── scripts/              # Utility scripts
│   ├── setup.sh         # Initial setup
│   └── seed.sh          # Database seeding
│
└── docker-compose.yml   # Local development setup
```

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+ (or use Docker)
- Anthropic API key

### 1. Clone and Setup

```bash
# Clone repository
git clone <your-repo-url>
cd mindstash

# Run setup script
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Edit .env with your credentials:
# - DATABASE_URL
# - ANTHROPIC_API_KEY
# - SECRET_KEY (generate with: openssl rand -hex 32)

# Run migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.local.example .env.local

# Edit .env.local with:
# - NEXT_PUBLIC_API_URL=http://localhost:8000

# Start development server
npm run dev
```

### 4. Access Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 📅 Development Roadmap

### Phase 1: MVP (Weeks 1-8) - CURRENT

#### Week 1-2: Foundation ✅
- [x] Project structure
- [x] Development environment
- [ ] User authentication (Supabase)
- [ ] Basic capture API
- [ ] Database schema

#### Week 3-4: AI Integration
- [ ] Claude API integration
- [ ] Prompt engineering for categorization
- [ ] 5 core categories implementation
- [ ] Confidence scoring

#### Week 5-6: Frontend Dashboard
- [ ] Next.js app setup
- [ ] Authentication flow
- [ ] Capture interface
- [ ] Item list view
- [ ] Category filters

#### Week 7-8: Polish & Deploy
- [ ] Error handling & loading states
- [ ] Dark mode
- [ ] Deploy to Vercel + Railway
- [ ] Analytics integration
- [ ] Beta user onboarding

### Phase 2: Enhanced Features (Weeks 9-12)
- [ ] Browser extension (Chrome)
- [ ] PWA support
- [ ] Smart reminders
- [ ] Email digests

### Phase 3: Scale (Months 4-6)
- [ ] Semantic search (pgvector)
- [ ] Context-aware surfacing
- [ ] Integrations (Twitter, Notion)
- [ ] API access for power users

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test

# E2E tests
npm run test:e2e
```

## 📊 Key Metrics to Track

- **User Engagement:** Daily active users, retention rate
- **AI Performance:** Categorization accuracy, response time
- **Technical:** API latency, error rates, uptime
- **Business:** Conversion rate, MRR, churn

## 🎓 Learning Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Anthropic Claude API](https://docs.anthropic.com/)
- [Supabase Documentation](https://supabase.com/docs)

## 📝 License

MIT License - Feel free to use this for learning and portfolio purposes

## 🤝 Contributing

This is a learning project, but feedback and suggestions are welcome!

## 📧 Contact

Building in public! Follow the journey on [Twitter/X](your-handle)

---

Built with ❤️ by [Your Name] | Powered by Claude AI
