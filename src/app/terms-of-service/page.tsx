export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold">Terms of Service</h1>
        <p className="mt-2 text-sm text-neutral-400">Effective date: May 30, 2026</p>

        <div className="prose prose-invert mt-10 max-w-none">
          <h2>Acceptance of Terms</h2>
          <p>
            By accessing or using StackScope AI, you agree to these Terms of Service. If you do not
            agree, do not use the platform.
          </p>

          <h2>Platform Boundary</h2>
          <p>
            StackScope AI provides technical scoping, Statement of Work (SOW) generation, and payment
            routing infrastructure only. StackScope is not a party to any contract or engagement
            created on the platform and does not provide project delivery services.
          </p>

          <h2>Sub-Merchant Indemnification</h2>
          <p>
            Freelancers and agencies using the platform are classified as Sub-Merchants under our
            payment gateway framework. You assume 100% legal and financial responsibility for all
            project outcomes, client refunds, and chargeback penalties. You agree to indemnify and
            hold StackScope harmless from all claims, disputes, or liabilities arising from your
            services or client interactions.
          </p>

          <h2>Payment Disputes and Chargebacks</h2>
          <p>
            All payment disputes, chargebacks, and refund obligations are strictly between the
            Client and the Developer. StackScope does not mediate, adjudicate, or assume liability
            for any payment-related issues.
          </p>

          <h2>Data Retention</h2>
          <p>
            To comply with standard financial regulatory guidelines, StackScope securely logs and
            retains transaction metadata and SOW history for up to 10 years.
          </p>

          <h2>Limitation of Liability</h2>
          <p>
            StackScope provides the platform on an "as-is" and "as-available" basis. To the maximum
            extent permitted by law, StackScope disclaims all warranties and is not liable for any
            indirect, incidental, special, consequential, or punitive damages.
          </p>

          <h2>Changes to These Terms</h2>
          <p>
            We may update these Terms of Service from time to time. Continued use of the platform
            constitutes acceptance of any updates.
          </p>
        </div>
      </div>
    </main>
  );
}
