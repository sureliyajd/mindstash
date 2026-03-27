'use client';

import { useQueries } from '@tanstack/react-query';
import { items, notifications, Item, DigestPreview } from '../api';

export const DASHBOARD_HOME_QUERY_KEY = ['dashboard-home'];

export interface DashboardHomeData {
  digest: DigestPreview | undefined;
  todayItems: Item[];
  recentIdeas: Item[];
  readingQueue: Item[];
  activeGoals: Item[];
  isLoading: boolean;
  isError: boolean;
}

export function useDashboardHome(enabled: boolean = true): DashboardHomeData {
  const results = useQueries({
    queries: [
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
    ],
  });

  const [digestResult, todayResult, ideasResult, readingResult, goalsResult] = results;

  return {
    digest: digestResult.data as DigestPreview | undefined,
    todayItems: (todayResult.data as { items: Item[] } | undefined)?.items ?? [],
    recentIdeas: (ideasResult.data as { items: Item[] } | undefined)?.items ?? [],
    readingQueue: (readingResult.data as { items: Item[] } | undefined)?.items ?? [],
    activeGoals: (goalsResult.data as { items: Item[] } | undefined)?.items ?? [],
    isLoading: results.some((r) => r.isLoading),
    isError: results.some((r) => r.isError),
  };
}
