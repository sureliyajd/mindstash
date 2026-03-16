'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Search,
  Pencil,
  Trash2,
  UserX,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  X,
  Shield,
  Clock,
  Info,
  Mail,
  CreditCard,
  BarChart2,
  Calendar,
  LogIn,
} from 'lucide-react';
import { AdminRoute } from '@/components/AdminRoute';
import { useToast } from '@/components/Providers';
import { adminApi, AdminUser, AdminUserInfo, ActivityLog, PLAN_LIMITS } from '@/lib/api';

// =============================================================================
// EDIT MODAL
// =============================================================================

interface EditModalProps {
  user: AdminUser;
  onClose: () => void;
  onSave: (name: string, email: string) => void;
  isSaving: boolean;
}

function EditModal({ user, onClose, onSave, isSaving }: EditModalProps) {
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl mx-4"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Edit User</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              placeholder="Display name"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              placeholder="user@example.com"
            />
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(name, email)}
            disabled={isSaving || !email.trim()}
            className="flex-1 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {isSaving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// =============================================================================
// DELETE CONFIRM MODAL
// =============================================================================

interface DeleteModalProps {
  user: AdminUser;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

function DeleteModal({ user, onClose, onConfirm, isDeleting }: DeleteModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl mx-4"
      >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-100">
          <Trash2 className="h-6 w-6 text-red-600" />
        </div>
        <h2 className="mb-2 text-lg font-semibold text-gray-900">Delete user?</h2>
        <p className="mb-6 text-sm text-gray-500">
          This will permanently delete <span className="font-medium text-gray-700">{user.email}</span> and all their data. This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isDeleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// =============================================================================
// ACTIVITY MODAL
// =============================================================================

const ACTION_LABELS: Record<string, string> = {
  item_captured: 'Item Saved',
  item_updated: 'Item Updated',
  item_deleted: 'Item Deleted',
  item_completed: 'Completed',
  item_uncompleted: 'Uncompleted',
  chat_message: 'Chat Message',
  agent_create_item: 'AI: Created Item',
  agent_update_item: 'AI: Updated Item',
  agent_delete_item: 'AI: Deleted Item',
  agent_mark_complete: 'AI: Completed',
};

function actionBadgeClass(action: string): string {
  if (action === 'item_captured' || action === 'agent_create_item') {
    return 'bg-green-100 text-green-700';
  }
  if (action === 'chat_message') {
    return 'bg-blue-100 text-blue-700';
  }
  if (action === 'item_deleted' || action === 'agent_delete_item') {
    return 'bg-red-100 text-red-700';
  }
  return 'bg-amber-100 text-amber-700';
}

function sourceBadgeClass(source: string): string {
  if (source === 'agent') return 'bg-purple-100 text-purple-700';
  if (source === 'telegram') return 'bg-sky-100 text-sky-700';
  return 'bg-gray-100 text-gray-600';
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatDetails(details: Record<string, unknown> | null): string {
  if (!details) return '—';
  const parts: string[] = [];
  if (details.content_preview) parts.push(`"${String(details.content_preview).slice(0, 50)}"`);
  if (details.category) parts.push(`cat: ${details.category}`);
  if (Array.isArray(details.fields_changed) && details.fields_changed.length > 0) {
    parts.push(`fields: ${(details.fields_changed as string[]).join(', ')}`);
  }
  if (details.message_preview) parts.push(`"${String(details.message_preview).slice(0, 50)}"`);
  if (typeof details.completed === 'boolean') parts.push(details.completed ? 'completed' : 'uncompleted');
  return parts.join(' · ') || '—';
}

interface ActivityModalProps {
  user: AdminUser;
  onClose: () => void;
}

function ActivityModal({ user, onClose }: ActivityModalProps) {
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'activity', user.id, page],
    queryFn: () => adminApi.getUserActivity(user.id, page, PAGE_SIZE),
    placeholderData: keepPreviousData,
  });

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 1;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm overflow-y-auto py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl mx-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Activity Log</h2>
            <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-purple-200 border-t-purple-600" />
            </div>
          ) : !data?.logs.length ? (
            <p className="py-12 text-center text-sm text-gray-400">No activity recorded yet</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Action</th>
                  <th className="pb-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Source</th>
                  <th className="pb-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 hidden md:table-cell">Details</th>
                  <th className="pb-2.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.logs.map((log: ActivityLog) => (
                  <tr key={log.id} className="hover:bg-gray-50/60">
                    <td className="py-2.5 pr-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${actionBadgeClass(log.action)}`}>
                        {ACTION_LABELS[log.action] || log.action}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${sourceBadgeClass(log.source)}`}>
                        {log.source}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-xs text-gray-500 hidden md:table-cell max-w-xs truncate">
                      {formatDetails(log.details)}
                    </td>
                    <td className="py-2.5 text-right text-xs text-gray-400 whitespace-nowrap">
                      {timeAgo(log.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </button>
            <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// =============================================================================
// USER INFO MODAL
// =============================================================================

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  starter: 'Starter',
  pro: 'Pro',
};

const PLAN_COLORS: Record<string, string> = {
  free: 'bg-gray-100 text-gray-600',
  starter: 'bg-blue-100 text-blue-700',
  pro: 'bg-purple-100 text-purple-700',
};

interface UserInfoModalProps {
  user: AdminUser;
  onClose: () => void;
}

function UserInfoModal({ user, onClose }: UserInfoModalProps) {
  const { data, isLoading } = useQuery<AdminUserInfo>({
    queryKey: ['admin', 'user-info', user.id],
    queryFn: () => adminApi.getUserInfo(user.id),
  });

  const itemLimit = data ? (PLAN_LIMITS[data.plan as keyof typeof PLAN_LIMITS]?.items_per_month ?? null) : null;
  const chatLimit = data ? (PLAN_LIMITS[data.plan as keyof typeof PLAN_LIMITS]?.chat_messages_per_month ?? null) : null;

  const pct = (used: number, limit: number | null) =>
    limit === null ? 0 : Math.min(100, Math.round((used / limit) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl mx-4 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
              <Info className="h-4 w-4 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">User Info</h2>
              <p className="text-xs text-gray-400">{user.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
          </div>
        ) : data ? (
          <div className="px-6 py-5 space-y-5">
            {/* Basic info */}
            <section>
              <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                <Mail className="h-3.5 w-3.5" /> Account
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-gray-50 px-4 py-3">
                  <p className="text-xs text-gray-400 mb-0.5">Name</p>
                  <p className="text-sm font-medium text-gray-800">{data.name || '—'}</p>
                </div>
                <div className="rounded-xl bg-gray-50 px-4 py-3">
                  <p className="text-xs text-gray-400 mb-0.5">Sign-in method</p>
                  <div className="flex items-center gap-1.5">
                    <LogIn className="h-3.5 w-3.5 text-gray-500" />
                    <p className="text-sm font-medium text-gray-800 capitalize">{data.auth_method}</p>
                  </div>
                </div>
                <div className="rounded-xl bg-gray-50 px-4 py-3 col-span-2">
                  <p className="text-xs text-gray-400 mb-0.5">Registered</p>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                    <p className="text-sm font-medium text-gray-800">
                      {new Date(data.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Subscription */}
            <section>
              <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                <CreditCard className="h-3.5 w-3.5" /> Subscription
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-gray-50 px-4 py-3">
                  <p className="text-xs text-gray-400 mb-1">Plan</p>
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${PLAN_COLORS[data.plan] || 'bg-gray-100 text-gray-600'}`}>
                    {PLAN_LABELS[data.plan] || data.plan}
                  </span>
                </div>
                <div className="rounded-xl bg-gray-50 px-4 py-3">
                  <p className="text-xs text-gray-400 mb-1">Status</p>
                  {data.subscription_status ? (
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      data.subscription_status === 'active' ? 'bg-green-100 text-green-700' :
                      data.subscription_status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {data.subscription_status}
                    </span>
                  ) : (
                    <p className="text-sm text-gray-500">—</p>
                  )}
                </div>
                {data.plan_expires_at && (
                  <div className="rounded-xl bg-gray-50 px-4 py-3 col-span-2">
                    <p className="text-xs text-gray-400 mb-0.5">Renews / Expires</p>
                    <p className="text-sm font-medium text-gray-800">
                      {new Date(data.plan_expires_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Usage */}
            <section>
              <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                <BarChart2 className="h-3.5 w-3.5" /> AI Credits Usage This Month
              </h3>
              <div className="space-y-3">
                {/* Items */}
                <div className="rounded-xl bg-gray-50 px-4 py-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs text-gray-500">Items captured</p>
                    <p className="text-xs font-semibold text-gray-700">
                      {data.items_this_month}{itemLimit !== null ? ` / ${itemLimit}` : ' / ∞'}
                    </p>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        itemLimit && pct(data.items_this_month, itemLimit) >= 90 ? 'bg-red-500' :
                        itemLimit && pct(data.items_this_month, itemLimit) >= 70 ? 'bg-amber-500' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${itemLimit === null ? 0 : pct(data.items_this_month, itemLimit)}%` }}
                    />
                  </div>
                </div>
                {/* Chat messages */}
                <div className="rounded-xl bg-gray-50 px-4 py-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs text-gray-500">Chat messages</p>
                    <p className="text-xs font-semibold text-gray-700">
                      {data.chat_messages_this_month}{chatLimit !== null ? ` / ${chatLimit}` : ' / ∞'}
                    </p>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        chatLimit && pct(data.chat_messages_this_month, chatLimit) >= 90 ? 'bg-red-500' :
                        chatLimit && pct(data.chat_messages_this_month, chatLimit) >= 70 ? 'bg-amber-500' : 'bg-purple-500'
                      }`}
                      style={{ width: `${chatLimit === null ? 0 : pct(data.chat_messages_this_month, chatLimit)}%` }}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-400 text-right">
                  Resets {new Date(data.usage_reset_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </div>
            </section>
          </div>
        ) : (
          <p className="py-10 text-center text-sm text-gray-400">Failed to load user info</p>
        )}

        <div className="border-t border-gray-100 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

function AdminUsersContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [committedSearch, setCommittedSearch] = useState('');
  const [editTarget, setEditTarget] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [activityTarget, setActivityTarget] = useState<AdminUser | null>(null);
  const [infoTarget, setInfoTarget] = useState<AdminUser | null>(null);

  const PAGE_SIZE = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', page, committedSearch],
    queryFn: () => adminApi.getUsers(page, PAGE_SIZE, committedSearch),
    placeholderData: keepPreviousData,
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
  }, [queryClient]);

  const editMutation = useMutation({
    mutationFn: ({ id, name, email }: { id: string; name: string; email: string }) =>
      adminApi.editUser(id, { name: name || null, email }),
    onSuccess: () => {
      showToast('User updated', 'success');
      setEditTarget(null);
      invalidate();
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to update user';
      showToast(msg, 'error');
    },
  });

  const suspendMutation = useMutation({
    mutationFn: (id: string) => adminApi.suspendUser(id),
    onSuccess: () => { showToast('User suspended', 'success'); invalidate(); },
    onError: () => showToast('Failed to suspend user', 'error'),
  });

  const unsuspendMutation = useMutation({
    mutationFn: (id: string) => adminApi.unsuspendUser(id),
    onSuccess: () => { showToast('User unsuspended', 'success'); invalidate(); },
    onError: () => showToast('Failed to unsuspend user', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: () => {
      showToast('User deleted', 'success');
      setDeleteTarget(null);
      invalidate();
    },
    onError: () => showToast('Failed to delete user', 'error'),
  });

  const handleSearch = () => {
    setCommittedSearch(searchInput);
    setPage(1);
  };

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 1;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/90 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100">
              <Shield className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-purple-600">Admin</span>
              <h1 className="text-base font-semibold text-gray-900 leading-tight">Users</h1>
            </div>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Search */}
        <div className="mb-6 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search by name or email…"
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
            />
          </div>
          <button
            onClick={handleSearch}
            className="rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-purple-700"
          >
            Search
          </button>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-200 border-t-purple-600" />
            </div>
          ) : !data?.users.length ? (
            <div className="py-16 text-center text-sm text-gray-400">No users found</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">User</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Joined</th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.users.map((u) => {
                  const isProtected = u.is_admin;
                  return (
                    <tr key={u.id} className="group hover:bg-gray-50/60">
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-medium text-gray-900">{u.name || '—'}</span>
                          <span className="text-xs text-gray-400">{u.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {u.is_admin ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-1 text-xs font-medium text-purple-700">
                            <Shield className="h-3 w-3" /> Admin
                          </span>
                        ) : u.is_suspended ? (
                          <span className="inline-flex rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">Suspended</span>
                        ) : (
                          <span className="inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">Active</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            disabled={isProtected}
                            onClick={() => setEditTarget(u)}
                            title="Edit"
                            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          {u.is_suspended ? (
                            <button
                              disabled={isProtected}
                              onClick={() => unsuspendMutation.mutate(u.id)}
                              title="Unsuspend"
                              className="rounded-lg p-2 text-gray-400 hover:bg-green-50 hover:text-green-700 disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              <UserCheck className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              disabled={isProtected}
                              onClick={() => suspendMutation.mutate(u.id)}
                              title="Suspend"
                              className="rounded-lg p-2 text-gray-400 hover:bg-amber-50 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              <UserX className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            disabled={isProtected}
                            onClick={() => setDeleteTarget(u)}
                            title="Delete"
                            className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setActivityTarget(u)}
                            title="Activity"
                            className="rounded-lg p-2 text-gray-400 hover:bg-purple-50 hover:text-purple-700"
                          >
                            <Clock className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setInfoTarget(u)}
                            title="Info"
                            className="rounded-lg p-2 text-gray-400 hover:bg-indigo-50 hover:text-indigo-700"
                          >
                            <Info className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-end gap-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </button>
            <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </main>

      {/* Modals */}
      <AnimatePresence>
        {editTarget && (
          <EditModal
            key="edit"
            user={editTarget}
            onClose={() => setEditTarget(null)}
            onSave={(name, email) => editMutation.mutate({ id: editTarget.id, name, email })}
            isSaving={editMutation.isPending}
          />
        )}
        {deleteTarget && (
          <DeleteModal
            key="delete"
            user={deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
            isDeleting={deleteMutation.isPending}
          />
        )}
        {activityTarget && (
          <ActivityModal
            key="activity"
            user={activityTarget}
            onClose={() => setActivityTarget(null)}
          />
        )}
        {infoTarget && (
          <UserInfoModal
            key="info"
            user={infoTarget}
            onClose={() => setInfoTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <AdminRoute>
      <AdminUsersContent />
    </AdminRoute>
  );
}
