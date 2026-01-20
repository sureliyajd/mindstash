# MindStash AI Integration Documentation

> Anthropic Claude API for Intelligent Content Categorization

## Overview

MindStash uses Anthropic's Claude AI to automatically categorize user input into one of 12 categories, extract metadata, and predict notification schedules. This creates an intelligent, self-organizing thought capture system.

## Tech Stack

| Component | Technology |
|-----------|------------|
| AI Provider | Anthropic Claude API |
| Development Model | claude-haiku-4-5-20251001 (cost-effective) |
| Production Model | claude-sonnet-4-5-20241022 (more capable) |
| SDK | anthropic==0.18.1 |
| Token Limit | ~625 tokens per request |

## Configuration

### API Keys

```bash
# .env
# Production (Anthropic direct)
ANTHROPIC_API_KEY=sk-ant-api03-...

# Development (AI/ML API - OpenAI compatible)
AIML_API_KEY=cc0b05e0...
```

### Client Setup (`app/services/ai/categorizer.py`)

```python
from anthropic import Anthropic
from app.core.config import settings

client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)

# Model selection
CURRENT_MODEL = "claude-haiku-4-5-20251001"  # Development
# CURRENT_MODEL = "claude-sonnet-4-5-20241022"  # Production
```

## 12-Category System

MindStash classifies all input into exactly one of these categories:

| Category | Description | Example Input |
|----------|-------------|---------------|
| `read` | Articles, blogs, documentation | "Read this article about React hooks" |
| `watch` | Videos, courses, talks | "Watch this YouTube tutorial on FastAPI" |
| `ideas` | Business, product concepts | "App idea: AI-powered meal planner" |
| `tasks` | Todos, action items | "Call dentist tomorrow at 3pm" |
| `people` | Follow-ups, contacts | "Message John about the project" |
| `notes` | Reference info, quotes | "API rate limit is 100/hour" |
| `goals` | Long-term objectives | "Learn Spanish by end of year" |
| `buy` | Shopping, products | "Buy new wireless headphones" |
| `places` | Travel, locations | "Visit the new coffee shop downtown" |
| `journal` | Personal thoughts | "Feeling grateful for the team" |
| `learn` | Skills to acquire | "Learn Kubernetes this month" |
| `save` | General bookmarks | "Interesting website about design" |

## AI Intelligence Signals

Beyond categorization, the AI extracts rich metadata:

### Intent

| Value | Description |
|-------|-------------|
| `learn` | Content to absorb and understand |
| `task` | Something requiring action |
| `reminder` | Time-based follow-up |
| `idea` | Creative concept to explore |
| `reflection` | Personal insight or feeling |
| `reference` | Information for future lookup |

### Urgency

| Value | Description |
|-------|-------------|
| `high` | Needs immediate attention |
| `medium` | Should be addressed soon |
| `low` | No rush, handle when convenient |

### Time Context

| Value | Description |
|-------|-------------|
| `immediate` | Needs attention today |
| `next_week` | Best addressed this week |
| `someday` | No rush, when ready |
| `conditional` | When context matches |
| `date` | Has specific date |

### Resurface Strategy

| Value | Description |
|-------|-------------|
| `time_based` | Remind at specific time |
| `contextual` | Show when related to current activity |
| `weekly_review` | Include in weekly digest |
| `manual` | User decides when to see |

## System Prompt

The complete prompt sent to Claude:

```python
SYSTEM_PROMPT = """You are a smart content organizer for MindStash. Analyze user input and categorize into exactly ONE of these 12 categories:

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

CRITICAL: Respond with ONLY valid JSON, no additional text or explanation.

User input: {content}
URL: {url}

Return this exact JSON structure:
{{
  "category": "one of 12",
  "tags": ["tag1", "tag2"],
  "summary": "1-sentence description (max 100 chars)",
  "confidence": 0.95,
  "priority": "low|medium|high",
  "time_sensitivity": "immediate|this_week|review_weekly|reference",
  "reasoning": "brief explanation",
  "intent": "learn|task|reminder|idea|reflection|reference",
  "action_required": true|false,
  "urgency": "low|medium|high",
  "time_context": "immediate|next_week|someday|conditional|date",
  "resurface_strategy": "time_based|contextual|weekly_review|manual",
  "suggested_bucket": "Today|Learn Later|Ideas|Reminders|Insights",
  "notification_prediction": {{
    "should_notify": true|false,
    "notification_date": "relative date string",
    "frequency": "once|daily|weekly|monthly|never",
    "reasoning": "why this timing"
  }}
}}

Intent definitions:
- learn: Articles, videos, educational content to consume
- task: Action items, todos that need to be done
- reminder: Time-based follow-ups, things to remember
- idea: Creative concepts, business ideas to explore
- reflection: Personal thoughts, journal entries
- reference: Save for future lookup, bookmarks

Resurface strategy definitions:
- time_based: Show based on calendar/schedule
- contextual: Show when related to current activity
- weekly_review: Include in weekly digest
- manual: User decides when to see

NOTIFICATION PREDICTION RULES:
Analyze if this input needs a notification/reminder.

should_notify = true if:
- Time-specific events (Sunday, tomorrow, next week, deadline)
- Action items with implied timing
- Learning goals (suggest monthly check-ins)
- People follow-ups (suggest before the event)
- Tasks with due dates or deadlines

should_notify = false if:
- Pure reference information
- Completed thoughts/reflections
- General bookmarks without timing
- Journal entries

notification_date values (relative strings):
- "tomorrow_morning" - Tomorrow at 9 AM
- "tomorrow_evening" - Tomorrow at 6 PM
- "next_saturday_evening" - Coming Saturday at 6 PM
- "next_sunday_morning" - Coming Sunday at 9 AM
- "next_monday_morning" - Coming Monday at 9 AM
- "next_week" - 7 days from now at 9 AM
- "in_3_days" - 3 days from now at 9 AM
- "1_month_from_now" - 30 days from now at 9 AM
- "end_of_week" - This Friday at 5 PM

frequency values:
- "once" - One-time notification (events, deadlines)
- "daily" - Daily reminder (habits)
- "weekly" - Weekly check-in (goals, reviews)
- "monthly" - Monthly reminder (learning)
- "never" - No notification needed (reference)

Examples:
Input: "Call John for football on Sunday"
→ notification_date: "next_saturday_evening", frequency: "once"

Input: "Learn to solve Rubik's cube"
→ notification_date: "1_month_from_now", frequency: "monthly"

Input: "Buy groceries tomorrow"
→ notification_date: "tomorrow_morning", frequency: "once"

Input: "Interesting article about AI"
→ should_notify: false, frequency: "never"
"""
```

## Categorization Function

```python
def categorize_item(content: str, url: Optional[str] = None) -> dict:
    """
    Categorize content using AI.

    Args:
        content: User input text (max 500 chars)
        url: Optional URL extracted from content

    Returns:
        dict with all AI-generated fields
    """
    try:
        prompt = SYSTEM_PROMPT.format(
            content=content[:500],  # Enforce limit
            url=url or "None"
        )

        response = client.messages.create(
            model=CURRENT_MODEL,
            max_tokens=800,
            temperature=0.7,
            messages=[{
                "role": "user",
                "content": prompt
            }]
        )

        result_text = response.content[0].text

        # Clean markdown code blocks if present
        if "```json" in result_text:
            result_text = result_text.split("```json")[1].split("```")[0].strip()
        elif "```" in result_text:
            result_text = result_text.split("```")[1].split("```")[0].strip()

        result = json.loads(result_text)

        # Validate and set defaults
        if result.get("category") not in VALID_CATEGORIES:
            result["category"] = "save"

        # Parse notification date
        notification_prediction = result.get("notification_prediction", {})
        if notification_prediction.get("should_notify"):
            notification_date = parse_relative_date(
                notification_prediction.get("notification_date", "")
            )
            result["notification_date"] = notification_date
            result["next_notification_at"] = notification_date
            result["notification_frequency"] = notification_prediction.get("frequency", "never")
            result["should_notify"] = True
        else:
            result["notification_date"] = None
            result["next_notification_at"] = None
            result["notification_frequency"] = "never"
            result["should_notify"] = False

        return result

    except Exception as e:
        print(f"AI categorization failed: {e}")
        return _get_fallback_response(content, str(e))
```

## Date Parsing

Converting AI's relative dates to actual datetime objects:

```python
def parse_relative_date(relative_date: str) -> Optional[datetime]:
    """Convert relative date strings to datetime."""
    if not relative_date:
        return None

    now = datetime.utcnow()
    relative_date = relative_date.lower().strip()

    def next_weekday(weekday: int, hour: int = 9) -> datetime:
        """Get next occurrence of weekday (0=Monday, 6=Sunday)"""
        days_ahead = weekday - now.weekday()
        if days_ahead <= 0:
            days_ahead += 7
        return now.replace(hour=hour, minute=0, second=0, microsecond=0) + timedelta(days=days_ahead)

    # Parse patterns
    if relative_date in ["tomorrow_morning", "tomorrow"]:
        return (now + timedelta(days=1)).replace(hour=9, minute=0, second=0, microsecond=0)

    elif relative_date == "tomorrow_evening":
        return (now + timedelta(days=1)).replace(hour=18, minute=0, second=0, microsecond=0)

    elif relative_date == "next_saturday_evening":
        return next_weekday(5, 18)  # Saturday 6 PM

    elif relative_date in ["next_sunday_morning", "next_sunday"]:
        return next_weekday(6, 9)   # Sunday 9 AM

    elif relative_date in ["next_monday_morning", "next_monday"]:
        return next_weekday(0, 9)   # Monday 9 AM

    elif relative_date in ["next_week", "in_a_week"]:
        return (now + timedelta(days=7)).replace(hour=9, minute=0, second=0, microsecond=0)

    elif relative_date == "in_3_days":
        return (now + timedelta(days=3)).replace(hour=9, minute=0, second=0, microsecond=0)

    elif relative_date in ["1_month_from_now", "next_month"]:
        return (now + timedelta(days=30)).replace(hour=9, minute=0, second=0, microsecond=0)

    elif relative_date in ["end_of_week", "this_friday"]:
        days_until_friday = (4 - now.weekday()) % 7
        if days_until_friday == 0 and now.hour >= 17:
            days_until_friday = 7
        return (now + timedelta(days=days_until_friday)).replace(hour=17, minute=0, second=0, microsecond=0)

    # Dynamic patterns: in_X_days, X_weeks, X_months
    import re
    match = re.match(r"in_(\d+)_days?", relative_date)
    if match:
        days = int(match.group(1))
        return (now + timedelta(days=days)).replace(hour=9, minute=0, second=0, microsecond=0)

    return None
```

## Fallback Response

When AI fails, return safe defaults:

```python
def _get_fallback_response(content: str, error_reason: str) -> dict:
    return {
        "category": "save",
        "tags": [],
        "summary": content[:100],
        "confidence": 0.1,
        "priority": "medium",
        "time_sensitivity": "reference",
        "reasoning": error_reason,
        "intent": "reference",
        "action_required": False,
        "urgency": "low",
        "time_context": "someday",
        "resurface_strategy": "manual",
        "suggested_bucket": "Insights",
        "notification_date": None,
        "notification_frequency": "never",
        "next_notification_at": None,
        "should_notify": False,
    }
```

## Integration in Routes

```python
# In app/api/routes/items.py

@router.post("/", response_model=ItemResponse)
def create_item(item_data: ItemCreate, ...):
    # Create initial item
    new_item = Item(
        user_id=current_user.id,
        content=item_data.content,
        url=item_data.url
    )
    db.add(new_item)
    db.commit()

    # AI categorization
    try:
        ai_result = categorize_item(item_data.content, item_data.url)

        # Update with AI results
        new_item.category = ai_result.get("category", "save")
        new_item.tags = ai_result.get("tags", [])
        new_item.summary = ai_result.get("summary")
        new_item.confidence = ai_result.get("confidence", 0.5)
        new_item.intent = ai_result.get("intent", "reference")
        new_item.urgency = ai_result.get("urgency", "low")
        new_item.action_required = ai_result.get("action_required", False)
        new_item.notification_date = ai_result.get("notification_date")
        new_item.next_notification_at = ai_result.get("next_notification_at")
        new_item.notification_frequency = ai_result.get("notification_frequency", "never")

        # Sanitize ai_metadata (convert datetime to ISO strings)
        ai_metadata = {}
        for key, value in ai_result.items():
            if isinstance(value, datetime):
                ai_metadata[key] = value.isoformat()
            else:
                ai_metadata[key] = value
        new_item.ai_metadata = ai_metadata

        db.commit()
        db.refresh(new_item)

    except Exception as e:
        print(f"AI categorization failed: {e}")
        # Item still exists with basic data

    return new_item
```

## Cost Analysis

### Token Usage Per Request

| Component | Tokens |
|-----------|--------|
| System prompt | ~300 |
| User input (500 chars) | ~125 |
| Output response | ~200 |
| **Total** | **~625** |

### Cost Estimates

| Model | Cost per 1M tokens | Cost per item |
|-------|-------------------|---------------|
| Claude Haiku | $0.25 input / $1.25 output | ~$0.0004 |
| Claude Sonnet | $3 input / $15 output | ~$0.005 |

### Monthly Cost Projections

| Items/day | Haiku/month | Sonnet/month |
|-----------|-------------|--------------|
| 100 | $1.20 | $15 |
| 500 | $6 | $75 |
| 1000 | $12 | $150 |

## Rate Limiting

To control AI costs, item creation is rate-limited:

```python
@router.post("/")
@user_limiter.limit("30/hour")  # Max 30 items/hour per user
def create_item(...):
```

This limits:
- Per user: 30 items/hour = 720 items/day max
- Cost cap (Haiku): ~$0.29/day per active user

## Error Handling

### JSON Parsing Errors

```python
try:
    result = json.loads(result_text)
except json.JSONDecodeError as e:
    print(f"JSON parsing error: {e}")
    return _get_fallback_response(content, f"Parse error: {e}")
```

### Invalid Category

```python
if result.get("category") not in VALID_CATEGORIES:
    print(f"Invalid category: {result.get('category')}")
    result["category"] = "save"  # Default fallback
```

### API Errors

```python
except anthropic.APIError as e:
    print(f"Anthropic API error: {e}")
    return _get_fallback_response(content, f"API error: {e}")
```

## Testing AI Responses

```python
# Test categorization
from app.services.ai.categorizer import categorize_item

# Task example
result = categorize_item("Call John tomorrow about the meeting")
print(result["category"])  # "tasks" or "people"
print(result["action_required"])  # True
print(result["notification_date"])  # Tomorrow 9 AM

# Learning example
result = categorize_item("Learn Kubernetes for cloud deployment")
print(result["category"])  # "learn"
print(result["intent"])  # "learn"
print(result["notification_frequency"])  # "monthly"

# Reference example
result = categorize_item("API endpoint: https://api.example.com/v1")
print(result["category"])  # "notes" or "save"
print(result["should_notify"])  # False
```

## Best Practices

1. **500-char limit**: Keeps token costs predictable
2. **Fallback responses**: Always return valid data even if AI fails
3. **Rate limiting**: Prevents abuse and controls costs
4. **Sanitize metadata**: Convert datetime to ISO strings for JSONB
5. **Log AI responses**: Debug categorization issues
6. **Validate outputs**: Check category is in valid list
7. **Temperature 0.7**: Balance creativity and consistency

## Future Improvements

1. **Caching**: Cache responses for identical content
2. **Batch processing**: Categorize multiple items in one request
3. **Fine-tuning**: Train on user corrections
4. **Streaming**: Show categorization progress
5. **Multi-language**: Support non-English input
