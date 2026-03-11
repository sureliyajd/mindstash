'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { LogOut, Settings, Check, Loader2, Eye, EyeOff } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { TelegramConnect } from '@/components/TelegramConnect';
import { useAuth } from '@/lib/hooks/useAuth';
import { useToast } from '@/components/Providers';
import { notifications, type EmailPreferences } from '@/lib/api';
import { useBillingStatus } from '@/lib/hooks/useBilling';

const APP_VERSION = '1.0.0';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        checked ? 'bg-[#EA7B7B]' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

function SettingsContent() {
  const { user, logout, updateProfile, changePassword, deleteAccount, isProfileUpdating, isPasswordChanging, isAccountDeleting } = useAuth();
  const { showToast } = useToast();
  const { data: billingStatus } = useBillingStatus();

  // Profile state
  const [name, setName] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);
  useEffect(() => { setName(user?.name ?? ''); }, [user?.name]);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);

  const handleSaveProfile = async () => {
    try {
      await updateProfile(name.trim() || null);
      setProfileSaved(true);
      showToast('Name updated', 'success');
      setTimeout(() => setProfileSaved(false), 2000);
    } catch {
      showToast('Failed to update name', 'error');
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      showToast('New password must be at least 8 characters', 'error');
      return;
    }
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setPwSaved(true);
      showToast('Password changed', 'success');
      setTimeout(() => setPwSaved(false), 2000);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      showToast(detail ?? 'Failed to change password', 'error');
    }
  };

  // Email preferences state
  const [prefs, setPrefs] = useState<EmailPreferences>({
    daily_briefing_enabled: true,
    weekly_digest_enabled: true,
    item_reminders_enabled: true,
  });
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState(false);

  useEffect(() => {
    notifications.getPreferences().then(setPrefs).catch(() => {});
  }, []);

  // Scroll to hash section on mount (e.g. #integrations from Telegram promo)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const timer = setTimeout(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
    } catch {
      showToast('Failed to delete account', 'error');
      setDeleteConfirm(false);
    }
  };

  const handleLogout = () => {
    logout();
    showToast('Logged out successfully', 'success');
  };

  const handleSavePrefs = async () => {
    setPrefsSaving(true);
    try {
      const updated = await notifications.updatePreferences(prefs);
      setPrefs(updated);
      setPrefsSaved(true);
      showToast('Email preferences saved', 'success');
      setTimeout(() => setPrefsSaved(false), 2000);
    } catch {
      showToast('Failed to save preferences', 'error');
    } finally {
      setPrefsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <img src="/logo.png" alt="MindStash" className="h-10 w-auto" />
            </Link>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
            <Settings className="h-4 w-4" />
            Settings
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-10">
        <motion.div
          variants={container}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Account Section */}
          <motion.section variants={fadeUp}>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
              Account
            </h2>
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 space-y-5">
              {/* Identity row */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                  <p className="mt-0.5 text-xs text-gray-400">Signed in</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>

              {/* Display name */}
              <div className="border-t border-gray-100 pt-4 space-y-2">
                <label className="text-xs font-medium text-gray-500">Display name</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name (optional)"
                    maxLength={100}
                    className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-[#EA7B7B] focus:outline-none focus:ring-1 focus:ring-[#EA7B7B]"
                  />
                  <button
                    onClick={handleSaveProfile}
                    disabled={isProfileUpdating}
                    className="flex items-center gap-1.5 rounded-xl bg-[#EA7B7B] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#D66B6B] disabled:opacity-60"
                  >
                    {isProfileUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : profileSaved ? <Check className="h-4 w-4" /> : null}
                    Save
                  </button>
                </div>
              </div>

              {/* Change password */}
              <div className="border-t border-gray-100 pt-4 space-y-2">
                <label className="text-xs font-medium text-gray-500">Change password</label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Current password"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 pr-10 text-sm text-gray-900 placeholder-gray-400 focus:border-[#EA7B7B] focus:outline-none focus:ring-1 focus:ring-[#EA7B7B]"
                  />
                  <button type="button" onClick={() => setShowCurrent((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password (min 8 chars)"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 pr-10 text-sm text-gray-900 placeholder-gray-400 focus:border-[#EA7B7B] focus:outline-none focus:ring-1 focus:ring-[#EA7B7B]"
                  />
                  <button type="button" onClick={() => setShowNew((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <button
                  onClick={handleChangePassword}
                  disabled={isPasswordChanging || !currentPassword || !newPassword}
                  className="flex items-center gap-1.5 rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:opacity-40"
                >
                  {isPasswordChanging ? <Loader2 className="h-4 w-4 animate-spin" /> : pwSaved ? <Check className="h-4 w-4" /> : null}
                  Update password
                </button>
              </div>
            </div>
          </motion.section>

          {/* Integrations Section */}
          <motion.section variants={fadeUp} id="integrations">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
              Integrations
            </h2>
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              {billingStatus && !billingStatus.features.telegram ? (
                <div className="opacity-60 pointer-events-none">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Telegram Bot</p>
                      <p className="text-xs text-gray-400 mt-0.5">Capture thoughts on the go via Telegram</p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600 ring-1 ring-indigo-200">
                      Requires Starter plan
                    </span>
                  </div>
                  <a
                    href="/billing"
                    className="pointer-events-auto inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
                    style={{ pointerEvents: 'auto' }}
                  >
                    Upgrade to Starter →
                  </a>
                </div>
              ) : (
                <TelegramConnect inline isOpen={true} onClose={() => {}} />
              )}
            </div>
          </motion.section>

          {/* Email Notifications Section */}
          <motion.section variants={fadeUp}>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
              Email Notifications
            </h2>
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 space-y-5">
              {/* Daily Briefing — requires Pro */}
              <div className={`flex items-center justify-between ${billingStatus && !billingStatus.features.daily_briefing ? 'opacity-50' : ''}`}>
                <div>
                  <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    Daily Briefing
                    {billingStatus && !billingStatus.features.daily_briefing && (
                      <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-600 ring-1 ring-purple-200">
                        Pro
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">AI-powered morning summary of your stash</p>
                </div>
                <Toggle
                  checked={prefs.daily_briefing_enabled && (!billingStatus || billingStatus.features.daily_briefing)}
                  onChange={(v) => {
                    if (billingStatus && !billingStatus.features.daily_briefing) return;
                    setPrefs((p) => ({ ...p, daily_briefing_enabled: v }));
                  }}
                />
              </div>

              {/* Weekly Digest & Item Reminders */}
              {[
                {
                  key: 'weekly_digest_enabled' as keyof EmailPreferences,
                  label: 'Weekly Digest',
                  description: 'Sunday roundup of urgent items and pending tasks',
                },
                {
                  key: 'item_reminders_enabled' as keyof EmailPreferences,
                  label: 'Item Reminders',
                  description: 'Notifications for items with scheduled reminders',
                },
              ].map(({ key, label, description }) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{description}</p>
                  </div>
                  <Toggle
                    checked={prefs[key]}
                    onChange={(v) => setPrefs((p) => ({ ...p, [key]: v }))}
                  />
                </div>
              ))}
              <div className="pt-2">
                <button
                  onClick={handleSavePrefs}
                  disabled={prefsSaving}
                  className="flex items-center gap-2 rounded-xl bg-[#EA7B7B] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#D66B6B] disabled:opacity-60"
                >
                  {prefsSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : prefsSaved ? (
                    <Check className="h-4 w-4" />
                  ) : null}
                  {prefsSaved ? 'Saved' : 'Save preferences'}
                </button>
              </div>
            </div>
          </motion.section>

          {/* About Section */}
          <motion.section variants={fadeUp}>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
              About
            </h2>
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Version</span>
                <span className="font-medium text-gray-900">{APP_VERSION}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Legal</span>
                <div className="flex items-center gap-4">
                  <Link
                    href="/privacy"
                    target="_blank"
                    className="font-medium text-[#EA7B7B] hover:text-[#D66B6B] transition-colors"
                  >
                    Privacy Policy
                  </Link>
                  <Link
                    href="/terms"
                    target="_blank"
                    className="font-medium text-[#EA7B7B] hover:text-[#D66B6B] transition-colors"
                  >
                    Terms of Service
                  </Link>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Made with</span>
                <span className="text-gray-900">🧠 &amp; ❤️</span>
              </div>
            </div>
          </motion.section>

          {/* Danger Zone */}
          <motion.section variants={fadeUp}>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
              Danger Zone
            </h2>
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-red-100">
              {!deleteConfirm ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Delete account</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Remove your account and all your data permanently.
                    </p>
                  </div>
                  <button
                    onClick={() => setDeleteConfirm(true)}
                    className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                  >
                    Delete account
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-red-600">Are you sure? This cannot be undone.</p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleDeleteAccount}
                      disabled={isAccountDeleting}
                      className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60"
                    >
                      {isAccountDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Yes, delete my account
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(false)}
                      className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.section>

          {/* Back link */}
          <motion.div variants={fadeUp} className="pt-2">
            <Link
              href="/dashboard"
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              ← Back to dashboard
            </Link>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  );
}
