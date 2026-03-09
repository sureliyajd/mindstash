'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center text-center"
      >
        {/* Logo */}
        <Link href="/" className="mb-10">
          <img src="/logo.png" alt="MindStash" className="h-12 w-auto" />
        </Link>

        {/* Icon */}
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#EA7B7B]/10">
          <span className="text-4xl">⚠️</span>
        </div>

        <h1 className="mb-3 text-2xl font-bold text-gray-900">Something went wrong</h1>
        <p className="mb-2 max-w-sm text-gray-500">
          An unexpected error occurred. Your thoughts are safe — this is just a hiccup.
        </p>

        {error.digest && (
          <p className="mb-8 text-xs text-gray-400">Error ID: {error.digest}</p>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={reset}
            className="rounded-xl bg-[#EA7B7B] px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-[#EA7B7B]/25 transition-all hover:bg-[#D66B6B]"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-xl border border-gray-200 px-8 py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50"
          >
            Go home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
