'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import LandingAnimations from '@/components/LandingAnimations';
import {
  ArrowLeft,
  Brain,
  Cpu,
  Database,
  Zap,
  Lock,
  Globe,
  Mail,
  MessageSquare,
  Code2,
  Layers,
  Search,
  BellRing,
  BarChart3,
  Workflow,
  Server,
  Shield,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  GitBranch,
  Timer,
  Boxes,
  Send,
} from 'lucide-react';

// =============================================================================
// ANIMATION VARIANTS
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
      staggerChildren: 0.1,
    },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
};

// =============================================================================
// DATA - TECHNICAL CAPABILITIES
// =============================================================================

const agenticCapabilities = [
  {
    title: 'Multi-Turn Conversations',
    description: 'Stateful chat sessions with full conversation history and context awareness across turns',
    icon: MessageSquare,
    color: 'bg-[#EA7B7B]',
  },
  {
    title: 'Tool-Calling Architecture',
    description: 'Dynamic tool registry with 9+ tools: search, CRUD, counts, notifications, briefing generation',
    icon: Workflow,
    color: 'bg-[#FACE68]',
  },
  {
    title: 'Real-Time Streaming',
    description: 'Server-Sent Events (SSE) for live token streaming and tool execution feedback',
    icon: Zap,
    color: 'bg-[#79C9C5]',
  },
  {
    title: 'RAG with Vector Search',
    description: 'pgvector embeddings (1536-dim) for semantic search over user knowledge base',
    icon: Search,
    color: 'bg-[#93DA97]',
  },
  {
    title: 'Intelligent Memory',
    description: 'UserMemory system stores learned preferences, context, and interaction patterns',
    icon: Brain,
    color: 'bg-[#FF8364]',
  },
  {
    title: 'Context-Aware Responses',
    description: 'Agent understands urgency, time-sensitivity, user intent, and action requirements',
    icon: Sparkles,
    color: 'bg-[#FACE68]',
  },
];

const techStack = [
  {
    category: 'Backend',
    icon: Server,
    color: 'bg-[#EA7B7B]',
    technologies: [
      { name: 'Python 3.12', description: 'Modern async Python' },
      { name: 'FastAPI', description: 'High-performance async API framework' },
      { name: 'SQLAlchemy 2.0', description: 'Type-safe ORM with relationship loading' },
      { name: 'Alembic', description: 'Schema migrations' },
      { name: 'PostgreSQL', description: 'Production-grade relational DB' },
      { name: 'pgvector', description: 'Vector similarity search extension' },
    ],
  },
  {
    category: 'Frontend',
    icon: Code2,
    color: 'bg-[#FACE68]',
    technologies: [
      { name: 'Next.js 15', description: 'React framework with App Router' },
      { name: 'React 19', description: 'Latest React with Suspense' },
      { name: 'TypeScript', description: 'Type-safe frontend code' },
      { name: 'Tailwind CSS 4', description: 'Utility-first styling' },
      { name: 'Framer Motion', description: 'Production-grade animations' },
      { name: 'TanStack Query', description: 'Server state management' },
    ],
  },
  {
    category: 'AI/ML',
    icon: Brain,
    color: 'bg-[#79C9C5]',
    technologies: [
      { name: 'Claude Haiku 4.5', description: 'Anthropic agent model (fast, accurate)' },
      { name: 'OpenAI Embeddings', description: 'text-embedding-3-small (1536-dim)' },
      { name: 'AI/ML API', description: 'OpenAI-compatible categorization' },
      { name: 'Tool Calling', description: 'Function-calling with JSON schemas' },
      { name: 'Streaming', description: 'Token-by-token SSE responses' },
    ],
  },
  {
    category: 'Infrastructure',
    icon: Globe,
    color: 'bg-[#93DA97]',
    technologies: [
      { name: 'Railway', description: 'Backend hosting with auto-deploy' },
      { name: 'Vercel', description: 'Frontend hosting with edge functions' },
      { name: 'Supabase', description: 'Managed PostgreSQL with pgvector' },
      { name: 'Resend', description: 'Transactional email delivery' },
    ],
  },
];

const architecturePatterns = [
  {
    title: 'Service Layer Pattern',
    description: 'Clean separation: Routes → Services → DAL. Business logic isolated from data access.',
    icon: Layers,
    details: 'ai/agent.py, ai/categorizer.py, notifications/digest.py, scheduler.py',
  },
  {
    title: 'Dependency Injection',
    description: 'Database sessions injected via FastAPI Depends. Testable and maintainable.',
    icon: GitBranch,
    details: 'get_db() dependency, user authentication with get_current_user()',
  },
  {
    title: 'Tool Registry Pattern',
    description: 'Dynamic tool registration with schemas, handlers, and agent-type filtering.',
    icon: Boxes,
    details: 'ToolRegistry singleton, 9+ registered tools with JSON schema validation',
  },
  {
    title: 'Event-Driven Streaming',
    description: 'SSE generator yields structured events: text_delta, tool_start, tool_result, done.',
    icon: Workflow,
    details: 'Frontend invalidates cache on mutated: true events, real-time UI updates',
  },
];

const advancedFeatures = [
  {
    title: 'Semantic Search (RAG)',
    feature: 'pgvector + OpenAI embeddings',
    description: 'Users can search their knowledge base using natural language. Embeddings enable semantic similarity search beyond keyword matching.',
    icon: Search,
    color: 'text-[#79C9C5]',
    bgColor: 'bg-[#79C9C5]/10',
  },
  {
    title: 'Scheduled Tasks',
    feature: 'Cron + FastAPI endpoints',
    description: 'Daily AI briefings, weekly digests, notification delivery. Railway cron jobs trigger HTTP endpoints for background processing.',
    icon: Timer,
    color: 'text-[#FACE68]',
    bgColor: 'bg-[#FACE68]/10',
  },
  {
    title: 'Rate Limiting',
    feature: 'slowapi + Redis (fallback in-memory)',
    description: 'Per-user rate limits on chat (20/hour), list endpoints (100/hour). Prevents abuse while allowing generous usage.',
    icon: Shield,
    color: 'text-[#EA7B7B]',
    bgColor: 'bg-[#EA7B7B]/10',
  },
  {
    title: 'Authentication & Security',
    feature: 'JWT + bcrypt + CORS',
    description: 'Secure token-based auth with refresh tokens. Passwords hashed with bcrypt. CORS configured for cross-origin safety.',
    icon: Lock,
    color: 'text-[#FF8364]',
    bgColor: 'bg-[#FF8364]/10',
  },
  {
    title: 'Email Integration',
    feature: 'Resend API + HTML templates',
    description: 'Transactional emails for digests and briefings. Beautiful HTML templates with personalized content.',
    icon: Mail,
    color: 'text-[#93DA97]',
    bgColor: 'bg-[#93DA97]/10',
  },
  {
    title: 'Real-Time Notifications',
    feature: 'Smart surfacing + time-context',
    description: 'Items resurface based on AI-determined time_sensitivity and notification_frequency. Users stay on top of what matters.',
    icon: BellRing,
    color: 'text-[#EA7B7B]',
    bgColor: 'bg-[#EA7B7B]/10',
  },
  {
    title: 'Telegram Bot Integration',
    feature: 'Webhook + session persistence',
    description: 'Link your Telegram account, capture items on-the-go, and chat with your AI agent directly from Telegram. Full command support: /save, /new, /help.',
    icon: Send,
    color: 'text-[#79C9C5]',
    bgColor: 'bg-[#79C9C5]/10',
  },
];

const integrations = [
  { name: 'Anthropic Claude API', purpose: 'AI agent conversational intelligence', icon: Brain },
  { name: 'OpenAI Embeddings API', purpose: 'Semantic vector search', icon: Search },
  { name: 'Supabase PostgreSQL', purpose: 'Managed database with pgvector', icon: Database },
  { name: 'Resend', purpose: 'Transactional email delivery', icon: Mail },
  { name: 'Railway', purpose: 'Backend hosting & cron jobs', icon: Server },
  { name: 'Vercel', purpose: 'Frontend hosting & edge network', icon: Globe },
];

// =============================================================================
// TECH SHOWCASE PAGE
// =============================================================================

export default function TechPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* ===================================================================== */}
      {/* HERO SECTION */}
      {/* ===================================================================== */}
      <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-32">
        {/* Background decoration */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-[#79C9C5]/10 opacity-60 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-[#FACE68]/10 opacity-50 blur-3xl" />
          <LandingAnimations variant="minimal" />
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
              <span className="inline-flex items-center gap-2 rounded-full bg-[#79C9C5]/10 px-4 py-2 text-sm font-semibold text-[#5AACA8] ring-1 ring-[#79C9C5]/20">
                <Cpu className="h-4 w-4" />
                Technical Architecture
              </span>
            </motion.div>

            {/* Main heading */}
            <motion.h1
              className="heading-hero text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-gray-900"
              variants={fadeUp}
            >
              Built with
              <br />
              <span className="text-gradient-purple">cutting-edge AI</span>
            </motion.h1>

            {/* Subheading */}
            <motion.p
              className="mt-8 text-lg sm:text-xl md:text-2xl text-gray-500 max-w-3xl mx-auto leading-relaxed"
              variants={fadeUp}
            >
              A production-grade agentic application powered by Claude, vector search, and modern cloud infrastructure.
              <br className="hidden sm:block" />
              <span className="font-semibold text-gray-700">This is the future of personal knowledge management.</span>
            </motion.p>

            {/* Stats */}
            <motion.div
              className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
              variants={fadeIn}
            >
              <div>
                <div className="text-3xl font-bold text-gray-900">9+</div>
                <div className="text-sm text-gray-500 mt-1">AI Tools</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">1536</div>
                <div className="text-sm text-gray-500 mt-1">embedding dims</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">SSE</div>
                <div className="text-sm text-gray-500 mt-1">streaming</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">100%</div>
                <div className="text-sm text-gray-500 mt-1">type-safe</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* AGENTIC CAPABILITIES */}
      {/* ===================================================================== */}
      <section className="relative py-24 lg:py-32 bg-gray-50">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <LandingAnimations variant="features" />
        </div>
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          {/* Section header */}
          <motion.div
            className="text-center mb-20"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeUp}
          >
            <span className="text-label-small text-[#EA7B7B] mb-4 block">Agentic AI System</span>
            <h2 className="heading-section text-4xl sm:text-5xl text-gray-900 mb-6">
              Not just an LLM wrapper
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              A full agentic system with tool calling, memory, vector search, and context awareness. Built on Anthropic's Claude with custom architecture.
            </p>
          </motion.div>

          {/* Capabilities grid */}
          <motion.div
            className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={stagger}
          >
            {agenticCapabilities.map((capability) => {
              const Icon = capability.icon;
              return (
                <motion.div
                  key={capability.title}
                  variants={scaleIn}
                  className="group relative"
                >
                  <div className="relative h-full rounded-3xl bg-white p-8 shadow-sm ring-1 ring-gray-100 transition-all duration-300 hover:shadow-xl hover:ring-[#EA7B7B]/30 hover:-translate-y-1">
                    <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${capability.color}`}>
                      <Icon className="h-7 w-7" style={{ color: 'white' }} />
                    </div>
                    <h3 className="heading-card text-xl text-gray-900 mb-3">
                      {capability.title}
                    </h3>
                    <p className="text-gray-500 leading-relaxed">
                      {capability.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* ADVANCED FEATURES */}
      {/* ===================================================================== */}
      <section className="py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* Section header */}
          <motion.div
            className="text-center mb-20"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <span className="text-label-small text-[#EA7B7B] mb-4 block">Advanced Features</span>
            <h2 className="heading-section text-4xl sm:text-5xl text-gray-900">
              Enterprise-grade capabilities
            </h2>
          </motion.div>

          {/* Features list */}
          <motion.div
            className="space-y-6 max-w-5xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {advancedFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  variants={fadeUp}
                  className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-gray-100"
                >
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${feature.bgColor}`}>
                      <Icon className={`h-8 w-8 ${feature.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3">
                        <h3 className="heading-card text-xl text-gray-900">
                          {feature.title}
                        </h3>
                        <span className="text-mono-small text-gray-500 mt-1 md:mt-0">
                          {feature.feature}
                        </span>
                      </div>
                      <p className="text-gray-500 leading-relaxed">
                        {feature.description}
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
      {/* WHAT MAKES IT SPECIAL */}
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
                Why It Matters
              </motion.span>
              <motion.h2 variants={fadeUp} className="heading-section text-4xl sm:text-5xl text-gray-900 mb-8">
                This is agentic AI done right
              </motion.h2>
              <motion.p variants={fadeUp} className="text-lg text-gray-500 mb-12 leading-relaxed">
                Not a chatbot. Not a simple LLM wrapper. A full-featured agentic system with memory, tools, semantic understanding, and production-grade infrastructure.
              </motion.p>

              {/* Highlights */}
              <motion.div className="space-y-4" variants={stagger}>
                {[
                  'Stateful conversations with full context retention',
                  'Dynamic tool execution with real-time feedback',
                  'Vector embeddings for semantic knowledge retrieval',
                  'Scheduled AI-generated briefings and notifications',
                  'Type-safe end-to-end with TypeScript + Python',
                  'Production deployment on Railway + Vercel + Supabase',
                ].map((highlight) => (
                  <motion.div
                    key={highlight}
                    variants={fadeUp}
                    className="flex items-start gap-3"
                  >
                    <CheckCircle2 className="h-6 w-6 text-[#93DA97] shrink-0 mt-0.5" />
                    <span className="text-gray-700">{highlight}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right side - Code snippet preview */}
            <motion.div
              className="relative"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={scaleIn}
            >
              <div className="rounded-3xl bg-gray-900 p-8 shadow-2xl ring-1 ring-gray-700">
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-700">
                  <div className="h-3 w-3 rounded-full bg-[#EA7B7B]" />
                  <div className="h-3 w-3 rounded-full bg-[#FACE68]" />
                  <div className="h-3 w-3 rounded-full bg-[#93DA97]" />
                  <span className="ml-auto text-xs font-mono text-gray-400">agent.py</span>
                </div>
                <pre className="text-sm text-gray-300 font-mono overflow-x-auto">
{`# Tool-calling agent loop
for event in agent_service.chat(
    session_id=session_id,
    message=user_message,
    db=db,
    user_id=user.id
):
    match event["type"]:
        case "text_delta":
            yield event  # Stream tokens
        case "tool_start":
            yield event  # Tool execution
        case "tool_result":
            if event["mutated"]:
                # Invalidate cache
                ...
        case "done":
            break`}
                </pre>
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
            Experience it yourself
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="text-lg sm:text-xl mb-10 max-w-2xl mx-auto"
            style={{ color: 'rgba(255, 255, 255, 0.9)' }}
          >
            See what a production-grade agentic AI application feels like. No credit card required.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-full bg-white px-10 py-4 text-lg font-semibold text-[#C44545] shadow-lg transition-all hover:bg-gray-50 hover:scale-105"
            >
              Try MindStash free
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-10 py-4 text-lg font-semibold transition-all hover:bg-white/20"
              style={{ color: 'white' }}
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Home
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
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center">
                <img
                  src="/logo.png"
                  alt="MindStash"
                  className="h-8 sm:h-10 w-auto"
                />
              </div>
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
