'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Brain, Sparkles, Clock, ArrowRight, Zap, Shield, Globe } from 'lucide-react';

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
    color: 'bg-purple-500',
  },
  {
    title: 'AI understands',
    description: 'Smart categorization into 12 categories. No folders, no tags, no effort.',
    icon: Brain,
    color: 'bg-violet-500',
  },
  {
    title: 'Perfect recall',
    description: 'Find anything instantly. Content surfaces when you need it most.',
    icon: Clock,
    color: 'bg-fuchsia-500',
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
          {/* Large purple gradient blob */}
          <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-purple-200 via-violet-100 to-transparent opacity-60 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-fuchsia-100 via-purple-100 to-transparent opacity-50 blur-3xl" />

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
              <span className="inline-flex items-center gap-2 rounded-full bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-700 ring-1 ring-purple-100">
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
                className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-violet-600 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-purple-500/25 transition-all hover:shadow-purple-500/40 hover:scale-105"
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
            <span className="text-label-small text-purple-600 mb-4 block">How it works</span>
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
                  <div className="relative h-full rounded-3xl bg-white p-8 shadow-sm ring-1 ring-gray-100 transition-all duration-300 hover:shadow-lg hover:ring-purple-100 hover:-translate-y-1">
                    {/* Step number */}
                    <div className="absolute -top-4 left-8 flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-sm font-bold text-white shadow-lg">
                      {index + 1}
                    </div>

                    {/* Icon */}
                    <div className={`mb-6 mt-4 flex h-14 w-14 items-center justify-center rounded-2xl ${feature.color}`}>
                      <Icon className="h-7 w-7 text-white" />
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
              <div className="relative aspect-square rounded-3xl bg-gradient-to-br from-purple-100 via-violet-50 to-fuchsia-50 p-8 lg:p-12">
                {/* Decorative elements */}
                <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-purple-100" />

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
                    <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center">
                      <Brain className="h-5 w-5 text-purple-600" />
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
                    <div className="h-10 w-10 rounded-xl bg-violet-100 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-violet-600" />
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
              <motion.span variants={fadeUp} className="text-label-small text-purple-600 mb-4 block">
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
                {benefits.map((benefit) => {
                  const Icon = benefit.icon;
                  return (
                    <motion.div
                      key={benefit.title}
                      variants={fadeUp}
                      className="flex items-start gap-4"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-100">
                        <Icon className="h-6 w-6 text-purple-600" />
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
        {/* Purple gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-violet-600 to-purple-700" />

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
            className="heading-section text-4xl sm:text-5xl lg:text-6xl text-white mb-6"
          >
            Ready to remember everything?
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="text-lg sm:text-xl text-purple-100 mb-10 max-w-2xl mx-auto"
          >
            Start capturing your thoughts today. It&apos;s free to get started.
          </motion.p>
          <motion.div variants={fadeUp}>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-full bg-white px-10 py-4 text-lg font-semibold text-purple-700 shadow-lg transition-all hover:bg-gray-50 hover:scale-105"
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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center">
              <img
                src="/logo.png"
                alt="MindStash"
                className="h-8 sm:h-10 w-auto"
              />
            </div>

            {/* Links */}
            <div className="flex items-center gap-8">
              <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                Login
              </Link>
              <Link href="/register" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                Sign up
              </Link>
            </div>

            {/* Copyright */}
            <p className="text-sm text-gray-400">
              2024 MindStash. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
