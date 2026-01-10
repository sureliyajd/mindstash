'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, ReactNode, createContext, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

// Toast types
type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, action?: Toast['action']) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within Providers');
  }
  return context;
}

// Toast component
function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const icons = {
    success: <CheckCircle className="h-5 w-5 text-emerald-500" />,
    error: <AlertCircle className="h-5 w-5 text-red-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />,
  };

  const bgColors = {
    success: 'bg-emerald-50 border-emerald-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-white border-gray-200',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-lg ${bgColors[toast.type]}`}
    >
      {icons[toast.type]}
      <span className="text-sm font-medium text-gray-700">{toast.message}</span>
      {toast.action && (
        <button
          onClick={toast.action.onClick}
          className="ml-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
        >
          {toast.action.label}
        </button>
      )}
      <button
        onClick={onDismiss}
        className="ml-2 rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

// Toast container
function ToastContainer({ toasts, hideToast }: { toasts: Toast[]; hideToast: (id: string) => void }) {
  return (
    <div className="fixed bottom-4 left-1/2 z-[100] -translate-x-1/2 flex flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onDismiss={() => hideToast(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  // React Query client with production-ready config
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
            retry: (failureCount, error) => {
              // Don't retry on 401, 403, 404
              if (error instanceof Error) {
                const status = (error as { status?: number }).status;
                if (status === 401 || status === 403 || status === 404) {
                  return false;
                }
              }
              return failureCount < 2;
            },
          },
          mutations: {
            retry: false,
          },
        },
      })
  );

  // Toast state
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', action?: Toast['action']) => {
      const id = Math.random().toString(36).substring(7);
      const newToast: Toast = { id, message, type, action };

      setToasts((prev) => [...prev, newToast]);

      // Auto-dismiss after 4 seconds (longer if has action)
      const timeout = action ? 6000 : 4000;
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, timeout);
    },
    []
  );

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ToastContext.Provider value={{ showToast, hideToast }}>
        {children}
        <ToastContainer toasts={toasts} hideToast={hideToast} />
      </ToastContext.Provider>
    </QueryClientProvider>
  );
}
