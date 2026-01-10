'use client';

import { motion } from 'framer-motion';
import { Brain } from 'lucide-react';

// =============================================================================
// MODULE MESSAGES CONFIG
// =============================================================================

const moduleMessages: Record<string, { heading: string; subtext: string }> = {
  all: {
    heading: 'Your mind is clear',
    subtext: 'Drop a thought above to get started',
  },
  today: {
    heading: 'Nothing urgent right now',
    subtext: 'Enjoy your peaceful moment',
  },
  tasks: {
    heading: 'No tasks at the moment',
    subtext: 'Capture something you need to do',
  },
  read_later: {
    heading: 'Nothing to learn right now',
    subtext: 'Save an article or video to read later',
  },
  ideas: {
    heading: 'No ideas captured yet',
    subtext: 'Your next big idea is waiting',
  },
  insights: {
    heading: 'No insights yet',
    subtext: 'Reflect on something meaningful',
  },
  archived: {
    heading: 'Nothing archived',
    subtext: 'Completed items will appear here',
  },
};

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.5,
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

// =============================================================================
// EMPTY STATE COMPONENT
// =============================================================================

interface EmptyStateProps {
  module?: string;
  isFirstTime?: boolean;
}

export function EmptyState({ module = 'all', isFirstTime = false }: EmptyStateProps) {
  const messages = moduleMessages[module] || moduleMessages.all;

  return (
    <motion.div
      className="flex flex-col items-center justify-center py-20 px-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Brain GIF Animation */}
      <motion.div variants={itemVariants} className="mb-8">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-purple-200 blur-2xl opacity-50" />
          <img
            src="/images/brain.gif"
            alt=""
            className="relative h-40 w-40 object-contain"
          />
        </div>
      </motion.div>

      {/* First-time user welcome */}
      {isFirstTime && (
        <motion.div
          variants={itemVariants}
          className="mb-6 rounded-2xl bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-100 px-6 py-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-violet-600">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-purple-900">
                Welcome to MindStash!
              </p>
              <p className="text-xs text-purple-600">
                Your AI-powered second brain awaits.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Heading */}
      <motion.h3
        variants={itemVariants}
        className="heading-section text-2xl text-gray-900 text-center sm:text-3xl"
      >
        {messages.heading}
      </motion.h3>

      {/* Subtext */}
      <motion.p
        variants={itemVariants}
        className="mt-3 text-base text-gray-500 text-center max-w-xs"
      >
        {messages.subtext}
      </motion.p>

      {/* Subtle animated indicator */}
      <motion.div
        variants={itemVariants}
        className="mt-10"
      >
        <motion.div
          className="flex items-center gap-2"
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="h-2 w-2 rounded-full bg-purple-400" />
          <div className="h-2 w-2 rounded-full bg-violet-400" />
          <div className="h-2 w-2 rounded-full bg-purple-400" />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
