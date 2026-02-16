import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Token storage key
const TOKEN_KEY = 'mindstash_token';

// Types matching backend schemas
export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export type Category =
  | 'read'
  | 'watch'
  | 'ideas'
  | 'tasks'
  | 'people'
  | 'notes'
  | 'goals'
  | 'buy'
  | 'places'
  | 'journal'
  | 'learn'
  | 'save';

export type Priority = 'low' | 'medium' | 'high';
export type TimeSensitivity = 'immediate' | 'this_week' | 'review_weekly' | 'reference';

// AI Intelligence Signal Types
export type Intent = 'learn' | 'task' | 'reminder' | 'idea' | 'reflection' | 'reference';
export type Urgency = 'low' | 'medium' | 'high';
export type TimeContext = 'immediate' | 'next_week' | 'someday' | 'conditional' | 'date';
export type ResurfaceStrategy = 'time_based' | 'contextual' | 'weekly_review' | 'manual';
export type SuggestedBucket = 'Today' | 'Learn Later' | 'Ideas' | 'Reminders' | 'Insights';
export type NotificationFrequency = 'once' | 'daily' | 'weekly' | 'monthly' | 'never';

export interface Item {
  id: string;
  user_id: string;
  content: string;
  url: string | null;
  category: Category | null;
  tags: string[] | null;
  summary: string | null;
  confidence: number | null;
  priority: Priority | null;
  time_sensitivity: TimeSensitivity | null;
  ai_metadata: Record<string, unknown> | null;
  // AI Intelligence Signals
  intent: Intent | null;
  action_required: boolean | null;
  urgency: Urgency | null;
  time_context: TimeContext | null;
  resurface_strategy: ResurfaceStrategy | null;
  suggested_bucket: SuggestedBucket | null;
  // Surfacing tracking
  last_surfaced_at: string | null;
  // Notification fields
  notification_date: string | null;
  notification_frequency: NotificationFrequency | null;
  next_notification_at: string | null;
  last_notified_at: string | null;
  notification_enabled: boolean;
  // Completion tracking
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ItemListResponse {
  items: Item[];
  total: number;
  page: number;
  page_size: number;
}

export interface ItemCreate {
  content: string;
  url?: string;
}

export interface ItemUpdate {
  content?: string;
  url?: string;
  category?: Category;
  tags?: string[];
  priority?: Priority;
  urgency?: Urgency;
  intent?: Intent;
  action_required?: boolean;
  time_context?: TimeContext;
  resurface_strategy?: ResurfaceStrategy;
  summary?: string;
  // Notification fields
  notification_date?: string;
  notification_frequency?: NotificationFrequency;
  notification_enabled?: boolean;
  // Completion tracking
  is_completed?: boolean;
}

// Create axios instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearToken = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
};

// Request interceptor - attach Authorization header
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401 and 429 errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Skip redirect for auth endpoints (login/register) - let them handle their own errors
    const isAuthEndpoint = error.config?.url?.includes('/api/auth/');

    if (error.response?.status === 401 && !isAuthEndpoint) {
      clearToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }

    // Handle rate limit errors (429)
    if (error.response?.status === 429) {
      const data = error.response.data as { detail?: string; retry_after?: number };
      const retryAfter = data?.retry_after || 3600; // Default to 1 hour
      const minutes = Math.ceil(retryAfter / 60);

      // Create custom error with user-friendly message
      const rateLimitError = new Error(
        `You're making too many requests. Please wait ${minutes} minute${minutes > 1 ? 's' : ''} and try again.`
      );
      (rateLimitError as RateLimitError).isRateLimit = true;
      (rateLimitError as RateLimitError).retryAfter = retryAfter;

      return Promise.reject(rateLimitError);
    }

    return Promise.reject(error);
  }
);

// Custom error type for rate limiting
export interface RateLimitError extends Error {
  isRateLimit: boolean;
  retryAfter: number;
}

// Auth API
export const auth = {
  register: async (email: string, password: string): Promise<User> => {
    const response = await api.post<User>('/api/auth/register', { email, password });
    return response.data;
  },

  login: async (email: string, password: string): Promise<TokenResponse> => {
    const response = await api.post<TokenResponse>('/api/auth/login', { email, password });
    if (response.data.access_token) {
      setToken(response.data.access_token);
    }
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>('/api/auth/me');
    return response.data;
  },

  logout: (): void => {
    clearToken();
  },
};

// Filter types for getItems
export interface GetItemsParams {
  module?: string;
  category?: Category;
  search?: string;
  urgency_filter?: string;
  tag?: string;
  page?: number;
  page_size?: number;
}

// Items API
export const items = {
  createItem: async (content: string, url?: string): Promise<Item> => {
    const payload: ItemCreate = { content };
    if (url) payload.url = url;
    const response = await api.post<Item>('/api/items/', payload);
    return response.data;
  },

  getItems: async (params: GetItemsParams = {}): Promise<ItemListResponse> => {
    const queryParams: Record<string, string | number> = {};

    // Add pagination
    queryParams.page = params.page || 1;
    if (params.page_size) queryParams.page_size = params.page_size;

    // Add module filter
    if (params.module && params.module !== 'all') {
      queryParams.module = params.module;
    }

    // Add category filter
    if (params.category) {
      queryParams.category = params.category;
    }

    // Add search term
    if (params.search && params.search.trim()) {
      queryParams.search = params.search.trim();
    }

    // Add urgency filter
    if (params.urgency_filter) {
      queryParams.urgency_filter = params.urgency_filter;
    }

    // Add tag filter
    if (params.tag) {
      queryParams.tag = params.tag;
    }

    const response = await api.get<ItemListResponse>('/api/items/', { params: queryParams });
    return response.data;
  },

  getItem: async (id: string): Promise<Item> => {
    const response = await api.get<Item>(`/api/items/${id}`);
    return response.data;
  },

  updateItem: async (id: string, data: ItemUpdate): Promise<Item> => {
    const response = await api.put<Item>(`/api/items/${id}`, data);
    return response.data;
  },

  deleteItem: async (id: string): Promise<void> => {
    await api.delete(`/api/items/${id}`);
  },

  getCounts: async (): Promise<ItemCounts> => {
    const response = await api.get<ItemCounts>('/api/items/counts/');
    return response.data;
  },

  markSurfaced: async (itemIds: string[]): Promise<void> => {
    await api.post('/api/items/mark-surfaced/', { item_ids: itemIds });
  },

  markComplete: async (itemId: string, completed: boolean): Promise<Item> => {
    const response = await api.post<Item>(`/api/items/${itemId}/complete?completed=${completed}`);
    return response.data;
  },
};

// Item counts per module
export interface ItemCounts {
  all: number;
  today: number;
  tasks: number;
  read_later: number;
  ideas: number;
  insights: number;
  archived: number;
  reminders: number;
}

// Notification types
export interface UpcomingNotification {
  id: string;
  content: string;
  category: Category | null;
  notification_date: string | null;
  next_notification_at: string | null;
  notification_frequency: NotificationFrequency | null;
  summary: string | null;
}

export interface DigestPreview {
  user_email: string;
  urgent_count: number;
  tasks_count: number;
  upcoming_count: number;
  items_saved_this_week: number;
  completed_this_week: number;
  urgent_items: Array<{ id: string; content: string; category: string }>;
  pending_tasks: Array<{ id: string; content: string; category: string }>;
  upcoming_notifications: Array<{ id: string; content: string; notification_date: string | null }>;
}

// Notifications API
export const notifications = {
  getUpcoming: async (daysAhead: number = 7): Promise<{ items: UpcomingNotification[]; count: number }> => {
    const response = await api.get<{ status: string; count: number; days_ahead: number; items: UpcomingNotification[] }>(
      '/api/notifications/upcoming',
      { params: { days_ahead: daysAhead } }
    );
    return { items: response.data.items, count: response.data.count };
  },

  getDigestPreview: async (): Promise<DigestPreview> => {
    const response = await api.get<{ status: string; data: DigestPreview }>('/api/notifications/digest-preview');
    return response.data.data;
  },
};

// Chat API (uses raw fetch for SSE streaming)
export const chat = {
  sendMessage: async (message: string, sessionId?: string): Promise<Response> => {
    const token = getToken();
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const response = await fetch(`${baseURL}/api/chat/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ message, session_id: sessionId }),
    });
    if (!response.ok) {
      if (response.status === 401) {
        clearToken();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
      throw new Error(`Chat request failed: ${response.status}`);
    }
    return response;
  },

  getSessions: async (limit = 20): Promise<{ sessions: ChatSession[]; total: number }> => {
    const response = await api.get('/api/chat/sessions', { params: { limit } });
    return response.data;
  },

  getSessionMessages: async (
    sessionId: string,
    limit = 50
  ): Promise<Array<{ id: string; role: string; content: string | null; tool_calls: unknown[] | null; created_at: string }>> => {
    const response = await api.get(`/api/chat/sessions/${sessionId}/messages`, {
      params: { limit },
    });
    return response.data;
  },
};

// Chat session type (re-exported for convenience)
export interface ChatSession {
  id: string;
  title: string | null;
  agent_type: string;
  is_active: boolean;
  created_at: string;
  last_active_at: string;
  message_count: number;
}

export default api;
