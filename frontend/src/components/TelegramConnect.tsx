'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Copy, Check, Unlink, Loader2, X, ExternalLink } from 'lucide-react';
import { useTelegram } from '@/lib/hooks/useTelegram';

interface TelegramConnectProps {
  isOpen: boolean;
  onClose: () => void;
  inline?: boolean;
}

export function TelegramConnect({ isOpen, onClose, inline = false }: TelegramConnectProps) {
  const {
    status,
    isLoading,
    linkCode,
    generateLink,
    isGenerating,
    unlink,
    isUnlinking,
    clearCode,
  } = useTelegram();

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!linkCode) return;
    const text = `/start ${linkCode.code}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    clearCode();
    onClose();
  };

  if (!inline && !isOpen) return null;

  const isLinked = status?.linked;

  const content = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EA7B7B]/10">
            <MessageCircle className="h-5 w-5 text-[#EA7B7B]" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Telegram Integration</h2>
        </div>
        {!inline && (
          <button
            onClick={handleClose}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : isLinked ? (
          /* State C: Linked */
          <LinkedState
            telegramUsername={status?.telegram_username}
            linkedAt={status?.linked_at}
            onUnlink={() => unlink()}
            isUnlinking={isUnlinking}
          />
        ) : linkCode ? (
          /* State B: Code generated */
          <CodeState
            code={linkCode.code}
            botUsername={linkCode.bot_username}
            expiresInMinutes={linkCode.expires_in_minutes}
            copied={copied}
            onCopy={handleCopy}
          />
        ) : (
          /* State A: Not linked */
          <ConnectState
            onConnect={() => generateLink()}
            isGenerating={isGenerating}
          />
        )}
      </div>
    </>
  );

  if (inline) {
    return <div>{content}</div>;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {content}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ─── State A: Not linked ─── */

function ConnectState({
  onConnect,
  isGenerating,
}: {
  onConnect: () => void;
  isGenerating: boolean;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-50">
        <svg viewBox="0 0 24 24" className="h-8 w-8 text-sky-500" fill="currentColor">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
      </div>
      <h3 className="mb-2 text-lg font-semibold text-gray-900">Connect Telegram</h3>
      <p className="mb-6 text-sm text-gray-500">
        Send thoughts to MindStash directly from Telegram. Just message the bot and your thoughts are saved instantly.
      </p>
      <button
        onClick={onConnect}
        disabled={isGenerating}
        className="inline-flex items-center gap-2 rounded-xl bg-[#EA7B7B] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#e06a6a] disabled:opacity-50"
      >
        {isGenerating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MessageCircle className="h-4 w-4" />
        )}
        Connect Telegram
      </button>
    </div>
  );
}

/* ─── State B: Code generated ─── */

function CodeState({
  code,
  botUsername,
  expiresInMinutes,
  copied,
  onCopy,
}: {
  code: string;
  botUsername: string;
  expiresInMinutes: number;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div>
      <div className="mb-4 rounded-xl bg-gray-50 p-4">
        <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-400">
          Step 1
        </p>
        <p className="text-sm text-gray-700">
          Open{' '}
          <a
            href={`https://t.me/${botUsername}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-[#EA7B7B] hover:underline"
          >
            @{botUsername}
            <ExternalLink className="h-3 w-3" />
          </a>{' '}
          on Telegram
        </p>
      </div>

      <div className="mb-4 rounded-xl bg-gray-50 p-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">
          Step 2 — Send this message
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded-lg bg-white px-4 py-3 font-mono text-base font-semibold text-gray-900 ring-1 ring-gray-200">
            /start {code}
          </code>
          <button
            onClick={onCopy}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white ring-1 ring-gray-200 transition-colors hover:bg-gray-50"
            title="Copy to clipboard"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4 text-gray-500" />
            )}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Waiting for connection... Code expires in {expiresInMinutes} min</span>
      </div>
    </div>
  );
}

/* ─── State C: Linked ─── */

function LinkedState({
  telegramUsername,
  linkedAt,
  onUnlink,
  isUnlinking,
}: {
  telegramUsername?: string;
  linkedAt?: string;
  onUnlink: () => void;
  isUnlinking: boolean;
}) {
  const formattedDate = linkedAt
    ? new Date(linkedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <div>
      <div className="mb-6 flex items-center gap-4 rounded-xl bg-green-50 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100">
          <Check className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <p className="font-medium text-green-900">Connected</p>
          <p className="text-sm text-green-700">
            {telegramUsername ? `@${telegramUsername}` : 'Telegram account linked'}
            {formattedDate && ` since ${formattedDate}`}
          </p>
        </div>
      </div>

      <p className="mb-6 text-sm text-gray-500">
        You can send messages to the bot anytime and they&apos;ll appear in your MindStash.
      </p>

      <button
        onClick={onUnlink}
        disabled={isUnlinking}
        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-red-50 hover:border-red-200 hover:text-red-600 disabled:opacity-50"
      >
        {isUnlinking ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Unlink className="h-4 w-4" />
        )}
        Disconnect Telegram
      </button>
    </div>
  );
}
