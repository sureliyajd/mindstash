'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Sparkles, LogOut, RefreshCw, WifiOff } from 'lucide-react';
import { CaptureInput } from '@/components/CaptureInput';
import { ItemCard } from '@/components/ItemCard';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardSkeleton } from '@/components/Skeletons';
import { useToast } from '@/components/Providers';
import { useItems } from '@/lib/hooks/useItems';
import { useAuth } from '@/lib/hooks/useAuth';
import { Item } from '@/lib/api';
import { isToday, isThisWeek, isThisMonth } from 'date-fns';

// Section configuration
interface Section {
  id: string;
  title: string;
  filter: (item: Item) => boolean;
}

const sections: Section[] = [
  {
    id: 'today',
    title: 'Today',
    filter: (item) => isToday(new Date(item.created_at)),
  },
  {
    id: 'this-week',
    title: 'This Week',
    filter: (item) => {
      const date = new Date(item.created_at);
      return isThisWeek(date) && !isToday(date);
    },
  },
  {
    id: 'this-month',
    title: 'This Month',
    filter: (item) => {
      const date = new Date(item.created_at);
      return isThisMonth(date) && !isThisWeek(date);
    },
  },
  {
    id: 'older',
    title: 'Older',
    filter: (item) => !isThisMonth(new Date(item.created_at)),
  },
];

// Collapsible section component
function MemorySection({
  title,
  items,
  defaultOpen = true,
  onItemClick,
  onItemDelete,
  onItemUndo,
}: {
  title: string;
  items: Item[];
  defaultOpen?: boolean;
  onItemClick: (item: Item) => void;
  onItemDelete: (id: string) => Promise<void>;
  onItemUndo: (item: Item) => void;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (items.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mb-8"
    >
      {/* Section header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group mb-4 flex w-full items-center gap-2 text-left"
      >
        <motion.div
          animate={{ rotate: isOpen ? 0 : -90 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-4 w-4 text-zinc-600" />
        </motion.div>
        <h2 className="text-sm font-medium text-zinc-500 transition-colors group-hover:text-zinc-400">
          {title}
        </h2>
        <span className="text-xs text-zinc-700">({items.length})</span>
      </button>

      {/* Items grid */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
              {items.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03, duration: 0.3 }}
                  className="mb-4 break-inside-avoid"
                >
                  <ItemCard
                    item={item}
                    onClick={() => onItemClick(item)}
                    onDelete={onItemDelete}
                    onUndo={onItemUndo}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

// Empty state component
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="flex flex-col items-center justify-center py-20"
    >
      <div className="mb-4 rounded-full bg-zinc-800/50 p-4">
        <Sparkles className="h-8 w-8 text-zinc-600" />
      </div>
      <h3 className="mb-2 text-lg font-medium text-zinc-400">
        Your mind is clear
      </h3>
      <p className="max-w-sm text-center text-sm text-zinc-600">
        Drop your first thought above. We&apos;ll remember it for you.
      </p>
    </motion.div>
  );
}

// Error state component
function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20"
    >
      <div className="mb-4 rounded-full bg-red-500/10 p-4">
        <RefreshCw className="h-8 w-8 text-red-400" />
      </div>
      <h3 className="mb-2 text-lg font-medium text-zinc-400">
        Something went wrong
      </h3>
      <p className="mb-4 max-w-sm text-center text-sm text-zinc-600">
        We couldn&apos;t load your memories. Please try again.
      </p>
      <button
        onClick={onRetry}
        className="rounded-lg bg-zinc-800 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-700"
      >
        Try again
      </button>
    </motion.div>
  );
}

// Offline banner component
function OfflineBanner() {
  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -50, opacity: 0 }}
      className="fixed left-0 right-0 top-0 z-50 flex items-center justify-center gap-2 bg-amber-500/10 py-2 backdrop-blur-sm"
    >
      <WifiOff className="h-4 w-4 text-amber-400" />
      <span className="text-sm text-amber-400">
        You&apos;re offline. Changes will sync when you reconnect.
      </span>
    </motion.div>
  );
}

function DashboardContent() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const {
    items,
    isLoading,
    isError,
    refetch,
    createItem,
    deleteItem,
    restoreItem,
    isCreating,
  } = useItems();

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

  // Group items by section
  const groupedItems = useMemo(() => {
    const groups: Record<string, Item[]> = {};
    sections.forEach((section) => {
      groups[section.id] = items.filter(section.filter);
    });
    return groups;
  }, [items]);

  // Check if there are any items
  const hasItems = items.length > 0;

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

  // Handle item click (expand)
  const handleItemClick = (item: Item) => {
    setSelectedItem(item);
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    showToast('Logged out successfully', 'success');
  };

  return (
    <div className="min-h-screen bg-[#09090b]">
      {/* Offline banner */}
      <AnimatePresence>{!isOnline && <OfflineBanner />}</AnimatePresence>

      {/* Header */}
      <header className="border-b border-zinc-800/50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <h1 className="text-lg font-medium text-white">MindStash</h1>
          <div className="flex items-center gap-4">
            {user && (
              <span className="hidden text-sm text-zinc-600 sm:block">
                {user.email}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Capture Input - Sticky */}
        <div className="sticky top-0 z-30 -mx-4 bg-[#09090b]/80 px-4 pb-6 pt-2 backdrop-blur-lg sm:-mx-6 sm:px-6">
          <CaptureInput onSubmit={handleCreate} isSubmitting={isCreating} />
        </div>

        {/* Memory Sections */}
        <div className="mt-4">
          {isLoading ? (
            <DashboardSkeleton />
          ) : isError ? (
            <ErrorState onRetry={refetch} />
          ) : hasItems ? (
            sections.map((section) => (
              <MemorySection
                key={section.id}
                title={section.title}
                items={groupedItems[section.id]}
                defaultOpen={section.id === 'today' || section.id === 'this-week'}
                onItemClick={handleItemClick}
                onItemDelete={handleDelete}
                onItemUndo={restoreItem}
              />
            ))
          ) : (
            <EmptyState />
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Category badge */}
              {selectedItem.category && (
                <span className="mb-3 inline-block rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-400">
                  {selectedItem.category}
                </span>
              )}

              {/* Content */}
              <p className="mb-4 text-lg text-zinc-200">{selectedItem.content}</p>

              {/* Tags */}
              {selectedItem.tags && selectedItem.tags.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {selectedItem.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md bg-zinc-800/50 px-2 py-1 text-xs text-zinc-500"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Summary */}
              {selectedItem.summary && (
                <p className="mb-4 text-sm text-zinc-500">
                  {selectedItem.summary}
                </p>
              )}

              {/* Metadata */}
              <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
                <span className="text-xs text-zinc-600">
                  {new Date(selectedItem.created_at).toLocaleDateString()}
                </span>
                {selectedItem.confidence && (
                  <span className="text-xs text-zinc-600">
                    {Math.round(selectedItem.confidence * 100)}% confidence
                  </span>
                )}
              </div>

              {/* Close button */}
              <button
                onClick={() => setSelectedItem(null)}
                className="mt-4 w-full rounded-lg bg-zinc-800 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-300"
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

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
