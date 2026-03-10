'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import LandingAnimations from '@/components/LandingAnimations';
import Footer from '@/components/Footer';
import TabContentExplorer, { type TabItem } from '@/components/TabContentExplorer';
import {
  Brain,
  Sparkles,
  Heart,
  Target,
  Zap,
  Code2,
  Lightbulb,
  ArrowRight,
  Mail,
  Users,
  Send,
  Globe,
} from 'lucide-react';

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
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
// DATA
// =============================================================================

const storyItems: TabItem[] = [
  {
    id: 0,
    tab: 'The Problem We Saw',
    tagline: 'Why we started building',
    icon: Lightbulb,
    accentColor: '#C9A030',
    bubbleColor: '#FACE68',
    lightBg: '#FFFBEA',
    cardBg: '#FEF3C7',
    borderColor: '#FDE68A',
    content: "Brilliant ideas vanish minutes after they appear. Important tasks get forgotten until it's too late. Valuable content disappears into a graveyard of browser tabs and note apps. We lose our best thoughts every single day — not because we don't care, but because our tools weren't built for the way minds actually work.",
    tags: ['Ideas lost', 'Tasks forgotten', 'Content buried'],
  },
  {
    id: 1,
    tab: 'Our Vision',
    tagline: "The future we're building toward",
    icon: Target,
    accentColor: '#C44545',
    bubbleColor: '#EA7B7B',
    lightBg: '#FEF2F2',
    cardBg: '#FCE7E7',
    borderColor: '#FECACA',
    content: "What if you never had to organize anything? What if AI understood your thoughts and surfaced them exactly when you needed them? We're building a world where your second brain is always on — capturing, categorizing, and connecting your thoughts with zero effort on your part.",
    tags: ['Zero effort', 'AI-powered', 'Always available'],
  },
  {
    id: 2,
    tab: "How We're Different",
    tagline: 'Not just another note app',
    icon: Brain,
    accentColor: '#5AACA8',
    bubbleColor: '#79C9C5',
    lightBg: '#EEFAFA',
    cardBg: '#CCFBF1',
    borderColor: '#99F6E4',
    content: "Not another note app. Not a simple chatbot. MindStash is a full agentic AI system that learns your patterns, understands context and urgency, and actively helps you remember and act on what matters most. It doesn't just store — it thinks alongside you.",
    tags: ['Agentic AI', 'Context-aware', 'Action-oriented'],
  },
];

const principles = [
  {
    title: 'Zero Friction',
    description: 'Capture should be instant. 10 seconds, not minutes. No folders, no tags, no decisions.',
    icon: Zap,
  },
  {
    title: 'AI-First',
    description: 'Intelligence built-in from day one. Not a feature — the foundation.',
    icon: Sparkles,
  },
  {
    title: 'Context-Aware',
    description: 'Understanding urgency, time-sensitivity, and importance automatically.',
    icon: Brain,
  },
  {
    title: 'Your Data, Your Control',
    description: 'Privacy-first. Secure. You own everything you save.',
    icon: Heart,
  },
];

const integrations = [
  {
    name: 'Web App',
    description: 'Beautiful, fast, intuitive. Your command center.',
    icon: Globe,
    available: true,
  },
  {
    name: 'Telegram Bot',
    description: 'Capture and chat anywhere. Link your account, talk to your AI.',
    icon: Send,
    available: true,
  },
  {
    name: 'Email Integration',
    description: 'Daily AI briefings delivered to your inbox.',
    icon: Mail,
    available: true,
  },
  {
    name: 'Mobile App',
    description: 'Native iOS & Android. Coming soon.',
    icon: Users,
    available: false,
  },
];

const techHighlights = [
  'Claude Haiku 4.5 (Anthropic) for conversational intelligence',
  'pgvector + OpenAI embeddings for semantic search',
  'Multi-turn conversations with session persistence',
  'Dynamic tool-calling with 9+ registered tools',
  'Real-time SSE streaming for instant responses',
  'Telegram bot with full AI agent integration',
  'Scheduled AI briefings and smart notifications',
];

// =============================================================================
// ABOUT PAGE
// =============================================================================

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* ===================================================================== */}
      {/* HERO SECTION */}
      {/* ===================================================================== */}
      <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-32">
        {/* Background decoration */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-[#EA7B7B]/10 opacity-60 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-[#FACE68]/10 opacity-50 blur-3xl" />
          <LandingAnimations variant="minimal" />
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
                <Heart className="h-4 w-4" />
                About MindStash
              </span>
            </motion.div>

            {/* Main heading */}
            <motion.h1
              className="heading-hero text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-gray-900"
              variants={fadeUp}
            >
              Building the future of
              <br />
              <span className="text-gradient-purple">personal memory</span>
            </motion.h1>

            {/* Subheading */}
            <motion.p
              className="mt-8 text-lg sm:text-xl md:text-2xl text-gray-500 max-w-3xl mx-auto leading-relaxed"
              variants={fadeUp}
            >
              We believe your thoughts deserve better than sticky notes and forgotten browser tabs.
              <br className="hidden sm:block" />
              <span className="font-semibold text-gray-700">MindStash is your AI-powered second brain.</span>
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* OUR STORY */}
      {/* ===================================================================== */}
      <TabContentExplorer
        label="Our Story"
        heading="Why we built this"
        items={storyItems}
      />

      {/* ===================================================================== */}
      {/* OUR PRINCIPLES */}
      {/* ===================================================================== */}
      <section className="py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-16 lg:grid-cols-2 lg:gap-24 items-center">
            {/* Left side - Visual */}
            <motion.div
              className="relative order-2 lg:order-1"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={scaleIn}
            >
              <div className="relative aspect-square rounded-3xl bg-gradient-to-br from-[#EA7B7B]/10 via-[#FACE68]/10 to-[#79C9C5]/10 p-8 lg:p-12">
                <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-gray-200" />

                {/* Center piece */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative flex items-center justify-center">
                    <div className="h-20 w-20 rounded-full bg-white shadow-xl ring-1 ring-gray-100 flex items-center justify-center z-10">
                      <Brain className="h-9 w-9 text-[#EA7B7B]" />
                    </div>
                    <motion.div
                      className="absolute rounded-full border-2 border-[#EA7B7B]/25"
                      style={{ width: 80, height: 80 }}
                      animate={{ scale: [1, 1.7], opacity: [0.5, 0] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut' }}
                    />
                    <motion.div
                      className="absolute rounded-full border-2 border-[#EA7B7B]/15"
                      style={{ width: 80, height: 80 }}
                      animate={{ scale: [1, 2.4], opacity: [0.4, 0] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut', delay: 0.7 }}
                    />
                  </div>
                </div>

                {/* Floating principle cards */}
                {principles.map((principle, index) => {
                  const Icon = principle.icon;
                  const positions = [
                    'top-8 left-8',
                    'top-8 right-8',
                    'bottom-8 left-8',
                    'bottom-8 right-8',
                  ];
                  return (
                    <motion.div
                      key={principle.title}
                      className={`absolute ${positions[index]} rounded-2xl bg-white p-4 shadow-xl ring-1 ring-gray-100 max-w-[45%]`}
                      animate={{ y: [0, index % 2 === 0 ? -8 : 8, 0] }}
                      transition={{ duration: 4 + index, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-[#EA7B7B]/10 flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4 text-[#C44545]" />
                        </div>
                        <div className="text-xs font-semibold text-gray-900">{principle.title}</div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Right side - Content */}
            <motion.div
              className="order-1 lg:order-2"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={stagger}
            >
              <motion.span variants={fadeUp} className="text-label-small text-[#EA7B7B] mb-4 block">
                Our Principles
              </motion.span>
              <motion.h2 variants={fadeUp} className="heading-section text-4xl sm:text-5xl text-gray-900 mb-8">
                What guides us
              </motion.h2>
              <motion.p variants={fadeUp} className="text-lg text-gray-500 mb-12 leading-relaxed">
                Every decision we make starts with these core beliefs. They shape how we build, what we prioritize, and why we exist.
              </motion.p>

              {/* Principles list */}
              <motion.div className="space-y-6" variants={stagger}>
                {principles.map((principle) => {
                  const Icon = principle.icon;
                  return (
                    <motion.div
                      key={principle.title}
                      variants={fadeUp}
                      className="flex items-start gap-4"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EA7B7B]/10">
                        <Icon className="h-6 w-6 text-[#C44545]" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">{principle.title}</h3>
                        <p className="text-gray-500">{principle.description}</p>
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
      {/* WHERE YOU CAN USE IT */}
      {/* ===================================================================== */}
      <section className="py-24 lg:py-32 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* Section header */}
          <motion.div
            className="text-center mb-20"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <span className="text-label-small text-[#EA7B7B] mb-4 block">Everywhere You Are</span>
            <h2 className="heading-section text-4xl sm:text-5xl text-gray-900 mb-6">
              MindStash works where you work
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Web, Telegram, email. More platforms coming soon.
            </p>
          </motion.div>

          {/* Integrations grid */}
          <motion.div
            className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {integrations.map((integration) => {
              const Icon = integration.icon;
              return (
                <motion.div
                  key={integration.name}
                  variants={scaleIn}
                  className="group relative"
                >
                  <div className="relative h-full rounded-3xl bg-white p-8 shadow-sm ring-1 ring-gray-100 transition-all duration-300 hover:shadow-lg hover:ring-[#EA7B7B]/30 hover:-translate-y-1">
                    {!integration.available && (
                      <div className="absolute top-4 right-4 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500">
                        Soon
                      </div>
                    )}
                    <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${integration.available ? 'bg-[#93DA97]' : 'bg-gray-100'}`}>
                      <Icon className={`h-7 w-7 ${integration.available ? 'text-white' : 'text-gray-400'}`} />
                    </div>
                    <h3 className="heading-card text-lg text-gray-900 mb-2">
                      {integration.name}
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {integration.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* TECHNICAL EXCELLENCE */}
      {/* ===================================================================== */}
      <section className="py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-16 lg:grid-cols-2 lg:gap-24 items-center">
            {/* Left side - Content */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={stagger}
            >
              <motion.span variants={fadeUp} className="text-label-small text-[#EA7B7B] mb-4 block">
                Technical Excellence
              </motion.span>
              <motion.h2 variants={fadeUp} className="heading-section text-4xl sm:text-5xl text-gray-900 mb-8">
                Built to last
              </motion.h2>
              <motion.p variants={fadeUp} className="text-lg text-gray-500 mb-12 leading-relaxed">
                MindStash isn't a prototype. It's a production-grade agentic AI system built with modern architecture, clean code, and scalability in mind.
              </motion.p>

              <motion.div variants={fadeUp}>
                <Link
                  href="/tech"
                  className="inline-flex items-center gap-2 text-[#EA7B7B] font-semibold hover:gap-3 transition-all"
                >
                  Explore the technical architecture
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </motion.div>
            </motion.div>

            {/* Right side - Tech list */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={stagger}
            >
              <div className="rounded-3xl bg-gray-50 p-8 lg:p-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EA7B7B]/10">
                    <Code2 className="h-6 w-6 text-[#C44545]" />
                  </div>
                  <h3 className="heading-card text-xl text-gray-900">Under the Hood</h3>
                </div>
                <ul className="space-y-3">
                  {techHighlights.map((highlight, index) => (
                    <motion.li
                      key={index}
                      variants={fadeUp}
                      className="flex items-start gap-3 text-sm text-gray-600"
                    >
                      <div className="h-1.5 w-1.5 rounded-full bg-[#EA7B7B] shrink-0 mt-2" />
                      <span>{highlight}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* CTA */}
      {/* ===================================================================== */}
      <section className="relative py-24 lg:py-32 overflow-hidden bg-[#EA7B7B]">
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
            Join us on this journey
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="text-lg sm:text-xl mb-10 max-w-2xl mx-auto"
            style={{ color: 'rgba(255, 255, 255, 0.9)' }}
          >
            Be part of the future of personal knowledge management. Start capturing your thoughts today.
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

      <Footer />
    </div>
  );
}
