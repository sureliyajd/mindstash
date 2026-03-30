'use client';

import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { ModuleType } from '@/components/ModuleSelector';

// =============================================================================
// TYPES
// =============================================================================

interface FilterChipsProps {
  selectedModule: ModuleType;
  onModuleChange: (module: ModuleType) => void;
  itemCounts?: Partial<Record<ModuleType, number>>;
}

// =============================================================================
// CHIP CONFIG
// =============================================================================

const chips: { id: ModuleType; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'today', label: 'Today' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'read_later', label: 'Read Later' },
  { id: 'ideas', label: 'Ideas' },
  { id: 'journal', label: 'Journal' },
  { id: 'people', label: 'People' },
  { id: 'insights', label: 'Insights' },
  { id: 'reminders', label: 'Reminders' },
];

// =============================================================================
// COMPONENT
// =============================================================================

export function FilterChips({ selectedModule, onModuleChange, itemCounts }: FilterChipsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Map<ModuleType, HTMLButtonElement>>(new Map());

  // Scroll selected chip into view
  useEffect(() => {
    const btn = buttonRefs.current.get(selectedModule);
    btn?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [selectedModule]);

  // Only show chips that have items (except "all" which always shows)
  const visibleChips = chips.filter(
    (c) => c.id === 'all' || !itemCounts || (itemCounts[c.id] ?? 0) > 0
  );

  return (
    <div
      ref={scrollRef}
      className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1"
      role="tablist"
      aria-label="Content filters"
    >
      {visibleChips.map((chip) => {
        const isSelected = selectedModule === chip.id;
        const count = chip.id !== 'all' ? itemCounts?.[chip.id] : undefined;

        return (
          <button
            key={chip.id}
            ref={(el) => {
              if (el) buttonRefs.current.set(chip.id, el);
            }}
            role="tab"
            aria-selected={isSelected}
            onClick={() => onModuleChange(chip.id)}
            className={`
              relative flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5
              text-xs font-semibold transition-colors
              ${
                isSelected
                  ? 'bg-[#EA7B7B]/15 text-[#C44545]'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
              }
            `}
          >
            {isSelected && (
              <motion.div
                layoutId="filter-chip-bg"
                className="absolute inset-0 rounded-full bg-[#EA7B7B]/15"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative">{chip.label}</span>
            {count !== undefined && count > 0 && (
              <span
                className={`relative rounded-full px-1.5 py-0.5 font-mono text-[10px] font-bold tabular-nums ${
                  isSelected ? 'bg-[#EA7B7B]/20 text-[#C44545]' : 'bg-gray-200/80 text-gray-500'
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
