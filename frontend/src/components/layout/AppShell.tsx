'use client';

import { useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff } from 'lucide-react';
import { useState, useEffect } from 'react';
import { DesktopSidebar } from './DesktopSidebar';
import { MobileTabBar } from './MobileTabBar';
import { AppHeader } from './AppHeader';
import { ChatProvider, useChatContext } from '@/components/chat/ChatProvider';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatFullScreen } from '@/components/chat/ChatFullScreen';

// =============================================================================
// OFFLINE BANNER
// =============================================================================

function OfflineBanner() {
  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -50, opacity: 0 }}
      className="fixed left-0 right-0 top-0 z-[60] flex items-center justify-center gap-2 bg-amber-50 border-b border-amber-100 py-3"
    >
      <WifiOff className="h-4 w-4 text-amber-600" />
      <span className="text-sm font-medium text-amber-700">
        You&apos;re offline. Changes will sync when you reconnect.
      </span>
    </motion.div>
  );
}

// =============================================================================
// INNER SHELL (has access to ChatProvider context)
// =============================================================================

function AppShellInner({ children }: { children: ReactNode }) {
  const { isMobileChatOpen, setMobileChatOpen, isChatVisible, setChatVisible } = useChatContext();
  const [isOnline, setIsOnline] = useState(true);
  const [chatPulse, setChatPulse] = useState(false);

  // Track online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const focusChatInput = useCallback(() => {
    // Small delay to let the panel render/animate in
    setTimeout(() => {
      const textarea = document.querySelector<HTMLTextAreaElement>('#mindstash-chat-input');
      textarea?.focus();
    }, 400);
  }, []);

  const handleChatToggle = useCallback(() => {
    if (!isChatVisible) {
      setChatVisible(true);
      setChatPulse(true);
      focusChatInput();
    } else {
      // Already open — pulse to draw attention + re-focus
      setChatPulse(true);
      focusChatInput();
    }
  }, [setChatVisible, isChatVisible, focusChatInput]);

  const handleChatClose = useCallback(() => {
    setChatVisible(false);
  }, [setChatVisible]);

  // Clear pulse after animation completes
  useEffect(() => {
    if (!chatPulse) return;
    const timer = setTimeout(() => setChatPulse(false), 2000);
    return () => clearTimeout(timer);
  }, [chatPulse]);

  const handleMobileChatOpen = useCallback(() => {
    setMobileChatOpen(true);
  }, [setMobileChatOpen]);

  const handleSearchFocus = useCallback(() => {
    // Close mobile chat if open, scroll to search input
    setMobileChatOpen(false);
    // Dispatch a custom event that the dashboard can listen to
    window.dispatchEvent(new CustomEvent('mindstash:focus-search'));
  }, [setMobileChatOpen]);

  return (
    <div className="flex h-dvh overflow-hidden bg-gray-50">
      {/* Offline banner */}
      <AnimatePresence>{!isOnline && <OfflineBanner />}</AnimatePresence>

      {/* Desktop Sidebar */}
      <DesktopSidebar onChatToggle={handleChatToggle} chatActive={isChatVisible} />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile/tablet header */}
        <AppHeader />

        {/* Content + Chat */}
        <div className="flex flex-1 overflow-hidden">
          {/* Scrollable content */}
          <main className="flex-1 overflow-y-auto pb-16 sm:pb-0 scrollbar-thin" id="main-content">
            {children}
          </main>

          {/* Desktop chat sidebar */}
          <AnimatePresence>
            {isChatVisible && (
              <motion.aside
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 380, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                className="hidden lg:flex shrink-0 flex-col border-l border-gray-100 bg-white overflow-hidden relative"
              >
                {/* Pulse glow animation */}
                <AnimatePresence>
                  {chatPulse && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: [0, 0.8, 0.6, 0], scale: [0.98, 1, 1, 1] }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 2, ease: 'easeInOut', times: [0, 0.15, 0.5, 1] }}
                      className="pointer-events-none absolute inset-0 z-10"
                      style={{
                        border: '3px solid rgba(234, 123, 123, 0.6)',
                        borderRight: 'none',
                        borderRadius: '12px 0 0 12px',
                        boxShadow: 'inset 0 0 30px rgba(234, 123, 123, 0.2), 0 0 20px rgba(234, 123, 123, 0.15)',
                      }}
                    />
                  )}
                </AnimatePresence>
                <ChatSidebar onClose={handleChatClose} />
              </motion.aside>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile tab bar */}
      <MobileTabBar
        onChatOpen={handleMobileChatOpen}
        onSearchFocus={handleSearchFocus}
        isChatOpen={isMobileChatOpen}
      />

      {/* Mobile full-screen chat overlay */}
      <AnimatePresence>
        {isMobileChatOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-50 bg-white sm:hidden"
          >
            <ChatFullScreen />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// APP SHELL (wraps with ChatProvider)
// =============================================================================

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <ChatProvider>
      <AppShellInner>{children}</AppShellInner>
    </ChatProvider>
  );
}
