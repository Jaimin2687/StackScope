"use client";

import { useCallback, useState } from "react";
import { fetchLegalConsentStatus, submitLegalConsent } from "@/lib/legal-consent";
import type { LegalConsentResponse } from "@/lib/types";

export type LegalConsentStatus = "unknown" | "required" | "accepted";

type PendingAction = (() => Promise<void>) | null;

export interface LegalConsentGate {
  status: LegalConsentStatus;
  isModalOpen: boolean;
  isSubmitting: boolean;
  error: string | null;
  requireConsent: (action: () => Promise<void>) => Promise<void>;
  confirmConsent: () => Promise<void>;
  closeModal: () => void;
}

export function useLegalConsentGate(): LegalConsentGate {
  const [status, setStatus] = useState<LegalConsentStatus>("unknown");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkConsent = useCallback(async (): Promise<boolean> => {
    if (status === "accepted") return true;
    if (isChecking) return false;

    setIsChecking(true);
    const hasConsent = await fetchLegalConsentStatus();
    setStatus(hasConsent ? "accepted" : "required");
    setIsChecking(false);
    return hasConsent;
  }, [status, isChecking]);

  const requireConsent = useCallback(async (action: () => Promise<void>) => {
    setError(null);
    const hasConsent = await checkConsent();
    if (hasConsent) {
      await action();
      return;
    }
    setPendingAction(() => action);
    setIsModalOpen(true);
  }, [checkConsent]);

  const confirmConsent = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);

    const response = (await submitLegalConsent()) as LegalConsentResponse;
    if (!response?.success) {
      setIsSubmitting(false);
      setError(response?.error || "Failed to record consent.");
      return;
    }

    setStatus("accepted");
    setIsSubmitting(false);
    setIsModalOpen(false);

    const action = pendingAction;
    setPendingAction(null);
    if (action) {
      await action();
    }
  }, [pendingAction]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setPendingAction(null);
    setError(null);
  }, []);

  return {
    status,
    isModalOpen,
    isSubmitting,
    error,
    requireConsent,
    confirmConsent,
    closeModal,
  };
}
