import Navigation from '@/components/Navigation';
import Link from 'next/link';

export const metadata = {
  title: 'Refund Policy — MindStash',
};

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main className="mx-auto max-w-3xl px-6 pb-24 pt-32">
        {/* Header */}
        <div className="mb-12">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#EA7B7B]/10 px-4 py-1.5 text-sm font-medium text-[#EA7B7B]">
            Legal
          </div>
          <h1 className="text-4xl font-bold text-gray-900">Refund Policy</h1>
          <p className="mt-3 text-gray-500">Last updated: March 2026</p>
        </div>

        <div className="prose prose-gray max-w-none space-y-10 text-gray-700">

          {/* Overview */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Subscription Plans</h2>
            <p>
              MindStash offers two subscription tiers, each available as monthly or annual billing:
            </p>
            <ul className="mt-3 list-disc pl-6 space-y-1">
              <li><strong>MindStash Starter</strong> — $7/month or $67/year</li>
              <li><strong>MindStash Pro</strong> — $15/month or $144/year</li>
            </ul>
            <p className="mt-3">
              All subscriptions are billed in advance and renew automatically at the end of each billing period
              unless cancelled.
            </p>
          </section>

          {/* Free Trial / Satisfaction */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. 14-Day Money-Back Guarantee</h2>
            <p>
              If you are not satisfied with MindStash, you may request a full refund within <strong>14 days</strong> of
              your initial purchase. This applies to both monthly and annual subscriptions. No questions asked.
            </p>
          </section>

          {/* After 14 Days */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. After the 14-Day Period</h2>
            <p>
              After the initial 14-day window, we do not offer partial or prorated refunds for the current billing
              period. However, you can cancel your subscription at any time to prevent future charges. You will
              continue to have access to your plan until the end of the current billing cycle.
            </p>
          </section>

          {/* Annual Subscriptions */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Annual Subscriptions</h2>
            <p>
              Annual subscriptions are eligible for a full refund within 14 days of purchase. After the 14-day
              window, annual plans are non-refundable but can be cancelled to prevent renewal at the next billing
              date. You retain access for the remainder of the paid year.
            </p>
          </section>

          {/* How to Request */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. How to Request a Refund</h2>
            <p>To request a refund, contact us with the following details:</p>
            <ul className="mt-3 list-disc pl-6 space-y-1">
              <li>Your account email address</li>
              <li>Date of purchase</li>
              <li>Reason for the refund (optional, helps us improve)</li>
            </ul>
            <p className="mt-3">
              Email us at{' '}
              <a href="mailto:jaydeepsureliya.jd@gmail.com" className="text-[#EA7B7B] hover:underline">
                jaydeepsureliya.jd@gmail.com
              </a>{' '}
              and we will process your request within 5–7 business days.
            </p>
          </section>

          {/* Chargebacks */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Chargebacks</h2>
            <p>
              We encourage you to reach out to us directly before initiating a chargeback with your payment
              provider. We are committed to resolving any billing issues promptly and fairly.
            </p>
          </section>

          {/* Changes */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Changes to This Policy</h2>
            <p>
              We may update this refund policy from time to time. Any changes will be reflected on this page with
              an updated &quot;Last updated&quot; date.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Contact</h2>
            <p>
              Questions about refunds? Email us at{' '}
              <a href="mailto:jaydeepsureliya.jd@gmail.com" className="text-[#EA7B7B] hover:underline">
                jaydeepsureliya.jd@gmail.com
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
            <Link href="/terms" className="hover:text-gray-600 transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-gray-600 transition-colors">Privacy</Link>
            <Link href="/" className="hover:text-gray-600 transition-colors">&larr; Back home</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
