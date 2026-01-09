'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Sparkles, Brain, Clock } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

export default function Home() {
  return (
    <div className="min-h-screen bg-[#09090b]">
      {/* Hero Section */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6">
        {/* Subtle gradient background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 blur-3xl" />
          <div className="absolute right-1/4 top-1/4 h-[400px] w-[400px] rounded-full bg-indigo-600/5 blur-3xl" />
        </div>

        <motion.div
          className="relative z-10 flex max-w-3xl flex-col items-center text-center"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          <motion.h1
            className="text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl"
            variants={fadeUp}
            transition={{ duration: 0.6 }}
          >
            Never lose a thought again
          </motion.h1>

          <motion.p
            className="mt-6 max-w-xl text-lg text-zinc-400 sm:text-xl md:mt-8 md:text-2xl"
            variants={fadeUp}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Drop thoughts without thinking.
            <br className="hidden sm:block" />{' '}
            We organize, you remember.
          </motion.p>

          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-10 md:mt-12"
          >
            <Link
              href="/register"
              className="group inline-flex items-center justify-center rounded-full bg-indigo-500 px-8 py-4 text-base font-medium text-white shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:bg-indigo-400 hover:shadow-xl hover:shadow-indigo-500/30 sm:text-lg"
            >
              Get Started
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <motion.div
            className="h-14 w-8 rounded-full border border-zinc-700 p-2"
            initial={{ opacity: 0.5 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.div
              className="h-2 w-2 rounded-full bg-zinc-500"
              animate={{ y: [0, 20, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="relative px-6 py-24 md:py-32">
        <motion.div
          className="mx-auto max-w-4xl"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={stagger}
        >
          <div className="grid gap-12 md:grid-cols-3 md:gap-8">
            {/* Feature 1 */}
            <motion.div
              className="flex flex-col items-center text-center md:items-start md:text-left"
              variants={fadeUp}
              transition={{ duration: 0.5 }}
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-800/50 ring-1 ring-zinc-700/50">
                <Sparkles className="h-5 w-5 text-zinc-400" />
              </div>
              <h3 className="text-xl font-medium text-white">Just drop it</h3>
              <p className="mt-3 text-base leading-relaxed text-zinc-500">
                No folders, tags, or decisions. Just capture what&apos;s on your mind.
              </p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div
              className="flex flex-col items-center text-center md:items-start md:text-left"
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-800/50 ring-1 ring-zinc-700/50">
                <Brain className="h-5 w-5 text-zinc-400" />
              </div>
              <h3 className="text-xl font-medium text-white">We understand</h3>
              <p className="mt-3 text-base leading-relaxed text-zinc-500">
                AI categorizes automatically. Your thoughts, intelligently organized.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div
              className="flex flex-col items-center text-center md:items-start md:text-left"
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-800/50 ring-1 ring-zinc-700/50">
                <Clock className="h-5 w-5 text-zinc-400" />
              </div>
              <h3 className="text-xl font-medium text-white">Perfect timing</h3>
              <p className="mt-3 text-base leading-relaxed text-zinc-500">
                Resurfaces when relevant. The right thought at the right moment.
              </p>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800/50 px-6 py-8">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <span className="text-sm text-zinc-600">MindStash</span>
          <Link
            href="/login"
            className="text-sm text-zinc-500 transition-colors hover:text-zinc-300"
          >
            Sign in
          </Link>
        </div>
      </footer>
    </div>
  );
}
