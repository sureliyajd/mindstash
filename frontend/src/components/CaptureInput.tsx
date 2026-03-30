'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle, Send, Sparkles, Brain, Mic, X, Check, Lock, Zap } from 'lucide-react';

const MAX_CHARS = 500;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionInstance = any;

interface CaptureInputProps {
  onSubmit: (content: string, url?: string) => Promise<void>;
  isSubmitting?: boolean;
  limitReached?: boolean;
}

// Detect platform for keyboard shortcut display
const getModifierKey = () => {
  if (typeof window === 'undefined') return 'Cmd';
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  return isMac ? 'Cmd' : 'Ctrl';
};

// AI Processing messages that cycle through
const processingMessages = [
  'Understanding your thought...',
  'Analyzing context...',
  'Finding the right category...',
  'Extracting key insights...',
  'Almost there...',
];

// Waveform bar colors gradient from teal to yellow
const barColors = (i: number, total: number) => {
  const t = i / (total - 1);
  const r = Math.round(121 + t * (250 - 121));
  const g = Math.round(201 + t * (206 - 201));
  const b = Math.round(197 + t * (104 - 197));
  return `rgb(${r},${g},${b})`;
};

export function CaptureInput({ onSubmit, isSubmitting = false, limitReached = false }: CaptureInputProps) {
  const [content, setContent] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modifierKey, setModifierKey] = useState('Cmd');
  const [processingMessageIndex, setProcessingMessageIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [charFlash, setCharFlash] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const submitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const processingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const hasContent = content.trim().length > 0;
  const charCount = content.length;
  const isOverLimit = charCount > MAX_CHARS;

  // Set modifier key and check voice support on mount
  useEffect(() => {
    setModifierKey(getModifierKey());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setVoiceSupported(!!(((window as any).SpeechRecognition) || ((window as any).webkitSpeechRecognition)));
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

  // Auto-resize textarea based on content
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const minHeight = 80;
      const maxHeight = 300;
      const newHeight = Math.max(minHeight, Math.min(textarea.scrollHeight, maxHeight));
      textarea.style.height = `${newHeight}px`;
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [content, adjustTextareaHeight]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (submitTimeoutRef.current) clearTimeout(submitTimeoutRef.current);
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, []);

  // Extract URL from content
  const extractUrl = (text: string): string | undefined => {
    const urlMatch = text.match(/(https?:\/\/[^\s]+)/);
    return urlMatch ? urlMatch[0] : undefined;
  };

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const finalTextRef = useRef('');

  const createRecognition = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return null;

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTextRef.current += transcript + ' ';
        } else {
          interim = transcript;
        }
      }
      setVoiceTranscript((finalTextRef.current + interim).trimStart());
    };

    recognition.onend = () => {
      // Restart with a fresh instance if still recording (mobile ends after each utterance)
      if (recognitionRef.current) {
        const next = createRecognition();
        if (next) {
          recognitionRef.current = next;
          try {
            next.start();
          } catch {
            // ignore
          }
        }
      }
    };

    recognition.onerror = () => {
      stopRecording();
    };

    return recognition;
  }, [stopRecording]);

  const startRecording = useCallback(() => {
    const recognition = createRecognition();
    if (!recognition) return;

    finalTextRef.current = '';
    recognitionRef.current = recognition;
    setVoiceTranscript('');
    setIsRecording(true);
    recognition.start();
  }, [createRecognition]);

  const handleVoiceDone = useCallback(() => {
    const transcript = voiceTranscript.trim();
    stopRecording();

    if (transcript) {
      const separator = content ? ' ' : '';
      const combined = (content + separator + transcript).slice(0, MAX_CHARS);
      if ((content + separator + transcript).length > MAX_CHARS) {
        setCharFlash(true);
        setTimeout(() => setCharFlash(false), 600);
      }
      setContent(combined);
    }
    setVoiceTranscript('');
  }, [voiceTranscript, content, stopRecording]);

  const handleVoiceCancel = useCallback(() => {
    stopRecording();
    setVoiceTranscript('');
  }, [stopRecording]);

  const handleSubmit = useCallback(async () => {
    const trimmed = content.trim();
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

      setContent('');
      setShowSuccess(true);

      if (textareaRef.current) {
        textareaRef.current.style.height = '80px';
      }

      submitTimeoutRef.current = setTimeout(() => {
        setShowSuccess(false);
      }, 2000);
    } catch (err) {
      // Show plan limit message if available, otherwise generic error
      const msg = err instanceof Error && err.message.includes('limit')
        ? err.message
        : 'Failed to save. Please try again.';
      setError(msg);
      submitTimeoutRef.current = setTimeout(() => {
        setError(null);
      }, 5000);
    }
  }, [content, isOverLimit, isSubmitting, onSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const WAVEFORM_BARS = 12;

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className={`relative rounded-2xl border bg-white shadow-sm transition-all duration-200 ${
          error
            ? 'border-red-200 shadow-lg shadow-red-100/50'
            : isSubmitting
              ? 'border-[#EA7B7B]/30 shadow-lg shadow-[#EA7B7B]/10'
              : isRecording
                ? 'border-[#79C9C5]/40 shadow-lg shadow-[#79C9C5]/10'
                : 'border-gray-200'
        }`}
      >
        {/* Textarea */}
        {limitReached ? (
          <div className="flex items-center gap-3 px-4 py-5 sm:px-5">
            <Lock className="h-5 w-5 shrink-0 text-amber-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">Monthly capture limit reached</p>
              <p className="text-xs text-gray-400">Upgrade your plan to keep saving thoughts.</p>
            </div>
            <a
              href="/profile?tab=billing"
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
            >
              <Zap className="h-3.5 w-3.5" />
              Upgrade
            </a>
          </div>
        ) : (
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
            placeholder="Drop anything here - a thought, link, reminder, idea..."
            disabled={isSubmitting}
            className="w-full resize-none border-0 bg-transparent px-4 py-4 text-base text-gray-800 placeholder-gray-400 shadow-none outline-none ring-0 focus:border-0 focus:outline-none focus:ring-0 focus:shadow-none focus-visible:!outline-none focus-visible:!ring-0 disabled:cursor-not-allowed disabled:opacity-50 sm:px-5"
            style={{ minHeight: '80px', maxHeight: '300px', overflowY: 'auto' }}
          />
        )}

        {/* AI Processing Indicator */}
        <AnimatePresence>
          {isSubmitting && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden border-t border-[#EA7B7B]/20 bg-[#EA7B7B]/5"
            >
              <div className="flex items-center gap-3 px-5 py-3">
                <div className="relative">
                  <Brain className="h-5 w-5 text-[#EA7B7B]" />
                  <motion.div
                    className="absolute inset-0"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Sparkles className="h-5 w-5 text-[#FF8364]" />
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
                      className="text-sm font-medium text-[#C44545]"
                    >
                      {processingMessages[processingMessageIndex]}
                    </motion.p>
                  </AnimatePresence>
                </div>
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-[#EA7B7B]"
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

        {/* Voice Streaming Panel */}
        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="overflow-hidden border-t border-[#79C9C5]/30 bg-gradient-to-b from-teal-50/80 to-white"
            >
              <div className="px-5 py-4">
                {/* Waveform */}
                <div className="mb-3 flex h-10 items-end justify-center gap-1">
                  {Array.from({ length: WAVEFORM_BARS }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 rounded-full"
                      style={{ backgroundColor: barColors(i, WAVEFORM_BARS) }}
                      animate={{
                        scaleY: voiceTranscript
                          ? [0.2, 0.4 + Math.random() * 0.6, 0.2]
                          : [0.15, 0.3, 0.15],
                      }}
                      transition={{
                        duration: voiceTranscript ? 0.6 + Math.random() * 0.4 : 1.2,
                        repeat: Infinity,
                        delay: i * 0.08,
                        ease: 'easeInOut',
                      }}
                      initial={{ scaleY: 0.2, height: '100%', originY: 1 }}
                    />
                  ))}
                </div>

                {/* Status + Transcript */}
                <div className="mb-3">
                  <div className="mb-1.5 flex items-center gap-2">
                    <motion.div
                      className="h-2 w-2 rounded-full bg-red-500"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                    <span className="text-xs font-medium text-gray-500">Listening...</span>
                  </div>
                  <div className="max-h-20 overflow-y-auto rounded-lg border-l-2 border-[#79C9C5] bg-white/60 px-3 py-2">
                    {voiceTranscript ? (
                      <p className="text-sm italic leading-relaxed text-[#3d9b97]">
                        {voiceTranscript}
                      </p>
                    ) : (
                      <p className="text-sm italic text-gray-400">Speak now...</p>
                    )}
                  </div>
                </div>

                {/* Cancel / Done buttons */}
                <div className="flex items-center justify-between">
                  <motion.button
                    onClick={handleVoiceCancel}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <X className="h-3.5 w-3.5" />
                    Cancel
                  </motion.button>

                  <motion.button
                    onClick={handleVoiceDone}
                    disabled={!voiceTranscript.trim()}
                    className={`flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-sm font-semibold transition-all ${
                      voiceTranscript.trim()
                        ? 'bg-[#79C9C5] text-white shadow-sm shadow-[#79C9C5]/30 hover:bg-[#5eb8b4]'
                        : 'cursor-not-allowed bg-gray-100 text-gray-400'
                    }`}
                    whileHover={voiceTranscript.trim() ? { scale: 1.02 } : {}}
                    whileTap={voiceTranscript.trim() ? { scale: 0.97 } : {}}
                  >
                    <Check className="h-3.5 w-3.5" />
                    Done
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom bar */}
        {!limitReached && <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
          {/* Left side: mic button + hint/error */}
          <div className="flex items-center gap-2">
            {/* Mic button */}
            {voiceSupported && !isSubmitting && (
              <motion.button
                onClick={isRecording ? handleVoiceDone : startRecording}
                className={`rounded-lg p-1.5 transition-all ${
                  isRecording
                    ? 'bg-teal-50 text-[#79C9C5]'
                    : 'text-gray-400 hover:bg-teal-50 hover:text-[#79C9C5]'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title={isRecording ? 'Done recording' : 'Record voice'}
              >
                <Mic className="h-4 w-4" />
              </motion.button>
            )}

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
              <span className="text-xs font-medium text-[#EA7B7B]">AI is thinking...</span>
            ) : (
              <span className="hidden text-xs text-gray-400 sm:block">
                {isFocused ? (
                  <>
                    <kbd className="rounded-md bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-600">
                      {modifierKey}
                    </kbd>
                    <span className="mx-1">+</span>
                    <kbd className="rounded-md bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-600">Enter</kbd>
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
            <motion.span
              className={`font-mono text-xs tabular-nums transition-colors ${
                charFlash
                  ? 'font-semibold text-red-600'
                  : isOverLimit
                    ? 'font-semibold text-red-600'
                    : charCount > MAX_CHARS * 0.9
                      ? 'font-semibold text-amber-600'
                      : 'text-gray-400'
              }`}
              animate={charFlash ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              {charCount}/{MAX_CHARS}
            </motion.span>

            {/* Submit button */}
            <motion.button
              onClick={handleSubmit}
              disabled={isSubmitting || !hasContent || isOverLimit}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                hasContent && !isOverLimit && !isSubmitting
                  ? 'bg-[#EA7B7B] text-white shadow-md shadow-[#EA7B7B]/25 hover:bg-[#D66B6B] hover:shadow-lg hover:shadow-[#EA7B7B]/30'
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
        </div>}
      </motion.div>
    </motion.div>
  );
}
