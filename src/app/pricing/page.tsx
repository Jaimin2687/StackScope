"use client";

import React, { useState, useCallback } from "react";
import { TopNav } from "@/components/top-nav";
import { Check, Info, ArrowRight, Zap, Target, Briefcase, Loader2, X, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Razorpay global type
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window.Razorpay !== "undefined") return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [checkoutState, setCheckoutState] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [activePlanName, setActivePlanName] = useState<string | null>(null);

  const plans = [
    {
      name: "The Lead Magnet",
      badge: "Hobby / Free",
      price: "₹0",
      priceRaw: 0,
      description:
        "Perfect for testing the waters and experiencing the speed of the StackScope Gemini pipeline.",
      features: [
        "3 Scoping Generations per month",
        "Basic text-to-scope generation",
        "Standard JSON/Markdown output",
        "Community support",
      ],
      disabledFeatures: [
        "White-labeled PDF exports",
        "Mermaid.js architecture flows",
        "1-Click Supabase deployments",
      ],
      icon: Target,
      color: "text-neutral-400",
    },
    {
      name: "The Solo Architect",
      badge: "Most Popular",
      price: billingCycle === "monthly" ? "₹1,499" : "₹14,990",
      priceRaw: billingCycle === "monthly" ? 1499 : 14990,
      period: billingCycle === "monthly" ? "/ mo" : "/ yr",
      description:
        "The sweet spot for Indian Freelancers. Buy hours of your life back for less than a weekend Swiggy budget.",
      features: [
        "Unlimited Architecture Scopes",
        "Native audio transcription for client calls",
        "1-Click Supabase Schema & RLS Deployment",
        "Auto-generated Mermaid.js flowcharts",
        "White-labeled, branded PDF exports",
        "Dynamic pricing & timeline slider",
      ],
      disabledFeatures: [],
      icon: Zap,
      color: "text-emerald-400",
      popular: true,
    },
    {
      name: "The Agency Blueprint",
      badge: "For Dev Shops",
      price: billingCycle === "monthly" ? "₹6,999" : "₹69,990",
      priceRaw: billingCycle === "monthly" ? 6999 : 69990,
      period: billingCycle === "monthly" ? "/ mo" : "/ yr",
      description:
        "Targeted at dev shops in tier-1/2 cities mapping out projects for a scalable team of developers.",
      features: [
        "Everything in Solo Architect",
        "Up to 5 Team Seats included",
        "Custom Tech Stack Enforcement (e.g., Lock to MERN)",
        "Shared workspace to track incoming leads",
        "Priority dedicated support channel",
        "API webhook access",
      ],
      disabledFeatures: [],
      icon: Briefcase,
      color: "text-indigo-400",
    },
  ];

  const handleSubscribe = useCallback(
    async (planName: string, priceRaw: number) => {
      // Free plan — go to workspace directly
      if (priceRaw === 0) {
        window.location.href = "/workspace";
        return;
      }

      setCheckoutState("loading");
      setCheckoutError(null);
      setActivePlanName(planName);

      try {
        // 1. Load Razorpay SDK
        const sdkLoaded = await loadRazorpayScript();
        if (!sdkLoaded) throw new Error("Failed to load payment gateway. Please try again.");

        // 2. Create subscription server-side
        const res = await fetch("/api/payments/create-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan: planName, cycle: billingCycle }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || "Could not initialise subscription.");
        }

        const { subscription_id } = data;

        // 3. Open Razorpay checkout
        const rzp = new window.Razorpay({
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          subscription_id,
          name: "StackScope",
          description: `${planName} — ${billingCycle}`,
          image: "/favicon.ico",
          theme: { color: "#ffffff" },
          handler: () => {
            // Payment captured — webhook will activate Pro in the background
            setCheckoutState("success");
          },
          modal: {
            ondismiss: () => {
              // User closed the modal without paying
              setCheckoutState("idle");
              setActivePlanName(null);
            },
          },
        });

        rzp.open();
        // While Razorpay modal is open, show a neutral state (not loading)
        setCheckoutState("idle");
      } catch (err: unknown) {
        const e = err as Error;
        setCheckoutError(e.message || "Payment failed. Please try again.");
        setCheckoutState("error");
      }
    },
    [billingCycle]
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-white selection:text-black pb-20">
      <TopNav />

      <main className="pt-32 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold tracking-tight mb-6"
          >
            Pricing built for the{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
              Builder.
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-neutral-400"
          >
            Whether you are closing your first client or running an agency, we
            have a plan to automate your architecture.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-3 mt-10"
          >
            <span
              className={`text-sm ${billingCycle === "monthly" ? "text-white font-medium" : "text-neutral-500"}`}
            >
              Monthly
            </span>
            <button
              onClick={() =>
                setBillingCycle((b) => (b === "monthly" ? "yearly" : "monthly"))
              }
              aria-label="Toggle billing cycle"
              className="w-12 h-6 rounded-full bg-[#222] relative flex items-center px-1 transition-colors"
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${billingCycle === "yearly" ? "translate-x-6" : "translate-x-0"}`}
              />
            </button>
            <span
              className={`text-sm ${billingCycle === "yearly" ? "text-white font-medium" : "text-neutral-500"}`}
            >
              Yearly{" "}
              <span className="text-emerald-400 text-xs ml-1 font-medium">
                (Save 16%)
              </span>
            </span>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className={`relative rounded-2xl p-8 bg-[#0a0a0a] border ${
                plan.popular
                  ? "border-emerald-500/50 shadow-[0_0_30px_-10px_rgba(16,185,129,0.2)]"
                  : "border-[#222]"
              } flex flex-col`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                  Most Popular
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-10 h-10 rounded-lg bg-[#111] border border-[#222] flex items-center justify-center ${plan.color}`}
                >
                  <plan.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{plan.name}</h3>
                  <span className="text-xs text-neutral-500 font-medium">
                    {plan.badge}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && (
                    <span className="text-neutral-500 mb-1">{plan.period}</span>
                  )}
                </div>
                <p className="text-sm text-neutral-400 mt-4 leading-relaxed h-[80px]">
                  {plan.description}
                </p>
              </div>

              {/* CTA button */}
              <button
                onClick={() => handleSubscribe(plan.name, plan.priceRaw)}
                disabled={checkoutState === "loading" && activePlanName === plan.name}
                className={`w-full py-3 rounded-lg font-medium transition-all mb-8 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-wait
                  ${
                    plan.popular
                      ? "bg-white text-black hover:bg-neutral-200"
                      : "bg-[#111] text-white border border-[#333] hover:bg-[#222]"
                  }`}
              >
                {checkoutState === "loading" && activePlanName === plan.name ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Opening checkout…
                  </>
                ) : plan.priceRaw === 0 ? (
                  "Start Free"
                ) : (
                  <>
                    Get {plan.name.split(" ").slice(-1)[0]}
                    {plan.popular && <ArrowRight className="w-4 h-4" />}
                  </>
                )}
              </button>

              <div className="space-y-4 flex-1">
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">
                  Included
                </p>
                {plan.features.map((feature) => (
                  <div key={feature} className="flex gap-3 text-sm text-neutral-300">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </div>
                ))}

                {plan.disabledFeatures.length > 0 && (
                  <>
                    <div className="h-px w-full bg-[#222] my-4" />
                    {plan.disabledFeatures.map((feature) => (
                      <div key={feature} className="flex gap-3 text-sm text-neutral-600">
                        <Info className="w-4 h-4 shrink-0 mt-0.5 opacity-50" />
                        <span className="line-through">{feature}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Success overlay ── */}
        <AnimatePresence>
          {checkoutState === "success" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-md bg-[#0a0a0a] border border-emerald-500/30 rounded-2xl shadow-2xl p-8 text-center space-y-4"
              >
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                  <Check className="w-7 h-7 text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Payment successful!</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  Your Pro subscription is being activated. It may take a moment — your
                  dashboard will reflect the upgrade within a few seconds.
                </p>
                <button
                  onClick={() => (window.location.href = "/dashboard")}
                  className="w-full py-3 rounded-lg bg-white text-black font-medium hover:bg-neutral-200 transition-colors"
                >
                  Go to Dashboard
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Error toast ── */}
        <AnimatePresence>
          {checkoutState === "error" && checkoutError && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-[#1a0a0a] border border-red-900/40 text-red-400 px-5 py-3 rounded-xl shadow-xl text-sm max-w-sm"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{checkoutError}</span>
              <button
                onClick={() => { setCheckoutState("idle"); setCheckoutError(null); }}
                className="ml-auto text-red-600 hover:text-red-400"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
