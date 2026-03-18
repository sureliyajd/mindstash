'use client';

import Link from 'next/link';
import { Globe, Mail, Github, Linkedin } from 'lucide-react';

// X (Twitter) icon as inline SVG since lucide uses the old bird
function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

const socialLinks = [
  {
    label: 'Website',
    href: 'https://heyjaydeep.website/',
    icon: Globe,
    display: 'heyjaydeep.website',
    external: true,
  },
  {
    label: 'GitHub',
    href: 'https://github.com/sureliyajd/',
    icon: Github,
    display: 'sureliyajd',
    external: true,
  },
  {
    label: 'LinkedIn',
    href: 'https://linkedin.com/in/jd-sureliya',
    icon: Linkedin,
    display: 'jd-sureliya',
    external: true,
  },
  {
    label: 'X',
    href: 'https://x.com/jaydeepsurelia',
    icon: null, // uses XIcon
    display: '@jaydeepsurelia',
    external: true,
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">

        {/* Main footer row */}
        <div className="py-12 grid gap-12 md:grid-cols-2 md:gap-16 items-start">

          {/* Left — Brand */}
          <div>
            <Link href="/" className="inline-flex items-center mb-4">
              <img src="/logo.png" alt="MindStash" className="h-9 w-auto" />
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
              Never lose a thought again. AI-powered personal knowledge management — capture, organize, and recall anything.
            </p>
          </div>

          {/* Right — Creator */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
              Created by
            </p>

            <div className="flex items-start gap-4 mb-5">
              {/* Avatar */}
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EA7B7B]/10 text-sm font-bold text-[#C44545]">
                JD
              </div>
              <div>
                <div className="font-bold text-gray-900 text-base leading-tight">Jaydeep Sureliya</div>
                <div className="text-sm text-gray-500 mt-0.5">Software Engineer &amp; Builder</div>
              </div>
            </div>

            {/* Social links */}
            <div className="grid grid-cols-2 gap-2 mb-5">
              {socialLinks.map(({ label, href, icon: Icon, display, external }) => (
                <a
                  key={label}
                  href={href}
                  target={external ? '_blank' : undefined}
                  rel={external ? 'noopener noreferrer' : undefined}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-gray-600 bg-gray-50 hover:bg-[#EA7B7B]/8 hover:text-[#C44545] transition-colors group"
                >
                  {Icon ? (
                    <Icon className="h-3.5 w-3.5 shrink-0 text-gray-400 group-hover:text-[#EA7B7B] transition-colors" />
                  ) : (
                    <XIcon className="h-3.5 w-3.5 shrink-0 text-gray-400 group-hover:text-[#EA7B7B] transition-colors" />
                  )}
                  <span className="truncate">{display}</span>
                </a>
              ))}
            </div>

            {/* Inquiry note */}
            <p className="text-xs text-gray-400 leading-relaxed">
              For any queries or inquiries,{' '}
              <a
                href="mailto:jaydeepsureliya.jd@gmail.com"
                className="text-[#EA7B7B] font-medium hover:underline"
              >
                feel free to reach out
              </a>
              .
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-100 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} MindStash. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/about" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">About</Link>
            <Link href="/tech" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Tech Stack</Link>
            <Link href="/showcase" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Showcase</Link>
            <Link href="/terms" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Terms</Link>
            <Link href="/privacy" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Privacy</Link>
            <Link href="/refund" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Refund</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
