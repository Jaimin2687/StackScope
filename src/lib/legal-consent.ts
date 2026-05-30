import { createClient } from "@/lib/supabase/client";
import type { LegalConsentResponse } from "@/lib/types";
import { LEGAL_CONSENT_VERSION } from "@/lib/legal-consent-constants";

export async function fetchLegalConsentStatus(): Promise<boolean> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_legal_consents")
    .select("id")
    .eq("consent_version", LEGAL_CONSENT_VERSION)
    .limit(1);

  if (error) return false;
  return Array.isArray(data) && data.length > 0;
}

export async function submitLegalConsent(): Promise<LegalConsentResponse> {
  const res = await fetch("/api/legal/consent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ consent_version: LEGAL_CONSENT_VERSION }),
  });

  const payload = await res.json().catch(() => ({
    success: false,
    error: "Unexpected response from consent service.",
  }));

  if (!res.ok) {
    return {
      success: false,
      error: payload?.error || "Unable to record consent.",
    };
  }

  return payload as LegalConsentResponse;
}
