'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Brain, Sparkles, Clock, ArrowRight, Zap, Shield, Globe, Mail } from 'lucide-react';

// =============================================================================
// ANIMATION VARIANTS - SPOTIFY STYLE
// =============================================================================

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const stagger = {
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
};

// =============================================================================
// FEATURE DATA
// =============================================================================

const features = [
  {
    title: 'Drop anything',
    description: 'Thoughts, links, reminders, ideas. Just type and forget about organizing.',
    icon: Sparkles,
    color: 'bg-[#79C9C5]', // Teal
  },
  {
    title: 'AI understands',
    description: 'Smart categorization into 12 categories. No folders, no tags, no effort.',
    icon: Brain,
    color: 'bg-[#FACE68]', // Yellow
  },
  {
    title: 'Perfect recall',
    description: 'Find anything instantly. Content surfaces when you need it most.',
    icon: Clock,
    color: 'bg-[#93DA97]', // Green
  },
];

const benefits = [
  {
    icon: Zap,
    title: 'Lightning fast',
    description: 'Capture in seconds, not minutes',
  },
  {
    icon: Shield,
    title: 'Private & secure',
    description: 'Your thoughts, your data, always',
  },
  {
    icon: Globe,
    title: 'Access anywhere',
    description: 'Web, mobile, everywhere you are',
  },
];

// =============================================================================
// LANDING PAGE - SPOTIFY INSPIRED
// =============================================================================

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* ===================================================================== */}
      {/* NAVIGATION */}
      {/* ===================================================================== */}
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

      {/* ===================================================================== */}
      {/* HERO SECTION */}
      {/* ===================================================================== */}
      <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-32">
        {/* Background decoration */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* Soft pastel blobs */}
          <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-[#EA7B7B]/10 opacity-60 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-[#79C9C5]/10 opacity-50 blur-3xl" />

          {/* Floating brain gif */}
          <motion.div
            className="absolute top-1/4 right-10 opacity-10 hidden lg:block"
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            <img src="/images/brain.gif" alt="" className="h-32 w-32" />
          </motion.div>
        </div>

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            className="mx-auto max-w-4xl text-center"
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            {/* Badge */}
            <motion.div variants={fadeUp} className="mb-8">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#EA7B7B]/10 px-4 py-2 text-sm font-semibold text-[#C44545] ring-1 ring-[#EA7B7B]/20">
                <Sparkles className="h-4 w-4" />
                AI-Powered Memory
              </span>
            </motion.div>

            {/* Main heading */}
            <motion.h1
              className="heading-hero text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-gray-900"
              variants={fadeUp}
            >
              Never lose a
              <br />
              <span className="text-gradient-purple">thought again</span>
            </motion.h1>

            {/* Subheading */}
            <motion.p
              className="mt-8 text-lg sm:text-xl md:text-2xl text-gray-500 max-w-2xl mx-auto leading-relaxed"
              variants={fadeUp}
            >
              Drop anything. We organize everything.
              <br className="hidden sm:block" />
              Your AI-powered second brain.
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4"
              variants={fadeUp}
            >
              <Link
                href="/register"
                className="group flex items-center gap-2 rounded-full bg-[#EA7B7B] px-8 py-4 text-lg font-semibold shadow-lg shadow-[#EA7B7B]/25 transition-all hover:bg-[#D66B6B] hover:shadow-[#EA7B7B]/40 hover:scale-105"
                style={{ color: 'white' }}
              >
                Start for free
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/login"
                className="flex items-center gap-2 rounded-full bg-gray-100 px-8 py-4 text-lg font-semibold text-gray-700 transition-all hover:bg-gray-200"
              >
                I have an account
              </Link>
            </motion.div>

            {/* Social proof */}
            <motion.p
              className="mt-10 text-sm text-gray-400"
              variants={fadeIn}
            >
              Join thousands who never forget
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* HOW IT WORKS SECTION */}
      {/* ===================================================================== */}
      <section className="relative py-24 lg:py-32 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* Section header */}
          <motion.div
            className="text-center mb-20"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeUp}
          >
            <span className="text-label-small text-[#EA7B7B] mb-4 block">How it works</span>
            <h2 className="heading-section text-4xl sm:text-5xl text-gray-900">
              Simpler than you think
            </h2>
          </motion.div>

          {/* Feature cards */}
          <motion.div
            className="grid gap-8 md:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={stagger}
          >
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  variants={scaleIn}
                  className="group relative"
                >
                  <div className="relative h-full rounded-3xl bg-white p-8 shadow-sm ring-1 ring-gray-100 transition-all duration-300 hover:shadow-lg hover:ring-[#EA7B7B]/30 hover:-translate-y-1">
                    {/* Step number */}
                    <div className="absolute -top-4 left-8 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold shadow-lg" style={{ color: 'white', backgroundColor: index === 0 ? '#79C9C5' : index === 1 ? '#FACE68' : '#93DA97' }}>
                      {index + 1}
                    </div>

                    {/* Icon */}
                    <div className={`mb-6 mt-4 flex h-14 w-14 items-center justify-center rounded-2xl ${feature.color}`}>
                      <Icon className="h-7 w-7" style={{ color: 'white' }} />
                    </div>

                    {/* Content */}
                    <h3 className="heading-card text-xl text-gray-900 mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-500 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* BENEFITS SECTION */}
      {/* ===================================================================== */}
      <section className="py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-16 lg:grid-cols-2 lg:gap-24 items-center">
            {/* Left side - Image/Animation */}
            <motion.div
              className="relative"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={scaleIn}
            >
              <div className="relative aspect-square rounded-3xl bg-[#EA7B7B]/10 p-8 lg:p-12">
                {/* Decorative elements */}
                <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-[#EA7B7B]/20" />

                {/* Wave animation */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <img
                    src="/images/wave-animation.gif"
                    alt=""
                    className="h-64 w-64 object-contain opacity-60"
                  />
                </div>

                {/* Floating cards preview */}
                <motion.div
                  className="absolute top-8 right-8 rounded-2xl bg-white p-4 shadow-xl ring-1 ring-gray-100"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-[#FACE68]/20 flex items-center justify-center">
                      <Brain className="h-5 w-5 text-[#C9A030]" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">Ideas</div>
                      <div className="text-xs text-gray-400">12 items</div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="absolute bottom-12 left-8 rounded-2xl bg-white p-4 shadow-xl ring-1 ring-gray-100"
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-[#FF8364]/20 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-[#D65E3F]" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">Tasks</div>
                      <div className="text-xs text-gray-400">8 items</div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Right side - Content */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={stagger}
            >
              <motion.span variants={fadeUp} className="text-label-small text-[#EA7B7B] mb-4 block">
                Why MindStash
              </motion.span>
              <motion.h2 variants={fadeUp} className="heading-section text-4xl sm:text-5xl text-gray-900 mb-8">
                Your thoughts deserve better
              </motion.h2>
              <motion.p variants={fadeUp} className="text-lg text-gray-500 mb-12 leading-relaxed">
                Stop losing brilliant ideas to forgetfulness. MindStash captures everything and uses AI to organize it perfectly.
              </motion.p>

              {/* Benefits list */}
              <motion.div className="space-y-6" variants={stagger}>
                {benefits.map((benefit, index) => {
                  const Icon = benefit.icon;
                  const colors = [
                    { bg: 'bg-[#79C9C5]/20', text: 'text-[#5AACA8]' },
                    { bg: 'bg-[#FACE68]/20', text: 'text-[#C9A030]' },
                    { bg: 'bg-[#93DA97]/20', text: 'text-[#5EB563]' },
                  ];
                  const color = colors[index % colors.length];
                  return (
                    <motion.div
                      key={benefit.title}
                      variants={fadeUp}
                      className="flex items-start gap-4"
                    >
                      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${color.bg}`}>
                        <Icon className={`h-6 w-6 ${color.text}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">{benefit.title}</h3>
                        <p className="text-gray-500">{benefit.description}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* CTA SECTION */}
      {/* ===================================================================== */}
      <section className="relative py-24 lg:py-32 overflow-hidden">
        {/* Solid pastel coral background */}
        <div className="absolute inset-0 bg-[#EA7B7B]" />

        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 h-full w-full" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>

        <motion.div
          className="relative mx-auto max-w-4xl px-6 lg:px-8 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
        >
          <motion.h2
            variants={fadeUp}
            className="heading-section text-4xl sm:text-5xl lg:text-6xl mb-6"
            style={{ color: 'white' }}
          >
            Ready to remember everything?
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="text-lg sm:text-xl mb-10 max-w-2xl mx-auto"
            style={{ color: 'rgba(255, 255, 255, 0.9)' }}
          >
            Start capturing your thoughts today. It&apos;s free to get started.
          </motion.p>
          <motion.div variants={fadeUp}>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-full bg-white px-10 py-4 text-lg font-semibold text-[#C44545] shadow-lg transition-all hover:bg-gray-50 hover:scale-105"
            >
              Get started free
              <ArrowRight className="h-5 w-5" />
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ===================================================================== */}
      {/* FOOTER */}
      {/* ===================================================================== */}
      <footer className="border-t border-gray-100 py-12 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col gap-8">
            {/* Top row - Logo and Support */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              {/* Logo */}
              <div className="flex items-center">
                <img
                  src="/logo.png"
                  alt="MindStash"
                  className="h-8 sm:h-10 w-auto"
                />
              </div>

              {/* Support & Contact */}
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                <span className="text-sm font-medium text-gray-500">Support & Contact:</span>
                <div className="flex items-center gap-4">
                  <a
                    href="https://heyjaydeep.website/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#EA7B7B] transition-colors"
                  >
                    <Globe className="h-4 w-4" />
                    heyjaydeep.website
                  </a>
                  <a
                    href="mailto:jaydeepsureliya.jd@gmail.com"
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#EA7B7B] transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                    jaydeepsureliya.jd@gmail.com
                  </a>
                </div>
              </div>
            </div>

            {/* Bottom row - Copyright */}
            <div className="flex justify-center sm:justify-start border-t border-gray-100 pt-6">
              <p className="text-sm text-gray-400">
                {new Date().getFullYear()} MindStash. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
