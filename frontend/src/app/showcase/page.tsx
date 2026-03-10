'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import LandingAnimations from '@/components/LandingAnimations';
import Footer from '@/components/Footer';
import TabContentExplorer, { type TabItem } from '@/components/TabContentExplorer';
import {
  Play,
  Image as ImageIcon,
  MessageSquare,
  Search,
  Sparkles,
  Send,
  Mail,
  Calendar,
  ArrowRight,
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
// DATA - FEATURES TO SHOWCASE
// =============================================================================

const featureItems: TabItem[] = [
  {
    id: 0,
    tab: 'Quick Capture',
    tagline: 'Type and forget — AI does the rest',
    icon: Sparkles,
    accentColor: '#C9A030',
    bubbleColor: '#FACE68',
    lightBg: '#FFFBEA',
    cardBg: '#FEF3C7',
    borderColor: '#FDE68A',
    content: 'Type anything in 500 characters or less — a thought, a link, a reminder, an idea. AI instantly categorizes it into one of 12 smart categories, generates tags, detects urgency, and estimates priority. Zero decisions on your part.',
    tags: ['500 char limit', '12 categories', 'Auto-tagged', 'Instant'],
  },
  {
    id: 1,
    tab: 'AI Chat Agent',
    tagline: 'Natural language search & management',
    icon: MessageSquare,
    accentColor: '#C44545',
    bubbleColor: '#EA7B7B',
    lightBg: '#FEF2F2',
    cardBg: '#FCE7E7',
    borderColor: '#FECACA',
    content: 'Chat with your saved knowledge in plain English. Ask "What articles about AI did I save last month?" or "What tasks are due this week?" — the agent searches, filters, creates, updates, and deletes items through multi-turn conversation with full context awareness.',
    tags: ['Natural language', 'Multi-turn', 'Context-aware', 'Full CRUD'],
  },
  {
    id: 2,
    tab: 'Semantic Search',
    tagline: 'Finds meaning, not just keywords',
    icon: Search,
    accentColor: '#5AACA8',
    bubbleColor: '#79C9C5',
    lightBg: '#EEFAFA',
    cardBg: '#CCFBF1',
    borderColor: '#99F6E4',
    content: "Vector embeddings (pgvector + OpenAI) power intelligent search that understands the meaning of your queries — not just keyword matches. Search for 'productivity tips' and find items you tagged 'time management' or 'focus' too.",
    tags: ['pgvector', 'OpenAI embeddings', 'Meaning-based', 'Cross-category'],
  },
  {
    id: 3,
    tab: 'Telegram Integration',
    tagline: 'Capture and chat from anywhere',
    icon: Send,
    accentColor: '#D65E3F',
    bubbleColor: '#FF8364',
    lightBg: '#FFF3EE',
    cardBg: '#FFEDD5',
    borderColor: '#FDBA74',
    content: 'Link your MindStash account to Telegram and access your full AI agent directly from the app. Capture items on the go, ask questions, and manage your knowledge from your phone — without opening a browser.',
    tags: ['Telegram bot', 'Full AI agent', 'On-the-go', 'Account linked'],
  },
  {
    id: 4,
    tab: 'Daily Briefings',
    tagline: 'AI morning digest to your inbox',
    icon: Mail,
    accentColor: '#5EB563',
    bubbleColor: '#93DA97',
    lightBg: '#F0FBF0',
    cardBg: '#DCFCE7',
    borderColor: '#BBF7D0',
    content: "Every morning, MindStash generates a personalized AI briefing of what matters today — upcoming tasks, high-priority reads, resurfaced items, and a summary of your week. Delivered to your inbox before you start your day.",
    tags: ['Email delivery', 'AI-generated', 'Daily', 'Personalized'],
  },
  {
    id: 5,
    tab: 'Smart Notifications',
    tagline: 'Right item, right time',
    icon: Calendar,
    accentColor: '#C9A030',
    bubbleColor: '#FACE68',
    lightBg: '#FFFBEA',
    cardBg: '#FEF3C7',
    borderColor: '#FDE68A',
    content: "Items resurface at the right time based on AI-determined time sensitivity and urgency. A task due in 3 days gets a notification 3 days before. An article you saved as high-priority gets nudged after 2 weeks of inactivity. Nothing important gets buried.",
    tags: ['Time-sensitive', 'AI-scheduled', 'Smart nudges', 'Resurface strategy'],
  },
];

// =============================================================================
// SHOWCASE PAGE
// =============================================================================

export default function ShowcasePage() {
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
          <LandingAnimations variant="hero" />
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
              <span className="inline-flex items-center gap-2 rounded-full bg-[#79C9C5]/10 px-4 py-2 text-sm font-semibold text-[#5AACA8] ring-1 ring-[#79C9C5]/20">
                <Play className="h-4 w-4" />
                See It In Action
              </span>
            </motion.div>

            {/* Main heading */}
            <motion.h1
              className="heading-hero text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-gray-900"
              variants={fadeUp}
            >
              MindStash in
              <br />
              <span className="text-gradient-purple">action</span>
            </motion.h1>

            {/* Subheading */}
            <motion.p
              className="mt-8 text-lg sm:text-xl md:text-2xl text-gray-500 max-w-3xl mx-auto leading-relaxed"
              variants={fadeUp}
            >
              Watch videos and explore screenshots showing real features, real interactions, and real AI intelligence.
              <br className="hidden sm:block" />
              <span className="font-semibold text-gray-700">See what makes MindStash different.</span>
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* VIDEO SECTION */}
      {/* ===================================================================== */}
      <section className="relative py-24 lg:py-32 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* Section header */}
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeUp}
          >
            <span className="text-label-small text-[#EA7B7B] mb-4 block">Video Demo</span>
            <h2 className="heading-section text-4xl sm:text-5xl text-gray-900 mb-6">
              Watch MindStash work
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Full walkthrough of features, AI agent capabilities, and real-world usage.
            </p>
          </motion.div>

          {/* Video embed placeholder */}
          <motion.div
            className="max-w-5xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={scaleIn}
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl ring-1 ring-gray-200">
              {/* Placeholder for Loom embed */}
              <div className="aspect-video bg-gradient-to-br from-[#EA7B7B]/20 via-[#FACE68]/20 to-[#79C9C5]/20 flex items-center justify-center">
                <div className="text-center px-6">
                  <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-white shadow-lg mb-6">
                    <Play className="h-10 w-10 text-[#EA7B7B]" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Demo Video Coming Soon</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Full product walkthrough and feature demonstration will be embedded here.
                  </p>
                  <div className="mt-8 rounded-2xl bg-white/80 backdrop-blur-sm p-6 inline-block">
                    <p className="text-sm text-gray-600 mb-2 font-mono">To embed your Loom video:</p>
                    <code className="text-xs text-gray-500 block">
                      {'<iframe src="https://www.loom.com/embed/YOUR_VIDEO_ID" ...></iframe>'}
                    </code>
                  </div>
                </div>
              </div>

              {/* Uncomment and replace with your Loom embed code:
              <iframe
                src="https://www.loom.com/embed/YOUR_VIDEO_ID?sid=OPTIONAL_SID"
                frameBorder="0"
                allowFullScreen
                className="w-full aspect-video"
              ></iframe>
              */}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* FEATURES GRID */}
      {/* ===================================================================== */}
      <TabContentExplorer
        label="Key Features"
        heading="What you'll see in action"
        items={featureItems}
        bgColor="#ffffff"
      />

      {/* ===================================================================== */}
      {/* SCREENSHOTS SECTION */}
      {/* ===================================================================== */}
      <section className="py-24 lg:py-32 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* Section header */}
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <span className="text-label-small text-[#EA7B7B] mb-4 block">Screenshots</span>
            <h2 className="heading-section text-4xl sm:text-5xl text-gray-900 mb-6">
              Inside the app
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Real screenshots showing the interface, AI interactions, and key features.
            </p>
          </motion.div>

          {/* Screenshot grid */}
          <motion.div
            className="grid gap-8 md:grid-cols-2"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {/* Screenshot placeholders */}
            {[
              {
                title: 'Dashboard Overview',
                description: 'Main interface with all your captured thoughts, organized by AI',
              },
              {
                title: 'AI Chat Interface',
                description: 'Natural language conversations with your intelligent assistant',
              },
              {
                title: 'Quick Capture',
                description: '500-character input with real-time AI categorization',
              },
              {
                title: 'Telegram Integration',
                description: 'Seamless bot interaction for on-the-go capturing and chat',
              },
            ].map((screenshot, index) => (
              <motion.div
                key={screenshot.title}
                variants={scaleIn}
                className="group relative"
              >
                <div className="relative rounded-3xl overflow-hidden shadow-xl ring-1 ring-gray-200 transition-all duration-300 hover:shadow-2xl hover:ring-[#EA7B7B]/30 hover:-translate-y-1">
                  {/* Image placeholder */}
                  <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <div className="text-center px-6">
                      <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {screenshot.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {screenshot.description}
                      </p>
                      <div className="mt-4 text-xs text-gray-400">
                        Screenshot placeholder - Add image at:
                        <br />
                        <code className="text-mono-small">/public/screenshots/{index + 1}.png</code>
                      </div>
                    </div>
                  </div>

                  {/* Uncomment to use real images:
                  <img
                    src={`/screenshots/${index + 1}.png`}
                    alt={screenshot.title}
                    className="w-full h-full object-cover"
                  />
                  */}

                  {/* Caption overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {screenshot.title}
                    </h3>
                    <p className="text-sm text-white/80">
                      {screenshot.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Instructions */}
          <motion.div
            className="mt-16 max-w-3xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#79C9C5]/10">
                  <ImageIcon className="h-6 w-6 text-[#5AACA8]" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Adding Your Screenshots</h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-4">
                    To add real screenshots, save your images to <code className="text-mono-small bg-gray-100 px-2 py-1 rounded">/public/screenshots/</code> and uncomment the <code className="text-mono-small bg-gray-100 px-2 py-1 rounded">&lt;img&gt;</code> tags in the code.
                  </p>
                  <p className="text-sm text-gray-500">
                    Recommended size: 1200x900px (4:3 aspect ratio) for best display quality.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
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
            Ready to experience it?
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="text-lg sm:text-xl mb-10 max-w-2xl mx-auto"
            style={{ color: 'rgba(255, 255, 255, 0.9)' }}
          >
            Don't just watch — use it. Sign up free and start capturing your thoughts today.
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
