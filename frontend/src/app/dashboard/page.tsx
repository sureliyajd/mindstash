'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, LogOut, RefreshCw, WifiOff, Search as SearchIcon, Brain } from 'lucide-react';
import { CaptureInput } from '@/components/CaptureInput';
import { ItemCard } from '@/components/ItemCard';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardSkeleton } from '@/components/Skeletons';
import { useToast } from '@/components/Providers';
import { ModuleSelector, type ModuleType } from '@/components/ModuleSelector';
import { SearchBar } from '@/components/SearchBar';
import { FilterPanel, type UrgencyLevel } from '@/components/FilterPanel';
import { useItems, useItemCounts } from '@/lib/hooks/useItems';
import { useAuth } from '@/lib/hooks/useAuth';
import { Item, Category } from '@/lib/api';

// =============================================================================
// EMPTY STATE MESSAGES PER MODULE
// =============================================================================

const emptyStateMessages: Record<string, { title: string; description: string }> = {
  all: {
    title: 'Your mind is clear',
    description: "Drop your first thought above. We'll remember it for you.",
  },
  today: {
    title: 'Nothing urgent right now',
    description: 'Enjoy the calm. High-priority items will appear here.',
  },
  tasks: {
    title: 'No tasks at the moment',
    description: 'Action items you capture will show up here.',
  },
  read_later: {
    title: 'Nothing to learn right now',
    description: 'Articles and learning content will appear here.',
  },
  ideas: {
    title: 'No ideas captured yet',
    description: 'Your creative sparks will be collected here.',
  },
  insights: {
    title: 'No insights yet',
    description: 'Personal reflections and notes will appear here.',
  },
};

// =============================================================================
// EMPTY STATE COMPONENT
// =============================================================================

interface EmptyStateProps {
  module: string;
  searchTerm?: string;
}

function EmptyState({ module, searchTerm }: EmptyStateProps) {
  const hasSearch = searchTerm && searchTerm.trim().length > 0;

  const message = hasSearch
    ? {
        title: 'No matches found',
        description: `No memories match "${searchTerm}"`,
      }
    : emptyStateMessages[module] || emptyStateMessages.all;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="flex flex-col items-center justify-center py-20"
    >
      <div className="mb-4 rounded-full bg-gray-100 p-4">
        {hasSearch ? (
          <SearchIcon className="h-8 w-8 text-gray-400" />
        ) : (
          <Sparkles className="h-8 w-8 text-indigo-400" />
        )}
      </div>
      <h3 className="mb-2 text-lg font-medium text-gray-700">{message.title}</h3>
      <p className="max-w-sm text-center text-sm text-gray-500">
        {message.description}
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
      className="flex flex-col items-center justify-center py-20"
    >
      <div className="mb-4 rounded-full bg-red-50 p-4">
        <RefreshCw className="h-8 w-8 text-red-400" />
      </div>
      <h3 className="mb-2 text-lg font-medium text-gray-700">
        Something went wrong
      </h3>
      <p className="mb-4 max-w-sm text-center text-sm text-gray-500">
        We couldn&apos;t load your memories. Please try again.
      </p>
      <button
        onClick={onRetry}
        className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
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
      className="fixed left-0 right-0 top-0 z-50 flex items-center justify-center gap-2 bg-amber-50 border-b border-amber-200 py-2.5"
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
  onDelete: (id: string) => Promise<void>;
  onUndo: (item: Item) => void;
  isFetching?: boolean;
}

function CardGrid({ items, onViewDetails, onDelete, onUndo, isFetching }: CardGridProps) {
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
            <div className="rounded-full bg-white px-4 py-2 shadow-lg border border-gray-200">
              <span className="text-sm text-gray-600">Updating...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Masonry grid */}
      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
        <AnimatePresence mode="popLayout">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.02, duration: 0.3 }}
              className="mb-4 break-inside-avoid"
            >
              <ItemCard
                item={item}
                onViewDetails={() => onViewDetails(item)}
                onDelete={onDelete}
                onUndo={onUndo}
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
    deleteItem,
    restoreItem,
    isCreating,
  } = useItems({
    module: selectedModule,
    search: searchTerm,
    urgencyFilter: urgencyFilter || undefined,
    selectedTags,
  });

  // Fetch item counts per module
  const { counts: itemCounts } = useItemCounts();

  // ==========================================================================
  // UI STATE
  // ==========================================================================
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
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

  // Handle item deletion
  const handleDelete = async (id: string) => {
    try {
      await deleteItem(id);
      showToast('Item deleted', 'info', {
        label: 'Undo',
        onClick: () => {
          const deletedItem = items.find((item) => item.id === id);
          if (deletedItem) {
            restoreItem(deletedItem);
          }
        },
      });
    } catch {
      showToast('Failed to delete. Please try again.', 'error');
      throw new Error('Failed to delete item');
    }
  };

  // Handle view details (opens modal)
  const handleViewDetails = (item: Item) => {
    setSelectedItem(item);
  };

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Offline banner */}
      <AnimatePresence>{!isOnline && <OfflineBanner />}</AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-indigo-600" />
            <h1 className="text-xl font-semibold text-gray-900">MindStash</h1>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <span className="hidden text-sm text-gray-500 sm:block">
                {user.email}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        {/* Controls section */}
        <div className="space-y-4 pb-6">
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
        <div>
          {isLoading ? (
            <DashboardSkeleton />
          ) : isError ? (
            <ErrorState onRetry={refetch} />
          ) : hasItems ? (
            <CardGrid
              items={filteredItems}
              onViewDetails={handleViewDetails}
              onDelete={handleDelete}
              onUndo={restoreItem}
              isFetching={isFetching && !isLoading}
            />
          ) : (
            <EmptyState module={selectedModule} searchTerm={searchTerm} />
          )}
        </div>
      </main>

      {/* Item detail modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Category badge */}
              {selectedItem.category && (
                <span className="mb-3 inline-block rounded-lg bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">
                  {selectedItem.category}
                </span>
              )}

              {/* Content */}
              <p className="mb-4 text-lg text-gray-800">{selectedItem.content}</p>

              {/* Tags */}
              {selectedItem.tags && selectedItem.tags.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {selectedItem.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Summary */}
              {selectedItem.summary && (
                <p className="mb-4 text-sm text-gray-500 italic">{selectedItem.summary}</p>
              )}

              {/* Metadata */}
              <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                <span className="text-xs text-gray-500">
                  {new Date(selectedItem.created_at).toLocaleDateString()}
                </span>
                {selectedItem.confidence && (
                  <span className="text-xs text-gray-500">
                    {Math.round(selectedItem.confidence * 100)}% confidence
                  </span>
                )}
              </div>

              {/* Close button */}
              <button
                onClick={() => setSelectedItem(null)}
                className="mt-4 w-full rounded-xl bg-gray-100 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
