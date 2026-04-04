"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout
} from "@stripe/react-stripe-js";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_placeholder";
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

export default function CheckoutClient() {
  const searchParams = useSearchParams();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const planName = searchParams.get("plan") || "The Solo Architect";
  const price = searchParams.get("price") || "1499";
  const cycle = searchParams.get("cycle") || "monthly";

  useEffect(() => {
    const makeSubscriptionCheckout = async () => {
      try {
        const res = await fetch("/api/create-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planName, price, cycle }),
        });
        
        const data = await res.json();
        
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else if (data.url) {
          // Fallback if the API returned a full URL instead of a client secret
          window.location.href = data.url;
        } else {
          setError(data.error || "Failed to initialize subscription checkout.");
        }
      } catch (e: any) {
        setError(e.message);
      }
    };

    makeSubscriptionCheckout();
  }, [planName, price, cycle]);

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-xl text-center space-y-4">
        <p>{error}</p>
        <Link href="/pricing" className="text-white hover:underline text-sm inline-flex items-center gap-1">
           <ArrowLeft className="w-3 h-3" /> Back to Pricing
        </Link>
      </div>
    );
  }

  if (STRIPE_PUBLISHABLE_KEY === "pk_test_placeholder") {
    return (
      <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-6 rounded-xl text-center space-y-4 max-w-md mx-auto mt-20">
        <p className="font-semibold text-lg">Missing Stripe Publishable Key</p>
        <p className="text-sm text-amber-200">
          You have configured a Stripe Secret Key, but your frontend <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> is missing in <code>.env.local</code>. <br/><br/>
          Stripe requires both keys to securely mount the Embedded Checkout.
        </p>
        <Link href="/pricing" className="text-white hover:underline text-sm inline-flex items-center gap-1 mt-4">
           <ArrowLeft className="w-3 h-3" /> Back to Pricing
        </Link>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 h-64 text-neutral-400">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <p className="text-sm font-mono tracking-tight text-white/50">Generating Secure Subscription Session...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#0a0a0a] min-h-[600px] border border-[#222] rounded-xl p-4 shadow-2xl relative">
      <Link href="/pricing" className="inline-flex items-center gap-2 text-neutral-500 hover:text-white transition-colors text-sm font-medium tracking-tight mb-4 ml-2 mt-2">
        <ArrowLeft className="w-4 h-4" /> Go Back
      </Link>
      <div id="checkout">
        <EmbeddedCheckoutProvider
          stripe={stripePromise}
          options={{ clientSecret }}
        >
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      </div>
    </div>
  );
}
