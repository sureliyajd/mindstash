'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle } from 'lucide-react';

const MAX_CHARS = 500;

interface CaptureInputProps {
  onSubmit: (content: string, url?: string) => Promise<void>;
  isSubmitting?: boolean;
}

export function CaptureInput({ onSubmit, isSubmitting = false }: CaptureInputProps) {
  const [content, setContent] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const submitTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const hasContent = content.trim().length > 0;
  const charCount = content.length;
  const isOverLimit = charCount > MAX_CHARS;

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [content]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current);
      }
    };
  }, []);

  // Extract URL from content
  const extractUrl = (text: string): string | undefined => {
    const urlMatch = text.match(/(https?:\/\/[^\s]+)/);
    return urlMatch ? urlMatch[0] : undefined;
  };

  const handleSubmit = useCallback(async () => {
    const trimmed = content.trim();

    // Validation
    if (!trimmed) return;
    if (isOverLimit) {
      setError('Content exceeds 500 characters');
      return;
    }
    if (isSubmitting) return;

    setError(null);

    try {
      const url = extractUrl(trimmed);
      await onSubmit(trimmed, url);

      // Clear input and show success
      setContent('');
      setShowSuccess(true);

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }

      // Hide success after 2 seconds
      submitTimeoutRef.current = setTimeout(() => {
        setShowSuccess(false);
      }, 2000);
    } catch (err) {
      // Show error briefly
      setError('Failed to save. Please try again.');
      submitTimeoutRef.current = setTimeout(() => {
        setError(null);
      }, 3000);
    }
  }, [content, isOverLimit, isSubmitting, onSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Cmd+Enter or Ctrl+Enter
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Auto-submit on blur if there's content
    if (hasContent && !isSubmitting && !isOverLimit) {
      handleSubmit();
    }
  };

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="relative rounded-2xl border bg-zinc-900/50 backdrop-blur-sm transition-colors duration-200"
        animate={{
          borderColor: error
            ? 'rgba(239, 68, 68, 0.3)'
            : isFocused
              ? 'rgba(99, 102, 241, 0.3)'
              : 'rgba(39, 39, 42, 0.5)',
          boxShadow: isFocused
            ? '0 0 0 4px rgba(99, 102, 241, 0.1), 0 4px 20px rgba(0, 0, 0, 0.3)'
            : '0 4px 20px rgba(0, 0, 0, 0.2)',
        }}
        transition={{ duration: 0.2 }}
      >
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            setError(null); // Clear error on change
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder="Drop anything here — a thought, link, reminder, idea..."
          disabled={isSubmitting}
          rows={3}
          className="w-full resize-none bg-transparent px-5 py-4 text-base text-white placeholder-zinc-500 outline-none disabled:cursor-not-allowed disabled:opacity-50"
          style={{ minHeight: '100px' }}
        />

        {/* Bottom bar */}
        <div className="flex items-center justify-between border-t border-zinc-800/50 px-5 py-3">
          {/* Left side: Hint or error */}
          <div className="flex items-center gap-2">
            {error ? (
              <span className="text-xs text-red-400">{error}</span>
            ) : showSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1.5 text-emerald-400"
              >
                <CheckCircle className="h-3.5 w-3.5" />
                <span className="text-xs">Saved</span>
              </motion.div>
            ) : (
              <span className="text-xs text-zinc-600">
                {isFocused ? (
                  <>
                    <kbd className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-500">⌘</kbd>
                    <span className="mx-1">+</span>
                    <kbd className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-500">Enter</kbd>
                    <span className="ml-2">to save</span>
                  </>
                ) : (
                  'Click to capture a thought'
                )}
              </span>
            )}
          </div>

          {/* Right side: loader or counter */}
          <div className="flex items-center gap-3">
            <AnimatePresence>
              {isSubmitting && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                </motion.div>
              )}
            </AnimatePresence>
            <span
              className={`text-xs tabular-nums transition-colors ${
                isOverLimit
                  ? 'text-red-400'
                  : charCount > MAX_CHARS * 0.9
                    ? 'text-amber-400'
                    : 'text-zinc-600'
              }`}
            >
              {charCount}/{MAX_CHARS}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Subtle glow effect when focused */}
      <AnimatePresence>
        {isFocused && !error && (
          <motion.div
            className="pointer-events-none absolute -inset-1 -z-10 rounded-2xl bg-indigo-500/5 blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
