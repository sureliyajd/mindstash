'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { useChat, type PendingConfirmationState } from '@/lib/hooks/useChat';
import type { ChatMessage } from '@/lib/types/chat';

interface ChatContextValue {
  // Chat state
  messages: ChatMessage[];
  isStreaming: boolean;
  isLoadingHistory: boolean;
  pendingConfirmation: PendingConfirmationState | null;
  sessionId: string | undefined;

  // Chat actions
  sendMessage: (content: string, opts?: { hidden?: boolean }) => Promise<void>;
  confirmAction: (confirmed: boolean) => Promise<void>;
  sendBriefingRequest: () => Promise<void>;
  startNewSession: () => void;
  switchSession: (sessionId: string) => Promise<void>;
  deleteSessionById: (sessionId: string) => Promise<void>;
  clearChat: () => void;

  // Mobile chat overlay state
  isMobileChatOpen: boolean;
  setMobileChatOpen: (open: boolean) => void;

  // Desktop chat visibility toggle
  isChatVisible: boolean;
  setChatVisible: (visible: boolean) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const chat = useChat();
  const [isMobileChatOpen, setMobileChatOpen] = useState(false);
  const [isChatVisible, setChatVisible] = useState(true);

  const value: ChatContextValue = {
    ...chat,
    isMobileChatOpen,
    setMobileChatOpen,
    isChatVisible,
    setChatVisible,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChatContext must be used within ChatProvider');
  return ctx;
}
