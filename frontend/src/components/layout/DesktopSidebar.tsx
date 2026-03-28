'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  MessageSquare,
  User,
  Users,
  BarChart3,
  Shield,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Zap,
  Star,
  Crown,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useBillingStatus } from '@/lib/hooks/useBilling';
import { useToast } from '@/components/Providers';

// =============================================================================
// SIDEBAR COLLAPSE PERSISTENCE
// =============================================================================

const SIDEBAR_COLLAPSED_KEY = 'mindstash_sidebar_collapsed';

function getInitialCollapsed(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
}

// =============================================================================
// NAV ITEM
// =============================================================================

interface NavItemProps {
  href: string;
  icon: typeof Home;
  label: string;
  isActive: boolean;
  collapsed: boolean;
  onClick?: () => void;
  badge?: number;
  /** Soft highlight: just color the text/icon, no background */
  softHighlight?: boolean;
}

function NavItem({ href, icon: Icon, label, isActive, collapsed, onClick, badge, softHighlight }: NavItemProps) {
  const content = (
    <div
      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
        isActive
          ? 'bg-[#EA7B7B]/10 text-[#C44545]'
          : softHighlight
          ? 'text-[#EA7B7B] hover:bg-gray-50'
          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
      } ${collapsed ? 'justify-center' : ''}`}
    >
      <Icon className={`h-[18px] w-[18px] shrink-0 ${isActive || softHighlight ? 'text-[#EA7B7B]' : ''}`} />
      {!collapsed && <span className="truncate">{label}</span>}
      {!collapsed && badge !== undefined && badge > 0 && (
        <span className="ml-auto rounded-full bg-[#EA7B7B]/10 px-2 py-0.5 text-[10px] font-bold text-[#EA7B7B]">
          {badge}
        </span>
      )}
      {/* Tooltip when collapsed */}
      {collapsed && (
        <div className="pointer-events-none absolute left-full ml-2 hidden rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg group-hover:block">
          {label}
          {badge !== undefined && badge > 0 && (
            <span className="ml-1.5 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px]">{badge}</span>
          )}
        </div>
      )}
    </div>
  );

  if (onClick) {
    return <button onClick={onClick} className="w-full text-left">{content}</button>;
  }

  return <Link href={href}>{content}</Link>;
}

// =============================================================================
// PLAN BADGE (SIDEBAR VERSION)
// =============================================================================

function SidebarPlanBadge({ collapsed }: { collapsed: boolean }) {
  const { data: status } = useBillingStatus();
  if (!status) return null;

  const { plan } = status;

  const PLAN_META = {
    free: { icon: Zap, label: 'Free plan', bg: '#F9FAFB', text: '#6B7280', iconColor: '#9CA3AF', accent: '#6B7280' },
    starter: { icon: Star, label: 'Starter', bg: '#FFF5F5', text: '#C44545', iconColor: '#EA7B7B', accent: '#EA7B7B' },
    pro: { icon: Crown, label: 'Pro', bg: '#FFFBEB', text: '#92680A', iconColor: '#D4A012', accent: '#D4A012' },
  } as const;

  const meta = PLAN_META[plan as keyof typeof PLAN_META] ?? PLAN_META.free;
  const Icon = meta.icon;

  if (collapsed) {
    return (
      <Link href="/profile?tab=billing" className="group relative flex justify-center">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl transition-all hover:scale-105"
          style={{ backgroundColor: meta.bg }}
        >
          <Icon className="h-4 w-4" style={{ color: meta.iconColor }} />
        </div>
        <div className="pointer-events-none absolute left-full ml-2 hidden rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg group-hover:block">
          {meta.label}
        </div>
      </Link>
    );
  }

  return (
    <Link
      href="/profile?tab=billing"
      className="flex items-center gap-2.5 rounded-xl p-2.5 transition-all hover:bg-gray-50"
    >
      <div
        className="flex h-8 w-8 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${meta.accent}15` }}
      >
        <Icon className="h-4 w-4" style={{ color: meta.accent }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold" style={{ color: meta.text }}>{meta.label}</p>
        {plan === 'free' && (
          <p className="flex items-center gap-0.5 text-[10px] text-gray-400">
            Upgrade <ArrowRight className="h-2.5 w-2.5" />
          </p>
        )}
      </div>
    </Link>
  );
}

// =============================================================================
// DESKTOP SIDEBAR
// =============================================================================

interface DesktopSidebarProps {
  onChatToggle?: () => void;
  chatActive?: boolean;
}

export function DesktopSidebar({ onChatToggle, chatActive }: DesktopSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [collapsed, setCollapsed] = useState(getInitialCollapsed);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
  }, [collapsed]);

  const handleLogout = () => {
    logout();
    showToast('Logged out successfully', 'success');
  };

  return (
    <aside
      className={`hidden lg:flex flex-col border-r border-gray-100 bg-white transition-all duration-300 ${
        collapsed ? 'w-[68px]' : 'w-[220px]'
      }`}
    >
      {/* Logo */}
      <div className={`flex items-center border-b border-gray-50 px-4 py-4 ${collapsed ? 'justify-center' : ''}`}>
        <Link href="/dashboard" className="shrink-0">
          {collapsed ? (
            <img src="/logo-icon.png" alt="MindStash" className="h-8 w-8 rounded-lg" />
          ) : (
            <img src="/logo.png" alt="MindStash" className="h-9 w-auto" />
          )}
        </Link>
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        <NavItem
          href="/dashboard"
          icon={Home}
          label="Dashboard"
          isActive={pathname === '/dashboard'}
          collapsed={collapsed}
        />
        <NavItem
          href="#"
          icon={MessageSquare}
          label="AI Chat"
          isActive={false}
          softHighlight={!!chatActive}
          collapsed={collapsed}
          onClick={onChatToggle}
        />
        <NavItem
          href="/profile"
          icon={User}
          label="Profile"
          isActive={pathname.startsWith('/profile')}
          collapsed={collapsed}
        />

        {/* Admin section */}
        {user?.is_admin && (
          <>
            <div className={`my-3 border-t border-gray-100 ${collapsed ? 'mx-1' : ''}`} />
            {!collapsed && (
              <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Admin
              </p>
            )}
            <NavItem
              href="/admin/users"
              icon={Users}
              label="Users"
              isActive={pathname === '/admin/users'}
              collapsed={collapsed}
            />
            <NavItem
              href="/admin/analytics"
              icon={BarChart3}
              label="Analytics"
              isActive={pathname === '/admin/analytics'}
              collapsed={collapsed}
            />
          </>
        )}
      </nav>

      {/* Bottom section */}
      <div className="space-y-2 border-t border-gray-100 px-3 py-4">
        <SidebarPlanBadge collapsed={collapsed} />

        {/* Sign out */}
        <button
          onClick={handleLogout}
          className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-400 transition-all hover:bg-red-50 hover:text-red-500 ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span>Sign out</span>}
          {collapsed && (
            <div className="pointer-events-none absolute left-full ml-2 hidden rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg group-hover:block">
              Sign out
            </div>
          )}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex w-full items-center justify-center rounded-xl py-2 text-gray-300 transition-colors hover:bg-gray-50 hover:text-gray-500"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  );
}
