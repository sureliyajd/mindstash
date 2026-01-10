"""
AI Categorization Service for MindStash 12-Category System

Using Anthropic Claude API for production-ready categorization
"""
import json
from typing import Optional
from anthropic import Anthropic

from app.core.config import settings

# =============================================================================
# API CLIENT SETUP
# =============================================================================

client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)

# Using Claude 3.5 Haiku for cost-effective development
# For production, consider: "claude-sonnet-4-5-20241022"
CURRENT_MODEL = "claude-haiku-4-5-20251001"

# =============================================================================
# CONSTANTS
# =============================================================================

# MindStash 12 Categories
VALID_CATEGORIES = [
    "read",     # 📚 Articles, blogs, documentation
    "watch",    # 🎥 Videos, courses, talks
    "ideas",    # 💡 Business, product concepts
    "tasks",    # ✅ Todos, action items
    "people",   # 👤 Follow-ups, contacts
    "notes",    # 📝 Reference info, quotes
    "goals",    # 🎯 Long-term objectives
    "buy",      # 🛒 Shopping, products
    "places",   # 📍 Travel, locations
    "journal",  # 💭 Personal thoughts
    "learn",    # 🎓 Skills, courses
    "save"      # 🔖 General bookmarks
]

# AI Intelligence Signal Enum Values
VALID_INTENTS = ["learn", "task", "reminder", "idea", "reflection", "reference"]
VALID_URGENCIES = ["low", "medium", "high"]
VALID_TIME_CONTEXTS = ["immediate", "next_week", "someday", "conditional", "date"]
VALID_RESURFACE_STRATEGIES = ["time_based", "contextual", "weekly_review", "manual"]
VALID_BUCKETS = ["Today", "Learn Later", "Ideas", "Reminders", "Insights"]

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
  "suggested_bucket": "Today|Learn Later|Ideas|Reminders|Insights"
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
- manual: User decides when to see"""

# =============================================================================
# CATEGORIZATION FUNCTION
# =============================================================================


def categorize_item(content: str, url: Optional[str] = None) -> dict:
    """
    Categorize content using AI (12-category system)

    Args:
        content: User input text (max 500 characters)
        url: Optional URL extracted from content

    Returns:
        dict with:
            - category: One of 12 valid categories
            - tags: List of relevant tags
            - summary: Brief 1-sentence description
            - confidence: AI confidence score 0.0-1.0
            - priority: "low", "medium", or "high"
            - time_sensitivity: "immediate", "this_week", "review_weekly", or "reference"
            - reasoning: Brief explanation of categorization

    Example:
        >>> result = categorize_item("Read article about Python FastAPI")
        >>> result["category"]
        "read"
        >>> result["tags"]
        ["python", "fastapi", "programming"]
    """
    try:
        # Prepare prompt
        prompt = SYSTEM_PROMPT.format(
            content=content[:500],  # Enforce 500-char limit
            url=url or "None"
        )

        # =============================================================================
        # API CALL - Anthropic Claude API
        # =============================================================================
        response = client.messages.create(
            model=CURRENT_MODEL,
            max_tokens=500,
            temperature=0.7,
            messages=[{
                "role": "user",
                "content": prompt
            }]
        )

        # Extract response text
        result_text = response.content[0].text

        # Debug: Print raw response
        print(f"🔍 Raw AI response: {result_text[:200]}...")

        # Clean response - extract JSON if wrapped in markdown code blocks
        if "```json" in result_text:
            result_text = result_text.split("```json")[1].split("```")[0].strip()
        elif "```" in result_text:
            result_text = result_text.split("```")[1].split("```")[0].strip()

        # Parse JSON response
        result = json.loads(result_text)

        # Validate category is one of 12
        if result.get("category") not in VALID_CATEGORIES:
            print(f"⚠️  Invalid category '{result.get('category')}' returned, using fallback 'save'")
            result["category"] = "save"

        # Validate confidence is between 0 and 1
        confidence = result.get("confidence", 0.5)
        if not isinstance(confidence, (int, float)) or confidence < 0 or confidence > 1:
            result["confidence"] = 0.5

        # Ensure all required fields exist
        result.setdefault("tags", [])
        result.setdefault("summary", content[:100])
        result.setdefault("priority", "medium")
        result.setdefault("time_sensitivity", "reference")
        result.setdefault("reasoning", "Automated categorization")

        # Validate and set AI intelligence signal fields
        if result.get("intent") not in VALID_INTENTS:
            result["intent"] = "reference"
        if not isinstance(result.get("action_required"), bool):
            result["action_required"] = False
        if result.get("urgency") not in VALID_URGENCIES:
            result["urgency"] = "low"
        if result.get("time_context") not in VALID_TIME_CONTEXTS:
            result["time_context"] = "someday"
        if result.get("resurface_strategy") not in VALID_RESURFACE_STRATEGIES:
            result["resurface_strategy"] = "manual"
        if result.get("suggested_bucket") not in VALID_BUCKETS:
            result["suggested_bucket"] = "Insights"

        return result

    except json.JSONDecodeError as e:
        print(f"❌ JSON parsing error: {e}")
        print(f"❌ Response was: {result_text if 'result_text' in locals() else 'No response'}")
        # Fallback response
        return {
            "category": "save",
            "tags": [],
            "summary": content[:100],
            "confidence": 0.3,
            "priority": "medium",
            "time_sensitivity": "reference",
            "reasoning": f"Error parsing AI response: {str(e)}",
            "intent": "reference",
            "action_required": False,
            "urgency": "low",
            "time_context": "someday",
            "resurface_strategy": "manual",
            "suggested_bucket": "Insights"
        }

    except Exception as e:
        print(f"❌ Categorization error: {e}")
        # Fallback response
        return {
            "category": "save",
            "tags": [],
            "summary": content[:100],
            "confidence": 0.1,
            "priority": "medium",
            "time_sensitivity": "reference",
            "reasoning": f"Error during categorization: {str(e)}",
            "intent": "reference",
            "action_required": False,
            "urgency": "low",
            "time_context": "someday",
            "resurface_strategy": "manual",
            "suggested_bucket": "Insights"
        }
