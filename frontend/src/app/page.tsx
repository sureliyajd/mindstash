'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import LandingAnimations from '@/components/LandingAnimations';
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
  Calendar,
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

const useCases = [
  {
    title: 'The Midnight Idea',
    before: '"I had a brilliant business idea at 2 AM. By morning, it was gone."',
    after: 'Capture it in 10 seconds. MindStash categorizes it as an Idea. Your AI agent surfaces it during your weekly review.',
    icon: Lightbulb,
    color: 'bg-[#FACE68]',
    textColor: 'text-[#C9A030]',
  },
  {
    title: 'The Forgotten Task',
    before: "\"I meant to buy mom's birthday gift. I remembered... the day after.\"",
    after: "Drop \"mom's birthday gift\" → auto-categorized as Task → smart notification 3 days before.",
    icon: Calendar,
    color: 'bg-[#EA7B7B]',
    textColor: 'text-[#C44545]',
  },
  {
    title: 'The Lost Article',
    before: "\"I read an amazing article about AI. Can't remember where I saved it.\"",
    after: 'Paste the link → categorized as Read Later → AI chat finds it in seconds: "Show me that AI article from last week"',
    icon: BookOpen,
    color: 'bg-[#79C9C5]',
    textColor: 'text-[#5AACA8]',
  },
];

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

            {/* Stats */}
            <motion.div
              className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto"
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
            <span className="text-label-small text-[#EA7B7B] mb-4 block">Real Problems, Real Solutions</span>
            <h2 className="heading-section text-4xl sm:text-5xl text-gray-900 mb-6">
              We've all been there
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              These moments happen every day. MindStash makes sure they never happen again.
            </p>
          </motion.div>

          {/* Use case cards */}
          <motion.div
            className="grid gap-8 md:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={stagger}
          >
            {useCases.map((useCase, index) => {
              const Icon = useCase.icon;
              return (
                <motion.div
                  key={useCase.title}
                  variants={scaleIn}
                  className="group relative"
                >
                  <div className="relative h-full rounded-3xl bg-white p-8 shadow-sm ring-1 ring-gray-100 transition-all duration-300 hover:shadow-xl hover:ring-[#EA7B7B]/30 hover:-translate-y-1">
                    {/* Icon */}
                    <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${useCase.color}`}>
                      <Icon className="h-7 w-7" style={{ color: 'white' }} />
                    </div>

                    {/* Title */}
                    <h3 className="heading-card text-xl text-gray-900 mb-4">
                      {useCase.title}
                    </h3>

                    {/* Before scenario */}
                    <div className="mb-6 p-4 rounded-xl bg-gray-50 border-l-4 border-gray-300">
                      <div className="text-xs font-semibold text-gray-400 uppercase mb-2">Before</div>
                      <p className="text-sm text-gray-600 italic leading-relaxed">
                        {useCase.before}
                      </p>
                    </div>

                    {/* After scenario */}
                    <div className="p-4 rounded-xl bg-[#93DA97]/10 border-l-4 border-[#93DA97]">
                      <div className="text-xs font-semibold text-[#5EB563] uppercase mb-2">With MindStash</div>
                      <p className="text-sm text-gray-900 font-medium leading-relaxed">
                        {useCase.after}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

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
      {/* HOW IT WORKS - SIMPLIFIED */}
      {/* ===================================================================== */}
      <section className="py-24 lg:py-32">
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
              Three steps. That's it.
            </h2>
          </motion.div>

          {/* Steps */}
          <motion.div
            className="grid gap-12 md:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center">
              <div className="mb-6 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#79C9C5] text-2xl font-bold" style={{ color: 'white' }}>
                  1
                </div>
              </div>
              <h3 className="heading-card text-xl text-gray-900 mb-3">Capture</h3>
              <p className="text-gray-500">
                Type anything in 500 characters or less. Thoughts, links, tasks, reminders.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} className="text-center">
              <div className="mb-6 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FACE68] text-2xl font-bold" style={{ color: 'white' }}>
                  2
                </div>
              </div>
              <h3 className="heading-card text-xl text-gray-900 mb-3">AI Organizes</h3>
              <p className="text-gray-500">
                Our AI instantly categorizes, tags, and understands context. No effort required.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} className="text-center">
              <div className="mb-6 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#93DA97] text-2xl font-bold" style={{ color: 'white' }}>
                  3
                </div>
              </div>
              <h3 className="heading-card text-xl text-gray-900 mb-3">Recall & Act</h3>
              <p className="text-gray-500">
                Search, chat, or get notified. Your thoughts surface exactly when you need them.
              </p>
            </motion.div>
          </motion.div>
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
