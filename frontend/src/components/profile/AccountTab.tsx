'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LogOut, Check, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useToast } from '@/components/Providers';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function AccountTab() {
  const {
    user,
    logout,
    updateProfile,
    changePassword,
    deleteAccount,
    isProfileUpdating,
    isPasswordChanging,
    isAccountDeleting,
  } = useAuth();
  const { showToast } = useToast();

  // Profile state
  const [name, setName] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);
  useEffect(() => {
    setName(user?.name ?? '');
  }, [user?.name]);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);

  // Delete state
  const [deleteConfirm, setDeleteConfirm] = useState(false);

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
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data
        ?.detail;
      showToast(detail ?? 'Failed to change password', 'error');
    }
  };

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

  return (
    <div className="space-y-6">
      {/* Account Info */}
      <motion.section variants={fadeUp} initial="hidden" animate="visible">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
          Account
        </h2>
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 space-y-5">
          {/* Identity row */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900">{user?.email}</p>
              <p className="mt-0.5 text-xs text-gray-400">Signed in</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex shrink-0 items-center gap-2 self-start rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
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
                {isProfileUpdating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : profileSaved ? (
                  <Check className="h-4 w-4" />
                ) : null}
                Save
              </button>
            </div>
          </div>

          {/* Change password — hidden for Google-only accounts */}
          {user?.auth_method !== 'google' && <div className="border-t border-gray-100 pt-4 space-y-2">
            <label className="text-xs font-medium text-gray-500">Change password</label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current password"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 pr-10 text-sm text-gray-900 placeholder-gray-400 focus:border-[#EA7B7B] focus:outline-none focus:ring-1 focus:ring-[#EA7B7B]"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
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
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <button
              onClick={handleChangePassword}
              disabled={isPasswordChanging || !currentPassword || !newPassword}
              className="flex items-center gap-1.5 rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:opacity-40"
            >
              {isPasswordChanging ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : pwSaved ? (
                <Check className="h-4 w-4" />
              ) : null}
              Update password
            </button>
          </div>}
        </div>
      </motion.section>

      {/* Danger Zone */}
      <motion.section
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.1 }}
      >
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
              <p className="text-sm font-medium text-red-600">
                Are you sure? This cannot be undone.
              </p>
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

      {/* About */}
      <motion.section
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2 }}
      >
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
          About
        </h2>
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Version</span>
            <span className="font-medium text-gray-900">1.0.0</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Legal</span>
            <div className="flex flex-wrap items-center gap-4">
              <a
                href="/privacy"
                target="_blank"
                className="font-medium text-[#EA7B7B] hover:text-[#D66B6B] transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="/terms"
                target="_blank"
                className="font-medium text-[#EA7B7B] hover:text-[#D66B6B] transition-colors"
              >
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
