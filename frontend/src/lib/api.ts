import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { TelegramLinkStatus, TelegramLinkCode } from './types/telegram';

// Token storage key
const TOKEN_KEY = 'mindstash_token';

// Plan constants
export const PLAN_FREE = "free";
export const PLAN_STARTER = "starter";
export const PLAN_PRO = "pro";

export const PLAN_PRICING = {
  starter: { monthly_cents: 700, annual_cents: 6700 },
  pro: { monthly_cents: 1500, annual_cents: 14400 },
};

export const PLAN_LIMITS = {
  free: { items_per_month: 30, chat_messages_per_month: 10, semantic_search: false, telegram: false, daily_briefing: false, weekly_digest: false },
  starter: { items_per_month: 200, chat_messages_per_month: 100, semantic_search: false, telegram: true, daily_briefing: false, weekly_digest: true },
  pro: { items_per_month: null, chat_messages_per_month: null, semantic_search: true, telegram: true, daily_briefing: true, weekly_digest: true },
};

// Types matching backend schemas
export interface User {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
  is_admin: boolean;
  is_suspended: boolean;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  is_admin: boolean;
  is_suspended: boolean;
  created_at: string;
}

export interface AdminUserListResponse {
  users: AdminUser[];
  total: number;
  page: number;
  page_size: number;
}

export interface AdminUserUpdate {
  name?: string | null;
  email?: string;
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

// 402 plan limit interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 402) {
      // Will be handled by individual hooks, just pass through
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
  register: async (email: string, password: string, name?: string): Promise<User> => {
    const response = await api.post<User>('/api/auth/register', { email, password, name });
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

  updateProfile: async (name: string | null): Promise<User> => {
    const response = await api.patch<User>('/api/auth/me', { name });
    return response.data;
  },

  changePassword: async (current_password: string, new_password: string): Promise<void> => {
    await api.post('/api/auth/change-password', { current_password, new_password });
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/api/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/api/auth/reset-password', { token, new_password: newPassword });
    return response.data;
  },

  googleLogin: async (idToken: string): Promise<TokenResponse> => {
    const response = await api.post<TokenResponse>('/api/auth/google', { id_token: idToken });
    if (response.data.access_token) {
      setToken(response.data.access_token);
    }
    return response.data;
  },

  deleteAccount: () =>
    api.delete('/api/auth/me'),

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

export interface EmailPreferences {
  daily_briefing_enabled: boolean;
  weekly_digest_enabled: boolean;
  item_reminders_enabled: boolean;
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

  getPreferences: async (): Promise<EmailPreferences> => {
    const response = await api.get<EmailPreferences>('/api/notifications/preferences');
    return response.data;
  },

  updatePreferences: async (prefs: Partial<EmailPreferences>): Promise<EmailPreferences> => {
    const response = await api.patch<EmailPreferences>('/api/notifications/preferences', prefs);
    return response.data;
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

  confirmAction: async (confirmationId: string, confirmed: boolean): Promise<Response> => {
    const token = getToken();
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const response = await fetch(`${baseURL}/api/chat/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ confirmation_id: confirmationId, confirmed }),
    });
    if (!response.ok) {
      if (response.status === 401) {
        clearToken();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
      throw new Error(`Confirmation request failed: ${response.status}`);
    }
    return response;
  },

  getPendingConfirmation: async (
    sessionId: string
  ): Promise<{ has_pending: boolean; confirmation_id?: string; tool?: string; tool_input?: Record<string, unknown>; description?: string }> => {
    const response = await api.get(`/api/chat/sessions/${sessionId}/pending-confirmation`);
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

// Telegram Integration API
export const telegram = {
  getStatus: async (): Promise<TelegramLinkStatus> => {
    const response = await api.get<TelegramLinkStatus>('/api/integrations/telegram/status');
    return response.data;
  },

  generateLink: async (): Promise<TelegramLinkCode> => {
    const response = await api.post<TelegramLinkCode>('/api/integrations/telegram/generate-link');
    return response.data;
  },

  unlink: async (): Promise<void> => {
    await api.delete('/api/integrations/telegram/unlink');
  },
};

// Activity log types
export interface ActivityLog {
  id: string;
  action: string;
  source: string;
  resource_type: string | null;
  resource_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface ActivityLogListResponse {
  logs: ActivityLog[];
  total: number;
  page: number;
  page_size: number;
}

// Analytics types
export interface TrackEventRequest {
  event_type: string;
  page?: string;
  referrer?: string;
}

export interface AnalyticsEvent {
  id: string;
  event_type: string;
  page: string | null;
  ip_address: string | null;
  country: string | null;
  city: string | null;
  region: string | null;
  country_code: string | null;
  user_agent: string | null;
  referrer: string | null;
  user_id: string | null;
  created_at: string;
}

export interface TopPage {
  page: string;
  count: number;
  pct: number;
}

export interface AnalyticsSummaryResponse {
  total_events: number;
  today_events: number;
  unique_ips: number;
  unique_countries: number;
  top_pages: TopPage[];
  event_type_breakdown: Record<string, number>;
}

export interface AnalyticsEventListResponse {
  events: AnalyticsEvent[];
  total: number;
  page: number;
  page_size: number;
}

// Analytics API (public endpoint — no auth required)
export const analyticsApi = {
  track: async (data: TrackEventRequest): Promise<{ ok: boolean }> => {
    const response = await api.post<{ ok: boolean }>('/api/analytics/track', data);
    return response.data;
  },
};

// Admin API
export const adminApi = {
  getUsers: async (page = 1, pageSize = 20, search = ''): Promise<AdminUserListResponse> => {
    const response = await api.get<AdminUserListResponse>('/api/admin/users', {
      params: { page, page_size: pageSize, search },
    });
    return response.data;
  },

  editUser: async (id: string, data: AdminUserUpdate): Promise<AdminUser> => {
    const response = await api.patch<AdminUser>(`/api/admin/users/${id}`, data);
    return response.data;
  },

  suspendUser: async (id: string): Promise<AdminUser> => {
    const response = await api.post<AdminUser>(`/api/admin/users/${id}/suspend`);
    return response.data;
  },

  unsuspendUser: async (id: string): Promise<AdminUser> => {
    const response = await api.post<AdminUser>(`/api/admin/users/${id}/unsuspend`);
    return response.data;
  },

  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`/api/admin/users/${id}`);
  },

  getUserActivity: async (userId: string, page = 1, pageSize = 20): Promise<ActivityLogListResponse> => {
    const response = await api.get<ActivityLogListResponse>(`/api/admin/users/${userId}/activity`, {
      params: { page, page_size: pageSize },
    });
    return response.data;
  },

  getAnalyticsSummary: async (): Promise<AnalyticsSummaryResponse> => {
    const response = await api.get<AnalyticsSummaryResponse>('/api/admin/analytics/summary');
    return response.data;
  },

  getAnalyticsEvents: async (
    page = 1,
    pageSize = 50,
    eventType = '',
    dateFrom = '',
    dateTo = '',
  ): Promise<AnalyticsEventListResponse> => {
    const response = await api.get<AnalyticsEventListResponse>('/api/admin/analytics/events', {
      params: {
        page,
        page_size: pageSize,
        ...(eventType ? { event_type: eventType } : {}),
        ...(dateFrom ? { date_from: dateFrom } : {}),
        ...(dateTo ? { date_to: dateTo } : {}),
      },
    });
    return response.data;
  },
};

// Billing API
export const billing = {
  getStatus: () => api.get("/api/billing/status").then(r => r.data),
  createCheckout: (variantId: string) => api.post("/api/billing/checkout", {
    variant_id: variantId,
    success_url: `${typeof window !== 'undefined' ? window.location.origin : ''}/billing?success=true`,
    cancel_url: `${typeof window !== 'undefined' ? window.location.origin : ''}/billing?canceled=true`,
  }).then(r => r.data),
  openPortal: () => api.post("/api/billing/portal").then(r => r.data),
  cancelSubscription: () => api.post("/api/billing/cancel").then(r => r.data),
  syncSubscription: () => api.post("/api/billing/sync").then(r => r.data),
};

export default api;
