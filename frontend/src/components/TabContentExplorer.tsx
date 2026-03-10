'use client';

import { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { type LucideIcon } from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

export interface TabItem {
  id: number;
  tab: string;
  tagline?: string;
  icon: LucideIcon;
  accentColor: string;   // e.g. '#C9A030'
  bubbleColor: string;   // e.g. '#FACE68'
  lightBg: string;       // e.g. '#FFFBEA'
  cardBg: string;        // e.g. '#FEF3C7'
  borderColor: string;   // e.g. '#FDE68A'
  content: string;       // main body text
  tags?: string[];       // optional chip labels
}

interface TabContentExplorerProps {
  label: string;
  heading: string;
  subheading?: string;
  items: TabItem[];
  bgColor?: string;      // section bg, defaults to gray-50
}

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

const panelVariants: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
  },
  exit: {
    opacity: 0,
    x: -16,
    transition: { duration: 0.2 },
  },
};

// =============================================================================
// COMPONENT
// =============================================================================

export default function TabContentExplorer({
  label,
  heading,
  subheading,
  items,
  bgColor = '#F9FAFB',
}: TabContentExplorerProps) {
  const [active, setActive] = useState(0);
  const s = items[active];

  return (
    <section className="py-24 lg:py-32" style={{ backgroundColor: bgColor }}>
      <div className="mx-auto max-w-7xl px-6 lg:px-8">

        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-label-small text-[#EA7B7B] mb-4 block">{label}</span>
          <h2 className="heading-section text-4xl sm:text-5xl text-gray-900 mb-4">{heading}</h2>
          {subheading && (
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">{subheading}</p>
          )}
        </motion.div>

        {/* Layout */}
        <motion.div
          className="grid lg:grid-cols-5 gap-5 lg:gap-8"
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          {/* Tab selector */}
          <div
            className="lg:col-span-2 flex flex-row lg:flex-col gap-2 overflow-x-auto scrollbar-hide pb-1 lg:pb-0"
            role="tablist"
          >
            {items.map((item, i) => {
              const Icon = item.icon;
              const isActive = active === i;
              return (
                <button
                  key={i}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActive(i)}
                  className="flex items-center gap-3 p-4 rounded-2xl text-left transition-all duration-300 flex-shrink-0 lg:flex-shrink border-2 min-w-[180px] lg:min-w-0"
                  style={{
                    backgroundColor: isActive ? item.lightBg : 'white',
                    borderColor: isActive ? item.bubbleColor : '#F3F4F6',
                  }}
                >
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors duration-300"
                    style={{ backgroundColor: isActive ? item.bubbleColor : '#F3F4F6' }}
                  >
                    <Icon
                      className="h-4 w-4 transition-colors duration-300"
                      style={{ color: isActive ? 'white' : '#9CA3AF' }}
                    />
                  </div>
                  <div className="min-w-0">
                    <div
                      className="font-semibold text-sm leading-snug truncate transition-colors duration-300"
                      style={{ color: isActive ? '#111827' : '#6B7280' }}
                    >
                      {item.tab}
                    </div>
                    {item.tagline && (
                      <div
                        className="text-xs leading-relaxed hidden lg:block transition-colors duration-300 mt-0.5"
                        style={{ color: isActive ? '#6B7280' : '#9CA3AF' }}
                      >
                        {item.tagline}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Content panel */}
          <div className="lg:col-span-3" role="tabpanel">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                variants={panelVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="h-full"
              >
                <div
                  className="rounded-3xl overflow-hidden shadow-sm ring-1 ring-gray-100 h-full flex flex-col"
                  style={{ backgroundColor: s.lightBg }}
                >
                  {/* Icon + title block */}
                  <div className="p-8 lg:p-10 flex-1">
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-2xl mb-6"
                      style={{ backgroundColor: s.bubbleColor }}
                    >
                      <s.icon className="h-7 w-7" style={{ color: 'white' }} />
                    </div>

                    <h3
                      className="text-2xl font-bold mb-4 leading-snug"
                      style={{ color: '#111827' }}
                    >
                      {s.tab}
                    </h3>

                    <p className="text-gray-600 text-base leading-relaxed">
                      {s.content}
                    </p>
                  </div>

                  {/* Tags strip */}
                  {s.tags && s.tags.length > 0 && (
                    <div
                      className="px-8 lg:px-10 py-5 border-t flex flex-wrap gap-2"
                      style={{
                        backgroundColor: s.cardBg,
                        borderColor: s.borderColor,
                      }}
                    >
                      {s.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="px-3 py-1.5 rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor: s.lightBg,
                            color: s.accentColor,
                            border: `1.5px solid ${s.borderColor}`,
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

        </motion.div>
      </div>
    </section>
  );
}
