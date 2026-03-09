'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, UserCircle, Loader2, Check } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/lib/hooks/useAuth';
import { useToast } from '@/components/Providers';
import { auth } from '@/lib/api';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

function ProfileContent() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  // Profile section state
  const [name, setName] = useState(user?.name ?? '');
  const [nameSaving, setNameSaving] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);

  // Password section state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleSaveName = async () => {
    setNameSaving(true);
    try {
      await auth.updateProfile(name.trim() || null);
      await queryClient.invalidateQueries({ queryKey: ['user'] });
      setNameSaved(true);
      showToast('Profile updated', 'success');
      setTimeout(() => setNameSaved(false), 2000);
    } catch {
      showToast('Failed to update profile', 'error');
    } finally {
      setNameSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }

    setPasswordSaving(true);
    try {
      await auth.changePassword(currentPassword, newPassword);
      showToast('Password changed successfully', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setPasswordError(detail || 'Failed to change password');
    } finally {
      setPasswordSaving(false);
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
            <UserCircle className="h-4 w-4" />
            Profile
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
          {/* Profile Section */}
          <motion.section variants={fadeUp}>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
              Profile
            </h2>
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 space-y-5">
              <div>
                <p className="text-xs text-gray-400 mb-1">Email</p>
                <p className="text-sm font-medium text-gray-700">{user?.email}</p>
              </div>
              <div>
                <label
                  htmlFor="display-name"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Display name
                </label>
                <input
                  id="display-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                  placeholder="Your name"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-[#EA7B7B] focus:bg-white focus:ring-4 focus:ring-[#EA7B7B]/10"
                />
              </div>
              <button
                onClick={handleSaveName}
                disabled={nameSaving}
                className="flex items-center gap-2 rounded-xl bg-[#EA7B7B] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#D66B6B] disabled:opacity-60"
              >
                {nameSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : nameSaved ? (
                  <Check className="h-4 w-4" />
                ) : null}
                {nameSaved ? 'Saved' : 'Save profile'}
              </button>
            </div>
          </motion.section>

          {/* Change Password Section */}
          <motion.section variants={fadeUp}>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
              Change Password
            </h2>
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label
                    htmlFor="current-password"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Current password
                  </label>
                  <input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    disabled={passwordSaving}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-[#EA7B7B] focus:bg-white focus:ring-4 focus:ring-[#EA7B7B]/10 disabled:opacity-50"
                    placeholder="Enter current password"
                  />
                </div>
                <div>
                  <label
                    htmlFor="new-password"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    New password
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    minLength={8}
                    disabled={passwordSaving}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-[#EA7B7B] focus:bg-white focus:ring-4 focus:ring-[#EA7B7B]/10 disabled:opacity-50"
                    placeholder="At least 8 characters"
                  />
                </div>
                <div>
                  <label
                    htmlFor="confirm-password"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Confirm new password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    disabled={passwordSaving}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-[#EA7B7B] focus:bg-white focus:ring-4 focus:ring-[#EA7B7B]/10 disabled:opacity-50"
                    placeholder="Re-enter new password"
                  />
                </div>

                {passwordError && (
                  <p className="text-sm font-medium text-red-600">{passwordError}</p>
                )}

                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-60"
                >
                  {passwordSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Change password
                </button>
              </form>
            </div>
          </motion.section>

          {/* Back link */}
          <motion.div variants={fadeUp} className="pt-2">
            <Link
              href="/settings"
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft className="inline h-3.5 w-3.5 mr-1" />
              Back to settings
            </Link>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}
