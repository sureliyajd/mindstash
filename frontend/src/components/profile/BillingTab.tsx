'use client';

import { useState, Suspense, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import {
  Check,
  Crown,
  Star,
  Zap,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CreditCard,
  X,
} from 'lucide-react';
import {
  useBillingStatus,
  useUpgrade,
  useOpenPortal,
  useCancelSubscription,
  useSyncSubscription,
} from '@/lib/hooks/useBilling';
import { PLAN_PRICING, PLAN_FREE, PLAN_STARTER, PLAN_PRO } from '@/lib/api';

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

// =============================================================================
// PLAN META
// =============================================================================

const PLAN_META: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  free: { icon: Zap, color: '#79C9C5', label: 'Free' },
  starter: { icon: Star, color: '#EA7B7B', label: 'Starter' },
  pro: { icon: Crown, color: '#FACE68', label: 'Pro' },
};

// =============================================================================
// USAGE BAR
// =============================================================================

function UsageBar({
  current,
  limit,
  label,
  color = '#EA7B7B',
}: {
  current: number;
  limit: number | null;
  label: string;
  color?: string;
}) {
  const pct = limit ? Math.min((current / limit) * 100, 100) : 0;
  const nearLimit = limit && pct >= 80;

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-2">
        <span className="font-medium text-gray-700">{label}</span>
        <span
          className={`font-semibold tabular-nums ${nearLimit ? 'text-[#FF8364]' : 'text-gray-500'}`}
        >
          {current} / {limit === null ? '\u221E' : limit}
        </span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        {limit !== null ? (
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              backgroundColor: nearLimit ? '#FF8364' : color,
            }}
          />
        ) : (
          <div
            className="h-full rounded-full w-full opacity-30"
            style={{ backgroundColor: color }}
          />
        )}
      </div>
      {nearLimit && (
        <p className="mt-1.5 text-xs text-[#FF8364]">
          Almost at your limit — consider upgrading.
        </p>
      )}
    </div>
  );
}

// =============================================================================
// PLAN COMPARISON TABLE
// =============================================================================

function PlanComparison({ currentPlan }: { currentPlan: string }) {
  const [open, setOpen] = useState(false);

  const rows = [
    { feature: 'Items per month', free: '30', starter: '200', pro: 'Unlimited' },
    { feature: 'AI chat messages', free: '10', starter: '100', pro: 'Unlimited' },
    { feature: 'Semantic search', free: false, starter: false, pro: true },
    { feature: 'Telegram bot', free: false, starter: true, pro: true },
    { feature: 'Daily AI briefing', free: false, starter: false, pro: true },
    { feature: 'Weekly digest', free: false, starter: true, pro: true },
  ];

  const cols = ['free', 'starter', 'pro'];

  return (
    <div className="rounded-2xl bg-white ring-1 ring-gray-100 overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-6 py-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <span>Compare plans</span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>

      {open && (
        <div className="border-t border-gray-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400 w-1/2">
                  Feature
                </th>
                {cols.map((p) => (
                  <th
                    key={p}
                    className={`px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider ${
                      p === currentPlan ? 'text-[#EA7B7B]' : 'text-gray-400'
                    }`}
                  >
                    {p === currentPlan
                      ? `${PLAN_META[p].label} \u2190 you`
                      : PLAN_META[p].label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((r) => (
                <tr key={r.feature} className="hover:bg-gray-50/50">
                  <td className="px-6 py-3.5 text-gray-600">{r.feature}</td>
                  {cols.map((p) => {
                    const val = r[p as keyof typeof r];
                    return (
                      <td key={p} className="px-4 py-3.5 text-center">
                        {typeof val === 'boolean' ? (
                          val ? (
                            <Check className="h-4 w-4 text-[#93DA97] mx-auto" />
                          ) : (
                            <X className="h-4 w-4 text-gray-300 mx-auto" />
                          )
                        ) : (
                          <span className="font-medium text-gray-700">{val}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// BILLING CONTENT (inner, uses useSearchParams)
// =============================================================================

function BillingContentInner() {
  const searchParams = useSearchParams();
  const success = searchParams.get('success');
  const canceled = searchParams.get('canceled');

  const { data: status, isLoading, error } = useBillingStatus();
  const upgrade = useUpgrade();
  const portal = useOpenPortal();
  const cancelSub = useCancelSubscription();
  const syncSub = useSyncSubscription();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (!success) return;
    setIsSyncing(true);
    syncSub.mutate(undefined, {
      onSettled: () => setIsSyncing(false),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading || isSyncing) {
    return (
      <div className="space-y-4">
        {isSyncing && (
          <div className="flex items-center gap-3 rounded-2xl bg-[#79C9C5]/10 ring-1 ring-[#79C9C5]/30 px-5 py-4">
            <div className="h-4 w-4 rounded-full border-2 border-[#79C9C5] border-t-transparent animate-spin shrink-0" />
            <p className="text-sm font-medium text-[#2A6A6A]">Activating your subscription...</p>
          </div>
        )}
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 rounded-2xl bg-white ring-1 ring-gray-100 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className="rounded-2xl bg-white ring-1 ring-gray-100 p-8 text-center shadow-sm">
        <AlertCircle className="h-8 w-8 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500">Could not load billing information.</p>
      </div>
    );
  }

  const plan = status.plan;
  const meta = PLAN_META[plan] ?? PLAN_META.free;
  const PlanIcon = meta.icon;
  const noPayments = !status.payments_configured;
  const isPaid = plan === PLAN_STARTER || plan === PLAN_PRO;

  return (
    <motion.div variants={container} initial="hidden" animate="visible" className="space-y-6">
      {/* Success / canceled banners */}
      {success && (
        <motion.div
          variants={fadeUp}
          className="flex items-center gap-3 rounded-2xl bg-[#93DA97]/15 ring-1 ring-[#93DA97]/40 px-5 py-4"
        >
          <Check className="h-5 w-5 text-[#3A8A3E] shrink-0" />
          <p className="text-sm font-medium text-[#2A6A2E]">
            Subscription activated — your plan has been upgraded.
          </p>
        </motion.div>
      )}
      {canceled && (
        <motion.div
          variants={fadeUp}
          className="flex items-center gap-3 rounded-2xl bg-[#FACE68]/15 ring-1 ring-[#FACE68]/40 px-5 py-4"
        >
          <AlertCircle className="h-5 w-5 text-[#A07800] shrink-0" />
          <p className="text-sm font-medium text-[#7A5800]">
            Checkout canceled — no changes were made.
          </p>
        </motion.div>
      )}

      {noPayments && (
        <motion.div
          variants={fadeUp}
          className="flex items-start gap-3 rounded-2xl bg-gray-50 ring-1 ring-gray-200 px-5 py-4"
        >
          <AlertCircle className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
          <p className="text-sm text-gray-500">
            Payments are not configured yet. You can still use MindStash for free.
          </p>
        </motion.div>
      )}

      {/* Current Plan */}
      <motion.section variants={fadeUp}>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
          Current Plan
        </h2>
        <div className="rounded-2xl bg-white ring-1 ring-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-2xl"
              style={{ backgroundColor: `${meta.color}20` }}
            >
              <PlanIcon className="h-5 w-5" style={{ color: meta.color }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg font-bold text-gray-900">{meta.label}</span>
                {status.subscription_status && (
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize"
                    style={
                      status.subscription_status === 'active'
                        ? { background: 'rgba(147,218,151,0.2)', color: '#2A6A2E' }
                        : { background: 'rgba(250,206,104,0.2)', color: '#7A5800' }
                    }
                  >
                    {status.subscription_status}
                  </span>
                )}
              </div>
              {plan === PLAN_FREE && (
                <p className="text-xs text-gray-400 mt-0.5">Free forever</p>
              )}
            </div>
          </div>

          {status.subscription_canceled_at && status.plan_expires_at && (
            <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-[#FACE68]/10 ring-1 ring-[#FACE68]/30 px-4 py-3">
              <AlertCircle className="h-4 w-4 text-[#A07800] shrink-0 mt-0.5" />
              <p className="text-sm text-[#7A5800]">
                Your subscription is canceled. Access continues until{' '}
                <strong>
                  {new Date(status.plan_expires_at).toLocaleDateString(undefined, {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </strong>
                .
              </p>
            </div>
          )}
        </div>
      </motion.section>

      {/* Usage this month */}
      <motion.section variants={fadeUp}>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
          Usage this month
        </h2>
        <div className="rounded-2xl bg-white ring-1 ring-gray-100 p-6 shadow-sm space-y-5">
          <UsageBar
            current={status.usage.items_this_month}
            limit={status.usage.items_limit}
            label="Items captured"
            color={meta.color}
          />
          <div className="border-t border-gray-50" />
          <UsageBar
            current={status.usage.chat_messages_this_month}
            limit={status.usage.chat_messages_limit}
            label="AI chat messages"
            color={meta.color}
          />
        </div>
      </motion.section>

      {/* Upgrade / Manage */}
      {!noPayments && (
        <motion.section variants={fadeUp}>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
            {isPaid ? 'Manage subscription' : 'Upgrade'}
          </h2>
          <div className="rounded-2xl bg-white ring-1 ring-gray-100 p-6 shadow-sm space-y-3">
            {plan === PLAN_FREE && (
              <>
                <button
                  onClick={() => upgrade.mutate(status.variant_ids?.starter_monthly ?? '')}
                  disabled={upgrade.isPending || !status.variant_ids?.starter_monthly}
                  className="group w-full flex items-center justify-between rounded-xl bg-[#EA7B7B]/10 hover:bg-[#EA7B7B]/20 disabled:opacity-50 px-5 py-4 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EA7B7B]/20">
                      <Star className="h-4 w-4 text-[#EA7B7B]" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">Upgrade to Starter</p>
                      <p className="text-xs text-gray-500">
                        ${PLAN_PRICING.starter.monthly_cents / 100}/mo - 200 items, Telegram,
                        digest
                      </p>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-[#EA7B7B] transition-colors" />
                </button>

                <button
                  onClick={() => upgrade.mutate(status.variant_ids?.pro_monthly ?? '')}
                  disabled={upgrade.isPending || !status.variant_ids?.pro_monthly}
                  className="group w-full flex items-center justify-between rounded-xl bg-[#FACE68]/10 hover:bg-[#FACE68]/20 disabled:opacity-50 px-5 py-4 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FACE68]/20">
                      <Crown className="h-4 w-4 text-[#A07800]" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">Upgrade to Pro</p>
                      <p className="text-xs text-gray-500">
                        ${PLAN_PRICING.pro.monthly_cents / 100}/mo - Unlimited, semantic search,
                        briefing
                      </p>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-[#FACE68] transition-colors" />
                </button>
              </>
            )}

            {plan === PLAN_STARTER && (
              <button
                onClick={() => upgrade.mutate(status.variant_ids?.pro_monthly ?? '')}
                disabled={upgrade.isPending || !status.variant_ids?.pro_monthly}
                className="group w-full flex items-center justify-between rounded-xl bg-[#FACE68]/10 hover:bg-[#FACE68]/20 disabled:opacity-50 px-5 py-4 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FACE68]/20">
                    <Crown className="h-4 w-4 text-[#A07800]" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Upgrade to Pro</p>
                    <p className="text-xs text-gray-500">
                      Unlimited items, semantic search, daily briefing
                    </p>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-[#FACE68] transition-colors" />
              </button>
            )}

            {isPaid && !status.subscription_canceled_at && (
              <button
                onClick={() => portal.mutate()}
                disabled={portal.isPending}
                className="group w-full flex items-center justify-between rounded-xl bg-gray-50 hover:bg-gray-100 disabled:opacity-50 px-5 py-4 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-200">
                    <CreditCard className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Manage subscription</p>
                    <p className="text-xs text-gray-500">
                      Update payment, change plan, view invoices
                    </p>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </button>
            )}
          </div>
        </motion.section>
      )}

      {/* Invoices */}
      {!noPayments && isPaid && (
        <motion.section variants={fadeUp}>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
            Invoices
          </h2>
          <div className="rounded-2xl bg-white ring-1 ring-gray-100 p-6 shadow-sm">
            <button
              onClick={() => portal.mutate()}
              disabled={portal.isPending}
              className="flex items-center gap-2 text-sm font-medium text-[#EA7B7B] hover:text-[#D66B6B] transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              View invoices &amp; download PDFs
            </button>
            <p className="mt-1 text-xs text-gray-400">Opens Lemon Squeezy Customer Portal</p>
          </div>
        </motion.section>
      )}

      {/* Plan Comparison */}
      <motion.section variants={fadeUp}>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
          Plan Details
        </h2>
        <PlanComparison currentPlan={plan} />
      </motion.section>

      {/* Cancel */}
      {!noPayments && isPaid && !status.subscription_canceled_at && (
        <motion.section variants={fadeUp}>
          <div className="rounded-2xl bg-white ring-1 ring-gray-100 p-6 shadow-sm">
            {!showCancelConfirm ? (
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="text-sm font-medium text-gray-400 hover:text-red-500 transition-colors"
              >
                Cancel subscription
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Are you sure? You&apos;ll keep access until the end of your billing period.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      cancelSub.mutate(undefined, {
                        onSuccess: () => setShowCancelConfirm(false),
                      })
                    }
                    disabled={cancelSub.isPending}
                    className="rounded-xl bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-600 text-sm font-semibold px-4 py-2 transition-colors"
                  >
                    {cancelSub.isPending ? 'Canceling...' : 'Yes, cancel'}
                  </button>
                  <button
                    onClick={() => setShowCancelConfirm(false)}
                    className="text-sm font-medium text-gray-400 hover:text-gray-600 px-2 transition-colors"
                  >
                    Keep subscription
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.section>
      )}
    </motion.div>
  );
}

// =============================================================================
// EXPORTED TAB (wraps with Suspense for useSearchParams)
// =============================================================================

export function BillingTab() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-white ring-1 ring-gray-100 animate-pulse" />
          ))}
        </div>
      }
    >
      <BillingContentInner />
    </Suspense>
  );
}
