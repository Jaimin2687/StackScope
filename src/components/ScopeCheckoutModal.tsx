"use client";

import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout
} from "@stripe/react-stripe-js";
import { Loader2, X } from "lucide-react";
import { motion } from "framer-motion";

const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_placeholder";
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

export function ScopeCheckoutModal({ title, summary, price, onClose }: { title: string, summary: string, price: string, onClose: () => void }) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  useEffect(() => {
    const makeIntent = async () => {
      try {
        const res = await fetch("/api/generate-sla", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, summary, estimates: { base_cost_inr: parseFloat(price) } }),
        });
        const data = await res.json();
        
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else if (data.url) {
          // Fallback if API returned a full URL
          window.location.href = data.url;
        } else {
          setError(data.error || "Failed to initialize payment intent.");
        }
      } catch (e: any) {
        setError(e.message);
      }
    };
    makeIntent();
  }, [title, summary, price]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-3xl bg-[#0a0a0a] border border-[#222] rounded-2xl shadow-2xl relative flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between p-4 border-b border-[#222] bg-[#050505]">
          <h3 className="text-lg font-semibold text-white">SLA Authorization ({title})</h3>
          <button 
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white hover:bg-[#222] rounded-md transition-colors"
            title="Close checkout"
            aria-label="Close checkout"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
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
              <p className="text-sm font-mono tracking-tight text-white/50">Securing environment...</p>
            </div>
          ) : (
            <div id="checkout" className="min-h-[500px]">
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
