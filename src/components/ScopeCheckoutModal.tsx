"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";

export function ScopeCheckoutModal({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-xl bg-[#0a0a0a] border border-[#222] rounded-2xl shadow-2xl relative flex flex-col"
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
        <div className="p-6 text-sm text-neutral-400">
          Checkout is handled via Razorpay. Please generate a milestone link from your scope to continue.
        </div>
      </motion.div>
    </div>
  );
}
