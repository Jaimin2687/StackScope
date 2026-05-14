"use client";

export default function PaymentFormWrapper() {
  return (
    <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-8 text-center space-y-4">
      <h2 className="text-xl font-semibold text-white">Razorpay Checkout</h2>
      <p className="text-sm text-neutral-400">
        Checkout is handled via Razorpay. Please generate a milestone link from your scope and share it with your client.
      </p>
      <a
        href="/dashboard"
        className="inline-flex h-9 items-center justify-center rounded-md bg-white px-4 text-sm font-medium text-black shadow transition-colors hover:bg-neutral-200"
      >
        Back to Dashboard
      </a>
    </div>
  );
}
