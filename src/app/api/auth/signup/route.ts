import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getClientIp, rateLimit } from "@/lib/security";

/**
 * POST /api/auth/signup
 *
 * Creates a new user via the admin client with email_confirm=true so they
 * can sign in immediately — no confirmation email step required.
 *
 * After creating the user, signs them in via the regular client so a valid
 * session cookie is set and we can redirect to /dashboard.
 *
 * Protected by rate limiting: 5 sign-ups per IP per minute.
 */
export async function POST(req: Request) {
  // ── Rate limit ───────────────────────────────────────────────────────────
  const ip = getClientIp(req);
  const limiter = rateLimit({ key: `signup:${ip}`, limit: 5, windowMs: 60_000 });
  if (!limiter.allowed) {
    return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
  }

  // ── Parse body ───────────────────────────────────────────────────────────
  let email: string, password: string;
  try {
    const body = await req.json();
    email = (body.email ?? "").trim().toLowerCase();
    password = body.password ?? "";
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // ── Basic validation ─────────────────────────────────────────────────────
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
  }
  if (!password || password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }

  try {
    const admin = createAdminClient();

    // Create the user and auto-confirm their email so they can sign in immediately
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // ← skips the confirmation email entirely
    });

    if (createError) {
      // Surface Supabase errors clearly (e.g. "User already registered")
      return NextResponse.json(
        { error: createError.message || "Failed to create account." },
        { status: 400 }
      );
    }

    if (!created?.user) {
      return NextResponse.json({ error: "Account creation failed. Please try again." }, { status: 500 });
    }

    // Sign the user in right away so they get a session cookie
    const supabase = await createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      // Account was created but sign-in failed — tell them to log in manually
      return NextResponse.json({
        success: true,
        requiresLogin: true,
        message: "Account created! Please sign in with your new credentials.",
      });
    }

    return NextResponse.json({ success: true, requiresLogin: false });
  } catch (err: unknown) {
    const e = err as Error;
    console.error("[signup] unexpected error:", e);
    return NextResponse.json(
      { error: e.message || "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
