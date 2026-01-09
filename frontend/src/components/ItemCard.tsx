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
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Item, Category } from '@/lib/api';

// Category icon mapping
const categoryIcons: Record<Category, typeof BookOpen> = {
  read: BookOpen,
  watch: Video,
  ideas: Lightbulb,
  tasks: CheckSquare,
  people: Users,
  notes: FileText,
  goals: Target,
  buy: ShoppingCart,
  places: MapPin,
  journal: BookMarked,
  learn: GraduationCap,
  save: Bookmark,
};

// Category display names
const categoryNames: Record<Category, string> = {
  read: 'Read',
  watch: 'Watch',
  ideas: 'Ideas',
  tasks: 'Tasks',
  people: 'People',
  notes: 'Notes',
  goals: 'Goals',
  buy: 'Buy',
  places: 'Places',
  journal: 'Journal',
  learn: 'Learn',
  save: 'Saved',
};

interface ItemCardProps {
  item: Item;
  onClick?: () => void;
  onDelete?: (id: string) => Promise<void>;
  onEdit?: () => void;
  onUndo?: (item: Item) => void;
}

export function ItemCard({ item, onClick, onDelete, onEdit, onUndo }: ItemCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const deleteTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const category = (item.category as Category) || 'save';
  const Icon = categoryIcons[category] || Bookmark;
  const categoryName = categoryNames[category] || 'Saved';
  const confidence = item.confidence ?? 0;
  const isOptimistic = item.id.startsWith('temp-');

  // Format timestamp
  const timeAgo = formatDistanceToNow(new Date(item.created_at), {
    addSuffix: true,
  });

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

  // Confidence color
  const getConfidenceStyle = () => {
    if (confidence >= 0.9) {
      return 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20';
    } else if (confidence >= 0.7) {
      return 'bg-zinc-500/10 text-zinc-400 ring-zinc-500/20';
    } else {
      return 'bg-amber-500/10 text-amber-400 ring-amber-500/20';
    }
  };

  // Handle delete with undo
  const handleDelete = useCallback(async () => {
    if (!onDelete || isDeleting) return;

    setShowMenu(false);
    setIsDeleting(true);
    setIsDeleted(true);

    // Delay actual deletion for undo opportunity
    deleteTimeoutRef.current = setTimeout(async () => {
      try {
        await onDelete(item.id);
      } catch {
        // Restore on error
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
    if (onUndo) {
      onUndo(item);
    }
  }, [item, onUndo]);

  // Handle context menu
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (!isOptimistic) {
      setShowMenu(true);
    }
  }, [isOptimistic]);

  // If deleted, show undo UI
  if (isDeleted) {
    return (
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0.5 }}
        className="rounded-xl border border-zinc-800/30 bg-zinc-900/30 p-4"
      >
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-500">Item deleted</span>
          <button
            onClick={handleUndo}
            className="text-sm font-medium text-indigo-400 transition-colors hover:text-indigo-300"
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isOptimistic ? 0.7 : 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={isOptimistic ? undefined : { scale: 1.02 }}
      transition={{
        layout: { duration: 0.2 },
        opacity: { duration: 0.3 },
        y: { duration: 0.3 },
        scale: { duration: 0.15 },
      }}
      className="group relative"
      onContextMenu={handleContextMenu}
    >
      {/* Card */}
      <motion.div
        className={`relative overflow-hidden rounded-xl border border-zinc-800/50 bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 p-4 backdrop-blur-sm transition-colors duration-200 ${
          isOptimistic ? 'cursor-wait' : 'cursor-pointer'
        }`}
        whileHover={
          isOptimistic
            ? undefined
            : {
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(99, 102, 241, 0.1)',
                borderColor: 'rgba(63, 63, 70, 0.8)',
              }
        }
        onClick={isOptimistic ? undefined : onClick}
      >
        {/* Optimistic loading indicator */}
        {isOptimistic && (
          <div className="absolute right-3 top-3">
            <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
          </div>
        )}

        {/* Header: Category + Confidence */}
        <div className="mb-3 flex items-start justify-between">
          {/* Category */}
          <div className="flex items-center gap-1.5">
            <Icon className="h-3.5 w-3.5 text-zinc-500" />
            <span className="text-xs text-zinc-500">
              {isOptimistic ? 'Processing...' : categoryName}
            </span>
          </div>

          {/* Confidence badge */}
          {!isOptimistic && confidence > 0 && (
            <div
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${getConfidenceStyle()}`}
            >
              {Math.round(confidence * 100)}%
            </div>
          )}
        </div>

        {/* Content */}
        <p className="mb-3 line-clamp-3 text-sm leading-relaxed text-zinc-300">
          {item.content}
        </p>

        {/* Tags */}
        {!isOptimistic && item.tags && item.tags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {item.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-zinc-800/50 px-2 py-0.5 text-[10px] text-zinc-500"
              >
                {tag}
              </span>
            ))}
            {item.tags.length > 3 && (
              <span className="rounded-md bg-zinc-800/50 px-2 py-0.5 text-[10px] text-zinc-500">
                +{item.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer: Timestamp */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-zinc-600">{timeAgo}</span>

          {/* Menu trigger (visible on hover) */}
          {!isOptimistic && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="rounded-md p-1 text-zinc-600 opacity-0 transition-all hover:bg-zinc-800 hover:text-zinc-400 group-hover:opacity-100"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Subtle gradient overlay on hover */}
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-t from-indigo-500/5 to-transparent opacity-0"
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        />
      </motion.div>

      {/* Context Menu */}
      <AnimatePresence>
        {showMenu && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowMenu(false)}
            />

            {/* Menu */}
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full z-50 mt-1 min-w-[140px] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/95 p-1 shadow-xl backdrop-blur-sm"
            >
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onEdit();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
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
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
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
