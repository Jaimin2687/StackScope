import { NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/payments/webhooks/subscription
 *
 * Handles Razorpay Subscription lifecycle events:
 *  - subscription.charged     → set is_pro=true, status=active, plan_expires_at
 *  - subscription.cancelled   → reset to free tier
 *  - subscription.completed   → reset to free tier (plan ended naturally)
 *  - subscription.halted      → mark as halted (payment failed repeatedly)
 *
 * Signature verification uses RAZORPAY_WEBHOOK_SECRET (set from Razorpay Dashboard).
 */

type SubscriptionEntity = {
  id?: string;
  status?: string;
  current_end?: number; // Unix timestamp
  notes?: { user_id?: string };
};

type WebhookPayload = {
  event?: string;
  payload?: {
    subscription?: {
      entity?: SubscriptionEntity;
    };
    payment?: {
      entity?: {
        id?: string;
        amount?: number;
        notes?: { user_id?: string };
      };
    };
  };
};

function timingSafeEqual(a: string, b: string): boolean {
  try {
    const aBuf = Buffer.from(a, "utf8");
    const bBuf = Buffer.from(b, "utf8");
    if (aBuf.length !== bBuf.length) return false;
    return crypto.timingSafeEqual(aBuf, bBuf);
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      console.error("[subscription-webhook] RAZORPAY_WEBHOOK_SECRET not set");
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
    }

    // ── Signature verification — must read raw body ────────────
    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || "";
    const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");

    if (!signature || !timingSafeEqual(signature, expected)) {
      console.warn("[subscription-webhook] invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // ── Parse payload ──────────────────────────────────────────
    let payload: WebhookPayload;
    try {
      payload = JSON.parse(body) as WebhookPayload;
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const event = payload.event || "";
    const subscriptionEntity = payload.payload?.subscription?.entity;

    console.info(`[subscription-webhook] event: ${event}`);

    // ── Resolve user_id from subscription notes ────────────────
    const userId =
      subscriptionEntity?.notes?.user_id ||
      payload.payload?.payment?.entity?.notes?.user_id;

    if (!userId) {
      // Cannot link to a user — still return 200 to prevent Razorpay retries
      console.warn("[subscription-webhook] no user_id in notes for event:", event);
      return NextResponse.json({ ok: true });
    }

    const admin = createAdminClient();

    // ── Event handling ─────────────────────────────────────────
    if (event === "subscription.charged") {
      // Payment succeeded — activate Pro tier
      const currentEnd = subscriptionEntity?.current_end;
      const planExpiresAt = currentEnd
        ? new Date(currentEnd * 1000).toISOString()
        : new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString(); // +31 days fallback

      const { error } = await admin
        .from("user_billing")
        .upsert(
          {
            user_id: userId,
            is_pro: true,
            razorpay_subscription_status: "active",
            plan_expires_at: planExpiresAt,
            monthly_quota: 0, // 0 = unlimited for Pro in subscription-middleware.ts
          },
          { onConflict: "user_id" }
        );

      if (error) {
        console.error("[subscription-webhook] charged — db update failed:", error);
        return NextResponse.json({ error: "DB update failed" }, { status: 500 });
      }

      console.info(`[subscription-webhook] user ${userId} activated Pro until ${planExpiresAt}`);

    } else if (event === "subscription.cancelled" || event === "subscription.completed") {
      // Plan ended — revert to free tier
      const { error } = await admin
        .from("user_billing")
        .upsert(
          {
            user_id: userId,
            is_pro: false,
            razorpay_subscription_status: event === "subscription.cancelled" ? "cancelled" : "completed",
            plan_expires_at: null,
            monthly_quota: 3,
          },
          { onConflict: "user_id" }
        );

      if (error) {
        console.error(`[subscription-webhook] ${event} — db update failed:`, error);
        return NextResponse.json({ error: "DB update failed" }, { status: 500 });
      }

      console.info(`[subscription-webhook] user ${userId} reverted to free (${event})`);

    } else if (event === "subscription.halted") {
      // Payment failed repeatedly — flag the account without immediately removing access
      const { error } = await admin
        .from("user_billing")
        .upsert(
          {
            user_id: userId,
            razorpay_subscription_status: "halted",
          },
          { onConflict: "user_id" }
        );

      if (error) {
        console.error("[subscription-webhook] halted — db update failed:", error);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const e = error as Error;
    console.error("[subscription-webhook] unhandled error:", e);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
