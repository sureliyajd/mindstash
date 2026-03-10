'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, Menu, X } from 'lucide-react';

export default function Navigation() {
  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
            {/* Explore dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsExploreOpen(!isExploreOpen)}
                onMouseEnter={() => setIsExploreOpen(true)}
                className="flex items-center gap-1 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:text-gray-900"
              >
                Explore
                <ChevronDown className={`h-4 w-4 transition-transform ${isExploreOpen ? 'rotate-180' : ''}`} />
              </button>

              {isExploreOpen && (
                <div
                  className="absolute top-full right-0 mt-2 w-48 rounded-2xl bg-white shadow-xl ring-1 ring-gray-100 py-2"
                  onMouseLeave={() => setIsExploreOpen(false)}
                >
                  <Link href="/about" className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setIsExploreOpen(false)}>About</Link>
                  <Link href="/tech" className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setIsExploreOpen(false)}>Tech Stack</Link>
                  <Link href="/showcase" className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setIsExploreOpen(false)}>Showcase</Link>
                </div>
              )}
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

            <div className="pt-3 border-t border-gray-100">
              <Link href="/login" className="block px-3 py-3 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Log in</Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
