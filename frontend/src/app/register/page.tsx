'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { PublicOnlyRoute } from '@/components/ProtectedRoute';
import { AxiosError } from 'axios';

function RegisterForm() {
  const router = useRouter();
  const { register, login, isRegisterLoading, isLoginLoading, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isLoading = isRegisterLoading || isLoginLoading;

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      await register(email, password);
      // Auto-login after registration
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof AxiosError) {
        const status = err.response?.status;
        const detail = err.response?.data?.detail;

        if (status === 409 || (detail && detail.includes('already'))) {
          setError('An account with this email already exists');
        } else if (status === 422) {
          // Validation error
          if (detail && Array.isArray(detail)) {
            const firstError = detail[0];
            if (firstError?.loc?.includes('password')) {
              setError('Password must be between 8 and 72 characters');
            } else if (firstError?.loc?.includes('email')) {
              setError('Please enter a valid email address');
            } else {
              setError('Please check your input and try again');
            }
          } else {
            setError(detail || 'Please check your input and try again');
          }
        } else if (!err.response) {
          setError('Unable to connect. Please check your internet connection.');
        } else {
          setError(detail || 'Something went wrong. Please try again.');
        }
      } else {
        setError('Something went wrong. Please try again.');
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#09090b] px-4">
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/5 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-sm"
      >
        {/* Card */}
        <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-8 shadow-xl shadow-black/20 backdrop-blur-sm">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold text-white">Start remembering</h1>
            <p className="mt-2 text-sm text-zinc-500">
              Create your MindStash account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm text-zinc-400"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
                disabled={isLoading}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-white placeholder-zinc-600 outline-none transition-all duration-200 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="you@example.com"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm text-zinc-400"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                minLength={8}
                disabled={isLoading}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-white placeholder-zinc-600 outline-none transition-all duration-200 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="At least 8 characters"
              />
              <p className="mt-1.5 text-xs text-zinc-600">
                Minimum 8 characters
              </p>
            </div>

            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <p className="text-sm text-red-400/80">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center rounded-xl bg-indigo-500 py-3 font-medium text-white shadow-lg shadow-indigo-500/20 transition-all duration-200 hover:bg-indigo-400 hover:shadow-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Create account'
              )}
            </button>
          </form>

          {/* Terms notice */}
          <p className="mt-4 text-center text-xs text-zinc-600">
            By signing up, you agree to our{' '}
            <span className="text-zinc-500">Terms</span> and{' '}
            <span className="text-zinc-500">Privacy Policy</span>
          </p>

          {/* Footer link */}
          <p className="mt-6 text-center text-sm text-zinc-500">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-indigo-400 transition-colors hover:text-indigo-300"
            >
              Login
            </Link>
          </p>
        </div>

        {/* Back to home */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-zinc-600 transition-colors hover:text-zinc-400"
          >
            ← Back to home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <PublicOnlyRoute>
      <RegisterForm />
    </PublicOnlyRoute>
  );
}
