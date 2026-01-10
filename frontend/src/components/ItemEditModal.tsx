'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Save,
  Loader2,
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
  Plus,
  Tag as TagIcon,
} from 'lucide-react';
import {
  Item,
  ItemUpdate,
  Category,
  Priority,
  Urgency,
  Intent,
  TimeContext,
  ResurfaceStrategy,
} from '@/lib/api';

// =============================================================================
// CATEGORY CONFIG
// =============================================================================

const categoryOptions: { id: Category; icon: typeof BookOpen; label: string }[] = [
  { id: 'read', icon: BookOpen, label: 'Read' },
  { id: 'watch', icon: Video, label: 'Watch' },
  { id: 'ideas', icon: Lightbulb, label: 'Ideas' },
  { id: 'tasks', icon: CheckSquare, label: 'Tasks' },
  { id: 'people', icon: Users, label: 'People' },
  { id: 'notes', icon: FileText, label: 'Notes' },
  { id: 'goals', icon: Target, label: 'Goals' },
  { id: 'buy', icon: ShoppingCart, label: 'Buy' },
  { id: 'places', icon: MapPin, label: 'Places' },
  { id: 'journal', icon: BookMarked, label: 'Journal' },
  { id: 'learn', icon: GraduationCap, label: 'Learn' },
  { id: 'save', icon: Bookmark, label: 'Saved' },
];

const priorityOptions: { value: Priority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 'medium', label: 'Medium', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'high', label: 'High', color: 'bg-red-100 text-red-700 border-red-200' },
];

const urgencyOptions: { value: Urgency; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 'medium', label: 'Medium', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'high', label: 'High', color: 'bg-red-100 text-red-700 border-red-200' },
];

const intentOptions: { value: Intent; label: string }[] = [
  { value: 'learn', label: 'Learning' },
  { value: 'task', label: 'Task' },
  { value: 'reminder', label: 'Reminder' },
  { value: 'idea', label: 'Idea' },
  { value: 'reflection', label: 'Reflection' },
  { value: 'reference', label: 'Reference' },
];

const timeContextOptions: { value: TimeContext; label: string }[] = [
  { value: 'immediate', label: 'Now' },
  { value: 'next_week', label: 'This Week' },
  { value: 'someday', label: 'Someday' },
  { value: 'conditional', label: 'When Relevant' },
  { value: 'date', label: 'Scheduled' },
];

const resurfaceOptions: { value: ResurfaceStrategy; label: string }[] = [
  { value: 'time_based', label: 'Time-Based' },
  { value: 'contextual', label: 'Smart/Contextual' },
  { value: 'weekly_review', label: 'Weekly Review' },
  { value: 'manual', label: 'Manual' },
];

// =============================================================================
// PROPS
// =============================================================================

interface ItemEditModalProps {
  item: Item;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: ItemUpdate) => Promise<void>;
  isSaving?: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ItemEditModal({
  item,
  isOpen,
  onClose,
  onSave,
  isSaving = false,
}: ItemEditModalProps) {
  // Form state
  const [content, setContent] = useState(item.content);
  const [url, setUrl] = useState(item.url || '');
  const [category, setCategory] = useState<Category>(item.category || 'save');
  const [tags, setTags] = useState<string[]>(item.tags || []);
  const [newTag, setNewTag] = useState('');
  const [priority, setPriority] = useState<Priority>(item.priority || 'medium');
  const [urgency, setUrgency] = useState<Urgency>(item.urgency || 'low');
  const [intent, setIntent] = useState<Intent>(item.intent || 'reference');
  const [timeContext, setTimeContext] = useState<TimeContext>(item.time_context || 'someday');
  const [resurfaceStrategy, setResurfaceStrategy] = useState<ResurfaceStrategy>(
    item.resurface_strategy || 'manual'
  );
  const [actionRequired, setActionRequired] = useState(item.action_required || false);

  const MAX_CHARS = 500;
  const charCount = content.length;
  const isOverLimit = charCount > MAX_CHARS;

  // Reset form when item changes
  useEffect(() => {
    setContent(item.content);
    setUrl(item.url || '');
    setCategory(item.category || 'save');
    setTags(item.tags || []);
    setPriority(item.priority || 'medium');
    setUrgency(item.urgency || 'low');
    setIntent(item.intent || 'reference');
    setTimeContext(item.time_context || 'someday');
    setResurfaceStrategy(item.resurface_strategy || 'manual');
    setActionRequired(item.action_required || false);
  }, [item]);

  // Handle tag addition
  const handleAddTag = useCallback(() => {
    const trimmed = newTag.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setNewTag('');
    }
  }, [newTag, tags]);

  // Handle tag removal
  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  }, [tags]);

  // Handle save
  const handleSave = useCallback(async () => {
    if (isOverLimit || isSaving) return;

    const updates: ItemUpdate = {
      content: content.trim(),
      url: url.trim() || undefined,
      category,
      tags,
      priority,
      urgency,
      intent,
      time_context: timeContext,
      resurface_strategy: resurfaceStrategy,
      action_required: actionRequired,
    };

    await onSave(updates);
  }, [
    content,
    url,
    category,
    tags,
    priority,
    urgency,
    intent,
    timeContext,
    resurfaceStrategy,
    actionRequired,
    isOverLimit,
    isSaving,
    onSave,
  ]);

  // Handle key press for tag input
  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white/90 px-6 py-4 backdrop-blur-sm">
            <h2 className="text-lg font-semibold text-gray-900">Edit Memory</h2>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-6 p-6">
            {/* Content textarea */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Content
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                className={`w-full rounded-xl border bg-gray-50 px-4 py-3 text-gray-800 outline-none transition-colors focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100 ${
                  isOverLimit ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder="What's on your mind?"
              />
              <div className="mt-1 flex justify-end">
                <span
                  className={`text-xs ${
                    isOverLimit ? 'text-red-600' : charCount > 450 ? 'text-amber-600' : 'text-gray-400'
                  }`}
                >
                  {charCount}/{MAX_CHARS}
                </span>
              </div>
            </div>

            {/* URL input */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                URL (optional)
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-800 outline-none transition-colors focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                placeholder="https://..."
              />
            </div>

            {/* Category selector */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Category
              </label>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                {categoryOptions.map(({ id, icon: Icon, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setCategory(id)}
                    className={`flex flex-col items-center gap-1 rounded-xl border p-2.5 transition-all ${
                      category === id
                        ? 'border-indigo-300 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-100'
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-[10px] font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Tags
              </label>
              <div className="mb-2 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-sm text-gray-700"
                  >
                    <TagIcon className="h-3 w-3" />
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 rounded-full p-0.5 hover:bg-gray-200"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={handleTagKeyPress}
                  className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-800 outline-none transition-colors focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  placeholder="Add a tag..."
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  disabled={!newTag.trim()}
                  className="rounded-xl bg-gray-100 px-3 py-2 text-gray-600 transition-colors hover:bg-gray-200 disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Priority & Urgency row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Priority
                </label>
                <div className="flex gap-2">
                  {priorityOptions.map(({ value, label, color }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setPriority(value)}
                      className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition-all ${
                        priority === value
                          ? `${color} ring-2 ring-offset-1`
                          : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Urgency
                </label>
                <div className="flex gap-2">
                  {urgencyOptions.map(({ value, label, color }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setUrgency(value)}
                      className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition-all ${
                        urgency === value
                          ? `${color} ring-2 ring-offset-1`
                          : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Intent selector */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Intent
              </label>
              <div className="flex flex-wrap gap-2">
                {intentOptions.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setIntent(value)}
                    className={`rounded-xl border px-3 py-2 text-sm font-medium transition-all ${
                      intent === value
                        ? 'border-indigo-300 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-100'
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Context & Resurface Strategy */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  When
                </label>
                <select
                  value={timeContext}
                  onChange={(e) => setTimeContext(e.target.value as TimeContext)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 outline-none transition-colors focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                >
                  {timeContextOptions.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Resurface
                </label>
                <select
                  value={resurfaceStrategy}
                  onChange={(e) => setResurfaceStrategy(e.target.value as ResurfaceStrategy)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 outline-none transition-colors focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                >
                  {resurfaceOptions.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action Required toggle */}
            <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div>
                <p className="font-medium text-gray-700">Action Required</p>
                <p className="text-sm text-gray-500">Does this need your attention?</p>
              </div>
              <button
                type="button"
                onClick={() => setActionRequired(!actionRequired)}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  actionRequired ? 'bg-indigo-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                    actionRequired ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-gray-100 bg-white/90 px-6 py-4 backdrop-blur-sm">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || isOverLimit}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Changes
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
