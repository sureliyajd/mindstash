'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  ArrowLeft,
  BarChart2,
  Globe,
  Users,
  Activity,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { AdminRoute } from '@/components/AdminRoute';
import { adminApi, AnalyticsEvent, AnalyticsSummaryResponse } from '@/lib/api';

// =============================================================================
// HELPERS
// =============================================================================

const EVENT_TYPE_COLORS: Record<string, string> = {
  page_view: 'bg-blue-100 text-blue-700',
  login_attempt: 'bg-yellow-100 text-yellow-700',
  login_success: 'bg-green-100 text-green-700',
  login_failed: 'bg-red-100 text-red-700',
  register_attempt: 'bg-purple-100 text-purple-700',
  register_success: 'bg-teal-100 text-teal-700',
  register_failed: 'bg-orange-100 text-orange-700',
};

function EventBadge({ type }: { type: string }) {
  const cls = EVENT_TYPE_COLORS[type] ?? 'bg-gray-100 text-gray-700';
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>
      {type.replace(/_/g, ' ')}
    </span>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className={`mb-3 inline-flex rounded-xl p-2.5 ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</div>
      <div className="mt-1 text-sm text-gray-500">{label}</div>
    </div>
  );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

const EVENT_TYPES = [
  '',
  'page_view',
  'login_attempt',
  'login_success',
  'login_failed',
  'register_attempt',
  'register_success',
  'register_failed',
];

function AnalyticsDashboard() {
  const router = useRouter();

  // Summary
  const { data: summary, isLoading: summaryLoading } = useQuery<AnalyticsSummaryResponse>({
    queryKey: ['admin', 'analytics', 'summary'],
    queryFn: () => adminApi.getAnalyticsSummary(),
    refetchInterval: 60_000,
  });

  // Events list filters
  const [page, setPage] = useState(1);
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [hideOwnActivity, setHideOwnActivity] = useState(true);
  const PAGE_SIZE = 50;

  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ['admin', 'analytics', 'events', page, eventTypeFilter, dateFrom, dateTo],
    queryFn: () =>
      adminApi.getAnalyticsEvents(page, PAGE_SIZE, eventTypeFilter, dateFrom, dateTo),
    placeholderData: keepPreviousData,
  });

  const filteredEvents = eventsData?.events.filter((ev: AnalyticsEvent) => {
    if (!hideOwnActivity) return true;
    const location = [ev.city, ev.country].filter(Boolean).join(', ');
    if (!location || location.includes('India')) return false;
    return true;
  });

  const totalPages = eventsData ? Math.ceil(eventsData.total / PAGE_SIZE) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center gap-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </button>
          <div className="h-4 w-px bg-gray-200" />
          <h1 className="text-lg font-semibold text-gray-900">Analytics</h1>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8 space-y-8">
        {/* Summary cards */}
        {summaryLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl bg-gray-100" />
            ))}
          </div>
        ) : summary ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <SummaryCard
              icon={Activity}
              label="Total Events"
              value={summary.total_events}
              color="bg-blue-50 text-blue-600"
            />
            <SummaryCard
              icon={BarChart2}
              label="Today"
              value={summary.today_events}
              color="bg-purple-50 text-purple-600"
            />
            <SummaryCard
              icon={Users}
              label="Unique IPs"
              value={summary.unique_ips}
              color="bg-green-50 text-green-600"
            />
            <SummaryCard
              icon={Globe}
              label="Countries"
              value={summary.unique_countries}
              color="bg-teal-50 text-teal-600"
            />
          </div>
        ) : null}

        {/* Event type breakdown + Top pages */}
        {summary && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Event type breakdown */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-gray-700">Event Breakdown</h2>
              <div className="flex flex-wrap gap-2">
                {Object.entries(summary.event_type_breakdown).map(([type, count]) => (
                  <div key={type} className="flex items-center gap-2">
                    <EventBadge type={type} />
                    <span className="text-xs text-gray-500">{count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top pages */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-gray-700">Top Pages</h2>
              {summary.top_pages.length === 0 ? (
                <p className="text-sm text-gray-400">No page views yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="pb-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Page</th>
                      <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Views</th>
                      <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {summary.top_pages.map((p) => (
                      <tr key={p.page}>
                        <td className="py-2 text-gray-700">{p.page}</td>
                        <td className="py-2 text-right text-gray-500">{p.count.toLocaleString()}</td>
                        <td className="py-2 text-right text-gray-400">{p.pct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Events table */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 px-6 py-4">
            <select
              value={eventTypeFilter}
              onChange={(e) => { setEventTypeFilter(e.target.value); setPage(1); }}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
            >
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t}>{t || 'All event types'}</option>
              ))}
            </select>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
            />
            <span className="text-xs text-gray-400">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
            />
            <label className="ml-auto flex cursor-pointer items-center gap-2 text-xs text-gray-500">
              <input
                type="checkbox"
                checked={hideOwnActivity}
                onChange={(e) => setHideOwnActivity(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              Hide own activity
            </label>
          </div>

          {eventsLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-200 border-t-purple-600" />
            </div>
          ) : !filteredEvents?.length ? (
            <div className="py-16 text-center text-sm text-gray-400">
              {hideOwnActivity && eventsData?.events.length ? 'No external events found — uncheck "Hide own activity" to see all' : 'No events found'}
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Time</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Event</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Page</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">IP</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Location</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Referrer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredEvents.map((ev: AnalyticsEvent) => (
                  <tr key={ev.id} className="hover:bg-gray-50/60">
                    <td className="px-6 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {new Date(ev.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-3">
                      <EventBadge type={ev.event_type} />
                    </td>
                    <td className="px-6 py-3 text-xs font-mono text-gray-700">
                      {ev.page ?? '—'}
                    </td>
                    <td className="px-6 py-3 text-xs font-mono text-gray-500">
                      {ev.ip_address ?? '—'}
                    </td>
                    <td className="px-6 py-3 text-xs text-gray-500">
                      {ev.city || ev.country
                        ? [ev.city, ev.country].filter(Boolean).join(', ')
                        : '—'}
                    </td>
                    <td className="px-6 py-3 text-xs text-gray-400 max-w-xs truncate">
                      {ev.referrer || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
              <span className="text-xs text-gray-400">
                Page {page} of {totalPages} · {eventsData?.total.toLocaleString()} events
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <AdminRoute>
      <AnalyticsDashboard />
    </AdminRoute>
  );
}
