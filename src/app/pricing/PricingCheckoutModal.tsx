"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertCircle, Loader2, CreditCard } from "lucide-react";

/* ── Razorpay window type shim ─────────────────────────────── */
declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  subscription_id?: string;
  order_id?: string;
  amount?: number;
  currency?: string;
  name: string;
  description: string;
  image?: string;
  prefill?: { email?: string; contact?: string; name?: string };
  notes?: Record<string, string>;
  theme?: { color?: string };
  handler: (response: RazorpaySuccessResponse) => void;
  modal?: {
    ondismiss?: () => void;
    escape?: boolean;
    animation?: boolean;
  };
}

interface RazorpayInstance {
  open(): void;
  on(event: string, handler: (response: unknown) => void): void;
}

interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_subscription_id?: string;
  razorpay_signature: string;
}

/* ── Component types ───────────────────────────────────────── */
type CheckoutState =
  | "idle"
  | "creating"      // fetching order/subscription from backend
  | "modal-open"    // Razorpay modal is showing
  | "verifying"     // sending verification request
  | "success"
  | "error"
  | "cancelled";

interface Props {
  planName: string;
  priceRupees?: number; // e.g. 1499
  onClose: () => void;
  userEmail?: string;
}

/* ── Helpers ───────────────────────────────────────────────── */
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/* ── PricingCheckoutModal ──────────────────────────────────── */
export function PricingCheckoutModal({
  planName,
  priceRupees = 1499,
  onClose,
  userEmail,
}: Props) {
  const [state, setState] = useState<CheckoutState>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Pre-load Razorpay checkout script when modal mounts
  useEffect(() => {
    loadRazorpayScript().then(setScriptLoaded);
  }, []);

  const handlePayment = useCallback(async () => {
    if (!scriptLoaded || !window.Razorpay) {
      setErrorMessage("Payment SDK failed to load. Please refresh and try again.");
      setState("error");
      return;
    }

    setState("creating");

    // ── Step 1: Create subscription (backend) ────────────────
    let subscriptionId: string | undefined;
    let orderId: string | undefined;
    let amountPaise: number | undefined;

    try {
      const subRes = await fetch("/api/payments/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planName }),
      });

      const subData = (await subRes.json()) as Record<string, unknown>;

      if (!subRes.ok) {
        // Subscription API failed — fall back to one-time order for checkout
        console.warn("[checkout] subscription creation failed, falling back to order:", subData);

        const orderRes = await fetch("/api/payments/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: priceRupees, receipt: `${planName}-checkout` }),
        });

        const orderData = (await orderRes.json()) as Record<string, unknown>;

        if (!orderRes.ok) {
          throw new Error((orderData.error as string) || "Could not initialise checkout.");
        }

        orderId = orderData.order_id as string;
        amountPaise = orderData.amount as number;
      } else {
        subscriptionId = subData.subscription_id as string;
      }
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || "Failed to start checkout.");
      setState("error");
      return;
    }

    // ── Step 2: Open Razorpay modal ──────────────────────────
    setState("modal-open");

    const razorpayOptions: RazorpayOptions = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
      name: "StackScope",
      description: `${planName} — ₹${priceRupees}/month`,
      prefill: { email: userEmail },
      notes: { plan: planName },
      theme: { color: "#6366f1" },
      modal: {
        ondismiss: () => {
          setState("cancelled");
        },
        animation: true,
      },
      handler: async (response: RazorpaySuccessResponse) => {
        setState("verifying");

        // ── Step 3: Verify signature (backend) ──────────────
        try {
          const verifyRes = await fetch("/api/payments/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id || orderId || "",
              razorpay_signature: response.razorpay_signature,
            }),
          });

          const verifyData = (await verifyRes.json()) as Record<string, unknown>;

          if (!verifyRes.ok || !verifyData.success) {
            throw new Error(
              (verifyData.error as string) || "Payment verification failed. Contact support."
            );
          }

          setState("success");
        } catch (err: unknown) {
          setErrorMessage((err as Error).message || "Verification failed.");
          setState("error");
        }
      },
    };

    // Attach either subscription_id or order_id to the options
    if (subscriptionId) {
      razorpayOptions.subscription_id = subscriptionId;
    } else if (orderId && amountPaise) {
      razorpayOptions.order_id = orderId;
      razorpayOptions.amount = amountPaise;
      razorpayOptions.currency = "INR";
    }

    const rzp = new window.Razorpay(razorpayOptions);

    rzp.on("payment.failed", (response: unknown) => {
      const r = response as { error?: { description?: string } };
      setErrorMessage(r?.error?.description || "Payment failed. Please try again.");
      setState("error");
    });

    rzp.open();
  }, [scriptLoaded, planName, priceRupees, userEmail]);

  /* ── Render helpers ──────────────────────────────────────── */
  const isLoading = state === "creating" || state === "verifying";

  const stateConfig: Record<
    CheckoutState,
    { icon?: React.ReactNode; title: string; subtitle: string; action?: React.ReactNode }
  > = {
    idle: {
      title: `Subscribe to ${planName}`,
      subtitle: `₹${priceRupees.toLocaleString("en-IN")}/month • Billed securely via Razorpay`,
      action: (
        <button
          id="razorpay-checkout-btn"
          onClick={handlePayment}
          disabled={!scriptLoaded}
          className="w-full flex items-center justify-center gap-2 h-11 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-indigo-500/25"
        >
          <CreditCard className="w-4 h-4" />
          {scriptLoaded ? "Pay with Razorpay" : "Loading..."}
        </button>
      ),
    },
    creating: {
      icon: <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />,
      title: "Setting up checkout...",
      subtitle: "Creating a secure session with Razorpay.",
    },
    "modal-open": {
      title: "Complete payment",
      subtitle: "Finish the payment in the Razorpay window.",
    },
    verifying: {
      icon: <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />,
      title: "Verifying payment...",
      subtitle: "Please wait while we confirm your payment.",
    },
    success: {
      icon: <CheckCircle className="w-12 h-12 text-emerald-400" />,
      title: "Payment successful! 🎉",
      subtitle: "Your Pro subscription is now active. Refresh the page to see your new limits.",
      action: (
        <button
          onClick={onClose}
          className="w-full h-11 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all duration-200"
        >
          Continue to Dashboard
        </button>
      ),
    },
    error: {
      icon: <AlertCircle className="w-12 h-12 text-red-400" />,
      title: "Payment failed",
      subtitle: errorMessage || "Something went wrong. Please try again.",
      action: (
        <div className="flex flex-col gap-2 w-full">
          <button
            onClick={() => {
              setState("idle");
              setErrorMessage("");
            }}
            className="w-full h-10 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all duration-200"
          >
            Try again
          </button>
          <button
            onClick={onClose}
            className="w-full h-10 rounded-lg border border-[#333] hover:border-[#555] text-neutral-400 hover:text-white text-sm transition-all duration-200"
          >
            Cancel
          </button>
        </div>
      ),
    },
    cancelled: {
      title: "Payment cancelled",
      subtitle: "You closed the payment window. No charge was made.",
      action: (
        <div className="flex flex-col gap-2 w-full">
          <button
            onClick={() => setState("idle")}
            className="w-full h-10 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all duration-200"
          >
            Try again
          </button>
          <button
            onClick={onClose}
            className="w-full h-10 rounded-lg border border-[#333] hover:border-[#555] text-neutral-400 hover:text-white text-sm transition-all duration-200"
          >
            Maybe later
          </button>
        </div>
      ),
    },
  };

  const config = stateConfig[state];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label={`Subscribe to ${planName}`}
    >
      <AnimatePresence>
        <motion.div
          key="checkout-modal"
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="w-full max-w-md bg-[#0c0c0e] border border-[#1e1e24] rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e1e24] bg-[#0a0a0c]">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500" />
              <span className="text-sm font-medium text-neutral-300">StackScope Billing</span>
            </div>
            {state !== "verifying" && state !== "creating" && (
              <button
                onClick={onClose}
                className="p-1.5 text-neutral-500 hover:text-white hover:bg-[#1e1e24] rounded-md transition-colors"
                aria-label="Close checkout"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={state}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col items-center text-center gap-3"
              >
                {config.icon && <div className="mb-1">{config.icon}</div>}
                <h2 className="text-lg font-semibold text-white leading-tight">
                  {config.title}
                </h2>
                <p className="text-sm text-neutral-400 leading-relaxed">{config.subtitle}</p>
              </motion.div>
            </AnimatePresence>

            {/* Plan badge */}
            {(state === "idle" || state === "modal-open") && (
              <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#12121a] border border-[#1e1e2a]">
                <div>
                  <p className="text-sm font-semibold text-white">{planName}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">Billed monthly</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-indigo-400">
                    ₹{priceRupees.toLocaleString("en-IN")}
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5">/ month</p>
                </div>
              </div>
            )}

            {/* Action area */}
            {config.action && (
              <div className="pt-1">
                {config.action}
              </div>
            )}

            {isLoading && (
              <div className="flex justify-center pt-2">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-indigo-500"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-[#1e1e24] bg-[#0a0a0c] flex items-center justify-center gap-1.5">
            <svg className="w-3 h-3 text-neutral-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span className="text-xs text-neutral-600">Secured by Razorpay · PCI DSS compliant</span>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
