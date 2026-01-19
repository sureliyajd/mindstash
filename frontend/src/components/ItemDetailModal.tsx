'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  X,
  Pencil,
  Trash2,
  ExternalLink,
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
  Brain,
  Zap,
  Clock,
  AlertCircle,
  TrendingUp,
  RotateCcw,
  Tag,
  Calendar,
  Sparkles,
  Activity,
  CheckCircle2,
  Circle,
  Bell,
  BellOff,
  Check,
  Repeat,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { Item, Category, NotificationFrequency } from '@/lib/api';

// =============================================================================
// CATEGORY CONFIG
// =============================================================================

const categoryConfig: Record<Category, { icon: typeof BookOpen; label: string; color: string; bgColor: string }> = {
  read: { icon: BookOpen, label: 'Read', color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-200' },
  watch: { icon: Video, label: 'Watch', color: 'text-purple-600', bgColor: 'bg-purple-50 border-purple-200' },
  ideas: { icon: Lightbulb, label: 'Ideas', color: 'text-amber-600', bgColor: 'bg-amber-50 border-amber-200' },
  tasks: { icon: CheckSquare, label: 'Tasks', color: 'text-emerald-600', bgColor: 'bg-emerald-50 border-emerald-200' },
  people: { icon: Users, label: 'People', color: 'text-pink-600', bgColor: 'bg-pink-50 border-pink-200' },
  notes: { icon: FileText, label: 'Notes', color: 'text-slate-600', bgColor: 'bg-slate-50 border-slate-200' },
  goals: { icon: Target, label: 'Goals', color: 'text-red-600', bgColor: 'bg-red-50 border-red-200' },
  buy: { icon: ShoppingCart, label: 'Buy', color: 'text-orange-600', bgColor: 'bg-orange-50 border-orange-200' },
  places: { icon: MapPin, label: 'Places', color: 'text-teal-600', bgColor: 'bg-teal-50 border-teal-200' },
  journal: { icon: BookMarked, label: 'Journal', color: 'text-indigo-600', bgColor: 'bg-indigo-50 border-indigo-200' },
  learn: { icon: GraduationCap, label: 'Learn', color: 'text-cyan-600', bgColor: 'bg-cyan-50 border-cyan-200' },
  save: { icon: Bookmark, label: 'Saved', color: 'text-gray-600', bgColor: 'bg-gray-50 border-gray-200' },
};

// Intent display config
const intentConfig: Record<string, { label: string; description: string; icon: typeof Zap }> = {
  learn: { label: 'Learning', description: 'Content to absorb and understand', icon: GraduationCap },
  task: { label: 'Action Item', description: 'Something that requires your action', icon: CheckSquare },
  reminder: { label: 'Reminder', description: 'Something to keep in mind', icon: Clock },
  idea: { label: 'Creative Idea', description: 'A spark worth exploring', icon: Lightbulb },
  reflection: { label: 'Personal Thought', description: 'Your own insight or feeling', icon: BookMarked },
  reference: { label: 'Reference', description: 'Information to look up later', icon: FileText },
};

// Urgency display config
const urgencyConfig: Record<string, { label: string; color: string; bgColor: string; description: string }> = {
  high: {
    label: 'High',
    color: 'text-red-700',
    bgColor: 'bg-red-50 border-red-200',
    description: 'Needs immediate attention'
  },
  medium: {
    label: 'Medium',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50 border-amber-200',
    description: 'Should be addressed soon'
  },
  low: {
    label: 'Low',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50 border-emerald-200',
    description: 'No rush, handle when convenient'
  },
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

// Priority config
const priorityConfig: Record<string, { label: string; color: string }> = {
  high: { label: 'High Priority', color: 'text-red-600' },
  medium: { label: 'Medium Priority', color: 'text-amber-600' },
  low: { label: 'Low Priority', color: 'text-emerald-600' },
};

// Notification frequency config
const notificationFrequencyConfig: Record<NotificationFrequency, { label: string; description: string }> = {
  once: { label: 'One time', description: 'Notify once and stop' },
  daily: { label: 'Daily', description: 'Every day at the set time' },
  weekly: { label: 'Weekly', description: 'Every week on the same day' },
  monthly: { label: 'Monthly', description: 'Every month on the same date' },
  never: { label: 'Never', description: 'No notifications' },
};

// =============================================================================
// PROPS
// =============================================================================

interface ItemDetailModalProps {
  item: Item;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleComplete?: (completed: boolean) => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ItemDetailModal({
  item,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onToggleComplete,
}: ItemDetailModalProps) {
  const [isCompleting, setIsCompleting] = useState(false);

  const category = (item.category as Category) || 'save';
  const categoryInfo = categoryConfig[category] || categoryConfig.save;
  const Icon = categoryInfo.icon;
  const confidence = item.confidence ?? 0;

  // AI Intelligence Signals
  const intent = item.intent;
  const urgency = item.urgency;
  const timeContext = item.time_context;
  const resurfaceStrategy = item.resurface_strategy;
  const actionRequired = item.action_required;
  const priority = item.priority;
  const suggestedBucket = item.suggested_bucket;

  // Notification fields
  const notificationDate = item.notification_date;
  const notificationFrequency = item.notification_frequency;
  const nextNotificationAt = item.next_notification_at;
  const notificationEnabled = item.notification_enabled;
  const isCompleted = item.is_completed;
  const completedAt = item.completed_at;

  // Format timestamps
  const timeAgo = formatDistanceToNow(new Date(item.created_at), { addSuffix: true });
  const createdDate = format(new Date(item.created_at), 'MMMM d, yyyy \'at\' h:mm a');
  const updatedDate = format(new Date(item.updated_at), 'MMMM d, yyyy \'at\' h:mm a');

  // Format notification date
  const formattedNotificationDate = notificationDate
    ? format(new Date(notificationDate), 'MMMM d, yyyy \'at\' h:mm a')
    : null;
  const formattedNextNotification = nextNotificationAt
    ? format(new Date(nextNotificationAt), 'MMMM d, yyyy \'at\' h:mm a')
    : null;

  // Handle completion toggle
  const handleToggleComplete = async () => {
    if (!onToggleComplete || isCompleting) return;
    setIsCompleting(true);
    try {
      await onToggleComplete(!isCompleted);
    } finally {
      setIsCompleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-6 py-4">
            <div className="flex items-center gap-3">
              {/* Category badge */}
              <div className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 ${categoryInfo.bgColor}`}>
                <Icon className={`h-4 w-4 ${categoryInfo.color}`} />
                <span className={`text-sm font-semibold ${categoryInfo.color}`}>
                  {categoryInfo.label}
                </span>
              </div>

              {/* Confidence badge */}
              {confidence > 0 && (
                <div className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ${
                  confidence >= 0.9 ? 'bg-emerald-50 text-emerald-700' :
                  confidence >= 0.7 ? 'bg-gray-100 text-gray-600' :
                  'bg-amber-50 text-amber-700'
                }`}>
                  <Activity className="h-3 w-3" />
                  {Math.round(confidence * 100)}% confident
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={onEdit}
                className="flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-100"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </button>
              <button
                onClick={onDelete}
                className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
              <button
                onClick={onClose}
                className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-6 p-6">
              {/* Completion Status Banner */}
              {isCompleted && (
                <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 border border-emerald-200 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                    <Check className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-emerald-700">Completed</p>
                    {completedAt && (
                      <p className="text-xs text-emerald-600">
                        {format(new Date(completedAt), 'MMMM d, yyyy \'at\' h:mm a')}
                      </p>
                    )}
                  </div>
                  {onToggleComplete && (
                    <button
                      onClick={handleToggleComplete}
                      disabled={isCompleting}
                      className="ml-auto rounded-lg bg-emerald-100 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-200 transition-colors disabled:opacity-50"
                    >
                      Mark Incomplete
                    </button>
                  )}
                </div>
              )}

              {/* Main Content */}
              <div className={`rounded-2xl bg-gray-50 p-5 ${isCompleted ? 'opacity-60' : ''}`}>
                <p className={`text-lg leading-relaxed text-gray-800 whitespace-pre-wrap break-words ${isCompleted ? 'line-through' : ''}`}>
                  {item.content}
                </p>
              </div>

              {/* Completion Button (if not completed) */}
              {!isCompleted && onToggleComplete && (
                <button
                  onClick={handleToggleComplete}
                  disabled={isCompleting}
                  className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-medium text-emerald-700 hover:bg-emerald-100 transition-colors w-full justify-center disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {isCompleting ? 'Marking...' : 'Mark as Complete'}
                </button>
              )}

              {/* URL if present */}
              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 transition-colors hover:bg-blue-100"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                    <ExternalLink className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-blue-900">Attached Link</p>
                    <p className="truncate text-sm text-blue-700">{item.url}</p>
                  </div>
                </a>
              )}

              {/* Tags */}
              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-sm text-gray-700"
                    >
                      <Tag className="h-3.5 w-3.5" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Notification Section */}
              {(notificationDate || notificationEnabled) && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-[#EA7B7B]" />
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                      Notification Settings
                    </h3>
                  </div>

                  <div className="rounded-2xl border border-[#EA7B7B]/20 bg-[#EA7B7B]/5 p-5">
                    <div className="flex items-start gap-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                        notificationEnabled && !isCompleted
                          ? 'bg-[#EA7B7B]/20'
                          : 'bg-gray-200'
                      }`}>
                        {notificationEnabled && !isCompleted ? (
                          <Bell className="h-6 w-6 text-[#EA7B7B]" />
                        ) : (
                          <BellOff className="h-6 w-6 text-gray-400" />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-semibold ${
                            notificationEnabled && !isCompleted
                              ? 'text-[#C44545]'
                              : 'text-gray-500'
                          }`}>
                            {notificationEnabled && !isCompleted
                              ? 'Notifications Enabled'
                              : isCompleted
                                ? 'Notifications Stopped (Completed)'
                                : 'Notifications Disabled'
                            }
                          </span>
                          {notificationFrequency && notificationFrequency !== 'never' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#EA7B7B]/10 px-2 py-0.5 text-xs font-medium text-[#C44545]">
                              <Repeat className="h-3 w-3" />
                              {notificationFrequencyConfig[notificationFrequency]?.label || notificationFrequency}
                            </span>
                          )}
                        </div>

                        {formattedNotificationDate && (
                          <p className="mt-1 text-sm text-gray-600">
                            <span className="font-medium">Scheduled:</span> {formattedNotificationDate}
                          </p>
                        )}

                        {formattedNextNotification && notificationEnabled && !isCompleted && (
                          <p className="mt-1 text-sm text-[#C44545]">
                            <span className="font-medium">Next notification:</span> {formattedNextNotification}
                          </p>
                        )}

                        {notificationFrequency && notificationFrequencyConfig[notificationFrequency] && (
                          <p className="mt-2 text-xs text-gray-500">
                            {notificationFrequencyConfig[notificationFrequency].description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Insights Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-indigo-600" />
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                    AI Insights
                  </h3>
                </div>

                {/* AI Summary */}
                {item.summary && (
                  <div className="rounded-2xl bg-[#79C9C5]/10 p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#79C9C5]/20">
                        <Brain className="h-5 w-5 text-[#5AACA8]" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#5AACA8]">
                          AI Summary
                        </p>
                        <p className="mt-1 text-base text-[#3D8583]">
                          {item.summary}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* AI Understanding Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Intent */}
                  {intent && intentConfig[intent] && (
                    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
                          <Zap className="h-4 w-4 text-purple-600" />
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Intent
                        </span>
                      </div>
                      <p className="mt-2 text-base font-semibold text-gray-800">
                        {intentConfig[intent].label}
                      </p>
                      <p className="mt-0.5 text-sm text-gray-500">
                        {intentConfig[intent].description}
                      </p>
                    </div>
                  )}

                  {/* Urgency */}
                  {urgency && urgencyConfig[urgency] && (
                    <div className={`rounded-2xl border p-4 ${urgencyConfig[urgency].bgColor}`}>
                      <div className="flex items-center gap-2">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                          urgency === 'high' ? 'bg-red-100' :
                          urgency === 'medium' ? 'bg-amber-100' :
                          'bg-emerald-100'
                        }`}>
                          <AlertCircle className={`h-4 w-4 ${urgencyConfig[urgency].color}`} />
                        </div>
                        <span className={`text-xs font-semibold uppercase tracking-wide ${urgencyConfig[urgency].color}`}>
                          Urgency
                        </span>
                      </div>
                      <p className={`mt-2 text-base font-semibold ${urgencyConfig[urgency].color}`}>
                        {urgencyConfig[urgency].label}
                      </p>
                      <p className={`mt-0.5 text-sm opacity-80 ${urgencyConfig[urgency].color}`}>
                        {urgencyConfig[urgency].description}
                      </p>
                    </div>
                  )}

                  {/* Time Context */}
                  {timeContext && timeContextConfig[timeContext] && (
                    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                          <Clock className="h-4 w-4 text-blue-600" />
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Timing
                        </span>
                      </div>
                      <p className="mt-2 text-base font-semibold text-gray-800">
                        {timeContextConfig[timeContext].label}
                      </p>
                      <p className="mt-0.5 text-sm text-gray-500">
                        {timeContextConfig[timeContext].description}
                      </p>
                    </div>
                  )}

                  {/* Resurface Strategy */}
                  {resurfaceStrategy && resurfaceConfig[resurfaceStrategy] && (
                    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100">
                          <RotateCcw className="h-4 w-4 text-teal-600" />
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Resurface
                        </span>
                      </div>
                      <p className="mt-2 text-base font-semibold text-gray-800">
                        {resurfaceConfig[resurfaceStrategy].label}
                      </p>
                      <p className="mt-0.5 text-sm text-gray-500">
                        {resurfaceConfig[resurfaceStrategy].description}
                      </p>
                    </div>
                  )}
                </div>

                {/* Additional Metadata */}
                <div className="grid grid-cols-3 gap-3">
                  {/* Priority */}
                  {priority && priorityConfig[priority] && (
                    <div className="rounded-xl bg-gray-50 p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <TrendingUp className={`h-4 w-4 ${priorityConfig[priority].color}`} />
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Priority
                        </span>
                      </div>
                      <p className={`mt-1 text-sm font-semibold capitalize ${priorityConfig[priority].color}`}>
                        {priority}
                      </p>
                    </div>
                  )}

                  {/* Action Required */}
                  <div className="rounded-xl bg-gray-50 p-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {actionRequired ? (
                        <CheckCircle2 className="h-4 w-4 text-amber-600" />
                      ) : (
                        <Circle className="h-4 w-4 text-gray-400" />
                      )}
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Action
                      </span>
                    </div>
                    <p className={`mt-1 text-sm font-semibold ${actionRequired ? 'text-amber-600' : 'text-gray-500'}`}>
                      {actionRequired ? 'Required' : 'None'}
                    </p>
                  </div>

                  {/* Suggested Bucket */}
                  {suggestedBucket && (
                    <div className="rounded-xl bg-indigo-50 p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Bookmark className="h-4 w-4 text-indigo-600" />
                        <span className="text-xs font-semibold uppercase tracking-wide text-indigo-400">
                          Bucket
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-semibold text-indigo-600">
                        {suggestedBucket}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer with timestamps */}
          <div className="border-t border-gray-100 bg-gray-50 px-6 py-4">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>Created {timeAgo}</span>
                <span className="text-gray-300">•</span>
                <span>{createdDate}</span>
              </div>
              {item.updated_at !== item.created_at && (
                <span>Last updated: {updatedDate}</span>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
