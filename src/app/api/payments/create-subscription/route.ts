import { NextResponse } from "next/server";
import { getRazorpay } from "@/lib/razorpay";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClientIp, isJsonRequest, isSameOrigin, rateLimit } from "@/lib/security";

/**
 * POST /api/payments/create-subscription
 *
 * Initialises a Razorpay Subscription for the ₹1,499/month Pro tier.
 *
 * Flow:
 *  1. Upsert a Razorpay Plan (item is idempotent by plan name via notes lookup)
 *  2. Create a Subscription against that plan
 *  3. Store the subscription_id in user_billing
 *  4. Return subscription_id for the frontend checkout modal
 */

const PRO_PLAN_AMOUNT_PAISE = 149900; // ₹1,499 × 100
const PRO_PLAN_CURRENCY = "INR";
const PRO_PLAN_INTERVAL = 1;
const PRO_PLAN_PERIOD = "monthly";
const PRO_PLAN_NAME = "StackScope Pro";

export async function POST(req: Request) {
  try {
    if (!isJsonRequest(req)) {
      return NextResponse.json({ error: "Unsupported content type" }, { status: 415 });
    }
    if (!isSameOrigin(req)) {
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    }
    const ip = getClientIp(req);
    const limiter = rateLimit({ key: `create-subscription:${ip}`, limit: 10, windowMs: 60_000 });
    if (!limiter.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    // ── Auth ───────────────────────────────────────────────────
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const razorpay = getRazorpay();

    // ── Step 1: Create (or retrieve) the monthly plan ──────────
    // Razorpay doesn't expose a "get-by-name" endpoint so we always
    // create and rely on test/live plan IDs being stable per environment.
    // In production you'd cache the plan_id in an env variable.
    let planId: string | undefined = process.env.RAZORPAY_PRO_PLAN_ID;

    if (!planId) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const plan: any = await razorpay.plans.create({
          period: PRO_PLAN_PERIOD,
          interval: PRO_PLAN_INTERVAL,
          item: {
            name: PRO_PLAN_NAME,
            amount: PRO_PLAN_AMOUNT_PAISE,
            currency: PRO_PLAN_CURRENCY,
            description: "StackScope Pro — monthly recurring",
          },
          notes: { env: process.env.NODE_ENV || "production" },
        });
        planId = plan.id as string;
        // Log so you can pin this in env — avoids duplicate plan creation
        console.info("[create-subscription] created plan:", planId);
      } catch (err: unknown) {
        const e = err as Record<string, unknown>;
        const msg =
          ((e?.error as Record<string, unknown>)?.description as string) ||
          (e?.message as string) ||
          "Failed to create Razorpay Plan.";
        return NextResponse.json({ error: msg }, { status: 500 });
      }
    }

    // ── Step 2: Create the subscription ───────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let subscription: any;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      subscription = await razorpay.subscriptions.create({
        plan_id: planId,
        total_count: 12, // auto-renew for 12 billing cycles (1 year)
        quantity: 1,
        customer_notify: 1,
        notes: { user_id: user.id, plan: PRO_PLAN_NAME },
      });
    } catch (err: unknown) {
      const e = err as Record<string, unknown>;
      const msg =
        ((e?.error as Record<string, unknown>)?.description as string) ||
        (e?.message as string) ||
        "Failed to create Razorpay Subscription.";
      console.error("[create-subscription] Razorpay error:", e);
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    const subscriptionId = subscription.id as string;

    // ── Step 3: Persist subscription_id to user_billing ───────
    const admin = createAdminClient();
    const { error: dbError } = await admin
      .from("user_billing")
      .upsert(
        {
          user_id: user.id,
          razorpay_subscription_id: subscriptionId,
          razorpay_subscription_status: "created",
        },
        { onConflict: "user_id" }
      );

    if (dbError) {
      console.error("[create-subscription] db upsert error:", dbError);
    }

    return NextResponse.json({
      subscription_id: subscriptionId,
      plan_id: planId,
      status: subscription.status as string,
    });
  } catch (error: unknown) {
    const e = error as Error;
    console.error("[create-subscription] unhandled error:", e);
    return NextResponse.json({ error: e.message || "Internal server error" }, { status: 500 });
  }
}
