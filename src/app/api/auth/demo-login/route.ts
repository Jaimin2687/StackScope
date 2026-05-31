import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClientIp, rateLimit } from "@/lib/security";

/**
 * POST /api/auth/demo-login
 *
 * Generates a Supabase magic-link OTP for the demo account and returns the
 * token so the client can exchange it for a real session — no password needed.
 *
 * Protected by:
 *  - Rate limiting (5 req / min per IP)
 *  - DEMO_USER_EMAIL env var must be set
 *  - Token is single-use and expires in 60 s (Supabase default)
 */
export async function POST(req: Request) {
  // ── Rate limit ───────────────────────────────────────────────────────────
  const ip = getClientIp(req);
  const limiter = rateLimit({ key: `demo-login:${ip}`, limit: 5, windowMs: 60_000 });
  if (!limiter.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // ── Guard: demo mode must be configured ─────────────────────────────────
  const demoEmail = process.env.DEMO_USER_EMAIL?.trim().toLowerCase();
  if (!demoEmail) {
    return NextResponse.json(
      { error: "Demo mode is not enabled on this deployment." },
      { status: 403 }
    );
  }

  try {
    const admin = createAdminClient();

    // Generate a one-time OTP for the demo email.
    // The admin client bypasses Supabase's email-send step and gives us the
    // token directly so we can sign in programmatically.
    const { data, error } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: demoEmail,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
      },
    });

    if (error || !data?.properties) {
      console.error("[demo-login] generateLink error:", error);
      return NextResponse.json(
        { error: "Failed to create demo session. Make sure the demo user exists in Supabase." },
        { status: 500 }
      );
    }

    // Return the hashed_token and email so the client can call
    // supabase.auth.verifyOtp({ email, token, type: 'magiclink' })
    return NextResponse.json({
      email: demoEmail,
      token: data.properties.hashed_token,
    });
  } catch (err: unknown) {
    const e = err as Error;
    console.error("[demo-login] unexpected error:", e);
    return NextResponse.json(
      { error: e.message || "Demo login failed." },
      { status: 500 }
    );
  }
}
