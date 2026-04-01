"""
AI Categorization Service for MindStash 12-Category System

Using Anthropic Claude API for production-ready categorization
"""
import json
import logging
import re
from datetime import datetime, timedelta
from typing import Optional
from anthropic import Anthropic

from app.core.config import settings

logger = logging.getLogger(__name__)

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
VALID_NOTIFICATION_FREQUENCIES = ["once", "daily", "weekly", "monthly", "never"]

# Notification date resolution constants
PREFERRED_TIME_HOURS = {"morning": 9, "afternoon": 14, "evening": 18}
MAX_DAYS_FROM_NOW = 365
MIN_LEAD_MINUTES = 30

WEEKDAY_MAP = {
    "monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3,
    "friday": 4, "saturday": 5, "sunday": 6,
}
TIME_OF_DAY_MAP = {"morning": 9, "afternoon": 14, "evening": 18, "night": 20}

SYSTEM_PROMPT_TEMPLATE = """You are a smart content organizer for MindStash. Analyze user input and categorize into exactly ONE of these 12 categories:

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

Today's date is: {current_date}

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
    "days_from_now": integer_number_of_days,
    "preferred_time": "morning|afternoon|evening",
    "notification_date": "optional relative date string fallback",
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

PRIORITY, URGENCY, AND ACTION_REQUIRED RULES:

action_required = true ONLY when ALL of these are true:
- There is a concrete, specific action the user must take
- The action has a deadline, external dependency, or time constraint
- Failing to act would have a consequence

action_required = false for:
- Ideas, brainstorms, aspirational thoughts ("I want to...", "would be cool if...")
- Reference information, notes, quotes, facts
- Journal entries, reflections, personal thoughts
- Bookmarks, saved links, articles to read/watch
- Goals without deadlines
- Casual suggestions ("try this restaurant", "check out this tool")

priority guidelines:
- "high" = External deadline within 48 hours, OR someone else is waiting on you, OR financial/legal consequence
- "medium" = Has a deadline further out, OR is part of an active project
- "low" = DEFAULT. No deadline, no external dependency, personal interest, reference info, ideas, journal entries

urgency guidelines:
- "high" = Must act within 24-48 hours or there is a real consequence (missed meeting, expired offer, deadline)
- "medium" = Should act within a week, has some time pressure
- "low" = DEFAULT. No time pressure, no external deadline, personal aspiration, reference material

DEFAULT BIAS: When in doubt, choose LOW priority, LOW urgency, action_required = false.
Most items people save are reference material, ideas, or aspirational thoughts — not emergencies.

NOTIFICATION PREDICTION RULES:
Analyze if this input needs a notification/reminder.
Use today's date ({current_date}) to calculate the exact number of days from now.

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

days_from_now: Calculate the number of days from today to the notification date.
- 0 = today
- 1 = tomorrow
- Count the actual days using today's date
- For "next weekend", count days until that Saturday
- For "next to next weekend", count days until the Saturday after next

preferred_time: When the notification should fire.
- "morning" = 9 AM
- "afternoon" = 2 PM
- "evening" = 6 PM

notification_date: Optional fallback relative date string (e.g. "next_saturday_evening").
Only used if days_from_now is not provided.

frequency values (USE THE MOST CONSERVATIVE OPTION THAT FITS):
- "never" - DEFAULT for most items. Use for: reference, bookmarks, notes, journal, ideas without deadlines, aspirations, reflections, casual thoughts
- "once" - One-time events with a specific date/deadline (appointments, due dates, bills, meetings)
- "weekly" - MAXIMUM for goals, habits, recurring reviews. Goals and habits are NEVER daily
- "monthly" - Learning goals, long-term projects, quarterly reviews
- "daily" - ALMOST NEVER USE THIS. Only when user explicitly says "every day" or "daily" (e.g. "remind me to take medicine every day"). Habits and goals are NOT daily — use weekly

FREQUENCY DECISION TREE (follow in order):
1. Does it have a specific date/deadline? → "once"
2. Did the user explicitly say "every day" or "daily"? → "daily"
3. Is it a goal, habit, or recurring review? → "weekly"
4. Is it a learning goal or long-term project? → "monthly"
5. Everything else → "never"

Examples:
Input: "Call John for football on Sunday" (today is Wednesday)
→ days_from_now: 2, preferred_time: "evening", frequency: "once" (notify day before, Saturday evening)

Input: "Learn to solve Rubik's cube"
→ days_from_now: 30, preferred_time: "morning", frequency: "monthly"

Input: "Buy groceries tomorrow"
→ days_from_now: 1, preferred_time: "morning", frequency: "once"

Input: "Interesting article about AI"
→ should_notify: false, frequency: "never"

Input: "Review my goals weekly"
→ days_from_now: 5, preferred_time: "evening", frequency: "weekly" (next Friday)

Input: "Meeting with client next Monday"
→ days_from_now: 4, preferred_time: "evening", frequency: "once" (notify day before, Sunday evening)

Input: "Pay bills next to next weekend"
→ days_from_now: 12, preferred_time: "morning", frequency: "once" (count days to the Saturday after next)

CONSERVATIVE CLASSIFICATION EXAMPLES (pay close attention):

Input: "Start waking up at 6 AM consistently"
→ category: "goals", should_notify: true, frequency: "weekly", days_from_now: 7
  priority: "low", urgency: "low", action_required: false (aspiration, not a concrete task with a deadline)

Input: "Redis default port is 6379"
→ category: "notes", should_notify: false, frequency: "never"
  priority: "low", urgency: "low", action_required: false (pure reference information)

Input: "Remember the idea about auto-generated event badges"
→ category: "ideas", should_notify: false, frequency: "never"
  priority: "low", urgency: "low", action_required: false (idea capture, no action needed)

Input: "Save that Tailwind animation snippet"
→ category: "save", should_notify: false, frequency: "never"
  priority: "low", urgency: "low", action_required: false (bookmark for reference)

Input: "Sketch idea for a minimal bookmarking app"
→ category: "ideas", should_notify: false, frequency: "never"
  priority: "low", urgency: "low", action_required: false (idea exploration, no deadline)

Input: "Feeling productive after finishing the deployment today"
→ category: "journal", should_notify: false, frequency: "never"
  priority: "low", urgency: "low", action_required: false (personal reflection)

Input: "Try the coffee place Rahul mentioned near the station"
→ category: "places", should_notify: false, frequency: "never"
  priority: "low", urgency: "low", action_required: false (casual suggestion, no time pressure)

Input: "Remind me to take vitamins every day"
→ should_notify: true, frequency: "daily", days_from_now: 1
  priority: "medium", urgency: "low", action_required: true (user explicitly said "every day" — rare valid daily case)"""


# =============================================================================
# DATE PARSING UTILITIES
# =============================================================================


def parse_relative_date(relative_date: str) -> Optional[datetime]:
    """
    Convert relative date strings to actual datetime objects.

    Args:
        relative_date: String like "tomorrow_morning", "next_sunday_9am", etc.

    Returns:
        datetime object or None if parsing fails
    """
    if not relative_date:
        return None

    now = datetime.utcnow()
    relative_date = relative_date.lower().strip()

    # Helper to get next occurrence of a weekday
    def next_weekday(weekday: int, hour: int = 9) -> datetime:
        """Get next occurrence of weekday (0=Monday, 6=Sunday)"""
        days_ahead = weekday - now.weekday()
        if days_ahead < 0:  # Target day already happened this week
            days_ahead += 7
        if days_ahead == 0:
            # Same day: schedule today if the target hour hasn't passed, else next week
            target = now.replace(hour=hour, minute=0, second=0, microsecond=0)
            if target <= now:
                days_ahead = 7
        return now.replace(hour=hour, minute=0, second=0, microsecond=0) + timedelta(days=days_ahead)

    # Parse different formats
    if relative_date in ["tomorrow_morning", "tomorrow_9am", "tomorrow"]:
        return (now + timedelta(days=1)).replace(hour=9, minute=0, second=0, microsecond=0)

    elif relative_date in ["tomorrow_evening", "tomorrow_6pm"]:
        return (now + timedelta(days=1)).replace(hour=18, minute=0, second=0, microsecond=0)

    elif relative_date in ["next_saturday_evening", "saturday_evening"]:
        return next_weekday(5, 18)  # Saturday at 6 PM

    elif relative_date in ["next_sunday_morning", "sunday_morning", "next_sunday"]:
        return next_weekday(6, 9)  # Sunday at 9 AM

    elif relative_date in ["next_sunday_evening", "sunday_evening"]:
        return next_weekday(6, 18)  # Sunday at 6 PM

    elif relative_date in ["next_monday_morning", "monday_morning", "next_monday"]:
        return next_weekday(0, 9)  # Monday at 9 AM

    elif relative_date in ["next_tuesday_morning", "tuesday_morning", "next_tuesday"]:
        return next_weekday(1, 9)

    elif relative_date in ["next_wednesday_morning", "wednesday_morning", "next_wednesday"]:
        return next_weekday(2, 9)

    elif relative_date in ["next_thursday_morning", "thursday_morning", "next_thursday"]:
        return next_weekday(3, 9)

    elif relative_date in ["next_friday_morning", "friday_morning", "next_friday"]:
        return next_weekday(4, 9)

    elif relative_date in ["next_week", "in_a_week", "1_week"]:
        return (now + timedelta(days=7)).replace(hour=9, minute=0, second=0, microsecond=0)

    elif relative_date in ["in_3_days", "3_days"]:
        return (now + timedelta(days=3)).replace(hour=9, minute=0, second=0, microsecond=0)

    elif relative_date in ["1_month_from_now", "next_month", "in_a_month"]:
        return (now + timedelta(days=30)).replace(hour=9, minute=0, second=0, microsecond=0)

    elif relative_date in ["end_of_week", "this_friday", "friday_evening"]:
        # Get this Friday at 5 PM
        days_until_friday = (4 - now.weekday()) % 7
        if days_until_friday == 0 and now.hour >= 17:
            days_until_friday = 7
        return (now + timedelta(days=days_until_friday)).replace(hour=17, minute=0, second=0, microsecond=0)

    elif relative_date in ["today_evening", "this_evening"]:
        return now.replace(hour=18, minute=0, second=0, microsecond=0)

    elif relative_date in ["in_2_weeks", "2_weeks"]:
        return (now + timedelta(days=14)).replace(hour=9, minute=0, second=0, microsecond=0)

    # Try to parse patterns like "in_X_days"
    match = re.match(r"in_(\d+)_days?", relative_date)
    if match:
        days = int(match.group(1))
        return (now + timedelta(days=days)).replace(hour=9, minute=0, second=0, microsecond=0)

    # Try to parse patterns like "X_weeks"
    match = re.match(r"(\d+)_weeks?", relative_date)
    if match:
        weeks = int(match.group(1))
        return (now + timedelta(weeks=weeks)).replace(hour=9, minute=0, second=0, microsecond=0)

    # Try to parse patterns like "X_months"
    match = re.match(r"(\d+)_months?", relative_date)
    if match:
        months = int(match.group(1))
        return (now + timedelta(days=30 * months)).replace(hour=9, minute=0, second=0, microsecond=0)

    # Dynamic weekday + time-of-day matching as catch-all
    for day_name, day_num in WEEKDAY_MAP.items():
        if day_name in relative_date:
            hour = 9  # default morning
            for time_name, time_hour in TIME_OF_DAY_MAP.items():
                if time_name in relative_date:
                    hour = time_hour
                    break
            return next_weekday(day_num, hour)

    # If nothing matches, return None
    logger.warning("Could not parse relative date: %s", relative_date)
    return None


def _validate_notification_date(dt: datetime, content: str, frequency: str) -> datetime:
    """
    Post-processing guard: verify that the AI-resolved notification date
    actually matches what the user asked for. Covers three cases:

    1. weekly  — content mentions a weekday name → snap to that weekday
    2. once    — content mentions a weekday name → snap to that weekday
    3. monthly — content mentions a date number  → snap to that day-of-month
    """
    now = datetime.utcnow()
    content_lower = content.lower()

    # -----------------------------------------------------------------
    # Case 1 & 2: weekly / once — snap to the named weekday
    # -----------------------------------------------------------------
    if frequency in ("weekly", "once"):
        target_weekday = None
        matched_day = None
        for day_name, day_num in WEEKDAY_MAP.items():
            if day_name in content_lower:
                target_weekday = day_num
                matched_day = day_name
                break

        if target_weekday is not None and dt.weekday() != target_weekday:
            days_ahead = target_weekday - now.weekday()
            if days_ahead < 0:
                days_ahead += 7
            if days_ahead == 0:
                # Same day: schedule today if target hour hasn't passed
                target = now.replace(hour=dt.hour, minute=0, second=0, microsecond=0)
                if target <= now:
                    days_ahead = 7

            corrected = now.replace(
                hour=dt.hour, minute=0, second=0, microsecond=0
            ) + timedelta(days=days_ahead)

            if corrected <= now + timedelta(minutes=MIN_LEAD_MINUTES):
                corrected += timedelta(days=7)

            logger.info(
                "Weekday snap (%s): %s (%s) → %s (%s) for '%s'",
                frequency,
                dt.strftime("%A"), dt.isoformat(),
                corrected.strftime("%A"), corrected.isoformat(),
                matched_day,
            )
            return corrected

    # -----------------------------------------------------------------
    # Case 3: monthly — snap to the mentioned day-of-month
    # -----------------------------------------------------------------
    if frequency == "monthly":
        # Match ordinal or plain numbers: "1st", "15th", "the 3rd", "on 21"
        match = re.search(
            r'(?:the\s+)?(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(?:every|each)',
            content_lower,
        )
        if not match:
            # Also match "every month on 15" / "every month on the 1st"
            match = re.search(
                r'every\s+month\s+(?:on\s+)?(?:the\s+)?(\d{1,2})(?:st|nd|rd|th)?',
                content_lower,
            )
        if match:
            target_day = int(match.group(1))
            if 1 <= target_day <= 31 and dt.day != target_day:
                # Build corrected date in the same month, or next month if past
                try:
                    corrected = dt.replace(day=target_day)
                except ValueError:
                    # Day doesn't exist in this month (e.g., Feb 30) — skip
                    return dt

                if corrected <= now + timedelta(minutes=MIN_LEAD_MINUTES):
                    # Move to next month
                    if corrected.month == 12:
                        corrected = corrected.replace(year=corrected.year + 1, month=1)
                    else:
                        corrected = corrected.replace(month=corrected.month + 1)

                logger.info(
                    "Day-of-month snap (monthly): day %d → day %d, %s → %s",
                    dt.day, target_day,
                    dt.isoformat(), corrected.isoformat(),
                )
                return corrected

    return dt


def resolve_notification_date(prediction: dict) -> datetime:
    """
    Resolve a notification datetime from AI prediction using 3-tier fallback.

    Tier 1: days_from_now (int) + preferred_time (str) — new format
    Tier 2: notification_date (str) via parse_relative_date() — legacy fallback
    Tier 3: Tomorrow at 9 AM — last resort when should_notify=True

    Always returns a valid datetime. Never returns None.
    """
    now = datetime.utcnow()

    # --- Tier 1: days_from_now + preferred_time ---
    days_raw = prediction.get("days_from_now")
    if days_raw is not None:
        try:
            days = int(days_raw)
        except (ValueError, TypeError):
            days = None

        if days is not None:
            days = max(0, min(days, MAX_DAYS_FROM_NOW))

            preferred_time = str(prediction.get("preferred_time", "morning")).lower()
            hour = PREFERRED_TIME_HOURS.get(preferred_time, 9)

            result = (now + timedelta(days=days)).replace(
                hour=hour, minute=0, second=0, microsecond=0
            )

            # If result is in the past or less than MIN_LEAD_MINUTES from now, bump +1 day
            if result <= now + timedelta(minutes=MIN_LEAD_MINUTES):
                result += timedelta(days=1)

            logger.info(
                "Notification resolved via Tier 1 (days_from_now=%d, time=%s): %s",
                days, preferred_time, result.isoformat(),
            )
            return result

    # --- Tier 2: notification_date string via parse_relative_date() ---
    date_str = prediction.get("notification_date", "")
    if date_str:
        parsed = parse_relative_date(str(date_str))
        if parsed is not None:
            # Validate: if in the past, bump +1 day
            if parsed <= now + timedelta(minutes=MIN_LEAD_MINUTES):
                parsed += timedelta(days=1)
            logger.info(
                "Notification resolved via Tier 2 (notification_date='%s'): %s",
                date_str, parsed.isoformat(),
            )
            return parsed

    # --- Tier 3: Default to tomorrow 9 AM ---
    fallback = (now + timedelta(days=1)).replace(
        hour=9, minute=0, second=0, microsecond=0
    )
    logger.warning(
        "Notification resolved via Tier 3 (fallback tomorrow 9 AM): %s. "
        "Prediction was: %s",
        fallback.isoformat(), prediction,
    )
    return fallback


def build_system_prompt(content: str, url: Optional[str] = None) -> str:
    """Build the system prompt with current date injected."""
    now = datetime.utcnow()
    current_date = now.strftime("%A, %B %d, %Y")
    return SYSTEM_PROMPT_TEMPLATE.format(
        content=content[:500],
        url=url or "None",
        current_date=current_date,
    )


# =============================================================================
# CATEGORIZATION FUNCTION
# =============================================================================


def categorize_item(content: str, url: Optional[str] = None) -> dict:
    """
    Categorize content using AI (12-category system) with notification prediction.

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
            - notification_date: datetime or None
            - notification_frequency: "once", "daily", "weekly", "monthly", "never"
            - next_notification_at: datetime or None (same as notification_date initially)
            - should_notify: boolean

    Example:
        >>> result = categorize_item("Call friend for football on Sunday")
        >>> result["notification_date"]
        datetime(2024, 1, 6, 18, 0, 0)  # Saturday evening
        >>> result["notification_frequency"]
        "once"
    """
    try:
        # Prepare prompt with current date injected
        prompt = build_system_prompt(content, url)

        # =============================================================================
        # API CALL - Anthropic Claude API
        # =============================================================================
        response = client.messages.create(
            model=CURRENT_MODEL,
            max_tokens=800,
            temperature=0.3,
            messages=[{
                "role": "user",
                "content": prompt
            }]
        )

        # Extract response text
        result_text = response.content[0].text

        logger.info("Raw AI response: %s...", result_text[:300])

        # Clean response - extract JSON if wrapped in markdown code blocks
        if "```json" in result_text:
            result_text = result_text.split("```json")[1].split("```")[0].strip()
        elif "```" in result_text:
            result_text = result_text.split("```")[1].split("```")[0].strip()

        # Parse JSON response
        result = json.loads(result_text)

        # Validate category is one of 12
        if result.get("category") not in VALID_CATEGORIES:
            logger.warning("Invalid category '%s' returned, using fallback 'save'", result.get("category"))
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

        # =============================================================================
        # NOTIFICATION PREDICTION PROCESSING
        # =============================================================================
        notification_prediction = result.get("notification_prediction", {})

        should_notify = notification_prediction.get("should_notify", False)
        notification_frequency = notification_prediction.get("frequency", "never")

        # Validate notification frequency
        if notification_frequency not in VALID_NOTIFICATION_FREQUENCIES:
            notification_frequency = "never"

        # Resolve notification date using 3-tier fallback
        notification_date = None
        next_notification_at = None

        if should_notify:
            notification_date = resolve_notification_date(notification_prediction)
            # Validate the resolved date matches what the user actually asked for
            notification_date = _validate_notification_date(
                notification_date, content, notification_frequency
            )
            next_notification_at = notification_date
            logger.info(
                "Notification scheduled: %s (%s)",
                notification_date.isoformat(), notification_frequency,
            )

        # If should_notify is false, ensure no notifications
        if not should_notify:
            notification_frequency = "never"

        # Add notification fields to result
        result["notification_date"] = notification_date
        result["notification_frequency"] = notification_frequency
        result["next_notification_at"] = next_notification_at
        result["should_notify"] = should_notify
        result["notification_reasoning"] = notification_prediction.get("reasoning", "")

        return result

    except json.JSONDecodeError as e:
        logger.error("JSON parsing error: %s", e)
        logger.error("Response was: %s", result_text if 'result_text' in locals() else 'No response')
        return _get_fallback_response(content, f"Error parsing AI response: {str(e)}")

    except Exception as e:
        logger.error("Categorization error: %s", e)
        return _get_fallback_response(content, f"Error during categorization: {str(e)}")


def _get_fallback_response(content: str, error_reason: str) -> dict:
    """Return a fallback response when AI categorization fails."""
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
        "notification_reasoning": ""
    }
