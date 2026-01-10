'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  X,
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
  Search,
  Tag,
} from 'lucide-react';
import { Category } from '@/lib/api';

// =============================================================================
// TYPES
// =============================================================================

export type UrgencyLevel = 'low' | 'medium' | 'high';

export interface FilterPanelProps {
  urgencyFilter: UrgencyLevel | null;
  selectedTags: string[];
  availableTags: string[];
  selectedCategory: Category | null;
  onUrgencyChange: (urgency: UrgencyLevel | null) => void;
  onTagsChange: (tags: string[]) => void;
  onCategoryChange: (category: Category | null) => void;
  onClearFilters: () => void;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const categoryConfig: { id: Category; icon: typeof BookOpen; label: string; color: string }[] = [
  { id: 'read', icon: BookOpen, label: 'Read', color: 'text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100' },
  { id: 'watch', icon: Video, label: 'Watch', color: 'text-purple-600 bg-purple-50 border-purple-200 hover:bg-purple-100' },
  { id: 'ideas', icon: Lightbulb, label: 'Ideas', color: 'text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100' },
  { id: 'tasks', icon: CheckSquare, label: 'Tasks', color: 'text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100' },
  { id: 'people', icon: Users, label: 'People', color: 'text-pink-600 bg-pink-50 border-pink-200 hover:bg-pink-100' },
  { id: 'notes', icon: FileText, label: 'Notes', color: 'text-slate-600 bg-slate-50 border-slate-200 hover:bg-slate-100' },
  { id: 'goals', icon: Target, label: 'Goals', color: 'text-red-600 bg-red-50 border-red-200 hover:bg-red-100' },
  { id: 'buy', icon: ShoppingCart, label: 'Buy', color: 'text-orange-600 bg-orange-50 border-orange-200 hover:bg-orange-100' },
  { id: 'places', icon: MapPin, label: 'Places', color: 'text-teal-600 bg-teal-50 border-teal-200 hover:bg-teal-100' },
  { id: 'journal', icon: BookMarked, label: 'Journal', color: 'text-indigo-600 bg-indigo-50 border-indigo-200 hover:bg-indigo-100' },
  { id: 'learn', icon: GraduationCap, label: 'Learn', color: 'text-cyan-600 bg-cyan-50 border-cyan-200 hover:bg-cyan-100' },
  { id: 'save', icon: Bookmark, label: 'Saved', color: 'text-gray-600 bg-gray-50 border-gray-200 hover:bg-gray-100' },
];

const urgencyOptions: { value: UrgencyLevel; label: string; color: string }[] = [
  { value: 'high', label: 'High', color: 'text-red-700 bg-red-50 border-red-200 hover:bg-red-100' },
  { value: 'medium', label: 'Medium', color: 'text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100' },
  { value: 'low', label: 'Low', color: 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100' },
];

// =============================================================================
// COMPONENT
// =============================================================================

export function FilterPanel({
  urgencyFilter,
  selectedTags,
  availableTags,
  selectedCategory,
  onUrgencyChange,
  onTagsChange,
  onCategoryChange,
  onClearFilters,
}: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [tagSearch, setTagSearch] = useState('');

  // Calculate active filter count
  const activeFilterCount =
    (urgencyFilter ? 1 : 0) + selectedTags.length + (selectedCategory ? 1 : 0);

  const hasActiveFilters = activeFilterCount > 0;

  // Filter tags by search
  const filteredTags = useMemo(() => {
    if (!tagSearch.trim()) {
      return availableTags.slice(0, 12); // Show first 12 tags by default
    }
    return availableTags.filter((tag) =>
      tag.toLowerCase().includes(tagSearch.toLowerCase())
    );
  }, [availableTags, tagSearch]);

  // Handle urgency toggle
  const handleUrgencyClick = useCallback(
    (urgency: UrgencyLevel) => {
      if (urgencyFilter === urgency) {
        onUrgencyChange(null);
      } else {
        onUrgencyChange(urgency);
      }
    },
    [urgencyFilter, onUrgencyChange]
  );

  // Handle category toggle
  const handleCategoryClick = useCallback(
    (category: Category) => {
      if (selectedCategory === category) {
        onCategoryChange(null);
      } else {
        onCategoryChange(category);
      }
    },
    [selectedCategory, onCategoryChange]
  );

  // Handle tag toggle
  const handleTagClick = useCallback(
    (tag: string) => {
      if (selectedTags.includes(tag)) {
        onTagsChange(selectedTags.filter((t) => t !== tag));
      } else {
        onTagsChange([...selectedTags, tag]);
      }
    },
    [selectedTags, onTagsChange]
  );

  // Handle clear all
  const handleClearAll = useCallback(() => {
    onClearFilters();
    setTagSearch('');
  }, [onClearFilters]);

  return (
    <div className="w-full">
      {/* Toggle button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="group flex w-full items-center justify-between rounded-xl bg-white border border-gray-200 px-4 py-3 text-sm transition-all hover:border-gray-300 hover:shadow-sm"
        aria-expanded={isExpanded}
        aria-controls="filter-panel"
      >
        <div className="flex items-center gap-3">
          <span className="font-medium text-gray-700">Filters</span>
          {hasActiveFilters && (
            <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
              {activeFilterCount} active
            </span>
          )}
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-gray-400"
        >
          <ChevronDown className="h-5 w-5" />
        </motion.div>
      </button>

      {/* Expandable panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            id="filter-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">

              {/* Categories - 12 category grid */}
              <div>
                <label className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <Bookmark className="h-3.5 w-3.5" />
                  Categories
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {categoryConfig.map(({ id, icon: Icon, label, color }) => {
                    const isSelected = selectedCategory === id;
                    return (
                      <button
                        key={id}
                        onClick={() => handleCategoryClick(id)}
                        className={`flex flex-col items-center gap-1.5 rounded-xl border p-2.5 transition-all duration-200 ${
                          isSelected
                            ? `${color} ring-2 ring-offset-1 ring-current`
                            : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-gray-100'
                        }`}
                        aria-pressed={isSelected}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="text-[10px] font-medium">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Urgency filter */}
              <div>
                <label className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Priority Level
                </label>
                <div className="flex flex-wrap gap-2">
                  {urgencyOptions.map((option) => {
                    const isSelected = urgencyFilter === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => handleUrgencyClick(option.value)}
                        className={`rounded-xl border px-4 py-2 text-sm font-medium transition-all duration-200 ${
                          isSelected
                            ? `${option.color} ring-2 ring-offset-1 ring-current`
                            : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-gray-100'
                        }`}
                        aria-pressed={isSelected}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tags filter with search */}
              {availableTags.length > 0 && (
                <div>
                  <label className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <Tag className="h-3.5 w-3.5" />
                    Tags
                  </label>

                  {/* Tag search input */}
                  {availableTags.length > 12 && (
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={tagSearch}
                        onChange={(e) => setTagSearch(e.target.value)}
                        placeholder="Search tags..."
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-700 placeholder-gray-400 outline-none transition-colors focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                      />
                      {tagSearch && (
                        <button
                          onClick={() => setTagSearch('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Tag chips */}
                  <div className="flex flex-wrap gap-2">
                    {filteredTags.map((tag) => {
                      const isSelected = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          onClick={() => handleTagClick(tag)}
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-all duration-200 ${
                            isSelected
                              ? 'border-indigo-300 bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200'
                              : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-gray-100'
                          }`}
                          aria-pressed={isSelected}
                        >
                          <Tag className="h-3 w-3" />
                          {tag}
                        </button>
                      );
                    })}
                    {tagSearch && filteredTags.length === 0 && (
                      <p className="text-sm text-gray-500 italic">No tags match "{tagSearch}"</p>
                    )}
                    {!tagSearch && availableTags.length > 12 && (
                      <p className="text-xs text-gray-400 w-full mt-1">
                        Showing 12 of {availableTags.length} tags. Search to find more.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Clear all button */}
              <AnimatePresence>
                {hasActiveFilters && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="border-t border-gray-100 pt-4"
                  >
                    <button
                      onClick={handleClearAll}
                      className="flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
                    >
                      <X className="h-4 w-4" />
                      Clear all filters
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active filters summary (shown when collapsed) */}
      {!isExpanded && hasActiveFilters && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 flex flex-wrap items-center gap-2"
        >
          {selectedCategory && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-100 px-2.5 py-1 text-xs font-medium text-indigo-700">
              {categoryConfig.find((c) => c.id === selectedCategory)?.label}
              <button
                onClick={() => onCategoryChange(null)}
                className="hover:text-indigo-900"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {urgencyFilter && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
              {urgencyFilter} priority
              <button
                onClick={() => onUrgencyChange(null)}
                className="hover:text-amber-900"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {selectedTags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700"
            >
              {tag}
              <button
                onClick={() => handleTagClick(tag)}
                className="hover:text-gray-900"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {selectedTags.length > 3 && (
            <span className="text-xs text-gray-500">
              +{selectedTags.length - 3} more
            </span>
          )}
        </motion.div>
      )}
    </div>
  );
}

// =============================================================================
// UTILITY HOOK
// =============================================================================

export interface FilterState {
  urgencyFilter: UrgencyLevel | null;
  selectedTags: string[];
  selectedCategory: Category | null;
}

export function useFilterState() {
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyLevel | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const clearFilters = useCallback(() => {
    setUrgencyFilter(null);
    setSelectedTags([]);
    setSelectedCategory(null);
  }, []);

  const hasActiveFilters = urgencyFilter !== null || selectedTags.length > 0 || selectedCategory !== null;

  return {
    urgencyFilter,
    setUrgencyFilter,
    selectedTags,
    setSelectedTags,
    selectedCategory,
    setSelectedCategory,
    clearFilters,
    hasActiveFilters,
  };
}
