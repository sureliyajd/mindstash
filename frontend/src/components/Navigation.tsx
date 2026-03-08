'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';

export default function Navigation() {
  const [isExploreOpen, setIsExploreOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <img
              src="/logo.png"
              alt="MindStash"
              className="h-10 sm:h-12 w-auto"
            />
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-3">
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

              {/* Dropdown menu */}
              {isExploreOpen && (
                <div
                  className="absolute top-full right-0 mt-2 w-48 rounded-2xl bg-white shadow-xl ring-1 ring-gray-100 py-2"
                  onMouseLeave={() => setIsExploreOpen(false)}
                >
                  <Link
                    href="/about"
                    className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setIsExploreOpen(false)}
                  >
                    About
                  </Link>
                  <Link
                    href="/tech"
                    className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setIsExploreOpen(false)}
                  >
                    Tech Stack
                  </Link>
                  <Link
                    href="/showcase"
                    className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setIsExploreOpen(false)}
                  >
                    Showcase
                  </Link>
                </div>
              )}
            </div>

            <Link
              href="/login"
              className="px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:text-gray-900"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-gray-800 hover:scale-105"
            >
              Sign up free
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
