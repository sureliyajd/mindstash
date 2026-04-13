'use client';

import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Lightbulb,
  Target,
  Zap,
  Calendar,
} from 'lucide-react';
import { formatDistanceToNow, format, isValid } from 'date-fns';
import { Item, Category } from '@/lib/api';
import { categoryConfig } from '@/lib/categoryConfig';
import type { DashboardHomeData } from '@/lib/hooks/useDashboardHome';
import { parseUTCDate } from '@/lib/dateUtils';
import type { ModuleType } from '@/components/ModuleSelector';
import { AIInsightBanner } from '@/components/feed/AIInsightBanner';

// =============================================================================
// TYPES
// =============================================================================

interface DashboardHomeProps {
  data: DashboardHomeData;
  itemCounts?: Partial<Record<ModuleType, number>>;
  userName: string | null;
  onModuleChange: (module: ModuleType) => void;
  onViewCategory?: (category: Category) => void;
  onViewDetails: (item: Item) => void;
  onToggleComplete: (item: Item, completed: boolean) => void;
}

const EXTRA_CATEGORY_SECTIONS: { category: Category; title: string; module?: ModuleType }[] = [
  { category: 'people', title: 'People', module: 'people' },
  { category: 'journal', title: 'Journal', module: 'journal' },
  { category: 'notes', title: 'Notes' },
  { category: 'watch', title: 'Watch Later' },
  { category: 'learn', title: 'Learning' },
  { category: 'buy', title: 'Shopping' },
  { category: 'places', title: 'Places' },
  { category: 'save', title: 'Saved' },
];

// =============================================================================
// SECTION HEADER
// =============================================================================

function SectionHeader({
  icon: Icon,
  title,
  count,
  color,
  actionLabel,
  onAction,
}: {
  icon: typeof Zap;
  title: string;
  count?: number;
  color: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`flex h-7 w-7 items-center justify-center rounded-lg`} style={{ backgroundColor: `${color}15` }}>
          <Icon className="h-3.5 w-3.5" style={{ color }} />
        </div>
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
        {count !== undefined && count > 0 && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
            {count}
          </span>
        )}
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="flex items-center gap-1 text-xs font-medium text-gray-400 transition-colors hover:text-gray-600"
        >
          {actionLabel}
          <ArrowRight className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

// =============================================================================
// COMPACT ITEM ROW (used in dashboard sections)
// =============================================================================

function CompactRow({
  item,
  onViewDetails,
  onToggleComplete,
  showCheckbox,
}: {
  item: Item;
  onViewDetails: () => void;
  onToggleComplete?: () => void;
  showCheckbox?: boolean;
}) {
  const category = (item.category as Category) || 'save';
  const info = categoryConfig[category] || categoryConfig.save;
  const Icon = info.icon;
  const createdDate = parseUTCDate(item.created_at) ?? new Date();
  const timeAgo = isValid(createdDate) ? formatDistanceToNow(createdDate, { addSuffix: true }) : '';
  const notifDate = parseUTCDate(item.notification_date);

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-gray-50 cursor-pointer min-w-0 ${
        item.is_completed ? 'opacity-50' : ''
      }`}
      onClick={onViewDetails}
    >
      {showCheckbox && onToggleComplete ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete();
          }}
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
            item.is_completed
              ? 'border-[#5EB563] bg-[#5EB563]'
              : 'border-gray-300 hover:border-[#EA7B7B]'
          }`}
        >
          {item.is_completed && <CheckCircle2 className="h-3 w-3 text-white" />}
        </button>
      ) : (
        <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${info.bgColor.split(' ')[0]}`}>
          <Icon className={`h-3 w-3 ${info.color}`} />
        </div>
      )}

      <p className={`flex-1 truncate text-sm text-gray-700 ${item.is_completed ? 'line-through' : ''}`}>
        {item.content}
      </p>

      {item.urgency === 'high' && !item.is_completed && (
        <span className="shrink-0 rounded-md bg-[#FF8364]/15 px-1.5 py-0.5 text-[10px] font-bold text-[#D65E3F]">
          High
        </span>
      )}

      {notifDate && isValid(notifDate) && !item.is_completed && (
        <span className="shrink-0 flex items-center gap-1 text-[10px] text-gray-400">
          <Calendar className="h-2.5 w-2.5" />
          {format(notifDate, 'MMM d')}
        </span>
      )}

      <span className="shrink-0 font-mono text-[10px] text-gray-400 hidden sm:block">{timeAgo}</span>
    </motion.div>
  );
}

// =============================================================================
// SKELETON
// =============================================================================

export function DashboardHomeSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* AI Insight banner skeleton */}
      <div className="rounded-xl bg-gray-100 px-4 py-3">
        <div className="h-4 w-64 rounded bg-gray-200" />
      </div>

      {/* Sections skeleton */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-sm">
            <div className="mb-4 h-5 w-32 rounded bg-gray-200" />
            <div className="space-y-3">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="h-10 rounded-lg bg-gray-50" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function DashboardHome({
  data,
  itemCounts,
  userName,
  onModuleChange,
  onViewCategory,
  onViewDetails,
  onToggleComplete,
}: DashboardHomeProps) {
  const { digest, todayItems, recentIdeas, readingQueue, activeGoals, byCategory, isLoading } = data;

  if (isLoading) {
    return <DashboardHomeSkeleton />;
  }

  const urgentItems = digest?.urgent_items ?? [];
  const pendingTasks = digest?.pending_tasks ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* ================================================================= */}
      {/* AI INSIGHT BANNER */}
      {/* ================================================================= */}
      <AIInsightBanner
        urgentCount={urgentItems.length}
        todayCount={itemCounts?.today ?? 0}
        pendingTasksCount={digest?.tasks_count ?? 0}
        completedThisWeek={digest?.completed_this_week ?? 0}
      />

      {/* ================================================================= */}
      {/* URGENT / NEEDS ATTENTION — promoted to first position */}
      {/* ================================================================= */}
      {urgentItems.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-[#FF8364]/20 bg-[#FF8364]/[0.04] p-4 sm:p-5 shadow-sm">
          <SectionHeader
            icon={AlertTriangle}
            title="Needs Attention"
            count={urgentItems.length}
            color="#D65E3F"
            actionLabel="View all tasks"
            onAction={() => onModuleChange('tasks')}
          />
          <div className="-mx-1">
            {urgentItems.slice(0, 5).map((urgentItem) => {
              const cat = (urgentItem.category as Category) || 'save';
              const info = categoryConfig[cat] || categoryConfig.save;
              const UrgentIcon = info.icon;
              return (
                <div
                  key={urgentItem.id}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/60 cursor-pointer min-w-0"
                  onClick={() => onViewDetails(urgentItem as unknown as Item)}
                >
                  <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${info.bgColor.split(' ')[0]}`}>
                    <UrgentIcon className={`h-3 w-3 ${info.color}`} />
                  </div>
                  <p className="flex-1 truncate text-sm text-gray-700">{urgentItem.content}</p>
                  <span className="shrink-0 rounded-md bg-[#FF8364]/15 px-1.5 py-0.5 text-[10px] font-bold text-[#D65E3F]">
                    Urgent
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MAIN GRID: Today + Pending Tasks | Ideas + Reading + Goals */}
      {/* ================================================================= */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">

        {/* TODAY'S ITEMS */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-sm">
          <SectionHeader
            icon={Clock}
            title="Today"
            count={itemCounts?.today}
            color="#D65E3F"
            actionLabel="View all"
            onAction={() => onModuleChange('today')}
          />
          {todayItems.length > 0 ? (
            <div className="-mx-1">
              {todayItems.map((item) => (
                <CompactRow
                  key={item.id}
                  item={item}
                  showCheckbox={item.category === 'tasks'}
                  onViewDetails={() => onViewDetails(item)}
                  onToggleComplete={() => onToggleComplete(item, !item.is_completed)}
                />
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-gray-400">Nothing urgent today. Enjoy your day!</p>
          )}
        </div>

        {/* PENDING TASKS */}
        {pendingTasks.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-sm">
            <SectionHeader
              icon={CheckCircle2}
              title="Pending Tasks"
              count={pendingTasks.length}
              color="#C9A030"
              actionLabel="View all"
              onAction={() => onModuleChange('tasks')}
            />
            <div className="-mx-1">
              {pendingTasks.slice(0, 5).map((task) => {
                const cat = (task.category as Category) || 'tasks';
                const info = categoryConfig[cat] || categoryConfig.tasks;
                const TaskIcon = info.icon;
                return (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-gray-50 cursor-pointer min-w-0"
                    onClick={() => onViewDetails(task as unknown as Item)}
                  >
                    <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${info.bgColor.split(' ')[0]}`}>
                      <TaskIcon className={`h-3 w-3 ${info.color}`} />
                    </div>
                    <p className="flex-1 truncate text-sm text-gray-700">{task.content}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* RECENT IDEAS */}
        {recentIdeas.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-sm">
            <SectionHeader
              icon={Lightbulb}
              title="Recent Ideas"
              count={itemCounts?.ideas}
              color="#C9A030"
              actionLabel="View all"
              onAction={() => onModuleChange('ideas')}
            />
            <div className="-mx-1">
              {recentIdeas.map((item) => (
                <CompactRow
                  key={item.id}
                  item={item}
                  onViewDetails={() => onViewDetails(item)}
                />
              ))}
            </div>
          </div>
        )}

        {/* READING QUEUE */}
        {readingQueue.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-sm">
            <SectionHeader
              icon={BookOpen}
              title="Reading Queue"
              count={itemCounts?.read_later}
              color="#5AACA8"
              actionLabel="View all"
              onAction={() => onModuleChange('read_later')}
            />
            <div className="-mx-1">
              {readingQueue.map((item) => (
                <CompactRow
                  key={item.id}
                  item={item}
                  onViewDetails={() => onViewDetails(item)}
                />
              ))}
            </div>
          </div>
        )}

        {/* EXTRA CATEGORY SECTIONS — surface remaining captures so nothing feels lost */}
        {EXTRA_CATEGORY_SECTIONS.map(({ category, title, module }) => {
          const catItems = byCategory?.[category] ?? [];
          if (catItems.length === 0) return null;
          const info = categoryConfig[category];
          const colorMatch = info.color.match(/\[(#[0-9A-Fa-f]+)\]/);
          const color = colorMatch ? colorMatch[1] : '#6B7280';
          return (
            <div key={category} className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-sm">
              <SectionHeader
                icon={info.icon}
                title={title}
                count={catItems.length}
                color={color}
                actionLabel="View all"
                onAction={() => {
                  if (module) onModuleChange(module);
                  else if (onViewCategory) onViewCategory(category);
                  else onModuleChange('all');
                }}
              />
              <div className="-mx-1">
                {catItems.map((item) => (
                  <CompactRow
                    key={item.id}
                    item={item}
                    onViewDetails={() => onViewDetails(item)}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {/* ACTIVE GOALS */}
        {activeGoals.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-sm">
            <SectionHeader
              icon={Target}
              title="Active Goals"
              count={activeGoals.length}
              color="#C9A030"
              actionLabel="View all"
              onAction={() => onModuleChange('tasks')}
            />
            <div className="-mx-1">
              {activeGoals.filter((g) => !g.is_completed).map((item) => (
                <CompactRow
                  key={item.id}
                  item={item}
                  showCheckbox
                  onViewDetails={() => onViewDetails(item)}
                  onToggleComplete={() => onToggleComplete(item, !item.is_completed)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
