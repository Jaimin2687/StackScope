import { NextResponse } from "next/server";
import { getRazorpay, rupeesToPaise, computeSplit } from "@/lib/razorpay";
import { createClient } from "@/lib/supabase/server";
import { getClientIp, isJsonRequest, isSameOrigin, rateLimit } from "@/lib/security";

/**
 * POST /api/payments/create-milestone-order
 *
 * Creates a Razorpay Order pre-configured with the 8% platform fee split.
 * The freelancer receives 92% of the milestone amount via Razorpay Route.
 *
 * Request body:
 *   amount      number   — Milestone amount in whole rupees (e.g. 50000)
 *   scopeId     string   — UUID of the client_scopes row
 *   phase       string?  — Phase label (e.g. "Kickoff / Deposit")
 */
export async function POST(req: Request) {
  try {
    // ── Guards ─────────────────────────────────────────────────
    if (!isJsonRequest(req)) {
      return NextResponse.json({ error: "Unsupported content type" }, { status: 415 });
    }
    if (!isSameOrigin(req)) {
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    }
    const ip = getClientIp(req);
    const limiter = rateLimit({ key: `create-milestone-order:${ip}`, limit: 30, windowMs: 60_000 });
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
    const { amount, scopeId, phase } = body as {
      amount: unknown;
      scopeId: unknown;
      phase?: unknown;
    };

    if (typeof amount !== "number" && typeof amount !== "string") {
      return NextResponse.json({ error: "amount is required." }, { status: 400 });
    }
    if (!scopeId || typeof scopeId !== "string") {
      return NextResponse.json({ error: "scopeId is required." }, { status: 400 });
    }

    // ── Currency math (server-side, no floats past this point) ─
    let totalPaise: number;
    try {
      totalPaise = rupeesToPaise(Number(amount));
    } catch (err: unknown) {
      return NextResponse.json({ error: (err as Error).message }, { status: 400 });
    }

    const { freelancerPaise, platformFeePaise } = computeSplit(totalPaise);

    // ── Fetch freelancer's linked Razorpay account ─────────────
    const { data: billing, error: billingError } = await supabase
      .from("user_billing")
      .select("razorpay_account_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (billingError) {
      console.error("[create-milestone-order] billing lookup:", billingError);
    }

    const freelancerAccountId = billing?.razorpay_account_id as string | undefined;

    // ── Build Razorpay order payload ───────────────────────────
    const razorpay = getRazorpay();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderOptions: any = {
      amount: totalPaise,
      currency: "INR",
      receipt: `scope-${scopeId}`.slice(0, 40), // Razorpay max 40 chars
      notes: {
        scope_id: scopeId,
        phase: phase || "Milestone",
        platform_fee_paise: platformFeePaise,
        freelancer_paise: freelancerPaise,
      },
    };

    // Only inject transfers array when a linked account exists
    if (freelancerAccountId) {
      orderOptions.transfers = [
        {
          account: freelancerAccountId,
          amount: freelancerPaise,
          currency: "INR",
          notes: { purpose: "Freelancer payout — 92% of milestone" },
          on_hold: false,
        },
      ];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let order: any;
    try {
      order = await razorpay.orders.create(orderOptions);
    } catch (err: unknown) {
      const e = err as Record<string, unknown>;
      const msg =
        ((e?.error as Record<string, unknown>)?.description as string) ||
        (e?.message as string) ||
        "Razorpay order creation failed.";
      console.error("[create-milestone-order] Razorpay error:", e);
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    const orderId = order.id as string;

    // ── Persist order_id to Supabase ───────────────────────────
    // We store it inside generated_proposal so the PDF generator and UI
    // can embed / display the order details without a separate DB column.
    const { data: scopeRow, error: scopeFetchError } = await supabase
      .from("client_scopes")
      .select("generated_proposal")
      .eq("id", scopeId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!scopeFetchError && scopeRow) {
      const proposal = (scopeRow.generated_proposal as Record<string, unknown>) || {};
      const existingPhases = Array.isArray(proposal.payment_phases)
        ? (proposal.payment_phases as unknown[])
        : [];

      const newPhase = {
        order_id: orderId,
        phase: existingPhases.length + 1,
        name: (phase as string) || "Milestone",
        amount: Number(amount),
        total_paise: totalPaise,
        freelancer_paise: freelancerPaise,
        platform_fee_paise: platformFeePaise,
        freelancer_account_id: freelancerAccountId || null,
        status: "pending",
        created_at: new Date().toISOString(),
      };

      const updatedProposal = {
        ...proposal,
        payment_phases: [...existingPhases, newPhase],
      };

      const { error: updateError } = await supabase
        .from("client_scopes")
        .update({ generated_proposal: updatedProposal })
        .eq("id", scopeId)
        .eq("user_id", user.id);

      if (updateError) {
        console.error("[create-milestone-order] scope update error:", updateError);
        // Non-fatal — order was created; log and return the order_id anyway
      }
    }

    return NextResponse.json({
      order_id: orderId,
      amount: totalPaise,
      currency: "INR",
      transfer_amount: freelancerPaise,
      platform_fee: platformFeePaise,
      has_split: !!freelancerAccountId,
    });
  } catch (error: unknown) {
    const e = error as Error;
    console.error("[create-milestone-order] unhandled error:", e);
    return NextResponse.json({ error: e.message || "Internal server error" }, { status: 500 });
  }
}
