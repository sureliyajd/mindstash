'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { getToken } from '@/lib/api';
import { useAuth } from '@/lib/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    // Don't redirect while still loading
    if (isLoading) return;

    const token = getToken();

    // No token and not authenticated - redirect to login
    if (!token && !isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, router, pathname]);

  // Show loading skeleton while checking auth
  if (isLoading) {
    return <AuthLoadingSkeleton />;
  }

  // Not authenticated - show nothing while redirecting
  if (!isAuthenticated) {
    return <AuthLoadingSkeleton />;
  }

  // Authenticated - render children
  return <>{children}</>;
}

// Skeleton loader for auth check
function AuthLoadingSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      {/* Soft brand blobs in background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-[#EA7B7B]/10 blur-3xl" />
        <div className="absolute right-1/4 bottom-1/4 h-72 w-72 rounded-full bg-[#FACE68]/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="relative flex flex-col items-center gap-5"
      >
        {/* Logo with pulse ring */}
        <div className="relative">
          <motion.div
            className="absolute inset-0 rounded-2xl bg-[#EA7B7B]/20"
            animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="relative h-14 w-14 overflow-hidden rounded-2xl shadow-lg shadow-[#EA7B7B]/20"
            animate={{ opacity: [0.85, 1, 0.85] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          >
            <img src="/logo-icon.png" alt="MindStash" className="h-full w-full object-cover" />
          </motion.div>
        </div>

        {/* Animated dots */}
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-[#EA7B7B]"
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// Component to redirect authenticated users away from auth pages
export function PublicOnlyRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  // Show loading while checking
  if (isLoading) {
    return <AuthLoadingSkeleton />;
  }

  // Already authenticated - show nothing while redirecting
  if (isAuthenticated) {
    return <AuthLoadingSkeleton />;
  }

  return <>{children}</>;
}
