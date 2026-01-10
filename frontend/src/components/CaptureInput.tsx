'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle, Send, Sparkles, Brain } from 'lucide-react';

const MAX_CHARS = 500;

interface CaptureInputProps {
  onSubmit: (content: string, url?: string) => Promise<void>;
  isSubmitting?: boolean;
}

// Detect platform for keyboard shortcut display
const getModifierKey = () => {
  if (typeof window === 'undefined') return '⌘';
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  return isMac ? '⌘' : 'Ctrl';
};

// AI Processing messages that cycle through
const processingMessages = [
  'Understanding your thought...',
  'Analyzing context...',
  'Finding the right category...',
  'Extracting key insights...',
  'Almost there...',
];

export function CaptureInput({ onSubmit, isSubmitting = false }: CaptureInputProps) {
  const [content, setContent] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modifierKey, setModifierKey] = useState('⌘');
  const [processingMessageIndex, setProcessingMessageIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const submitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const processingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const hasContent = content.trim().length > 0;
  const charCount = content.length;
  const isOverLimit = charCount > MAX_CHARS;

  // Set modifier key on mount (client-side only)
  useEffect(() => {
    setModifierKey(getModifierKey());
  }, []);

  // Cycle through processing messages while submitting
  useEffect(() => {
    if (isSubmitting) {
      setProcessingMessageIndex(0);
      processingIntervalRef.current = setInterval(() => {
        setProcessingMessageIndex((prev) => (prev + 1) % processingMessages.length);
      }, 1500);
    } else {
      if (processingIntervalRef.current) {
        clearInterval(processingIntervalRef.current);
        processingIntervalRef.current = null;
      }
    }

    return () => {
      if (processingIntervalRef.current) {
        clearInterval(processingIntervalRef.current);
      }
    };
  }, [isSubmitting]);

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
        className={`relative rounded-2xl border bg-white transition-all duration-200 ${
          error
            ? 'border-red-300 shadow-lg shadow-red-100'
            : isSubmitting
              ? 'border-indigo-300 shadow-lg shadow-indigo-100'
              : isFocused
                ? 'border-indigo-300 shadow-lg shadow-indigo-50'
                : 'border-gray-200 shadow-sm'
        }`}
      >
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            setError(null);
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder="Drop anything here — a thought, link, reminder, idea..."
          disabled={isSubmitting}
          rows={3}
          className="w-full resize-none bg-transparent px-5 py-4 text-base text-gray-800 placeholder-gray-400 outline-none disabled:cursor-not-allowed disabled:opacity-50"
          style={{ minHeight: '100px' }}
        />

        {/* AI Processing Indicator */}
        <AnimatePresence>
          {isSubmitting && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden border-t border-indigo-100 bg-indigo-50"
            >
              <div className="flex items-center gap-3 px-5 py-3">
                <div className="relative">
                  <Brain className="h-5 w-5 text-indigo-600" />
                  <motion.div
                    className="absolute inset-0"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Sparkles className="h-5 w-5 text-indigo-400" />
                  </motion.div>
                </div>
                <div className="flex-1">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={processingMessageIndex}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.2 }}
                      className="text-sm font-medium text-indigo-700"
                    >
                      {processingMessages[processingMessageIndex]}
                    </motion.p>
                  </AnimatePresence>
                </div>
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-indigo-500"
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        delay: i * 0.15,
                      }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom bar */}
        <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
          {/* Left side: Hint or error */}
          <div className="flex items-center gap-2">
            {error ? (
              <span className="text-xs font-medium text-red-600">{error}</span>
            ) : showSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1.5 text-emerald-600"
              >
                <CheckCircle className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">Saved & organized</span>
              </motion.div>
            ) : isSubmitting ? (
              <span className="text-xs font-medium text-indigo-600">AI is thinking...</span>
            ) : (
              <span className="hidden text-xs text-gray-500 sm:block">
                {isFocused ? (
                  <>
                    <kbd className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-gray-600">
                      {modifierKey}
                    </kbd>
                    <span className="mx-1">+</span>
                    <kbd className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-gray-600">Enter</kbd>
                    <span className="ml-2">to save</span>
                  </>
                ) : (
                  'Click to capture a thought'
                )}
              </span>
            )}
          </div>

          {/* Right side: counter + submit button */}
          <div className="flex items-center gap-3">
            {/* Character counter */}
            <span
              className={`text-xs tabular-nums transition-colors ${
                isOverLimit
                  ? 'font-medium text-red-600'
                  : charCount > MAX_CHARS * 0.9
                    ? 'font-medium text-amber-600'
                    : 'text-gray-400'
              }`}
            >
              {charCount}/{MAX_CHARS}
            </span>

            {/* Submit button */}
            <motion.button
              onClick={handleSubmit}
              disabled={isSubmitting || !hasContent || isOverLimit}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                hasContent && !isOverLimit && !isSubmitting
                  ? 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 hover:shadow'
                  : 'cursor-not-allowed bg-gray-100 text-gray-400'
              }`}
              whileHover={hasContent && !isOverLimit && !isSubmitting ? { scale: 1.02 } : {}}
              whileTap={hasContent && !isOverLimit && !isSubmitting ? { scale: 0.98 } : {}}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Save</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
