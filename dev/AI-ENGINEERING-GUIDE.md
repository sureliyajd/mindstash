# MindStash AI Engineering — How Everything Actually Works

> A complete walkthrough of every AI/agentic system in MindStash.
> Written for understanding implementation flow, not just file structure.
> **Last updated: March 7, 2026** — Major updates for RAG, memory, parallel tools, HITL, Telegram

---

## Table of Contents

1. [The Two AI Brains](#1-the-two-ai-brains)
2. [Brain #1: The Categorizer](#2-brain-1-the-categorizer)
3. [Brain #2: The Chat Agent](#3-brain-2-the-chat-agent)
4. [The Tool System](#4-the-tool-system)
5. [SSE Streaming Protocol](#5-sse-streaming-protocol)
6. [Frontend SSE Consumption](#6-frontend-sse-consumption)
7. [Memory & Sessions](#7-memory--sessions)
8. [Daily Briefing Flow](#8-daily-briefing-flow)
9. [Notifications & Digest](#9-notifications--digest)
10. [Smart Resurfacing ("Today" Module)](#10-smart-resurfacing-today-module)
11. [The Cache Invalidation Bridge](#11-the-cache-invalidation-bridge)
12. [RAG & Semantic Search (pgvector)](#12-rag--semantic-search-pgvector) 🆕
13. [Long-term Memory System](#13-long-term-memory-system) 🆕
14. [Parallel Tool Execution](#14-parallel-tool-execution) 🆕
15. [Human-in-the-Loop Confirmations](#15-human-in-the-loop-confirmations) 🆕
16. [Dynamic Tool Selection](#16-dynamic-tool-selection) 🆕
17. [Telegram Integration](#17-telegram-integration) 🆕
18. [Architecture Diagram](#18-architecture-diagram)
19. [Key Engineering Decisions](#19-key-engineering-decisions)

---

## 1. The Two AI Brains

MindStash has **two separate AI systems** that do completely different jobs:

```
Brain #1: CATEGORIZER                    Brain #2: CHAT AGENT
─────────────────────────               ─────────────────────────
When: Every time user saves a thought   When: User chats in the chat panel
API:  AI/ML API (OpenAI-compatible)     API:  Anthropic Claude directly
Model: claude-haiku-4-5-20251001        Model: claude-haiku-4-5-20251001
Job:  Single call → classify content    Job:  Multi-turn loop with tools
File: services/ai/categorizer.py        File: services/ai/agent.py
```

**Why two separate systems?**
- The categorizer needs to run on every item creation (high volume, needs to be cheap)
- The chat agent needs tool calling + conversation memory (complex, less frequent)
- They use different API providers (AIML_API_KEY vs ANTHROPIC_API_KEY)

**Two entry points for item creation:**
Items can be created either via the dashboard's CaptureInput (REST API → `items.py`) or by asking the chat agent ("save this thought"). Both paths call the same `categorize_item()` function from `categorizer.py`.

```
Dashboard CaptureInput → POST /api/items/ → items.py:create_item() → categorize_item()
                                                                           ↑
Chat Agent → "save xyz" → agent.py → handle_create_item() ───────────────┘
```

---

## 2. Brain #1: The Categorizer

**File:** `backend/app/services/ai/categorizer.py`

### What It Does

Takes raw text (max 500 chars) + optional URL → sends to Claude → gets back 20+ fields of metadata.

### The Flow (Step by Step)

```
User types: "Call John about the football match on Sunday"
                    │
                    ▼
        ┌─────────────────────┐
Step 1  │  build_system_prompt │  Injects today's date, content, URL into
        │  (content, url)      │  the SYSTEM_PROMPT_TEMPLATE (120 lines of
        └──────────┬──────────┘  prompt engineering)
                   │
                   ▼
        ┌─────────────────────┐
Step 2  │  Claude API Call     │  model: claude-haiku-4-5-20251001
        │  max_tokens: 800     │  temperature: 0.7
        │  (single call, no    │  The prompt asks for structured JSON
        │   tool calling)      │  with 20+ fields
        └──────────┬──────────┘
                   │
                   ▼
        ┌─────────────────────┐
Step 3  │  Parse JSON response │  Strips markdown fences if present
        │  json.loads(text)    │  NO retry on failure (see Gap A13)
        └──────────┬──────────┘
                   │
                   ▼
        ┌─────────────────────┐
Step 4  │  Validate every      │  Each field checked against allowed values
        │  field individually  │  Invalid → fallback default
        └──────────┬──────────┘
                   │
                   ▼
        ┌─────────────────────┐
Step 5  │  Notification Date   │  3-tier resolution:
        │  Resolution          │    Tier 1: days_from_now + preferred_time
        └──────────┬──────────┘    Tier 2: parse_relative_date() (25+ patterns)
                   │               Tier 3: fallback → tomorrow 9 AM
                   ▼
           Return dict with:
           category, tags, summary, confidence,
           priority, intent, urgency, action_required,
           time_context, resurface_strategy, suggested_bucket,
           notification_date, notification_frequency, etc.
```

### What Claude Returns (Example)

For "Call John about the football match on Sunday":

```json
{
  "category": "people",
  "tags": ["follow-up", "sports", "weekend"],
  "summary": "Call John about football match",
  "confidence": 0.92,
  "priority": "medium",
  "time_sensitivity": "this_week",
  "reasoning": "Involves contacting a person about a time-sensitive event",

  "intent": "reminder",
  "action_required": true,
  "urgency": "high",
  "time_context": "immediate",
  "resurface_strategy": "time_based",
  "suggested_bucket": "Today",

  "notification_prediction": {
    "should_notify": true,
    "notification_date": "next_saturday_evening",
    "days_from_now": 5,
    "preferred_time": "evening",
    "notification_frequency": "once",
    "reasoning": "Remind the day before the match"
  }
}
```

### Notification Date Resolution — The 3-Tier Fallback

This is the most complex parsing logic in the codebase. The AI returns human-like date descriptions, and the code must convert them to actual datetimes.

```python
# resolve_notification_date() in categorizer.py (lines 304-367)

# TIER 1: days_from_now + preferred_time
# AI says: days_from_now=5, preferred_time="evening"
# Result:  now + 5 days, set hour to 18:00

# TIER 2: parse_relative_date() — handles ~25 string patterns
# "tomorrow_morning"       → tomorrow 9:00
# "next_saturday_evening"  → next Saturday 18:00
# "in_3_days"              → now + 3 days
# "end_of_week"            → Friday 17:00
# "2_weeks"                → now + 14 days

# TIER 3: Fallback
# If both tiers fail → tomorrow at 9:00 AM UTC
```

### If Categorization Fails

`_get_fallback_response()` returns safe defaults:
- category: `"save"` (catch-all)
- confidence: `0.1` (signals low trust)
- notifications disabled
- All intelligence signals set to neutral values

The item still gets created — it just has no AI metadata until re-categorized.

---

## 3. Brain #2: The Chat Agent

**File:** `backend/app/services/ai/agent.py`

### What It Does

Runs a **ReAct loop** (Reason → Act → Observe → repeat) where Claude can call tools to interact with the user's data. Streams results back via SSE.

### The ReAct Loop (Step by Step)

```
User sends: "What ideas did I save about AI?"
                    │
                    ▼
            ┌───────────────┐
   Step 1   │ Get/Create     │  If session_id provided → load session
            │ Session        │  Otherwise → create new session
            └───────┬───────┘  Set title = first 100 chars of message
                    │
                    ▼
            ┌───────────────┐
   Step 2   │ Save User      │  _save_message(db, session_id, "user", content=message)
            │ Message to DB  │
            └───────┬───────┘
                    │
                    ▼
            ┌───────────────┐
   Step 3   │ Load History   │  _load_messages() → last 50 messages from DB
            │ + Convert      │  _db_messages_to_anthropic() → Anthropic API format
            └───────┬───────┘
                    │
                    ▼
            ┌───────────────┐
   Step 4   │ Get Tool       │  registry.get_schemas(agent_type="assistant")
            │ Schemas        │  Returns 9 tool definitions as JSON
            └───────┬───────┘
                    │
                    ▼
    ┌═══════════════════════════════════════════┐
    ║         AGENT LOOP (max 10 iterations)    ║
    ║                                           ║
    ║   ┌───────────────┐                       ║
    ║   │ Claude API     │  Non-streaming call   ║
    ║   │ Call           │  Model: haiku-4-5     ║
    ║   │                │  max_tokens: 2048     ║
    ║   │                │  System prompt +      ║
    ║   │                │  tool schemas +       ║
    ║   │                │  full message history ║
    ║   └───────┬───────┘                       ║
    ║           │                               ║
    ║           ▼                               ║
    ║   Claude responds with:                   ║
    ║   - Text blocks (reasoning/response)      ║
    ║   - Tool_use blocks (which tools to call) ║
    ║           │                               ║
    ║           ▼                               ║
    ║   ┌─── If no tool_use blocks ───┐         ║
    ║   │   Yield text_delta          │         ║
    ║   │   BREAK the loop ──────────────── EXIT║
    ║   └─────────────────────────────┘         ║
    ║           │                               ║
    ║   ┌─── If tool_use blocks ──────┐         ║
    ║   │   Yield text_delta (if any) │         ║
    ║   │                             │         ║
    ║   │   For EACH tool_use block:  │         ║
    ║   │     Yield tool_start event  │         ║
    ║   │     Execute via registry    │         ║
    ║   │     Yield tool_result event │         ║
    ║   │                             │         ║
    ║   │   Save tool results to DB   │         ║
    ║   │   Append to api_messages    │         ║
    ║   │   CONTINUE loop ────────────────┐     ║
    ║   └─────────────────────────────┘   │     ║
    ║                                     │     ║
    ║           ┌─────────────────────────┘     ║
    ║           │ (next iteration)              ║
    ║           └───► Claude API Call again     ║
    ║                                           ║
    ╚═══════════════════════════════════════════╝
                    │
                    ▼
            Yield "done" event
```

### A Concrete Example: Multi-Tool Iteration

```
User: "How many items do I have and what's urgent?"

ITERATION 1:
  Claude thinks: "I need counts AND urgent items"
  Claude returns:
    - text: "" (no text yet)
    - tool_use: [get_counts]          ← calls ONE tool

  → SSE: tool_start {tool: "get_counts", message: "Getting overview..."}
  → Execute: handle_get_counts(db, user_id, {})
  → Returns: {all: 47, today: 5, tasks: 12, ...}
  → SSE: tool_result {tool: "get_counts", success: true, mutated: false}

  Tool results appended to api_messages

ITERATION 2:
  Claude sees: counts data. Thinks: "Now I need urgent items"
  Claude returns:
    - text: "" (no text yet)
    - tool_use: [search_items with urgency="high"]

  → SSE: tool_start {tool: "search_items", message: "Searching your items..."}
  → Execute: handle_search_items(db, user_id, {urgency: "high"})
  → Returns: {items: [{content: "Tax docs by Friday", ...}, ...], total: 3}
  → SSE: tool_result {tool: "search_items", success: true, mutated: false}

ITERATION 3:
  Claude sees: both counts AND search results. Now it has everything.
  Claude returns:
    - text: "You have 47 items total. Here are your 3 urgent items: ..."
    - tool_use: [] (no more tools needed)

  → SSE: text_delta {text: "You have 47 items total..."}
  → stop_reason: "end_turn" → BREAK loop
  → SSE: done {}
```

**Key insight:** Claude decides on its own which tools to call and when to stop. The code doesn't hardcode any logic like "if user asks about counts, call get_counts." Claude reads the tool schemas and the user's message, then reasons about what it needs.

### The System Prompt

`agent.py` lines 33-62 — this is what gives the agent its personality and instructions:

```
You are MindStash Assistant, an AI helper for a personal
knowledge management app...

Guidelines:
- Be concise and helpful
- Always use tools to access user data — never guess or fabricate
- When users ask "how many items", use get_counts tool
- When users want to find something, use search_items
...

Daily Briefing:
When the user's message is exactly "[BRIEFING]", generate a
warm, personalized daily briefing...
```

---

## 4. The Tool System

### How Tools Get Registered

Three files work together:

```
tool_registry.py          agent_tools.py              agent.py
────────────────          ──────────────              ────────
ToolRegistry class        9 tool definitions          import agent_tools (line 21)
  .register()        ──►  register_all_tools()   ──►  (triggers registration)
  .get_schemas()          called on module import     registry.get_schemas()
  .execute()                                          registry.execute()
```

**Registration happens at import time.** When `agent.py` imports `agent_tools` on line 21, Python executes the module, which calls `register_all_tools()` on the last line, which loops through all 9 tools and registers each with the global `registry` singleton.

### Tool Anatomy

Every tool has three parts:

```python
# 1. SCHEMA — What Claude sees (JSON Schema for tool definition)
SEARCH_ITEMS_SCHEMA = {
    "name": "search_items",
    "description": "Search the user's saved items...",
    "input_schema": {
        "type": "object",
        "properties": {
            "search": {"type": "string", "description": "Search query..."},
            "module": {"type": "string", "enum": ["all", "today", ...]},
            ...
        },
        "required": []
    }
}

# 2. HANDLER — What actually executes (receives db, user_id, tool_input)
def handle_search_items(db, user_id, tool_input):
    search = tool_input.get("search", "")
    module = tool_input.get("module", "all")
    # ... query database ...
    return {"items": [...], "total": 5}

# 3. REGISTRATION — Connects schema to handler
registry.register("search_items", SEARCH_ITEMS_SCHEMA, handle_search_items)
```

### All 9 Tools

| Tool | Handler | Mutating? | What It Does |
|------|---------|-----------|--------------|
| `search_items` | `handle_search_items` | No | Full-text search + module/category/urgency/tag filters + pagination |
| `create_item` | `handle_create_item` | **Yes** | Creates item in DB → calls `categorize_item()` → returns with AI metadata |
| `update_item` | `handle_update_item` | **Yes** | Updates content, category, tags, priority, or urgency |
| `delete_item` | `handle_delete_item` | **Yes** | Permanently deletes an item (no confirmation — see Gap A8) |
| `mark_complete` | `handle_mark_complete` | **Yes** | Toggles completion; disables recurring notifications when completing |
| `get_counts` | `handle_get_counts` | No | Returns module-level counts (all, today, tasks, read_later, ideas, insights, reminders) |
| `get_upcoming_notifications` | `handle_get_upcoming_notifications` | No | Items with notifications in next N days |
| `get_digest_preview` | `handle_get_digest_preview` | No | Weekly stats: urgent items, pending tasks, completion rate |
| `generate_daily_briefing` | `handle_generate_daily_briefing` | No | Combines counts + digest + 3-day notifications into one payload |

### Multi-Agent Foundation (agent_type)

Every tool is registered with `agent_types=["assistant"]` (the default). The `ToolRegistry.get_schemas()` filters by agent type:

```python
def get_schemas(self, agent_type="assistant"):
    return [t["schema"] for t in self._tools.values()
            if agent_type in t["agent_types"]]
```

`ChatSession` has an `agent_type` column (defaults to `"assistant"`). This means you can create a future "analyst" agent type that sees only read-only tools (no create/delete), just by registering tools with `agent_types=["analyst"]` and creating sessions with `agent_type="analyst"`.

**This is scaffolded but not yet used** — all sessions currently use `"assistant"`.

---

## 5. SSE Streaming Protocol

### What SSE Is

Server-Sent Events (SSE) is a one-way streaming protocol over HTTP. The server sends events line by line, and the client reads them as they arrive. Format:

```
event: event_type\n
data: {"json": "payload"}\n
\n
```

### MindStash SSE Events (6 Types)

```
┌─────── Connection opens ──────────────────────────────────────┐
│                                                               │
│  event: session_id                                            │
│  data: {"session_id": "uuid-here"}                            │
│  ← Always first. Tells frontend which session to persist.     │
│                                                               │
│  event: text_delta                                            │
│  data: {"text": "I found 5 items about AI..."}                │
│  ← Full text from one iteration (NOT token-by-token).         │
│  ← May appear multiple times if agent loops.                  │
│                                                               │
│  event: tool_start                                            │
│  data: {"tool": "search_items",                               │
│         "message": "Searching your items..."}                 │
│  ← UI shows loading indicator with friendly message.          │
│                                                               │
│  event: tool_result                                           │
│  data: {"tool": "search_items",                               │
│         "success": true,                                      │
│         "mutated": false}                                     │
│  ← UI updates tool indicator to ✓.                            │
│  ← If mutated=true, frontend invalidates item cache.          │
│                                                               │
│  event: error                                                 │
│  data: {"message": "AI service error: ..."}                   │
│  ← Only on failure.                                           │
│                                                               │
│  event: done                                                  │
│  data: {}                                                     │
│  ← Always last. Stream complete.                              │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

### Why NOT Token-by-Token Streaming?

The agent uses `client.messages.create()` (synchronous, non-streaming) instead of `client.messages.stream()`. This is a deliberate choice:

**The trade-off:**
- **Token-by-token streaming** → user sees text appear character by character (like ChatGPT) → smoother UX
- **Full-response per iteration** → simpler tool-calling loop, because you need the full response to know if Claude wants to call tools

The current approach yields text in **chunks per iteration**. If the agent does 3 iterations (tool call, tool call, final text), the user sees the final text appear all at once after the tools finish. The tool_start/tool_result events keep the UI alive during tool execution.

---

## 6. Frontend SSE Consumption

### Why Not EventSource?

The browser's built-in `EventSource` API only supports GET requests with no custom headers. MindStash needs:
- POST request (sending message body)
- Authorization header (JWT token)

So it uses **raw `fetch` + `ReadableStream` reader** instead.

### The Frontend Flow

**File:** `frontend/src/lib/hooks/useChat.ts`

```
sendMessage("What ideas about AI?")
        │
        ▼
  ┌─────────────────────┐
  │ fetch POST /api/chat │  With Authorization: Bearer {token}
  │ body: {message, sid} │  Returns ReadableStream (not JSON!)
  └──────────┬──────────┘
             │
             ▼
  ┌─────────────────────┐
  │ parseSSEStream()     │  Reads chunks, splits by newlines,
  │                      │  parses "event:" and "data:" lines
  └──────────┬──────────┘
             │
     For each event:
             │
     ┌───────┼───────────────────────────────────┐
     │       │       │        │        │          │
  session_id  text   tool    tool    error      done
     │       delta   start   result    │          │
     │       │       │        │        │          │
     ▼       ▼       ▼        ▼        ▼          ▼
  Save to  Append  Add to   Update  Set error  Mark
  localStorage  to msg  toolCalls status  message  streaming
  + ref    content  array   to done         =false
```

**Key detail — text_delta is APPENDED:**

```typescript
// Line ~177 in useChat.ts
case 'text_delta':
    // APPEND, not replace — handles multi-iteration responses
    assistantMsg.content += parsed.text;
```

If the agent loops 3 times and produces text on iterations 1 and 3, both text chunks get concatenated into one message.

**Key detail — mutation triggers React Query invalidation:**

```typescript
// Lines ~248-250 in useChat.ts
if (hasMutated) {
    queryClient.invalidateQueries({ queryKey: ['items'] });
    queryClient.invalidateQueries({ queryKey: ['item-counts'] });
}
```

When the chat agent creates, updates, or deletes an item, the dashboard's item list automatically refreshes without a page reload. This is the **bridge between the chat panel and the dashboard**.

### ChatPanel.tsx — The UI

**File:** `frontend/src/components/ChatPanel.tsx`

- Floating button (bottom-right) opens a slide-in panel
- On desktop: 400px sidebar. On mobile: full-screen overlay
- Each tool call shows a teal pill with icon + status (spinning → checkmark)
- Assistant messages render through `react-markdown` with custom styling
- `[BRIEFING]` user messages are filtered from display (line 334)
- Briefing responses get a special header badge with Sparkles icon
- 4 suggestion buttons shown on empty state (welcome screen)

---

## 7. Memory & Sessions

### How Conversation Memory Works

**File:** `backend/app/models/chat.py`

Three DB tables:

```
chat_sessions                chat_messages              user_memories
──────────────               ──────────────             ──────────────
id (UUID PK)                 id (UUID PK)               id (UUID PK)
user_id (FK→users)           session_id (FK→sessions)   user_id (FK→users)
title (auto from 1st msg)    role (user|assistant|       memory_type
agent_type ("assistant")          tool_result)           content
is_active                    content (nullable)          confidence
last_active_at               tool_calls (JSONB)          source
created_at                   tool_results (JSONB)        is_active
                             created_at                  ← NOT YET USED
```

### Three Message Roles in DB

```
role="user"         → content: "What ideas about AI?"    tool_calls: null
role="assistant"    → content: "I found..."              tool_calls: [{id, name, input}]
role="tool_result"  → content: null                      tool_results: [{tool_use_id, content}]
```

### DB → Anthropic API Format Conversion

Anthropic's API has a specific requirement: **tool results must be sent as `role: "user"` messages**, not a separate role. The conversion function handles this:

```
DB format:                          Anthropic API format:
─────────                           ────────────────────
role="user"                    →    {"role": "user", "content": "text"}

role="assistant"               →    {"role": "assistant", "content": [
  content="some text"                 {"type": "text", "text": "some text"},
  tool_calls=[{id, name, input}]      {"type": "tool_use", "id": ..., "name": ..., "input": ...}
                                    ]}

role="tool_result"             →    {"role": "user", "content": [        ← NOTE: role="user" !
  tool_results=[{tool_use_id,          {"type": "tool_result",
                 content}]               "tool_use_id": ..., "content": ...}
                                    ]}
```

### Session Restoration on Frontend Reload

```
Page loads → useChat hook mounts
        │
        ▼
  Check localStorage for "mindstash_chat_session"
        │
  ┌─── Found? ──────────────────────── Not found? ────┐
  │                                                     │
  ▼                                                     ▼
  Fetch messages for that session         Fetch most recent session
  via GET /sessions/{id}/messages         via GET /sessions?limit=1
        │                                         │
        └──────────────┬──────────────────────────┘
                       │
                       ▼
              Convert API messages to
              frontend ChatMessage objects
              (skip tool_result messages —
               only show user + assistant)
```

### UserMemory (Scaffolded, Not Used)

The `UserMemory` model exists with fields for `memory_type` (preference/pattern/fact/instruction), `confidence` (0-1), `source` (observed/user_stated/inferred), and `is_active`.

**What it's designed for (future A2 implementation):**
- After each session: Claude extracts preference statements ("user prefers tasks grouped by urgency")
- Written to `user_memories` table
- On next session start: active memories loaded → injected into system prompt
- Agent becomes personalised across sessions

**Current state:** The table has rows for nothing. No code reads from or writes to it.

---

## 8. Daily Briefing Flow

This is a cross-cutting feature that touches frontend, agent, and tools.

### The Complete Flow

```
                    FRONTEND                                BACKEND
                    ────────                                ───────

Page loads
    │
    ▼
useChat mounts → restores session history
    │
    ▼
useEffect fires (500ms delay)
    │
    ▼
sendBriefingRequest()
    │
    ├── Check localStorage: "mindstash_last_briefing"
    │   If equals today's date → RETURN (already briefed today)
    │
    ├── Set localStorage to today's date
    │
    └── sendMessage("[BRIEFING]", {hidden: true})
              │                                    POST /api/chat/
              │                                         │
              │                                         ▼
              │                                    run_agent("[BRIEFING]", ...)
              │                                         │
              │                                    Claude reads system prompt:
              │                                    "When message is '[BRIEFING]',
              │                                     generate daily briefing"
              │                                         │
              │                                    Claude calls tool:
              │                                    generate_daily_briefing
              │                                         │
              │                                    ┌────┴────────────────────┐
              │                                    │ Aggregates 3 data sources: │
              │                                    │ 1. get_counts()           │
              │                                    │ 2. get_digest_preview()   │
              │                                    │ 3. get_notifications(3d)  │
              │                                    └────┬────────────────────┘
              │                                         │
              │                                    Claude gets the data back,
              │                                    generates natural language:
              │                                    "Good morning! You have..."
              │                                         │
              │    ◄──── SSE: text_delta ──────────────┘
              │
    parseSSEStream receives text
              │
    ChatPanel identifies as briefing
    (previous message was [BRIEFING])
              │
    Renders with special header:
    ┌──────────────────────────────────┐
    │ ✨ Daily Briefing                │
    │                                  │
    │ Good morning! You have           │
    │ 3 urgent items today:            │
    │ - "Tax docs by Friday" (2 days!) │
    │ - "Call John" (tomorrow)         │
    │ ...                              │
    │ You completed 5 items this week! │
    └──────────────────────────────────┘
```

### Key Design Decisions

- **Hidden message:** The `[BRIEFING]` user message is NOT shown in the chat UI. Frontend filters it out (ChatPanel line 334).
- **Once per day:** localStorage date check prevents duplicate briefings.
- **Auto-triggered:** No user action needed. Fires 500ms after history loads.
- **Ref guard:** A React ref prevents double-triggering in development (React StrictMode calls useEffect twice).

---

## 9. Notifications & Digest

### Three Systems Working Together

```
1. NOTIFICATION PREDICTION (at capture time)
   categorizer.py → predicts WHEN to notify
   → sets notification_date, frequency, next_notification_at

2. NOTIFICATION PROCESSING (background cron)
   scheduler.py → runs every 15 minutes
   sender.py → finds due items → "sends" notification → schedules next one

3. WEEKLY DIGEST (background cron)
   scheduler.py → runs Sundays 9 AM
   digest.py → aggregates stats → generates HTML email
```

### Notification Processing Flow

```
Every 15 minutes:
    │
    ▼
process_notifications(db)  ← sender.py
    │
    ▼
Query: items WHERE
  notification_enabled = true AND
  is_completed = false AND
  next_notification_at <= now() AND
  next_notification_at IS NOT NULL
    │
    ▼
For each due item:
    │
    ├── send_notification(item, user, db)
    │   ← Currently a STUB: just logs to console
    │   ← TODO: Wire SendGrid/Resend (Gap P2)
    │
    └── Update schedule based on frequency:
        "once"    → disable notifications entirely
        "daily"   → next_notification_at = now + 1 day
        "weekly"  → next_notification_at = now + 7 days
        "monthly" → next_notification_at = now + 30 days
```

### Weekly Digest Flow

```
Sunday 9 AM:
    │
    ▼
send_weekly_digests(db)  ← digest.py
    │
    ▼
For each user:
    │
    ├── get_pending_items_for_digest()
    │   │
    │   ├── Urgent items (urgency=high, not completed, limit 10)
    │   ├── Pending tasks (action_required=true, not completed, limit 10)
    │   ├── Upcoming notifications (next 7 days, limit 10)
    │   └── Stats (items saved this week, completed this week)
    │
    ├── generate_digest_email()
    │   ← Generates complete HTML email with inline CSS
    │   ← Sections: urgent (red), tasks (yellow), notifications (teal),
    │     stats (green), CTA button
    │
    └── Send email
        ← Currently a STUB: logs to console
        ← TODO: Wire email transport (Gap P2)
```

### Cron Authentication

The `/api/notifications/process` and `/api/notifications/send-digests` endpoints are meant for external cron jobs (e.g., Railway cron). They authenticate via `X-API-Key` header checked against `CRON_API_KEY` env var. In dev mode (no key configured), access is unrestricted.

### APScheduler (Optional In-Process)

`scheduler.py` can run these cron jobs in-process using APScheduler:
- `notification_job` → every 15 minutes
- `digest_job` → every Sunday 9 AM UTC

It's optional — if APScheduler isn't installed, it gracefully degrades. The docstring recommends external cron jobs in production instead.

---

## 10. Smart Resurfacing ("Today" Module)

**File:** `backend/app/api/routes/items.py` → `build_today_smart_filter()`

This is the "magic" behind the Today tab. It doesn't just show today's items — it **intelligently picks which items to resurface** using 6 OR conditions:

```python
# Simplified version of the filter logic:
show_in_today = (
    # 1. High urgency — always show
    (urgency == "high") |

    # 2. AI marked as "immediate" time context
    (time_context == "immediate") |

    # 3. Needs action + NEVER surfaced before
    (action_required == True AND last_surfaced_at IS NULL) |

    # 4. Needs action + not surfaced in 3+ days
    (action_required == True AND last_surfaced_at < 3_days_ago) |

    # 5. Learning items not surfaced in 7+ days
    (intent == "learn" AND last_surfaced_at < 7_days_ago) |

    # 6. Created today (always show new items)
    (created_at >= start_of_today)
)
```

### How Surfacing Tracking Works

When the frontend loads the Today module, it calls `POST /api/items/mark-surfaced/` with the IDs of items shown. This updates `last_surfaced_at` on each item, which prevents them from reappearing tomorrow (unless they meet a stronger condition like high urgency).

```
Today tab loads → items appear → mark-surfaced called
                                        │
                                        ▼
                              last_surfaced_at = now()
                                        │
                              Next time Today loads:
                              This item won't match condition #3 or #4
                              (already surfaced recently)
                              Unless it's high urgency (#1) or immediate (#2)
```

**Note:** `build_today_smart_filter()` is duplicated in `agent_tools.py` as `_build_today_smart_filter()`. When the agent calls `search_items` with `module="today"`, it uses the same logic. This is a code duplication worth noting (could be extracted to a shared utility).

---

## 11. The Cache Invalidation Bridge

This is the connection between the chat panel and the dashboard, and it's one of the cleanest patterns in the codebase:

```
Chat Panel                                  Dashboard
──────────                                  ─────────
User: "Delete my 'buy milk' item"

Agent calls delete_item tool
    │
    ▼
delete_item is in MUTATING_TOOLS set
    │
    ▼
SSE: tool_result {mutated: true}
    │
    ▼
useChat.ts parseSSEStream:
  hasMutated = true
    │
    ▼
After stream ends:                    ← React Query
  queryClient.invalidateQueries(         cache invalidated
    {queryKey: ['items']}            →   Items list auto-refetches
  )                                      Dashboard updates instantly
  queryClient.invalidateQueries(
    {queryKey: ['item-counts']}      →   Module counts update
  )
```

**Which tools trigger mutation:**
```python
MUTATING_TOOLS = {"create_item", "update_item", "delete_item", "mark_complete"}
```

**Non-mutating tools** (search, get_counts, etc.) never trigger cache invalidation — they're read-only.

---

## 12. RAG & Semantic Search (pgvector)

**Migration**: `d4e5f6a7b8c9_add_pgvector_and_item_embeddings.py`
**Service**: `backend/app/services/ai/embeddings.py`
**Integration**: `agent_tools.py` (search_items), `items.py` (item creation)

### What RAG Adds to MindStash

Before RAG, searching for "Docker tips" would only find items containing the exact word "Docker". Now it finds:
- Items about "container technology"
- Items about "Kubernetes deployment"
- Items about "microservices architecture"

The system uses **hybrid search**: keyword matching + semantic similarity, then combines results.

### The Embedding Flow

```
User creates item: "Learn about container orchestration"
        │
        ▼
categorize_item() → saves item to DB
        │
        ▼
After DB commit: embedding_service.embed_text(content)
        │
        ▼
Returns 1536-dimensional vector (OpenAI text-embedding-3-small)
        │
        ▼
UPDATE items SET content_embedding = vector WHERE id = item_id
        │
        ▼
pgvector HNSW index automatically updates (no rebuild needed)
```

### Hybrid Search in search_items Tool

```python
# From agent_tools.py lines 280-310 (simplified)

# 1. Start with base filters (module, category, urgency, etc.)
query = db.query(Item).filter(Item.user_id == user_id, ...)

# 2. Keyword search (original behavior)
if search_text:
    query = query.filter(Item.content.ilike(f"%{search_text}%"))

# 3. Semantic search (NEW — additive, not replacement)
if search_text and embedding_service.available:
    search_vec = embedding_service.embed_text(search_text)
    if search_vec:
        # Find items with embedding cosine distance < 0.4 (similarity > 0.6)
        semantic_filter = Item.content_embedding.cosine_distance(search_vec) < 0.4
        query = query.filter(
            or_(
                Item.content.ilike(f"%{search_text}%"),  # keyword match
                semantic_filter                          # OR semantic match
            )
        )
        # Order by semantic relevance
        query = query.order_by(Item.content_embedding.cosine_distance(search_vec))

# 4. Apply pagination and return
items = query.offset(skip).limit(limit).all()
```

**Key insight**: Semantic search is **additive**, not a replacement. If embeddings fail or aren't available, the tool falls back to keyword-only search (original behavior).

### EmbeddingService Architecture

**File**: `backend/app/services/ai/embeddings.py`

- **Lazy initialization**: Client isn't created until first use
- **Credential fallback**: `EMBEDDING_API_KEY` → `AIML_API_KEY` → disabled
- **Graceful degradation**: Returns `None` on any failure; callers must handle it
- **Batch API**: `embed_batch()` for backfilling (used by `scripts/backfill_embeddings.py`)
- **Cosine similarity**: Numpy-based calculation for in-memory comparisons (used by tool selector)

### Migration Details

```sql
-- From d4e5f6a7b8c9 migration
CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE items ADD COLUMN content_embedding vector(1536);

-- HNSW index (Hierarchical Navigable Small World)
-- Fast approximate nearest neighbor search
-- No periodic rebuilding needed (unlike IVF indexes)
CREATE INDEX ix_items_content_embedding ON items
USING hnsw (content_embedding vector_cosine_ops);
```

### Backfilling Existing Items

**Script**: `backend/scripts/backfill_embeddings.py`

```bash
cd backend
python -m scripts.backfill_embeddings
```

- Fetches all items with `content_embedding IS NULL`
- Batches them in groups of 100
- Calls `embedding_service.embed_batch()`
- Updates DB in bulk
- Progress bar via `tqdm`

**Current status**: Blocked on OpenAI API credits (per MEMORY.md). Once credits are added, run the script and embeddings activate across the entire item library.

---

## 13. Long-term Memory System

**File**: `backend/app/services/ai/memory.py`
**Model**: `UserMemory` (user_id, memory_type, content, confidence, source, is_active)
**Integration**: `agent.py` — called after session ends, loaded before session starts

### What Long-term Memory Does

Short-term memory (ChatSession/ChatMessage) remembers **this conversation**. Long-term memory remembers **who you are across all conversations**.

**Example conversation:**
```
User: "I prefer tasks grouped by urgency, not alphabetically"
Agent: "Got it, I'll remember that"

[New session, days later]

User: "Show me my tasks"
Agent: [Loads memory: "prefers tasks by urgency"]
       "Here are your tasks, sorted by urgency as you prefer..."
```

### The Memory Lifecycle

```
┌────────────────────────────────────────────────────────────┐
│                    SESSION START                           │
│                                                            │
│  1. load_active_memories(db, user_id)                      │
│     ↓                                                      │
│  2. format_memories_for_prompt(memories)                   │
│     ↓                                                      │
│  3. Inject into system prompt:                             │
│     <user_memory>                                          │
│     Preferences:                                           │
│     1. User prefers tasks grouped by urgency               │
│     2. User dislikes emoji in responses                    │
│     Facts:                                                 │
│     3. User is a software engineer learning AI             │
│     </user_memory>                                         │
└────────────────────────────────────────────────────────────┘
        │
        ▼
    [Agent conversation happens...]
        │
        ▼
┌────────────────────────────────────────────────────────────┐
│                    SESSION END                             │
│                                                            │
│  1. extract_and_save_memories(db, user_id, messages)       │
│     ↓                                                      │
│  2. Build transcript from conversation                     │
│     ↓                                                      │
│  3. Call Claude with EXTRACTION_PROMPT:                    │
│     "Analyze this conversation and extract durable         │
│      facts/preferences/patterns/instructions"              │
│     ↓                                                      │
│  4. Claude returns JSON:                                   │
│     {"memories": [                                         │
│       {                                                    │
│         "content": "User prefers brevity in responses",    │
│         "memory_type": "preference",                       │
│         "confidence": 0.9,                                 │
│         "source": "user_stated"                            │
│       }                                                    │
│     ]}                                                     │
│     ↓                                                      │
│  5. Deduplication check (Jaccard similarity)               │
│     ↓                                                      │
│  6. Capacity management (max 50 memories per user)         │
│     ↓                                                      │
│  7. Save to UserMemory table                               │
└────────────────────────────────────────────────────────────┘
```

### Memory Types & Confidence Scoring

```python
# From memory.py
VALID_MEMORY_TYPES = {"preference", "pattern", "fact", "instruction"}
VALID_SOURCE_TYPES = {"user_stated", "observed", "inferred"}

# Confidence scoring:
# - user_stated: 0.9 (user explicitly said "I prefer X")
# - observed: 0.7 (agent noticed user always does X)
# - inferred: 0.5 (agent guesses user might like X)
```

### Deduplication Logic

**Problem**: Without dedup, agent would save "User prefers brevity" multiple times across sessions.

**Solution**: Jaccard similarity + substring containment (lines 59-68)

```python
def _is_duplicate(new_content: str, existing_content: str) -> bool:
    # Normalize: lowercase, remove punctuation, collapse whitespace
    norm_new = _normalize_text(new_content)
    norm_existing = _normalize_text(existing_content)

    # Check substring containment
    if norm_new in norm_existing or norm_existing in norm_new:
        return True

    # Check word overlap (Jaccard similarity >= 0.7)
    return _jaccard_similarity(new_content, existing_content) >= 0.7
```

If a duplicate is detected, the system **boosts the confidence** of the existing memory instead of creating a new one:

```python
if confidence > existing.confidence:
    existing.confidence = min(1.0, existing.confidence + 0.1)
```

### Capacity Management

Max 50 memories per user. When full:
1. New memory is compared to lowest-confidence existing memory
2. If new confidence > lowest existing confidence → evict lowest, save new
3. Otherwise, discard new memory (not strong enough)

This ensures the memory bank contains only the highest-signal information.

### Where Memory is Called

**Session start** (`agent.py` lines ~200-210):
```python
memories = load_active_memories(db, user_id)
memory_text = format_memories_for_prompt(memories)
if memory_text:
    # Prepend to system prompt
    system_prompt = system_prompt + memory_text
```

**Session end** (`agent.py` lines ~550-560):
```python
# After "done" SSE event, before returning
if api_messages:
    extract_and_save_memories(db, user_id, api_messages)
```

### Current Limitations

- Extraction happens **after every session**, even short ones. Could add a minimum conversation length check.
- No feedback loop — if a memory is wrong, user can't correct it via chat (yet).
- No memory expiration — old memories stay forever unless evicted by higher-confidence ones.

---

## 14. Parallel Tool Execution

**Commit**: `c39152e`
**File**: `backend/app/services/ai/agent.py` (lines 300-325)

### The Problem

Before parallel execution:
```
User asks: "How many items do I have and what's urgent?"

Agent iteration 1: Call get_counts → wait 200ms → get result
Agent iteration 2: Call search_items → wait 300ms → get result
Agent iteration 3: Generate response with both results

Total latency: 500ms+ tool execution time
```

After parallel execution:
```
Agent iteration 1: Call BOTH tools concurrently → wait 300ms (longest) → get both results
Agent iteration 2: Generate response

Total latency: 300ms+ tool execution time (40% faster)
```

### The Implementation

```python
# From agent.py lines 282-325 (simplified)

# Split tools into safe vs confirmation-required
safe_blocks = []
confirmation_block = None
for tb in tool_use_blocks:
    if registry.needs_confirmation(tb.name):
        confirmation_block = tb  # Only ONE destructive tool allowed per turn
    else:
        safe_blocks.append(tb)

# Execute safe tools
if len(safe_blocks) == 1:
    # Single tool — no need for threading overhead
    tb = safe_blocks[0]
    result = registry.execute(tb.name, db, user_id, tb.input)
    results_map = {tb.id: result}
else:
    # Multiple tools — execute in parallel
    def _execute_tool(tool_block):
        # CRITICAL: Each thread needs its own DB session
        tool_db = SessionLocal()
        try:
            return tool_block.id, registry.execute(
                tool_block.name, tool_db, user_id, tool_block.input
            )
        finally:
            tool_db.close()

    with ThreadPoolExecutor(max_workers=len(safe_blocks)) as executor:
        futures = [executor.submit(_execute_tool, tb) for tb in safe_blocks]
        for future in futures:
            tool_id, result = future.result()  # Blocks until all done
            results_map[tool_id] = result
```

### Key Design Decisions

1. **ThreadPoolExecutor, not asyncio** — SQLAlchemy DB session is synchronous; threads are simpler than async
2. **Per-thread DB session** — SQLAlchemy sessions are NOT thread-safe; each thread gets its own `SessionLocal()`
3. **Single-threaded fallback** — If only 1 tool, skip threading overhead
4. **Confirmation tools execute serially** — Only safe (non-destructive) tools run in parallel

### Safe vs. Confirmation-Required Tools

```python
# From tool_registry.py
def needs_confirmation(self, tool_name: str) -> bool:
    tool_data = self._tools.get(tool_name)
    return tool_data.get("requires_confirmation", False) if tool_data else False

# Tools marked with requires_confirmation=True:
# - delete_item
# - (future: bulk_delete, reset_all, etc.)
```

Destructive tools NEVER execute in parallel — they pause and wait for user approval (see section 15).

---

## 15. Human-in-the-Loop Confirmations

**Commit**: `079dd4b`
**Files**:
- `backend/app/models/chat.py` — `PendingConfirmation` model
- `backend/app/services/ai/agent.py` — confirmation flow
- `backend/alembic/versions/c2fa447829f7_add_pending_confirmations_table.py`

### The Problem

Before HITL:
```
User: "Delete all my old notes"
Agent: [Calls delete_item 47 times] ← NO CONFIRMATION
       "Done, deleted 47 items"
User: "Wait, I didn't mean ALL of them!" ← TOO LATE
```

After HITL:
```
User: "Delete my 'buy milk' item"
Agent: [Pauses execution]
       ⚠️ About to permanently delete: "buy milk - whole milk from Trader Joe's"
       [Confirm] [Cancel]
User: [Clicks Confirm]
Agent: [Resumes, executes delete_item]
       "Done, deleted that item"
```

### The Flow

```
User sends message
        │
        ▼
Agent reasoning loop
        │
        ▼
Claude returns: tool_use block for delete_item
        │
        ▼
agent.py checks: registry.needs_confirmation("delete_item") → True
        │
        ▼
Agent splits tool_use_blocks into:
  - safe_blocks: [search_items, get_counts, ...]
  - confirmation_block: delete_item
        │
        ├──► Execute safe_blocks in parallel (section 14)
        │
        └──► For confirmation_block:
                │
                ▼
             Create PendingConfirmation record:
                session_id, user_id, tool_name, tool_input,
                tool_use_id, description, agent_context
                │
                ▼
             Yield SSE event:
                event: confirmation_required
                data: {
                  "confirmation_id": "uuid",
                  "tool": "delete_item",
                  "description": "Delete item: 'buy milk'",
                  "requires_approval": true
                }
                │
                ▼
             Yield "done" event (stream ends)
                │
                ▼
          Frontend shows modal with [Confirm] [Cancel]
                │
        ┌───────┴───────┐
        │               │
    [Confirm]       [Cancel]
        │               │
        ▼               ▼
    POST /chat/confirm   POST /chat/confirm
    {decision:          {decision:
     "approved"}         "denied"}
        │               │
        └───────┬───────┘
                │
                ▼
    resume_after_confirmation() generator
                │
        ┌───────┴───────┐
        │               │
    approved        denied
        │               │
        ▼               ▼
    Execute tool    Skip tool
    Return result   Return error msg
        │               │
        └───────┬───────┘
                │
                ▼
    Continue Claude agent loop with tool result
                │
                ▼
    Claude generates natural follow-up response
```

### PendingConfirmation Model

```python
# From models/chat.py
class PendingConfirmation(Base):
    __tablename__ = "pending_confirmations"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    session_id: Mapped[UUID] = mapped_column(ForeignKey("chat_sessions.id"))
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"))

    tool_name: Mapped[str]            # "delete_item"
    tool_input: Mapped[dict]           # {"item_id": "uuid"}
    tool_use_id: Mapped[str]           # Claude's tool_use block ID
    description: Mapped[str]           # "Delete item: 'buy milk'"

    agent_context: Mapped[dict]        # Snapshot of api_messages + current turn
                                       # Allows agent to resume exactly where it left off

    status: Mapped[str]                # "pending" | "confirmed" | "denied" | "expired"
    resolved_at: Mapped[datetime]
    created_at: Mapped[datetime]
    expires_at: Mapped[datetime]       # Auto-expire after 5 minutes
```

### Agent Context Snapshot

When a confirmation is required, the agent's current state is frozen:

```python
# From agent.py lines 345-360
agent_context = {
    "api_messages": api_messages,  # Full conversation history up to now
    "current_turn": {
        "text": full_text,          # Assistant's text from this turn
        "all_tool_blocks": [        # ALL tools from this turn (safe + destructive)
            {"id": tb.id, "name": tb.name, "input": tb.input}
            for tb in tool_use_blocks
        ],
    },
}
```

This snapshot allows `resume_after_confirmation()` to reconstruct the exact conversation state and continue seamlessly.

### Confirmation Timeout

Confirmations expire after 5 minutes (lines ~470-480 in agent.py):

```python
if pending.expires_at and pending.expires_at < datetime.utcnow():
    yield _sse_event("error", {"message": "Confirmation expired (5 min timeout)"})
    return
```

Expired confirmations cannot be approved — user must ask the agent again.

### Multiple Destructive Tools in One Turn

**Current limitation**: Only ONE confirmation-required tool is allowed per agent turn.

```python
# From agent.py lines 285-290
for tb in tool_use_blocks:
    if confirmation_block is None and registry.needs_confirmation(tb.name):
        confirmation_block = tb
    else:
        safe_blocks.append(tb)
```

If Claude tries to call `delete_item` twice in one response, only the FIRST one triggers confirmation; the second is treated as a safe tool (bug — should also pause or reject).

**Future improvement**: Support queue of confirmations, or reject responses with multiple destructive tools.

---

## 16. Dynamic Tool Selection

**File**: `backend/app/services/ai/tool_selector.py`
**Integration**: `agent.py` (optional — can toggle via feature flag)

### The Problem

Every Claude API call includes ALL 9 tool schemas in the request:
- search_items (200 tokens)
- create_item (150 tokens)
- update_item (180 tokens)
- delete_item (120 tokens)
- mark_complete (100 tokens)
- get_counts (80 tokens)
- get_upcoming_notifications (100 tokens)
- get_digest_preview (110 tokens)
- generate_daily_briefing (130 tokens)

**Total**: ~1200 tokens of tool schemas on EVERY agent turn.

For a 3-iteration conversation:
- Without selection: 3 × 1200 = 3600 tokens of tool schemas
- With selection: 3 × 400 = 1200 tokens (saves 2400 tokens = 66% reduction)

### The Solution

Embed tool descriptions once at startup, then for each user message:
1. Embed the user message
2. Compute cosine similarity between message and each tool
3. Send only tools with similarity >= 0.3
4. Always include `search_items` (base tool)
5. Safety net: if < 3 tools selected, send all

### The Flow

```
App startup → tool_selector module imported
        │
        ▼
_init_tool_embeddings() called on first use
        │
        ▼
For each tool in registry:
    description = tool_schema["description"]
    text = f"{tool_name}: {description}"
        │
        ▼
embedding_service.embed_batch(all_tool_texts)
        │
        ▼
Cache in _tool_embeddings dict: {tool_name: vector}
        │
        ▼
─────────────────────────────────────────────────────
User sends message: "What ideas did I save?"
        │
        ▼
agent.py: tool_schemas = select_tools(message, agent_type="assistant")
        │
        ▼
tool_selector.select_tools():
    1. Embed user message → message_vec
    2. For each tool: cosine_similarity(message_vec, tool_vec)
    3. Scores: [
         ("search_items", 0.82),      ← high similarity
         ("get_counts", 0.45),
         ("create_item", 0.25),       ← below threshold
         ("delete_item", 0.18),       ← below threshold
         ...
       ]
    4. selected = {"search_items", "get_counts"} (similarity >= 0.3)
    5. Add BASE_TOOLS: {"search_items"} (already in)
    6. Check safety net: 2 tools < MIN_TOOLS (3) → return ALL tools
        │
        ▼
Return filtered schemas to Claude API call
```

### Graceful Degradation

The selector has multiple fallback layers:

```python
# 1. If embeddings unavailable → return all tools
if not embedding_service.available:
    return registry.get_schemas(agent_type)

# 2. If message embedding fails → return all tools
message_vec = embedding_service.embed_text(user_message)
if message_vec is None:
    return all_schemas

# 3. If too few selected → return all tools
if len(selected_names) < MIN_TOOLS:
    return all_schemas

# Otherwise → return filtered tools
return selected_schemas
```

This ensures the agent **never breaks** due to embedding failures — it just uses more tokens.

### Current Status

**Implemented but not activated in main agent flow.** To activate:

```python
# In agent.py, replace:
tool_schemas = registry.get_schemas(agent_type="assistant")

# With:
from app.services.ai.tool_selector import select_tools
tool_schemas = select_tools(message, agent_type="assistant")
```

Not activated by default because:
1. With only 9 tools, the token savings are modest (~2400 tokens per conversation)
2. Risk of excluding a needed tool (though safety nets minimize this)
3. Easier to debug with all tools visible

**When to activate**: When tool count exceeds 15-20, or when optimizing for cost at scale.

---

## 17. Telegram Integration

**Commit**: `8d75acd`
**Files**:
- `backend/app/services/telegram.py` — core Telegram service
- `backend/app/api/routes/integrations.py` — webhook handler + linking endpoints
- `backend/app/models/telegram_link.py` — TelegramLink model
- `frontend/src/app/dashboard/page.tsx` — integration UI

### What It Does

Users can:
1. **Link Telegram account** to MindStash via 6-character code
2. **Capture thoughts** by messaging the bot (saved as items, AI-categorized)
3. **Chat with AI agent** via Telegram (same agent as web, persistent sessions)
4. **Commands**: `/start` (link account), `/chat` (switch to AI mode), `/capture` (switch to capture mode)

### The Linking Flow

```
[Web App]
User clicks "Connect Telegram" button
        │
        ▼
POST /api/integrations/telegram/link
        │
        ▼
generate_link_code(db, user_id) → "ABC123" (6 chars, expires in 15 min)
        │
        ▼
Frontend shows: "Open Telegram and send: /start ABC123"
        │
        ▼
[Telegram]
User sends: /start ABC123
        │
        ▼
Telegram webhook → POST /api/integrations/telegram/webhook
        │
        ▼
handle_telegram_webhook():
    extract chat_id, text = "/start ABC123"
    parse command → command="/start", code="ABC123"
        │
        ▼
activate_link(db, code, chat_id):
    - Find TelegramLink WHERE code="ABC123" AND NOT used
    - Check expiry (created_at + 15 min)
    - Set telegram_chat_id = chat_id, used = True
    - Return user
        │
        ▼
send_message(chat_id, "✅ Linked! Send me a thought or type /chat")
```

### Two Modes: Capture vs. Chat

```
TelegramLink model has: current_mode: "capture" | "chat"

┌────────────────────────────────────────────┐
│            CAPTURE MODE (default)          │
├────────────────────────────────────────────┤
│ User sends: "Buy milk from Trader Joe's"   │
│                                            │
│ handle_telegram_message():                 │
│   1. Create Item in DB                     │
│   2. Call categorize_item() (same AI)      │
│   3. Generate embedding                    │
│   4. Reply with category emoji + summary   │
│                                            │
│ Example response:                          │
│ 🛒 Saved to Buy                            │
│ Quick shopping reminder                    │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│               CHAT MODE                    │
├────────────────────────────────────────────┤
│ User sends: "What urgent tasks do I have?" │
│                                            │
│ handle_telegram_message():                 │
│   1. Load or create ChatSession            │
│   2. Call run_agent() (same agent as web)  │
│   3. Parse SSE stream                      │
│   4. Send agent response chunks to TG      │
│   5. Tool calls shown as:                  │
│      "🔧 Searching your items..."          │
│                                            │
│ Session persists across messages           │
└────────────────────────────────────────────┘

Switch modes:
  /capture → capture mode
  /chat → chat mode
```

### Session Persistence

**Problem**: Telegram conversations should remember context like the web chat does.

**Solution**: `TelegramLink` model has `chat_session_id` field.

```python
# From telegram.py lines 240-250
if link and str(link.chat_session_id or "") != returned_session_id:
    # Agent created new session or we didn't have one → save it
    link.chat_session_id = returned_session_id
    db.commit()
```

On first chat message, a new `ChatSession` is created. The session ID is saved to `TelegramLink`. On subsequent messages, the same session is loaded → agent has full conversation history.

### Webhook Security

```python
# From integrations.py webhook handler
secret_header = request.headers.get("X-Telegram-Bot-Api-Secret-Token")
if secret_header != settings.TELEGRAM_WEBHOOK_SECRET:
    raise HTTPException(403, "Invalid webhook secret")
```

Telegram sends `X-Telegram-Bot-Api-Secret-Token` header with every webhook request. If it doesn't match the secret configured during webhook setup, request is rejected.

### Message Length Limits

Telegram has a 4096-character limit per message. Agent responses longer than this are split:

```python
# From telegram.py lines 99-125 (simplified)
TELEGRAM_MAX_MESSAGE_LENGTH = 4096

def send_message_sync(chat_id: int, text: str):
    if len(text) <= TELEGRAM_MAX_MESSAGE_LENGTH:
        # Send as-is
        _telegram_api_post("sendMessage", {"chat_id": chat_id, "text": text})
    else:
        # Split into chunks
        chunks = []
        while text:
            chunk = text[:TELEGRAM_MAX_MESSAGE_LENGTH]
            chunks.append(chunk)
            text = text[TELEGRAM_MAX_MESSAGE_LENGTH:]

        for i, chunk in enumerate(chunks):
            prefix = f"[Part {i+1}/{len(chunks)}]\n" if len(chunks) > 1 else ""
            _telegram_api_post("sendMessage", {"chat_id": chat_id, "text": prefix + chunk})
```

### Deployment: Webhook Setup

**Script**: `backend/scripts/setup_telegram_webhook.py`

```bash
cd backend
python -m scripts.setup_telegram_webhook
```

This script:
1. Reads `TELEGRAM_BOT_TOKEN` and `TELEGRAM_WEBHOOK_SECRET` from env
2. Prompts for public base URL (e.g., `https://api.mindstash.app`)
3. Calls Telegram's `setWebhook` API with `{base_url}/api/integrations/telegram/webhook`
4. Telegram validates the URL (must be HTTPS, publicly accessible)
5. Confirms webhook is active

**Local development**: Use ngrok or similar to expose localhost webhook for testing.

---

## 18. Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                          │
│                                                                      │
│  Dashboard                          ChatPanel                        │
│  ┌──────────────────┐               ┌──────────────────┐            │
│  │ CaptureInput     │               │ Message Bubbles  │            │
│  │ ModuleSelector   │  ◄── cache ──►│ Tool Indicators  │            │
│  │ FilterPanel      │   invalidation │ Confirmation UI  │  🆕        │
│  │ ItemCard grid    │               │ Briefing Badge   │            │
│  │ SearchBar        │               └────────┬─────────┘            │
│  │ Pagination       │  🆕                     │                      │
│  │ Telegram Link UI │  🆕                     │                      │
│  └────────┬─────────┘                        │                      │
│           │                                  │                      │
│   useItems.ts (React Query)          useChat.ts (SSE parser)        │
│           │                                  │                      │
└───────────┼──────────────────────────────────┼──────────────────────┘
            │ REST (axios)                     │ SSE (fetch + ReadableStream)
            ▼                                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         BACKEND (FastAPI)                           │
│                                                                      │
│  routes/items.py                    routes/chat.py                   │
│  ┌──────────────────┐               ┌──────────────────┐            │
│  │ CRUD + embedding │  🆕           │ POST / (SSE)     │            │
│  │ Hybrid search    │  🆕           │ /confirm (HITL)  │  🆕        │
│  │ Smart resurfacing│               │ /resume          │  🆕        │
│  └────────┬─────────┘               └────────┬─────────┘            │
│           │                                  │                      │
│           │                          agent.py (ReAct Loop)          │
│           │                          ┌──────────────────┐           │
│           │                          │ Parallel tools   │  🆕       │
│           │                          │ HITL flow        │  🆕       │
│           │                          │ Memory injection │  🆕       │
│           │                          │ Memory extraction│  🆕       │
│           │                          └────────┬─────────┘           │
│           │                                   │                     │
│           │            ┌─────────────────────┴──────────┐           │
│           │            │                                │           │
│           │      tool_registry.py              tool_selector.py 🆕  │
│           │      ┌──────────────────┐          (dynamic selection)  │
│           │      │ 9 tools          │                               │
│           │      │ Confirmation flag│  🆕                            │
│           │      └────────┬─────────┘                               │
│           │               │                                         │
│           ▼               ▼                                         │
│  categorizer.py ◄── called by 3 paths ────┐                        │
│  ┌────────────────────────┐               │                        │
│  │ AI categorization      │               │                        │
│  │ + embedding generation │  🆕           │                        │
│  └────────────────────────┘               │                        │
│                                            │                        │
│  memory.py  🆕                             │                        │
│  ┌────────────────────────┐               │                        │
│  │ Extract from convos    │               │                        │
│  │ Dedup + capacity mgmt  │               │                        │
│  │ Inject into prompt     │               │                        │
│  └────────────────────────┘               │                        │
│                                            │                        │
│  routes/integrations.py  🆕                │                        │
│  ┌────────────────────────┐               │                        │
│  │ Telegram webhook       │───────────────┘                        │
│  │ Link code generation   │                                        │
│  └────────────────────────┘                                        │
│                                                                      │
│  embeddings.py  🆕            routes/notifications.py               │
│  ┌────────────────────────┐  ┌──────────────────┐                  │
│  │ OpenAI embeddings      │  │ /process (cron)  │                  │
│  │ Batch API              │  │ /send-digests    │                  │
│  │ Cosine similarity      │  │ (email TODO)     │                  │
│  └────────────────────────┘  └──────────────────┘                  │
│                                                                      │
└──────────────────────────┬───────────────────────────────────────────┘
                           │
                    ┌──────┴────────┬─────────────────┬──────────────┐
                    ▼               ▼                 ▼              ▼
            ┌──────────────┐  ┌────────────┐  ┌─────────────┐  ┌────────┐
            │ PostgreSQL   │  │ Claude API │  │ OpenAI API  │  │Telegram│
            │ (Supabase)   │  │(Anthropic) │  │(Embeddings) │  │Bot API │
            │              │  │            │  │             │  │        │
            │ users        │  │Categorizer │  │text-embed   │  │Webhook │
            │ items +      │  │Agent calls │  │-3-small     │  │Capture │
            │   embedding  │  │Memory ext. │  │1536-dim     │  │+ Chat  │
            │   🆕         │  └────────────┘  └─────────────┘  └────────┘
            │ chat_sessions│                       🆕              🆕
            │ chat_messages│
            │ user_memories│  🆕
            │ telegram_    │  🆕
            │   links      │
            │ pending_     │  🆕
            │   confirms   │
            └──────────────┘
            (pgvector ext.) 🆕
```

---

## 19. Key Engineering Decisions

### 1. Synchronous agent, not streaming tokens

The agent uses `client.messages.create()` (full response) instead of `client.messages.stream()` (token-by-token). This means text arrives in chunks per iteration, not character by character.

**Why:** The tool-calling loop needs the full response to know whether Claude wants to call tools. Streaming complicates this significantly. The trade-off is slightly less smooth text appearance, but the tool_start/tool_result events keep the UI responsive during tool execution.

### 2. SSE over POST with raw fetch (not EventSource)

The browser's `EventSource` API only supports GET with no custom headers. Chat needs POST (message body) + Authorization header. So the frontend uses raw `fetch()` + `ReadableStream` reader to parse SSE manually.

### 3. Tool results are "user" messages in Anthropic's API

Anthropic requires tool results to be sent with `role: "user"` containing `type: "tool_result"` blocks. The DB stores them with `role: "tool_result"` for clarity, and `_db_messages_to_anthropic()` handles the conversion.

### 4. Two entry points, one categorizer

Items created via REST API (dashboard) or chat agent both call the same `categorize_item()` function. This prevents divergent behavior between the two creation paths.

### 5. Cache invalidation via SSE mutation flag

The `mutated: true` flag in tool_result SSE events is the bridge between chat and dashboard. Only 4 tools (create, update, delete, mark_complete) are in the `MUTATING_TOOLS` set. Read-only tools never trigger dashboard refresh.

### 6. Daily briefing is a hidden agent conversation

The `[BRIEFING]` message is a real chat message sent to the agent, but hidden from the UI. The agent treats it like any other message — calls tools, gets data, generates text. No special backend code path; just a system prompt instruction.

### 7. Notification scheduling is self-correcting

After a notification "fires" (currently just logged), the frequency determines the next schedule. `"once"` items self-disable. `"daily"/"weekly"/"monthly"` items automatically compute their next fire time. If notification sending fails, the item stays in the "due" state and gets picked up on the next 15-minute cycle.

### 8. Hybrid search is additive, not replacement (RAG)

Semantic search via pgvector is implemented as an **OR condition** with keyword search, not a replacement. If embeddings fail or are unavailable, the system falls back to keyword-only search — zero breakage. This "additive fallback" pattern is used throughout the new features (tool selector, memory extraction, Telegram integration).

### 9. ThreadPoolExecutor for parallel tools, not asyncio

SQLAlchemy DB sessions are synchronous. Rather than rewrite everything async, parallel tool execution uses `ThreadPoolExecutor` with **per-thread DB sessions**. This is simpler, more maintainable, and avoids async/sync bridge complexity.

### 10. HITL confirmations pause the agent, not reject

When a destructive tool is called, the agent doesn't refuse — it pauses and asks. The confirmation flow creates a `PendingConfirmation` record with a full **agent context snapshot** (api_messages + current turn), allowing seamless resumption after user approval. The agent doesn't "forget" what it was doing.

### 11. Long-term memory extracts on EVERY session end

Unlike some systems that extract memories only on explicit user commands, MindStash runs extraction after every chat session (if conversation is >100 chars). This ensures no user preferences are lost, even from casual conversations. Deduplication prevents spam; capacity management keeps only high-confidence memories.

### 12. Dynamic tool selection has 3 fallback layers

Tool selector uses embedding-based filtering, but NEVER breaks the agent:
1. If embeddings unavailable → return all tools
2. If user message embedding fails → return all tools
3. If fewer than 3 tools selected → return all tools

This ensures the agent is **never degraded by an optimization feature**.

### 13. Telegram uses the same agent, same AI categorizer

The Telegram integration isn't a "lightweight" version — it's the **full MindStash experience** via a different channel. Items captured via Telegram go through the same `categorize_item()` function. Chat sessions persist across Telegram messages the same way they do on web. No duplicate code, no behavior divergence.

---

## What This Guide Covers vs. What's Left

| This guide explains | What's NOT covered (see AGENTIC-ROADMAP.md) |
|---|---|
| How the agent loop works | Context summarization (not implemented) |
| How tool calling works | Proactive/scheduled agent (not implemented) |
| How the categorizer works | Reflection loop (not implemented) |
| How SSE streaming works | Structured output retry (not implemented) |
| How memory/sessions work | Agentic workflows/playbooks (not implemented) |
| How briefing works | Observability/tracing (not implemented) |
| How notifications work | Cross-item connections (not implemented) |
| How smart resurfacing works | Voice capture (not implemented) |
| How cache invalidation works | Browser extension (not implemented) |
| **How RAG/pgvector works** 🆕 | Predictive input suggestions (not implemented) |
| **How long-term memory works** 🆕 | Email delivery (implemented in backend, not wired) |
| **How parallel tools work** 🆕 |  |
| **How HITL confirmations work** 🆕 |  |
| **How dynamic tool selection works** 🆕 |  |
| **How Telegram integration works** 🆕 |  |

Everything above the line is **what you've built and how it works**. Everything on the right is **what comes next** (covered in `AGENTIC-ROADMAP.md`).
