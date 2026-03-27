'use client';

import { LayoutGrid, List } from 'lucide-react';

interface ViewToggleProps {
  viewMode: 'grid' | 'list';
  onChange: (mode: 'grid' | 'list') => void;
}

export function ViewToggle({ viewMode, onChange }: ViewToggleProps) {
  return (
    <div className="flex h-[46px] items-center rounded-2xl border border-gray-200 bg-white p-1 shadow-sm">
      <button
        onClick={() => onChange('grid')}
        className={`flex h-full items-center justify-center rounded-xl px-3 transition-all ${
          viewMode === 'grid'
            ? 'bg-[#EA7B7B]/10 text-[#C44545]'
            : 'text-gray-400 hover:text-gray-600'
        }`}
        aria-label="Grid view"
        title="Grid view"
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
      <button
        onClick={() => onChange('list')}
        className={`flex h-full items-center justify-center rounded-xl px-3 transition-all ${
          viewMode === 'list'
            ? 'bg-[#EA7B7B]/10 text-[#C44545]'
            : 'text-gray-400 hover:text-gray-600'
        }`}
        aria-label="List view"
        title="List view"
      >
        <List className="h-4 w-4" />
      </button>
    </div>
  );
}
