# MindStash API Reference

> Complete REST API Documentation

## Base URL

```
Development: http://localhost:8000
Production:  https://your-backend.railway.app
```

## Authentication

All protected endpoints require a Bearer token:

```
Authorization: Bearer <access_token>
```

---

## Health Endpoints

### GET /

Root endpoint returning API info.

**Response:**
```json
{
  "message": "Welcome to MindStash API",
  "version": "0.1.0",
  "status": "running"
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "environment": "development"
}
```

---

## Authentication Endpoints

### POST /api/auth/register

Register a new user account.

**Rate Limit:** 20/hour (IP-based)

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Validation:**
- `email`: Valid email format
- `password`: 8-72 characters

**Response (201 Created):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

**Errors:**
- `400`: Email already registered
- `422`: Validation error (invalid email or password length)
- `429`: Rate limit exceeded

---

### POST /api/auth/login

Authenticate and get tokens.

**Rate Limit:** 60/hour (IP-based)

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

**Errors:**
- `401`: Invalid email or password
- `429`: Rate limit exceeded

---

### POST /api/auth/refresh

Get new access token using refresh token.

**Rate Limit:** 100/hour (IP-based)

**Request Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

**Errors:**
- `401`: Invalid or expired refresh token

---

### GET /api/auth/me

Get current authenticated user.

**Rate Limit:** 500/hour (user-based)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Errors:**
- `401`: Invalid or expired token

---

## Items Endpoints

### POST /api/items/

Create a new item with AI categorization.

**Rate Limit:** 30/hour (user-based) - Protects AI API costs

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "content": "Call John tomorrow about the meeting",
  "url": "https://example.com/optional"
}
```

**Validation:**
- `content`: 1-500 characters (required)
- `url`: Valid URL format (optional)

**Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "550e8400-e29b-41d4-a716-446655440001",
  "content": "Call John tomorrow about the meeting",
  "url": null,
  "category": "people",
  "tags": ["follow-up", "meeting"],
  "summary": "Schedule a call with John regarding the meeting",
  "confidence": 0.92,
  "priority": "medium",
  "time_sensitivity": "this_week",
  "intent": "task",
  "action_required": true,
  "urgency": "medium",
  "time_context": "next_week",
  "resurface_strategy": "time_based",
  "suggested_bucket": "Today",
  "notification_date": "2024-01-16T09:00:00Z",
  "notification_frequency": "once",
  "next_notification_at": "2024-01-16T09:00:00Z",
  "notification_enabled": true,
  "is_completed": false,
  "completed_at": null,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

**Errors:**
- `401`: Unauthorized
- `422`: Content exceeds 500 characters
- `429`: Rate limit exceeded (max 30 items/hour)

---

### GET /api/items/

List items with filtering, search, and pagination.

**Rate Limit:** 200/hour (user-based)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `module` | string | Filter by module view | `today`, `tasks`, `read_later`, `ideas`, `insights`, `all` |
| `category` | string | Filter by category | `read`, `tasks`, `ideas`, etc. |
| `search` | string | Search content/summary | `meeting` |
| `urgency_filter` | string | Filter by urgency | `low`, `medium`, `high` |
| `tag` | string | Filter by tag | `productivity` |
| `page` | integer | Page number (≥1) | `1` |
| `page_size` | integer | Items per page (1-100) | `20` |

**Module Definitions:**

| Module | Filter Logic |
|--------|--------------|
| `all` | No filter |
| `today` | High urgency OR immediate time_context OR smart resurfacing |
| `tasks` | category=tasks OR (action_required=true AND intent=task) |
| `read_later` | category IN [read, watch, learn] OR intent=learn |
| `ideas` | category=ideas OR intent=idea |
| `insights` | category IN [journal, notes] OR intent=reflection |

**Example Request:**
```
GET /api/items/?module=tasks&urgency_filter=high&page=1&page_size=20
```

**Response (200 OK):**
```json
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "content": "Call John tomorrow",
      "category": "tasks",
      "tags": ["follow-up"],
      "summary": "Follow up with John",
      "confidence": 0.92,
      "urgency": "high",
      "action_required": true,
      "is_completed": false,
      "created_at": "2024-01-15T10:30:00Z",
      ...
    }
  ],
  "total": 42,
  "page": 1,
  "page_size": 20
}
```

**Errors:**
- `400`: Invalid module or category
- `401`: Unauthorized
- `429`: Rate limit exceeded

---

### GET /api/items/counts

Get item counts per module.

**Rate Limit:** 100/hour (user-based)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "all": 42,
  "today": 5,
  "tasks": 12,
  "read_later": 8,
  "ideas": 6,
  "insights": 4,
  "archived": 0
}
```

---

### GET /api/items/{item_id}

Get a single item by ID.

**Rate Limit:** 300/hour (user-based)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "550e8400-e29b-41d4-a716-446655440001",
  "content": "Call John tomorrow about the meeting",
  "category": "people",
  "tags": ["follow-up", "meeting"],
  "summary": "Schedule a call with John",
  "confidence": 0.92,
  ...
}
```

**Errors:**
- `401`: Unauthorized
- `404`: Item not found

---

### PUT /api/items/{item_id}

Update an existing item.

**Rate Limit:** 50/hour (user-based)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body (all fields optional):**
```json
{
  "content": "Updated content",
  "url": "https://example.com",
  "category": "tasks",
  "tags": ["updated", "tags"],
  "priority": "high",
  "urgency": "high",
  "intent": "task",
  "time_context": "immediate",
  "resurface_strategy": "time_based",
  "action_required": true
}
```

**Validation:**
- `content`: 1-500 characters
- `category`: Must be one of 12 valid categories
- `tags`: Array of strings (auto-lowercased)

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "content": "Updated content",
  "category": "tasks",
  ...
}
```

**Errors:**
- `400`: Invalid category
- `401`: Unauthorized
- `404`: Item not found
- `422`: Content exceeds 500 characters
- `429`: Rate limit exceeded

---

### DELETE /api/items/{item_id}

Delete an item.

**Rate Limit:** 50/hour (user-based)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (204 No Content):**
No body returned.

**Errors:**
- `401`: Unauthorized
- `404`: Item not found
- `429`: Rate limit exceeded

---

### POST /api/items/mark-surfaced

Mark items as surfaced (shown in Today module).

**Rate Limit:** 100/hour (user-based)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "item_ids": [
    "550e8400-e29b-41d4-a716-446655440000",
    "550e8400-e29b-41d4-a716-446655440001"
  ]
}
```

**Response (200 OK):**
```json
{
  "updated_count": 2,
  "message": "Successfully marked 2 item(s) as surfaced"
}
```

**Errors:**
- `400`: No valid item IDs provided
- `401`: Unauthorized
- `429`: Rate limit exceeded

---

### POST /api/items/{item_id}/complete

Mark an item as complete or incomplete.

**Rate Limit:** 100/hour (user-based)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `completed` | boolean | Yes | `true` to mark complete, `false` for incomplete |

**Example Request:**
```
POST /api/items/550e8400.../complete?completed=true
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "is_completed": true,
  "completed_at": "2024-01-15T14:30:00Z",
  "notification_enabled": false,
  ...
}
```

**Side Effects:**
- When marking complete:
  - Sets `completed_at` timestamp
  - Disables notifications for recurring items
  - Sets `next_notification_at` to null
- When marking incomplete:
  - Clears `completed_at`
  - Re-enables notifications if `notification_date` exists

**Errors:**
- `401`: Unauthorized
- `404`: Item not found
- `429`: Rate limit exceeded

---

## Notification Endpoints

### GET /api/notifications/upcoming

Get upcoming notifications for the next 7 days.

**Rate Limit:** 100/hour (user-based)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "notifications": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "content": "Call John tomorrow",
      "next_notification_at": "2024-01-16T09:00:00Z",
      "notification_frequency": "once",
      "category": "people"
    }
  ],
  "count": 1
}
```

---

### GET /api/notifications/digest-preview

Get preview of weekly digest content.

**Rate Limit:** 50/hour (user-based)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "urgent_items": [...],
  "pending_tasks": [...],
  "upcoming_notifications": [...],
  "items_saved_this_week": 15,
  "items_completed_this_week": 8
}
```

---

## Error Response Format

All errors follow this format:

```json
{
  "detail": "Error message describing what went wrong"
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created |
| 204 | No Content - Deletion successful |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid/missing token |
| 404 | Not Found - Resource doesn't exist |
| 422 | Unprocessable Entity - Validation failed |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |

---

## Rate Limits Summary

| Endpoint | Limit | Key |
|----------|-------|-----|
| POST /auth/register | 20/hour | IP |
| POST /auth/login | 60/hour | IP |
| POST /auth/refresh | 100/hour | IP |
| GET /auth/me | 500/hour | User |
| POST /items/ | 30/hour | User |
| GET /items/ | 200/hour | User |
| GET /items/counts | 100/hour | User |
| GET /items/{id} | 300/hour | User |
| PUT /items/{id} | 50/hour | User |
| DELETE /items/{id} | 50/hour | User |
| POST /items/mark-surfaced | 100/hour | User |
| POST /items/{id}/complete | 100/hour | User |
| GET /notifications/upcoming | 100/hour | User |
| GET /notifications/digest-preview | 50/hour | User |

---

## Data Types

### Categories (12)

```typescript
type Category =
  | 'read'    // Articles, blogs, documentation
  | 'watch'   // Videos, courses, talks
  | 'ideas'   // Business, product concepts
  | 'tasks'   // Todos, action items
  | 'people'  // Follow-ups, contacts
  | 'notes'   // Reference info, quotes
  | 'goals'   // Long-term objectives
  | 'buy'     // Shopping, products
  | 'places'  // Travel, locations
  | 'journal' // Personal thoughts
  | 'learn'   // Skills, courses
  | 'save';   // General bookmarks
```

### Priority / Urgency

```typescript
type Priority = 'low' | 'medium' | 'high';
type Urgency = 'low' | 'medium' | 'high';
```

### Intent

```typescript
type Intent =
  | 'learn'      // Content to absorb
  | 'task'       // Action required
  | 'reminder'   // Time-based follow-up
  | 'idea'       // Creative concept
  | 'reflection' // Personal thought
  | 'reference'; // Future lookup
```

### Time Context

```typescript
type TimeContext =
  | 'immediate'   // Today
  | 'next_week'   // This week
  | 'someday'     // No rush
  | 'conditional' // When relevant
  | 'date';       // Specific date
```

### Resurface Strategy

```typescript
type ResurfaceStrategy =
  | 'time_based'    // Calendar-based
  | 'contextual'    // Activity-based
  | 'weekly_review' // In digest
  | 'manual';       // User-triggered
```

### Notification Frequency

```typescript
type NotificationFrequency =
  | 'once'    // One-time
  | 'daily'   // Every day
  | 'weekly'  // Every week
  | 'monthly' // Every month
  | 'never';  // No notifications
```

---

## Example Requests

### cURL

```bash
# Register
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'

# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'

# Create item
curl -X POST http://localhost:8000/api/items/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"content": "Buy groceries tomorrow"}'

# List items
curl http://localhost:8000/api/items/?module=tasks&page=1 \
  -H "Authorization: Bearer <token>"

# Update item
curl -X PUT http://localhost:8000/api/items/<id> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"category": "buy", "urgency": "high"}'

# Delete item
curl -X DELETE http://localhost:8000/api/items/<id> \
  -H "Authorization: Bearer <token>"
```

### JavaScript (Axios)

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
});

// Set token after login
api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

// Create item
const { data } = await api.post('/api/items/', {
  content: 'Learn TypeScript this week',
});

// List items
const { data } = await api.get('/api/items/', {
  params: { module: 'tasks', page: 1, page_size: 20 }
});

// Update item
await api.put(`/api/items/${id}`, {
  category: 'learn',
  urgency: 'medium'
});

// Delete item
await api.delete(`/api/items/${id}`);
```
