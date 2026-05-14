import { NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

type WebhookPayload = {
  event?: string;
  payload?: {
    payment_link?: {
      entity?: {
        id?: string;
        status?: string;
      };
    };
  };
};

function timingSafeEqual(a: string, b: string) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function mapPaymentStatus(event?: string, linkStatus?: string) {
  const normalizedEvent = (event || "").toLowerCase();
  const normalizedStatus = (linkStatus || "").toLowerCase();

  if (normalizedEvent === "payment_link.paid" || normalizedStatus === "paid") {
    return "paid";
  }

  if (
    ["payment_link.failed", "payment_link.cancelled", "payment_link.expired"].includes(normalizedEvent) ||
    ["failed", "cancelled", "expired"].includes(normalizedStatus)
  ) {
    return "failed";
  }

  return null;
}

export async function POST(req: Request) {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
    }

    const signature = req.headers.get("x-razorpay-signature") || "";
    const body = await req.text();
    const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");

    if (!signature || !timingSafeEqual(signature, expected)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(body) as WebhookPayload;
    const linkEntity = payload.payload?.payment_link?.entity;
    const linkId = linkEntity?.id;
    const newStatus = mapPaymentStatus(payload.event, linkEntity?.status);

    if (!linkId || !newStatus) {
      return NextResponse.json({ ok: true });
    }

    const admin = createAdminClient();
    const { data: scopeRow, error: scopeError } = await admin
      .from("client_scopes")
      .select("id, generated_proposal")
      .contains("generated_proposal", { payment_phases: [{ pl_id: linkId }] })
      .maybeSingle();

    if (scopeError) {
      console.error("[razorpay-webhook] lookup failed:", scopeError);
      return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
    }

    if (!scopeRow?.generated_proposal) {
      return NextResponse.json({ ok: true });
    }

    const proposal = scopeRow.generated_proposal as any;
    const phases = Array.isArray(proposal.payment_phases) ? proposal.payment_phases : [];

    let updated = false;
    const updatedPhases = phases.map((phase: any) => {
      const phaseLinkId = phase?.pl_id || phase?.id;
      if (phaseLinkId === linkId && phase.status !== newStatus) {
        updated = true;
        return { ...phase, status: newStatus };
      }
      return phase;
    });

    if (!updated) {
      return NextResponse.json({ ok: true });
    }

    const latestPhase = updatedPhases[updatedPhases.length - 1];
    const overallStatus = latestPhase?.status || proposal.payment_status || "pending";
    const updatedProposal = {
      ...proposal,
      payment_phases: updatedPhases,
      payment_status: overallStatus,
    };

    const { error: updateError } = await admin
      .from("client_scopes")
      .update({ generated_proposal: updatedProposal })
      .eq("id", scopeRow.id);

    if (updateError) {
      console.error("[razorpay-webhook] update failed:", updateError);
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("[razorpay-webhook] error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
