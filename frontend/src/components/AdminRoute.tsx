'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { getToken } from '@/lib/api';
import { useAuth } from '@/lib/hooks/useAuth';

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    const token = getToken();

    if (!token && !isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (isAuthenticated && user && !user.is_admin) {
      router.replace('/dashboard');
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) {
    return <AdminLoadingSkeleton />;
  }

  if (!isAuthenticated || !user) {
    return <AdminLoadingSkeleton />;
  }

  if (!user.is_admin) {
    return <AdminLoadingSkeleton />;
  }

  return <>{children}</>;
}

function AdminLoadingSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#09090b]">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <motion.div
          className="h-12 w-12 rounded-xl bg-zinc-800"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <span className="text-sm text-zinc-600">Loading...</span>
      </motion.div>
    </div>
  );
}
