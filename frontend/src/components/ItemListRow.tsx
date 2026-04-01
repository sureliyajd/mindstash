'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MoreHorizontal,
  Maximize2,
  Pencil,
  Trash2,
  CheckCircle2,
  Calendar,
  Tag,
} from 'lucide-react';
import { formatDistanceToNow, format, isValid } from 'date-fns';
import { Item, Category } from '@/lib/api';
import { categoryConfig } from '@/lib/categoryConfig';
import { parseUTCDate } from '@/lib/dateUtils';

interface ItemListRowProps {
  item: Item;
  currentModule?: string;
  onViewDetails?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleComplete?: (completed: boolean) => void;
}

export function ItemListRow({ item, onViewDetails, onEdit, onDelete, onToggleComplete }: ItemListRowProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const category = (item.category as Category) || 'save';
  const info = categoryConfig[category] || categoryConfig.save;
  const Icon = info.icon;
  const isOptimistic = item.id.startsWith('temp-');
  const createdDate = parseUTCDate(item.created_at) ?? new Date();
  const timeAgo = isValid(createdDate) ? formatDistanceToNow(createdDate, { addSuffix: true }) : '';

  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

  return (
    <div
      className={`group relative flex items-center gap-3 border-b border-gray-50 px-4 py-3 transition-colors last:border-b-0 ${
        isOptimistic ? 'cursor-wait opacity-60' : 'cursor-pointer hover:bg-gray-50'
      } ${item.is_completed ? 'opacity-60' : ''}`}
      onClick={() => !isOptimistic && onViewDetails?.()}
    >
      {/* Category icon */}
      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${info.bgColor.split(' ')[0]}`}>
        <Icon className={`h-3.5 w-3.5 ${info.color}`} />
      </div>

      {/* Content */}
      <p className={`flex-1 truncate text-sm text-gray-700 ${item.is_completed ? 'line-through' : ''}`}>
        {item.content}
      </p>

      {/* Key signal */}
      {item.is_completed ? (
        <span className="shrink-0 inline-flex items-center gap-1 rounded-md bg-[#93DA97]/20 px-1.5 py-0.5 text-[10px] font-semibold text-[#5EB563]">
          <CheckCircle2 className="h-2.5 w-2.5" />
          Done
        </span>
      ) : item.urgency === 'high' ? (
        <span className="shrink-0 rounded-md bg-[#FF8364]/15 px-1.5 py-0.5 text-[10px] font-bold text-[#D65E3F]">
          High
        </span>
      ) : item.notification_date ? (
        <span className="shrink-0 flex items-center gap-1 rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">
          <Calendar className="h-2.5 w-2.5" />
          {(() => { const d = parseUTCDate(item.notification_date); return d && isValid(d) ? format(d, 'MMM d') : ''; })()}
        </span>
      ) : item.tags && item.tags.length > 0 ? (
        <span className="shrink-0 hidden sm:inline-flex items-center gap-1 rounded-md bg-gray-50 px-1.5 py-0.5 text-[10px] text-gray-500">
          <Tag className="h-2.5 w-2.5" />
          {item.tags[0]}
        </span>
      ) : null}

      {/* Timestamp */}
      <span className="shrink-0 font-mono text-[10px] text-gray-400 hidden sm:block w-24 text-right">
        {timeAgo}
      </span>

      {/* Menu */}
      {!isOptimistic && (
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="rounded-lg p-1.5 text-gray-400 sm:opacity-0 transition-all hover:bg-gray-100 hover:text-gray-600 sm:group-hover:opacity-100"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

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
                      onClick={(e) => { e.stopPropagation(); setShowMenu(false); onViewDetails(); }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      <Maximize2 className="h-4 w-4" />
                      View details
                    </button>
                  )}
                  {onToggleComplete && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowMenu(false); onToggleComplete(!item.is_completed); }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      <CheckCircle2 className="h-4 w-4 text-[#5EB563]" />
                      {item.is_completed ? 'Mark Incomplete' : 'Mark as Complete'}
                    </button>
                  )}
                  {onEdit && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowMenu(false); onEdit(); }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowMenu(false); onDelete(); }}
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
        </div>
      )}
    </div>
  );
}
