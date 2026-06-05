import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateBillingSnapshot } from "@/lib/billing";

/**
 * GET /api/billing/tier
 *
 * Returns the current user's billing tier so client components
 * can gate features without a full server-component render.
 *
 * Response: { tier: "free" | "pro" | "agency" }
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ tier: "free" });
    }

    const billing = await getOrCreateBillingSnapshot(supabase, user.id);
    return NextResponse.json({ tier: billing.tier });
  } catch {
    // Non-fatal — return free so the UI never crashes
    return NextResponse.json({ tier: "free" });
  }
}
