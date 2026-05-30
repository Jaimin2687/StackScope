"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { ShieldAlert, X } from "lucide-react";
import { useEffect, useState } from "react";

interface LegalConsentModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  error?: string | null;
}

export function LegalConsentModal({
  open,
  onClose,
  onConfirm,
  isSubmitting,
  error,
}: LegalConsentModalProps) {
  const [isConsented, setIsConsented] = useState(false);

  useEffect(() => {
    if (open) setIsConsented(false);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            className="w-full max-w-xl rounded-2xl border border-[#222] bg-[#0a0a0a] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#222] bg-[#111] px-5 py-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <ShieldAlert className="h-4 w-4 text-amber-400" />
                Liability Consent Required
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-neutral-400 transition-colors hover:text-white"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5 px-5 py-6 text-sm text-neutral-300">
              <p className="text-neutral-400">
                Before you proceed, you must review and accept the platform liability terms.
              </p>

              <div className="space-y-3 rounded-xl border border-[#222] bg-[#050505] p-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Platform Boundary</p>
                  <p className="mt-2 text-sm text-neutral-300">
                    StackScope AI provides technical scoping, Statement of Work generation, and payment routing
                    infrastructure only. StackScope is not a party to any contract created on the platform.
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Sub-Merchant Indemnification</p>
                  <p className="mt-2 text-sm text-neutral-300">
                    You are classified as a Sub-Merchant under our payment gateway framework and assume 100% legal
                    and financial responsibility for all deliverables, client refunds, and chargeback penalties.
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Data Retention</p>
                  <p className="mt-2 text-sm text-neutral-300">
                    To comply with financial regulatory guidelines, StackScope securely logs and retains
                    transaction metadata and SOW history for up to 10 years.
                  </p>
                </div>
              </div>

              <label className="flex items-start gap-3 rounded-lg border border-[#222] bg-[#0d0d0d] p-4 text-xs text-neutral-300">
                <input
                  type="checkbox"
                  checked={isConsented}
                  onChange={(e) => setIsConsented(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-[#444] bg-black text-emerald-500"
                />
                <span>
                  I explicitly agree to the StackScope Terms of Use and acknowledge that I am solely liable for all
                  client payment disputes, chargebacks, and project deliverables processed via my generated links.
                </span>
              </label>

              <div className="text-xs text-neutral-500">
                Review the full terms at{" "}
                <Link href="/terms-of-service" className="text-emerald-400 hover:text-emerald-300">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy-policy" className="text-emerald-400 hover:text-emerald-300">
                  Privacy Policy
                </Link>.
              </div>

              {error && (
                <div className="rounded-md border border-red-900/40 bg-red-950/20 px-3 py-2 text-xs text-red-300">
                  {error}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-[#222] bg-[#0b0b0b] px-5 py-4">
              <button
                type="button"
                onClick={onClose}
                className="text-xs font-medium text-neutral-400 transition-colors hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={!isConsented || isSubmitting}
                className="rounded-md bg-emerald-500 px-4 py-2 text-xs font-semibold text-black transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? "Recording Consent..." : "Confirm & Proceed"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
