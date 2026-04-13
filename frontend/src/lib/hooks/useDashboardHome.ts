'use client';

import { useQueries } from '@tanstack/react-query';
import { items, notifications, Item, DigestPreview, Category } from '../api';

export const DASHBOARD_HOME_QUERY_KEY = ['dashboard-home'];

const EXTRA_CATEGORIES: Category[] = ['people', 'notes', 'journal', 'watch', 'buy', 'places', 'learn', 'save'];

export interface DashboardHomeData {
  digest: DigestPreview | undefined;
  todayItems: Item[];
  recentIdeas: Item[];
  readingQueue: Item[];
  activeGoals: Item[];
  byCategory: Partial<Record<Category, Item[]>>;
  isLoading: boolean;
  isError: boolean;
}

export function useDashboardHome(enabled: boolean = true): DashboardHomeData {
  const baseQueries = [
    {
      queryKey: [...DASHBOARD_HOME_QUERY_KEY, 'digest'],
      queryFn: () => notifications.getDigestPreview(),
      enabled,
      staleTime: 60000,
    },
    {
      queryKey: [...DASHBOARD_HOME_QUERY_KEY, 'today'],
      queryFn: () => items.getItems({ module: 'today', page_size: 5 }),
      enabled,
      staleTime: 60000,
    },
    {
      queryKey: [...DASHBOARD_HOME_QUERY_KEY, 'ideas'],
      queryFn: () => items.getItems({ module: 'ideas', page_size: 3 }),
      enabled,
      staleTime: 60000,
    },
    {
      queryKey: [...DASHBOARD_HOME_QUERY_KEY, 'read_later'],
      queryFn: () => items.getItems({ module: 'read_later', page_size: 3 }),
      enabled,
      staleTime: 60000,
    },
    {
      queryKey: [...DASHBOARD_HOME_QUERY_KEY, 'goals'],
      queryFn: () => items.getItems({ category: 'goals', page_size: 3 }),
      enabled,
      staleTime: 60000,
    },
  ];

  const extraQueries = EXTRA_CATEGORIES.map((cat) => ({
    queryKey: [...DASHBOARD_HOME_QUERY_KEY, `cat-${cat}`],
    queryFn: () => items.getItems({ category: cat, page_size: 3 }),
    enabled,
    staleTime: 60000,
  }));

  const results = useQueries({ queries: [...baseQueries, ...extraQueries] });

  const [digestResult, todayResult, ideasResult, readingResult, goalsResult, ...categoryResults] = results;

  const byCategory: Partial<Record<Category, Item[]>> = {};
  EXTRA_CATEGORIES.forEach((cat, idx) => {
    const data = categoryResults[idx]?.data as { items: Item[] } | undefined;
    byCategory[cat] = data?.items ?? [];
  });

  return {
    digest: digestResult.data as DigestPreview | undefined,
    todayItems: (todayResult.data as { items: Item[] } | undefined)?.items ?? [],
    recentIdeas: (ideasResult.data as { items: Item[] } | undefined)?.items ?? [],
    readingQueue: (readingResult.data as { items: Item[] } | undefined)?.items ?? [],
    activeGoals: (goalsResult.data as { items: Item[] } | undefined)?.items ?? [],
    byCategory,
    isLoading: results.some((r) => r.isLoading),
    isError: results.some((r) => r.isError),
  };
}
