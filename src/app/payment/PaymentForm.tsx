"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Loader2, ShieldCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/watermelon";

export const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_placeholder";
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

function CheckoutForm({ clientSecret, amount, title }: { clientSecret: string, amount: number, title: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard?payment_success=true`,
      },
    });

    if (error.type === "card_error" || error.type === "validation_error") {
      setMessage(error.message ?? "An unexpected error occurred.");
    } else {
      setMessage("An unexpected error occurred.");
    }

    setIsLoading(false);
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-[#0a0a0a] border border-[#222] rounded-xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <ShieldCheck className="w-24 h-24 text-emerald-500" />
        </div>
        
        <div className="relative z-10 space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-white to-neutral-500">
              SLA Payment Authorization
            </h2>
            <p className="text-neutral-400 text-sm">
              {decodeURIComponent(title)}
            </p>
          </div>

          <div className="p-4 bg-[#111] rounded-lg border border-[#333] flex justify-between items-center">
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Total Amount</p>
              <p className="text-3xl font-mono tracking-tight mt-1 text-emerald-400">
                ₹{(amount / 100).toLocaleString('en-IN')}
              </p>
            </div>
            <Badge tone="primary" className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-3 py-1">
              Secure Tx
            </Badge>
          </div>

          <div className="pt-2">
            <PaymentElement id="payment-element" options={{ layout: "tabs" }} />
          </div>

          <button
            disabled={isLoading || !stripe || !elements}
            id="submit"
            className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 rounded-lg text-white font-medium shadow-lg shadow-indigo-900/20 transition-all flex justify-center items-center gap-2 group"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-5 h-5 text-indigo-300 group-hover:text-white transition-colors" />
                Authorize Payment
              </>
            )}
          </button>
          {message && <div id="payment-message" className="text-red-400 text-sm text-center bg-red-400/10 py-2 px-4 border border-red-400/20 rounded-md">{message}</div>}
        </div>
      </div>
    </form>
  );
}

export default function PaymentFormWrapper() {
  const searchParams = useSearchParams();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const title = searchParams.get("title") || "Architectural Build SLA";
  const summary = searchParams.get("summary") || "";
  const price = searchParams.get("price") || "1499";

  useEffect(() => {
    // Call our new API that generates a PaymentIntent instead of a Checkout Session
    const makePaymentIntent = async () => {
      try {
        const res = await fetch("/api/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            title, 
            summary, 
            price: parseFloat(price) 
          }),
        });
        
        const data = await res.json();
        
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
          setAmount(data.amount);
        } else {
          setError(data.error || "Failed to initialize payment gateway.");
        }
      } catch (e: any) {
        setError(e.message);
      }
    };

    makePaymentIntent();
  }, [title, summary, price]);

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-xl text-center space-y-4">
        <p>{error}</p>
        <Link href="/dashboard" className="text-white hover:underline text-sm inline-flex items-center gap-1">
           <ArrowLeft className="w-3 h-3" /> Back to Dashboard
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
          Stripe requires both keys to securely mount the Payment Element.
        </p>
        <Link href="/dashboard" className="text-white hover:underline text-sm inline-flex items-center gap-1 mt-4">
           <ArrowLeft className="w-3 h-3" /> Back to Dashboard
        </Link>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 h-64 text-neutral-400">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-sm font-mono tracking-tight">Initializing Secure Gateway...</p>
      </div>
    );
  }

  const appearance = {
    theme: 'night' as const,
    variables: {
      colorPrimary: '#4f46e5',
      colorBackground: '#0a0a0a',
      colorText: '#ffffff',
      colorDanger: '#ef4444',
      fontFamily: 'system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '8px',
    },
  };

  return (
    <div className="space-y-6">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-neutral-500 hover:text-white transition-colors text-sm font-medium tracking-tight mb-2">
        <ArrowLeft className="w-4 h-4" /> Cancel & Return
      </Link>
      <Elements options={{ clientSecret, appearance }} stripe={stripePromise}>
        <CheckoutForm clientSecret={clientSecret} amount={amount} title={title} />
      </Elements>
    </div>
  );
}
