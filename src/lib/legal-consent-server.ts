import type { SupabaseClient } from "@supabase/supabase-js";
import { LEGAL_CONSENT_VERSION } from "@/lib/legal-consent-constants";

export async function hasUserLegalConsent(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_legal_consents")
    .select("id")
    .eq("user_id", userId)
    .eq("consent_version", LEGAL_CONSENT_VERSION)
    .limit(1);

  if (error) return false;
  return Array.isArray(data) && data.length > 0;
}
