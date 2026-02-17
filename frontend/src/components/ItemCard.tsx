'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Video,
  Lightbulb,
  CheckSquare,
  Users,
  FileText,
  Target,
  ShoppingCart,
  MapPin,
  BookMarked,
  GraduationCap,
  Bookmark,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  ChevronDown,
  Maximize2,
  Tag,
  Calendar,
  AlertCircle,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Item, Category } from '@/lib/api';

// =============================================================================
// CATEGORY CONFIG - MINDSTASH BRAND COLORS
// =============================================================================

const categoryConfig: Record<Category, { icon: typeof BookOpen; label: string; color: string; bgColor: string }> = {
  read: { icon: BookOpen, label: 'Read', color: 'text-[#5AACA8]', bgColor: 'bg-[#79C9C5]/10 border-[#79C9C5]/30' },
  watch: { icon: Video, label: 'Watch', color: 'text-[#5AACA8]', bgColor: 'bg-[#79C9C5]/10 border-[#79C9C5]/30' },
  ideas: { icon: Lightbulb, label: 'Ideas', color: 'text-[#C9A030]', bgColor: 'bg-[#FACE68]/15 border-[#FACE68]/30' },
  tasks: { icon: CheckSquare, label: 'Tasks', color: 'text-[#D65E3F]', bgColor: 'bg-[#FF8364]/10 border-[#FF8364]/30' },
  people: { icon: Users, label: 'People', color: 'text-[#C44545]', bgColor: 'bg-[#EA7B7B]/10 border-[#EA7B7B]/30' },
  notes: { icon: FileText, label: 'Notes', color: 'text-[#5EB563]', bgColor: 'bg-[#93DA97]/10 border-[#93DA97]/30' },
  goals: { icon: Target, label: 'Goals', color: 'text-[#C9A030]', bgColor: 'bg-[#FACE68]/15 border-[#FACE68]/30' },
  buy: { icon: ShoppingCart, label: 'Buy', color: 'text-[#C44545]', bgColor: 'bg-[#EA7B7B]/10 border-[#EA7B7B]/30' },
  places: { icon: MapPin, label: 'Places', color: 'text-[#5AACA8]', bgColor: 'bg-[#79C9C5]/10 border-[#79C9C5]/30' },
  journal: { icon: BookMarked, label: 'Journal', color: 'text-[#5EB563]', bgColor: 'bg-[#93DA97]/10 border-[#93DA97]/30' },
  learn: { icon: GraduationCap, label: 'Learn', color: 'text-[#5AACA8]', bgColor: 'bg-[#79C9C5]/10 border-[#79C9C5]/30' },
  save: { icon: Bookmark, label: 'Saved', color: 'text-[#C44545]', bgColor: 'bg-[#EA7B7B]/10 border-[#EA7B7B]/30' },
};

// Intent labels for quick display
const intentLabels: Record<string, string> = {
  learn: 'Learning',
  task: 'Action',
  reminder: 'Reminder',
  idea: 'Idea',
  reflection: 'Thought',
  reference: 'Reference',
};

// Urgency colors - Brand palette
const urgencyColors: Record<string, string> = {
  high: 'bg-[#FF8364]/15 text-[#D65E3F] border-[#FF8364]/30',
  medium: 'bg-[#FACE68]/15 text-[#C9A030] border-[#FACE68]/30',
  low: 'bg-[#93DA97]/15 text-[#5EB563] border-[#93DA97]/30',
};

// Resurface strategy labels for compact display
const resurfaceLabels: Record<string, string> = {
  time_based: 'Time-based',
  contextual: 'Contextual',
  weekly_review: 'Weekly',
  manual: 'Manual',
};

// =============================================================================
// "WHY TODAY?" - SURFACING REASON LOGIC
// =============================================================================

function getSurfacingReason(item: Item): string | null {
  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const createdAt = new Date(item.created_at);
  const lastSurfaced = item.last_surfaced_at ? new Date(item.last_surfaced_at) : null;

  // 1. High urgency
  if (item.urgency === 'high') return 'High urgency item';

  // 2. Immediate time context
  if (item.time_context === 'immediate') return 'Needs immediate attention';

  // 3. Weekly review items created over a week ago
  if (item.time_context === 'next_week' && createdAt <= sevenDaysAgo) {
    return 'Weekly review - created over a week ago';
  }

  // 4. New action item never reviewed
  if (item.action_required && !lastSurfaced) {
    return 'New action item - never reviewed';
  }

  // 5. Action reminder not seen in 3+ days
  if (item.action_required && lastSurfaced && lastSurfaced < threeDaysAgo) {
    return 'Action reminder - not seen in 3+ days';
  }

  // 6. Learning review - weekly resurface
  if (item.intent === 'learn' && (!lastSurfaced || lastSurfaced < sevenDaysAgo)) {
    return 'Learning review - weekly resurface';
  }

  return null;
}

interface ItemCardProps {
  item: Item;
  currentModule?: string;
  onViewDetails?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleComplete?: (completed: boolean) => void;
}

export function ItemCard({ item, currentModule, onViewDetails, onEdit, onDelete, onToggleComplete }: ItemCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const category = (item.category as Category) || 'save';
  const categoryInfo = categoryConfig[category] || categoryConfig.save;
  const Icon = categoryInfo.icon;
  const confidence = item.confidence ?? 0;
  const isOptimistic = item.id.startsWith('temp-');

  // AI Intelligence Signals
  const intent = item.intent;
  const urgency = item.urgency;
  const actionRequired = item.action_required;

  // Format timestamp
  const timeAgo = formatDistanceToNow(new Date(item.created_at), { addSuffix: true });

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  // Get status badge based on AI signals
  const getStatusBadge = () => {
    if (urgency === 'high' && actionRequired) {
      return { label: 'Needs Attention', color: 'bg-[#FF8364]/15 text-[#D65E3F]' };
    }
    if (urgency === 'high') {
      return { label: 'Urgent', color: 'bg-[#FACE68]/15 text-[#C9A030]' };
    }
    if (actionRequired) {
      return { label: 'Action Required', color: 'bg-[#EA7B7B]/15 text-[#C44545]' };
    }
    return null;
  };

  const statusBadge = getStatusBadge();

  // "Why today?" surfacing reason (only for Today module)
  const surfacingReason = currentModule === 'today' ? getSurfacingReason(item) : null;

  // Handle card click for expand/collapse
  const handleCardClick = useCallback(
    (e: React.MouseEvent) => {
      if (isOptimistic) return;
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('a')) return;
      setIsExpanded((prev) => !prev);
    },
    [isOptimistic]
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: isOptimistic ? 0.6 : item.is_completed ? 0.75 : 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      whileHover={isOptimistic ? undefined : { y: -2 }}
      transition={{ duration: 0.2 }}
      className={`group relative ${showMenu ? 'z-50' : ''}`}
    >
      {/* Card */}
      <motion.div
        layout
        className={`relative overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-200 ${
          isOptimistic ? 'cursor-wait border-gray-100' : 'cursor-pointer border-gray-100 hover:border-[#EA7B7B]/30 hover:shadow-lg'
        } ${isExpanded ? 'ring-2 ring-[#EA7B7B]/20 border-[#EA7B7B]/30' : ''}`}
        onClick={handleCardClick}
      >
        {/* Loading indicator */}
        {isOptimistic && (
          <div className="absolute right-4 top-4 z-10">
            <Loader2 className="h-4 w-4 animate-spin text-[#EA7B7B]" />
          </div>
        )}

        <div className="p-5">
          {/* "Why today?" banner - only in Today module */}
          {surfacingReason && !isOptimistic && (
            <div className="mb-3 flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-[11px] font-medium text-blue-600">
              <Zap className="h-3 w-3 shrink-0" />
              <span>Why today? {surfacingReason}</span>
            </div>
          )}

          {/* Header: Category + Status */}
          <div className="mb-4 flex items-start justify-between gap-2">
            {/* Category badge */}
            <div className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 ${categoryInfo.bgColor} ${categoryInfo.color}`}>
              <Icon className="h-3.5 w-3.5" />
              <span className="text-xs font-semibold">
                {isOptimistic ? 'Processing...' : categoryInfo.label}
              </span>
            </div>

            {/* Status + Confidence */}
            <div className="flex items-center gap-2">
              {item.is_completed && !isOptimistic && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-[#93DA97]/20 border border-[#93DA97]/40 px-2 py-1 text-[10px] font-semibold text-[#5EB563]">
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  Done
                </span>
              )}
              {statusBadge && !isOptimistic && !item.is_completed && (
                <span className={`rounded-lg px-2 py-1 text-[10px] font-bold ${statusBadge.color}`}>
                  {statusBadge.label}
                </span>
              )}
              {!isOptimistic && confidence > 0 && (
                <span className={`rounded-lg px-2 py-1 font-mono text-[10px] font-semibold tabular-nums ${
                  confidence >= 0.9 ? 'bg-[#93DA97]/15 text-[#5EB563]' :
                  confidence >= 0.7 ? 'bg-[#FACE68]/15 text-[#C9A030]' :
                  'bg-[#EA7B7B]/15 text-[#C44545]'
                }`}>
                  {Math.round(confidence * 100)}%
                </span>
              )}
            </div>
          </div>

          {/* Content - whitespace-pre-wrap preserves newlines */}
          <p className={`text-sm leading-relaxed text-gray-700 whitespace-pre-wrap break-words ${isExpanded ? '' : 'line-clamp-3'} ${item.is_completed ? 'line-through opacity-50' : ''}`}>
            {item.content}
          </p>

          {/* Compact AI Signals - always visible */}
          {!isOptimistic && (urgency || actionRequired || item.resurface_strategy) && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {urgency && urgencyColors[urgency] && (
                <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold capitalize ${urgencyColors[urgency]}`}>
                  <AlertCircle className="h-2.5 w-2.5" />
                  {urgency}
                </span>
              )}
              {actionRequired && (
                <span className="inline-flex items-center gap-1 rounded-md bg-[#FACE68]/15 border border-[#FACE68]/30 px-2 py-0.5 text-[10px] font-semibold text-[#C9A030]">
                  <Zap className="h-2.5 w-2.5" />
                  Action
                </span>
              )}
              {item.resurface_strategy && resurfaceLabels[item.resurface_strategy] && item.resurface_strategy !== 'manual' && (
                <span className="inline-flex items-center gap-1 rounded-md bg-[#79C9C5]/10 border border-[#79C9C5]/30 px-2 py-0.5 text-[10px] font-semibold text-[#5AACA8]">
                  {resurfaceLabels[item.resurface_strategy]}
                </span>
              )}
            </div>
          )}

          {/* Tags */}
          {!isOptimistic && item.tags && item.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {item.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-lg bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-600"
                >
                  <Tag className="h-2.5 w-2.5" />
                  {tag}
                </span>
              ))}
              {item.tags.length > 3 && (
                <span className="rounded-lg bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-500">
                  +{item.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Collapsed summary hint */}
          {!isExpanded && !isOptimistic && item.summary && (
            <p className="mt-4 text-xs text-gray-400 italic line-clamp-1">
              {item.summary}
            </p>
          )}

          {/* Tap for more hint */}
          {!isExpanded && !isOptimistic && (
            <div className="mt-4 flex items-center gap-1.5 text-[11px] text-gray-400">
              <ChevronDown className="h-3 w-3" />
              <span>Tap for more</span>
            </div>
          )}

          {/* ============================================================= */}
          {/* EXPANDED VIEW - Quick AI Info */}
          {/* ============================================================= */}
          <AnimatePresence>
            {isExpanded && !isOptimistic && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="mt-4 space-y-4 border-t border-gray-100 pt-4">

                  {/* AI Summary */}
                  {item.summary && (
                    <div className="rounded-xl bg-[#79C9C5]/10 p-4">
                      <p className="text-sm text-[#3D8583]">{item.summary}</p>
                    </div>
                  )}

                  {/* Intent badge (urgency & action moved to compact row above) */}
                  {intent && intentLabels[intent] && (
                    <div className="flex flex-wrap gap-2">
                      <div className="inline-flex items-center gap-1.5 rounded-lg bg-[#EA7B7B]/10 px-3 py-1.5 text-[#C44545]">
                        <Zap className="h-3 w-3" />
                        <span className="text-[11px] font-semibold">{intentLabels[intent]}</span>
                      </div>
                    </div>
                  )}

                  {/* URL if present */}
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-xl bg-blue-50 p-4 text-sm text-blue-700 hover:bg-blue-100 truncate transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {item.url}
                    </a>
                  )}

                  {/* View Full Details Button */}
                  {onViewDetails && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewDetails();
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-100 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200"
                    >
                      <Maximize2 className="h-4 w-4" />
                      View Full Details
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer */}
          <div className="mt-4 flex items-center justify-between pt-3 border-t border-gray-50">
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3 text-gray-400" />
              <span className="font-mono text-[11px] text-gray-400">{timeAgo}</span>
              {!isOptimistic && (
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-gray-400"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </motion.div>
              )}
            </div>

            {/* Menu trigger */}
            {!isOptimistic && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="rounded-lg p-1.5 text-gray-400 opacity-0 transition-all hover:bg-gray-100 hover:text-gray-600 group-hover:opacity-100"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Context Menu */}
      <AnimatePresence>
        {showMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -8 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full z-50 mt-1 min-w-[160px] overflow-hidden rounded-xl border border-gray-100 bg-white p-1.5 shadow-xl"
            >
              {onViewDetails && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onViewDetails();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <Maximize2 className="h-4 w-4" />
                  View details
                </button>
              )}
              {onToggleComplete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onToggleComplete(!item.is_completed);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <CheckCircle2 className="h-4 w-4 text-[#5EB563]" />
                  {item.is_completed ? 'Mark Incomplete' : 'Mark as Complete'}
                </button>
              )}
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onEdit();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onDelete();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
