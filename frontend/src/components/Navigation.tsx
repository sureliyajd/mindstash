'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ChevronDown, Menu, X, BookOpen, Cpu, Play, DollarSign, Mail as MailIcon } from 'lucide-react';

const exploreLinks = [
  {
    href: '/about',
    label: 'About',
    description: 'Our story and mission',
    icon: BookOpen,
    color: '#EA7B7B',
  },
  {
    href: '/tech',
    label: 'Tech Stack',
    description: 'Under the hood',
    icon: Cpu,
    color: '#79C9C5',
  },
  {
    href: '/showcase',
    label: 'Showcase',
    description: 'See it in action',
    icon: Play,
    color: '#FACE68',
  },
  {
    href: '/pricing',
    label: 'Pricing',
    description: 'Plans that fit your needs',
    icon: DollarSign,
    color: '#93DA97',
  },
  // {
  //   href: '/contact',
  //   label: 'Contact',
  //   description: 'Get in touch with us',
  //   icon: MailIcon,
  //   color: '#FF8364',
  // },
];

export default function Navigation() {
  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const megaMenuRef = useRef<HTMLDivElement>(null);

  const openMenu = useCallback(() => {
    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current);
      closeTimeout.current = null;
    }
    setIsExploreOpen(true);
  }, []);

  const closeMenu = useCallback(() => {
    closeTimeout.current = setTimeout(() => setIsExploreOpen(false), 200);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsExploreOpen(false);
    };
    if (isExploreOpen) {
      document.addEventListener('keydown', handleKey);
      return () => document.removeEventListener('keydown', handleKey);
    }
  }, [isExploreOpen]);

  // Close mobile menu on route change / resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsMobileMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center" onClick={() => setIsMobileMenuOpen(false)}>
            <img src="/logo.png" alt="MindStash" className="h-10 sm:h-12 w-auto" />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-3">
            {/* Explore mega menu */}
            <div
              className="relative"
              ref={megaMenuRef}
              onMouseEnter={openMenu}
              onMouseLeave={closeMenu}
            >
              <button
                onClick={() => setIsExploreOpen((v) => !v)}
                className="flex items-center gap-1 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:text-gray-900"
                aria-expanded={isExploreOpen}
                aria-haspopup="true"
              >
                Explore
                <ChevronDown
                  className="h-4 w-4 transition-transform duration-200"
                  style={{ transform: isExploreOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
              </button>

              {/* Mega menu panel */}
              <div
                className="absolute top-full right-0 pt-3 transition-all duration-200 origin-top-right"
                style={{
                  opacity: isExploreOpen ? 1 : 0,
                  transform: isExploreOpen ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(-8px)',
                  pointerEvents: isExploreOpen ? 'auto' : 'none',
                }}
              >
                <div className="w-[320px] rounded-2xl bg-white shadow-2xl ring-1 ring-gray-200/60 p-2">
                  {exploreLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setIsExploreOpen(false)}
                        className="group flex items-center gap-4 rounded-xl px-4 py-3.5 transition-colors duration-150 hover:bg-gray-50"
                      >
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110"
                          style={{ backgroundColor: `${link.color}15` }}
                        >
                          <Icon className="h-5 w-5" style={{ color: link.color }} />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900 group-hover:text-gray-900">
                            {link.label}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {link.description}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            <Link href="/login" className="px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:text-gray-900">
              Log in
            </Link>
            <Link href="/register" className="rounded-full bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-gray-800 hover:scale-105">
              Sign up free
            </Link>
          </div>

          {/* Mobile: Sign up + Hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              href="/register"
              className="rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Sign up
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex items-center justify-center h-10 w-10 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white/95 backdrop-blur-lg">
          <div className="px-6 py-4 space-y-1">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 pb-2">Explore</div>
            <Link href="/about" className="block px-3 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>About</Link>
            <Link href="/tech" className="block px-3 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Tech Stack</Link>
            <Link href="/showcase" className="block px-3 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Showcase</Link>
            <Link href="/pricing" className="block px-3 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Pricing</Link>

            <div className="pt-3 border-t border-gray-100">
              <Link href="/login" className="block px-3 py-3 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Log in</Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
