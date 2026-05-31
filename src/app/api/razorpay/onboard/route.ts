import { NextResponse } from "next/server";
import { getRazorpay } from "@/lib/razorpay";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClientIp, rateLimit } from "@/lib/security";

export async function POST(req: Request) {
  try {
    // ── Rate limiting ──────────────────────────────────────────
    const ip = getClientIp(req);
    const limiter = rateLimit({ key: `onboard-freelancer:${ip}`, limit: 5, windowMs: 60_000 });
    if (!limiter.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    // ── Auth guard ─────────────────────────────────────────────
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Input validation ───────────────────────────────────────
    const body = await req.json();
    const { name, email, phone } = body as Record<string, unknown>;

    if (
      typeof name !== "string" || !name.trim() ||
      typeof email !== "string" || !email.includes("@") ||
      typeof phone !== "string"
    ) {
      return NextResponse.json(
        { error: "name, email, and phone are required." },
        { status: 400 }
      );
    }

    const normalizedPhone = phone.replace(/\s+/g, "");
    if (!/^[0-9]{8,15}$/.test(normalizedPhone)) {
      return NextResponse.json(
        { error: "Phone must be 8–15 digits with no spaces." },
        { status: 400 }
      );
    }

    // ── Razorpay: create linked account (Route) ────────────────
    const razorpay = getRazorpay();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const accountOptions: any = {
      email,
      phone: normalizedPhone,
      type: "route",
      business_type: "individual",
      legal_business_name: `${name.trim()} Freelance`,
      customer_facing_business_name: name.trim(),
      contact_name: name.trim(),
      reference_id: user.id,
      profile: {
        category: "services",
        subcategory: "freelancer",
        business_model: "Freelance software development services",
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let account: any;
    try {
      account = await razorpay.accounts.create(accountOptions);
    } catch (err: unknown) {
      const e = err as Record<string, unknown>;
      const statusCode = (e?.statusCode as number) || (e?.status as number) || 500;
      const description =
        ((e?.error as Record<string, unknown>)?.description as string) ||
        ((e?.error as Record<string, unknown>)?.message as string) ||
        (e?.message as string) ||
        "Razorpay onboarding failed.";
      const code =
        ((e?.error as Record<string, unknown>)?.code as string) ||
        ((e?.error as Record<string, unknown>)?.reason as string) ||
        (e?.code as string);
      const descLower = typeof description === "string" ? description.toLowerCase() : "";
      const hint =
        descLower.includes("route feature not enabled") ||
        descLower.includes("route") && descLower.includes("not enabled")
          ? "Razorpay Route is not enabled on your account. Go to dashboard.razorpay.com → Route, or contact Razorpay support to activate the Route/Marketplace feature."
          : descLower.includes("access denied")
          ? "Route/Partner account access is required for linked accounts. Enable Razorpay Route in your dashboard or contact Razorpay support."
          : undefined;

      return NextResponse.json({ error: description, code, hint }, { status: statusCode });
    }

    const accountId = account.id as string;

    // ── Persist to Supabase (admin client — bypasses RLS) ──────
    const admin = createAdminClient();

    // Upsert so the row definitely exists, then set the account ID
    const { error: dbError } = await admin
      .from("user_billing")
      .upsert(
        { user_id: user.id, razorpay_account_id: accountId },
        { onConflict: "user_id" }
      );

    if (dbError) {
      console.error("[onboard-freelancer] db upsert error:", dbError);
      // Non-fatal — account was created in Razorpay; log and continue
    }

    // Also mirror to auth user metadata for quick access
    await supabase.auth.updateUser({ data: { razorpay_account_id: accountId } });

    return NextResponse.json({ success: true, account_id: accountId });
  } catch (error: unknown) {
    const e = error as Error;
    console.error("[onboard-freelancer] error:", e);
    return NextResponse.json(
      { error: e.message || "Razorpay onboarding failed." },
      { status: 500 }
    );
  }
}
