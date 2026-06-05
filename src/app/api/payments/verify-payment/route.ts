import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClientIp, isJsonRequest, isSameOrigin, rateLimit } from "@/lib/security";

/**
 * POST /api/payments/verify-payment
 *
 * Verifies the HMAC-SHA256 signature Razorpay sends back after a successful
 * one-time order checkout, then immediately activates Pro for 30 days.
 *
 * Request body:
 *   razorpay_payment_id  string
 *   razorpay_order_id    string
 *   razorpay_signature   string
 *   plan_name            string?  — which plan was purchased (for logging)
 *   price_rupees         number?  — amount paid
 */
export async function POST(req: Request) {
  try {
    if (!isJsonRequest(req)) {
      return NextResponse.json({ error: "Unsupported content type" }, { status: 415 });
    }
    if (!isSameOrigin(req)) {
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    }
    const ip = getClientIp(req);
    const limiter = rateLimit({ key: `verify-payment:${ip}`, limit: 20, windowMs: 60_000 });
    if (!limiter.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    // ── Auth ───────────────────────────────────────────────────
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Input ──────────────────────────────────────────────────
    const body = await req.json();
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, plan_name, price_rupees } =
      body as Record<string, unknown>;

    if (
      typeof razorpay_payment_id !== "string" || !razorpay_payment_id ||
      typeof razorpay_order_id !== "string" || !razorpay_order_id ||
      typeof razorpay_signature !== "string" || !razorpay_signature
    ) {
      return NextResponse.json(
        { error: "razorpay_payment_id, razorpay_order_id, and razorpay_signature are required." },
        { status: 400 }
      );
    }

    // ── Signature verification ─────────────────────────────────
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
    }

    // Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
    const signatureBody = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto
      .createHmac("sha256", keySecret)
      .update(signatureBody)
      .digest("hex");

    const receivedBuf = Buffer.from(razorpay_signature);
    const expectedBuf = Buffer.from(expected);
    const isValid =
      receivedBuf.length === expectedBuf.length &&
      crypto.timingSafeEqual(receivedBuf, expectedBuf);

    if (!isValid) {
      console.warn("[verify-payment] signature mismatch for order:", razorpay_order_id);
      return NextResponse.json({ error: "Payment signature verification failed." }, { status: 400 });
    }

    // ── Activate Pro for 30 days ───────────────────────────────
    // Signature is valid — grant Pro access immediately.
    // plan_expires_at = now + 30 days (manual renewal model)
    const planExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const admin = createAdminClient();
    const { error: dbError } = await admin
      .from("user_billing")
      .upsert(
        {
          user_id: user.id,
          is_pro: true,
          razorpay_subscription_status: "active",
          plan_expires_at: planExpiresAt,
          monthly_quota: 0, // 0 = unlimited
          // Log the payment for reference
          razorpay_subscription_id: razorpay_order_id, // reuse field for order_id
        },
        { onConflict: "user_id" }
      );

    if (dbError) {
      console.error("[verify-payment] db activation failed:", dbError);
      // Payment is verified but DB failed — log and still return success
      // so user isn't double-charged on retry
    }

    console.info(
      `[verify-payment] Pro activated for user ${user.id} | order ${razorpay_order_id} | plan: ${plan_name || "unknown"} | ₹${price_rupees || "?"} | expires ${planExpiresAt}`
    );

    return NextResponse.json({
      success: true,
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
      plan_expires_at: planExpiresAt,
    });
  } catch (error: unknown) {
    const e = error as Error;
    console.error("[verify-payment] unhandled error:", e);
    return NextResponse.json({ error: e.message || "Internal server error" }, { status: 500 });
  }
}

