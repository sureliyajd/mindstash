'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Check, X, Zap, Star, Crown, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { PLAN_PRICING } from '@/lib/api';

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
};

// =============================================================================
// DATA
// =============================================================================

const plans = [
  {
    key: 'free',
    name: 'Free',
    icon: Zap,
    color: '#79C9C5',
    border: 'ring-1 ring-gray-100',
    badge: null,
    monthly: 0,
    annual: 0,
    cta: 'Start for free',
    ctaHref: '/register',
    ctaStyle: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    popular: false,
    features: [
      { text: '30 items per month', included: true },
      { text: '10 AI chat messages/month', included: true },
      { text: '12 smart categories', included: true },
      { text: 'Keyword search', included: true },
      { text: 'Mobile-friendly UI', included: true },
      { text: 'Telegram bot', included: false },
      { text: 'Weekly digest emails', included: false },
      { text: 'Semantic / vector search', included: false },
      { text: 'Daily AI briefing', included: false },
    ],
  },
  {
    key: 'starter',
    name: 'Starter',
    icon: Star,
    color: '#EA7B7B',
    border: 'ring-2 ring-[#EA7B7B]',
    badge: 'Most popular',
    monthly: PLAN_PRICING.starter.monthly_cents / 100,
    annual: PLAN_PRICING.starter.annual_cents / 100 / 12,
    cta: 'Get Starter',
    ctaHref: '/register?redirect=/billing',
    ctaStyle:
      'bg-[#EA7B7B] text-white hover:bg-[#D66B6B] shadow-lg shadow-[#EA7B7B]/25 hover:shadow-[#EA7B7B]/40',
    popular: true,
    features: [
      { text: '200 items per month', included: true },
      { text: '100 AI chat messages/month', included: true },
      { text: '12 smart categories', included: true },
      { text: 'Keyword search', included: true },
      { text: 'Mobile-friendly UI', included: true },
      { text: 'Telegram bot', included: true },
      { text: 'Weekly digest emails', included: true },
      { text: 'Semantic / vector search', included: false },
      { text: 'Daily AI briefing', included: false },
    ],
  },
  {
    key: 'pro',
    name: 'Pro',
    icon: Crown,
    color: '#FACE68',
    border: 'ring-1 ring-[#FACE68]/60',
    badge: null,
    monthly: PLAN_PRICING.pro.monthly_cents / 100,
    annual: PLAN_PRICING.pro.annual_cents / 100 / 12,
    cta: 'Go Pro',
    ctaHref: '/register?redirect=/billing',
    ctaStyle:
      'bg-[#FACE68] text-gray-900 hover:bg-[#EAB845] shadow-lg shadow-[#FACE68]/25 hover:shadow-[#FACE68]/40',
    popular: false,
    features: [
      { text: 'Unlimited items', included: true },
      { text: 'Unlimited AI chat', included: true },
      { text: '12 smart categories', included: true },
      { text: 'Keyword search', included: true },
      { text: 'Mobile-friendly UI', included: true },
      { text: 'Telegram bot', included: true },
      { text: 'Weekly digest emails', included: true },
      { text: 'Semantic / vector search', included: true },
      { text: 'Daily AI briefing', included: true },
    ],
  },
];

const faqs = [
  {
    q: 'Can I change plans later?',
    a: 'Yes. Upgrade, downgrade, or cancel anytime from your billing dashboard. Upgrades take effect immediately; downgrades apply at the end of your billing period.',
  },
  {
    q: 'What happens to my data if I downgrade?',
    a: "Your data is never deleted. You keep access to everything you captured — you just hit the lower monthly limits for new captures until the next reset.",
  },
  {
    q: 'Is there a free trial for paid plans?',
    a: "Not currently. The Free tier gives you a full taste of MindStash with no credit card required — start there and upgrade when you need more.",
  },
  {
    q: 'What payment methods do you accept?',
    a: 'All major credit and debit cards. Payments are processed securely through our payment partner and you get a PDF receipt for every charge.',
  },
  {
    q: 'What is the annual discount?',
    a: 'Paying annually saves ~20% compared to monthly. Starter is $67/year (~$5.58/mo) and Pro is $144/year (~$12/mo).',
  },
];

// =============================================================================
// FAQ ITEM
// =============================================================================

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-5 text-left font-semibold text-gray-900 hover:text-[#EA7B7B] transition-colors"
      >
        {q}
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
        )}
      </button>
      {open && (
        <p className="pb-5 text-sm text-gray-500 leading-relaxed">{a}</p>
      )}
    </div>
  );
}

// =============================================================================
// PAGE
// =============================================================================

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* =====================================================================
          HERO
      ===================================================================== */}
      <section className="relative overflow-hidden pt-32 pb-16 lg:pt-40 lg:pb-20">
        {/* Background blobs — matches landing page style */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-[#EA7B7B]/10 opacity-60 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-[#79C9C5]/10 opacity-50 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl px-6 lg:px-8 text-center">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.span
              variants={fadeUp}
              className="text-label-small text-[#EA7B7B] mb-4 block"
            >
              Pricing
            </motion.span>
            <motion.h1
              variants={fadeUp}
              className="heading-section text-4xl sm:text-5xl md:text-6xl text-gray-900 mb-6"
            >
              Simple, transparent pricing
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto mb-10"
            >
              Start free. Upgrade when your ideas demand more space.
            </motion.p>

            {/* Monthly / Annual toggle */}
            <motion.div
              variants={fadeUp}
              className="inline-flex items-center gap-1 rounded-full bg-gray-100 p-1.5"
            >
              <button
                onClick={() => setAnnual(false)}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition-all ${
                  !annual
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition-all flex items-center gap-2 ${
                  annual
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Annual
                <span className="rounded-full bg-[#93DA97]/30 px-2 py-0.5 text-xs font-bold text-[#3A8A3E]">
                  Save 20%
                </span>
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* =====================================================================
          PRICING CARDS
      ===================================================================== */}
      <section className="pb-24">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <motion.div
            className="grid gap-6 lg:grid-cols-3 lg:items-start"
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            {plans.map((plan) => {
              const Icon = plan.icon;
              const price = annual ? plan.annual : plan.monthly;
              const annualTotal =
                plan.key !== 'free' && annual
                  ? `Billed $${(plan.annual * 12).toFixed(0)}/year`
                  : null;

              return (
                <motion.div
                  key={plan.key}
                  variants={scaleIn}
                  className={`relative flex flex-col rounded-3xl bg-white p-8 ${plan.border} transition-all duration-300 hover:-translate-y-1 ${
                    plan.popular
                      ? 'shadow-xl shadow-[#EA7B7B]/10 lg:scale-[1.02]'
                      : 'shadow-sm hover:shadow-lg'
                  }`}
                >
                  {/* Popular badge */}
                  {plan.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-[#EA7B7B] px-4 py-1 text-xs font-bold text-white shadow-md shadow-[#EA7B7B]/30">
                      {plan.badge}
                    </div>
                  )}

                  {/* Plan header */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2.5 mb-4">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-2xl"
                        style={{ backgroundColor: `${plan.color}20` }}
                      >
                        <Icon className="h-5 w-5" style={{ color: plan.color }} />
                      </div>
                      <span className="font-bold text-gray-900 text-lg">{plan.name}</span>
                    </div>

                    <div className="flex items-end gap-1.5">
                      <span className="text-5xl font-black text-gray-900 leading-none">
                        ${price === 0 ? '0' : price.toFixed(2)}
                      </span>
                      <span className="text-gray-400 text-sm mb-1">
                        {price === 0 ? 'forever' : '/mo'}
                      </span>
                    </div>
                    <p className={`text-xs mt-1.5 ${annualTotal ? 'text-gray-400' : 'invisible'}`}>
                      {annualTotal ?? 'x'}
                    </p>
                  </div>

                  {/* Features list */}
                  <ul className="space-y-3 flex-1 mb-8">
                    {plan.features.map((f) => (
                      <li key={f.text} className="flex items-center gap-3 text-sm">
                        {f.included ? (
                          <div
                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                            style={{ backgroundColor: `${plan.color}20` }}
                          >
                            <Check className="h-3 w-3" style={{ color: plan.color }} />
                          </div>
                        ) : (
                          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100">
                            <X className="h-3 w-3 text-gray-300" />
                          </div>
                        )}
                        <span className={f.included ? 'text-gray-700' : 'text-gray-400'}>
                          {f.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA button */}
                  <Link
                    href={plan.ctaHref}
                    className={`group flex items-center justify-center gap-2 rounded-full py-3.5 text-sm font-bold transition-all duration-200 hover:scale-[1.02] ${plan.ctaStyle}`}
                  >
                    {plan.cta}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* =====================================================================
          DARK SECTION — EVERYTHING INCLUDED
          Matches the "How it works" dark section on the landing page
      ===================================================================== */}
      <section className="py-24 lg:py-32" style={{ backgroundColor: '#0D0D0D' }}>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeUp}
          >
            <span className="text-label-small mb-4 block" style={{ color: '#79C9C5' }}>
              Core features
            </span>
            <h2
              className="heading-section text-3xl sm:text-4xl mb-4"
              style={{ color: 'white' }}
            >
              What every plan includes
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              The same AI engine powers every tier. You&apos;re only paying for more capacity.
            </p>
          </motion.div>

          <motion.div
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {[
              {
                title: 'AI Categorization',
                desc: 'Every item automatically sorted into 12 smart categories — no manual tagging.',
                color: '#79C9C5',
                cardBg: '#0A1F1D',
              },
              {
                title: 'Chat Agent',
                desc: 'Natural language search. Ask anything. Your AI agent finds it.',
                color: '#EA7B7B',
                cardBg: '#1A0D0D',
              },
              {
                title: 'Urgency Detection',
                desc: 'AI reads context to flag time-sensitive items so nothing slips.',
                color: '#FACE68',
                cardBg: '#1A160A',
              },
              {
                title: 'Priority Scoring',
                desc: 'Automatic priority ranking so high-value items surface first.',
                color: '#93DA97',
                cardBg: '#0A1A0C',
              },
              {
                title: 'Tags & Summaries',
                desc: 'Auto-generated tags and one-line summaries for every capture.',
                color: '#FF8364',
                cardBg: '#1A100A',
              },
              {
                title: 'Completion Tracking',
                desc: 'Mark tasks done, track what matters, and close loops.',
                color: '#79C9C5',
                cardBg: '#0A1F1D',
              },
            ].map((item) => (
              <motion.div
                key={item.title}
                variants={fadeUp}
                className="rounded-3xl p-7 transition-transform duration-300 hover:-translate-y-0.5"
                style={{
                  backgroundColor: item.cardBg,
                  border: `1px solid ${item.color}22`,
                }}
              >
                <div
                  className="mb-4 h-1.5 w-8 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <h3 className="font-bold mb-2" style={{ color: 'white' }}>{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#9CA3AF' }}>{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* =====================================================================
          FAQ
      ===================================================================== */}
      <section className="py-24 lg:py-32 bg-gray-50">
        <div className="mx-auto max-w-2xl px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <span className="text-label-small text-[#EA7B7B] mb-4 block">FAQ</span>
            <h2 className="heading-section text-3xl sm:text-4xl text-gray-900">
              Questions &amp; answers
            </h2>
          </motion.div>

          <motion.div
            className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={scaleIn}
          >
            {faqs.map((item) => (
              <FaqItem key={item.q} q={item.q} a={item.a} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* =====================================================================
          CTA — identical style to landing page CTA section
      ===================================================================== */}
      <section className="relative py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-[#EA7B7B]" />
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute top-0 left-0 h-full w-full"
            style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        <motion.div
          className="relative mx-auto max-w-3xl px-6 lg:px-8 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
        >
          <motion.h2
            variants={fadeUp}
            className="heading-section text-4xl sm:text-5xl mb-6"
            style={{ color: 'white' }}
          >
            Start remembering everything
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="text-lg mb-10 max-w-xl mx-auto"
            style={{ color: 'rgba(255,255,255,0.9)' }}
          >
            Free to start. No credit card required. Upgrade only when you need more.
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
            variants={fadeUp}
            className="mt-6 text-sm"
            style={{ color: 'rgba(255,255,255,0.7)' }}
          >
            No credit card · 5-minute setup · Cancel anytime
          </motion.p>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
