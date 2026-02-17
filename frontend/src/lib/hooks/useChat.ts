'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { chat } from '../api';
import type {
  ChatMessage,
  ToolCallStatus,
  ChatSSEEventType,
  SessionIdData,
  TextDeltaData,
  ToolStartData,
  ToolResultData,
  ErrorData,
} from '../types/chat';

const SESSION_KEY = 'mindstash_chat_session';
const BRIEFING_KEY = 'mindstash_last_briefing';

/** The magic trigger message for daily briefing. Hidden from user in UI. */
export const BRIEFING_TRIGGER = '[BRIEFING]';

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const sessionIdRef = useRef<string | undefined>(undefined);
  const hasRestoredRef = useRef(false);
  const queryClient = useQueryClient();

  // Helper: load messages for a session ID and restore them
  const restoreSession = useCallback(async (sessionId: string) => {
    sessionIdRef.current = sessionId;
    if (typeof window !== 'undefined') {
      localStorage.setItem(SESSION_KEY, sessionId);
    }

    const apiMessages = await chat.getSessionMessages(sessionId, 50);
    const restored: ChatMessage[] = [];
    for (const m of apiMessages) {
      if (m.role === 'user' && m.content) {
        restored.push({
          id: m.id,
          role: 'user',
          content: m.content,
          timestamp: new Date(m.created_at),
        });
      } else if (m.role === 'assistant' && m.content) {
        restored.push({
          id: m.id,
          role: 'assistant',
          content: m.content,
          timestamp: new Date(m.created_at),
        });
      }
    }
    return restored;
  }, []);

  // Restore last session on mount: try localStorage first, then fetch from API
  useEffect(() => {
    if (hasRestoredRef.current) return;
    hasRestoredRef.current = true;

    const savedSessionId =
      typeof window !== 'undefined'
        ? localStorage.getItem(SESSION_KEY)
        : null;

    setIsLoadingHistory(true);

    const restore = async () => {
      // Try localStorage session first
      if (savedSessionId) {
        try {
          const restored = await restoreSession(savedSessionId);
          if (restored.length > 0) {
            setMessages(restored);
            return;
          }
        } catch {
          // Session invalid, fall through to API lookup
        }
      }

      // No localStorage session (or it failed) - fetch most recent from API
      try {
        const { sessions } = await chat.getSessions(1);
        if (sessions.length > 0 && sessions[0].message_count > 0) {
          const restored = await restoreSession(sessions[0].id);
          if (restored.length > 0) {
            setMessages(restored);
            return;
          }
        }
      } catch {
        // API not available or no sessions
      }

      // Nothing to restore
      localStorage.removeItem(SESSION_KEY);
    };

    restore().finally(() => setIsLoadingHistory(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restoreSession]);

  const parseSSEStream = useCallback(
    async (response: Response) => {
      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = '';

      // Create a placeholder assistant message
      const assistantMsgId = `assistant-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMsgId,
          role: 'assistant',
          content: '',
          timestamp: new Date(),
          toolCalls: [],
          isStreaming: true,
        },
      ]);

      let hasMutated = false;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          let eventType: ChatSSEEventType | null = null;

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventType = line.slice(7).trim() as ChatSSEEventType;
            } else if (line.startsWith('data: ') && eventType) {
              const dataStr = line.slice(6);
              try {
                const data = JSON.parse(dataStr);

                switch (eventType) {
                  case 'session_id': {
                    const d = data as SessionIdData;
                    sessionIdRef.current = d.session_id;
                    // Persist session ID for page refresh
                    if (typeof window !== 'undefined') {
                      localStorage.setItem(SESSION_KEY, d.session_id);
                    }
                    break;
                  }
                  case 'text_delta': {
                    const d = data as TextDeltaData;
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === assistantMsgId
                          ? { ...m, content: m.content + d.text }
                          : m
                      )
                    );
                    break;
                  }
                  case 'tool_start': {
                    const d = data as ToolStartData;
                    const tc: ToolCallStatus = {
                      tool: d.tool,
                      message: d.message,
                      status: 'running',
                    };
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === assistantMsgId
                          ? { ...m, toolCalls: [...(m.toolCalls || []), tc] }
                          : m
                      )
                    );
                    break;
                  }
                  case 'tool_result': {
                    const d = data as ToolResultData;
                    if (d.mutated) hasMutated = true;
                    setMessages((prev) =>
                      prev.map((m) => {
                        if (m.id !== assistantMsgId) return m;
                        const updatedCalls = (m.toolCalls || []).map((tc) =>
                          tc.tool === d.tool && tc.status === 'running'
                            ? { ...tc, status: d.success ? ('done' as const) : ('error' as const) }
                            : tc
                        );
                        return { ...m, toolCalls: updatedCalls };
                      })
                    );
                    break;
                  }
                  case 'error': {
                    const d = data as ErrorData;
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === assistantMsgId
                          ? {
                              ...m,
                              content: m.content || d.message,
                              isStreaming: false,
                            }
                          : m
                      )
                    );
                    break;
                  }
                  case 'done': {
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === assistantMsgId
                          ? { ...m, isStreaming: false }
                          : m
                      )
                    );
                    break;
                  }
                }
              } catch {
                // Skip unparseable SSE data
              }
              eventType = null;
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId ? { ...m, isStreaming: false } : m
        )
      );

      if (hasMutated) {
        queryClient.invalidateQueries({ queryKey: ['items'] });
        queryClient.invalidateQueries({ queryKey: ['item-counts'] });
      }
    },
    [queryClient]
  );

  const sendMessage = useCallback(
    async (content: string, { hidden = false }: { hidden?: boolean } = {}) => {
      if (!content.trim() || isStreaming) return;

      // Only add user bubble if not hidden (briefing trigger is hidden)
      if (!hidden) {
        const userMsg: ChatMessage = {
          id: `user-${Date.now()}`,
          role: 'user',
          content: content.trim(),
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMsg]);
      }
      setIsStreaming(true);

      try {
        const response = await chat.sendMessage(content.trim(), sessionIdRef.current);
        await parseSSEStream(response);
      } catch (err) {
        const errorMsg: ChatMessage = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content:
            err instanceof Error
              ? err.message
              : 'Something went wrong. Please try again.',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsStreaming(false);
      }
    },
    [isStreaming, parseSSEStream]
  );

  /**
   * Send a daily briefing request. Hidden from user bubbles.
   * Only triggers if not already briefed today (localStorage check).
   */
  const sendBriefingRequest = useCallback(async () => {
    if (typeof window === 'undefined') return;
    const today = new Date().toDateString();
    if (localStorage.getItem(BRIEFING_KEY) === today) return;

    localStorage.setItem(BRIEFING_KEY, today);
    await sendMessage(BRIEFING_TRIGGER, { hidden: true });
  }, [sendMessage]);

  // Auto-trigger daily briefing after history has loaded
  const hasSentBriefingRef = useRef(false);
  useEffect(() => {
    if (isLoadingHistory || hasSentBriefingRef.current) return;
    hasSentBriefingRef.current = true;

    // Small delay to let the UI settle before triggering briefing
    const timer = setTimeout(() => {
      sendBriefingRequest();
    }, 500);
    return () => clearTimeout(timer);
  }, [isLoadingHistory, sendBriefingRequest]);

  const clearChat = useCallback(() => {
    setMessages([]);
    sessionIdRef.current = undefined;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_KEY);
    }
  }, []);

  return {
    messages,
    isStreaming,
    isLoadingHistory,
    sendMessage,
    sendBriefingRequest,
    clearChat,
    sessionId: sessionIdRef.current,
  };
}
