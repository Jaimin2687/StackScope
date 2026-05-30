import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { hasUserLegalConsent } from "@/lib/legal-consent-server";

export async function POST() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hasConsent = await hasUserLegalConsent(supabase, user.id);
  if (!hasConsent) {
    return NextResponse.json({ error: "Legal consent required" }, { status: 403 });
  }

  return NextResponse.json(
    {
      error: "This SLA checkout endpoint is deprecated. Use Razorpay milestone links instead.",
    },
    { status: 410 }
  );
}
