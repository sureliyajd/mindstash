'use client';

import { motion } from 'framer-motion';

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

const containerVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      staggerChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 },
  },
};

// =============================================================================
// AI PROCESSING COMPONENT
// =============================================================================

interface AIProcessingProps {
  variant?: 'card' | 'overlay' | 'inline';
  message?: string;
}

export function AIProcessing({
  variant = 'card',
  message = 'AI is analyzing your thought...'
}: AIProcessingProps) {

  // Card variant - for use in item cards during processing
  if (variant === 'card') {
    return (
      <motion.div
        className="flex items-center gap-3 rounded-xl bg-[#79C9C5]/10 border border-[#79C9C5]/30 px-4 py-3"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <img
          src="/images/thinking-monkey.gif"
          alt=""
          className="h-10 w-10 object-contain"
        />
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-200">{message}</p>
          <motion.div
            className="mt-1 flex gap-1"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <div className="h-1 w-1 rounded-full bg-teal-400" />
            <div className="h-1 w-1 rounded-full bg-teal-400" />
            <div className="h-1 w-1 rounded-full bg-teal-400" />
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // Overlay variant - fullscreen overlay during major processing
  if (variant === 'overlay') {
    return (
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <motion.div
          className="flex flex-col items-center rounded-3xl bg-slate-900/90 border border-white/10 p-8 shadow-2xl"
          variants={itemVariants}
        >
          <img
            src="/images/thinking-monkey.gif"
            alt=""
            className="h-32 w-32 object-contain"
          />
          <motion.p
            className="mt-4 text-lg font-medium text-gray-200"
            variants={itemVariants}
          >
            {message}
          </motion.p>
          <motion.div
            className="mt-3 flex gap-1.5"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <div className="h-2 w-2 rounded-full bg-teal-400" />
            <div className="h-2 w-2 rounded-full bg-cyan-400" />
            <div className="h-2 w-2 rounded-full bg-teal-400" />
          </motion.div>
        </motion.div>
      </motion.div>
    );
  }

  // Inline variant - small inline indicator
  return (
    <motion.div
      className="inline-flex items-center gap-2"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <img
        src="/images/thinking-monkey.gif"
        alt=""
        className="h-6 w-6 object-contain"
      />
      <span className="text-sm text-gray-400">{message}</span>
      <motion.div
        className="flex gap-0.5"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <div className="h-1 w-1 rounded-full bg-teal-400" />
        <div className="h-1 w-1 rounded-full bg-teal-400" />
        <div className="h-1 w-1 rounded-full bg-teal-400" />
      </motion.div>
    </motion.div>
  );
}
