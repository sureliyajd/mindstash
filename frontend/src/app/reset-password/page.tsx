'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Loader2, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { auth } from '@/lib/api';
import { AxiosError } from 'axios';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [phase, setPhase] = useState<'loading' | 'invalid' | 'form' | 'success'>('loading');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setPhase('invalid');
    } else {
      setPhase('form');
    }
  }, [token]);

  const passwordLongEnough = password.length >= 8;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setLoading(true);

    try {
      await auth.resetPassword(token, password);
      setPhase('success');
    } catch (err) {
      if (err instanceof AxiosError) {
        const status = err.response?.status;
        if (status === 400) {
          setError('This link has expired or already been used. Please request a new one.');
        } else if (status === 422) {
          setError('Password must be between 8 and 72 characters.');
        } else if (!err.response) {
          setError('Cannot reach the server. Please try again.');
        } else {
          setError(err.response.data?.detail || 'Something went wrong. Please try again.');
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

      <div className="relative flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">

          {/* Loading phase */}
          {phase === 'loading' && (
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#EA7B7B]" />
            </div>
          )}

          {/* Invalid / missing token */}
          {phase === 'invalid' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
                <XCircle className="h-10 w-10 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Invalid reset link</h2>
              <p className="mt-3 text-gray-500">
                This password reset link is missing or malformed.
              </p>
              <Link
                href="/forgot-password"
                className="mt-6 inline-block rounded-xl bg-[#EA7B7B] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#EA7B7B]/25 hover:bg-[#D66B6B] transition-colors"
              >
                Request a new link
              </Link>
            </motion.div>
          )}

          {/* Form phase */}
          {phase === 'form' && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
            >
              <motion.div variants={fadeUp} className="mb-10">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Choose a new password</h1>
                <p className="mt-3 text-gray-500">
                  Pick something strong that you haven&apos;t used before.
                </p>
              </motion.div>

              <motion.form variants={fadeUp} onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                    New password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      maxLength={72}
                      autoComplete="new-password"
                      autoFocus
                      disabled={loading}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 pr-12 text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:border-[#EA7B7B] focus:bg-white focus:ring-4 focus:ring-[#EA7B7B]/10 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="At least 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>

                  {/* Length indicator */}
                  {password.length > 0 && (
                    <p className={`mt-2 text-xs font-medium ${passwordLongEnough ? 'text-green-600' : 'text-amber-600'}`}>
                      {passwordLongEnough ? '✓ Meets minimum length' : `${8 - password.length} more character${8 - password.length === 1 ? '' : 's'} needed`}
                    </p>
                  )}
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl bg-red-50 border border-red-100 px-4 py-3"
                  >
                    <p className="text-sm font-medium text-red-600">{error}</p>
                    {error.includes('expired') && (
                      <Link href="/forgot-password" className="mt-1 block text-xs font-medium text-[#EA7B7B] hover:text-[#FF8364]">
                        Request a new reset link →
                      </Link>
                    )}
                  </motion.div>
                )}

                <motion.button
                  type="submit"
                  disabled={loading || !passwordLongEnough}
                  whileHover={{ scale: loading ? 1 : 1.01 }}
                  whileTap={{ scale: loading ? 1 : 0.99 }}
                  className="w-full rounded-xl bg-[#EA7B7B] py-4 text-base font-semibold text-white shadow-lg shadow-[#EA7B7B]/25 transition-all duration-200 hover:bg-[#D66B6B] hover:shadow-[#EA7B7B]/40 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : 'Reset password'}
                </motion.button>
              </motion.form>
            </motion.div>
          )}

          {/* Success phase */}
          {phase === 'success' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Password reset!</h2>
              <p className="mt-3 text-gray-500">
                Your password has been updated. You can now log in with your new password.
              </p>
              <Link
                href="/login"
                className="mt-6 inline-block rounded-xl bg-[#EA7B7B] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#EA7B7B]/25 hover:bg-[#D66B6B] transition-colors"
              >
                Go to login →
              </Link>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#EA7B7B]" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
