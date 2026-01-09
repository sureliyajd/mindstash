'use client';

import { motion } from 'framer-motion';

// Base skeleton with shimmer effect
function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-lg bg-zinc-800/50 ${className}`}
    >
      <motion.div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-zinc-700/30 to-transparent"
        animate={{ translateX: ['−100%', '100%'] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

// Card skeleton for masonry grid
export function ItemCardSkeleton() {
  return (
    <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="h-5 w-10 rounded-full" />
      </div>

      {/* Content lines */}
      <div className="mb-3 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
      </div>

      {/* Tags */}
      <div className="mb-3 flex gap-2">
        <Skeleton className="h-5 w-14 rounded-md" />
        <Skeleton className="h-5 w-16 rounded-md" />
      </div>

      {/* Footer */}
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

// Dashboard loading skeleton
export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Section header skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-3 w-6" />
      </div>

      {/* Masonry grid skeleton */}
      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="mb-4 break-inside-avoid">
            <ItemCardSkeleton />
          </div>
        ))}
      </div>
    </div>
  );
}

// Capture input skeleton
export function CaptureInputSkeleton() {
  return (
    <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-4">
      <Skeleton className="mb-4 h-24 w-full rounded-lg" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

// Inline loading spinner (subtle)
export function InlineSpinner({ className = '' }: { className?: string }) {
  return (
    <motion.div
      className={`h-4 w-4 rounded-full border-2 border-zinc-600 border-t-indigo-400 ${className}`}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    />
  );
}

// Page loading overlay
export function PageLoadingOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#09090b]/80 backdrop-blur-sm"
    >
      <motion.div
        className="flex flex-col items-center gap-3"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
      >
        <InlineSpinner className="h-6 w-6" />
        <span className="text-sm text-zinc-500">Loading...</span>
      </motion.div>
    </motion.div>
  );
}

// Offline banner
export function OfflineBanner() {
  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -50, opacity: 0 }}
      className="fixed left-0 right-0 top-0 z-50 bg-amber-500/10 py-2 text-center"
    >
      <span className="text-sm text-amber-400">
        You&apos;re offline. Changes will sync when you reconnect.
      </span>
    </motion.div>
  );
}
