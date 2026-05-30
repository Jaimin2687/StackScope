import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { LEGAL_CONSENT_VERSION } from "@/lib/legal-consent-constants";
import type { LegalConsentResponse } from "@/lib/types";

export async function POST() {
  const cookieStore = await cookies();
  const headerList = await headers();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({
      success: false,
      error: "Unauthorized",
    } satisfies LegalConsentResponse, { status: 401 });
  }

  const forwarded = headerList.get("x-forwarded-for");
  const ipAddress = forwarded
    ? forwarded.split(",")[0]?.trim() || null
    : headerList.get("x-real-ip");

  const { data, error } = await supabase
    .from("user_legal_consents")
    .insert({
      user_id: user.id,
      consent_version: LEGAL_CONSENT_VERSION,
      ip_address: ipAddress,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
    } satisfies LegalConsentResponse, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    consent: data,
  } satisfies LegalConsentResponse);
}
