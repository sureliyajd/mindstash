'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';
import { notifications, type EmailPreferences } from '@/lib/api';
import { useBillingStatus } from '@/lib/hooks/useBilling';
import { useToast } from '@/components/Providers';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
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

export function NotificationsTab() {
  const { showToast } = useToast();
  const { data: billingStatus } = useBillingStatus();

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
    <motion.div variants={fadeUp} initial="hidden" animate="visible" className="space-y-6">
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
          Email Notifications
        </h2>
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 space-y-5">
          {/* Daily Briefing — requires Pro */}
          <div
            className={`flex items-center justify-between ${
              billingStatus && !billingStatus.features.daily_briefing ? 'opacity-50' : ''
            }`}
          >
            <div>
              <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                Daily Briefing
                {billingStatus && !billingStatus.features.daily_briefing && (
                  <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-600 ring-1 ring-purple-200">
                    Pro
                  </span>
                )}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                AI-powered morning summary of your stash
              </p>
            </div>
            <Toggle
              checked={
                prefs.daily_briefing_enabled &&
                (!billingStatus || billingStatus.features.daily_briefing)
              }
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
              <Toggle checked={prefs[key]} onChange={(v) => setPrefs((p) => ({ ...p, [key]: v }))} />
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
      </section>
    </motion.div>
  );
}
