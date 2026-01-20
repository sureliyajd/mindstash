# MindStash Frontend Documentation

> Next.js 16 + React 19 + TypeScript + Tailwind CSS 4

## Overview

The frontend is a modern React application using Next.js App Router with server and client components. It features a Spotify-inspired design with warm coral brand colors and smooth Framer Motion animations.

## Tech Stack

| Package | Version | Purpose |
|---------|---------|---------|
| next | 16.1.1 | React framework |
| react | 19.2.3 | UI library |
| typescript | 5.x | Type safety |
| tailwindcss | 4.x | Styling |
| framer-motion | latest | Animations |
| @tanstack/react-query | 5.90.16 | Server state |
| axios | latest | HTTP client |
| lucide-react | latest | Icons |
| date-fns | latest | Date formatting |

## Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout with providers
│   │   ├── page.tsx            # Landing page
│   │   ├── globals.css         # Global styles & CSS variables
│   │   ├── login/
│   │   │   └── page.tsx        # Login page
│   │   ├── register/
│   │   │   └── page.tsx        # Registration page
│   │   └── dashboard/
│   │       └── page.tsx        # Main dashboard (protected)
│   │
│   ├── components/             # React components
│   │   ├── Providers.tsx       # Global providers (Query, Toast)
│   │   ├── ProtectedRoute.tsx  # Auth route guards
│   │   ├── CaptureInput.tsx    # 500-char thought input
│   │   ├── ItemCard.tsx        # Item display card
│   │   ├── ItemDetailModal.tsx # Full item details
│   │   ├── ItemEditModal.tsx   # Edit item form
│   │   ├── DeleteConfirmModal.tsx
│   │   ├── ModuleSelector.tsx  # Module tabs
│   │   ├── SearchBar.tsx       # Debounced search
│   │   ├── FilterPanel.tsx     # Category/urgency filters
│   │   ├── EmptyState.tsx      # Empty state displays
│   │   ├── AIProcessing.tsx    # AI loading animation
│   │   ├── AnimatedBackground.tsx
│   │   └── Skeletons.tsx       # Loading skeletons
│   │
│   └── lib/                    # Utilities
│       ├── api.ts              # Axios client & API functions
│       ├── hooks/
│       │   ├── useAuth.ts      # Authentication hook
│       │   └── useItems.ts     # Items CRUD hook
│       └── aiTranslations.ts   # AI field translations
│
├── public/                     # Static assets
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## Core Concepts

### 1. App Router (Next.js 16)

All pages use the new App Router with the `app/` directory:

```typescript
// app/layout.tsx - Root layout
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### 2. Server State with React Query

All API data is managed with TanStack Query for automatic caching, refetching, and optimistic updates:

```typescript
// Example from useItems.ts
const { data, isLoading, error } = useQuery({
  queryKey: ['items', params],
  queryFn: () => getItems(params),
  staleTime: 30000, // 30 seconds
});
```

### 3. Protected Routes

Routes requiring authentication use the `ProtectedRoute` wrapper:

```typescript
// components/ProtectedRoute.tsx
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) return <AuthLoadingSkeleton />;
  if (!isAuthenticated) return null;
  return <>{children}</>;
}
```

## Pages

### Landing Page (`app/page.tsx`)

The public landing page with:
- Hero section with animated brain GIF
- "How it works" 3-step section
- Benefits showcase
- CTA footer

Key animations:
```typescript
// Stagger children animation
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

// Fade up animation
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};
```

### Dashboard Page (`app/dashboard/page.tsx`)

The main application interface featuring:

1. **CaptureInput** - Top input for adding thoughts
2. **ModuleSelector** - Horizontal module tabs
3. **SearchBar** - Debounced search input
4. **FilterPanel** - Expandable filters
5. **ItemCard Grid** - Masonry-style card layout
6. **Modals** - View/Edit/Delete modals

State management:
```typescript
// Module selection
const [currentModule, setCurrentModule] = useState<Module>('all');

// Search with debounce
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearch = useDebounce(searchTerm, 500);

// Filters
const { filters, setCategory, setUrgency, clearFilters } = useFilterState();

// Pagination
const [page, setPage] = useState(1);
const pageSize = 20;
```

## Components

### CaptureInput

The primary input for adding thoughts:

```typescript
interface CaptureInputProps {
  onSubmit: (content: string, url?: string) => Promise<void>;
  isSubmitting?: boolean;
}
```

Features:
- **500-character limit** with visual counter
- **Auto-resize** textarea (80px min, 300px max)
- **URL extraction** from content
- **Keyboard shortcut** (Cmd/Ctrl + Enter)
- **AI processing indicator** with cycling messages
- **Success animation** on save

Key implementation:
```typescript
// Auto-resize textarea
const adjustTextareaHeight = useCallback(() => {
  const textarea = textareaRef.current;
  if (textarea) {
    textarea.style.height = 'auto';
    const newHeight = Math.max(80, Math.min(textarea.scrollHeight, 300));
    textarea.style.height = `${newHeight}px`;
  }
}, []);

// URL extraction
const extractUrl = (text: string): string | undefined => {
  const urlMatch = text.match(/(https?:\/\/[^\s]+)/);
  return urlMatch ? urlMatch[0] : undefined;
};
```

### ItemCard

Displays a single item with expandable details:

```typescript
interface ItemCardProps {
  item: Item;
  onViewDetails?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}
```

Features:
- **Category badge** with icon and color
- **Confidence score** (colored by threshold)
- **Status badges** (Urgent, Action Required)
- **Tags** (first 3 + count)
- **Expandable** on click
- **Context menu** (3-dot menu)
- **Optimistic state** for new items

Expanded view shows:
- Full content with preserved newlines
- AI summary
- Intent, urgency, action badges
- URL link
- "View Full Details" button

### ModuleSelector

Horizontal module tabs with counts:

```typescript
const modules = [
  { id: 'all', label: 'All', icon: Grid3X3 },
  { id: 'today', label: 'Today', icon: Sparkles },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'read_later', label: 'Read Later', icon: BookOpen },
  { id: 'ideas', label: 'Ideas', icon: Lightbulb },
  { id: 'insights', label: 'Insights', icon: Brain },
];
```

Features:
- Animated underline indicator
- Item count badges
- Keyboard navigation

### FilterPanel

Expandable filter panel:

```typescript
interface FilterPanelProps {
  filters: FilterState;
  onCategoryChange: (category: Category | null) => void;
  onUrgencyChange: (urgency: Urgency | null) => void;
  onTagSelect: (tag: string | null) => void;
  onClearAll: () => void;
  availableTags?: string[];
}
```

Features:
- 12-category grid
- Urgency level buttons
- Tag search/filter
- Active filter count badge
- Clear all button

### SearchBar

Debounced search input:

```typescript
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number; // default 500
}
```

Features:
- Configurable debounce delay
- Clear button with animation
- Keyboard shortcuts (Esc to clear)

## Hooks

### useAuth

Authentication state and actions:

```typescript
const {
  user,           // Current user or null
  isLoading,      // Loading state
  isAuthenticated,// Boolean auth status
  login,          // Login mutation
  register,       // Register mutation
  logout,         // Logout function
  loginError,     // Login error
  registerError,  // Register error
} = useAuth();
```

### useItems

Items CRUD operations:

```typescript
const {
  items,          // Item array
  total,          // Total count
  isLoading,      // Loading state
  error,          // Error state
  createItem,     // Create mutation
  updateItem,     // Update mutation
  deleteItem,     // Delete mutation
  refetch,        // Refetch function
} = useItems({
  module: 'all',
  search: '',
  category: null,
  urgency: null,
  tag: null,
  page: 1,
  pageSize: 20,
});
```

Optimistic updates example:
```typescript
const createItem = useMutation({
  mutationFn: api.createItem,
  onMutate: async (newItem) => {
    await queryClient.cancelQueries({ queryKey: ['items'] });

    // Snapshot previous value
    const previous = queryClient.getQueryData(['items']);

    // Optimistically update
    queryClient.setQueryData(['items'], (old) => ({
      ...old,
      items: [{ ...newItem, id: 'temp-' + Date.now() }, ...old.items],
    }));

    return { previous };
  },
  onError: (err, variables, context) => {
    // Rollback on error
    queryClient.setQueryData(['items'], context?.previous);
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['items'] });
  },
});
```

### useItemCounts

Module item counts:

```typescript
const { counts, isLoading } = useItemCounts();
// counts = { all: 42, today: 3, tasks: 7, ... }
```

## API Client (`lib/api.ts`)

### Configuration

```typescript
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' },
});
```

### Request Interceptor

Adds JWT token to all requests:

```typescript
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Response Interceptor

Handles auth errors and rate limits:

```typescript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearToken();
      window.location.href = '/login';
    }
    if (error.response?.status === 429) {
      // Show rate limit toast
    }
    return Promise.reject(error);
  }
);
```

### Token Management

```typescript
const TOKEN_KEY = 'mindstash_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);
```

### API Functions

```typescript
// Auth
export const register = (email: string, password: string) =>
  api.post('/api/auth/register', { email, password });

export const login = (email: string, password: string) =>
  api.post('/api/auth/login', { email, password });

export const getCurrentUser = () =>
  api.get('/api/auth/me');

// Items
export const createItem = (data: ItemCreate) =>
  api.post('/api/items/', data);

export const getItems = (params: GetItemsParams) =>
  api.get('/api/items/', { params });

export const updateItem = (id: string, data: ItemUpdate) =>
  api.put(`/api/items/${id}`, data);

export const deleteItem = (id: string) =>
  api.delete(`/api/items/${id}`);

export const markComplete = (id: string, completed: boolean) =>
  api.post(`/api/items/${id}/complete`, null, { params: { completed } });
```

## Types

### Core Types

```typescript
export type Category =
  | 'read' | 'watch' | 'ideas' | 'tasks' | 'people' | 'notes'
  | 'goals' | 'buy' | 'places' | 'journal' | 'learn' | 'save';

export type Priority = 'low' | 'medium' | 'high';
export type Urgency = 'low' | 'medium' | 'high';
export type Intent = 'learn' | 'task' | 'reminder' | 'idea' | 'reflection' | 'reference';
export type TimeContext = 'immediate' | 'next_week' | 'someday' | 'conditional' | 'date';
export type ResurfaceStrategy = 'time_based' | 'contextual' | 'weekly_review' | 'manual';
export type NotificationFrequency = 'once' | 'daily' | 'weekly' | 'monthly' | 'never';
export type Module = 'all' | 'today' | 'tasks' | 'read_later' | 'ideas' | 'insights';
```

### Item Type

```typescript
export interface Item {
  id: string;
  user_id: string;
  content: string;
  url?: string;
  category: Category;
  tags: string[];
  summary?: string;
  confidence?: number;
  priority?: Priority;
  time_sensitivity?: string;
  ai_metadata?: Record<string, unknown>;
  intent?: Intent;
  action_required?: boolean;
  urgency?: Urgency;
  time_context?: TimeContext;
  resurface_strategy?: ResurfaceStrategy;
  suggested_bucket?: string;
  last_surfaced_at?: string;
  notification_date?: string;
  notification_frequency?: NotificationFrequency;
  next_notification_at?: string;
  notification_enabled?: boolean;
  is_completed?: boolean;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}
```

## Styling

### Brand Colors (CSS Variables)

```css
:root {
  --brand-coral: #EA7B7B;      /* Primary */
  --brand-yellow: #FACE68;     /* Highlights */
  --brand-teal: #79C9C5;       /* Info/Learning */
  --brand-orange: #FF8364;     /* Urgent */
  --brand-green: #93DA97;      /* Success */
}
```

### Tailwind Custom Classes

```css
/* From globals.css */
.btn-primary {
  background: var(--brand-coral);
  color: white;
  font-weight: 600;
  border-radius: 9999px;
}

.hover-lift {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.1);
}
```

### Focus Styles

Global focus-visible style (overridden in CaptureInput):

```css
:focus-visible {
  outline: 2px solid var(--brand-coral);
  outline-offset: 2px;
}
```

## Animations (Framer Motion)

### Card Entrance

```typescript
const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, scale: 0.98 }
};
```

### Hover Effects

```typescript
whileHover={{ y: -2 }}
whileTap={{ scale: 0.98 }}
```

### Expand/Collapse

```typescript
<AnimatePresence>
  {isExpanded && (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Content */}
    </motion.div>
  )}
</AnimatePresence>
```

### Processing Indicator

```typescript
// Cycling messages
const messages = ['Understanding...', 'Analyzing...', 'Categorizing...'];
const [index, setIndex] = useState(0);

useEffect(() => {
  if (isProcessing) {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % messages.length);
    }, 1500);
    return () => clearInterval(interval);
  }
}, [isProcessing]);
```

## Environment Variables

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

For production (Vercel):
```bash
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## Key Design Decisions

1. **App Router over Pages Router**: Better layouts, server components
2. **React Query over Redux**: Server state vs client state separation
3. **Optimistic Updates**: Instant UI feedback
4. **Framer Motion**: Smooth, declarative animations
5. **Tailwind CSS 4**: Utility-first with CSS variables
6. **Lucide Icons**: Modern, tree-shakeable icons
7. **TypeScript Strict Mode**: Full type safety
