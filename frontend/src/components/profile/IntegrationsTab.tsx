'use client';

import { motion } from 'framer-motion';
import { TelegramConnect } from '@/components/TelegramConnect';
import { useBillingStatus } from '@/lib/hooks/useBilling';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function IntegrationsTab() {
  const { data: billingStatus } = useBillingStatus();

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" className="space-y-6">
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
          Integrations
        </h2>
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          {billingStatus && !billingStatus.features.telegram ? (
            <div className="opacity-60 pointer-events-none">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">Telegram Bot</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Capture thoughts on the go via Telegram
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600 ring-1 ring-indigo-200">
                  Requires Starter plan
                </span>
              </div>
              <a
                href="/profile?tab=billing"
                className="pointer-events-auto inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
                style={{ pointerEvents: 'auto' }}
              >
                Upgrade to Starter
              </a>
            </div>
          ) : (
            <TelegramConnect inline isOpen={true} onClose={() => {}} />
          )}
        </div>
      </section>
    </motion.div>
  );
}
