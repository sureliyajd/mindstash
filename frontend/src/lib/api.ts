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

// Response interceptor - handle 401 errors
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
    return Promise.reject(error);
  }
);

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
}

export default api;
