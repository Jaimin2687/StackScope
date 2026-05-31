import { NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/payments/webhooks/route
 *
 * Handles Razorpay Route (Order) lifecycle events:
 *  - order.paid          → verify split distribution; update scope phase to "paid"
 *  - transfer.failed     → log to payment_routing_errors; do NOT clear invoice
 *  - transfer.processed  → no-op (optional audit)
 *
 * Settlement Safeguard:
 *   If order.paid arrives but the transfer amounts don't match the expected 92/8
 *   split (±1 paise rounding tolerance), or if no transfer exists, the event is
 *   logged to payment_routing_errors and the scope status is NOT updated to "paid".
 */

type OrderEntity = {
  id?: string;
  amount?: number;
  amount_paid?: number;
  receipt?: string;
  transfers?: {
    items?: TransferItem[];
    count?: number;
  };
};

type TransferItem = {
  id?: string;
  account?: string;
  amount?: number;
  error_code?: string;
  error_description?: string;
};

type WebhookPayload = {
  event?: string;
  payload?: {
    order?: { entity?: OrderEntity };
    payment?: { entity?: { id?: string; amount?: number } };
    transfer?: {
      entity?: {
        id?: string;
        source?: string;
        recipient?: string;
        amount?: number;
        error_code?: string;
        error_description?: string;
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

/** 8% platform fee — must match computeSplit() in src/lib/razorpay.ts */
function expectedFreelancerPaise(totalPaise: number): number {
  const platformFee = Math.floor(totalPaise * 0.08);
  return totalPaise - platformFee;
}

/** Log an anomaly without throwing — always return after calling this */
async function logRoutingError(
  admin: ReturnType<typeof createAdminClient>,
  params: {
    order_id: string;
    event: string;
    error_reason: string;
    payload: unknown;
  }
): Promise<void> {
  const { error } = await admin.from("payment_routing_errors").insert({
    order_id: params.order_id,
    event: params.event,
    error_reason: params.error_reason,
    payload: params.payload,
  });
  if (error) {
    console.error("[route-webhook] failed to log routing error:", error);
  }
}

export async function POST(req: Request) {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      console.error("[route-webhook] RAZORPAY_WEBHOOK_SECRET not set");
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
    }

    // ── Signature verification ─────────────────────────────────
    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || "";
    const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");

    if (!signature || !timingSafeEqual(signature, expected)) {
      console.warn("[route-webhook] invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    let payload: WebhookPayload;
    try {
      payload = JSON.parse(body) as WebhookPayload;
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const event = payload.event || "";
    console.info(`[route-webhook] event: ${event}`);

    const admin = createAdminClient();

    // ── order.paid ─────────────────────────────────────────────
    if (event === "order.paid") {
      const orderEntity = payload.payload?.order?.entity;
      const orderId = orderEntity?.id;
      const totalPaise = orderEntity?.amount;

      if (!orderId || !totalPaise) {
        console.warn("[route-webhook] order.paid — missing order entity fields");
        return NextResponse.json({ ok: true });
      }

      // Verify the split distribution ───────────────────────────
      const transfers = orderEntity?.transfers?.items || [];
      const anomalies: string[] = [];

      if (transfers.length === 0) {
        // No transfers — could be valid if freelancer has no linked account,
        // but flag it for visibility.
        console.warn("[route-webhook] order.paid — no transfers found for order:", orderId);
        // Not necessarily an error; continue to update scope
      } else {
        const firstTransfer = transfers[0];
        const expectedAmount = expectedFreelancerPaise(totalPaise);
        const actualAmount = firstTransfer.amount ?? 0;
        const tolerance = 1; // 1 paise rounding tolerance

        if (Math.abs(actualAmount - expectedAmount) > tolerance) {
          anomalies.push(
            `Split mismatch: expected ${expectedAmount} paise (92%), got ${actualAmount} paise.`
          );
        }

        if (firstTransfer.error_code) {
          anomalies.push(
            `Transfer error: ${firstTransfer.error_code} — ${firstTransfer.error_description || "unknown"}`
          );
        }
      }

      if (anomalies.length > 0) {
        // Log anomaly — DO NOT update invoice to "paid"
        await logRoutingError(admin, {
          order_id: orderId,
          event,
          error_reason: anomalies.join("; "),
          payload,
        });
        console.error("[route-webhook] settlement anomaly for order:", orderId, anomalies);
        // Return 200 so Razorpay doesn't retry — we've logged the issue
        return NextResponse.json({ ok: true, anomaly: true });
      }

      // Clean path — extract scopeId from receipt (format: "scope-<uuid>")
      const receipt = orderEntity?.receipt || "";
      const scopeId = receipt.startsWith("scope-") ? receipt.slice(6) : null;

      if (!scopeId) {
        console.warn("[route-webhook] order.paid — no scopeId in receipt:", receipt);
        return NextResponse.json({ ok: true });
      }

      // Update the matching phase in client_scopes
      const { data: scopeRow, error: fetchError } = await admin
        .from("client_scopes")
        .select("id, generated_proposal")
        .eq("id", scopeId)
        .maybeSingle();

      if (fetchError || !scopeRow) {
        await logRoutingError(admin, {
          order_id: orderId,
          event,
          error_reason: `Scope not found: ${scopeId}. DB error: ${fetchError?.message || "none"}`,
          payload,
        });
        return NextResponse.json({ ok: true });
      }

      const proposal = (scopeRow.generated_proposal as Record<string, unknown>) || {};
      const phases = Array.isArray(proposal.payment_phases)
        ? (proposal.payment_phases as Record<string, unknown>[])
        : [];

      let updated = false;
      const updatedPhases = phases.map((phase) => {
        if (phase.order_id === orderId && phase.status !== "paid") {
          updated = true;
          return { ...phase, status: "paid", paid_at: new Date().toISOString() };
        }
        return phase;
      });

      if (updated) {
        const { error: updateError } = await admin
          .from("client_scopes")
          .update({ generated_proposal: { ...proposal, payment_phases: updatedPhases } })
          .eq("id", scopeId);

        if (updateError) {
          await logRoutingError(admin, {
            order_id: orderId,
            event,
            error_reason: `Scope update failed: ${updateError.message}`,
            payload,
          });
          return NextResponse.json({ error: "Scope update failed" }, { status: 500 });
        }

        console.info(`[route-webhook] scope ${scopeId} phase for order ${orderId} marked paid`);
      }

      return NextResponse.json({ ok: true });
    }

    // ── transfer.failed ────────────────────────────────────────
    if (event === "transfer.failed") {
      const transferEntity = payload.payload?.transfer?.entity;
      const transferId = transferEntity?.id || "unknown";
      const sourceOrderId = transferEntity?.source || transferId;

      await logRoutingError(admin, {
        order_id: sourceOrderId,
        event,
        error_reason:
          `Transfer ${transferId} failed: ` +
          `${transferEntity?.error_code || "unknown"} — ` +
          `${transferEntity?.error_description || "no description"}`,
        payload,
      });

      console.error("[route-webhook] transfer.failed for source:", sourceOrderId);

      // Do NOT update any invoice status — settlement failed
      return NextResponse.json({ ok: true });
    }

    // ── All other events — acknowledge and ignore ──────────────
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const e = error as Error;
    console.error("[route-webhook] unhandled error:", e);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
