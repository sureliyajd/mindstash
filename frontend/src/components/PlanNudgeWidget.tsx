'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Zap, Star, Crown, ArrowRight, X, Lock, Sparkles, TrendingUp } from 'lucide-react';
import { useBillingStatus } from '@/lib/hooks/useBilling';

// =============================================================================
// DISMISS HELPERS — per-state cooldowns via localStorage
// =============================================================================

const DISMISS_KEY_UPSELL = 'ms_plan_upsell_dismissed_at';
const DISMISS_KEY_STARTER = 'ms_starter_upsell_dismissed_at';
const UPSELL_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function isDismissed(key: string): boolean {
  if (typeof window === 'undefined') return true;
  const raw = localStorage.getItem(key);
  if (!raw) return false;
  return Date.now() - Number(raw) < UPSELL_COOLDOWN_MS;
}

function dismiss(key: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, String(Date.now()));
  }
}

// =============================================================================
// USAGE BAR
// =============================================================================

function MiniUsageBar({
  current,
  limit,
  color,
}: {
  current: number;
  limit: number | null;
  color: string;
}) {
  if (limit === null) return null;
  const pct = Math.min((current / limit) * 100, 100);
  const isWarn = pct >= 60 && pct < 80;
  const isDanger = pct >= 80;
  const barColor = isDanger ? '#FF8364' : isWarn ? '#FACE68' : color;

  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </div>
      <span
        className="text-xs tabular-nums font-medium shrink-0"
        style={{ color: isDanger ? '#FF8364' : isWarn ? '#B8860B' : '#9CA3AF' }}
      >
        {current}/{limit}
      </span>
    </div>
  );
}

// =============================================================================
// FREE PLAN WIDGET
// =============================================================================

function FreePlanWidget({
  itemsCurrent,
  itemsLimit,
  chatCurrent,
  chatLimit,
}: {
  itemsCurrent: number;
  itemsLimit: number;
  chatCurrent: number;
  chatLimit: number;
}) {
  const [showUpsell, setShowUpsell] = useState(() => !isDismissed(DISMISS_KEY_UPSELL));

  const itemPct = (itemsCurrent / itemsLimit) * 100;
  const chatPct = (chatCurrent / chatLimit) * 100;
  const maxPct = Math.max(itemPct, chatPct);
  const isAtLimit = itemsCurrent >= itemsLimit || chatCurrent >= chatLimit;
  const isUrgent = maxPct >= 80;
  const isWarning = maxPct >= 60 && !isUrgent;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl bg-white ring-1 ring-gray-100 shadow-sm overflow-hidden"
    >
      {/* Urgency banner — only when >= 80% */}
      {isUrgent && (
        <div
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium"
          style={{
            backgroundColor: isAtLimit ? '#FFF0ED' : '#FFF8ED',
            color: isAtLimit ? '#C04020' : '#A07800',
            borderBottom: `1px solid ${isAtLimit ? '#FFDDCC' : '#FFECC0'}`,
          }}
        >
          <span className="text-base">{isAtLimit ? '🚫' : '⚠️'}</span>
          {isAtLimit
            ? "You've hit your monthly limit. Upgrade to keep capturing."
            : `You're ${Math.round(maxPct)}% through your monthly limit.`}
          <Link
            href="/billing"
            className="ml-auto shrink-0 text-xs font-semibold underline underline-offset-2 hover:opacity-80"
            style={{ color: isAtLimit ? '#C04020' : '#A07800' }}
          >
            Upgrade now
          </Link>
        </div>
      )}

      {/* Main card body */}
      <div className="px-4 py-3.5 space-y-2.5">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#79C9C5]/15">
              <Zap className="h-3.5 w-3.5 text-[#59A9A5]" />
            </div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Free plan</span>
          </div>
          <Link
            href="/pricing"
            className="text-xs font-semibold text-[#EA7B7B] hover:text-[#D66B6B] flex items-center gap-1 transition-colors"
          >
            See all plans <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Usage bars */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-20 shrink-0">Items</span>
            <MiniUsageBar current={itemsCurrent} limit={itemsLimit} color="#79C9C5" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-20 shrink-0">AI chat</span>
            <MiniUsageBar current={chatCurrent} limit={chatLimit} color="#79C9C5" />
          </div>
        </div>

        {/* Upsell value prop — dismissible, 7-day cooldown */}
        <AnimatePresence>
          {showUpsell && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="border-t border-gray-50 pt-2.5 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  {/* Benefit pills */}
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { icon: '📬', text: 'Telegram bot', color: '#0088cc' },
                      { icon: '📊', text: 'Weekly digest', color: '#EA7B7B' },
                      { icon: '🔍', text: 'Semantic search', color: '#FACE68' },
                    ].map((b) => (
                      <span
                        key={b.text}
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{ backgroundColor: `${b.color}12`, color: b.color }}
                      >
                        {b.icon} {b.text}
                      </span>
                    ))}
                    <Link
                      href="/billing"
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold text-white transition-all hover:scale-105"
                      style={{ backgroundColor: '#EA7B7B' }}
                    >
                      Upgrade <ArrowRight className="h-2.5 w-2.5" />
                    </Link>
                  </div>
                </div>
                <button
                  onClick={() => { dismiss(DISMISS_KEY_UPSELL); setShowUpsell(false); }}
                  className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors mt-0.5"
                  aria-label="Dismiss"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// =============================================================================
// STARTER PLAN WIDGET
// =============================================================================

function StarterPlanWidget({
  itemsCurrent,
  itemsLimit,
  chatCurrent,
  chatLimit,
}: {
  itemsCurrent: number;
  itemsLimit: number;
  chatCurrent: number;
  chatLimit: number;
}) {
  const [showUpsell, setShowUpsell] = useState(() => !isDismissed(DISMISS_KEY_STARTER));

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl bg-white ring-1 ring-gray-100 shadow-sm px-4 py-3.5 space-y-2.5"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#EA7B7B]/10">
            <Star className="h-3.5 w-3.5 text-[#EA7B7B]" />
          </div>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Starter plan</span>
        </div>
        <Link
          href="/billing"
          className="text-xs font-medium text-gray-400 hover:text-[#EA7B7B] flex items-center gap-1 transition-colors"
        >
          Manage <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Usage bars */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 w-20 shrink-0">Items</span>
          <MiniUsageBar current={itemsCurrent} limit={itemsLimit} color="#EA7B7B" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 w-20 shrink-0">AI chat</span>
          <MiniUsageBar current={chatCurrent} limit={chatLimit} color="#EA7B7B" />
        </div>
      </div>

      {/* Pro upsell — dismissible */}
      <AnimatePresence>
        {showUpsell && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-50 pt-2.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <Lock className="h-3.5 w-3.5 text-[#FACE68] shrink-0" />
                <span className="text-xs text-gray-500">
                  <span className="font-medium text-gray-700">Pro unlocks</span> semantic search · unlimited items · daily AI briefing
                </span>
                <Link
                  href="/billing"
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold shrink-0 transition-all hover:scale-105"
                  style={{ backgroundColor: '#FACE6820', color: '#A07800' }}
                >
                  <Crown className="h-3 w-3" /> Upgrade to Pro
                </Link>
              </div>
              <button
                onClick={() => { dismiss(DISMISS_KEY_STARTER); setShowUpsell(false); }}
                className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors"
                aria-label="Dismiss"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// =============================================================================
// PRO PLAN WIDGET — premium feel, no nudge
// =============================================================================

function ProPlanWidget() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative overflow-hidden rounded-2xl ring-1 ring-[#FACE68]/30 shadow-sm"
      style={{ background: 'linear-gradient(135deg, #FFFDF0 0%, #FFF8E0 100%)' }}
    >
      {/* Decorative corner glow */}
      <div className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full opacity-30 blur-2xl" style={{ backgroundColor: '#FACE68' }} />
      <div className="relative flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl" style={{ backgroundColor: '#FACE6825' }}>
            <Crown className="h-4 w-4" style={{ color: '#A07800' }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-900">Pro plan</span>
              <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ backgroundColor: '#FACE6825', color: '#7A5800' }}>
                Active
              </span>
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              {[
                { icon: Sparkles, label: 'Unlimited captures' },
                { icon: TrendingUp, label: 'Semantic search' },
              ].map(({ icon: Icon, label }) => (
                <span key={label} className="flex items-center gap-1 text-xs text-gray-500">
                  <Icon className="h-3 w-3" style={{ color: '#A07800' }} />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="flex h-5 w-5 items-center justify-center rounded-full text-gray-300 hover:text-gray-500 hover:bg-white/60 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </motion.div>
  );
}

// =============================================================================
// MAIN EXPORT — decides which widget to render
// =============================================================================

export default function PlanNudgeWidget() {
  const { data: status, isLoading } = useBillingStatus();

  // Don't render anything while loading or on error
  if (isLoading || !status) return null;

  const { plan, usage } = status;

  if (plan === 'free') {
    return (
      <FreePlanWidget
        itemsCurrent={usage.items_this_month}
        itemsLimit={usage.items_limit ?? 30}
        chatCurrent={usage.chat_messages_this_month}
        chatLimit={usage.chat_messages_limit ?? 10}
      />
    );
  }

  if (plan === 'starter') {
    return (
      <StarterPlanWidget
        itemsCurrent={usage.items_this_month}
        itemsLimit={usage.items_limit ?? 200}
        chatCurrent={usage.chat_messages_this_month}
        chatLimit={usage.chat_messages_limit ?? 100}
      />
    );
  }

  if (plan === 'pro') {
    return <ProPlanWidget />;
  }

  return null;
}
