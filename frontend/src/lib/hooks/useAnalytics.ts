'use client';

import { useEffect, useRef } from 'react';
import { analyticsApi } from '@/lib/api';

/**
 * Fire a single page_view event when the component mounts.
 * Duplicate calls for the same page within the same component lifecycle
 * are silently skipped via a ref guard.
 */
export function usePageView(page: string): void {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    analyticsApi
      .track({
        event_type: 'page_view',
        page,
        referrer: typeof document !== 'undefined' ? document.referrer || undefined : undefined,
      })
      .catch(() => {
        // Analytics failures are silent — never block the user
      });
  }, [page]);
}
