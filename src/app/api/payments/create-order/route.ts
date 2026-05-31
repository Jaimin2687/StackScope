import { NextResponse } from "next/server";
import { getRazorpay, rupeesToPaise } from "@/lib/razorpay";
import { createClient } from "@/lib/supabase/server";
import { getClientIp, isJsonRequest, isSameOrigin, rateLimit } from "@/lib/security";

/**
 * POST /api/payments/create-order
 *
 * Creates a Razorpay Order for the Standard Web Checkout modal.
 * Used by the pricing page subscription flow.
 *
 * Request body:
 *   amount   number  — Amount in whole rupees (e.g. 1499)
 *   receipt  string? — Optional human-readable receipt label
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
    const limiter = rateLimit({ key: `create-order:${ip}`, limit: 20, windowMs: 60_000 });
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
    const { amount, receipt } = body as { amount: unknown; receipt?: unknown };

    let amountPaise: number;
    try {
      amountPaise = rupeesToPaise(Number(amount));
    } catch (err: unknown) {
      return NextResponse.json({ error: (err as Error).message }, { status: 400 });
    }

    // ── Create Razorpay Order ──────────────────────────────────
    const razorpay = getRazorpay();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let order: any;
    try {
      order = await razorpay.orders.create({
        amount: amountPaise,
        currency: "INR",
        receipt: typeof receipt === "string" ? receipt.slice(0, 40) : `order-${Date.now()}`,
        notes: { user_id: user.id },
      });
    } catch (err: unknown) {
      const e = err as Record<string, unknown>;
      const msg =
        ((e?.error as Record<string, unknown>)?.description as string) ||
        (e?.message as string) ||
        "Razorpay order creation failed.";
      console.error("[create-order] Razorpay error:", e);
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    return NextResponse.json({
      order_id: order.id as string,
      amount: amountPaise,
      currency: "INR",
    });
  } catch (error: unknown) {
    const e = error as Error;
    console.error("[create-order] unhandled error:", e);
    return NextResponse.json({ error: e.message || "Internal server error" }, { status: 500 });
  }
}
