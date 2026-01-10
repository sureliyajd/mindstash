'use client';

import { motion } from 'framer-motion';

// =============================================================================
// ANIMATED BACKGROUND COMPONENT
// =============================================================================

interface AnimatedBackgroundProps {
  variant?: 'wave' | 'gradient' | 'particles';
  opacity?: number;
  position?: 'fixed' | 'absolute';
}

export function AnimatedBackground({
  variant = 'gradient',
  opacity = 0.3,
  position = 'fixed',
}: AnimatedBackgroundProps) {
  const positionClass = position === 'fixed' ? 'fixed' : 'absolute';

  // Wave variant - uses wave-animation.gif
  if (variant === 'wave') {
    return (
      <div className={`${positionClass} inset-0 pointer-events-none overflow-hidden -z-10`}>
        {/* Main gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/95 to-slate-950" />

        {/* Wave animation - positioned at bottom */}
        <motion.div
          className="absolute bottom-0 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: opacity }}
          transition={{ duration: 1 }}
        >
          <img
            src="/images/wave-animation.gif"
            alt=""
            className="w-[800px] h-[400px] object-contain"
            style={{ opacity }}
          />
        </motion.div>

        {/* Gradient blobs */}
        <div className="absolute left-1/4 top-1/4 h-[400px] w-[400px] rounded-full bg-teal-600/10 blur-3xl" />
        <div className="absolute right-1/4 bottom-1/4 h-[300px] w-[300px] rounded-full bg-cyan-600/10 blur-3xl" />
      </div>
    );
  }

  // Particles variant - animated dots
  if (variant === 'particles') {
    return (
      <div className={`${positionClass} inset-0 pointer-events-none overflow-hidden -z-10`}>
        {/* Base gradient */}
        <div className="absolute inset-0 bg-slate-950" />

        {/* Animated particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-1 w-1 rounded-full bg-teal-400/30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}

        {/* Gradient blobs */}
        <motion.div
          className="absolute left-1/3 top-1/3 h-[500px] w-[500px] rounded-full bg-teal-600/10 blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.1, 0.15, 0.1],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute right-1/3 bottom-1/3 h-[400px] w-[400px] rounded-full bg-cyan-600/10 blur-3xl"
          animate={{
            scale: [1.1, 1, 1.1],
            opacity: [0.15, 0.1, 0.15],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
      </div>
    );
  }

  // Default gradient variant
  return (
    <div className={`${positionClass} inset-0 pointer-events-none overflow-hidden -z-10`}>
      {/* Base gradient */}
      <div className="absolute inset-0 bg-slate-950" />

      {/* Animated gradient blobs */}
      <motion.div
        className="absolute left-1/4 top-1/4 h-[500px] w-[500px] rounded-full bg-gradient-to-r from-teal-600/15 to-cyan-600/15 blur-3xl"
        animate={{
          x: [0, 50, 0],
          y: [0, 30, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute right-1/4 bottom-1/4 h-[400px] w-[400px] rounded-full bg-gradient-to-r from-cyan-600/15 to-teal-600/15 blur-3xl"
        animate={{
          x: [0, -40, 0],
          y: [0, -20, 0],
          scale: [1.1, 1, 1.1],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-600/10 blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}
