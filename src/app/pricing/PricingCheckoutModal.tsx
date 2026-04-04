"use client";

import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout
} from "@stripe/react-stripe-js";
import { Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_placeholder";
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

interface Props {
  planName: string;
  price: string;
  cycle: string;
  onClose: () => void;
}

export function PricingCheckoutModal({ planName, price, cycle, onClose }: Props) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

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
          // Fallback if the API returned a full URL
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-xl bg-white border border-neutral-200 rounded-2xl shadow-2xl overflow-hidden relative flex flex-col max-h-[85vh]"
      >
        <div className="flex items-center justify-between p-4 border-b border-neutral-100 bg-neutral-50 sticky top-0 z-10">
          <h3 className="text-lg font-semibold text-neutral-900">Subscribe to {planName}</h3>
          <button 
            onClick={onClose}
            className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200 rounded-md transition-colors"
            title="Close checkout"
            aria-label="Close checkout"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-white custom-scrollbar w-full relative">
          {error ? (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-xl text-center space-y-4 m-4">
              <p>{error}</p>
            </div>
          ) : STRIPE_PUBLISHABLE_KEY === "pk_test_placeholder" ? (
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-6 rounded-xl text-center space-y-4 max-w-md mx-auto my-12">
              <p className="font-semibold text-lg">Missing Stripe Publishable Key</p>
              <p className="text-sm text-amber-200">
                You have configured a Stripe Secret Key, but your frontend <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> is missing in <code>.env.local</code>. <br/><br/>
                Stripe requires both keys to securely mount the Embedded Checkout.
              </p>
            </div>
          ) : !clientSecret ? (
            <div className="flex flex-col items-center justify-center space-y-4 h-64 text-neutral-400">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
              <p className="text-sm font-mono tracking-tight text-white/50">Generating Secure Subscription Session...</p>
            </div>
          ) : (
            <div id="checkout" className="min-h-[400px] w-full pb-8">
              <EmbeddedCheckoutProvider
                stripe={stripePromise}
                options={{ clientSecret }}
              >
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
