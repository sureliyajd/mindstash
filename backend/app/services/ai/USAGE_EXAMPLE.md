# AI Categorizer Usage Example

This document shows how to use the `categorize_item` function in your API routes.

## Basic Usage

```python
from app.services.ai import categorize_item

# Example 1: Categorize text content
result = categorize_item("Read this article about FastAPI best practices")

print(result)
# {
#   "category": "read",
#   "tags": ["python", "fastapi", "programming"],
#   "summary": "Article about FastAPI best practices",
#   "confidence": 0.95,
#   "priority": "medium",
#   "time_sensitivity": "this_week",
#   "reasoning": "Content mentions reading an article"
# }

# Example 2: Categorize with URL
result = categorize_item(
    content="Check out this Python tutorial",
    url="https://youtube.com/watch?v=abc123"
)

print(result["category"])
# "watch"  (AI detects it's a video)
```

## Integration with API Routes

Here's how to use the categorizer in your items CRUD endpoint:

```python
# backend/app/api/routes/items.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.models.item import Item
from app.schemas.item import ItemCreate, ItemResponse
from app.services.ai import categorize_item  # Import categorizer

router = APIRouter()


@router.post("/", response_model=ItemResponse, status_code=status.HTTP_201_CREATED)
def create_item(
    item_data: ItemCreate,
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

    # 2. Categorize with AI
    try:
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

    except Exception as e:
        # If AI fails, item is still created but without categorization
        print(f"⚠️  AI categorization failed: {e}")
        # Item remains with category=None, which is acceptable

    return item
```

## Error Handling

The categorizer has built-in fallback behavior:

```python
# If API call fails or returns invalid data:
result = categorize_item("Some content")

# Always returns a valid dict with fallback values:
# {
#   "category": "save",  # Fallback category
#   "tags": [],
#   "summary": "Some content",
#   "confidence": 0.1,  # Low confidence indicates fallback
#   "priority": "medium",
#   "time_sensitivity": "reference",
#   "reasoning": "Error during categorization: [error message]"
# }
```

## Testing Without API Key

For unit tests, you can mock the categorizer:

```python
# backend/tests/test_items.py
from unittest.mock import patch

@patch('app.services.ai.categorizer.categorize_item')
def test_create_item(mock_categorize, client, auth_headers):
    # Mock AI response
    mock_categorize.return_value = {
        "category": "tasks",
        "tags": ["work", "urgent"],
        "summary": "Complete project deadline",
        "confidence": 0.92,
        "priority": "high",
        "time_sensitivity": "immediate",
        "reasoning": "Detected task with deadline"
    }

    response = client.post(
        "/api/items",
        json={"content": "Finish project by Friday"},
        headers=auth_headers
    )

    assert response.status_code == 201
    data = response.json()
    assert data["category"] == "tasks"
    assert data["priority"] == "high"
```

## Environment Setup

Add to your `.env` file:

```bash
# For development (AI/ML API - OpenAI compatible)
AIML_API_KEY=your-aiml-api-key-here

# For production (Anthropic Claude)
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

## Migration to Anthropic API

When ready to switch to production Anthropic API, follow the migration guide in `categorizer.py` (bottom of file). It's a simple 5-minute change affecting ~10 lines of code.

## Performance Considerations

- **Response time**: ~1-2 seconds per categorization
- **Token cost**: ~450 tokens per request (~$0.0015 with Claude Sonnet 4.5)
- **Rate limits**: Check your AI/ML API or Anthropic limits
- **Optimization**: Consider background tasks for production (FastAPI BackgroundTasks or Celery)

## Next Steps

1. Get your AI/ML API key from https://aimlapi.com/
2. Add it to `.env` as `AIML_API_KEY=your-key`
3. Test the categorizer with sample content
4. Implement items CRUD endpoints using the example above
5. Write tests with mocked AI responses
6. Deploy and monitor categorization accuracy
