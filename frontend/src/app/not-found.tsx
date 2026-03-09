'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function NotFound() {
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

        {/* 404 */}
        <div className="mb-4 text-8xl font-black text-[#EA7B7B] leading-none">404</div>

        <h1 className="mb-3 text-2xl font-bold text-gray-900">Page not found</h1>
        <p className="mb-10 max-w-sm text-gray-500">
          This thought seems to have drifted away. The page you&apos;re looking for doesn&apos;t exist.
        </p>

        <Link
          href="/"
          className="rounded-xl bg-[#EA7B7B] px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-[#EA7B7B]/25 transition-all hover:bg-[#D66B6B] hover:shadow-[#EA7B7B]/40"
        >
          Go home
        </Link>
      </motion.div>
    </div>
  );
}
