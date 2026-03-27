'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { LogOut, RefreshCw, WifiOff, Search as SearchIcon, Loader2, Settings, X, Sparkles, Zap, ArrowRight, Shield, ChevronDown, Star, Crown } from 'lucide-react';
import { CaptureInput } from '@/components/CaptureInput';
import { ItemCard } from '@/components/ItemCard';
import { ItemListRow } from '@/components/ItemListRow';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useBillingStatus } from '@/lib/hooks/useBilling';
import { DashboardSkeleton } from '@/components/Skeletons';
import { useToast } from '@/components/Providers';
import { ModuleSelector, type ModuleType } from '@/components/ModuleSelector';
import { SearchBar } from '@/components/SearchBar';
import { FilterPanel, FilterButton, ActiveFilterPills, type UrgencyLevel } from '@/components/FilterPanel';
import { ItemDetailModal } from '@/components/ItemDetailModal';
import { ItemEditModal } from '@/components/ItemEditModal';
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal';
import { EmptyState } from '@/components/EmptyState';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { DashboardHome } from '@/components/DashboardHome';
import { ViewToggle } from '@/components/ViewToggle';
import { useItems, useItemCounts, useMarkSurfaced } from '@/lib/hooks/useItems';
import { useDashboardHome, DASHBOARD_HOME_QUERY_KEY } from '@/lib/hooks/useDashboardHome';
import { useAuth } from '@/lib/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
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
// TELEGRAM SVG ICON (official brand mark)
// =============================================================================

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

// =============================================================================
// TELEGRAM PROMO BANNER — 2-day dismiss cooldown via localStorage
// =============================================================================

const TG_PROMO_DISMISSED_KEY = 'mindstash_tg_promo_dismissed_at';

function isTgPromoDismissed(): boolean {
  if (typeof window === 'undefined') return true;
  const raw = localStorage.getItem(TG_PROMO_DISMISSED_KEY);
  if (!raw) return false;
  const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
  return Date.now() - Number(raw) < twoDaysMs;
}

function TelegramPromoBanner({ onDismiss }: { onDismiss: () => void }) {
  const router = useRouter();

  const handleConnect = () => {
    onDismiss();
    router.push('/settings#integrations');
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0, marginBottom: 0 }}
      animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      className="overflow-hidden"
    >
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0088cc]/[0.06] via-[#0088cc]/[0.10] to-[#00b4d8]/[0.06] ring-1 ring-[#0088cc]/15">
        {/* Dismiss */}
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-gray-400 shadow-sm transition-colors hover:bg-white hover:text-gray-600"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        {/* Decorative blurs */}
        <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-[#0088cc]/[0.08] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-[#00b4d8]/[0.08] blur-3xl" />

        <div className="relative flex flex-col sm:flex-row sm:items-center gap-5 p-5 sm:p-6">
          {/* Left — Telegram icon + text */}
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <motion.div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#0088cc] shadow-lg shadow-[#0088cc]/25"
              animate={{ rotate: [0, -5, 5, -2, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 5, ease: 'easeInOut' }}
            >
              <TelegramIcon className="h-6 w-6 text-white" />
            </motion.div>
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-gray-900 mb-1">
                Take MindStash with you on Telegram
              </h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                Capture thoughts, search your stash, and chat with your AI assistant — directly from Telegram on any device.
              </p>
            </div>
          </div>

          {/* Right — Flow visual + CTA */}
          <div className="flex flex-col items-stretch gap-3 sm:items-end shrink-0">
            {/* Mini flow */}
            <div className="flex items-center gap-1.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0088cc]/[0.08]">
                <TelegramIcon className="h-4 w-4 text-[#0088cc]" />
              </span>
              <motion.span
                className="flex items-center"
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 1.8, repeat: Infinity }}
              >
                <ArrowRight className="h-3 w-3 text-gray-300" />
              </motion.span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EA7B7B]/[0.08]">
                <Sparkles className="h-4 w-4 text-[#EA7B7B]" />
              </span>
              <motion.span
                className="flex items-center"
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 1.8, repeat: Infinity, delay: 0.4 }}
              >
                <ArrowRight className="h-3 w-3 text-gray-300" />
              </motion.span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#93DA97]/[0.08]">
                <Zap className="h-4 w-4 text-[#5EB563]" />
              </span>
            </div>

            <button
              onClick={handleConnect}
              className="group flex items-center justify-center gap-2 rounded-xl bg-[#0088cc] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#0088cc]/20 transition-all hover:bg-[#006fa1] hover:shadow-lg active:scale-[0.98]"
            >
              <TelegramIcon className="h-4 w-4" />
              Connect Telegram
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </div>
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

// =============================================================================
// PLAN BADGE — header pill with hover tooltip showing usage + upgrade info
// =============================================================================

function UsageRow({ label, current, limit, color }: { label: string; current: number; limit: number | null; color: string }) {
  const pct = limit ? Math.min((current / limit) * 100, 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-500">{label}</span>
        <span className="font-medium tabular-nums" style={{ color }}>
          {current} / {limit === null ? '∞' : limit}
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: `${color}20` }}>
        {limit !== null ? (
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
        ) : (
          <div className="h-full w-full rounded-full opacity-40" style={{ backgroundColor: color }} />
        )}
      </div>
    </div>
  );
}

function PlanBadge() {
  const { data: status } = useBillingStatus();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (!status) return null;

  const { plan, usage } = status;

  // Determine usage urgency for border color
  const itemPct  = usage.items_limit  ? (usage.items_this_month  / usage.items_limit)  * 100 : 0;
  const chatPct  = usage.chat_messages_limit ? (usage.chat_messages_this_month / usage.chat_messages_limit) * 100 : 0;
  const maxPct   = Math.max(itemPct, chatPct);

  // Border: green < 60%, pastel yellow 60–80%, pastel orange ≥ 80%
  const borderColor =
    plan !== 'free' && plan !== 'starter' ? 'transparent'      // pro: no usage border
    : maxPct >= 80  ? '#FDBA74'   // pastel orange
    : maxPct >= 60  ? '#FDE68A'   // pastel yellow
    : '#BBF7D0';                  // pastel green

  const PLAN_META = {
    free:    { icon: Zap,   label: 'Free plan', bg: '#F9FAFB', text: '#6B7280', iconColor: '#9CA3AF', accent: '#6B7280' },
    starter: { icon: Star,  label: 'Starter',   bg: '#FFF5F5', text: '#C44545', iconColor: '#EA7B7B', accent: '#EA7B7B' },
    pro:     { icon: Crown, label: 'Pro',        bg: '#FFFBEB', text: '#92680A', iconColor: '#D4A012', accent: '#D4A012' },
  } as const;

  const meta = PLAN_META[plan as keyof typeof PLAN_META] ?? PLAN_META.free;
  const Icon = meta.icon;

  // Features locked on current plan (for upsell rows in tooltip)
  const lockedFeatures: { label: string; requiredPlan: string }[] = [];
  if (!status.features.telegram)       lockedFeatures.push({ label: 'Telegram bot',      requiredPlan: 'Starter' });
  if (!status.features.weekly_digest)  lockedFeatures.push({ label: 'Weekly digest',     requiredPlan: 'Starter' });
  if (!status.features.semantic_search) lockedFeatures.push({ label: 'Semantic search',  requiredPlan: 'Pro' });
  if (!status.features.daily_briefing) lockedFeatures.push({ label: 'Daily AI briefing', requiredPlan: 'Pro' });

  return (
    <div ref={ref} className="relative">
      {/* Badge pill */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all hover:shadow-sm"
        style={{
          backgroundColor: meta.bg,
          color: meta.text,
          border: `1.5px solid ${borderColor}`,
        }}
        aria-expanded={open}
      >
        <Icon className="h-3 w-3" style={{ color: meta.iconColor }} />
        {meta.label}
        {plan === 'free' && <span className="opacity-50 text-[10px]">↑</span>}
      </button>

      {/* Tooltip popover */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="fixed right-3 left-3 sm:absolute sm:left-auto sm:right-0 top-[60px] sm:top-full mt-0 sm:mt-2 sm:w-64 rounded-2xl bg-white shadow-xl ring-1 ring-gray-100 overflow-hidden z-50"
          >
            {/* Plan header */}
            <div className="flex items-center gap-2.5 px-4 pt-4 pb-3 border-b border-gray-50">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ backgroundColor: `${meta.accent}15` }}>
                <Icon className="h-4 w-4" style={{ color: meta.accent }} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{meta.label}</p>
                {plan === 'free' && <p className="text-xs text-gray-400">Free forever</p>}
                {plan !== 'free' && status.plan_expires_at && (
                  <p className="text-xs text-gray-400">Renews {new Date(status.plan_expires_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                )}
              </div>
            </div>

            {/* Usage section */}
            {(usage.items_limit !== null || usage.chat_messages_limit !== null) && (
              <div className="px-4 py-3 space-y-3 border-b border-gray-50">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">This month</p>
                <UsageRow
                  label="Items captured"
                  current={usage.items_this_month}
                  limit={usage.items_limit}
                  color={itemPct >= 80 ? '#FB923C' : itemPct >= 60 ? '#D97706' : '#10B981'}
                />
                <UsageRow
                  label="AI chat messages"
                  current={usage.chat_messages_this_month}
                  limit={usage.chat_messages_limit}
                  color={chatPct >= 80 ? '#FB923C' : chatPct >= 60 ? '#D97706' : '#10B981'}
                />
              </div>
            )}

            {/* Pro: unlimited confirmation */}
            {plan === 'pro' && (
              <div className="px-4 py-3 border-b border-gray-50">
                <p className="text-xs text-gray-500">Unlimited items · Unlimited chat · All features unlocked</p>
              </div>
            )}

            {/* Locked features upsell */}
            {lockedFeatures.length > 0 && (
              <div className="px-4 py-3 border-b border-gray-50 space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Unlock with upgrade</p>
                {lockedFeatures.map((f) => (
                  <div key={f.label} className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 flex items-center gap-1.5">
                      <span className="h-3.5 w-3.5 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">🔒</span>
                      {f.label}
                    </span>
                    <span className="rounded-full px-1.5 py-0.5 font-semibold text-[10px]" style={{ backgroundColor: '#EA7B7B15', color: '#C44545' }}>
                      {f.requiredPlan}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Footer links */}
            <div className="flex items-center justify-between px-4 py-3">
              <a href="/pricing" className="text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors">
                See all plans
              </a>
              <a
                href="/billing"
                className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-white transition-all hover:scale-105"
                style={{ backgroundColor: meta.accent }}
                onClick={() => setOpen(false)}
              >
                {plan === 'free' || plan === 'starter' ? 'Upgrade' : 'Manage'} <ArrowRight className="h-3 w-3" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// MAIN DASHBOARD CONTENT
// =============================================================================

function DashboardContent() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();

  // ==========================================================================
  // FILTER STATE
  // ==========================================================================
  const [selectedModule, setSelectedModule] = useState<ModuleType>('all');
  const [searchValue, setSearchValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyLevel | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);

  // ==========================================================================
  // VIEW MODE (grid/list) — persisted in localStorage
  // ==========================================================================
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    if (typeof window === 'undefined') return 'grid';
    return (localStorage.getItem('mindstash_view_mode') as 'grid' | 'list') || 'grid';
  });

  useEffect(() => {
    localStorage.setItem('mindstash_view_mode', viewMode);
  }, [viewMode]);

  // ==========================================================================
  // HOME VIEW — show smart dashboard when on "All" with no filters
  // ==========================================================================
  const isHomeView = selectedModule === 'all' && !searchTerm && !urgencyFilter && selectedTags.length === 0 && !selectedCategory;
  const dashboardHomeData = useDashboardHome(isHomeView);

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

  // Close admin dropdown when clicking outside
  useEffect(() => {
    if (!adminDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-admin-dropdown]')) {
        setAdminDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [adminDropdownOpen]);

  // Reset to page 1 when any server-side filter changes
  const tagsKey = selectedTags.join(',');
  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedModule, searchTerm, urgencyFilter, tagsKey]);

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

  // Telegram promo banner: 2-day cooldown after dismiss
  const [showTgPromo, setShowTgPromo] = useState(() => !isTgPromoDismissed());

  const dismissTgPromo = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TG_PROMO_DISMISSED_KEY, String(Date.now()));
    }
    setShowTgPromo(false);
  }, []);

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
      // Refresh dashboard home data if visible
      queryClient.invalidateQueries({ queryKey: DASHBOARD_HOME_QUERY_KEY });
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
        // Refresh dashboard home sections so checkboxes reflect the change
        queryClient.invalidateQueries({ queryKey: DASHBOARD_HOME_QUERY_KEY });
        showToast(completed ? 'Marked as complete!' : 'Marked as incomplete', 'success');
      } catch {
        showToast('Failed to update item', 'error');
      }
    },
    [markComplete, detailItem, showToast, queryClient]
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
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center">
            <img
              src="/logo.png"
              alt="MindStash"
              className="h-8 sm:h-12 w-auto"
            />
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3">
            {user && (
              <span className="hidden text-sm text-gray-500 sm:block">
                {user.name || user.email}
              </span>
            )}
            <PlanBadge />
            {user?.is_admin && (
              <div className="relative" data-admin-dropdown>
                <button
                  onClick={() => setAdminDropdownOpen((o) => !o)}
                  className="flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-sm font-medium text-purple-700 transition-colors hover:bg-purple-100"
                >
                  <Shield className="h-4 w-4" />
                  <span className="hidden sm:inline">Admin</span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                <AnimatePresence>
                  {adminDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.97 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 mt-1.5 w-40 rounded-xl bg-white shadow-lg ring-1 ring-gray-100 py-1"
                    >
                      <button
                        onClick={() => { setAdminDropdownOpen(false); router.push('/admin/users'); }}
                        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                      >
                        Users
                      </button>
                      <button
                        onClick={() => { setAdminDropdownOpen(false); router.push('/admin/analytics'); }}
                        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                      >
                        Analytics
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            <button
              onClick={() => router.push('/settings')}
              className="flex items-center gap-2 rounded-lg px-2 py-2 sm:px-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg px-2 py-2 sm:px-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Controls section */}
        <div className="space-y-5 pb-8">
          {/* Capture Input */}
          <CaptureInput onSubmit={handleCreate} isSubmitting={isCreating} />

          {/* Search + View toggle + Filter button row */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <SearchBar
                value={searchValue}
                onChange={setSearchValue}
                onSearch={handleSearch}
              />
            </div>
            {!isHomeView && (
              <ViewToggle viewMode={viewMode} onChange={setViewMode} />
            )}
            <FilterButton
              activeCount={
                (urgencyFilter ? 1 : 0) + selectedTags.length + (selectedCategory ? 1 : 0)
              }
              onClick={() => setIsFilterOpen(true)}
            />
          </div>

          {/* Active filter pills */}
          <ActiveFilterPills
            urgencyFilter={urgencyFilter}
            selectedTags={selectedTags}
            selectedCategory={selectedCategory}
            onUrgencyChange={setUrgencyFilter}
            onTagsChange={setSelectedTags}
            onCategoryChange={setSelectedCategory}
            onClearFilters={handleClearFilters}
          />

          {/* Module Selector */}
          <ModuleSelector
            selectedModule={selectedModule}
            onModuleChange={handleModuleChange}
            itemCounts={itemCounts}
          />
        </div>

        {/* Telegram promo banner */}
        <AnimatePresence>
          {showTgPromo && (
            <TelegramPromoBanner onDismiss={dismissTgPromo} />
          )}
        </AnimatePresence>

        {/* Content area */}
        <div className="relative">
          {isHomeView ? (
            <DashboardHome
              data={dashboardHomeData}
              itemCounts={itemCounts}
              userName={user?.name ?? null}
              onModuleChange={handleModuleChange}
              onViewDetails={handleViewDetails}
              onToggleComplete={handleMarkComplete}
            />
          ) : isLoading && allItems.length === 0 ? (
            <DashboardSkeleton />
          ) : isError ? (
            <ErrorState onRetry={refetch} />
          ) : hasSearchWithNoResults ? (
            <SearchEmptyState searchTerm={searchTerm} />
          ) : hasItems ? (
            <>
              {viewMode === 'grid' ? (
                <CardGrid
                  items={filteredItems}
                  currentModule={selectedModule}
                  onViewDetails={handleViewDetails}
                  onEdit={handleEdit}
                  onDelete={handleDeleteClick}
                  onToggleComplete={handleMarkComplete}
                  isFetching={isFetching && allItems.length === 0}
                />
              ) : (
                <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                  <AnimatePresence mode="popLayout">
                    {filteredItems.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ItemListRow
                          item={item}
                          currentModule={selectedModule}
                          onViewDetails={() => handleViewDetails(item)}
                          onEdit={() => handleEdit(item)}
                          onDelete={() => handleDeleteClick(item)}
                          onToggleComplete={(completed) => handleMarkComplete(item, completed)}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

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

      {/* Filter Modal */}
      <FilterPanel
        urgencyFilter={urgencyFilter}
        selectedTags={selectedTags}
        availableTags={availableTags}
        selectedCategory={selectedCategory}
        onUrgencyChange={setUrgencyFilter}
        onTagsChange={setSelectedTags}
        onCategoryChange={setSelectedCategory}
        onClearFilters={handleClearFilters}
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
      />

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
