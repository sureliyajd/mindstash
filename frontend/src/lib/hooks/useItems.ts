'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { items, Item, ItemListResponse, ItemUpdate, GetItemsParams, ItemCounts } from '../api';

const ITEMS_QUERY_KEY = ['items'];
const ITEM_COUNTS_QUERY_KEY = ['item-counts'];

export interface UseItemsOptions {
  module?: string;
  search?: string;
  urgencyFilter?: string;
  selectedTags?: string[];
  page?: number;
  enabled?: boolean;
}

export function useItems(options: UseItemsOptions = {}) {
  const queryClient = useQueryClient();
  const {
    module = 'all',
    search = '',
    urgencyFilter,
    selectedTags = [],
    page = 1,
    enabled = true,
  } = options;

  // Build query key that includes all filter params
  const queryKey = [
    ...ITEMS_QUERY_KEY,
    module,
    search,
    urgencyFilter,
    selectedTags.join(','),
    page,
  ];

  // Build API params
  const getApiParams = (): GetItemsParams => {
    const params: GetItemsParams = { page };

    if (module && module !== 'all') {
      params.module = module;
    }

    if (search && search.trim()) {
      params.search = search.trim();
    }

    if (urgencyFilter) {
      params.urgency_filter = urgencyFilter;
    }

    // API only supports single tag filter currently
    if (selectedTags.length > 0) {
      params.tag = selectedTags[0];
    }

    return params;
  };

  // Fetch items with filters
  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery<ItemListResponse>({
    queryKey,
    queryFn: () => items.getItems(getApiParams()),
    enabled,
    placeholderData: (previousData) => previousData, // Keep previous data while fetching
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  // Create item mutation with optimistic update
  const createMutation = useMutation({
    mutationFn: ({ content, url }: { content: string; url?: string }) =>
      items.createItem(content, url),
    onMutate: async ({ content, url }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ITEMS_QUERY_KEY });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<ItemListResponse>(queryKey);

      // Optimistically add the new item
      const optimisticItem: Item = {
        id: `temp-${Date.now()}`,
        user_id: '',
        content,
        url: url || null,
        category: null,
        tags: null,
        summary: null,
        confidence: null,
        priority: null,
        time_sensitivity: null,
        ai_metadata: null,
        intent: null,
        action_required: null,
        urgency: null,
        time_context: null,
        resurface_strategy: null,
        suggested_bucket: null,
        // Notification fields
        notification_date: null,
        notification_frequency: null,
        next_notification_at: null,
        last_notified_at: null,
        notification_enabled: true,
        // Completion tracking
        is_completed: false,
        completed_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      queryClient.setQueryData<ItemListResponse>(
        queryKey,
        (old) => ({
          items: [optimisticItem, ...(old?.items || [])],
          total: (old?.total || 0) + 1,
          page: old?.page || 1,
          page_size: old?.page_size || 20,
        })
      );

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },
    onSuccess: (newItem) => {
      // Replace optimistic item with real one
      queryClient.setQueryData<ItemListResponse>(
        queryKey,
        (old) => ({
          ...old!,
          items: old?.items.map((item) =>
            item.id.startsWith('temp-') ? newItem : item
          ) || [newItem],
        })
      );
      // Invalidate all item queries and counts to ensure consistency
      queryClient.invalidateQueries({ queryKey: ITEMS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ITEM_COUNTS_QUERY_KEY });
    },
  });

  // Update item mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ItemUpdate }) =>
      items.updateItem(id, data),
    onMutate: async ({ id, data: updateData }) => {
      await queryClient.cancelQueries({ queryKey: ITEMS_QUERY_KEY });

      const previousData = queryClient.getQueryData<ItemListResponse>(queryKey);

      // Optimistically update
      queryClient.setQueryData<ItemListResponse>(
        queryKey,
        (old) => ({
          ...old!,
          items: old?.items.map((item) =>
            item.id === id ? { ...item, ...updateData } : item
          ) || [],
        })
      );

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ITEMS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ITEM_COUNTS_QUERY_KEY });
    },
  });

  // Delete item mutation with optimistic update
  const deleteMutation = useMutation({
    mutationFn: (id: string) => items.deleteItem(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ITEMS_QUERY_KEY });

      const previousData = queryClient.getQueryData<ItemListResponse>(queryKey);

      // Optimistically remove the item
      queryClient.setQueryData<ItemListResponse>(
        queryKey,
        (old) => ({
          ...old!,
          items: old?.items.filter((item) => item.id !== id) || [],
          total: (old?.total || 1) - 1,
        })
      );

      return { previousData, deletedId: id };
    },
    onError: (_err, _id, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ITEMS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ITEM_COUNTS_QUERY_KEY });
    },
  });

  // Helper to restore a deleted item (for undo)
  const restoreItem = (item: Item) => {
    queryClient.setQueryData<ItemListResponse>(
      queryKey,
      (old) => ({
        ...old!,
        items: [item, ...(old?.items || [])],
        total: (old?.total || 0) + 1,
      })
    );
  };

  return {
    items: data?.items ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    pageSize: data?.page_size ?? 20,
    isLoading,
    isFetching, // True when refetching with filters
    isError,
    error,
    refetch,
    createItem: createMutation.mutateAsync,
    updateItem: updateMutation.mutateAsync,
    deleteItem: deleteMutation.mutateAsync,
    restoreItem,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    createError: createMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,
  };
}

// Hook to get a single item
export function useItem(id: string) {
  return useQuery<Item>({
    queryKey: ['item', id],
    queryFn: () => items.getItem(id),
    enabled: !!id,
  });
}

// Hook to get item counts per module
export function useItemCounts() {
  const { data, isLoading, isError, refetch } = useQuery<ItemCounts>({
    queryKey: ITEM_COUNTS_QUERY_KEY,
    queryFn: () => items.getCounts(),
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  return {
    counts: data,
    isLoading,
    isError,
    refetch,
  };
}

// Hook to mark items as surfaced (fire-and-forget, no loading state needed)
export function useMarkSurfaced() {
  const mutation = useMutation({
    mutationFn: (itemIds: string[]) => items.markSurfaced(itemIds),
    // Fire-and-forget: no need to handle success/error in UI
  });

  return {
    markSurfaced: mutation.mutate,
  };
}
