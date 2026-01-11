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
// CONSTANTS - MINDSTASH BRAND COLORS
// =============================================================================

const categoryConfig: { id: Category; icon: typeof BookOpen; label: string; color: string }[] = [
  { id: 'read', icon: BookOpen, label: 'Read', color: 'text-[#5AACA8] bg-[#79C9C5]/10 border-[#79C9C5]/30 hover:bg-[#79C9C5]/20' },
  { id: 'watch', icon: Video, label: 'Watch', color: 'text-[#5AACA8] bg-[#79C9C5]/10 border-[#79C9C5]/30 hover:bg-[#79C9C5]/20' },
  { id: 'ideas', icon: Lightbulb, label: 'Ideas', color: 'text-[#C9A030] bg-[#FACE68]/15 border-[#FACE68]/30 hover:bg-[#FACE68]/25' },
  { id: 'tasks', icon: CheckSquare, label: 'Tasks', color: 'text-[#D65E3F] bg-[#FF8364]/10 border-[#FF8364]/30 hover:bg-[#FF8364]/20' },
  { id: 'people', icon: Users, label: 'People', color: 'text-[#C44545] bg-[#EA7B7B]/10 border-[#EA7B7B]/30 hover:bg-[#EA7B7B]/20' },
  { id: 'notes', icon: FileText, label: 'Notes', color: 'text-[#5EB563] bg-[#93DA97]/10 border-[#93DA97]/30 hover:bg-[#93DA97]/20' },
  { id: 'goals', icon: Target, label: 'Goals', color: 'text-[#C9A030] bg-[#FACE68]/15 border-[#FACE68]/30 hover:bg-[#FACE68]/25' },
  { id: 'buy', icon: ShoppingCart, label: 'Buy', color: 'text-[#C44545] bg-[#EA7B7B]/10 border-[#EA7B7B]/30 hover:bg-[#EA7B7B]/20' },
  { id: 'places', icon: MapPin, label: 'Places', color: 'text-[#5AACA8] bg-[#79C9C5]/10 border-[#79C9C5]/30 hover:bg-[#79C9C5]/20' },
  { id: 'journal', icon: BookMarked, label: 'Journal', color: 'text-[#5EB563] bg-[#93DA97]/10 border-[#93DA97]/30 hover:bg-[#93DA97]/20' },
  { id: 'learn', icon: GraduationCap, label: 'Learn', color: 'text-[#5AACA8] bg-[#79C9C5]/10 border-[#79C9C5]/30 hover:bg-[#79C9C5]/20' },
  { id: 'save', icon: Bookmark, label: 'Saved', color: 'text-[#C44545] bg-[#EA7B7B]/10 border-[#EA7B7B]/30 hover:bg-[#EA7B7B]/20' },
];

const urgencyOptions: { value: UrgencyLevel; label: string; color: string }[] = [
  { value: 'high', label: 'High', color: 'text-[#D65E3F] bg-[#FF8364]/15 border-[#FF8364]/30 hover:bg-[#FF8364]/25' },
  { value: 'medium', label: 'Medium', color: 'text-[#C9A030] bg-[#FACE68]/15 border-[#FACE68]/30 hover:bg-[#FACE68]/25' },
  { value: 'low', label: 'Low', color: 'text-[#5EB563] bg-[#93DA97]/15 border-[#93DA97]/30 hover:bg-[#93DA97]/25' },
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
        className="group flex w-full items-center justify-between rounded-2xl bg-white border border-gray-100 px-5 py-3.5 text-sm transition-all hover:border-gray-200 hover:shadow-sm"
        aria-expanded={isExpanded}
        aria-controls="filter-panel"
      >
        <div className="flex items-center gap-3">
          <span className="font-semibold text-gray-700">Filters</span>
          {hasActiveFilters && (
            <span className="rounded-full bg-[#EA7B7B]/15 px-2.5 py-0.5 text-xs font-bold text-[#C44545]">
              <span className="font-mono tabular-nums">{activeFilterCount}</span> active
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
            <div className="mt-3 space-y-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">

              {/* Categories - 12 category grid */}
              <div>
                <label className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-500">
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
                        className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all duration-200 ${
                          isSelected
                            ? `${color} ring-2 ring-offset-1 ring-current`
                            : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200 hover:bg-gray-100'
                        }`}
                        aria-pressed={isSelected}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="text-[10px] font-semibold">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Urgency filter */}
              <div>
                <label className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                  Priority Level
                </label>
                <div className="flex flex-wrap gap-2">
                  {urgencyOptions.map((option) => {
                    const isSelected = urgencyFilter === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => handleUrgencyClick(option.value)}
                        className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                          isSelected
                            ? `${option.color} ring-2 ring-offset-1 ring-current`
                            : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200 hover:bg-gray-100'
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
                  <label className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-500">
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
                        className="w-full rounded-xl border border-gray-100 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-700 placeholder-gray-400 outline-none transition-colors focus:border-[#EA7B7B]/40 focus:bg-white focus:ring-2 focus:ring-[#EA7B7B]/10"
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
                              ? 'border-[#EA7B7B]/30 bg-[#EA7B7B]/15 text-[#C44545] ring-1 ring-[#EA7B7B]/30'
                              : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200 hover:bg-gray-100'
                          }`}
                          aria-pressed={isSelected}
                        >
                          <Tag className="h-3 w-3" />
                          {tag}
                        </button>
                      );
                    })}
                    {tagSearch && filteredTags.length === 0 && (
                      <p className="text-sm text-gray-500 italic">No tags match &quot;{tagSearch}&quot;</p>
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
                      className="flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200"
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
          className="mt-3 flex flex-wrap items-center gap-2"
        >
          {selectedCategory && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#EA7B7B]/15 px-3 py-1.5 text-xs font-semibold text-[#C44545]">
              {categoryConfig.find((c) => c.id === selectedCategory)?.label}
              <button
                onClick={() => onCategoryChange(null)}
                className="hover:text-[#9B3535]"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {urgencyFilter && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#FACE68]/20 px-3 py-1.5 text-xs font-semibold text-[#C9A030]">
              {urgencyFilter} priority
              <button
                onClick={() => onUrgencyChange(null)}
                className="hover:text-[#9A7A20]"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {selectedTags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700"
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
