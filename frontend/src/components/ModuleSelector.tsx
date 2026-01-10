'use client';

import { useRef, useEffect, useLayoutEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

// =============================================================================
// TYPES
// =============================================================================

export type ModuleType =
  | 'all'
  | 'today'
  | 'tasks'
  | 'read_later'
  | 'ideas'
  | 'insights';

export interface ModuleConfig {
  id: ModuleType;
  label: string;
}

export interface ModuleSelectorProps {
  selectedModule: ModuleType;
  onModuleChange: (module: ModuleType) => void;
  itemCounts?: Partial<Record<ModuleType, number>>;
}

// =============================================================================
// MODULE CONFIGURATION
// =============================================================================

const modules: ModuleConfig[] = [
  { id: 'all', label: 'All' },
  { id: 'today', label: 'Today' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'read_later', label: 'Read Later' },
  { id: 'ideas', label: 'Ideas' },
  { id: 'insights', label: 'Insights' },
];

// =============================================================================
// COMPONENT
// =============================================================================

export function ModuleSelector({
  selectedModule,
  onModuleChange,
  itemCounts,
}: ModuleSelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Map<ModuleType, HTMLButtonElement>>(new Map());
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  // Update indicator position when selection changes (use layoutEffect to avoid flash)
  useLayoutEffect(() => {
    const updateIndicator = () => {
      const selectedButton = buttonRefs.current.get(selectedModule);
      if (selectedButton && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const buttonRect = selectedButton.getBoundingClientRect();

        setIndicatorStyle({
          left: buttonRect.left - containerRect.left + containerRef.current.scrollLeft,
          width: buttonRect.width,
        });
      }
    };

    // Run immediately
    updateIndicator();

    // Also run after a small delay to handle dynamic content (counts loading)
    const timer = setTimeout(updateIndicator, 100);
    return () => clearTimeout(timer);
  }, [selectedModule, itemCounts]);

  // Scroll selected button into view on mobile (separate effect)
  useEffect(() => {
    const selectedButton = buttonRefs.current.get(selectedModule);
    if (selectedButton) {
      selectedButton.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [selectedModule]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, currentIndex: number) => {
      let newIndex = currentIndex;

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          newIndex = (currentIndex + 1) % modules.length;
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          newIndex = (currentIndex - 1 + modules.length) % modules.length;
          break;
        case 'Home':
          e.preventDefault();
          newIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          newIndex = modules.length - 1;
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          onModuleChange(modules[currentIndex].id);
          return;
        default:
          return;
      }

      setFocusedIndex(newIndex);
      const button = buttonRefs.current.get(modules[newIndex].id);
      button?.focus();
    },
    [onModuleChange]
  );

  // Get count for a module
  const getCount = (moduleId: ModuleType): number | undefined => {
    if (!itemCounts) return undefined;
    const count = itemCounts[moduleId];
    return count && count > 0 ? count : undefined;
  };

  return (
    <nav
      className="relative rounded-2xl border border-gray-100 bg-white p-1.5 shadow-sm"
      role="tablist"
      aria-label="Content modules"
    >
      {/* Scrollable container */}
      <div
        ref={containerRef}
        className="relative flex items-center gap-1 overflow-x-auto scrollbar-hide"
        style={{
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* Sliding indicator */}
        <motion.div
          className="absolute inset-y-1.5 rounded-xl bg-purple-100"
          initial={false}
          animate={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
          }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 30,
          }}
        />

        {/* Module buttons */}
        {modules.map((module, index) => {
          const isSelected = selectedModule === module.id;
          const count = getCount(module.id);

          return (
            <button
              key={module.id}
              ref={(el) => {
                if (el) buttonRefs.current.set(module.id, el);
              }}
              role="tab"
              aria-selected={isSelected}
              aria-controls={`panel-${module.id}`}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => onModuleChange(module.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onFocus={() => setFocusedIndex(index)}
              onBlur={() => setFocusedIndex(-1)}
              className={`
                relative z-10 flex items-center gap-1.5 whitespace-nowrap rounded-xl px-4 py-2.5
                text-sm font-semibold transition-colors duration-200
                focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50
                ${
                  isSelected
                    ? 'text-purple-700'
                    : 'text-gray-500 hover:text-gray-700'
                }
              `}
              style={{
                scrollSnapAlign: 'center',
                minHeight: '44px',
              }}
            >
              {/* Label */}
              <span>{module.label}</span>

              {/* Count badge */}
              {count !== undefined && (
                <span
                  className={`
                    rounded-full px-2 py-0.5 font-mono text-[10px] font-bold tabular-nums
                    ${
                      isSelected
                        ? 'bg-purple-200 text-purple-700'
                        : 'bg-gray-100 text-gray-500'
                    }
                  `}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// =============================================================================
// UTILITY HOOK FOR MODULE STATE
// =============================================================================

export function useModuleState(initialModule: ModuleType = 'all') {
  const [selectedModule, setSelectedModule] = useState<ModuleType>(initialModule);

  const handleModuleChange = useCallback((module: ModuleType) => {
    setSelectedModule(module);
  }, []);

  return {
    selectedModule,
    setSelectedModule: handleModuleChange,
  };
}
