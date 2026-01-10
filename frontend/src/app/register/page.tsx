'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, Brain, Eye, EyeOff, Check } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { PublicOnlyRoute } from '@/components/ProtectedRoute';
import { AxiosError } from 'axios';

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// =============================================================================
// REGISTER FORM COMPONENT
// =============================================================================

function RegisterForm() {
  const router = useRouter();
  const { register, login, isRegisterLoading, isLoginLoading, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLoading = isRegisterLoading || isLoginLoading;

  // Password validation
  const passwordLength = password.length >= 8;

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
    <div className="min-h-screen bg-white">
      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-violet-100 via-purple-50 to-transparent opacity-70 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-gradient-to-tl from-fuchsia-50 via-purple-50 to-transparent opacity-60 blur-3xl" />
      </div>

      {/* Main container */}
      <div className="relative flex min-h-screen">
        {/* Left side - Form */}
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
                href="/"
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to home
              </Link>
            </motion.div>

            {/* Logo for mobile */}
            <motion.div variants={fadeUp} className="mb-8 lg:hidden">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-violet-600">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-gray-900">MindStash</span>
              </div>
            </motion.div>

            {/* Header */}
            <motion.div variants={fadeUp} className="mb-10">
              <h1 className="heading-section text-3xl sm:text-4xl text-gray-900">
                Create your account
              </h1>
              <p className="mt-3 text-gray-500">
                Start capturing and organizing your thoughts
              </p>
            </motion.div>

            {/* Form */}
            <motion.form
              variants={fadeUp}
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              {/* Email field */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
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
                  disabled={isLoading}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="you@example.com"
                />
              </div>

              {/* Password field */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Create a password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    minLength={8}
                    disabled={isLoading}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 pr-12 text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="At least 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>

                {/* Password requirement indicator */}
                <div className="mt-3 flex items-center gap-2">
                  <div className={`flex h-5 w-5 items-center justify-center rounded-full transition-colors ${
                    passwordLength ? 'bg-green-500' : 'bg-gray-200'
                  }`}>
                    {passwordLength && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <span className={`text-sm transition-colors ${
                    passwordLength ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    At least 8 characters
                  </span>
                </div>
              </div>

              {/* Error message */}
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

              {/* Submit button */}
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: isLoading ? 1 : 1.01 }}
                whileTap={{ scale: isLoading ? 1 : 0.99 }}
                className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 py-4 text-base font-semibold text-white shadow-lg shadow-purple-500/25 transition-all duration-200 hover:shadow-purple-500/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                ) : (
                  'Create account'
                )}
              </motion.button>

              {/* Terms */}
              <p className="text-center text-xs text-gray-400">
                By signing up, you agree to our{' '}
                <span className="text-gray-500 hover:text-gray-700 cursor-pointer">Terms of Service</span>
                {' '}and{' '}
                <span className="text-gray-500 hover:text-gray-700 cursor-pointer">Privacy Policy</span>
              </p>
            </motion.form>

            {/* Sign in link */}
            <motion.p
              variants={fadeUp}
              className="mt-8 text-center text-gray-500"
            >
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-semibold text-purple-600 hover:text-purple-700 transition-colors"
              >
                Sign in
              </Link>
            </motion.p>
          </motion.div>
        </div>

        {/* Right side - Illustration (hidden on mobile) */}
        <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12">
          <motion.div
            className="relative w-full max-w-lg"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Purple gradient background */}
            <div className="aspect-square rounded-3xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 p-12 shadow-2xl shadow-purple-500/20">
              {/* Decorative pattern */}
              <div className="absolute inset-0 rounded-3xl opacity-10" style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                backgroundSize: '32px 32px'
              }} />

              {/* Content */}
              <div className="relative flex h-full flex-col items-center justify-center text-center">
                {/* Animated brain GIF */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <img
                    src="/images/thinking-monkey.gif"
                    alt=""
                    className="h-48 w-48 object-contain"
                  />
                </motion.div>

                <h2 className="mt-8 text-3xl font-bold text-white">
                  Your second brain
                </h2>
                <p className="mt-3 text-lg text-purple-100">
                  Never lose a brilliant idea again
                </p>

                {/* Feature highlights */}
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  {['AI-Powered', '12 Categories', 'Instant Recall'].map((feature) => (
                    <span
                      key={feature}
                      className="rounded-full bg-white/20 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// PAGE EXPORT
// =============================================================================

export default function RegisterPage() {
  return (
    <PublicOnlyRoute>
      <RegisterForm />
    </PublicOnlyRoute>
  );
}
