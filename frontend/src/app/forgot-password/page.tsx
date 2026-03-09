'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Loader2, ArrowLeft, CheckCircle, Mail } from 'lucide-react';
import { auth } from '@/lib/api';
import { AxiosError } from 'axios';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [phase, setPhase] = useState<'form' | 'sent'>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await auth.forgotPassword(email);
      setPhase('sent');
    } catch (err) {
      if (err instanceof AxiosError) {
        if (err.response?.status === 422) {
          setError('Please enter a valid email address.');
        } else if (!err.response) {
          setError('Cannot reach the server. Please try again.');
        } else {
          setError('Something went wrong. Please try again.');
        }
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-[#EA7B7B]/10 opacity-70 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-[#79C9C5]/10 opacity-60 blur-3xl" />
      </div>

      <div className="relative flex min-h-screen">
        {/* Left side — illustration */}
        <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12">
          <motion.div
            className="relative w-full max-w-lg"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="aspect-square rounded-3xl bg-[#EA7B7B] p-12 shadow-2xl shadow-[#EA7B7B]/20">
              <div className="absolute inset-0 rounded-3xl opacity-10" style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                backgroundSize: '32px 32px'
              }} />
              <div className="relative flex h-full flex-col items-center justify-center text-center">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Mail className="h-32 w-32 text-white opacity-90" />
                </motion.div>
                <h2 className="mt-8 text-3xl font-bold text-white">Forgot your password?</h2>
                <p className="mt-3 text-lg text-white/90">No worries — we&apos;ll send you a reset link</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right side — form */}
        <div className="flex w-full lg:w-1/2 items-center justify-center px-6 py-12">
          <motion.div
            className="w-full max-w-md"
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            {/* Back link */}
            <motion.div variants={fadeUp} className="mb-8">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to login
              </Link>
            </motion.div>

            <AnimatePresence mode="wait">
              {phase === 'form' ? (
                <motion.div
                  key="form"
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, y: -10 }}
                  variants={stagger}
                >
                  <motion.div variants={fadeUp} className="mb-10">
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Reset password</h1>
                    <p className="mt-3 text-gray-500">
                      Enter your email and we&apos;ll send you a link to reset your password.
                    </p>
                  </motion.div>

                  <motion.form variants={fadeUp} onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                        Email address
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        autoFocus
                        disabled={loading}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:border-[#EA7B7B] focus:bg-white focus:ring-4 focus:ring-[#EA7B7B]/10 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="you@example.com"
                      />
                    </div>

                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="rounded-xl bg-red-50 border border-red-100 px-4 py-3"
                        >
                          <p className="text-sm font-medium text-red-600">{error}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <motion.button
                      type="submit"
                      disabled={loading}
                      whileHover={{ scale: loading ? 1 : 1.01 }}
                      whileTap={{ scale: loading ? 1 : 0.99 }}
                      className="w-full rounded-xl bg-[#EA7B7B] py-4 text-base font-semibold text-white shadow-lg shadow-[#EA7B7B]/25 transition-all duration-200 hover:bg-[#D66B6B] hover:shadow-[#EA7B7B]/40 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : 'Send reset link'}
                    </motion.button>
                  </motion.form>
                </motion.div>
              ) : (
                <motion.div
                  key="sent"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="text-center"
                >
                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
                    <CheckCircle className="h-10 w-10 text-green-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Check your inbox</h2>
                  <p className="mt-3 text-gray-500">
                    If <strong>{email}</strong> is registered, you&apos;ll receive a reset link shortly.
                    The link expires in 1 hour.
                  </p>
                  <p className="mt-4 text-sm text-gray-400">
                    Didn&apos;t receive it? Check your spam folder or{' '}
                    <button
                      onClick={() => { setPhase('form'); setEmail(''); }}
                      className="font-medium text-[#EA7B7B] hover:text-[#FF8364] transition-colors"
                    >
                      try again
                    </button>
                    .
                  </p>
                  <Link
                    href="/login"
                    className="mt-8 inline-block text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    ← Back to login
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
