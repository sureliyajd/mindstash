'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { LogOut, RefreshCw, WifiOff, Search as SearchIcon } from 'lucide-react';
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
  onViewDetails: (item: Item) => void;
  onEdit: (item: Item) => void;
  onDelete: (item: Item) => void;
  isFetching?: boolean;
}

function CardGrid({ items, onViewDetails, onEdit, onDelete, isFetching }: CardGridProps) {
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
                onViewDetails={() => onViewDetails(item)}
                onEdit={() => onEdit(item)}
                onDelete={() => onDelete(item)}
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
  // FETCH ITEMS WITH FILTERS
  // ==========================================================================
  const {
    items,
    isLoading,
    isFetching,
    isError,
    refetch,
    createItem,
    updateItem,
    deleteItem: deleteItemMutation,
    restoreItem,
    isCreating,
    isUpdating,
  } = useItems({
    module: selectedModule,
    search: searchTerm,
    urgencyFilter: urgencyFilter || undefined,
    selectedTags,
  });

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
    if (isLoading || items.length === 0) return;

    // Get item IDs that haven't been marked yet
    const newItemIds = items
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
  }, [selectedModule, items, isLoading, markSurfaced]);

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
  // FILTER ITEMS BY CATEGORY (client-side for now)
  // ==========================================================================
  const filteredItems = useMemo(() => {
    if (!selectedCategory) return items;
    return items.filter((item) => item.category === selectedCategory);
  }, [items, selectedCategory]);

  // ==========================================================================
  // EXTRACT AVAILABLE TAGS FROM ALL ITEMS
  // ==========================================================================
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    items.forEach((item) => {
      if (item.tags && Array.isArray(item.tags)) {
        item.tags.forEach((tag) => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }, [items]);

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

  // Handle item creation
  const handleCreate = async (content: string, url?: string) => {
    try {
      await createItem({ content, url });
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

  // Handle confirm delete
  const handleConfirmDelete = useCallback(async () => {
    if (!deleteItem) return;
    const itemToDelete = deleteItem;
    try {
      await deleteItemMutation(itemToDelete.id);
      setDeleteItem(null);
      showToast('Memory deleted', 'info', {
        label: 'Undo',
        onClick: () => {
          restoreItem(itemToDelete);
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
  const isFirstTimeUser = !isLoading && items.length === 0 && selectedModule === 'all' && !searchTerm;
  const hasSearchWithNoResults = searchTerm && searchTerm.trim().length > 0 && filteredItems.length === 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Offline banner */}
      <AnimatePresence>{!isOnline && <OfflineBanner />}</AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center">
            <Image
              src="/logo.png"
              alt="MindStash"
              width={180}
              height={50}
              className="h-12 w-auto"
              priority
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
          {isLoading ? (
            <DashboardSkeleton />
          ) : isError ? (
            <ErrorState onRetry={refetch} />
          ) : hasSearchWithNoResults ? (
            <SearchEmptyState searchTerm={searchTerm} />
          ) : hasItems ? (
            <CardGrid
              items={filteredItems}
              onViewDetails={handleViewDetails}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
              isFetching={isFetching && !isLoading}
            />
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
