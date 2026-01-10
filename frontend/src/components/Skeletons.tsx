'use client';

import { motion } from 'framer-motion';

// Base skeleton with shimmer effect
function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-lg bg-gray-200 ${className}`}
    >
      <motion.div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-gray-100 to-transparent"
        animate={{ translateX: ['-100%', '100%'] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

// Card skeleton for masonry grid
export function ItemCardSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-16 rounded-lg" />
        </div>
        <Skeleton className="h-5 w-10 rounded-lg" />
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
      <div className="border-t border-gray-100 pt-3">
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

// Dashboard loading skeleton
export function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      {/* Masonry grid skeleton */}
      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
        {[...Array(6)].map((_, i) => (
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
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <Skeleton className="mb-4 h-24 w-full rounded-lg" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-8 w-16 rounded-xl" />
      </div>
    </div>
  );
}

// Inline loading spinner (subtle)
export function InlineSpinner({ className = '' }: { className?: string }) {
  return (
    <motion.div
      className={`h-4 w-4 rounded-full border-2 border-gray-200 border-t-indigo-500 ${className}`}
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm"
    >
      <motion.div
        className="flex flex-col items-center gap-3"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
      >
        <InlineSpinner className="h-6 w-6" />
        <span className="text-sm text-gray-500">Loading...</span>
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
      className="fixed left-0 right-0 top-0 z-50 flex items-center justify-center gap-2 bg-amber-50 border-b border-amber-200 py-2.5"
    >
      <span className="text-sm font-medium text-amber-700">
        You&apos;re offline. Changes will sync when you reconnect.
      </span>
    </motion.div>
  );
}
