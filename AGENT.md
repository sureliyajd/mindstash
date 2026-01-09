# AGENT.md

**AI Agent Instructions for MindStash Development**

This file provides specific guidance for AI coding assistants (Claude Code, GitHub Copilot, Cursor, etc.) working on this codebase.

---

## Quick Context

**What is MindStash?**
"Never lose a thought again" - An AI-powered memory system with 12 smart categories, 500-char input limit, beautiful Framer Motion animations, and modern Lucide icons.

**Current Status:** Week 2 - Foundation complete, implementing API endpoints with 12-category system

**Your Role:** Implement features with focus on beautiful UI, smooth animations, and efficient AI categorization.

---

## MindStash-Specific Rules

### Input Constraints
- **ALWAYS enforce 500-char limit** on item content
- Frontend: Show character counter (e.g. "247/500")
- Backend: Validate with Pydantic `max_length=500`
- Reason: Control AI token costs (500 chars ≈ 125 tokens)

### 12 Categories System
```python
CATEGORIES = [
    "read",     # 📚 Articles, blogs, documentation
    "watch",    # 🎥 Videos, courses, talks  
    "ideas",    # 💡 Business, product, creative
    "tasks",    # ✅ Todos, action items
    "people",   # 👤 Follow-ups, contacts
    "notes",    # 📝 Reference, quotes, facts
    "goals",    # 🎯 Long-term objectives
    "buy",      # 🛒 Shopping, products
    "places",   # 📍 Travel, locations
    "journal",  # 💭 Personal thoughts
    "learn",    # 🎓 Skills, courses
    "save",     # 🔖 General bookmarks
]
```

### UI/UX Requirements
- **Layout:** Masonry grid (Pinterest-style)
- **Animations:** Framer Motion everywhere (card entrance, hover, transitions)
- **Icons:** Lucide React (modern, clean)
- **Cards:** Show icon, category, 2-3 lines of content, confidence badge, tags
- **Filters:** Horizontal scrolling chips with category icons
- **Search:** Sticky at top, full width

---

## Code Style & Conventions

### Python/FastAPI (Backend)

**Item Model Pattern (UPDATED):**
```python
# backend/app/models/item.py
class Item(Base):
    __tablename__ = "items"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    content = Column(Text, nullable=False)  # Max 500 chars enforced in schema
    url = Column(Text, nullable=True)
    
    # AI fields (12-category system)
    category = Column(String, nullable=True, index=True)  # One of 12 categories
    tags = Column(JSONB, nullable=True)  # ["tag1", "tag2"]
    summary = Column(Text, nullable=True)  # AI-generated brief description
    confidence = Column(Float, nullable=True)  # 0.0-1.0
    priority = Column(String, nullable=True)  # "low", "medium", "high"
    time_sensitivity = Column(String, nullable=True)  # "immediate", "this_week", etc.
    ai_metadata = Column(JSONB, nullable=True)  # Full AI response
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

**Item Schema Pattern (UPDATED):**
```python
# backend/app/schemas/item.py
from pydantic import BaseModel, Field, validator

class ItemCreate(BaseModel):
    content: str = Field(..., max_length=500)  # CRITICAL: 500-char limit
    url: Optional[str] = None
    
    @validator('content')
    def validate_content(cls, v):
        if len(v) > 500:
            raise ValueError('Content cannot exceed 500 characters')
        return v.strip()

class ItemResponse(BaseModel):
    id: UUID
    user_id: UUID
    content: str
    url: Optional[str]
    category: Optional[str]  # One of 12 categories
    tags: Optional[List[str]]  # ["productivity", "tech"]
    summary: Optional[str]
    confidence: Optional[float]  # 0.95
    priority: Optional[str]  # "medium"
    time_sensitivity: Optional[str]  # "this_week"
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
```

**AI Categorization Service Pattern:**

**NOTE:** Current implementation uses AI/ML API (OpenAI-compatible) for development.
Production will use Anthropic API. Code is structured for easy swapping.

```python
# backend/app/services/ai/categorizer.py
from openai import OpenAI
from app.core.config import settings

# TODO: Replace with Anthropic API in production
# Current: AI/ML API (OpenAI-compatible, dev only)
# Future: client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
client = OpenAI(
    api_key=settings.AIML_API_KEY,
    base_url="https://api.aimlapi.com/v1"
)

SYSTEM_PROMPT = """You are a smart content organizer for MindStash.
Analyze user input and categorize into exactly ONE of these 12 categories:

1. read - Articles, blogs, documentation
2. watch - Videos, courses, talks
3. ideas - Business, product concepts
4. tasks - Todos, action items
5. people - Follow-ups, contacts
6. notes - Reference info, quotes
7. goals - Long-term objectives
8. buy - Shopping, products
9. places - Locations, restaurants
10. journal - Personal thoughts
11. learn - Skills, courses
12. save - General bookmarks

Respond in JSON:
{
  "category": "one of 12",
  "tags": ["tag1", "tag2"],
  "summary": "1-sentence description (max 100 chars)",
  "confidence": 0.95,
  "priority": "low|medium|high",
  "time_sensitivity": "immediate|this_week|review_weekly|reference",
  "reasoning": "brief explanation"
}

User input: {content}
URL: {url}"""

def categorize_item(content: str, url: Optional[str] = None) -> dict:
    """Categorize content using AI (12-category system)"""
    # Current: OpenAI-compatible API call
    # TODO: Switch to Anthropic messages.create() in production
    response = client.chat.completions.create(
        model="gpt-4o",  # TODO: Change to "claude-sonnet-4-5-20241022" for production
        messages=[{
            "role": "user",
            "content": SYSTEM_PROMPT.format(
                content=content[:500],  # Enforce limit
                url=url or "None"
            )
        }],
        max_tokens=500,
        temperature=0.7
    )

    import json
    result_text = response.choices[0].message.content
    result = json.loads(result_text)

    # Validate category is one of 12
    valid_categories = ["read", "watch", "ideas", "tasks", "people",
                       "notes", "goals", "buy", "places", "journal",
                       "learn", "save"]

    if result["category"] not in valid_categories:
        result["category"] = "save"  # Fallback

    return result
```

### TypeScript/React (Frontend)

**Framer Motion Card Pattern:**
```typescript
// frontend/components/ItemCard.tsx
import { motion } from 'framer-motion'
import { BookOpen, Video, Lightbulb, CheckSquare, Users, 
         FileText, Target, ShoppingCart, MapPin, BookMarked, 
         GraduationCap, Bookmark } from 'lucide-react'

const CATEGORY_ICONS = {
  read: BookOpen,
  watch: Video,
  ideas: Lightbulb,
  tasks: CheckSquare,
  people: Users,
  notes: FileText,
  goals: Target,
  buy: ShoppingCart,
  places: MapPin,
  journal: BookMarked,
  learn: GraduationCap,
  save: Bookmark,
}

interface ItemCardProps {
  item: Item
  onEdit?: () => void
  onDelete?: () => void
}

export function ItemCard({ item, onEdit, onDelete }: ItemCardProps) {
  const Icon = CATEGORY_ICONS[item.category as keyof typeof CATEGORY_ICONS]
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.02, boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}
      className="bg-white rounded-lg p-4 cursor-pointer"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-medium capitalize">{item.category}</span>
        </div>
        
        {/* Confidence Badge */}
        <span className={`text-xs px-2 py-1 rounded ${
          item.confidence > 0.9 ? 'bg-green-100 text-green-700' :
          item.confidence > 0.7 ? 'bg-yellow-100 text-yellow-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {Math.round(item.confidence * 100)}%
        </span>
      </div>
      
      {/* Content (truncated to 2-3 lines) */}
      <p className="text-sm text-gray-700 line-clamp-3 mb-2">
        {item.content}
      </p>
      
      {/* Tags */}
      {item.tags && item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {item.tags.map((tag, i) => (
            <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
              {tag}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  )
}
```

**Capture Input with 500-Char Counter:**
```typescript
// frontend/components/CaptureInput.tsx
import { useState } from 'react'
import { motion } from 'framer-motion'

export function CaptureInput({ onSubmit }: { onSubmit: (content: string) => void }) {
  const [content, setContent] = useState('')
  const maxLength = 500
  const remaining = maxLength - content.length
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (content.trim() && content.length <= maxLength) {
      onSubmit(content)
      setContent('')
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Capture anything... (max 500 characters)"
          maxLength={maxLength}
          className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
          rows={3}
        />
        
        {/* Character Counter */}
        <div className="absolute bottom-2 right-2 text-xs text-gray-500">
          <span className={remaining < 50 ? 'text-red-500 font-bold' : ''}>
            {content.length}/{maxLength}
          </span>
        </div>
      </div>
      
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        type="submit"
        disabled={!content.trim() || content.length > maxLength}
        className="mt-2 px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
      >
        Capture
      </motion.button>
    </form>
  )
}
```

**Category Filter Chips:**
```typescript
// frontend/components/CategoryFilter.tsx
import { motion } from 'framer-motion'
import { BookOpen, Video, Lightbulb, /* ... rest of icons */ } from 'lucide-react'

const CATEGORIES = [
  { id: 'all', label: 'All', icon: null },
  { id: 'read', label: 'Read', icon: BookOpen },
  { id: 'watch', label: 'Watch', icon: Video },
  { id: 'ideas', label: 'Ideas', icon: Lightbulb },
  // ... rest of 12 categories
]

export function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {CATEGORIES.map(({ id, label, icon: Icon }) => (
        <motion.button
          key={id}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap ${
            selected === id
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {Icon && <Icon className="w-4 h-4" />}
          <span className="text-sm font-medium">{label}</span>
        </motion.button>
      ))}
    </div>
  )
}
```

---

## Architecture Patterns

### API Route Pattern (UPDATED)

```python
# backend/app/api/routes/items.py
@router.post("/", response_model=ItemResponse, status_code=status.HTTP_201_CREATED)
async def create_item(
    item_data: ItemCreate,  # Has 500-char validation
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create item and trigger AI categorization"""
    # 1. Create item without AI fields
    item = Item(
        content=item_data.content,  # Already validated to 500 chars
        url=item_data.url,
        user_id=current_user.id
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    
    # 2. Categorize with AI (12-category system)
    from app.services.ai.categorizer import categorize_item
    ai_result = categorize_item(item.content, item.url)
    
    # 3. Update item with AI fields
    item.category = ai_result["category"]
    item.tags = ai_result["tags"]
    item.summary = ai_result["summary"]
    item.confidence = ai_result["confidence"]
    item.priority = ai_result["priority"]
    item.time_sensitivity = ai_result["time_sensitivity"]
    item.ai_metadata = ai_result  # Store full response
    
    db.commit()
    db.refresh(item)
    
    return item


@router.get("/", response_model=ItemListResponse)
async def list_items(
    category: str | None = None,  # One of 12 categories
    page: int = 1,
    page_size: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List items with category filter"""
    query = db.query(Item).filter(Item.user_id == current_user.id)
    
    # Filter by category (validate it's one of 12)
    if category and category != "all":
        valid_categories = ["read", "watch", "ideas", "tasks", "people", 
                           "notes", "goals", "buy", "places", "journal", 
                           "learn", "save"]
        if category in valid_categories:
            query = query.filter(Item.category == category)
    
    total = query.count()
    items = query.order_by(Item.created_at.desc()).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    
    return ItemListResponse(items=items, total=total, page=page, page_size=page_size)


@router.put("/{item_id}", response_model=ItemResponse)
async def update_item(
    item_id: UUID,
    updates: ItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update item (user can change category manually)"""
    item = db.query(Item).filter(
        Item.id == item_id,
        Item.user_id == current_user.id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Allow user to override AI category
    if updates.category:
        valid_categories = ["read", "watch", "ideas", "tasks", "people", 
                           "notes", "goals", "buy", "places", "journal", 
                           "learn", "save"]
        if updates.category in valid_categories:
            item.category = updates.category
    
    if updates.content:
        if len(updates.content) > 500:
            raise HTTPException(status_code=400, detail="Content exceeds 500 characters")
        item.content = updates.content
    
    if updates.url is not None:
        item.url = updates.url
    
    item.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(item)
    
    return item
```

---

## Testing Patterns

### Test 500-Char Limit:
```python
def test_create_item_exceeds_limit(client, auth_headers):
    """Test that 500-char limit is enforced"""
    long_content = "a" * 501
    response = client.post(
        "/api/items",
        json={"content": long_content},
        headers=auth_headers
    )
    assert response.status_code == 422  # Validation error


def test_create_item_at_limit(client, auth_headers):
    """Test that 500 chars is accepted"""
    content = "a" * 500
    response = client.post(
        "/api/items",
        json={"content": content},
        headers=auth_headers
    )
    assert response.status_code == 201
```

### Test 12 Categories:
```python
def test_categorize_into_12_categories(client, auth_headers):
    """Test that AI returns one of 12 valid categories"""
    test_cases = [
        ("Read this article about Python", "read"),
        ("Watch tutorial on React", "watch"),
        ("Idea: Build a SaaS for developers", "ideas"),
        ("Buy milk and eggs", "buy"),
    ]
    
    for content, expected_category in test_cases:
        response = client.post(
            "/api/items",
            json={"content": content},
            headers=auth_headers
        )
        assert response.status_code == 201
        data = response.json()
        
        # Verify category is valid
        valid_categories = ["read", "watch", "ideas", "tasks", "people", 
                           "notes", "goals", "buy", "places", "journal", 
                           "learn", "save"]
        assert data["category"] in valid_categories
```

---

## Decision Guidelines

### When to Show Confidence Badge
- **Always show** on cards
- Color code:
  - Green (>90%): High confidence
  - Yellow (70-90%): Medium confidence
  - Gray (<70%): Low confidence
- Helps user decide whether to manually recategorize

### When to Truncate Content
- **Card view:** Show 2-3 lines max (use CSS `line-clamp-3`)
- **List view:** Show full content
- **Always** show "..." if truncated
- **Click** to expand to full modal

### When to Trigger Re-categorization
- User explicitly requests it
- User edits content significantly (>50% changed)
- NOT on every edit (costs money)

---

## Performance Best Practices

- **AI Categorization:** Async/background task (don't block API response)
- **Masonry Grid:** Use virtualization for 1000+ items
- **Framer Motion:** Use `layoutId` for smooth transitions
- **Icons:** Tree-shake Lucide (only import used icons)
- **500-char limit:** Prevents large database rows, fast queries

---

## Common Errors & Solutions

### "Content exceeds 500 characters"
**Problem:** Frontend allows >500 chars
**Solution:** Add `maxLength={500}` to textarea + show counter

### "Invalid category"
**Problem:** AI returned category not in list of 12
**Solution:** Add fallback to "save" category in categorizer.py

### Framer Motion not animating
**Problem:** Missing `<AnimatePresence>` wrapper
**Solution:** Wrap grid in `<AnimatePresence mode="popLayout">`

---

## Next Steps (Priority Order)

1. **Update Item model** with new fields (category, tags, summary, etc.)
2. **Update Item schemas** (enforce 500-char limit)
3. **Create AI categorizer** service (12-category system)
4. **Implement auth endpoints**
5. **Implement items CRUD** (with AI categorization)
6. **Write tests** (500-char limit, 12 categories)
7. **Build frontend dashboard** (Masonry grid + Framer Motion)
8. **Add Lucide icons** to category chips
9. **Deploy and test** with real users

---

## Remember

- **500-char limit is CRITICAL** - enforce everywhere
- **12 categories, not 5** - read, watch, ideas, tasks, people, notes, goals, buy, places, journal, learn, save
- **Framer Motion everywhere** - cards, filters, modals
- **Lucide icons, not emoji** - cleaner, professional
- **User can edit category** - AI is smart but not perfect
- **Show confidence score** - builds trust

---

**Ship fast, iterate quickly, make it beautiful!**
