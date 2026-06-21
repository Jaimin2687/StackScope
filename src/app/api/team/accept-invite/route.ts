import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSameOrigin, isJsonRequest, rateLimit, getClientIp } from "@/lib/security";

/**
 * POST /api/team/accept-invite
 *
 * Called after an invited user successfully authenticates.
 * Matches their auth email to a pending invite, then:
 *   1. Sets user_id = their auth UID
 *   2. Sets status = 'active'
 *
 * Body: { org_id: string }
 */
export async function POST(req: NextRequest) {
  try {
    if (!isJsonRequest(req)) {
      return NextResponse.json({ error: "Unsupported content type" }, { status: 415 });
    }
    if (!isSameOrigin(req)) {
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    }

    const ip = getClientIp(req);
    const limiter = rateLimit({ key: `accept-invite:${ip}`, limit: 30, windowMs: 60_000 });
    if (!limiter.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    // ── Auth ──────────────────────────────────────────────────────────────
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { org_id } = body as { org_id?: string };

    if (!org_id || typeof org_id !== "string") {
      return NextResponse.json({ error: "org_id is required" }, { status: 400 });
    }

    const userEmail = user.email?.toLowerCase();
    if (!userEmail) {
      return NextResponse.json({ error: "User has no email address" }, { status: 400 });
    }

    const admin = createAdminClient();

    // ── Find the pending invite ───────────────────────────────────────────
    const { data: invite, error: inviteError } = await admin
      .from("organization_members")
      .select("id, status, role, org_id")
      .eq("org_id", org_id)
      .eq("email", userEmail)
      .maybeSingle();

    if (inviteError) {
      console.error("[team/accept-invite] lookup error:", inviteError);
      return NextResponse.json({ error: "Failed to look up invitation" }, { status: 500 });
    }

    if (!invite) {
      return NextResponse.json(
        { error: "No pending invitation found for your email in this organization" },
        { status: 404 }
      );
    }

    // Already active — idempotent success
    if (invite.status === "active") {
      const { data: org } = await admin
        .from("organizations")
        .select("id, name, subscription_status")
        .eq("id", org_id)
        .maybeSingle();

      return NextResponse.json({
        success: true,
        already_active: true,
        org,
        role: invite.role,
      });
    }

    if (invite.status !== "invited") {
      return NextResponse.json(
        { error: "Invitation is no longer valid" },
        { status: 409 }
      );
    }

    // ── Patch: activate the membership ────────────────────────────────────
    const { error: updateError } = await admin
      .from("organization_members")
      .update({
        user_id: user.id,
        status: "active",
      })
      .eq("id", invite.id);

    if (updateError) {
      console.error("[team/accept-invite] update error:", updateError);
      return NextResponse.json({ error: "Failed to activate membership" }, { status: 500 });
    }

    // ── Return the org details for client-side redirect ───────────────────
    const { data: org } = await admin
      .from("organizations")
      .select("id, name, subscription_status")
      .eq("id", org_id)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      org,
      role: invite.role,
      message: `You are now an active ${invite.role} of ${org?.name ?? "the organization"}`,
    });
  } catch (error: any) {
    console.error("[team/accept-invite] unhandled error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
