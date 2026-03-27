# MindStash Notification System Improvements

> Tracking document for notification/reminder system overhaul.
> Work through tasks in order. Mark each done after implementation + testing.

---

## Phase 1: Quick Wins (High Impact, Low Effort)

### Task 1: Smarter Frequency Defaults in AI Categorizer
**Status:** DONE (2026-03-27)
**Impact:** Reduces 80% of email noise at the source
**What:** Update the categorizer system prompt so the AI assigns more conservative frequencies:
- Goals/Habits → `weekly` (not `daily`)
- Ideas → `never` or `monthly`
- Reference/Notes/Journal → `never`
- Tasks with no deadline → `weekly` at most
- Reserve `daily` ONLY for truly time-sensitive items (bill due tomorrow, event today)
**Files:** `backend/app/services/ai/categorizer.py`

---

### Task 2: Daily Email Cap + Batching (Consolidated Reminder Email)
**Status:** DONE (2026-03-27)
**Impact:** Eliminates 10+ separate emails/day → 1 batched email
**What:** Instead of sending individual emails per item, batch all due reminders into ONE daily digest-style reminder email. Max 1 reminder email + 1 briefing per day.
**Files:** `backend/app/services/notifications/sender.py`, `backend/app/services/scheduler.py`

---

### Task 3: Reduce "Action Required" / "Needs Attention" Over-Classification
**Status:** DONE (2026-03-27)
**Impact:** Dashboard stops looking like everything is on fire
**What:** Update categorizer prompts so that only genuinely actionable items get `action_required: true` and `urgency: high`. Ideas, journal entries, reference notes, and casual thoughts should NOT be marked as action required.
**Files:** `backend/app/services/ai/categorizer.py`

---

## Phase 2: Core UX Improvements (High Impact, Medium Effort)

### Task 4: One-Click Actions in Reminder Emails
**Status:** DONE (2026-03-27)
**Impact:** Users can act on reminders without opening the app
**What:** Add action buttons/links directly in reminder emails:
- "Mark Done" — marks item complete, stops reminders
- "Snooze 7 days" — pushes next_notification_at forward
- "Stop Reminders" — disables notification_enabled for this item
Requires new API endpoints that work via signed URL tokens (no login needed).
**Files:** `backend/app/api/routes/notifications.py` (new), `backend/app/services/notifications/sender.py`, `backend/app/core/security.py`

---

### Task 5: Engagement-Based Frequency Decay
**Status:** TODO
**Impact:** Stops nagging users who aren't responding
**What:** Track how many times a reminder has been sent without the user acting. After N ignored reminders, auto-reduce frequency:
- `daily` → `weekly` (after 3 ignored)
- `weekly` → `monthly` (after 4 ignored)
- `monthly` → pause + flag for user review (after 3 ignored)
Add `notification_send_count` column to Item model.
**Files:** `backend/app/models/item.py`, `backend/app/services/notifications/sender.py`, new Alembic migration

---

## Phase 3: Intelligence Layer (Medium Impact, Higher Effort)

### Task 6: Separate "Aspiration" vs "Task" Intent
**Status:** TODO
**Impact:** AI correctly distinguishes wishes from commitments
**What:** Add a `commitment_level` field (low/medium/high) to the categorizer output. "I want to wake up at 6 AM" = low commitment (aspiration). "Book dentist appointment" = high commitment (concrete action). Only high-commitment items get proactive reminders by default.
**Files:** `backend/app/services/ai/categorizer.py`, `backend/app/models/item.py`, `backend/app/schemas/item.py`, new Alembic migration

---

### Task 7: Duplicate/Near-Duplicate Detection
**Status:** TODO
**Impact:** Prevents repeated items cluttering dashboard
**What:** Before saving a new item, use embedding similarity search to check if a near-duplicate already exists. If similarity > 0.9, warn the user or auto-merge.
**Files:** `backend/app/api/routes/items.py`, embeddings infrastructure (already exists)

---

## Progress Log

| Date | Task | Status | Notes |
|------|------|--------|-------|
| 2026-03-27 | Task 1: Smarter Frequency Defaults | DONE | Updated categorizer prompt with conservative frequency rules, decision tree, temperature 0.7→0.3 |
| 2026-03-27 | Task 3: Reduce Over-Classification | DONE | Added priority/urgency/action_required rules + 8 conservative examples to categorizer prompt |
| 2026-03-27 | Task 2: Email Batching | DONE | Added `send_batched_notification()`, modified `process_notifications()` to group by user — 1 email per user instead of N |
| 2026-03-27 | Task 4: One-Click Email Actions | DONE | Added signed JWT tokens for email actions, `GET /api/notifications/email-action` endpoint, action buttons (Done/Snooze/Stop) in both email templates |

---
