'use client';

import { Sparkles, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface AIInsightBannerProps {
  urgentCount: number;
  todayCount: number;
  pendingTasksCount: number;
  completedThisWeek: number;
  isLoading?: boolean;
}

export function AIInsightBanner({
  urgentCount,
  todayCount,
  pendingTasksCount,
  completedThisWeek,
  isLoading,
}: AIInsightBannerProps) {
  if (isLoading) {
    return (
      <div className="animate-pulse rounded-xl bg-gray-100 px-4 py-3">
        <div className="h-4 w-64 rounded bg-gray-200" />
      </div>
    );
  }

  // Build a smart insight message
  const parts: string[] = [];

  if (urgentCount > 0) {
    parts.push(`${urgentCount} urgent item${urgentCount > 1 ? 's' : ''} need attention`);
  }
  if (todayCount > 0) {
    parts.push(`${todayCount} item${todayCount > 1 ? 's' : ''} for today`);
  }
  if (pendingTasksCount > 0 && urgentCount === 0) {
    parts.push(`${pendingTasksCount} pending task${pendingTasksCount > 1 ? 's' : ''}`);
  }
  if (completedThisWeek > 0 && parts.length < 2) {
    parts.push(`${completedThisWeek} completed this week`);
  }

  const message = parts.length > 0
    ? parts.join(' · ')
    : 'All clear! No urgent items right now.';

  // Pick the most relevant icon
  const IconComponent = urgentCount > 0
    ? AlertTriangle
    : todayCount > 0
    ? Clock
    : completedThisWeek > 0
    ? CheckCircle2
    : Sparkles;

  const iconColor = urgentCount > 0
    ? '#D65E3F'
    : todayCount > 0
    ? '#C9A030'
    : '#5EB563';

  const bgColor = urgentCount > 0
    ? 'bg-[#FF8364]/[0.06] ring-[#FF8364]/15'
    : todayCount > 0
    ? 'bg-[#FACE68]/[0.06] ring-[#FACE68]/15'
    : 'bg-[#93DA97]/[0.06] ring-[#93DA97]/15';

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex items-center gap-3 rounded-xl px-4 py-3 ring-1 ${bgColor}`}
    >
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${iconColor}15` }}
      >
        <IconComponent className="h-3.5 w-3.5" style={{ color: iconColor }} />
      </div>
      <p className="text-sm font-medium text-gray-700">{message}</p>
    </motion.div>
  );
}
