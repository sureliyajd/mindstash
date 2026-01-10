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
  Brain,
  Zap,
  Clock,
  ChevronDown,
  Maximize2,
  AlertCircle,
  TrendingUp,
  RotateCcw,
  Tag,
  Calendar,
  Info,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Item, Category } from '@/lib/api';

// =============================================================================
// CATEGORY CONFIG
// =============================================================================

const categoryConfig: Record<Category, { icon: typeof BookOpen; label: string; color: string }> = {
  read: { icon: BookOpen, label: 'Read', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  watch: { icon: Video, label: 'Watch', color: 'text-purple-600 bg-purple-50 border-purple-200' },
  ideas: { icon: Lightbulb, label: 'Ideas', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  tasks: { icon: CheckSquare, label: 'Tasks', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  people: { icon: Users, label: 'People', color: 'text-pink-600 bg-pink-50 border-pink-200' },
  notes: { icon: FileText, label: 'Notes', color: 'text-slate-600 bg-slate-50 border-slate-200' },
  goals: { icon: Target, label: 'Goals', color: 'text-red-600 bg-red-50 border-red-200' },
  buy: { icon: ShoppingCart, label: 'Buy', color: 'text-orange-600 bg-orange-50 border-orange-200' },
  places: { icon: MapPin, label: 'Places', color: 'text-teal-600 bg-teal-50 border-teal-200' },
  journal: { icon: BookMarked, label: 'Journal', color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  learn: { icon: GraduationCap, label: 'Learn', color: 'text-cyan-600 bg-cyan-50 border-cyan-200' },
  save: { icon: Bookmark, label: 'Saved', color: 'text-gray-600 bg-gray-50 border-gray-200' },
};

// Intent display config
const intentConfig: Record<string, { label: string; description: string }> = {
  learn: { label: 'Learning', description: 'Content to absorb and understand' },
  task: { label: 'Action Item', description: 'Something that requires your action' },
  reminder: { label: 'Reminder', description: 'Something to keep in mind' },
  idea: { label: 'Creative Idea', description: 'A spark worth exploring' },
  reflection: { label: 'Personal Thought', description: 'Your own insight or feeling' },
  reference: { label: 'Reference', description: 'Information to look up later' },
};

// Urgency display config
const urgencyConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  high: { label: 'High Priority', color: 'text-red-700', bgColor: 'bg-red-50 border-red-200' },
  medium: { label: 'Medium Priority', color: 'text-amber-700', bgColor: 'bg-amber-50 border-amber-200' },
  low: { label: 'Low Priority', color: 'text-emerald-700', bgColor: 'bg-emerald-50 border-emerald-200' },
};

// Time context display
const timeContextConfig: Record<string, { label: string; description: string }> = {
  immediate: { label: 'Now', description: 'Needs attention today' },
  next_week: { label: 'This Week', description: 'Best addressed this week' },
  someday: { label: 'Someday', description: 'No rush, when you\'re ready' },
  conditional: { label: 'When Relevant', description: 'Will surface when context matches' },
  date: { label: 'Scheduled', description: 'Has a specific date' },
};

// Resurface strategy display
const resurfaceConfig: Record<string, { label: string; description: string }> = {
  time_based: { label: 'Scheduled', description: 'Will remind you at the right time' },
  contextual: { label: 'Smart', description: 'Shows when you\'re working on related topics' },
  weekly_review: { label: 'Weekly Review', description: 'Included in your weekly digest' },
  manual: { label: 'On Demand', description: 'Available whenever you search for it' },
};

interface ItemCardProps {
  item: Item;
  onViewDetails?: () => void;
  onDelete?: (id: string) => Promise<void>;
  onEdit?: () => void;
  onUndo?: (item: Item) => void;
}

export function ItemCard({ item, onViewDetails, onDelete, onEdit, onUndo }: ItemCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const deleteTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const category = (item.category as Category) || 'save';
  const categoryInfo = categoryConfig[category] || categoryConfig.save;
  const Icon = categoryInfo.icon;
  const confidence = item.confidence ?? 0;
  const isOptimistic = item.id.startsWith('temp-');

  // AI Intelligence Signals
  const intent = item.intent;
  const urgency = item.urgency;
  const timeContext = item.time_context;
  const resurfaceStrategy = item.resurface_strategy;
  const actionRequired = item.action_required;
  const priority = item.priority;
  const suggestedBucket = item.suggested_bucket;

  // Format timestamp
  const timeAgo = formatDistanceToNow(new Date(item.created_at), { addSuffix: true });

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (deleteTimeoutRef.current) {
        clearTimeout(deleteTimeoutRef.current);
      }
    };
  }, []);

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

  // Get status badge
  const getStatusBadge = () => {
    if (urgency === 'high' && actionRequired) {
      return { label: 'Needs Attention', color: 'bg-red-100 text-red-700 border-red-200' };
    }
    if (urgency === 'high') {
      return { label: 'Urgent', color: 'bg-amber-100 text-amber-700 border-amber-200' };
    }
    if (actionRequired) {
      return { label: 'Action Required', color: 'bg-blue-100 text-blue-700 border-blue-200' };
    }
    if (timeContext === 'immediate') {
      return { label: 'Today', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
    }
    return null;
  };

  const statusBadge = getStatusBadge();

  // Handle card click
  const handleCardClick = useCallback(
    (e: React.MouseEvent) => {
      if (isOptimistic) return;
      const target = e.target as HTMLElement;
      if (target.closest('button')) return;
      setIsExpanded((prev) => !prev);
    },
    [isOptimistic]
  );

  // Handle delete with undo
  const handleDelete = useCallback(async () => {
    if (!onDelete || isDeleting) return;
    setShowMenu(false);
    setIsDeleting(true);
    setIsDeleted(true);

    deleteTimeoutRef.current = setTimeout(async () => {
      try {
        await onDelete(item.id);
      } catch {
        setIsDeleted(false);
      } finally {
        setIsDeleting(false);
      }
    }, 3000);
  }, [item.id, onDelete, isDeleting]);

  // Handle undo
  const handleUndo = useCallback(() => {
    if (deleteTimeoutRef.current) {
      clearTimeout(deleteTimeoutRef.current);
      deleteTimeoutRef.current = null;
    }
    setIsDeleted(false);
    setIsDeleting(false);
    if (onUndo) onUndo(item);
  }, [item, onUndo]);

  // If deleted, show undo UI
  if (isDeleted) {
    return (
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0.6 }}
        className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
      >
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Item deleted</span>
          <button
            onClick={handleUndo}
            className="text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700"
          >
            Undo
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: isOptimistic ? 0.6 : 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      whileHover={isOptimistic ? undefined : { y: -2 }}
      transition={{ duration: 0.2 }}
      className="group relative"
    >
      {/* Card */}
      <motion.div
        layout
        className={`relative overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-200 ${
          isOptimistic ? 'cursor-wait border-gray-200' : 'cursor-pointer border-gray-200 hover:border-gray-300 hover:shadow-md'
        } ${isExpanded ? 'ring-2 ring-indigo-100 border-indigo-200' : ''}`}
        onClick={handleCardClick}
      >
        {/* Loading indicator */}
        {isOptimistic && (
          <div className="absolute right-4 top-4 z-10">
            <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
          </div>
        )}

        <div className="p-4">
          {/* Header: Category + Status */}
          <div className="mb-3 flex items-start justify-between gap-2">
            {/* Category badge */}
            <div className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 ${categoryInfo.color}`}>
              <Icon className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">
                {isOptimistic ? 'Processing...' : categoryInfo.label}
              </span>
            </div>

            {/* Status + Confidence */}
            <div className="flex items-center gap-2">
              {statusBadge && !isOptimistic && (
                <span className={`rounded-lg border px-2 py-0.5 text-[10px] font-semibold ${statusBadge.color}`}>
                  {statusBadge.label}
                </span>
              )}
              {!isOptimistic && confidence > 0 && (
                <span className={`rounded-lg px-2 py-0.5 text-[10px] font-medium ${
                  confidence >= 0.9 ? 'bg-emerald-50 text-emerald-700' :
                  confidence >= 0.7 ? 'bg-gray-100 text-gray-600' :
                  'bg-amber-50 text-amber-700'
                }`}>
                  {Math.round(confidence * 100)}%
                </span>
              )}
            </div>
          </div>

          {/* Content */}
          <p className={`text-sm leading-relaxed text-gray-800 ${isExpanded ? '' : 'line-clamp-3'}`}>
            {item.content}
          </p>

          {/* Tags */}
          {!isOptimistic && item.tags && item.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {item.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600"
                >
                  <Tag className="h-2.5 w-2.5" />
                  {tag}
                </span>
              ))}
              {item.tags.length > 4 && (
                <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500">
                  +{item.tags.length - 4}
                </span>
              )}
            </div>
          )}

          {/* Summary (if available and not expanded) */}
          {!isExpanded && !isOptimistic && item.summary && (
            <p className="mt-3 text-xs text-gray-500 italic line-clamp-1">
              {item.summary}
            </p>
          )}

          {/* Expand hint */}
          {!isExpanded && !isOptimistic && (
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-gray-400">
              <ChevronDown className="h-3 w-3" />
              <span>Tap for AI insights</span>
            </div>
          )}

          {/* ============================================================= */}
          {/* EXPANDED VIEW - Full AI Metadata */}
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
                <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">

                  {/* AI Summary */}
                  {item.summary && (
                    <div className="rounded-xl bg-indigo-50 p-3">
                      <div className="flex items-start gap-2">
                        <Brain className="mt-0.5 h-4 w-4 text-indigo-600" />
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600">
                            AI Summary
                          </p>
                          <p className="mt-1 text-sm text-indigo-900">
                            {item.summary}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* AI Understanding Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Intent */}
                    {intent && intentConfig[intent] && (
                      <div className="rounded-xl bg-gray-50 p-3">
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                          <Zap className="h-3 w-3" />
                          Intent
                        </div>
                        <p className="mt-1 text-sm font-medium text-gray-800">
                          {intentConfig[intent].label}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {intentConfig[intent].description}
                        </p>
                      </div>
                    )}

                    {/* Urgency */}
                    {urgency && urgencyConfig[urgency] && (
                      <div className={`rounded-xl p-3 border ${urgencyConfig[urgency].bgColor}`}>
                        <div className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide ${urgencyConfig[urgency].color}`}>
                          <AlertCircle className="h-3 w-3" />
                          Urgency
                        </div>
                        <p className={`mt-1 text-sm font-medium ${urgencyConfig[urgency].color}`}>
                          {urgencyConfig[urgency].label}
                        </p>
                      </div>
                    )}

                    {/* Time Context */}
                    {timeContext && timeContextConfig[timeContext] && (
                      <div className="rounded-xl bg-gray-50 p-3">
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                          <Clock className="h-3 w-3" />
                          Timing
                        </div>
                        <p className="mt-1 text-sm font-medium text-gray-800">
                          {timeContextConfig[timeContext].label}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {timeContextConfig[timeContext].description}
                        </p>
                      </div>
                    )}

                    {/* Resurface Strategy */}
                    {resurfaceStrategy && resurfaceConfig[resurfaceStrategy] && (
                      <div className="rounded-xl bg-gray-50 p-3">
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                          <RotateCcw className="h-3 w-3" />
                          Resurface
                        </div>
                        <p className="mt-1 text-sm font-medium text-gray-800">
                          {resurfaceConfig[resurfaceStrategy].label}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {resurfaceConfig[resurfaceStrategy].description}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Additional Metadata Row */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {/* Priority */}
                    {priority && (
                      <div className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1">
                        <TrendingUp className="h-3 w-3 text-gray-500" />
                        <span className="text-[11px] text-gray-600">
                          Priority: <span className="font-medium capitalize">{priority}</span>
                        </span>
                      </div>
                    )}

                    {/* Action Required */}
                    {actionRequired !== null && (
                      <div className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 ${
                        actionRequired ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        <CheckSquare className="h-3 w-3" />
                        <span className="text-[11px]">
                          {actionRequired ? 'Action Required' : 'No Action Needed'}
                        </span>
                      </div>
                    )}

                    {/* Suggested Bucket */}
                    {suggestedBucket && (
                      <div className="inline-flex items-center gap-1 rounded-lg bg-indigo-100 px-2.5 py-1 text-indigo-700">
                        <Bookmark className="h-3 w-3" />
                        <span className="text-[11px]">
                          Bucket: <span className="font-medium">{suggestedBucket}</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* URL if present */}
                  {item.url && (
                    <div className="rounded-xl bg-blue-50 p-3">
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-blue-600">
                        <Info className="h-3 w-3" />
                        Detected URL
                      </div>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 block text-sm text-blue-700 hover:underline truncate"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {item.url}
                      </a>
                    </div>
                  )}

                  {/* View Full Details Button */}
                  {onViewDetails && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewDetails();
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-100 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
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
          <div className="mt-3 flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3 text-gray-400" />
              <span className="text-[11px] text-gray-500">{timeAgo}</span>
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
              className="absolute right-0 top-full z-50 mt-1 min-w-[140px] overflow-hidden rounded-xl border border-gray-200 bg-white p-1 shadow-lg"
            >
              {onViewDetails && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onViewDetails();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
                >
                  <Maximize2 className="h-4 w-4" />
                  View details
                </button>
              )}
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onEdit();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete();
                  }}
                  disabled={isDeleting}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
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
