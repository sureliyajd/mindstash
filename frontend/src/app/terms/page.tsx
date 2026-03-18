import Navigation from '@/components/Navigation';
import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service — MindStash',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main className="mx-auto max-w-3xl px-6 pb-24 pt-32">
        {/* Header */}
        <div className="mb-12">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#EA7B7B]/10 px-4 py-1.5 text-sm font-medium text-[#EA7B7B]">
            Legal
          </div>
          <h1 className="text-4xl font-bold text-gray-900">Terms of Service</h1>
          <p className="mt-3 text-gray-500">Last updated: March 18, 2026</p>
        </div>

        <div className="prose prose-gray max-w-none space-y-10 text-gray-700">

          {/* Operator */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Who We Are</h2>
            <p>
              MindStash is operated by Jaydeep Sureliya, an independent software developer based in India.
              Throughout these Terms, &quot;MindStash&quot;, &quot;we&quot;, &quot;us&quot;, and &quot;our&quot; refer to the operator
              of the Service. You can reach us at{' '}
              <a href="mailto:legal@mindstashhq.space" className="text-[#EA7B7B] hover:underline">
                legal@mindstashhq.space
              </a>.
            </p>
          </section>

          {/* Acceptance */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Acceptance of Terms</h2>
            <p>
              By creating an account or using MindStash (&quot;the Service&quot;), you agree to be bound by these Terms of Service,
              our{' '}
              <Link href="/privacy" className="text-[#EA7B7B] hover:underline">Privacy Policy</Link>, and our{' '}
              <Link href="/refund" className="text-[#EA7B7B] hover:underline">Refund Policy</Link>.
              If you do not agree to any of these documents, please do not use the Service.
            </p>
          </section>

          {/* Service Description */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Service Description</h2>
            <p>
              MindStash is an AI-powered personal knowledge management application. It allows users to capture
              thoughts, ideas, tasks, and links, which are then categorized and surfaced using AI. The Service
              includes an AI chat assistant, notification reminders, daily AI briefings, and optional Telegram integration.
            </p>
          </section>

          {/* Accounts */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Accounts and Eligibility</h2>
            <p>
              You must be at least 16 years old to use MindStash. When you create an account, you agree to
              provide accurate information and to keep your credentials secure. You are responsible for all
              activity that occurs under your account. If you suspect unauthorized access, contact us immediately.
            </p>
          </section>

          {/* Plans and Billing */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Plans, Billing, and Payments</h2>
            <p>MindStash offers three plans:</p>
            <ul className="mt-3 list-disc pl-6 space-y-1">
              <li><strong>Free</strong> - 30 items/month, 10 AI chat messages/month. No credit card required.</li>
              <li><strong>Starter</strong> - $7/month or $67/year. 200 items/month, 100 AI chat messages/month, plus Telegram and weekly digest.</li>
              <li><strong>Pro</strong> - $15/month or $144/year. Unlimited items and chat, semantic search, daily AI briefing, and all features.</li>
            </ul>
            <p className="mt-3">
              Paid subscriptions are billed in advance and renew automatically at the end of each billing period.
              Payments are processed securely through our payment partner. You may upgrade, downgrade, or cancel
              at any time from your billing dashboard. Downgrades take effect at the end of the current billing
              period. Refunds are handled per our{' '}
              <Link href="/refund" className="text-[#EA7B7B] hover:underline">Refund Policy</Link>.
            </p>
          </section>

          {/* Acceptable Use */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="mt-3 list-disc pl-6 space-y-1">
              <li>Use the Service for any illegal purpose or in violation of any laws.</li>
              <li>Attempt to reverse-engineer, scrape, or extract data from the Service in bulk.</li>
              <li>Circumvent rate limits, usage quotas, or authentication mechanisms.</li>
              <li>Use the AI features to generate content that is harmful, abusive, or violates third-party rights.</li>
              <li>Share your account credentials with others or allow multiple people to use a single account.</li>
              <li>Resell, sublicense, or redistribute the Service without written permission.</li>
            </ul>
            <p className="mt-3">
              We reserve the right to suspend or terminate accounts that violate these terms, with or without notice.
            </p>
          </section>

          {/* Your Content */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Your Content</h2>
            <p>
              You retain full ownership of all content you capture in MindStash. By using the Service, you grant us
              a limited, non-exclusive license to process your content solely to provide the Service features
              (e.g., AI categorization, search indexing, chat responses, vector embeddings).
            </p>
            <p className="mt-3">
              We do not use your content to train AI models. Your content is processed through third-party AI
              providers (Anthropic, OpenAI) solely for real-time feature delivery. See our{' '}
              <Link href="/privacy" className="text-[#EA7B7B] hover:underline">Privacy Policy</Link>{' '}
              for details on how these providers handle data.
            </p>
          </section>

          {/* AI Disclaimer */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. AI-Generated Content</h2>
            <p>
              MindStash uses AI to categorize items, generate summaries and tags, detect urgency, and provide
              chat responses. AI outputs are provided for convenience and may not always be accurate. You should
              not rely on AI categorization, priority scoring, or chat responses as a substitute for your own
              judgment, especially for time-critical or legally significant decisions.
            </p>
          </section>

          {/* No Warranty */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. No Warranty</h2>
            <p>
              The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, express or implied.
              We do not guarantee that the Service will be uninterrupted, error-free, or that data will never be lost.
              You are responsible for maintaining backups of important content.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, MindStash and its operator shall not be liable for any
              indirect, incidental, special, consequential, or punitive damages arising from your use of or
              inability to use the Service. Our total liability for any claim arising from the Service is limited
              to the amount you paid us in the 12 months preceding the claim, or $50, whichever is greater.
            </p>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Governing Law</h2>
            <p>
              These Terms are governed by the laws of India. Any disputes arising from or relating to these Terms
              or the Service shall be resolved through good-faith negotiation before resorting to formal legal
              proceedings. If negotiation fails, disputes shall be subject to the jurisdiction of the courts in
              Gujarat, India.
            </p>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. We will notify you of significant changes via email
              at the address associated with your account. Continued use of the Service after changes constitutes
              acceptance of the new Terms. If you disagree with the updated Terms, you may cancel your account.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">13. Contact</h2>
            <p>
              Questions about these Terms? Email us at{' '}
              <a href="mailto:legal@mindstashhq.space" className="text-[#EA7B7B] hover:underline">
                legal@mindstashhq.space
              </a>.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="mx-auto max-w-3xl px-6 flex items-center justify-between text-sm text-gray-400">
          <span>&copy; 2026 MindStash</span>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-gray-600 transition-colors">Privacy</Link>
            <Link href="/refund" className="hover:text-gray-600 transition-colors">Refund</Link>
            <Link href="/" className="hover:text-gray-600 transition-colors">&larr; Back home</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
