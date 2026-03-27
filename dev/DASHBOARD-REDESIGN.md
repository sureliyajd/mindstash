# MindStash Dashboard Redesign — Implementation Plan

> **Created**: 2026-03-27
> **Status**: In Progress
> **Goal**: Transform the flat card-grid dashboard into an intelligent, category-native experience

---

## Problem Statement

The current dashboard shows all items as uniform cards in a masonry grid. At 36+ items, users lose track of what's where. Every item — whether an urgent bill payment or a someday reading wish — gets the same visual weight. The UI doesn't leverage the rich AI metadata (urgency, intent, resurface_strategy) to prioritize what matters.

---

## Phase Overview

| Phase | Scope | Effort | Impact |
|-------|-------|--------|--------|
| **Phase 1** | Dashboard Home + Card Density Reduction | ~1 day | Highest |
| **Phase 2** | Tasks-Native View | ~0.5 day | High |
| **Phase 3** | Reading List View | ~0.5 day | Medium |
| **Phase 4** | Auto-Archive + Smart Resurfacing | ~1 day | High (long-term) |
| **Phase 5** | Remaining Category-Native Views | ~2 days | Medium |

---

## Phase 1: Dashboard Home + Card Density Reduction (QUICK WINS)

### 1A. Smart Dashboard Home View

**What**: Replace the "All 36" card grid as the default landing with a summary dashboard showing actionable sections.

**Sections to render**:
1. **Greeting bar** — "Good morning, {name}" + date + quick stats
2. **Overdue / Urgent** — Items where `notification_date < today` or `urgency === 'high'` + `action_required === true`
3. **Today** — Reuse existing "today" module logic (already computed in backend)
4. **Pinned / Focus** — High-priority active tasks (top 3-5)
5. **Recent Ideas** — Last 3 ideas captured
6. **Reading Queue** — Top 3 unread read/watch/learn items
7. **Goals Progress** — Active goals with completion status

**Data source**: All data is already available via existing API endpoints:
- `GET /api/items/?module=today` — today items
- `GET /api/items/?module=tasks&urgency=high` — urgent tasks
- `GET /api/items/?module=read_later` — reading queue
- `GET /api/items/?module=ideas` — recent ideas
- `GET /api/items/counts/` — counts per module
- `GET /api/notifications/upcoming` — overdue/upcoming

**Files to create/modify**:
- `frontend/src/components/DashboardHome.tsx` — New component (the summary view)
- `frontend/src/app/dashboard/page.tsx` — Add DashboardHome as default when module === 'all'

**Status**: [x] Complete

---

### 1B. Reduce Card Information Density

**What**: Simplify ItemCard to show only scan-essential info by default. Move details to expanded/modal view.

**Current card shows** (~8 data points): category badge, priority, urgency, action-required badge, confidence %, tags (3+), summary, timestamp, "Tap for more"

**New card shows** (3-4 data points):
- Category icon + title/content (first line)
- One key signal: due date if time-based, priority badge if task, source domain if link
- Relative timestamp
- Completion checkbox (tasks only)

**Expanded card adds**: tags, summary, full metadata badges

**Files to modify**:
- `frontend/src/components/ItemCard.tsx` — Simplify default view, progressive disclosure

**Status**: [x] Complete

---

### 1C. Compact List View Toggle

**What**: Add a toggle (grid/list) so users can switch between card grid and compact list rows.

**List row format**: `[category icon] [title] [key signal] [timestamp] [actions]`

**Files to modify**:
- `frontend/src/app/dashboard/page.tsx` — Add view toggle state + conditional rendering
- `frontend/src/components/ItemListRow.tsx` — New compact row component

**Status**: [x] Complete

---

## Phase 2: Tasks-Native View

**What**: When user clicks "Tasks" tab, show a proper task list instead of task-cards in a grid.

**Layout**:
```
Overdue (2)                              ← red section
  ☐ Pay society bill         3 hours ago   🔴 High
  ☐ Quarterly report         2 weeks ago   🔴 High

Today (3)                                ← section
  ☐ Take vitamins            daily         🟡 Medium
  ☐ Phone for snooker        tomorrow      🟡 Medium

This Week (1)
  ☐ Complete HeyMaya profile              🟡 Medium

Someday (4)                              ← collapsed by default
  ☐ Side hustle plan
  ☐ Look at AWS cost mgmt
  ...

✅ Completed (3)                          ← collapsed
  ☑ ...
```

**Grouping logic**: Use `time_context` (immediate/next_week/someday) + `notification_date` for overdue detection.

**Files to create/modify**:
- `frontend/src/components/TasksView.tsx` — New task-native component
- `frontend/src/app/dashboard/page.tsx` — Route "tasks" module to TasksView

**Status**: [ ] Not started

---

## Phase 3: Reading List View

**What**: When user clicks "Read Later", show a clean reading list instead of cards.

**Layout**:
```
Unread (5)
  📄 Harry Potter's novel                    fiction · novel     17 days ago
  🔗 x.com/rs_shankar_/status/...           twitter · content   14 days ago
  🔗 spendbase.co/aws-cloud-cost...         aws · cloud-cost    14 days ago

Read / Completed (2)                        ← collapsed
  ✓ ...
```

**Row format**: Icon (link/text) + title + source domain + tags + timestamp

**Files to create/modify**:
- `frontend/src/components/ReadingListView.tsx` — New component
- `frontend/src/app/dashboard/page.tsx` — Route "read_later" module to ReadingListView

**Status**: [ ] Not started

---

## Phase 4: Auto-Archive + Smart Resurfacing

**What**: Items don't stay in the feed forever. Completed/stale items move to archive. AI resurfaces items when relevant.

**Rules**:
- Completed tasks auto-archive after 7 days
- Low-priority "save" items auto-archive after 30 days with no interaction
- Items with `resurface_strategy: 'weekly_review'` appear in weekly digest only
- Archived items accessible via "Archive" section (not deleted)

**Backend changes needed**:
- Add `archived_at` field to Item model
- Add archive/unarchive endpoints
- Modify list query to exclude archived by default
- Background job to auto-archive based on rules

**Frontend changes**:
- Add "Archive" module/section
- Swipe-to-archive gesture (mobile)
- "Archive" action in item context menu

**Status**: [ ] Not started

---

## Phase 5: Remaining Category-Native Views

Each category gets its own optimized view when selected:

| Category | View Type | Key Features |
|----------|-----------|--------------|
| **Goals** | Progress cards | Milestone tracker, completion % |
| **Ideas** | Sticky-note grid | Lighter cards, no metadata clutter |
| **Reminders** | Timeline/calendar | Date-sorted, snooze actions |
| **Notes/Journal** | Chronological feed | Diary-style, date headers |
| **People** | Contact list | Name + last note + interaction date |
| **Buy** | Shopping list | Price, link, checkbox |
| **Places** | Location list | Address/link, visited/not visited |
| **Watch/Learn** | Media list | Source, duration, progress |

**Status**: [ ] Not started

---

## Technical Notes

### Current Architecture (relevant files)
```
frontend/src/
  app/dashboard/page.tsx      ← Main dashboard (1009 lines, will need splitting)
  components/
    ItemCard.tsx               ← Current card (487 lines)
    ModuleSelector.tsx         ← Tab navigation (246 lines)
    FilterPanel.tsx            ← Filters (464 lines)
    CaptureInput.tsx           ← Input (516 lines)
    ChatPanel.tsx              ← AI chat sidebar
  lib/
    api.ts                     ← API client (816 lines)
    hooks/useItems.ts          ← Items CRUD + filtering (337 lines)
```

### API Endpoints Already Available
All Phase 1-3 data is available through existing endpoints. No backend changes needed until Phase 4.

### Design System
- Colors: Teal (#5AACA8), Yellow (#C9A030), Orange (#D65E3F), Red (#C44545), Green (#5EB563)
- Fonts: Inter (body), JetBrains Mono (mono)
- Animations: Framer Motion
- Styling: Tailwind CSS 4

---

## Progress Log

| Date | Phase | What was done |
|------|-------|---------------|
| 2026-03-27 | — | Created implementation plan |
| 2026-03-27 | 1A | Built DashboardHome component with greeting, stats, urgent/today/tasks/ideas/reading/goals sections |
| 2026-03-27 | 1A | Created useDashboardHome hook (parallel data fetching with React Query) |
| 2026-03-27 | 1B | Reduced ItemCard density: removed AI signals/summary hint/"tap for more" from collapsed view, moved to expanded. Reduced line-clamp to 2, tags to 2, confidence to expanded only |
| 2026-03-27 | 1C | Added grid/list ViewToggle with localStorage persistence. Created ItemListRow compact component |
| 2026-03-27 | 1 | Extracted shared categoryConfig to lib/categoryConfig.ts |
| 2026-03-27 | 1 | Wired everything into dashboard page.tsx. Build passes clean |
