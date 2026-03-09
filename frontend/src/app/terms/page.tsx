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
          <p className="mt-3 text-gray-500">Last updated: March 2026</p>
        </div>

        <div className="prose prose-gray max-w-none space-y-10 text-gray-700">

          {/* Acceptance */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
            <p>
              By creating an account or using MindStash (&quot;the Service&quot;), you agree to be bound by these Terms of Service.
              If you do not agree, please do not use the Service.
            </p>
          </section>

          {/* Service Description */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Service Description</h2>
            <p>
              MindStash is an AI-powered personal knowledge management application. It allows users to capture
              thoughts, ideas, tasks, and links, which are then categorized and surfaced using AI. The Service
              includes an AI chat assistant, notification reminders, and optional Telegram integration.
            </p>
          </section>

          {/* Acceptable Use */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="mt-3 list-disc pl-6 space-y-1">
              <li>Use the Service for any illegal purpose or in violation of any laws.</li>
              <li>Attempt to reverse-engineer, scrape, or extract data from the Service in bulk.</li>
              <li>Circumvent rate limits or authentication mechanisms.</li>
              <li>Use the AI features to generate content that is harmful, abusive, or violates third-party rights.</li>
              <li>Share your account credentials with others.</li>
            </ul>
          </section>

          {/* Your Content */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Your Content</h2>
            <p>
              You retain ownership of all content you capture in MindStash. By using the Service, you grant us
              a limited license to process your content solely to provide the Service (e.g., AI categorization,
              search indexing). We do not use your content to train AI models.
            </p>
          </section>

          {/* No Warranty */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. No Warranty</h2>
            <p>
              The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, express or implied.
              We do not guarantee that the Service will be uninterrupted, error-free, or that data will never be lost.
              You are responsible for maintaining backups of important content.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, MindStash shall not be liable for any indirect, incidental,
              special, consequential, or punitive damages arising from your use of or inability to use the Service.
            </p>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Governing Law</h2>
            <p>
              These Terms are governed by and construed in accordance with applicable laws. Any disputes shall be
              resolved through good-faith negotiation before resorting to formal legal proceedings.
            </p>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. We will notify you of significant changes via email.
              Continued use of the Service after changes constitutes acceptance of the new Terms.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Contact</h2>
            <p>
              Questions about these Terms? Email us at{' '}
              <a href="mailto:legal@mindstash.app" className="text-[#EA7B7B] hover:underline">
                legal@mindstash.app
              </a>.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="mx-auto max-w-3xl px-6 flex items-center justify-between text-sm text-gray-400">
          <span>© 2026 MindStash</span>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-gray-600 transition-colors">Privacy</Link>
            <Link href="/" className="hover:text-gray-600 transition-colors">← Back home</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
