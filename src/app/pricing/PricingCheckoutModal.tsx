"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";

interface Props {
  planName: string;
  onClose: () => void;
}

export function PricingCheckoutModal({ planName, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-xl bg-[#0a0a0a] border border-[#222] rounded-2xl shadow-2xl overflow-hidden relative flex flex-col"
      >
        <div className="flex items-center justify-between p-4 border-b border-[#222] bg-[#050505]">
          <h3 className="text-lg font-semibold text-white">Subscribe to {planName}</h3>
          <button
            onClick={onClose}
            className="p-2 text-neutral-500 hover:text-white hover:bg-[#222] rounded-md transition-colors"
            title="Close checkout"
            aria-label="Close checkout"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 text-sm text-neutral-400">
          Subscriptions are issued through Razorpay invoices and secure payment links.
        </div>
      </motion.div>
    </div>
  );
}
