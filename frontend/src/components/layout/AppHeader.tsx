'use client';

import Link from 'next/link';
import { Zap, Star, Crown, ArrowRight } from 'lucide-react';
import { useBillingStatus } from '@/lib/hooks/useBilling';

// =============================================================================
// COMPACT PLAN BADGE (for mobile header)
// =============================================================================

function CompactPlanBadge() {
  const { data: status } = useBillingStatus();
  if (!status) return null;

  const { plan } = status;

  const PLAN_META = {
    free: { icon: Zap, label: 'Free', bg: '#F9FAFB', text: '#6B7280', iconColor: '#9CA3AF' },
    starter: { icon: Star, label: 'Starter', bg: '#FFF5F5', text: '#C44545', iconColor: '#EA7B7B' },
    pro: { icon: Crown, label: 'Pro', bg: '#FFFBEB', text: '#92680A', iconColor: '#D4A012' },
  } as const;

  const meta = PLAN_META[plan as keyof typeof PLAN_META] ?? PLAN_META.free;
  const Icon = meta.icon;

  return (
    <Link
      href="/profile?tab=billing"
      className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all hover:shadow-sm"
      style={{ backgroundColor: meta.bg, color: meta.text }}
    >
      <Icon className="h-3 w-3" style={{ color: meta.iconColor }} />
      {meta.label}
      {plan === 'free' && <ArrowRight className="h-2.5 w-2.5 opacity-50" />}
    </Link>
  );
}

// =============================================================================
// APP HEADER (mobile/tablet only — desktop uses sidebar)
// =============================================================================

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur-lg lg:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <Link href="/dashboard">
          <img src="/logo.png" alt="MindStash" className="h-7 w-auto" />
        </Link>
        <CompactPlanBadge />
      </div>
    </header>
  );
}
