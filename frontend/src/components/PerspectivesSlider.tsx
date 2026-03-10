'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// =============================================================================
// DATA
// =============================================================================

const perspectives = [
  {
    id: 0,
    persona: 'The Night-Owl Creator',
    emoji: '🎨',
    role: 'Freelance Designer',
    quote: 'I get my best ideas at 2 AM. MindStash is like having a personal assistant that never sleeps — I capture an idea, wake up, and it\'s organized and waiting.',
    how: 'Saves visual inspiration, client feedback snippets, and concept drafts. AI auto-categorizes them as Ideas, Notes, and Goals — zero effort.',
    categories: ['Ideas', 'Notes', 'Goals'],
    accent: '#C9A030',
    lightBg: '#FFFBEA',
    sideBg: '#FEF3C7',
    quote_color: '#FACE68',
  },
  {
    id: 1,
    persona: 'The Overwhelmed Parent',
    emoji: '👨‍👧',
    role: 'Working Parent of Two',
    quote: 'Birthday gifts, school events, grocery lists, doctor appointments — my brain was drowning. Now I type it and forget it. MindStash handles the rest.',
    how: 'Saves reminders for birthdays, school events, and shopping lists. Smart notifications fire exactly 3 days before each event — so nothing slips through.',
    categories: ['Tasks', 'Buy', 'Notes'],
    accent: '#C44545',
    lightBg: '#FEF2F2',
    sideBg: '#FCE7E7',
    quote_color: '#EA7B7B',
  },
  {
    id: 2,
    persona: 'The Knowledge Hoarder',
    emoji: '📚',
    role: 'Senior Software Engineer',
    quote: 'I used to hoard 200+ browser tabs "to read later". Now I paste any link and my AI agent finds it in seconds when I actually need it.',
    how: 'Saves articles, docs, and tutorials by pasting links. Asks the AI "What did I save about distributed systems?" and gets an instant curated list.',
    categories: ['Read', 'Learn', 'Notes'],
    accent: '#5AACA8',
    lightBg: '#EEFAFA',
    sideBg: '#CCFBF1',
    quote_color: '#79C9C5',
  },
  {
    id: 3,
    persona: 'The Serial Founder',
    emoji: '🚀',
    role: 'Startup Founder',
    quote: 'Ideas, meeting notes, market research, competitor intel — all in one place. My daily AI briefing tells me exactly what needs attention today.',
    how: 'Captures ideas from walks, meetings, and reading. Daily AI briefing surfaces the most urgent and actionable items every morning before the day begins.',
    categories: ['Ideas', 'Goals', 'Tasks'],
    accent: '#5EB563',
    lightBg: '#F0FBF0',
    sideBg: '#DCFCE7',
    quote_color: '#93DA97',
  },
  {
    id: 4,
    persona: 'The Avid Reader',
    emoji: '🔖',
    role: 'Content Strategist',
    quote: 'I save articles and actually come back to them now. MindStash nudges me when I haven\'t touched something important in two weeks.',
    how: 'Saves articles, newsletters, and long-form content. Smart surfacing resurfaces high-priority reads at exactly the right moment — not buried and forgotten.',
    categories: ['Read', 'Notes', 'Ideas'],
    accent: '#D65E3F',
    lightBg: '#FFF3EE',
    sideBg: '#FFEDD5',
    quote_color: '#FF8364',
  },
];

const categoryStyles: Record<string, { bg: string; color: string }> = {
  Ideas: { bg: '#FEF3C7', color: '#C9A030' },
  Tasks: { bg: '#FCE7E7', color: '#C44545' },
  Read: { bg: '#CCFBF1', color: '#0F766E' },
  Notes: { bg: '#FFF3EE', color: '#D65E3F' },
  Goals: { bg: '#DCFCE7', color: '#166534' },
  Buy: { bg: '#FCE7E7', color: '#C44545' },
  Learn: { bg: '#CCFBF1', color: '#0F766E' },
};

// =============================================================================
// ANIMATION VARIANTS — defined at module scope to avoid re-creation on render
// =============================================================================

const slideVariants: Variants = {
  hidden: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? 72 : -72,
  }),
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.42, ease: [0.32, 0.72, 0, 1] },
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? -72 : 72,
    transition: { duration: 0.28, ease: [0.32, 0.72, 0, 1] },
  }),
};

// =============================================================================
// COMPONENT
// =============================================================================

export default function PerspectivesSlider() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isHovered, setIsHovered] = useState(false);

  const next = useCallback(() => {
    setDirection(1);
    setCurrent(prev => (prev + 1) % perspectives.length);
  }, []);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent(prev => (prev - 1 + perspectives.length) % perspectives.length);
  }, []);

  const goTo = useCallback(
    (index: number, currentIndex: number) => {
      setDirection(index > currentIndex ? 1 : -1);
      setCurrent(index);
    },
    []
  );

  useEffect(() => {
    if (isHovered) return;
    const id = setInterval(next, 6000);
    return () => clearInterval(id);
  }, [isHovered, next]);

  const p = perspectives[current];

  return (
    <section className="py-24 lg:py-32 overflow-hidden" style={{ backgroundColor: '#F9F8F6' }}>
      <div className="mx-auto max-w-7xl px-6 lg:px-8">

        {/* Header row */}
        <motion.div
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div>
            <span className="text-label-small text-[#EA7B7B] mb-3 block">Real People, Real Stories</span>
            <h2 className="heading-section text-4xl sm:text-5xl text-gray-900">
              MindStash fits your life
            </h2>
          </div>

          {/* Arrow nav — desktop */}
          <div className="hidden sm:flex items-center gap-2 pb-1">
            <button
              onClick={prev}
              aria-label="Previous perspective"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition-all hover:border-gray-400 hover:scale-105 active:scale-95"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={next}
              aria-label="Next perspective"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition-all hover:border-gray-400 hover:scale-105 active:scale-95"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>

        {/* Slider */}
        <div
          className="overflow-hidden rounded-3xl shadow-sm ring-1 ring-gray-100"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={current}
              custom={direction}
              variants={slideVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="grid md:grid-cols-5 min-h-[320px]">

                {/* Left — Quote (3/5) */}
                <div
                  className="md:col-span-3 p-8 lg:p-12 flex flex-col justify-between"
                  style={{ backgroundColor: p.lightBg }}
                >
                  <div>
                    {/* Decorative quote mark */}
                    <div
                      className="text-8xl font-serif leading-none mb-2 select-none"
                      style={{ color: p.quote_color, lineHeight: '0.8' }}
                    >
                      &ldquo;
                    </div>
                    <blockquote className="text-xl lg:text-2xl font-medium text-gray-800 leading-relaxed">
                      {p.quote}
                    </blockquote>
                  </div>

                  <div className="flex items-center gap-4 mt-8">
                    <span className="text-3xl" role="img" aria-label={p.persona}>{p.emoji}</span>
                    <div>
                      <div className="font-bold text-gray-900">{p.persona}</div>
                      <div className="text-sm text-gray-500">{p.role}</div>
                    </div>
                  </div>
                </div>

                {/* Right — How they use it (2/5) */}
                <div
                  className="md:col-span-2 p-8 lg:p-12 flex flex-col justify-between"
                  style={{ backgroundColor: p.sideBg }}
                >
                  <div>
                    <div
                      className="text-xs font-semibold uppercase tracking-widest mb-4"
                      style={{ color: p.accent }}
                    >
                      How they use it
                    </div>
                    <p className="text-gray-700 leading-relaxed text-sm lg:text-base">
                      {p.how}
                    </p>
                  </div>

                  <div className="mt-8">
                    <div className="text-xs text-gray-400 uppercase tracking-wider mb-3 font-semibold">
                      Top categories
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {p.categories.map(cat => {
                        const style = categoryStyles[cat] ?? { bg: '#F3F4F6', color: '#374151' };
                        return (
                          <span
                            key={cat}
                            className="px-3 py-1.5 rounded-full text-xs font-semibold"
                            style={{ backgroundColor: style.bg, color: style.color }}
                          >
                            {cat}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Pagination */}
        <div className="flex items-center mt-7 gap-4">
          {/* Dots */}
          <div className="flex items-center gap-2">
            {perspectives.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i, current)}
                aria-label={`Go to slide ${i + 1}`}
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: i === current ? 28 : 8,
                  backgroundColor: i === current ? perspectives[current].quote_color : '#D1D5DB',
                }}
              />
            ))}
          </div>

          {/* Counter */}
          <span className="ml-auto text-sm text-gray-400 tabular-nums">
            {current + 1} / {perspectives.length}
          </span>

          {/* Arrow nav — mobile */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={prev}
              aria-label="Previous"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={next}
              aria-label="Next"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}
