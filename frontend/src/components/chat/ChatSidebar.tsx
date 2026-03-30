'use client';

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import {
  X,
  Trash2,
  Send,
  Loader2,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Search,
  Sparkles,
  ListChecks,
  Bell,
  PenLine,
  BarChart3,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  History,
  Plus,
  MessageCircle,
  Lock,
  Zap,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { BRIEFING_TRIGGER } from '@/lib/hooks/useChat';
import { chat as chatApi } from '@/lib/api';
import { useBillingStatus } from '@/lib/hooks/useBilling';
import type { ChatMessage, ToolCallStatus } from '@/lib/types/chat';
import { useChatContext } from './ChatProvider';

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
  generate_daily_briefing: Sparkles,
};

// =============================================================================
// TOOL CONFIRMATION PROMPT
// =============================================================================

function ToolConfirmationPrompt({
  toolCall,
  onConfirm,
  onDeny,
}: {
  toolCall: ToolCallStatus;
  onConfirm: () => void;
  onDeny: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-amber-200 bg-amber-50 p-3"
    >
      <div className="mb-2 flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
        <p className="text-xs leading-relaxed text-amber-800">
          {toolCall.confirmationDescription || toolCall.message}
        </p>
      </div>
      <div className="flex gap-2">
        <button onClick={onConfirm} className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-600">
          Delete
        </button>
        <button onClick={onDeny} className="rounded-lg bg-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-300">
          Cancel
        </button>
      </div>
    </motion.div>
  );
}

// =============================================================================
// TOOL CALL INDICATOR
// =============================================================================

function ToolCallIndicator({
  toolCall,
  onConfirm,
  onDeny,
}: {
  toolCall: ToolCallStatus;
  onConfirm?: () => void;
  onDeny?: () => void;
}) {
  const Icon = toolIcons[toolCall.tool] || Sparkles;
  if (toolCall.status === 'awaiting_confirmation' && onConfirm && onDeny) {
    return <ToolConfirmationPrompt toolCall={toolCall} onConfirm={onConfirm} onDeny={onDeny} />;
  }
  return (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 rounded-lg bg-teal-50 px-3 py-1.5 text-xs">
      <Icon className="h-3.5 w-3.5 text-teal-600" />
      <span className="text-teal-700">{toolCall.message}</span>
      {toolCall.status === 'running' && <Loader2 className="h-3 w-3 animate-spin text-teal-500" />}
      {toolCall.status === 'done' && <CheckCircle className="h-3 w-3 text-teal-500" />}
      {toolCall.status === 'error' && <AlertCircle className="h-3 w-3 text-red-400" />}
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
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        ul: ({ children }) => <ul className="mb-1.5 ml-4 list-disc space-y-0.5 last:mb-0">{children}</ul>,
        ol: ({ children }) => <ol className="mb-1.5 ml-4 list-decimal space-y-0.5 last:mb-0">{children}</ol>,
        li: ({ children }) => <li>{children}</li>,
        code: ({ children, className }) => {
          const isBlock = className?.includes('language-');
          if (isBlock) return <code className="block my-1.5 rounded-lg bg-gray-100 px-3 py-2 font-mono text-xs text-gray-800 overflow-x-auto">{children}</code>;
          return <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-xs text-gray-800">{children}</code>;
        },
        pre: ({ children }) => <pre className="my-1.5">{children}</pre>,
        h1: ({ children }) => <h1 className="mb-1 text-base font-bold">{children}</h1>,
        h2: ({ children }) => <h2 className="mb-1 text-sm font-bold">{children}</h2>,
        h3: ({ children }) => <h3 className="mb-1 text-sm font-semibold">{children}</h3>,
        hr: () => <hr className="my-2 border-gray-200" />,
        a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#EA7B7B] underline underline-offset-2 hover:text-[#d66b6b]">{children}</a>,
        blockquote: ({ children }) => <blockquote className="my-1.5 border-l-2 border-gray-200 pl-3 text-gray-600 italic">{children}</blockquote>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

// =============================================================================
// CHAT BUBBLE
// =============================================================================

function PlanLimitBubble({ message }: { message: ChatMessage }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
      <div className="max-w-[85%] rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
        <div className="mb-2 flex items-center gap-2">
          <Lock className="h-4 w-4 text-amber-600" />
          <span className="text-xs font-semibold text-amber-700">Chat Limit Reached</span>
        </div>
        <p className="mb-3 text-sm leading-relaxed text-amber-800">{message.content}</p>
        <a
          href="/profile?tab=billing"
          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-700"
        >
          <Zap className="h-3 w-3" />
          Upgrade Plan
        </a>
      </div>
    </motion.div>
  );
}

function ChatBubble({ message, isBriefing, onConfirm, onDeny }: { message: ChatMessage; isBriefing?: boolean; onConfirm?: () => void; onDeny?: () => void }) {
  if (message.isPlanLimit) return <PlanLimitBubble message={message} />;
  const isUser = message.role === 'user';
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${isUser ? 'bg-[#EA7B7B]/10 text-gray-900' : 'bg-white border border-gray-100 text-gray-800'}`}>
        {isBriefing && (
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-[#EA7B7B]" />
            <span className="text-xs font-medium text-gray-400">Daily Briefing</span>
          </div>
        )}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mb-2 space-y-1.5">
            {message.toolCalls.map((tc, i) => (
              <ToolCallIndicator key={`${tc.tool}-${i}`} toolCall={tc} onConfirm={tc.status === 'awaiting_confirmation' ? onConfirm : undefined} onDeny={tc.status === 'awaiting_confirmation' ? onDeny : undefined} />
            ))}
          </div>
        )}
        {message.content && (
          <div className="text-sm leading-relaxed">
            {isUser ? <span className="whitespace-pre-wrap">{message.content}</span> : <MarkdownContent content={message.content} />}
          </div>
        )}
        {message.isStreaming && !message.content && (
          <div className="flex items-center gap-1 py-1">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-gray-400" />
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-gray-400" style={{ animationDelay: '0.2s' }} />
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-gray-400" style={{ animationDelay: '0.4s' }} />
          </div>
        )}
      </div>
    </motion.div>
  );
}

// =============================================================================
// WELCOME STATE
// =============================================================================

const capabilities = [
  { icon: Search, label: 'Search', example: '"Find my AI articles from last week"', color: '#79C9C5' },
  { icon: PenLine, label: 'Create', example: '"Save a note: review Q2 goals"', color: '#FACE68' },
  { icon: BarChart3, label: 'Insights', example: '"How many tasks do I have?"', color: '#93DA97' },
  { icon: Bell, label: 'Reminders', example: '"What\'s coming up this week?"', color: '#EA7B7B' },
];

const quickActions = [
  'Give me my daily briefing',
  'Show me my urgent tasks',
  'What ideas did I save recently?',
  'Save a note: check quarterly report',
];

function WelcomeState({ onSuggest }: { onSuggest: (text: string) => void }) {
  return (
    <div className="flex flex-1 flex-col px-2">
      <div className="mb-5 text-center pt-2">
        <motion.div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#EA7B7B] to-[#D66B6B] shadow-lg shadow-[#EA7B7B]/20" initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', damping: 12, delay: 0.1 }}>
          <Sparkles className="h-7 w-7 text-white" />
        </motion.div>
        <motion.h3 className="text-base font-bold text-gray-900" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>Your AI Assistant</motion.h3>
        <motion.p className="mt-1 text-xs text-gray-400" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>I can search, create, manage, and remind</motion.p>
      </div>
      <motion.div className="grid grid-cols-2 gap-2 mb-5" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.08, delayChildren: 0.3 } } }}>
        {capabilities.map((cap) => {
          const Icon = cap.icon;
          return (
            <motion.div key={cap.label} variants={{ hidden: { opacity: 0, y: 12, scale: 0.95 }, visible: { opacity: 1, y: 0, scale: 1 } }} className="group relative overflow-hidden rounded-xl bg-white p-3 ring-1 ring-gray-100 transition-all duration-200 hover:shadow-md hover:ring-gray-200">
              <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ backgroundColor: cap.color }} />
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${cap.color}15` }}>
                <Icon className="h-4 w-4" style={{ color: cap.color }} />
              </div>
              <div className="text-xs font-semibold text-gray-800 mb-0.5">{cap.label}</div>
              <div className="text-[10px] leading-snug text-gray-400">{cap.example}</div>
            </motion.div>
          );
        })}
      </motion.div>
      <motion.div className="flex items-center gap-3 mb-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
        <div className="h-px flex-1 bg-gray-100" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-300">Try asking</span>
        <div className="h-px flex-1 bg-gray-100" />
      </motion.div>
      <motion.div className="space-y-1.5" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.06, delayChildren: 0.65 } } }}>
        {quickActions.map((suggestion) => (
          <motion.button key={suggestion} variants={{ hidden: { opacity: 0, x: -12 }, visible: { opacity: 1, x: 0 } }} onClick={() => onSuggest(suggestion)} className="group flex w-full items-center gap-2.5 rounded-xl bg-white px-3 py-2.5 text-left ring-1 ring-gray-100 transition-all duration-200 hover:bg-[#EA7B7B]/5 hover:ring-[#EA7B7B]/25 hover:shadow-sm">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gray-50 transition-colors group-hover:bg-[#EA7B7B]/10">
              <ArrowRight className="h-3 w-3 text-gray-300 transition-colors group-hover:text-[#EA7B7B]" />
            </div>
            <span className="text-xs text-gray-500 transition-colors group-hover:text-gray-700">{suggestion}</span>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}

// =============================================================================
// CHAT INPUT
// =============================================================================

function ChatInputArea({ onSend, disabled, pendingConfirmation, chatLimitReached }: { onSend: (message: string) => void; disabled: boolean; pendingConfirmation: boolean; chatLimitReached?: boolean }) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    if (!value.trim() || disabled || pendingConfirmation || chatLimitReached) return;
    onSend(value.trim());
    setValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [value, disabled, pendingConfirmation, chatLimitReached, onSend]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [value]);

  if (chatLimitReached) {
    return (
      <div className="border-t border-amber-200 bg-amber-50 px-4 py-3">
        <div className="flex items-center gap-2 text-amber-700">
          <Lock className="h-4 w-4 shrink-0" />
          <p className="flex-1 text-xs">Monthly chat limit reached.</p>
          <a href="/profile?tab=billing" className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-700">
            <Zap className="h-3 w-3" />
            Upgrade
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2 border-t border-gray-100 bg-white px-4 py-3">
      <textarea ref={textareaRef} id="mindstash-chat-input" value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={handleKeyDown} placeholder={pendingConfirmation ? 'Confirm or cancel the action above...' : 'Ask anything...'} disabled={disabled || pendingConfirmation} rows={1} className="flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-[#EA7B7B]/40 focus:bg-white disabled:opacity-50" />
      <button onClick={handleSend} disabled={disabled || pendingConfirmation || !value.trim()} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EA7B7B] text-white transition-all hover:bg-[#d66b6b] disabled:opacity-40 disabled:hover:bg-[#EA7B7B]">
        {disabled ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
      </button>
    </div>
  );
}

// =============================================================================
// SESSION LIST
// =============================================================================

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function SessionList({ currentSessionId, onSelect, onDelete, onBack }: { currentSessionId?: string; onSelect: (id: string) => void; onDelete: (id: string) => void; onBack: () => void }) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const { data, isLoading } = useQuery({ queryKey: ['chat-sessions'], queryFn: () => chatApi.getSessions(50) });
  const sessions = data?.sessions ?? [];

  if (isLoading) return <div className="flex flex-1 flex-col items-center justify-center"><Loader2 className="mb-3 h-6 w-6 animate-spin text-gray-400" /><p className="text-sm text-gray-500">Loading sessions...</p></div>;
  if (sessions.length === 0) return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <MessageCircle className="mb-3 h-10 w-10 text-gray-200" />
      <p className="text-sm font-medium text-gray-500">No conversations yet</p>
      <p className="mt-1 text-xs text-gray-400">Start chatting to see your history here</p>
      <button onClick={onBack} className="mt-4 rounded-xl bg-[#EA7B7B] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#d66b6b]">Start a chat</button>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
      {sessions.map((session) => {
        const isCurrent = session.id === currentSessionId;
        const isConfirming = confirmDeleteId === session.id;
        return (
          <motion.div key={session.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className={`group relative rounded-xl border px-3 py-2.5 transition-all ${isCurrent ? 'border-[#EA7B7B]/30 bg-[#EA7B7B]/5' : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'}`}>
            {isConfirming ? (
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-gray-600">Delete this chat?</span>
                <div className="flex gap-1.5">
                  <button onClick={() => { onDelete(session.id); setConfirmDeleteId(null); }} className="rounded-lg bg-red-500 px-2.5 py-1 text-[11px] font-medium text-white transition-colors hover:bg-red-600">Delete</button>
                  <button onClick={() => setConfirmDeleteId(null)} className="rounded-lg bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-600 transition-colors hover:bg-gray-200">Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={() => onSelect(session.id)} className="flex w-full items-start justify-between gap-2 text-left">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-800">{session.title || 'Untitled chat'}</p>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-gray-400">
                    <span>{formatRelativeDate(session.last_active_at)}</span>
                    <span>&middot;</span>
                    <span>{session.message_count} msg{session.message_count !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(session.id); }} className="shrink-0 rounded-lg p-1.5 text-gray-300 opacity-100 sm:opacity-0 transition-all hover:bg-red-50 hover:text-red-400 sm:group-hover:opacity-100" title="Delete session">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </button>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

// =============================================================================
// CHAT SIDEBAR (Desktop — always visible inline)
// =============================================================================

export function ChatSidebar({ onClose }: { onClose?: () => void } = {}) {
  const {
    messages,
    isStreaming,
    isLoadingHistory,
    pendingConfirmation,
    sendMessage,
    confirmAction,
    startNewSession,
    switchSession,
    deleteSessionById,
    sessionId,
  } = useChatContext();

  const { data: billingStatus } = useBillingStatus();
  const chatLimitReached = billingStatus?.usage
    ? billingStatus.usage.chat_messages_limit !== null &&
      billingStatus.usage.chat_messages_this_month >= billingStatus.usage.chat_messages_limit
    : false;

  const [view, setView] = useState<'chat' | 'sessions'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const visibleMessages = messages.filter(
    (msg) => !(msg.role === 'user' && msg.content === BRIEFING_TRIGGER)
  );

  const briefingResponseIds = new Set<string>();
  for (let i = 0; i < messages.length; i++) {
    if (messages[i].role === 'user' && messages[i].content === BRIEFING_TRIGGER && i + 1 < messages.length && messages[i + 1].role === 'assistant') {
      briefingResponseIds.add(messages[i + 1].id);
    }
  }

  const handleConfirm = useCallback(() => confirmAction(true), [confirmAction]);
  const handleDeny = useCallback(() => confirmAction(false), [confirmAction]);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          {view === 'sessions' ? (
            <>
              <button onClick={() => setView('chat')} className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-semibold text-gray-900">Chat History</span>
            </>
          ) : (
            <>
              <button onClick={() => setView('sessions')} disabled={isStreaming} className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-40" title="Chat history">
                <History className="h-4 w-4" />
              </button>
              <span className="text-sm font-semibold text-gray-900">MindStash AI</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => { startNewSession(); setView('chat'); }} className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600" title="New chat">
            <Plus className="h-4 w-4" />
          </button>
          {onClose && (
            <button onClick={onClose} className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-400" title="Close chat">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {view === 'sessions' ? (
        <SessionList currentSessionId={sessionId} onSelect={(id) => { switchSession(id); setView('chat'); }} onDelete={deleteSessionById} onBack={() => setView('chat')} />
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {isLoadingHistory ? (
              <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                <Loader2 className="mb-3 h-6 w-6 animate-spin text-gray-400" />
                <p className="text-sm text-gray-500">Loading conversation...</p>
              </div>
            ) : visibleMessages.length === 0 ? (
              <WelcomeState onSuggest={sendMessage} />
            ) : (
              <div className="space-y-3">
                {visibleMessages.map((msg) => (
                  <ChatBubble
                    key={msg.id}
                    message={msg}
                    isBriefing={briefingResponseIds.has(msg.id)}
                    onConfirm={pendingConfirmation?.assistantMsgId === msg.id ? handleConfirm : undefined}
                    onDeny={pendingConfirmation?.assistantMsgId === msg.id ? handleDeny : undefined}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
          <ChatInputArea onSend={sendMessage} disabled={isStreaming} pendingConfirmation={!!pendingConfirmation} chatLimitReached={chatLimitReached} />
        </>
      )}
    </div>
  );
}
