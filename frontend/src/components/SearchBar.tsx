'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (term: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function SearchBar({
  value,
  onChange,
  onSearch,
  placeholder = 'Search your memories...',
  debounceMs = 500,
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      onSearch(value);
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value, onSearch, debounceMs]);

  // Handle input change
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  // Handle clear
  const handleClear = useCallback(() => {
    onChange('');
    onSearch('');
    inputRef.current?.focus();
  }, [onChange, onSearch]);

  // Handle key down
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (value) {
          handleClear();
        } else {
          inputRef.current?.blur();
        }
      }
    },
    [value, handleClear]
  );

  const hasValue = value.length > 0;

  return (
    <div className="relative w-full">
      {/* Search container */}
      <div
        className={`relative flex items-center overflow-hidden rounded-xl border bg-white transition-all duration-200 ${
          isFocused
            ? 'border-indigo-300 shadow-md shadow-indigo-50'
            : 'border-gray-200 shadow-sm'
        }`}
      >
        {/* Search icon */}
        <div className="flex items-center justify-center pl-4">
          <Search
            className={`h-4 w-4 transition-colors duration-200 ${
              isFocused ? 'text-indigo-500' : 'text-gray-400'
            }`}
          />
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full bg-transparent px-3 py-3 text-sm text-gray-800 placeholder-gray-400 outline-none"
          aria-label="Search"
        />

        {/* Clear button */}
        <AnimatePresence>
          {hasValue && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              onClick={handleClear}
              className="mr-2 flex items-center justify-center rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// =============================================================================
// UTILITY HOOK
// =============================================================================

export function useSearchState() {
  const [searchValue, setSearchValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchValue('');
    setSearchTerm('');
  }, []);

  return {
    searchValue,
    setSearchValue,
    searchTerm,
    handleSearch,
    clearSearch,
  };
}
