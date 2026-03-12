'use client';

import { motion } from 'framer-motion';
import { usePageView } from '@/lib/hooks/useAnalytics';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import LandingAnimations from '@/components/LandingAnimations';
import ScenarioExplorer from '@/components/ScenarioExplorer';
import PerspectivesSlider from '@/components/PerspectivesSlider';
import Footer from '@/components/Footer';
import {
  Brain,
  Sparkles,
  Clock,
  ArrowRight,
  Zap,
  Shield,
  Globe,
  Mail,
  MessageSquare,
  BookOpen,
  ShoppingCart,
  Users,
  Target,
  Lightbulb,
  CheckCircle2,
  TrendingUp,
  Search,
  Bot
} from 'lucide-react';

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
// DATA - REAL-WORLD USE CASES
// =============================================================================


const problems = [
  {
    problem: 'Thoughts vanish minutes after they appear',
    solution: '500-char quick capture. Zero friction. Always accessible.',
    icon: Zap,
  },
  {
    problem: 'Organizing takes longer than capturing',
    solution: 'AI categorizes into 12 smart categories automatically.',
    icon: Brain,
  },
  {
    problem: 'Finding what you saved is impossible',
    solution: 'AI chat agent searches, filters, and surfaces exactly what you need.',
    icon: Search,
  },
  {
    problem: 'Important things get buried and forgotten',
    solution: 'Smart notifications and daily AI briefings keep you on track.',
    icon: Clock,
  },
];

const categories = [
  { name: 'Ideas', icon: Lightbulb, color: 'bg-[#FACE68]' },
  { name: 'Tasks', icon: CheckCircle2, color: 'bg-[#EA7B7B]' },
  { name: 'Read', icon: BookOpen, color: 'bg-[#79C9C5]' },
  { name: 'Watch', icon: Globe, color: 'bg-[#FF8364]' },
  { name: 'People', icon: Users, color: 'bg-[#93DA97]' },
  { name: 'Goals', icon: Target, color: 'bg-[#FACE68]' },
  { name: 'Buy', icon: ShoppingCart, color: 'bg-[#EA7B7B]' },
  { name: 'Notes', icon: MessageSquare, color: 'bg-[#79C9C5]' },
];

const aiCapabilities = [
  {
    title: 'Intelligent Search',
    description: 'Natural language queries like "show me all articles about productivity from last month"',
    icon: Search,
  },
  {
    title: 'Smart Surfacing',
    description: 'AI knows when to remind you about that book recommendation or pending task',
    icon: TrendingUp,
  },
  {
    title: 'Context Understanding',
    description: 'Understands urgency, time-sensitivity, and priority without you specifying',
    icon: Brain,
  },
  {
    title: 'Daily Briefings',
    description: 'Personalized morning digest of what matters today, delivered to your inbox',
    icon: Mail,
  },
];

// =============================================================================
// LANDING PAGE - PROBLEM-SOLVING FOCUSED
// =============================================================================

export default function Home() {
  usePageView('/');
  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* ===================================================================== */}
      {/* HERO SECTION - PROBLEM STATEMENT */}
      {/* ===================================================================== */}
      <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-32">
        {/* Background decoration */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-[#EA7B7B]/10 opacity-60 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-[#79C9C5]/10 opacity-50 blur-3xl" />
          <LandingAnimations variant="hero" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            className="mx-auto max-w-5xl text-center"
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            {/* Badge */}
            <motion.div variants={fadeUp} className="mb-8">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#EA7B7B]/10 px-4 py-2 text-sm font-semibold text-[#C44545] ring-1 ring-[#EA7B7B]/20">
                <Bot className="h-4 w-4" />
                AI-Powered Memory Assistant
              </span>
            </motion.div>

            {/* Main heading */}
            <motion.h1
              className="heading-hero text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-gray-900"
              variants={fadeUp}
            >
              Stop losing your
              <br />
              <span className="text-gradient-purple">best thoughts</span>
            </motion.h1>

            {/* Subheading */}
            <motion.p
              className="mt-8 text-lg sm:text-xl md:text-2xl text-gray-500 max-w-3xl mx-auto leading-relaxed"
              variants={fadeUp}
            >
              That brilliant idea at 2 AM. The article you meant to read. The task you forgot.
              <br className="hidden sm:block" />
              <span className="font-semibold text-gray-700">MindStash remembers, so you don't have to.</span>
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
                Start capturing for free
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/login"
                className="flex items-center gap-2 rounded-full bg-gray-100 px-8 py-4 text-lg font-semibold text-gray-700 transition-all hover:bg-gray-200"
              >
                I have an account
              </Link>
            </motion.div>

            {/* Product Hunt badge */}
            <motion.div variants={fadeUp} className="mt-10 flex justify-center">
              <a
                href="https://www.producthunt.com/products/mindstash?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-mindstash"
                target="_blank"
                rel="noopener noreferrer"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt="MindStash - Never lose a thought again. | Product Hunt"
                  width={250}
                  height={54}
                  src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1095636&theme=light&t=1773260745830"
                />
              </a>
            </motion.div>

            {/* Stats */}
            <motion.div
              className="mt-12 grid grid-cols-3 gap-8 max-w-2xl mx-auto"
              variants={fadeIn}
            >
              <div>
                <div className="text-3xl font-bold text-gray-900">10s</div>
                <div className="text-sm text-gray-500 mt-1">to capture</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">12</div>
                <div className="text-sm text-gray-500 mt-1">smart categories</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">0</div>
                <div className="text-sm text-gray-500 mt-1">manual organizing</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* REAL-WORLD SCENARIOS */}
      {/* ===================================================================== */}
      <ScenarioExplorer />

      {/* ===================================================================== */}
      {/* PROBLEMS WE SOLVE */}
      {/* ===================================================================== */}
      <section className="relative py-24 lg:py-32">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <LandingAnimations variant="features" />
        </div>
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-16 lg:grid-cols-2 lg:gap-24 items-center">
            {/* Left side - Content */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={stagger}
            >
              <motion.span variants={fadeUp} className="text-label-small text-[#EA7B7B] mb-4 block">
                The Problem
              </motion.span>
              <motion.h2 variants={fadeUp} className="heading-section text-4xl sm:text-5xl text-gray-900 mb-8">
                Your brain is amazing.
                <br />
                But it's not a hard drive.
              </motion.h2>
              <motion.p variants={fadeUp} className="text-lg text-gray-500 mb-12 leading-relaxed">
                You have incredible ideas, important tasks, valuable content to consume.
                But between work, life, and endless distractions, most of it gets lost in the noise.
              </motion.p>

              {/* Problems list */}
              <motion.div className="space-y-6" variants={stagger}>
                {problems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.problem}
                      variants={fadeUp}
                      className="flex items-start gap-4"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EA7B7B]/10">
                        <Icon className="h-6 w-6 text-[#C44545]" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">{item.problem}</h3>
                        <p className="text-gray-500 flex items-start gap-2">
                          <CheckCircle2 className="h-5 w-5 text-[#93DA97] shrink-0 mt-0.5" />
                          <span>{item.solution}</span>
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </motion.div>

            {/* Right side - Visual */}
            <motion.div
              className="relative"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={scaleIn}
            >
              <div className="relative aspect-square rounded-3xl bg-gradient-to-br from-[#EA7B7B]/10 via-[#FACE68]/10 to-[#79C9C5]/10 p-8 lg:p-12">
                {/* Decorative border */}
                <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-gray-200" />

                {/* Category grid showcase */}
                <div className="relative h-full grid grid-cols-2 gap-4">
                  {categories.map((category, index) => {
                    const Icon = category.icon;
                    return (
                      <motion.div
                        key={category.name}
                        className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-gray-100 flex flex-col items-center justify-center text-center"
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.05, y: -4 }}
                      >
                        <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl ${category.color}`}>
                          <Icon className="h-6 w-6" style={{ color: 'white' }} />
                        </div>
                        <div className="text-sm font-semibold text-gray-900">{category.name}</div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Floating label */}
                <motion.div
                  className="absolute -top-4 -right-4 rounded-2xl bg-[#EA7B7B] px-4 py-2 shadow-xl"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="text-sm font-semibold" style={{ color: 'white' }}>
                    Auto-organized
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* AI CAPABILITIES */}
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
            <span className="text-label-small text-[#EA7B7B] mb-4 block">Powered by AI</span>
            <h2 className="heading-section text-4xl sm:text-5xl text-gray-900 mb-6">
              Your intelligent assistant
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Not just storage. An AI agent that understands, organizes, and helps you find exactly what you need.
            </p>
          </motion.div>

          {/* Capabilities grid */}
          <motion.div
            className="grid gap-8 md:grid-cols-2 lg:grid-cols-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={stagger}
          >
            {aiCapabilities.map((capability) => {
              const Icon = capability.icon;
              return (
                <motion.div
                  key={capability.title}
                  variants={scaleIn}
                  className="group relative"
                >
                  <div className="relative h-full rounded-3xl bg-white p-8 shadow-sm ring-1 ring-gray-100 transition-all duration-300 hover:shadow-lg hover:ring-[#EA7B7B]/30 hover:-translate-y-1">
                    <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EA7B7B]/10">
                      <Icon className="h-7 w-7 text-[#C44545]" />
                    </div>
                    <h3 className="heading-card text-lg text-gray-900 mb-3">
                      {capability.title}
                    </h3>
                    <p className="text-gray-500 text-sm leading-relaxed">
                      {capability.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Chat example */}
          <motion.div
            className="mt-16 max-w-3xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={scaleIn}
          >
            <div className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-gray-100">
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EA7B7B]">
                  <MessageSquare className="h-5 w-5" style={{ color: 'white' }} />
                </div>
                <div className="font-semibold text-gray-900">Chat with your knowledge</div>
              </div>

              {/* Example messages */}
              <div className="space-y-4">
                <div className="flex justify-end">
                  <div className="rounded-2xl bg-[#EA7B7B]/10 px-4 py-3 max-w-[80%]">
                    <p className="text-sm text-gray-900">Show me all articles about AI from last month</p>
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-gray-100 px-4 py-3 max-w-[80%]">
                    <p className="text-sm text-gray-900">I found 7 articles about AI from February. Here are the top 3: "GPT-4 Guide", "Machine Learning Basics", and "AI in Healthcare"...</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="rounded-2xl bg-[#EA7B7B]/10 px-4 py-3 max-w-[80%]">
                    <p className="text-sm text-gray-900">What tasks do I have pending for this week?</p>
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-gray-100 px-4 py-3 max-w-[80%]">
                    <p className="text-sm text-gray-900">You have 5 pending tasks: 1. Buy mom's birthday gift (Due: Mar 10), 2. Review project proposal...</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Tech specs link */}
          <motion.div
            className="mt-12 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <Link
              href="/tech"
              className="inline-flex items-center gap-2 text-[#EA7B7B] font-semibold hover:gap-3 transition-all"
            >
              Explore the technical architecture
              <ArrowRight className="h-5 w-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* HOW IT WORKS - DARK EDITORIAL */}
      {/* ===================================================================== */}
      <section className="py-24 lg:py-32" style={{ backgroundColor: '#0D0D0D' }}>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">

          {/* Header */}
          <motion.div
            className="text-center mb-20"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeUp}
          >
            <span className="text-label-small mb-4 block" style={{ color: '#79C9C5' }}>How it works</span>
            <h2 className="heading-section text-4xl sm:text-5xl" style={{ color: 'white' }}>
              Three steps. That&apos;s it.
            </h2>
          </motion.div>

          {/* Steps grid */}
          <div className="relative">
            {/* Connecting gradient line — desktop only */}
            <div
              aria-hidden="true"
              className="hidden md:block absolute top-[3.25rem] left-[calc(16.66%+2.5rem)] right-[calc(16.66%+2.5rem)] h-px opacity-40"
              style={{ background: 'linear-gradient(90deg, #79C9C5, #FACE68, #93DA97)' }}
            />

            <motion.div
              className="grid gap-6 md:grid-cols-3"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              variants={stagger}
            >
              {[
                {
                  num: '01',
                  title: 'Capture',
                  desc: 'Type anything — a thought, link, task, or reminder. 500 characters keeps it instant and frictionless.',
                  stat: '10s',
                  statSub: 'average capture time',
                  color: '#79C9C5',
                  cardBg: '#0A1F1D',
                },
                {
                  num: '02',
                  title: 'AI Organizes',
                  desc: 'Our AI reads context, assigns one of 12 categories, generates tags, detects urgency, and estimates priority — automatically.',
                  stat: '12',
                  statSub: 'smart categories',
                  color: '#FACE68',
                  cardBg: '#1A160A',
                },
                {
                  num: '03',
                  title: 'Recall & Act',
                  desc: 'Search naturally, chat with your AI agent, or get smart notifications. Your thoughts surface exactly when you need them.',
                  stat: '0',
                  statSub: 'manual effort needed',
                  color: '#93DA97',
                  cardBg: '#0A1A0C',
                },
              ].map((step) => (
                <motion.div key={step.num} variants={fadeUp}>
                  <div
                    className="relative rounded-3xl p-8 lg:p-10 overflow-hidden transition-transform duration-300 hover:-translate-y-1"
                    style={{
                      backgroundColor: step.cardBg,
                      border: `1px solid ${step.color}22`,
                    }}
                  >
                    {/* Watermark number */}
                    <div
                      aria-hidden="true"
                      className="absolute -top-3 -right-1 text-[7rem] font-black leading-none select-none pointer-events-none"
                      style={{ color: step.color, opacity: 0.07 }}
                    >
                      {step.num}
                    </div>

                    {/* Step badge */}
                    <div
                      className="relative z-10 inline-flex items-center justify-center h-11 w-11 rounded-2xl text-sm font-bold mb-6"
                      style={{
                        backgroundColor: `${step.color}18`,
                        color: step.color,
                        border: `1.5px solid ${step.color}35`,
                      }}
                    >
                      {step.num}
                    </div>

                    <h3 className="relative z-10 text-xl font-bold mb-3" style={{ color: 'white' }}>{step.title}</h3>
                    <p className="relative z-10 text-sm leading-relaxed mb-7" style={{ color: '#9CA3AF' }}>{step.desc}</p>

                    {/* Stat card */}
                    <div
                      className="relative z-10 rounded-2xl p-4"
                      style={{
                        backgroundColor: `${step.color}12`,
                        border: `1px solid ${step.color}20`,
                      }}
                    >
                      <div className="text-2xl font-bold" style={{ color: step.color }}>{step.stat}</div>
                      <div className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{step.statSub}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

        </div>
      </section>

      {/* ===================================================================== */}
      {/* SOCIAL PROOF / BENEFITS */}
      {/* ===================================================================== */}
      <section className="py-24 lg:py-32 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <h2 className="heading-section text-4xl sm:text-5xl text-gray-900 mb-6">
              Everything you need. Nothing you don't.
            </h2>
          </motion.div>

          <motion.div
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {[
              { icon: Zap, text: 'Lightning-fast capture (10 seconds)' },
              { icon: Shield, text: 'Private & secure (your data stays yours)' },
              { icon: Globe, text: 'Access anywhere (web, mobile, soon)' },
              { icon: Brain, text: '12 smart categories (no manual sorting)' },
              { icon: MessageSquare, text: 'AI chat agent (natural language search)' },
              { icon: Mail, text: 'Daily AI briefings (know what matters)' },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.text}
                  variants={scaleIn}
                  className="flex items-center gap-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#EA7B7B]/10">
                    <Icon className="h-6 w-6 text-[#C44545]" />
                  </div>
                  <p className="font-medium text-gray-900">{item.text}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* PERSPECTIVES SLIDER */}
      {/* ===================================================================== */}
      <PerspectivesSlider />

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

        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <LandingAnimations variant="cta" />
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
            Start remembering everything
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="text-lg sm:text-xl mb-10 max-w-2xl mx-auto"
            style={{ color: 'rgba(255, 255, 255, 0.9)' }}
          >
            Join thousands who never lose a thought. Free to start, no credit card required.
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
          <motion.p
            variants={fadeIn}
            className="mt-8 text-sm"
            style={{ color: 'rgba(255, 255, 255, 0.7)' }}
          >
            No credit card • 5-minute setup • Cancel anytime
          </motion.p>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
