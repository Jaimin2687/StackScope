export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold">Privacy Policy</h1>
        <p className="mt-2 text-sm text-neutral-400">Effective date: May 30, 2026</p>

        <div className="prose prose-invert mt-10 max-w-none">
          <h2>Information We Collect</h2>
          <p>
            We collect account information, project scoping inputs, SOW outputs, and transaction
            metadata needed to provide the StackScope AI platform.
          </p>

          <h2>How We Use Information</h2>
          <p>
            We use the information to generate scopes and SOWs, route payments, improve platform
            reliability, and meet compliance requirements.
          </p>

          <h2>Data Retention</h2>
          <p>
            To comply with standard financial regulatory guidelines, StackScope securely logs and
            retains transaction metadata and SOW history for up to 10 years.
          </p>

          <h2>Platform Boundary</h2>
          <p>
            StackScope AI provides technical scoping, SOW generation, and payment routing
            infrastructure only. StackScope is not a party to any contract created on the platform.
          </p>

          <h2>Sub-Merchant Responsibilities</h2>
          <p>
            Freelancers and agencies using the platform are Sub-Merchants and are solely responsible
            for all project deliverables, client refunds, and chargebacks.
          </p>

          <h2>Security</h2>
          <p>
            We implement administrative and technical safeguards to protect data. No method of
            transmission or storage is 100% secure, so we cannot guarantee absolute security.
          </p>

          <h2>Updates</h2>
          <p>
            We may update this Privacy Policy from time to time. Continued use of the platform
            constitutes acceptance of any updates.
          </p>
        </div>
      </div>
    </main>
  );
}
