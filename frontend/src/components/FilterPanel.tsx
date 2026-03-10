'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
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
  SlidersHorizontal,
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
  isOpen: boolean;
  onClose: () => void;
}

// =============================================================================
// CONSTANTS - MINDSTASH BRAND COLORS
// =============================================================================

const categoryConfig: { id: Category; icon: typeof BookOpen; label: string; color: string; activeBg: string; activeText: string }[] = [
  { id: 'read', icon: BookOpen, label: 'Read', color: '#79C9C5', activeBg: 'bg-[#79C9C5]/15', activeText: 'text-[#5AACA8]' },
  { id: 'watch', icon: Video, label: 'Watch', color: '#79C9C5', activeBg: 'bg-[#79C9C5]/15', activeText: 'text-[#5AACA8]' },
  { id: 'ideas', icon: Lightbulb, label: 'Ideas', color: '#FACE68', activeBg: 'bg-[#FACE68]/20', activeText: 'text-[#C9A030]' },
  { id: 'tasks', icon: CheckSquare, label: 'Tasks', color: '#FF8364', activeBg: 'bg-[#FF8364]/15', activeText: 'text-[#D65E3F]' },
  { id: 'people', icon: Users, label: 'People', color: '#EA7B7B', activeBg: 'bg-[#EA7B7B]/15', activeText: 'text-[#C44545]' },
  { id: 'notes', icon: FileText, label: 'Notes', color: '#93DA97', activeBg: 'bg-[#93DA97]/15', activeText: 'text-[#5EB563]' },
  { id: 'goals', icon: Target, label: 'Goals', color: '#FACE68', activeBg: 'bg-[#FACE68]/20', activeText: 'text-[#C9A030]' },
  { id: 'buy', icon: ShoppingCart, label: 'Buy', color: '#EA7B7B', activeBg: 'bg-[#EA7B7B]/15', activeText: 'text-[#C44545]' },
  { id: 'places', icon: MapPin, label: 'Places', color: '#79C9C5', activeBg: 'bg-[#79C9C5]/15', activeText: 'text-[#5AACA8]' },
  { id: 'journal', icon: BookMarked, label: 'Journal', color: '#93DA97', activeBg: 'bg-[#93DA97]/15', activeText: 'text-[#5EB563]' },
  { id: 'learn', icon: GraduationCap, label: 'Learn', color: '#79C9C5', activeBg: 'bg-[#79C9C5]/15', activeText: 'text-[#5AACA8]' },
  { id: 'save', icon: Bookmark, label: 'Saved', color: '#EA7B7B', activeBg: 'bg-[#EA7B7B]/15', activeText: 'text-[#C44545]' },
];

const urgencyOptions: { value: UrgencyLevel; label: string; color: string; activeBg: string; activeText: string }[] = [
  { value: 'high', label: 'High', color: '#FF8364', activeBg: 'bg-[#FF8364]/15', activeText: 'text-[#D65E3F]' },
  { value: 'medium', label: 'Medium', color: '#FACE68', activeBg: 'bg-[#FACE68]/20', activeText: 'text-[#C9A030]' },
  { value: 'low', label: 'Low', color: '#93DA97', activeBg: 'bg-[#93DA97]/15', activeText: 'text-[#5EB563]' },
];

// =============================================================================
// FILTER BUTTON (placed beside search bar)
// =============================================================================

export function FilterButton({
  activeCount,
  onClick,
}: {
  activeCount: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex h-[46px] items-center gap-2 rounded-xl border px-4 transition-all duration-200 ${
        activeCount > 0
          ? 'border-[#EA7B7B]/30 bg-[#EA7B7B]/5 text-[#C44545] hover:bg-[#EA7B7B]/10'
          : 'border-gray-200 bg-white text-gray-500 shadow-sm hover:border-gray-300 hover:text-gray-700'
      }`}
      aria-label={`Filters${activeCount > 0 ? ` (${activeCount} active)` : ''}`}
    >
      <SlidersHorizontal className="h-4 w-4" />
      <span className="text-sm font-medium hidden sm:inline">Filters</span>
      {activeCount > 0 && (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#EA7B7B] text-[10px] font-bold text-white">
          {activeCount}
        </span>
      )}
    </button>
  );
}

// =============================================================================
// ACTIVE FILTER PILLS (shown below search bar when filters are active)
// =============================================================================

export function ActiveFilterPills({
  urgencyFilter,
  selectedTags,
  selectedCategory,
  onUrgencyChange,
  onTagsChange,
  onCategoryChange,
  onClearFilters,
}: {
  urgencyFilter: UrgencyLevel | null;
  selectedTags: string[];
  selectedCategory: Category | null;
  onUrgencyChange: (v: UrgencyLevel | null) => void;
  onTagsChange: (v: string[]) => void;
  onCategoryChange: (v: Category | null) => void;
  onClearFilters: () => void;
}) {
  const count =
    (urgencyFilter ? 1 : 0) + selectedTags.length + (selectedCategory ? 1 : 0);
  if (count === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-center gap-2"
    >
      {selectedCategory && (() => {
        const cat = categoryConfig.find((c) => c.id === selectedCategory);
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${cat?.activeBg || 'bg-gray-100'} ${cat?.activeText || 'text-gray-700'}`}>
            {cat?.label || selectedCategory}
            <button onClick={() => onCategoryChange(null)} className="hover:opacity-70">
              <X className="h-3 w-3" />
            </button>
          </span>
        );
      })()}
      {urgencyFilter && (
        <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${urgencyOptions.find((u) => u.value === urgencyFilter)?.activeBg || ''} ${urgencyOptions.find((u) => u.value === urgencyFilter)?.activeText || ''}`}>
          {urgencyFilter} priority
          <button onClick={() => onUrgencyChange(null)} className="hover:opacity-70">
            <X className="h-3 w-3" />
          </button>
        </span>
      )}
      {selectedTags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600"
        >
          {tag}
          <button
            onClick={() => onTagsChange(selectedTags.filter((t) => t !== tag))}
            className="hover:text-gray-900"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <button
        onClick={onClearFilters}
        className="text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
      >
        Clear all
      </button>
    </motion.div>
  );
}

// =============================================================================
// FILTER MODAL
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
  isOpen,
  onClose,
}: FilterPanelProps) {
  const [tagSearch, setTagSearch] = useState('');

  const activeFilterCount =
    (urgencyFilter ? 1 : 0) + selectedTags.length + (selectedCategory ? 1 : 0);

  const hasActiveFilters = activeFilterCount > 0;

  const filteredTags = useMemo(() => {
    if (!tagSearch.trim()) {
      return availableTags.slice(0, 12);
    }
    return availableTags.filter((tag) =>
      tag.toLowerCase().includes(tagSearch.toLowerCase())
    );
  }, [availableTags, tagSearch]);

  const handleUrgencyClick = useCallback(
    (urgency: UrgencyLevel) => {
      onUrgencyChange(urgencyFilter === urgency ? null : urgency);
    },
    [urgencyFilter, onUrgencyChange]
  );

  const handleCategoryClick = useCallback(
    (category: Category) => {
      onCategoryChange(selectedCategory === category ? null : category);
    },
    [selectedCategory, onCategoryChange]
  );

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

  const handleClearAll = useCallback(() => {
    onClearFilters();
    setTagSearch('');
  }, [onClearFilters]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className="fixed left-1/2 top-[10vh] z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2"
          >
            <div className="rounded-2xl bg-white shadow-2xl ring-1 ring-gray-200/60 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EA7B7B]/10">
                    <SlidersHorizontal className="h-4 w-4 text-[#EA7B7B]" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Filters</h2>
                    {hasActiveFilters && (
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {activeFilterCount} active
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Body — scrollable */}
              <div className="max-h-[60vh] overflow-y-auto p-5 space-y-6">
                {/* Categories */}
                <div>
                  <label className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-400">
                    <Bookmark className="h-3.5 w-3.5" />
                    Categories
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {categoryConfig.map(({ id, icon: Icon, label, color, activeBg, activeText }) => {
                      const isSelected = selectedCategory === id;
                      return (
                        <button
                          key={id}
                          onClick={() => handleCategoryClick(id)}
                          className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all duration-200 ${
                            isSelected
                              ? `${activeBg} ${activeText} border-current/20 ring-2 ring-current/20`
                              : 'border-gray-100 bg-gray-50/80 text-gray-500 hover:border-gray-200 hover:bg-gray-100'
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

                {/* Urgency */}
                <div>
                  <label className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-400">
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
                              ? `${option.activeBg} ${option.activeText} border-current/20 ring-2 ring-current/20`
                              : 'border-gray-100 bg-gray-50/80 text-gray-500 hover:border-gray-200 hover:bg-gray-100'
                          }`}
                          aria-pressed={isSelected}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tags */}
                {availableTags.length > 0 && (
                  <div>
                    <label className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-400">
                      <Tag className="h-3.5 w-3.5" />
                      Tags
                    </label>

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

                    <div className="flex flex-wrap gap-2">
                      {filteredTags.map((tag) => {
                        const isSelected = selectedTags.includes(tag);
                        return (
                          <button
                            key={tag}
                            onClick={() => handleTagClick(tag)}
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-all duration-200 ${
                              isSelected
                                ? 'border-[#EA7B7B]/30 bg-[#EA7B7B]/15 text-[#C44545] ring-1 ring-[#EA7B7B]/20'
                                : 'border-gray-100 bg-gray-50/80 text-gray-500 hover:border-gray-200 hover:bg-gray-100'
                            }`}
                            aria-pressed={isSelected}
                          >
                            <Tag className="h-3 w-3" />
                            {tag}
                          </button>
                        );
                      })}
                      {tagSearch && filteredTags.length === 0 && (
                        <p className="text-sm text-gray-400 italic">No tags match &quot;{tagSearch}&quot;</p>
                      )}
                      {!tagSearch && availableTags.length > 12 && (
                        <p className="text-xs text-gray-400 w-full mt-1">
                          Showing 12 of {availableTags.length} tags. Search to find more.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3.5 bg-gray-50/50">
                {hasActiveFilters ? (
                  <button
                    onClick={handleClearAll}
                    className="flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-700"
                  >
                    <X className="h-3.5 w-3.5" />
                    Clear all
                  </button>
                ) : (
                  <span className="text-xs text-gray-400">No filters applied</span>
                )}
                <button
                  onClick={onClose}
                  className="rounded-xl bg-[#EA7B7B] px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#D66B6B] hover:shadow-md active:scale-[0.98]"
                >
                  {hasActiveFilters
                    ? `Apply ${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''}`
                    : 'Done'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
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
