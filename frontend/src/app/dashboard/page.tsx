'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, RefreshCw, WifiOff, Search as SearchIcon, Loader2 } from 'lucide-react';
import { CaptureInput } from '@/components/CaptureInput';
import { ItemCard } from '@/components/ItemCard';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardSkeleton } from '@/components/Skeletons';
import { useToast } from '@/components/Providers';
import { ModuleSelector, type ModuleType } from '@/components/ModuleSelector';
import { SearchBar } from '@/components/SearchBar';
import { FilterPanel, type UrgencyLevel } from '@/components/FilterPanel';
import { ItemDetailModal } from '@/components/ItemDetailModal';
import { ItemEditModal } from '@/components/ItemEditModal';
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal';
import { EmptyState } from '@/components/EmptyState';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { useItems, useItemCounts, useMarkSurfaced } from '@/lib/hooks/useItems';
import { useAuth } from '@/lib/hooks/useAuth';
import { Item, Category, ItemUpdate } from '@/lib/api';

// =============================================================================
// SEARCH EMPTY STATE (for when search has no results)
// =============================================================================

interface SearchEmptyStateProps {
  searchTerm: string;
}

function SearchEmptyState({ searchTerm }: SearchEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="flex flex-col items-center justify-center py-24"
    >
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100">
        <SearchIcon className="h-10 w-10 text-gray-400" />
      </div>
      <h3 className="mb-2 text-xl font-semibold text-gray-900">No matches found</h3>
      <p className="max-w-sm text-center text-gray-500">
        No memories match &quot;{searchTerm}&quot;
      </p>
    </motion.div>
  );
}

// =============================================================================
// ERROR STATE COMPONENT
// =============================================================================

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-24"
    >
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-red-50">
        <RefreshCw className="h-10 w-10 text-red-400" />
      </div>
      <h3 className="mb-2 text-xl font-semibold text-gray-900">
        Something went wrong
      </h3>
      <p className="mb-6 max-w-sm text-center text-gray-500">
        We couldn&apos;t load your memories. Please try again.
      </p>
      <button
        onClick={onRetry}
        className="rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-gray-800"
      >
        Try again
      </button>
    </motion.div>
  );
}

// =============================================================================
// OFFLINE BANNER COMPONENT
// =============================================================================

function OfflineBanner() {
  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -50, opacity: 0 }}
      className="fixed left-0 right-0 top-0 z-50 flex items-center justify-center gap-2 bg-amber-50 border-b border-amber-100 py-3"
    >
      <WifiOff className="h-4 w-4 text-amber-600" />
      <span className="text-sm font-medium text-amber-700">
        You&apos;re offline. Changes will sync when you reconnect.
      </span>
    </motion.div>
  );
}

// =============================================================================
// CARD GRID COMPONENT
// =============================================================================

interface CardGridProps {
  items: Item[];
  currentModule: string;
  onViewDetails: (item: Item) => void;
  onEdit: (item: Item) => void;
  onDelete: (item: Item) => void;
  onToggleComplete: (item: Item, completed: boolean) => void;
  isFetching?: boolean;
}

function CardGrid({ items, currentModule, onViewDetails, onEdit, onDelete, onToggleComplete, isFetching }: CardGridProps) {
  return (
    <div className="relative">
      {/* Subtle loading overlay when fetching */}
      <AnimatePresence>
        {isFetching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 z-10 flex items-start justify-center pt-20"
          >
            <div className="rounded-full bg-white px-4 py-2 shadow-lg ring-1 ring-gray-100">
              <span className="text-sm text-gray-600">Updating...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Masonry grid */}
      <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
        <AnimatePresence mode="popLayout">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.02, duration: 0.3 }}
              className="mb-5 break-inside-avoid"
            >
              <ItemCard
                item={item}
                currentModule={currentModule}
                onViewDetails={() => onViewDetails(item)}
                onEdit={() => onEdit(item)}
                onDelete={() => onDelete(item)}
                onToggleComplete={(completed) => onToggleComplete(item, completed)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN DASHBOARD CONTENT
// =============================================================================

function DashboardContent() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  // ==========================================================================
  // FILTER STATE
  // ==========================================================================
  const [selectedModule, setSelectedModule] = useState<ModuleType>('all');
  const [searchValue, setSearchValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyLevel | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // ==========================================================================
  // PAGINATION STATE
  // ==========================================================================
  const [page, setPage] = useState(1);
  const [allItems, setAllItems] = useState<Item[]>([]);

  // ==========================================================================
  // FETCH ITEMS WITH FILTERS
  // ==========================================================================
  const {
    items: pageItems,
    total,
    isLoading,
    isFetching,
    isError,
    refetch,
    createItem,
    updateItem,
    deleteItem: deleteItemMutation,
    markComplete,
    restoreItem,
    isCreating,
    isUpdating,
  } = useItems({
    module: selectedModule,
    search: searchTerm,
    urgencyFilter: urgencyFilter || undefined,
    selectedTags,
    page,
  });

  // Reset to page 1 when any server-side filter changes
  useEffect(() => {
    setPage(1);
  }, [selectedModule, searchTerm, urgencyFilter, selectedTags.join(',')]);

  // Accumulate items across pages (replace on page 1, append on page > 1)
  useEffect(() => {
    setAllItems((prev) => {
      if (page === 1) return pageItems;
      const existingIds = new Set(prev.map((i) => i.id));
      return [...prev, ...pageItems.filter((i) => !existingIds.has(i.id))];
    });
  }, [pageItems, page]);

  // Fetch item counts per module
  const { counts: itemCounts } = useItemCounts();

  // Smart resurfacing tracking (only for "Today" module)
  const { markSurfaced } = useMarkSurfaced();
  const surfacedItemsRef = useRef<Set<string>>(new Set());

  // Track surfaced items for "Today" module with 2-second debounce
  useEffect(() => {
    // Only track for "Today" module
    if (selectedModule !== 'today') return;
    // Skip if loading or no items
    if (isLoading || allItems.length === 0) return;

    // Get item IDs that haven't been marked yet
    const newItemIds = allItems
      .filter((item) => !surfacedItemsRef.current.has(item.id))
      .map((item) => item.id);

    // Skip if all items already marked
    if (newItemIds.length === 0) return;

    // Debounce: Wait 2 seconds to ensure user actually saw the items
    const timer = setTimeout(() => {
      markSurfaced(newItemIds);
      // Track locally to avoid duplicate calls
      newItemIds.forEach((id) => surfacedItemsRef.current.add(id));
    }, 2000);

    return () => clearTimeout(timer);
  }, [selectedModule, allItems, isLoading, markSurfaced]);

  // ==========================================================================
  // UI STATE - MODALS
  // ==========================================================================
  const [detailItem, setDetailItem] = useState<Item | null>(null);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [deleteItem, setDeleteItem] = useState<Item | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  // Track online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ==========================================================================
  // FILTER ITEMS BY CATEGORY (client-side on accumulated list)
  // ==========================================================================
  const filteredItems = useMemo(() => {
    if (!selectedCategory) return allItems;
    return allItems.filter((item) => item.category === selectedCategory);
  }, [allItems, selectedCategory]);

  // ==========================================================================
  // EXTRACT AVAILABLE TAGS FROM ALL ACCUMULATED ITEMS
  // ==========================================================================
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    allItems.forEach((item) => {
      if (item.tags && Array.isArray(item.tags)) {
        item.tags.forEach((tag) => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }, [allItems]);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  // Handle debounced search
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  // Handle module change
  const handleModuleChange = useCallback((module: ModuleType) => {
    setSelectedModule(module);
  }, []);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setUrgencyFilter(null);
    setSelectedTags([]);
    setSelectedCategory(null);
  }, []);

  // Load next page
  const handleLoadMore = useCallback(() => {
    setPage((p) => p + 1);
  }, []);

  // Handle item creation — reset to page 1 so new item appears at top
  const handleCreate = async (content: string, url?: string) => {
    try {
      await createItem({ content, url });
      setPage(1);
    } catch {
      showToast('Failed to save your thought. Please try again.', 'error');
      throw new Error('Failed to create item');
    }
  };

  // Handle view details (opens detail modal)
  const handleViewDetails = useCallback((item: Item) => {
    setDetailItem(item);
  }, []);

  // Handle edit (opens edit modal)
  const handleEdit = useCallback((item: Item) => {
    setEditItem(item);
    setDetailItem(null); // Close detail modal if open
  }, []);

  // Handle save from edit modal
  const handleSaveEdit = useCallback(async (updates: ItemUpdate) => {
    if (!editItem) return;
    try {
      await updateItem({ id: editItem.id, data: updates });
      setEditItem(null);
      setAllItems((prev) => prev.map((i) => i.id === editItem.id ? { ...i, ...updates } : i));
      showToast('Changes saved successfully', 'success');
    } catch {
      showToast('Failed to save changes. Please try again.', 'error');
    }
  }, [editItem, updateItem, showToast]);

  // Handle delete (opens delete confirmation modal)
  const handleDeleteClick = useCallback((item: Item) => {
    setDeleteItem(item);
    setDetailItem(null); // Close detail modal if open
  }, []);

  // Handle mark complete/incomplete
  const handleMarkComplete = useCallback(
    async (item: Item, completed: boolean) => {
      try {
        await markComplete({ id: item.id, completed });
        const completedAt = completed ? new Date().toISOString() : null;
        setAllItems((prev) =>
          prev.map((i) => i.id === item.id ? { ...i, is_completed: completed, completed_at: completedAt } : i)
        );
        // Sync open detail modal state
        if (detailItem?.id === item.id) {
          setDetailItem((prev) =>
            prev ? { ...prev, is_completed: completed, completed_at: completedAt } : null
          );
        }
        showToast(completed ? 'Marked as complete!' : 'Marked as incomplete', 'success');
      } catch {
        showToast('Failed to update item', 'error');
      }
    },
    [markComplete, detailItem, showToast]
  );

  // Handle confirm delete
  const handleConfirmDelete = useCallback(async () => {
    if (!deleteItem) return;
    const itemToDelete = deleteItem;
    try {
      await deleteItemMutation(itemToDelete.id);
      setDeleteItem(null);
      setAllItems((prev) => prev.filter((i) => i.id !== itemToDelete.id));
      showToast('Memory deleted', 'info', {
        label: 'Undo',
        onClick: () => {
          restoreItem(itemToDelete);
          setAllItems((prev) => [itemToDelete, ...prev]);
          showToast('Memory restored', 'success');
        },
      });
    } catch {
      showToast('Failed to delete. Please try again.', 'error');
    }
  }, [deleteItem, deleteItemMutation, restoreItem, showToast]);

  // Handle logout
  const handleLogout = () => {
    logout();
    showToast('Logged out successfully', 'success');
  };

  // ==========================================================================
  // DERIVED STATE
  // ==========================================================================
  const hasItems = filteredItems.length > 0;
  const hasActiveFilters = urgencyFilter !== null || selectedTags.length > 0 || selectedCategory !== null;
  const isFirstTimeUser = !isLoading && allItems.length === 0 && selectedModule === 'all' && !searchTerm;
  const hasSearchWithNoResults = searchTerm && searchTerm.trim().length > 0 && filteredItems.length === 0;
  // Only count real (non-optimistic) items when determining if more pages exist
  const realItemCount = allItems.filter((i) => !i.id.startsWith('temp-')).length;
  const hasMore = !selectedCategory && realItemCount < total && !isFetching;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Offline banner */}
      <AnimatePresence>{!isOnline && <OfflineBanner />}</AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center">
            <img
              src="/logo.png"
              alt="MindStash"
              className="h-10 sm:h-12 w-auto"
            />
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <span className="hidden text-sm text-gray-500 sm:block">
                {user.email}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Controls section */}
        <div className="space-y-6 pb-8">
          {/* Capture Input */}
          <CaptureInput onSubmit={handleCreate} isSubmitting={isCreating} />

          {/* Search Bar */}
          <SearchBar
            value={searchValue}
            onChange={setSearchValue}
            onSearch={handleSearch}
          />

          {/* Module Selector */}
          <ModuleSelector
            selectedModule={selectedModule}
            onModuleChange={handleModuleChange}
            itemCounts={itemCounts}
          />

          {/* Filter Panel */}
          <FilterPanel
            urgencyFilter={urgencyFilter}
            selectedTags={selectedTags}
            availableTags={availableTags}
            selectedCategory={selectedCategory}
            onUrgencyChange={setUrgencyFilter}
            onTagsChange={setSelectedTags}
            onCategoryChange={setSelectedCategory}
            onClearFilters={handleClearFilters}
          />
        </div>

        {/* Content area */}
        <div className="relative">
          {isLoading && allItems.length === 0 ? (
            <DashboardSkeleton />
          ) : isError ? (
            <ErrorState onRetry={refetch} />
          ) : hasSearchWithNoResults ? (
            <SearchEmptyState searchTerm={searchTerm} />
          ) : hasItems ? (
            <>
              <CardGrid
                items={filteredItems}
                currentModule={selectedModule}
                onViewDetails={handleViewDetails}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
                onToggleComplete={handleMarkComplete}
                isFetching={isFetching && allItems.length === 0}
              />

              {/* Pagination footer */}
              <div className="mt-8 flex flex-col items-center gap-3 pb-4">
                <p className="text-sm text-gray-400">
                  Showing{' '}
                  <span className="font-medium text-gray-600">{filteredItems.length}</span>
                  {!selectedCategory && total > 0 && (
                    <> of <span className="font-medium text-gray-600">{total}</span></>
                  )}{' '}
                  {total === 1 ? 'memory' : 'memories'}
                  {selectedCategory && ' (filtered)'}
                </p>

                {hasMore && (
                  <button
                    onClick={handleLoadMore}
                    className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-[#EA7B7B]/40 hover:shadow-md"
                  >
                    Load more
                  </button>
                )}

                {isFetching && allItems.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading more...
                  </div>
                )}

                {!hasMore && realItemCount >= total && total > 20 && (
                  <p className="text-xs text-gray-400">You&apos;ve seen everything!</p>
                )}
              </div>
            </>
          ) : (
            <EmptyState module={selectedModule} isFirstTime={isFirstTimeUser} />
          )}
        </div>
      </main>

      {/* Detail Modal */}
      {detailItem && (
        <ItemDetailModal
          item={detailItem}
          isOpen={!!detailItem}
          onClose={() => setDetailItem(null)}
          onEdit={() => handleEdit(detailItem)}
          onDelete={() => handleDeleteClick(detailItem)}
          onToggleComplete={(completed) => handleMarkComplete(detailItem, completed)}
        />
      )}

      {/* Edit Modal */}
      {editItem && (
        <ItemEditModal
          item={editItem}
          isOpen={!!editItem}
          onClose={() => setEditItem(null)}
          onSave={handleSaveEdit}
          isSaving={isUpdating}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteItem && (
        <DeleteConfirmModal
          isOpen={!!deleteItem}
          onClose={() => setDeleteItem(null)}
          onConfirm={handleConfirmDelete}
          itemContent={deleteItem.content}
        />
      )}

      {/* Chat Panel */}
      <ChatPanel />
    </div>
  );
}

// =============================================================================
// PAGE EXPORT
// =============================================================================

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
