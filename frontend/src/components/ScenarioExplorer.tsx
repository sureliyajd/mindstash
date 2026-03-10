'use client';

import { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Lightbulb, Calendar, BookOpen, ArrowRight } from 'lucide-react';

// =============================================================================
// DATA
// =============================================================================

const scenarios = [
  {
    id: 0,
    tab: 'The Midnight Idea',
    tagline: '2 AM inspiration, organized by morning',
    icon: Lightbulb,
    accentColor: '#C9A030',
    bubbleColor: '#FACE68',
    lightBg: '#FFFBEA',
    cardBg: '#FEF3C7',
    borderColor: '#FDE68A',
    before: '"I had a brilliant business idea at 2 AM. By morning, it was completely gone — like it never existed."',
    after: 'Capture it in 10 seconds. MindStash categorizes it as an Idea, auto-tags it, and your AI agent surfaces it during your weekly review.',
    flow: ['Captured (10s)', 'AI categorizes', 'Surfaced in review'],
  },
  {
    id: 1,
    tab: 'The Forgotten Task',
    tagline: 'Set it once, get reminded at the right time',
    icon: Calendar,
    accentColor: '#C44545',
    bubbleColor: '#EA7B7B',
    lightBg: '#FEF2F2',
    cardBg: '#FCE7E7',
    borderColor: '#FECACA',
    before: '"I meant to buy mom\'s birthday gift. I remembered... the day after. Every. Single. Year."',
    after: 'Drop "mom\'s birthday gift" → auto-categorized as Task → smart notification fires 3 days before the date. Never again.',
    flow: ['Type it naturally', 'AI detects intent', 'Smart reminder fires'],
  },
  {
    id: 2,
    tab: 'The Lost Article',
    tagline: 'Save once, find it in seconds',
    icon: BookOpen,
    accentColor: '#5AACA8',
    bubbleColor: '#79C9C5',
    lightBg: '#EEFAFA',
    cardBg: '#CCFBF1',
    borderColor: '#99F6E4',
    before: '"I read an amazing article about AI productivity. Can\'t find it anywhere. Checked bookmarks, notes, history. Nothing."',
    after: 'Paste the link → categorized as Read Later → AI chat finds it in seconds: "Show me that AI article from last week"',
    flow: ['Link saved', 'AI indexes + tags', 'Chat to recall'],
  },
];

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

const panelVariants: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.32, ease: [0.25, 0.1, 0.25, 1] },
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

export default function ScenarioExplorer() {
  const [active, setActive] = useState(0);
  const s = scenarios[active];

  return (
    <section className="py-24 lg:py-32 bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">

        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-label-small text-[#EA7B7B] mb-4 block">Real Problems, Real Solutions</span>
          <h2 className="heading-section text-4xl sm:text-5xl text-gray-900 mb-4">
            We&apos;ve all been there
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            These moments happen every day. MindStash makes sure they never happen again.
          </p>
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
            className="lg:col-span-2 flex flex-row lg:flex-col gap-3 overflow-x-auto scrollbar-hide pb-1 lg:pb-0"
            role="tablist"
            aria-label="Scenario selector"
          >
            {scenarios.map((scenario, i) => {
              const Icon = scenario.icon;
              const isActive = active === i;
              return (
                <button
                  key={i}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActive(i)}
                  className="flex items-start gap-3 p-4 lg:p-5 rounded-2xl text-left transition-all duration-300 flex-shrink-0 lg:flex-shrink border-2 min-w-[200px] lg:min-w-0"
                  style={{
                    backgroundColor: isActive ? scenario.lightBg : 'white',
                    borderColor: isActive ? scenario.bubbleColor : '#F3F4F6',
                  }}
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl mt-0.5 transition-colors duration-300"
                    style={{ backgroundColor: isActive ? scenario.bubbleColor : '#F3F4F6' }}
                  >
                    <Icon
                      className="h-5 w-5 transition-colors duration-300"
                      style={{ color: isActive ? 'white' : '#9CA3AF' }}
                    />
                  </div>
                  <div>
                    <div
                      className="font-semibold text-sm leading-snug mb-1 transition-colors duration-300"
                      style={{ color: isActive ? '#111827' : '#6B7280' }}
                    >
                      {scenario.tab}
                    </div>
                    <div
                      className="text-xs leading-relaxed transition-colors duration-300 hidden lg:block"
                      style={{ color: isActive ? '#6B7280' : '#9CA3AF' }}
                    >
                      {scenario.tagline}
                    </div>
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
              >
                <div className="rounded-3xl overflow-hidden shadow-sm ring-1 ring-gray-100">

                  {/* Before block */}
                  <div className="p-7 lg:p-9 bg-white">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-2 w-2 rounded-full bg-gray-300" />
                      <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                        Before MindStash
                      </span>
                    </div>
                    <blockquote className="text-lg lg:text-xl text-gray-500 italic leading-relaxed font-medium border-l-4 border-gray-200 pl-4">
                      {s.before}
                    </blockquote>
                  </div>

                  {/* Connector */}
                  <div
                    className="flex items-center gap-3 px-7 lg:px-9 py-3.5 border-y"
                    style={{ borderColor: s.borderColor, backgroundColor: s.lightBg }}
                  >
                    <ArrowRight
                      className="h-4 w-4 shrink-0"
                      style={{ color: s.bubbleColor }}
                    />
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: s.accentColor }}>
                      With MindStash
                    </span>
                  </div>

                  {/* After block */}
                  <div className="p-7 lg:p-9" style={{ backgroundColor: s.cardBg }}>
                    <p className="text-base lg:text-lg text-gray-800 font-medium leading-relaxed mb-6">
                      {s.after}
                    </p>

                    {/* Flow chips */}
                    <div className="flex flex-wrap items-center gap-2">
                      {s.flow.map((step, i) => (
                        <span key={i} className="flex items-center gap-2">
                          <span
                            className="px-3 py-1.5 rounded-full text-xs font-semibold"
                            style={{
                              backgroundColor: s.lightBg,
                              color: s.accentColor,
                              border: `1.5px solid ${s.borderColor}`,
                            }}
                          >
                            {step}
                          </span>
                          {i < s.flow.length - 1 && (
                            <ArrowRight className="h-3 w-3 shrink-0" style={{ color: s.bubbleColor }} />
                          )}
                        </span>
                      ))}
                    </div>
                  </div>

                </div>
              </motion.div>
            </AnimatePresence>
          </div>

        </motion.div>
      </div>
    </section>
  );
}
