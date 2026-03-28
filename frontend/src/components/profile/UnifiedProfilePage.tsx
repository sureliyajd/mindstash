'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, CreditCard, Bell, Puzzle } from 'lucide-react';
import { AccountTab } from './AccountTab';
import { BillingTab } from './BillingTab';
import { NotificationsTab } from './NotificationsTab';
import { IntegrationsTab } from './IntegrationsTab';

// =============================================================================
// TYPES
// =============================================================================

type ProfileTab = 'account' | 'billing' | 'notifications' | 'integrations';

const TABS: { id: ProfileTab; label: string; icon: React.ElementType }[] = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'integrations', label: 'Integrations', icon: Puzzle },
];

// =============================================================================
// TAB CONTENT
// =============================================================================

function TabContent({ tab }: { tab: ProfileTab }) {
  switch (tab) {
    case 'account':
      return <AccountTab />;
    case 'billing':
      return <BillingTab />;
    case 'notifications':
      return <NotificationsTab />;
    case 'integrations':
      return <IntegrationsTab />;
  }
}

// =============================================================================
// INNER (uses useSearchParams)
// =============================================================================

function UnifiedProfileInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get('tab') as ProfileTab | null;
  const [activeTab, setActiveTab] = useState<ProfileTab>(
    tabParam && TABS.some((t) => t.id === tabParam) ? tabParam : 'account'
  );

  // Sync tab with URL
  useEffect(() => {
    if (tabParam && TABS.some((t) => t.id === tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam, activeTab]);

  const handleTabChange = (tab: ProfileTab) => {
    setActiveTab(tab);
    router.replace(`/profile?tab=${tab}`, { scroll: false });
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Profile & Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your account, billing, and preferences</p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 flex items-center gap-1 overflow-x-auto scrollbar-hide rounded-xl bg-gray-100 p-1">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`relative flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="profile-tab-bg"
                  className="absolute inset-0 rounded-lg bg-white shadow-sm"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className="relative h-4 w-4" />
              <span className="relative">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <TabContent tab={activeTab} />
    </div>
  );
}

// =============================================================================
// EXPORTED (wraps with Suspense for useSearchParams)
// =============================================================================

export function UnifiedProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 rounded bg-gray-200" />
            <div className="h-12 rounded-xl bg-gray-100" />
            <div className="h-64 rounded-2xl bg-gray-100" />
          </div>
        </div>
      }
    >
      <UnifiedProfileInner />
    </Suspense>
  );
}
