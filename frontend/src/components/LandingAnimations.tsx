'use client';

import { motion } from 'framer-motion';
import { Brain, Lightbulb, Sparkles, Zap, MessageSquare, Search, Mail, Calendar } from 'lucide-react';

// =============================================================================
// LANDING PAGE ANIMATIONS - Light theme with brand colors
// =============================================================================

type AnimationVariant = 'hero' | 'features' | 'cta' | 'minimal';

interface LandingAnimationsProps {
  variant?: AnimationVariant;
}

export default function LandingAnimations({ variant = 'hero' }: LandingAnimationsProps) {
  if (variant === 'hero') return <HeroAnimations />;
  if (variant === 'features') return <FeaturesAnimations />;
  if (variant === 'cta') return <CTAAnimations />;
  if (variant === 'minimal') return <MinimalAnimations />;

  return null;
}

// =============================================================================
// HERO ANIMATIONS - Floating icons and gentle particles
// =============================================================================

function HeroAnimations() {
  const floatingIcons = [
    {
      Icon: Brain,
      label: 'Ideas',
      tooltip: 'Capture that 2 AM idea before it vanishes forever',
      color: '#EA7B7B',
      bg: '#FFF0F0',
      border: '#FECACA',
      size: 26,
      top: '18%', left: '14%',
      delay: 0, duration: 8,
    },
    {
      Icon: Lightbulb,
      label: 'Insights',
      tooltip: 'AI extracts key insights from everything you save',
      color: '#C9A030',
      bg: '#FFFBEA',
      border: '#FDE68A',
      size: 24,
      top: '22%', right: '16%',
      delay: 0.6, duration: 9,
    },
    {
      Icon: Sparkles,
      label: 'Goals',
      tooltip: 'Track what matters most — surfaced at the right time',
      color: '#5AACA8',
      bg: '#EEFAFA',
      border: '#A7F3D0',
      size: 24,
      top: '58%', left: '12%',
      delay: 1.2, duration: 10,
    },
    {
      Icon: Zap,
      label: 'Tasks',
      tooltip: 'Smart reminders so nothing slips through the cracks',
      color: '#5EB563',
      bg: '#F0FBF0',
      border: '#BBF7D0',
      size: 24,
      top: '62%', right: '14%',
      delay: 1.8, duration: 8.5,
    },
    {
      Icon: MessageSquare,
      label: 'Notes',
      tooltip: 'Chat with your AI to find anything, instantly',
      color: '#D65E3F',
      bg: '#FFF3EE',
      border: '#FDBA74',
      size: 24,
      top: '38%', right: '12%',
      delay: 2.4, duration: 11,
    },
    {
      Icon: Search,
      label: 'Recall',
      tooltip: 'Semantic search that understands meaning, not just words',
      color: '#5AACA8',
      bg: '#EEFAFA',
      border: '#99F6E4',
      size: 22,
      top: '78%', left: '16%',
      delay: 3, duration: 9.5,
    },
  ];

  return (
    <>
      {/* Floating icon badges with hover tooltip */}
      {floatingIcons.map((item, index) => {
        const Icon = item.Icon;
        const style: React.CSSProperties = { top: item.top, zIndex: 10 };
        if ('left' in item) style.left = item.left;
        if ('right' in item) style.right = item.right;

        return (
          <motion.div
            key={`icon-${index}`}
            className="absolute pointer-events-auto group hidden sm:block"
            style={style}
            initial={{ opacity: 0, y: 20 }}
            animate={{ y: [0, -20, 0], opacity: [0.75, 1, 0.75] }}
            transition={{ duration: item.duration, repeat: Infinity, ease: 'easeInOut', delay: item.delay }}
            whileHover={{ scale: 1.12, y: -28, transition: { duration: 0.2 } }}
          >
            {/* Badge */}
            <div
              className="flex items-center gap-2 rounded-2xl px-4 py-2.5 shadow-xl cursor-default select-none"
              style={{
                backgroundColor: item.bg,
                border: `1.5px solid ${item.border}`,
                boxShadow: `0 8px 24px ${item.color}22`,
              }}
            >
              <Icon size={item.size} style={{ color: item.color, strokeWidth: 2 }} />
              <span className="text-sm font-semibold" style={{ color: item.color }}>{item.label}</span>
            </div>

            {/* Tooltip — appears on hover */}
            <div
              className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap
                         rounded-xl px-3 py-2 text-xs font-medium text-gray-700 bg-white
                         shadow-xl border border-gray-100 pointer-events-none
                         opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100
                         transition-all duration-200 ease-out"
              style={{ zIndex: 50 }}
            >
              {item.tooltip}
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
                style={{ borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid white' }}
              />
            </div>
          </motion.div>
        );
      })}

      {/* Rising bubbles — larger and more visible */}
      {[...Array(14)].map((_, i) => {
        const palette = [
          { bg: '#FECACA', shadow: '#EA7B7B' },
          { bg: '#FDE68A', shadow: '#FACE68' },
          { bg: '#99F6E4', shadow: '#79C9C5' },
          { bg: '#BBF7D0', shadow: '#93DA97' },
          { bg: '#FDBA74', shadow: '#FF8364' },
        ];
        const p = palette[i % palette.length];
        const size = 10 + (i % 5) * 6;

        return (
          <motion.div
            key={`bubble-${i}`}
            className="absolute rounded-full"
            style={{
              width: size,
              height: size,
              backgroundColor: p.bg,
              boxShadow: `0 0 ${size}px ${p.shadow}55`,
              bottom: '-5%',
              left: `${8 + (i * 6.5) % 84}%`,
            }}
            animate={{
              y: [0, -(600 + i * 40)],
              opacity: [0, 0.85, 0.7, 0],
              scale: [0.6, 1, 1.1, 0.8],
            }}
            transition={{
              duration: 8 + i * 0.7,
              repeat: Infinity,
              ease: 'easeOut',
              delay: i * 0.5,
            }}
          />
        );
      })}
    </>
  );
}

// =============================================================================
// FEATURES ANIMATIONS - Connected nodes network
// =============================================================================

function FeaturesAnimations() {
  const nodes = [
    { x: 15, y: 20, color: '#EA7B7B', size: 6 },
    { x: 28, y: 35, color: '#FACE68', size: 5 },
    { x: 48, y: 22, color: '#79C9C5', size: 7 },
    { x: 68, y: 38, color: '#93DA97', size: 5 },
    { x: 82, y: 28, color: '#FF8364', size: 6 },
    { x: 22, y: 62, color: '#79C9C5', size: 6 },
    { x: 58, y: 72, color: '#FACE68', size: 5 },
    { x: 78, y: 68, color: '#EA7B7B', size: 5 },
  ];

  return (
    <>
      {/* Connection lines */}
      <svg className="absolute inset-0 w-full h-full opacity-20" style={{ pointerEvents: 'none' }}>
        <defs>
          {nodes.map((_, i) => (
            <linearGradient key={`gradient-${i}`} id={`line-gradient-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={nodes[i].color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={nodes[i + 1]?.color || nodes[i].color} stopOpacity="0.3" />
            </linearGradient>
          ))}
        </defs>
        {nodes.map((node, i) => {
          if (i === nodes.length - 1) return null;
          const nextNode = nodes[i + 1];

          return (
            <motion.line
              key={`line-${i}`}
              x1={`${node.x}%`}
              y1={`${node.y}%`}
              x2={`${nextNode.x}%`}
              y2={`${nextNode.y}%`}
              stroke={`url(#line-gradient-${i})`}
              strokeWidth="1.5"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: [0, 1, 0], opacity: [0, 0.4, 0] }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.4,
              }}
            />
          );
        })}
      </svg>

      {/* Pulsing nodes */}
      {nodes.map((node, i) => (
        <motion.div
          key={`node-${i}`}
          className="absolute rounded-full shadow-lg"
          style={{
            top: `${node.y}%`,
            left: `${node.x}%`,
            width: node.size,
            height: node.size,
            backgroundColor: node.color,
            transform: 'translate(-50%, -50%)',
          }}
          animate={{
            scale: [1, 1.8, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.25,
          }}
        />
      ))}

      {/* Floating icons at node positions */}
      {[Brain, Lightbulb, MessageSquare, Sparkles].map((Icon, i) => {
        const node = nodes[i * 2];
        if (!node) return null;

        return (
          <motion.div
            key={`node-icon-${i}`}
            className="absolute opacity-10"
            style={{
              top: `${node.y}%`,
              left: `${node.x}%`,
              transform: 'translate(-50%, -50%)',
            }}
            animate={{
              rotate: [0, 360],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: 'linear',
              delay: i * 2,
            }}
          >
            <Icon size={18} style={{ color: node.color }} />
          </motion.div>
        );
      })}
    </>
  );
}

// =============================================================================
// CTA ANIMATIONS - Sparkles and celebration vibes
// =============================================================================

function CTAAnimations() {
  const celebrationIcons = [
    { Icon: Sparkles, top: 15, left: 10, delay: 0, size: 20 },
    { Icon: Zap, top: 25, right: 12, delay: 0.5, size: 22 },
    { Icon: Sparkles, top: 60, left: 8, delay: 1, size: 18 },
    { Icon: Mail, top: 70, right: 15, delay: 1.5, size: 20 },
    { Icon: Sparkles, top: 40, right: 8, delay: 2, size: 16 },
    { Icon: Calendar, top: 50, left: 12, delay: 2.5, size: 19 },
  ];

  return (
    <>
      {/* Sparkle particles */}
      {[...Array(25)].map((_, i) => {
        const size = 2 + Math.random() * 4;

        return (
          <motion.div
            key={`sparkle-${i}`}
            className="absolute rounded-full bg-white shadow-lg"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: size,
              height: size,
            }}
            animate={{
              scale: [0, 1.5, 0],
              opacity: [0, 0.8, 0],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: Math.random() * 3,
            }}
          />
        );
      })}

      {/* Floating celebration icons */}
      {celebrationIcons.map((item, i) => {
        const Icon = item.Icon;
        const style: React.CSSProperties = { top: `${item.top}%` };
        if ('left' in item) style.left = `${item.left}%`;
        if ('right' in item) style.right = `${item.right}%`;

        return (
          <motion.div
            key={`celebration-${i}`}
            className="absolute opacity-20"
            style={style}
            animate={{
              y: [0, -35, 0],
              rotate: [0, 15, -15, 0],
              opacity: [0.15, 0.35, 0.15],
            }}
            transition={{
              duration: 5 + i * 0.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: item.delay,
            }}
          >
            <Icon size={item.size} className="text-white" strokeWidth={1.5} />
          </motion.div>
        );
      })}

      {/* Rising confetti */}
      {[...Array(15)].map((_, i) => {
        const colors = ['#FFFFFF'];
        const color = colors[0];

        return (
          <motion.div
            key={`confetti-${i}`}
            className="absolute"
            style={{
              width: 4,
              height: 8,
              backgroundColor: color,
              borderRadius: 1,
              bottom: 0,
              left: `${Math.random() * 100}%`,
              opacity: 0.4,
            }}
            animate={{
              y: [0, -800],
              rotate: [0, 360],
              opacity: [0.4, 0, 0],
            }}
            transition={{
              duration: 5 + Math.random() * 3,
              repeat: Infinity,
              ease: 'easeOut',
              delay: Math.random() * 4,
            }}
          />
        );
      })}
    </>
  );
}

// =============================================================================
// MINIMAL ANIMATIONS - Subtle background enhancement
// =============================================================================

function MinimalAnimations() {
  return (
    <>
      {/* Gentle floating particles */}
      {[...Array(8)].map((_, i) => {
        const colors = ['#EA7B7B', '#FACE68', '#79C9C5', '#93DA97'];
        const color = colors[i % colors.length];

        return (
          <motion.div
            key={`minimal-${i}`}
            className="absolute rounded-full"
            style={{
              width: 2,
              height: 2,
              backgroundColor: color,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100],
              opacity: [0, 0.3, 0],
            }}
            transition={{
              duration: 10 + Math.random() * 5,
              repeat: Infinity,
              ease: 'easeOut',
              delay: Math.random() * 3,
            }}
          />
        );
      })}

      {/* Single floating icon */}
      <motion.div
        className="absolute top-1/3 right-1/4 opacity-[0.08]"
        animate={{
          y: [0, -20, 0],
          rotate: [0, 5, -5, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <Brain size={48} style={{ color: '#EA7B7B', strokeWidth: 1 }} />
      </motion.div>
    </>
  );
}
