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
    <div className="flex min-h-screen items-center justify-center bg-[#09090b]">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center gap-4"
      >
        {/* Pulsing logo placeholder */}
        <motion.div
          className="h-12 w-12 rounded-xl bg-zinc-800"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        {/* Loading text */}
        <span className="text-sm text-zinc-600">Loading...</span>
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
