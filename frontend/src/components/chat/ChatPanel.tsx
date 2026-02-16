'use client';

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import {
  MessageSquare,
  X,
  Trash2,
  Send,
  Loader2,
  CheckCircle,
  AlertCircle,
  Search,
  Sparkles,
  ListChecks,
  Bell,
  PenLine,
  BarChart3,
  BookOpen,
} from 'lucide-react';
import { useChat } from '@/lib/hooks/useChat';
import type { ChatMessage, ToolCallStatus } from '@/lib/types/chat';

// =============================================================================
// TOOL ICON MAPPING
// =============================================================================

const toolIcons: Record<string, typeof Search> = {
  search_items: Search,
  create_item: PenLine,
  update_item: PenLine,
  delete_item: Trash2,
  mark_complete: ListChecks,
  get_counts: BarChart3,
  get_upcoming_notifications: Bell,
  get_digest_preview: BookOpen,
};

// =============================================================================
// TOOL CALL INDICATOR
// =============================================================================

function ToolCallIndicator({ toolCall }: { toolCall: ToolCallStatus }) {
  const Icon = toolIcons[toolCall.tool] || Sparkles;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-2 rounded-lg bg-teal-50 px-3 py-1.5 text-xs"
    >
      <Icon className="h-3.5 w-3.5 text-teal-600" />
      <span className="text-teal-700">{toolCall.message}</span>
      {toolCall.status === 'running' && (
        <Loader2 className="h-3 w-3 animate-spin text-teal-500" />
      )}
      {toolCall.status === 'done' && (
        <CheckCircle className="h-3 w-3 text-teal-500" />
      )}
      {toolCall.status === 'error' && (
        <AlertCircle className="h-3 w-3 text-red-400" />
      )}
    </motion.div>
  );
}

// =============================================================================
// MARKDOWN RENDERER
// =============================================================================

function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
        strong: ({ children }) => (
          <strong className="font-semibold">{children}</strong>
        ),
        em: ({ children }) => <em className="italic">{children}</em>,
        ul: ({ children }) => (
          <ul className="mb-1.5 ml-4 list-disc space-y-0.5 last:mb-0">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-1.5 ml-4 list-decimal space-y-0.5 last:mb-0">{children}</ol>
        ),
        li: ({ children }) => <li>{children}</li>,
        code: ({ children, className }) => {
          const isBlock = className?.includes('language-');
          if (isBlock) {
            return (
              <code className="block my-1.5 rounded-lg bg-gray-100 px-3 py-2 font-mono text-xs text-gray-800 overflow-x-auto">
                {children}
              </code>
            );
          }
          return (
            <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-xs text-gray-800">
              {children}
            </code>
          );
        },
        pre: ({ children }) => <pre className="my-1.5">{children}</pre>,
        h1: ({ children }) => (
          <h1 className="mb-1 text-base font-bold">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="mb-1 text-sm font-bold">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="mb-1 text-sm font-semibold">{children}</h3>
        ),
        hr: () => <hr className="my-2 border-gray-200" />,
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#EA7B7B] underline underline-offset-2 hover:text-[#d66b6b]"
          >
            {children}
          </a>
        ),
        blockquote: ({ children }) => (
          <blockquote className="my-1.5 border-l-2 border-gray-200 pl-3 text-gray-600 italic">
            {children}
          </blockquote>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

// =============================================================================
// CHAT BUBBLE
// =============================================================================

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
          isUser
            ? 'bg-[#EA7B7B]/10 text-gray-900'
            : 'bg-white border border-gray-100 text-gray-800'
        }`}
      >
        {/* Tool call indicators */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mb-2 space-y-1.5">
            {message.toolCalls.map((tc, i) => (
              <ToolCallIndicator key={`${tc.tool}-${i}`} toolCall={tc} />
            ))}
          </div>
        )}

        {/* Message content */}
        {message.content && (
          <div className="text-sm leading-relaxed">
            {isUser ? (
              <span className="whitespace-pre-wrap">{message.content}</span>
            ) : (
              <MarkdownContent content={message.content} />
            )}
          </div>
        )}

        {/* Streaming cursor */}
        {message.isStreaming && !message.content && (
          <div className="flex items-center gap-1 py-1">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-gray-400" />
            <div
              className="h-1.5 w-1.5 animate-pulse rounded-full bg-gray-400"
              style={{ animationDelay: '0.2s' }}
            />
            <div
              className="h-1.5 w-1.5 animate-pulse rounded-full bg-gray-400"
              style={{ animationDelay: '0.4s' }}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}

// =============================================================================
// WELCOME STATE
// =============================================================================

function WelcomeState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EA7B7B]/10">
        <Sparkles className="h-7 w-7 text-[#EA7B7B]" />
      </div>
      <h3 className="mb-2 text-base font-semibold text-gray-900">
        MindStash AI
      </h3>
      <p className="text-sm text-gray-500">
        Ask me anything about your saved thoughts, tasks, or ideas.
      </p>
      <div className="mt-6 space-y-2 text-left">
        {[
          'How many items do I have?',
          'Show me my urgent tasks',
          'Save a note: check quarterly report',
        ].map((suggestion) => (
          <div
            key={suggestion}
            className="rounded-xl border border-gray-100 px-3 py-2 text-xs text-gray-500"
          >
            &ldquo;{suggestion}&rdquo;
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// LOADING HISTORY STATE
// =============================================================================

function LoadingHistory() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <Loader2 className="mb-3 h-6 w-6 animate-spin text-gray-400" />
      <p className="text-sm text-gray-500">Loading conversation...</p>
    </div>
  );
}

// =============================================================================
// CHAT INPUT
// =============================================================================

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
}

function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [value, disabled, onSend]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [value]);

  return (
    <div className="flex items-end gap-2 border-t border-gray-100 bg-white px-4 py-3">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask anything..."
        disabled={disabled}
        rows={1}
        className="flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-[#EA7B7B]/40 focus:bg-white disabled:opacity-50"
      />
      <button
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EA7B7B] text-white transition-all hover:bg-[#d66b6b] disabled:opacity-40 disabled:hover:bg-[#EA7B7B]"
      >
        {disabled ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}

// =============================================================================
// MAIN CHAT PANEL
// =============================================================================

export function ChatPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, isStreaming, isLoadingHistory, sendMessage, clearChat } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <>
      {/* Toggle button - hidden when panel is open */}
      {!isOpen && (
        <motion.button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#EA7B7B] text-white shadow-lg transition-shadow hover:shadow-xl"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Open chat"
        >
          <MessageSquare className="h-6 w-6" />
        </motion.button>
      )}

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Mobile backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 right-0 top-0 z-50 flex w-full flex-col border-l border-gray-100 bg-gray-50 shadow-2xl sm:w-[400px] lg:top-[73px] lg:z-30"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#EA7B7B]" />
                  <span className="text-sm font-semibold text-gray-900">
                    MindStash AI
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {messages.length > 0 && (
                    <button
                      onClick={clearChat}
                      className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                      title="Clear chat"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Messages area */}
              <div className="flex-1 overflow-y-auto px-4 py-4">
                {isLoadingHistory ? (
                  <LoadingHistory />
                ) : messages.length === 0 ? (
                  <WelcomeState />
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg) => (
                      <ChatBubble key={msg.id} message={msg} />
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Input */}
              <ChatInput onSend={sendMessage} disabled={isStreaming} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
