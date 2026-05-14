"use client";

import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CheckoutClient() {
  const searchParams = useSearchParams();

  const planName = searchParams.get("plan") || "The Solo Architect";
  const price = searchParams.get("price") || "1499";
  const cycle = searchParams.get("cycle") || "monthly";

  return (
    <div className="bg-[#0a0a0a] min-h-[420px] border border-[#222] rounded-xl p-8 shadow-2xl relative text-center space-y-5">
      <h1 className="text-xl font-semibold text-white">Subscriptions are handled via Razorpay</h1>
      <p className="text-sm text-neutral-400">
        The {planName} plan ({cycle}) is activated through a Razorpay invoice. Our team will share a
        secure payment link once you confirm the plan and pricing ({price}).
      </p>
      <div className="flex items-center justify-center gap-3">
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 text-neutral-500 hover:text-white transition-colors text-sm font-medium tracking-tight"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Pricing
        </Link>
        <a
          href="/settings"
          className="inline-flex h-9 items-center justify-center rounded-md bg-white px-4 text-sm font-medium text-black shadow transition-colors hover:bg-neutral-200"
        >
          Update billing profile
        </a>
      </div>
    </div>
  );
}
