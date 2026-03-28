'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, MessageSquare, Search, User } from 'lucide-react';
import { motion } from 'framer-motion';

interface MobileTabBarProps {
  onChatOpen: () => void;
  onSearchFocus: () => void;
  isChatOpen: boolean;
}

const tabs = [
  { id: 'home', label: 'Home', icon: Home, href: '/dashboard' },
  { id: 'chat', label: 'Chat', icon: MessageSquare, href: '#' },
  { id: 'search', label: 'Search', icon: Search, href: '#' },
  { id: 'profile', label: 'Profile', icon: User, href: '/profile' },
] as const;

export function MobileTabBar({ onChatOpen, onSearchFocus, isChatOpen }: MobileTabBarProps) {
  const pathname = usePathname();

  const getIsActive = (tab: typeof tabs[number]) => {
    if (tab.id === 'chat') return isChatOpen;
    if (tab.id === 'home') return pathname === '/dashboard' && !isChatOpen;
    if (tab.id === 'profile') return pathname.startsWith('/profile');
    return false;
  };

  const handleTabClick = (tab: typeof tabs[number]) => {
    if (tab.id === 'chat') {
      onChatOpen();
      return;
    }
    if (tab.id === 'search') {
      onSearchFocus();
      return;
    }
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-100 bg-white/95 backdrop-blur-lg sm:hidden">
      <div className="flex items-stretch" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {tabs.map((tab) => {
          const isActive = getIsActive(tab);
          const Icon = tab.icon;

          const content = (
            <div className="flex flex-1 flex-col items-center gap-0.5 py-2">
              <div className="relative">
                <Icon
                  className={`h-5 w-5 transition-colors ${
                    isActive ? 'text-[#EA7B7B]' : 'text-gray-400'
                  }`}
                />
                {isActive && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#EA7B7B]"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </div>
              <span
                className={`text-[10px] font-medium transition-colors ${
                  isActive ? 'text-[#EA7B7B]' : 'text-gray-400'
                }`}
              >
                {tab.label}
              </span>
            </div>
          );

          if (tab.id === 'chat' || tab.id === 'search') {
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                className="flex flex-1 items-center justify-center"
              >
                {content}
              </button>
            );
          }

          return (
            <Link key={tab.id} href={tab.href} className="flex flex-1 items-center justify-center">
              {content}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
